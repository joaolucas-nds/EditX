/**
 * SelectionManager.ts
 *
 * As alças de seleção sobre o canvas (DEC-021, DEC-023, DEC-024): um `Rect` transparente por
 * frame selecionável, que o Fabric deixa clicar, arrastar e redimensionar. O conteúdo do frame
 * (texto, imagem, forma) nunca é interativo: ao MOVER, ele acompanha a alça; ao REDIMENSIONAR,
 * só a alça muda até soltar. Vários frames (Shift+clique, retângulo no vazio ou `setSelected`
 * com vários ids) viram uma `ActiveSelection` do Fabric que só MOVE. Ao soltar, avisa quem está
 * em cima (o `CanvasView`), que converte as caixas em `transform` e grava no documento. A seleção
 * mora no `selectionStore`: aqui ela só é mostrada (`setSelected`) e o resultado de cada gesto é
 * repassado (`onSelect`). Vive dentro do `CanvasEngine`, que é quem tem o canvas e o conteúdo.
 */

import { ActiveSelection, Rect } from 'fabric';
import type { Canvas, FabricObject } from 'fabric';
import type { DrawRect } from '../text/TextDrawing';
import { visibleControls } from './SelectionGeometry';
import type { SelectableFrame } from './SelectionGeometry';

/** Cor da borda e dos cantos da seleção. */
const SELECTION_COLOR = '#1A73E8';
/** Tamanhos dos controles em px CSS; multiplicados pelo `pixelRatio` (o canvas trabalha em px do dispositivo, FIX-002). */
const CORNER_SIZE = 10;
const TOUCH_CORNER_SIZE = 24;
const BORDER_WIDTH = 1;

/** Um frame que mudou num gesto: a caixa de partida e a final (px CSS do mundo). */
export interface FrameChange {
  frameId: string;
  base: DrawRect;
  next: DrawRect;
}

export interface SelectionCallbacks {
  /** Resultado de um gesto do usuário: os frames selecionados agora (vazio = nenhum). */
  onSelect?(frameIds: string[]): void;
  /** O usuário soltou um arraste: cada frame do gesto, com a caixa de partida e a final. */
  onFramesChange?(changes: FrameChange[]): void;
}

interface Handle {
  rect: Rect;
  /** O frame como o documento o tem agora; `frame.rect` é a caixa de partida do arraste. */
  frame: SelectableFrame;
  /** Posição da alça NO MUNDO no último `object:moving` — o conteúdo anda a diferença. */
  last: { left: number; top: number };
  /** Quanto o conteúdo já andou desde a última `place` (para `resetFrames` desfazer). */
  moved: { x: number; y: number };
}

export class SelectionManager {
  private readonly canvas: Canvas;
  private readonly contentOf: (frameId: string) => readonly FabricObject[];
  private readonly callbacks: SelectionCallbacks;
  private readonly handles = new Map<string, Handle>();
  private readonly owners = new WeakMap<FabricObject, string>();
  private pixelRatio = 1;

  /**
   * @param canvas - o canvas do `CanvasEngine` (com `selection: true`: Shift+clique e retângulo)
   * @param contentOf - os objetos de conteúdo (texto, imagem, forma) do frame, na hora da chamada
   * @param callbacks - para onde vão o resultado dos gestos e o fim do arraste
   */
  constructor(
    canvas: Canvas,
    contentOf: (frameId: string) => readonly FabricObject[],
    callbacks: SelectionCallbacks,
  ) {
    this.canvas = canvas;
    this.contentOf = contentOf;
    this.callbacks = callbacks;
    // O GESTO decide a seleção: o `mouse:down` dispara depois de o Fabric juntar ou tirar o
    // clicado, e o retângulo se resolve antes do `mouse:up` (fabric 6.9.1). Os eventos
    // `selection:*` NÃO são usados: eles também disparam quando o próprio código troca o objeto
    // ativo, ou remove uma alça ativa.
    canvas.on('mouse:down', () => this.reportSelection());
    canvas.on('mouse:up', () => this.reportSelection());
    canvas.on('object:moving', ({ target }) => this.follow(target));
    // Só dispara quando houve ação (fabric 6.9.1, `_finalizeCurrentTransform`): clique sem
    // arraste não chega aqui.
    canvas.on('object:modified', ({ target }) => this.release(target));
  }

  /**
   * Troca as alças pelas destes frames, na ordem dada (o último fica por cima no clique).
   * Alça de frame que continua é ATUALIZADA, nunca removida e recriada: remover o objeto ativo
   * faz o Fabric limpar a seleção (`selection:cleared`, fabric 6.9.1).
   */
  setFrames(frames: readonly SelectableFrame[]): void {
    this.withGroupReleased(() => {
      const keep = new Set(frames.map((frame) => frame.frameId));
      for (const [frameId, handle] of this.handles) {
        if (keep.has(frameId)) continue;
        this.canvas.remove(handle.rect);
        this.handles.delete(frameId);
      }
      for (const frame of frames) {
        const handle = this.handles.get(frame.frameId) ?? this.create(frame);
        handle.frame = frame;
        handle.rect.setControlsVisibility(visibleControls(frame.axes));
        this.place(handle);
        // Reordena SEM remover: `bringObjectToFront` não dispara `selection:cleared`.
        this.canvas.bringObjectToFront(handle.rect);
      }
    });
    this.canvas.requestRenderAll();
  }

  /**
   * Troca a caixa de partida destes frames pela do desenho — o texto que cresce chega depois,
   * com a caixa final (depois do grow e da âncora). Frame sem alça (travado) é ignorado.
   */
  updateBases(rects: ReadonlyMap<string, DrawRect>): void {
    this.withGroupReleased(() => {
      for (const [frameId, rect] of rects) {
        const handle = this.handles.get(frameId);
        if (handle === undefined) continue;
        handle.frame = { ...handle.frame, rect };
        this.place(handle);
      }
    });
    this.canvas.requestRenderAll();
  }

  /** As caixas de partida destes frames (px CSS do mundo) — as que as ações do editor usam. */
  baseRects(frameIds: readonly string[]): Map<string, DrawRect> {
    const rects = new Map<string, DrawRect>();
    for (const frameId of frameIds) {
      const handle = this.handles.get(frameId);
      if (handle !== undefined) rects.set(frameId, handle.frame.rect);
    }
    return rects;
  }

  /**
   * Mostra estes frames como selecionados (nenhum, um, ou vários num grupo). Não avisa
   * `onSelect`: quem chama já sabe. Frame sem alça é ignorado.
   */
  setSelected(frameIds: readonly string[]): void {
    const rects = frameIds
      .map((frameId) => this.handles.get(frameId)?.rect)
      .filter((rect): rect is Rect => rect !== undefined);
    const active = this.canvas.getActiveObject();
    if (rects.length === 0) {
      if (active !== undefined) this.canvas.discardActiveObject();
    } else if (rects.length === 1) {
      if (active !== rects[0]) this.canvas.setActiveObject(rects[0]);
    } else if (!(active instanceof ActiveSelection) || !sameMembers(active, rects)) {
      if (active !== undefined) this.canvas.discardActiveObject();
      const group = new ActiveSelection(rects, { canvas: this.canvas });
      this.styleGroup(group);
      this.canvas.setActiveObject(group);
    }
    this.canvas.requestRenderAll();
  }

  /**
   * Devolve as alças e o conteúdo destes frames ao que o documento diz — para o arraste que,
   * depois do arredondamento, não mudou nada (e por isso não vai redesenhar a página).
   */
  resetFrames(frameIds: readonly string[]): void {
    this.withGroupReleased(() => {
      for (const frameId of frameIds) {
        const handle = this.handles.get(frameId);
        if (handle === undefined) continue;
        this.shiftContent(frameId, -handle.moved.x, -handle.moved.y);
        this.place(handle);
      }
    });
    this.canvas.requestRenderAll();
  }

  /** Ajusta o tamanho dos controles ao `pixelRatio` novo (px do dispositivo por px CSS). */
  setPixelRatio(pixelRatio: number): void {
    this.pixelRatio = pixelRatio;
    for (const handle of this.handles.values()) handle.rect.set(this.controlSizes());
    // O retângulo de seleção também é desenhado em px do canvas.
    this.canvas.selectionLineWidth = BORDER_WIDTH * pixelRatio;
    const active = this.canvas.getActiveObject();
    if (active instanceof ActiveSelection) this.styleGroup(active);
    this.canvas.requestRenderAll();
  }

  private create(frame: SelectableFrame): Handle {
    const rect = new Rect({
      originX: 'left',
      originY: 'top',
      fill: 'transparent',
      strokeWidth: 0,
      lockRotation: true,
      lockScalingFlip: true,
      borderColor: SELECTION_COLOR,
      cornerColor: SELECTION_COLOR,
      cornerStrokeColor: '#FFFFFF',
      transparentCorners: false,
      hoverCursor: 'move',
      objectCaching: false,
      ...this.controlSizes(),
    });
    const handle: Handle = { rect, frame, last: { left: 0, top: 0 }, moved: { x: 0, y: 0 } };
    this.owners.set(rect, frame.frameId);
    this.handles.set(frame.frameId, handle);
    this.canvas.add(rect);
    return handle;
  }

  /**
   * Põe a alça na caixa de partida, sem escala, e zera o que o conteúdo andou. Só com a alça
   * FORA de um grupo: dentro, `left`/`top` são relativos a ele (`_enterGroup`, fabric 6.9.1) —
   * quem chama passa por `withGroupReleased`.
   */
  private place(handle: Handle): void {
    const { left, top, width, height } = handle.frame.rect;
    handle.rect.set({ left, top, width, height, scaleX: 1, scaleY: 1 });
    handle.rect.setCoords();
    handle.last = { left, top };
    handle.moved = { x: 0, y: 0 };
  }

  /**
   * Desfaz o grupo ativo (os membros voltam ao mundo), roda `change` e remonta o grupo com os
   * mesmos frames que ainda tiverem alça. Sem grupo ativo, só roda `change`.
   */
  private withGroupReleased(change: () => void): void {
    const active = this.canvas.getActiveObject();
    if (!(active instanceof ActiveSelection)) {
      change();
      return;
    }
    const frameIds = this.idsOf(active.getObjects());
    this.canvas.discardActiveObject();
    change();
    this.setSelected(frameIds);
  }

  /** Repassa a seleção que o gesto deixou no Fabric; um grupo novo do Fabric ganha o estilo daqui. */
  private reportSelection(): void {
    const active = this.canvas.getActiveObject();
    if (active instanceof ActiveSelection) this.styleGroup(active);
    this.callbacks.onSelect?.(this.idsOf(this.canvas.getActiveObjects()));
  }

  /** O grupo só MOVE (DEC-024): sem alças de redimensionar nem de girar; borda da cor da seleção. */
  private styleGroup(group: ActiveSelection): void {
    group.set({
      hasControls: false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      borderColor: SELECTION_COLOR,
      borderScaleFactor: BORDER_WIDTH * this.pixelRatio,
      padding: 0,
      hoverCursor: 'move',
    });
  }

  private controlSizes(): {
    cornerSize: number;
    touchCornerSize: number;
    borderScaleFactor: number;
    padding: number;
  } {
    return {
      cornerSize: CORNER_SIZE * this.pixelRatio,
      touchCornerSize: TOUCH_CORNER_SIZE * this.pixelRatio,
      borderScaleFactor: BORDER_WIDTH * this.pixelRatio,
      padding: 0,
    };
  }

  /** Os ids dos frames destas alças, na mesma ordem (o que não é alça fica de fora). */
  private idsOf(objects: readonly FabricObject[]): string[] {
    return objects
      .map((object) => this.owners.get(object))
      .filter((frameId): frameId is string => frameId !== undefined);
  }

  /** As alças movidas por este alvo (ela mesma, ou os membros do grupo), com o canto no mundo. */
  private movedBy(
    target: FabricObject,
  ): { handle: Handle; frameId: string; left: number; top: number }[] {
    const members = target instanceof ActiveSelection ? target.getObjects() : [target];
    const moved = [];
    for (const object of members) {
      const frameId = this.owners.get(object);
      const handle = frameId === undefined ? undefined : this.handles.get(frameId);
      if (frameId === undefined || handle === undefined) continue;
      // Fora de grupo, `left`/`top` já são do mundo; dentro, só `getCoords()` (que aplica a
      // matriz do grupo) dá o canto no mundo.
      const corner =
        object.group === undefined ? { x: object.left, y: object.top } : object.getCoords()[0];
      moved.push({ handle, frameId, left: corner.x, top: corner.y });
    }
    return moved;
  }

  /** Durante o arraste de MOVER: o conteúdo de cada alça anda o mesmo que ela andou desde o último evento. */
  private follow(target: FabricObject): void {
    for (const { handle, frameId, left, top } of this.movedBy(target)) {
      const dx = left - handle.last.left;
      const dy = top - handle.last.top;
      if (dx === 0 && dy === 0) continue;
      this.shiftContent(frameId, dx, dy);
      handle.last = { left, top };
      handle.moved = { x: handle.moved.x + dx, y: handle.moved.y + dy };
    }
  }

  /**
   * Ao soltar (mover ou redimensionar): a escala de uma alça sozinha vira largura/altura, e quem
   * está em cima recebe a caixa de partida e a final de cada frame do gesto — numa chamada só,
   * para virar UMA entrada de desfazer. O grupo não escala (`styleGroup`).
   */
  private release(target: FabricObject): void {
    if (!(target instanceof ActiveSelection)) {
      const width = target.width * target.scaleX;
      const height = target.height * target.scaleY;
      target.set({ width, height, scaleX: 1, scaleY: 1 });
      target.setCoords();
    }
    const changes: FrameChange[] = [];
    for (const { handle, frameId, left, top } of this.movedBy(target)) {
      handle.last = { left, top };
      changes.push({
        frameId,
        base: handle.frame.rect,
        next: { left, top, width: handle.rect.width, height: handle.rect.height },
      });
    }
    if (changes.length > 0) this.callbacks.onFramesChange?.(changes);
  }

  /**
   * Desloca os objetos de conteúdo do frame — e os recortes deles, que são `absolutePositioned`
   * e não acompanham sozinhos. Objeto com recorte absoluto já redesenha a cada quadro (cache
   * sempre sujo, fabric 6.9.1), então não precisa de `dirty`.
   */
  private shiftContent(frameId: string, dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    // `object`: o `clipPath` do Fabric tem um tipo mais estreito que `FabricObject`.
    const shifted = new Set<object>();
    for (const object of this.contentOf(frameId)) {
      object.set({ left: object.left + dx, top: object.top + dy });
      const clip = object.clipPath;
      if (clip !== undefined && !shifted.has(clip)) {
        clip.set({ left: clip.left + dx, top: clip.top + dy });
        shifted.add(clip);
      }
    }
  }
}

/** O grupo tem exatamente estas alças (em qualquer ordem). */
function sameMembers(group: ActiveSelection, rects: readonly Rect[]): boolean {
  const members = group.getObjects();
  return members.length === rects.length && rects.every((rect) => members.includes(rect));
}
