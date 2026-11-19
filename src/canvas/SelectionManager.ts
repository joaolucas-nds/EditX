/**
 * SelectionManager.ts
 *
 * As alças de seleção sobre o canvas (DEC-021, DEC-023): um `Rect` transparente por frame
 * selecionável, que o Fabric deixa clicar, arrastar e redimensionar. O conteúdo do frame
 * (texto, imagem, forma) nunca é interativo: ao MOVER, ele acompanha a alça; ao REDIMENSIONAR,
 * só a alça muda até soltar. Ao soltar, avisa quem está em cima (o `CanvasView`), que converte
 * a caixa em `transform` e grava no documento. A seleção mora no `selectionStore`: aqui ela só
 * é mostrada (`setSelected`) e o clique é repassado (`onSelect`). Vive dentro do
 * `CanvasEngine`, que é quem tem o canvas e o conteúdo de cada frame.
 */

import { Rect } from 'fabric';
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

export interface SelectionCallbacks {
  /** O usuário clicou: no frame `frameId`, ou fora de qualquer frame selecionável (`null`). */
  onSelect?(frameId: string | null): void;
  /** O usuário soltou um arraste: a alça saiu de `base` e parou em `next` (px CSS do mundo). */
  onFrameChange?(frameId: string, base: DrawRect, next: DrawRect): void;
}

interface Handle {
  rect: Rect;
  /** O frame como o documento o tem agora; `frame.rect` é a caixa de partida do arraste. */
  frame: SelectableFrame;
  /** Posição da alça no último `object:moving` — o conteúdo anda a diferença. */
  last: { left: number; top: number };
  /** Quanto o conteúdo já andou desde a última `place` (para `resetFrame` desfazer). */
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
   * @param canvas - o canvas do `CanvasEngine`
   * @param contentOf - os objetos de conteúdo (texto, imagem, forma) do frame, na hora da chamada
   * @param callbacks - para onde vão o clique e o fim do arraste
   */
  constructor(
    canvas: Canvas,
    contentOf: (frameId: string) => readonly FabricObject[],
    callbacks: SelectionCallbacks,
  ) {
    this.canvas = canvas;
    this.contentOf = contentOf;
    this.callbacks = callbacks;
    // O clique decide a seleção. Os eventos `selection:*` do Fabric NÃO são usados: eles também
    // disparam quando o próprio código troca o objeto ativo, ou remove uma alça ativa.
    canvas.on('mouse:down', ({ target }) => {
      const frameId = target === undefined ? undefined : this.owners.get(target);
      this.callbacks.onSelect?.(frameId ?? null);
    });
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
    this.canvas.requestRenderAll();
  }

  /**
   * Troca a caixa de partida de um frame pela do desenho — o texto que cresce chega depois,
   * com a caixa final (depois do grow e da âncora). Frame sem alça (travado) é ignorado.
   */
  updateBase(frameId: string, rect: DrawRect): void {
    const handle = this.handles.get(frameId);
    if (handle === undefined) return;
    handle.frame = { ...handle.frame, rect };
    this.place(handle);
    this.canvas.requestRenderAll();
  }

  /** Mostra este frame como selecionado (ou nenhum). Não avisa `onSelect`: quem chama já sabe. */
  setSelected(frameId: string | null): void {
    const handle = frameId === null ? undefined : this.handles.get(frameId);
    const active = this.canvas.getActiveObject();
    if (handle === undefined) {
      if (active !== undefined) this.canvas.discardActiveObject();
    } else if (active !== handle.rect) {
      this.canvas.setActiveObject(handle.rect);
    }
    this.canvas.requestRenderAll();
  }

  /**
   * Devolve a alça e o conteúdo do frame ao que o documento diz — para o arraste que, depois
   * do arredondamento, não mudou nada (e por isso não vai redesenhar a página).
   */
  resetFrame(frameId: string): void {
    const handle = this.handles.get(frameId);
    if (handle === undefined) return;
    this.shiftContent(frameId, -handle.moved.x, -handle.moved.y);
    this.place(handle);
    this.canvas.requestRenderAll();
  }

  /** Ajusta o tamanho dos controles ao `pixelRatio` novo (px do dispositivo por px CSS). */
  setPixelRatio(pixelRatio: number): void {
    this.pixelRatio = pixelRatio;
    for (const handle of this.handles.values()) handle.rect.set(this.controlSizes());
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

  /** Põe a alça na caixa de partida, sem escala, e zera o que o conteúdo andou. */
  private place(handle: Handle): void {
    const { left, top, width, height } = handle.frame.rect;
    handle.rect.set({ left, top, width, height, scaleX: 1, scaleY: 1 });
    handle.rect.setCoords();
    handle.last = { left, top };
    handle.moved = { x: 0, y: 0 };
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

  /** Durante o arraste de MOVER: o conteúdo anda o mesmo que a alça andou desde o último evento. */
  private follow(target: FabricObject): void {
    const frameId = this.owners.get(target);
    const handle = frameId === undefined ? undefined : this.handles.get(frameId);
    if (frameId === undefined || handle === undefined) return;
    const dx = target.left - handle.last.left;
    const dy = target.top - handle.last.top;
    if (dx === 0 && dy === 0) return;
    this.shiftContent(frameId, dx, dy);
    handle.last = { left: target.left, top: target.top };
    handle.moved = { x: handle.moved.x + dx, y: handle.moved.y + dy };
  }

  /**
   * Ao soltar (mover ou redimensionar): a escala da alça vira largura/altura, e quem está em
   * cima recebe a caixa de partida e a final.
   */
  private release(target: FabricObject): void {
    const frameId = this.owners.get(target);
    const handle = frameId === undefined ? undefined : this.handles.get(frameId);
    if (frameId === undefined || handle === undefined) return;
    const width = target.width * target.scaleX;
    const height = target.height * target.scaleY;
    target.set({ width, height, scaleX: 1, scaleY: 1 });
    target.setCoords();
    handle.last = { left: target.left, top: target.top };
    this.callbacks.onFrameChange?.(frameId, handle.frame.rect, {
      left: target.left,
      top: target.top,
      width,
      height,
    });
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
