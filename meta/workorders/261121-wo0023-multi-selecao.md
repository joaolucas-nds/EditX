# WO 0023 — Multi-seleção: Shift+clique, retângulo e Ctrl+A, grupo que move, alinhar e distribuir, setas (DEC-024)

> **Tipo:** mista — CÓDIGO (seleção em grupo no Fabric, ações do editor, fusão no histórico, testes) + DOC (registro nos `meta/` e no log).
> **Config sugerida:** Opus · `/effort` alto — mexe na seleção, nos stores e no host ao mesmo tempo.
> **Pré-requisito:** escrita sobre `da3aec1` (`refactor(canvas): extrai a conversao desenho para objeto do Fabric`), já em `origin/main`; árvore limpa exceto os arquivos do chat (lista abaixo) e esta WO. 190 testes verdes (relatório da wo0022).
> **Base:** `meta/analises/261119-ANALISE-multi-selecao-alinhamento.md`, decidida pelo dono em 2026-11-20 (as quatro recomendações) → DEC-024, já registrada pela wo0022. Esta WO só aplica.
> **Depende de:** wo0022 (aplicada: `da3aec1`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar; diferente = PARE e reporte):
> - `7f927abd7b3efc4f4d96e6457929725e08313545  meta/CONTEXT.md`
> - `8a05650e808b9a21927a2bf203035224a964620d  logs/2026-11-21.md` (novo, `??`; você acrescenta a sua seção no fim — o hash vale só ANTES disso)
> **Arquivos substituídos inteiros** (Edições 1–9) — `sha1sum` de ANTES, medido pelo chat no disco sobre `da3aec1`:

> - `ce8c3ad52fffd05449f7600563c1327484142cc3  src/canvas/SelectionManager.ts`
> - `a76670528213b2cf7a0a633bf4ac7d647e9ccf16  src/canvas/CanvasEngine.ts`
> - `9b336d3f0980e8fd024234bedf5956e6faa77021  src/ui/CanvasView.tsx`
> - `79c53fe5d3f844f7a09c12af3b26f0b4877e860b  src/ui/EditorShortcuts.ts`
> - `dc46e5d55039dc120db5fdea1f8cef613cb25a78  src/App.tsx`
> - `724b9aed88e365704353635a350c270e6b4eea71  src/store/historyStore.ts`
> - `30b6a6f88fe7742ec532f05b3ea91ece2b40df21  src/store/documentStore.ts`
> - `2fe6af72d1f3da0b00c0bd7b37648b2f77b3e2db  src/store/documentStore.test.ts`
> - `80d433d410cfb1f47afdd988639e7ed84f8f3aa0  src/ui/EditorShortcuts.test.ts`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte** — nunca chute um lugar próximo.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo a forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório. Arquivo novo que já existe: **PARE**. Arquivo substituído cujo `sha1sum` não é o de antes nem o do texto novo: **PARE**.
> **Âncoras lidas em** (pelo chat, 2026-11-21, no disco, neste turno, sobre `da3aec1`; recortadas por script e conferidas como ocorrência única): os nove arquivos substituídos, inteiros (hashes acima); `meta/STATUS.md` — a linha inteira «- **Seleção, mover e redimensionar no canvas** …», a linha «*Nada em progresso — …*», as linhas do backlog da multi-seleção e da UI mínima, e o bloco de «**Onde parou:** wo0020 aplicada e conferida pelo chat (wo0021) …» até o rodapé; `meta/ROADMAP.md` — a linha da multi-seleção; `meta/CHANGELOG.md` — a linha inteira «- Seleção no canvas — …»; `meta/IDEAS.md` — o item «Contorno ao passar o mouse» (2 linhas).
> **Medido pelo chat** (2026-11-21, `node_modules/fabric/dist/index.mjs`, fabric 6.9.1): `handleMultiSelection` exige `this.selection`; o `mouse:down` dispara depois dele; o retângulo (`handleSelection`) se resolve no `mouseup` antes do `mouse:up`; `collectObjects` só pega objetos `selectable` (o conteúdo e a página não são); `_enterGroup` aplica a inversa da matriz do grupo (posição do membro relativa ao grupo) e `_exitGroup` devolve ao mundo; `getCoords()` aplica a matriz do grupo ao membro; em `findTarget`, com dois ou mais ativos e o ponteiro sobre o grupo, o alvo é o grupo (o arraste pega o grupo inteiro, com `preserveObjectStacking` ligado ou não).
> **Simulado pelo chat:** as edições aplicadas numa cópia do repositório a partir do texto DESTA WO (duas passadas, a segunda pulando todas); `tsc -p tsconfig.app.json --noEmit`, ESLint no repositório, `prettier --check` nos arquivos de código, e os testes NOVOS e os dos arquivos de teste editados rodados com uma réplica mínima do `vitest` sobre o JS compilado; as duas provas de vida abaixo também. A suíte completa e o build são do seu shell.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `IDEAS.md` e a sua seção no log (Edições 11–15). `meta/CONTEXT.md` e o `logs/2026-11-21.md` (seção do chat) são do chat e já estão gravados — **só versione** (e acrescente a sua seção no log).

---

## 1. Por que

Até aqui só um frame fica selecionado por vez. Esta WO liga a multi-seleção da DEC-024: Shift+clique soma e tira, arrastar no vazio seleciona por retângulo, Ctrl+A seleciona os frames destravados; vários frames viram uma `ActiveSelection` do Fabric que só MOVE (o conteúdo de todos acompanha), e o gesto inteiro é UMA entrada de desfazer (`setFrameTransforms`). Setas empurram 1 mm (Shift: 10 mm), e os toques seguidos na mesma seleção juntam numa entrada (fusão por chave no `historyStore`, janela de 1 s). Alinhar e distribuir entram como ações testadas (`EditorActions`), sem atalho até a Toolbar.

Se, depois de soltar um grupo, as alças aparecem fora dos frames; se Shift+clique tira um frame na tela e o store não sabe; ou se segurar a seta enche o histórico, a aplicação saiu errada — são os três riscos da DEC-024.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos dois arquivos do chat e nos nove substituídos inteiros (cabeçalho). Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  190 passed (190)`.
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = ` M meta/CONTEXT.md`, `?? logs/2026-11-21.md`, `?? meta/workorders/261121-wo0023-multi-selecao.md` (3 entradas).

## Edição 1 — `src/canvas/SelectionManager.ts` · substituir (grupo, Shift+clique, retângulo)

O que muda: `onSelect` recebe a LISTA de ids e é chamado no `mouse:down` e no `mouse:up` (o fim do gesto); `onFrameChange` vira `onFramesChange` (todos os frames do gesto numa chamada); `setSelected` recebe a lista e monta a `ActiveSelection`; `updateBase`/`resetFrame` viram `updateBases`/`resetFrames`; `baseRects` novo; `withGroupReleased`, `styleGroup`, `idsOf`, `movedBy` e `sameMembers` novos; `follow` e `release` passam a tratar o grupo. Os comentários que continuam valendo ficam.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `ce8c3ad52fffd05449f7600563c1327484142cc3` — Edição 0; diferente = **PARE**):

````
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
````

## Edição 2 — `src/canvas/CanvasEngine.ts` · substituir (seleção do Fabric ligada, lista de ids)

O que muda: no `Canvas`, `selection` passa de `false` a `true` (a linha antiga sai; a nova vem com o comentário) e entram as cores do retângulo; `setTextDrawings` junta as caixas e chama `updateBases` uma vez; `setSelected(frameIds)`, `resetFrames(frameIds)` e `frameBoxes(frameIds)` no lugar de `setSelected(frameId)`/`resetFrame`; o import de `DrawRect`. O resto é o arquivo de hoje.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `a76670528213b2cf7a0a633bf4ac7d647e9ccf16` — Edição 0; diferente = **PARE**):

````
/**
 * CanvasEngine.ts
 *
 * Adaptador FINO do Fabric 6 (DEC-016): monta o canvas num elemento, desenha a
 * página (área de corte + guia de sangria), enquadra com zoom para caber e
 * libera tudo ao descartar. Toda conta mora em `PageGeometry.ts`; aqui só se
 * repassam valores ao Fabric; o que cada desenho vira no Fabric é do `FrameObjects.ts`
 * (wo0022). As alças de seleção são do `SelectionManager.ts`, que vive aqui dentro (DEC-023).
 */

import { Canvas, Rect } from 'fabric';
import type { FabricObject } from 'fabric';
import type { DocumentSettings } from '../template/TemplateSchema';
import type { DrawRect, TextFrameDrawing } from '../text/TextDrawing';
import type { ImageFrameDrawing } from './FrameImage';
import type { ShapeFrameDrawing } from './FrameShape';
import { imageFrameObject, shapeFrameObject, textFrameObjects } from './FrameObjects';
import { centeredOffset, fitZoom, pageBox } from './PageGeometry';
import type { CanvasSize, PageBox } from './PageGeometry';
import type { SelectableFrame } from './SelectionGeometry';
import { SelectionManager } from './SelectionManager';
import type { SelectionCallbacks } from './SelectionManager';

export interface CanvasEngineOptions {
  /** Margem em px CSS ao redor da página no enquadramento. Padrão: 32. */
  fitMargin?: number;
  /** Para onde vão o resultado dos gestos de seleção e o fim de um arraste (DEC-023, DEC-024). */
  selection?: SelectionCallbacks;
}

export class CanvasEngine {
  private readonly canvas: Canvas;
  private readonly fitMargin: number;
  private readonly selection: SelectionManager;
  private pageObjects: FabricObject[] = [];
  private textObjects: FabricObject[] = [];
  private imageObjects: FabricObject[] = [];
  private shapeObjects: FabricObject[] = [];
  /** `zIndex` do frame de cada objeto de texto/imagem — a ordem de empilhamento (`relayer`). */
  private readonly frameZ = new WeakMap<FabricObject, number>();
  /** Id do frame de cada objeto de conteúdo — o que a alça desloca ao mover. */
  private readonly frameOf = new WeakMap<FabricObject, string>();
  private box: PageBox | null = null;
  private disposal: Promise<void> | null = null;
  /** px do dispositivo por px CSS do último `resize` (FIX-002); 1 até o primeiro. */
  private pixelRatio = 1;

  constructor(element: HTMLCanvasElement, options: CanvasEngineOptions = {}) {
    this.fitMargin = options.fitMargin ?? 32;
    this.canvas = new Canvas(element, {
      backgroundColor: '#E5E5E5',
      renderOnAddRemove: false,
      // DESLIGADO de propósito (FIX-002): o retina do Fabric 6 trunca `css × dpr` e ignora
      // DPR < 1, e o buffer fica de tamanho diferente da tela. Quem dá os px do dispositivo
      // é o `resize`, já medidos pelo navegador.
      enableRetinaScaling: false,
      // O clique acerta o frame de cima pela ordem das alças, mesmo com outro selecionado
      // (sem isto o Fabric dá preferência ao objeto ativo — DEC-023).
      preserveObjectStacking: true,
      // Shift+clique e retângulo arrastado no vazio (DEC-024): o Fabric só junta objetos com
      // `selection` ligado, e liga os dois gestos juntos. Só as alças são `selectable`.
      selection: true,
      selectionColor: 'rgba(26, 115, 232, 0.08)',
      selectionBorderColor: '#1A73E8',
    });
    this.selection = new SelectionManager(
      this.canvas,
      (frameId) => this.contentOf(frameId),
      options.selection ?? {},
    );
  }

  /** Desenha a página destas configurações (substitui a anterior) e reenquadra. */
  showPage(document: DocumentSettings): void {
    this.assertAlive();
    for (const object of this.pageObjects) this.canvas.remove(object);
    this.pageObjects = [];
    // Página nova = desenhos de texto, imagem e forma velhos não valem; quem chama manda os novos.
    this.clearText();
    this.clearImages();
    this.clearShapes();

    const box = pageBox(document);
    this.box = box;

    const common = {
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    } as const;

    const trim = new Rect({
      ...common,
      left: box.bleed,
      top: box.bleed,
      width: box.trimWidth,
      height: box.trimHeight,
      fill: '#FFFFFF',
      strokeWidth: 0,
    });
    this.pageObjects.push(trim);

    if (box.bleed > 0) {
      this.pageObjects.push(
        new Rect({
          ...common,
          left: 0,
          top: 0,
          width: box.width,
          height: box.height,
          fill: 'transparent',
          stroke: '#D93025',
          strokeWidth: 1,
          strokeDashArray: [4, 4],
          strokeUniform: true,
        }),
      );
    }

    this.canvas.add(...this.pageObjects);
    this.reframe();
    this.canvas.requestRenderAll();
  }

  /** Substitui os desenhos de texto da página. Contornos prontos, em coordenadas do mundo. */
  setTextDrawings(drawings: readonly TextFrameDrawing[]): void {
    this.assertAlive();
    this.clearText();

    const bases = new Map<string, DrawRect>();
    for (const drawing of drawings) {
      for (const object of textFrameObjects(drawing)) {
        this.frameZ.set(object, drawing.zIndex);
        this.frameOf.set(object, drawing.frameId);
        this.textObjects.push(object);
      }
      // A caixa do texto que cresce só se conhece agora (depois do grow e da âncora).
      bases.set(drawing.frameId, drawing.frame);
    }
    // De uma vez: com um grupo ativo, cada atualização desfaz e remonta o grupo.
    this.selection.updateBases(bases);

    this.relayer();
  }

  /**
   * Substitui os desenhos de forma da página (DEC-020). Contornos prontos, já recuados para
   * o traço ficar por dentro do frame; polígono e SVG, ainda não desenhados, chegam como
   * erro e viram o retângulo vermelho tracejado.
   */
  setShapeDrawings(drawings: readonly ShapeFrameDrawing[]): void {
    this.assertAlive();
    this.clearShapes();

    for (const drawing of drawings) {
      const object = shapeFrameObject(drawing);
      this.frameZ.set(object, drawing.zIndex);
      this.frameOf.set(object, drawing.frameId);
      this.shapeObjects.push(object);
    }

    this.relayer();
  }

  /**
   * Substitui os desenhos de imagem da página (DEC-019). Cada imagem é recortada pelo
   * frame, com o raio dos cantos; área reservada vira retângulo cinza tracejado, e erro,
   * o vermelho tracejado do texto.
   */
  setImageDrawings(drawings: readonly ImageFrameDrawing<HTMLImageElement>[]): void {
    this.assertAlive();
    this.clearImages();

    for (const drawing of drawings) {
      const object = imageFrameObject(drawing);
      this.frameZ.set(object, drawing.zIndex);
      this.frameOf.set(object, drawing.frameId);
      this.imageObjects.push(object);
    }

    this.relayer();
  }

  /**
   * Troca as alças de seleção pelas destes frames (`selectableFrames`, na ordem do desenho).
   * Alça de frame que continua é atualizada, não recriada — a seleção sobrevive ao redesenho.
   */
  setFrames(frames: readonly SelectableFrame[]): void {
    this.assertAlive();
    this.selection.setFrames(frames);
  }

  /** Mostra estes frames como selecionados: nenhum, um, ou vários num grupo que só move (DEC-024). */
  setSelected(frameIds: readonly string[]): void {
    this.assertAlive();
    this.selection.setSelected(frameIds);
  }

  /** Devolve as alças e o conteúdo destes frames ao lugar do documento (arraste que não mudou nada). */
  resetFrames(frameIds: readonly string[]): void {
    this.assertAlive();
    this.selection.resetFrames(frameIds);
  }

  /** As caixas desenhadas destes frames (px CSS do mundo) — o que alinhar, distribuir e empurrar usam. */
  frameBoxes(frameIds: readonly string[]): Map<string, DrawRect> {
    this.assertAlive();
    return this.selection.baseRects(frameIds);
  }

  /**
   * Ajusta o canvas ao contêiner e reenquadra a página. O buffer recebe px do DISPOSITIVO;
   * o estilo é `100%` do contêiner, então o tamanho na tela acompanha o contêiner mesmo se
   * um evento de resize faltar (FIX-002). Um pixel do buffer cai num pixel da tela em
   * qualquer zoom do navegador. As coordenadas do canvas são px do dispositivo; o zoom de
   * enquadramento já as inclui.
   *
   * @param size - tamanhos vindos de `canvasSize` (`PageGeometry.ts`)
   */
  resize(size: CanvasSize): void {
    this.assertAlive();
    this.pixelRatio = size.pixelRatio;
    this.canvas.setDimensions(
      { width: size.pixelWidth, height: size.pixelHeight },
      { backstoreOnly: true },
    );
    // 100%, não px: px fixos ficam velhos quando o zoom do navegador muda sem evento, e o
    // CSSOM ainda arredonda a 6 algarismos (1163.625 → "1163.62px", medido).
    this.canvas.setDimensions({ width: '100%', height: '100%' }, { cssOnly: true });
    // Controles de seleção são desenhados em px do canvas, que aqui são px do dispositivo.
    this.selection.setPixelRatio(size.pixelRatio);
    this.reframe();
    this.canvas.requestRenderAll();
  }

  /** Zoom da página em px CSS por px do mundo (1 = tamanho físico), independente do DPR. */
  getZoom(): number {
    this.assertAlive();
    return this.canvas.getZoom() / this.pixelRatio;
  }

  get disposed(): boolean {
    return this.disposal !== null;
  }

  /** Libera o Fabric. Idempotente: chamadas repetidas devolvem a mesma promessa. */
  dispose(): Promise<void> {
    this.disposal ??= this.canvas.dispose().then(() => undefined);
    return this.disposal;
  }

  /** Zoom para caber + centralização; sem página mostrada, não há o que enquadrar. */
  private reframe(): void {
    if (this.box === null) return;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();
    // width/height são px do dispositivo; a margem é configurada em px CSS.
    const zoom = fitZoom(width, height, this.box, this.fitMargin * this.pixelRatio);
    const { x, y } = centeredOffset(width, height, this.box, zoom);
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, x, y]);
  }

  /** Os objetos de conteúdo (forma, imagem, texto) do frame `frameId`, agora. */
  private contentOf(frameId: string): FabricObject[] {
    return [...this.shapeObjects, ...this.imageObjects, ...this.textObjects].filter(
      (object) => this.frameOf.get(object) === frameId,
    );
  }

  /** Remove só os objetos que `setTextDrawings` criou. */
  private clearText(): void {
    for (const object of this.textObjects) this.canvas.remove(object);
    this.textObjects = [];
  }

  /** Remove só os objetos que `setImageDrawings` criou. */
  private clearImages(): void {
    for (const object of this.imageObjects) this.canvas.remove(object);
    this.imageObjects = [];
  }

  /** Remove só os objetos que `setShapeDrawings` criou. */
  private clearShapes(): void {
    for (const object of this.shapeObjects) this.canvas.remove(object);
    this.shapeObjects = [];
  }

  /**
   * Empilha os objetos de frame (forma, imagem e texto) pelo `zIndex`, acima da página.
   * Empate: forma embaixo da imagem, imagem embaixo do texto (fundo, foto, legenda); dentro
   * de cada tipo, a ordem recebida. Os três chegam em momentos diferentes (texto e imagem
   * por promessas separadas), por isso a ordem é refeita a cada chegada. As alças não entram
   * aqui: remover a alça ativa limparia a seleção (`SelectionManager.setFrames`).
   */
  private relayer(): void {
    const objects = [...this.shapeObjects, ...this.imageObjects, ...this.textObjects];
    this.canvas.remove(...objects);
    objects.sort((a, b) => (this.frameZ.get(a) ?? 0) - (this.frameZ.get(b) ?? 0));
    this.canvas.add(...objects);
    this.canvas.requestRenderAll();
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('CanvasEngine já foi liberado.');
  }
}
````

## Edição 3 — `src/ui/CanvasView.tsx` · substituir (grupo e caixas para as ações)

O que muda: `onFrameChange` vira `onFramesChange` (um registro de `transform` por frame); prop nova `boxes`; o engine recebe os callbacks novos e, se nada mudou ao soltar, `resetFrames`; o efeito da seleção passa a lista (chaveada por texto). O resto é o arquivo de hoje.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `9b336d3f0980e8fd024234bedf5956e6faa77021` — Edição 0; diferente = **PARE**):

````
import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';
import { canvasSize } from '../canvas/PageGeometry';
import { decodeImageInBrowser, prepareImageDrawings } from '../canvas/FrameImage';
import type { ImageCache } from '../canvas/FrameImage';
import { prepareShapeDrawings } from '../canvas/FrameShape';
import { prepareTextDrawings } from '../canvas/FrameText';
import {
  findFrame,
  sameTransform,
  selectableFrames,
  transformFromHandle,
} from '../canvas/SelectionGeometry';
import type { ProjectFiles } from '../project/ProjectFiles';
import type { EditxTemplate } from '../template/TemplateSchema';
import { FontRegistry } from '../text/FontRegistry';
import type { Transform } from '../types/frame.types';
import type { FrameBoxes } from './EditorActions';

export interface CanvasViewProps {
  /** Template cujo documento e página serão mostrados. */
  template: EditxTemplate;
  /** Id da página a mostrar. */
  pageId: string;
  /** Arquivos do projeto (imagens), lidos por caminho relativo ao `.editx` (DEC-019). */
  files: ProjectFiles;
  /** Ids dos frames selecionados (`selectionStore`); vários viram um grupo que só move (DEC-024). */
  selectedIds: readonly string[];
  /** Resultado de um gesto de seleção no canvas: os ids selecionados agora (vazio = nenhum). */
  onSelect: (ids: string[]) => void;
  /**
   * O usuário soltou um arraste que muda frames: o `transform` novo de cada um, já na unidade do
   * documento — uma entrada de desfazer para o gesto inteiro.
   */
  onFramesChange: (changes: Record<string, Transform>) => void;
  /** Recebe quem fornece as caixas desenhadas enquanto o canvas existe (`null` ao desmontar). */
  boxes?: { current: FrameBoxes | null };
}

/** No escopo do módulo: o cache das fontes dura entre montagens (StrictMode, troca de página). */
const fonts = new FontRegistry();

/**
 * Imagens já decodificadas, por pasta de projeto (DEC-023): sem isto cada mudança do documento
 * lê e decodifica de novo (30–50 ms por imagem, medido em 2026-11-18) e a imagem pisca a cada
 * arraste. Outra pasta de projeto = outro cache.
 */
const imageCaches = new WeakMap<ProjectFiles, ImageCache<HTMLImageElement>>();

function imageCacheFor(files: ProjectFiles): ImageCache<HTMLImageElement> {
  let cache = imageCaches.get(files);
  if (cache === undefined) {
    cache = new Map();
    imageCaches.set(files, cache);
  }
  return cache;
}

/**
 * Contêiner do canvas: ocupa 100% do pai e reenquadra a página ao redimensionar.
 * O `<canvas>` é criado a cada montagem (não vem do JSX): o Fabric 6 recusa
 * reaproveitar elemento com `data-fabric`, e o StrictMode monta duas vezes (DEC-016).
 */
export function CanvasView({
  template,
  pageId,
  files,
  selectedIds,
  onSelect,
  onFramesChange,
  boxes,
}: CanvasViewProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  // Sempre as props mais recentes: o efeito de montagem desenha já na criação, e os eventos do
  // canvas (criados uma vez) leem o template e as funções de agora.
  const latest = useRef({ template, onSelect, onFramesChange, boxes });
  latest.current = { template, onSelect, onFramesChange, boxes };

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const element = document.createElement('canvas');
    host.appendChild(element);

    const engine = new CanvasEngine(element, {
      selection: {
        onSelect: (frameIds) => latest.current.onSelect(frameIds),
        onFramesChange: (list) => {
          const { template: current, onFramesChange: change } = latest.current;
          const changes: Record<string, Transform> = {};
          const unchanged: string[] = [];
          for (const { frameId, base, next } of list) {
            const frame = findFrame(current, frameId);
            if (frame === undefined) continue;
            const transform = transformFromHandle(
              frame.transform,
              base,
              next,
              current.document.unit,
            );
            if (sameTransform(transform, frame.transform)) unchanged.push(frameId);
            else changes[frameId] = transform;
          }
          // Arraste que, arredondado, não muda nada: o documento não muda e a página não vai ser
          // redesenhada — então as alças e o conteúdo voltam ao lugar aqui.
          if (Object.keys(changes).length === 0) engine.resetFrames(unchanged);
          else change(changes);
        },
      },
    });
    engineRef.current = engine;
    const boxRef = latest.current.boxes;
    if (boxRef !== undefined) boxRef.current = (frameIds) => engine.frameBoxes(frameIds);
    // Primeiro enquadramento com a melhor estimativa; o ResizeObserver dispara logo em
    // seguida com a medida exata em px do dispositivo e corrige (FIX-002).
    const rect = host.getBoundingClientRect();
    engine.resize(canvasSize(rect.width, rect.height, window.devicePixelRatio));
    engine.showPage(latest.current.template.document);

    // Um callback para os dois observadores: a entrada traz as medidas CSS e em px do
    // dispositivo qualquer que seja a caixa observada.
    const onResize = (entries: ResizeObserverEntry[]): void => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      // Quantos pixels da TELA o contêiner ocupa, já arredondados pelo navegador como ele
      // vai desenhar (escrita horizontal: inline = largura). Safari não tem; aí canvasSize
      // arredonda css × dpr.
      const device = entry.devicePixelContentBoxSize?.[0];
      const devicePixels =
        device === undefined ? null : { width: device.inlineSize, height: device.blockSize };
      if (!engine.disposed) {
        engine.resize(canvasSize(width, height, window.devicePixelRatio, devicePixels));
      }
    };
    // DOIS observadores, porque cada um só dispara quando a SUA caixa muda (FIX-002):
    // - caixa de conteúdo: muda com o zoom do navegador (a janela mantém os px físicos);
    // - caixa em px do dispositivo: muda quando só o DPR muda (outro monitor).
    const observer = new ResizeObserver(onResize);
    observer.observe(host);
    const deviceObserver = new ResizeObserver(onResize);
    try {
      deviceObserver.observe(host, { box: 'device-pixel-content-box' });
    } catch {
      // Navegador sem a caixa (Safari): fica só o observador da caixa de conteúdo.
    }

    return () => {
      observer.disconnect();
      deviceObserver.disconnect();
      engineRef.current = null;
      if (boxRef !== undefined) boxRef.current = null;
      engine
        .dispose()
        .catch((error: unknown) => console.error('Falha ao liberar o CanvasEngine:', error))
        .finally(() => {
          // O dispose() do Fabric já devolveu ESTE <canvas> ao lugar do div.canvas-container
          // (cleanupDOM é síncrono); aqui só ele sai. Não remova por diferença de filhos: no
          // StrictMode a montagem seguinte já inseriu o canvas dela no mesmo <div> (FIX-001).
          element.remove();
        });
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (engine === null) return;
    // Limpeza do efeito = o resultado assíncrono abaixo não vale mais (outro template/página
    // ou desmontagem): a bandeira evita desenhar texto velho ou num engine já liberado.
    let cancelado = false;

    engine.showPage(template.document);
    // Formas não leem arquivo nem fonte: o desenho sai na hora, sem promessa.
    try {
      engine.setShapeDrawings(prepareShapeDrawings(template, pageId));
    } catch (error) {
      console.error('Falha ao preparar as formas da página:', error);
    }
    // Alças na hora, pelo `transform`; a do texto que cresce se corrige quando o texto chega.
    try {
      engine.setFrames(selectableFrames(template, pageId));
    } catch (error) {
      console.error('Falha ao preparar as alças de seleção:', error);
    }
    prepareTextDrawings(template, pageId, fonts).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setTextDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar o texto da página:', error),
    );
    prepareImageDrawings(template, pageId, files, decodeImageInBrowser, imageCacheFor(files)).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setImageDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar as imagens da página:', error),
    );

    return () => {
      cancelado = true;
    };
  }, [template, pageId, files]);

  // Depois do efeito de desenho (mesma renderização, ordem de declaração): as alças já existem.
  // A lista vira texto para o efeito não rodar a cada array novo com os mesmos ids.
  const selectedKey = selectedIds.join('\n');
  useEffect(() => {
    engineRef.current?.setSelected(selectedKey === '' ? [] : selectedKey.split('\n'));
  }, [selectedKey, template, pageId]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
}
````

## Edição 4 — `src/ui/EditorShortcuts.ts` · substituir (Ctrl+A e setas)

O que muda: `selectAll` (Ctrl+A) em `shortcutFor`; `nudgeFor` novo (setas, Shift = passo grande); o gancho recebe as `EditorActions`.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `79c53fe5d3f844f7a09c12af3b26f0b4877e860b` — Edição 0; diferente = **PARE**):

````
/**
 * EditorShortcuts.ts
 *
 * Atalhos de teclado do editor (DEC-021, DEC-023, DEC-024): desfazer, refazer, limpar e
 * selecionar tudo, e as setas para empurrar. Ficam no host, não no canvas: valem para a janela
 * inteira, e o canvas não tem foco de teclado. `shortcutFor` e `nudgeFor` são puras (testadas em
 * Node); `useEditorShortcuts` só as liga ao `keydown`. Alinhar e distribuir NÃO têm atalho até a
 * Toolbar (DEC-024).
 */

import { useEffect } from 'react';
import type { EditorStores } from '../store/documentStore';
import type { EditorActions } from './EditorActions';

/** O que uma tecla faz no editor. */
export type EditorShortcut = 'undo' | 'redo' | 'deselect' | 'selectAll';

/** O que interessa de um `KeyboardEvent` para decidir o atalho. */
export interface ShortcutKey {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * O atalho desta tecla, ou `null`. Ctrl (ou Cmd no Mac) + Z desfaz; + Shift + Z refaz, e
 * Ctrl + Y também (o atalho do Windows); Ctrl + A seleciona tudo; Esc limpa a seleção. Com Alt,
 * nada.
 */
export function shortcutFor(event: ShortcutKey): EditorShortcut | null {
  if (event.altKey) return null;
  const key = event.key.toLowerCase();
  const command = event.ctrlKey || event.metaKey;
  if (!command) {
    return key === 'escape' && !event.shiftKey ? 'deselect' : null;
  }
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
  if (key === 'y' && !event.shiftKey) return 'redo';
  if (key === 'a' && !event.shiftKey) return 'selectAll';
  return null;
}

/** Direção de cada seta, em passos (x para a direita, y para baixo). */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * O empurrão desta tecla, ou `null`: seta sozinha anda 1 mm, com Shift 10 mm (DEC-024). Com
 * Ctrl, Cmd ou Alt, nada (ficam livres para atalhos futuros).
 */
export function nudgeFor(event: ShortcutKey): { dx: number; dy: number; big: boolean } | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const arrow = ARROWS[event.key];
  if (arrow === undefined) return null;
  return { dx: arrow[0], dy: arrow[1], big: event.shiftKey };
}

/** A tecla foi digitada num campo de texto — ali Ctrl+Z é do campo, não do editor. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/** Liga os atalhos do editor à janela enquanto o componente estiver montado. */
export function useEditorShortcuts(stores: EditorStores, actions: EditorActions): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return;
      const nudge = nudgeFor(event);
      if (nudge !== null) {
        event.preventDefault();
        actions.nudge(nudge.dx, nudge.dy, nudge.big);
        return;
      }
      const shortcut = shortcutFor(event);
      if (shortcut === null) return;
      event.preventDefault();
      if (shortcut === 'undo') stores.document.getState().undo();
      else if (shortcut === 'redo') stores.document.getState().redo();
      else if (shortcut === 'selectAll') actions.selectAll();
      else stores.selection.getState().clear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stores, actions]);
}
````

## Edição 5 — `src/App.tsx` · substituir (ações do editor no host)

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `dc46e5d55039dc120db5fdea1f8cef613cb25a78` — Edição 0; diferente = **PARE**):

````
import { useStore } from 'zustand';
import { UrlProjectFiles } from './project/ProjectFiles';
import { createEditorStores } from './store/documentStore';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import type { Transform } from './types/frame.types';
import { CanvasView } from './ui/CanvasView';
import { createEditorActions } from './ui/EditorActions';
import type { FrameBoxes } from './ui/EditorActions';
import { useEditorShortcuts } from './ui/EditorShortcuts';

/**
 * Pasta de projeto do exemplo, servida pelo Vite a partir de `public/exemplo/` (DEC-019).
 * No escopo do módulo: a mesma instância a cada renderização (é dependência de efeito).
 */
const exampleFiles = new UrlProjectFiles('/exemplo/');

/**
 * O editor aberto com o exemplo (DEC-021). Página inicial: `?page=<id>` na URL (ex.:
 * `?page=page-capa`), ou a de produto — atalho de desenvolvimento até existir a UI.
 */
const stores = createEditorStores(catalogoSimplesExample, {
  pageId: new URLSearchParams(window.location.search).get('page') ?? 'page-produto',
});

/** Quem fornece as caixas desenhadas: o `CanvasView` preenche enquanto o canvas existe. */
const canvasBoxes: { current: FrameBoxes | null } = { current: null };

/** Selecionar tudo, alinhar, distribuir e empurrar (DEC-024). No escopo do módulo: as mesmas sempre. */
const actions = createEditorActions(stores, () => canvasBoxes.current);

// Só no `npm run dev`: o console alcança os stores e as ações (ex.:
// `__editx.document.getState().undo()`, `__editx.actions.align('left')`).
if (import.meta.env.DEV) {
  (window as unknown as { __editx?: typeof stores & { actions: typeof actions } }).__editx = {
    ...stores,
    actions,
  };
}

/** O gesto no canvas troca a seleção (DEC-023, DEC-024). No escopo do módulo: a mesma função sempre. */
const selectFrames = (ids: string[]): void => stores.selection.getState().select(ids);

/** O arraste solto grava os `transform` novos — uma entrada de desfazer por gesto (DEC-021, DEC-024). */
const changeFrames = (changes: Record<string, Transform>): void =>
  stores.document.getState().setFrameTransforms(changes);

/**
 * Host de desenvolvimento: mostra a página ativa do documento no canvas, ocupando a janela,
 * com seleção (um ou vários frames), mover, redimensionar, setas e os atalhos de desfazer. Some
 * quando existir a UI do editor.
 */
export default function App() {
  const template = useStore(stores.document, (state) => state.template);
  const pageId = useStore(stores.document, (state) => state.pageId);
  const selectedIds = useStore(stores.selection, (state) => state.selectedIds);
  useEditorShortcuts(stores, actions);
  return (
    <CanvasView
      template={template}
      pageId={pageId}
      files={exampleFiles}
      selectedIds={selectedIds}
      onSelect={selectFrames}
      onFramesChange={changeFrames}
      boxes={canvasBoxes}
    />
  );
}
````

## Edição 6 — `src/store/historyStore.ts` · substituir (fusão de entradas)

O que muda: `HistoryEntry` ganha `mergeKey` e `at`; `MERGE_WINDOW_MS`; `record` junta com a última quando a chave é a mesma, dentro da janela e sem nada para refazer.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `724b9aed88e365704353635a350c270e6b4eea71` — Edição 0; diferente = **PARE**):

````
/**
 * historyStore.ts
 *
 * Pilhas de desfazer e refazer (DEC-021). Cada entrada guarda os patches de UMA mudança
 * do template e os inversos dela — quem aplica é o `documentStore`; este store só faz a
 * contabilidade das pilhas. Não conhece o documento.
 */

import type { Patch } from 'immer';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';

/** Uma mudança do template: o que ela fez e como desfazê-la. */
export interface HistoryEntry {
  /** Rótulo curto da ação (ex.: «mover frame-foto-produto») — para a UI e para depurar. */
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
  /**
   * Entradas seguidas com a mesma chave viram UMA (DEC-024: toques de seta na mesma seleção).
   * Sem chave, a entrada nunca junta.
   */
  mergeKey?: string;
  /** Quando a mudança foi feita (ms, `Date.now()` ou o relógio dado ao editor) — a janela da fusão. */
  at?: number;
}

/** Até quanto tempo depois da anterior uma entrada com a mesma `mergeKey` junta com ela (ms). */
export const MERGE_WINDOW_MS = 1000;

export interface HistoryState {
  /** Mudanças feitas, da mais antiga à mais recente. */
  past: HistoryEntry[];
  /** Mudanças desfeitas, da mais antiga à mais recente (a próxima a refazer é a última). */
  future: HistoryEntry[];
  /**
   * Grava uma mudança nova: apaga o que dava para refazer e respeita o limite. Junta com a última
   * quando as duas têm a mesma `mergeKey`, a nova veio em até `MERGE_WINDOW_MS` e não há o que
   * refazer (depois de um desfazer, nada junta).
   */
  record(entry: HistoryEntry): void;
  /** Tira a última mudança de `past` e a põe em `future`. @returns a entrada, ou `undefined`. */
  takeUndo(): HistoryEntry | undefined;
  /** Tira a última de `future` e a devolve a `past`. @returns a entrada, ou `undefined`. */
  takeRedo(): HistoryEntry | undefined;
  /** Esvazia as duas pilhas. */
  clear(): void;
}

/**
 * Cria o store do histórico.
 *
 * @param limit - quantas mudanças `past` guarda; passou disso, a mais antiga sai
 */
export function createHistoryStore(limit: number): StoreApi<HistoryState> {
  return createStore<HistoryState>()((set, get) => ({
    past: [],
    future: [],
    record: (entry) => {
      const { past: before, future } = get();
      const last = before.at(-1);
      if (
        entry.mergeKey !== undefined &&
        future.length === 0 &&
        last !== undefined &&
        last.mergeKey === entry.mergeKey &&
        last.at !== undefined &&
        entry.at !== undefined &&
        entry.at - last.at <= MERGE_WINDOW_MS
      ) {
        // Fazer = a anterior e depois a nova; desfazer = a inversa da nova e depois a da anterior.
        const merged: HistoryEntry = {
          label: entry.label,
          patches: [...last.patches, ...entry.patches],
          inversePatches: [...entry.inversePatches, ...last.inversePatches],
          mergeKey: entry.mergeKey,
          at: entry.at,
        };
        set({ past: [...before.slice(0, -1), merged] });
        return;
      }
      const past = [...before, entry];
      set({ past: past.length > limit ? past.slice(past.length - limit) : past, future: [] });
    },
    takeUndo: () => {
      const { past, future } = get();
      const entry = past.at(-1);
      if (entry === undefined) return undefined;
      set({ past: past.slice(0, -1), future: [...future, entry] });
      return entry;
    },
    takeRedo: () => {
      const { past, future } = get();
      const entry = future.at(-1);
      if (entry === undefined) return undefined;
      set({ past: [...past, entry], future: future.slice(0, -1) });
      return entry;
    },
    clear: () => set({ past: [], future: [] }),
  }));
}
````

## Edição 7 — `src/store/documentStore.ts` · substituir (`setFrameTransforms`, relógio)

O que muda: `setFrameTransforms` (vários frames, uma entrada, `label`/`mergeKey` opcionais); `setFrameTransform` passa a chamá-la (mesmo rótulo de antes); opção `now`; `edit` grava `mergeKey` e `at`.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `30b6a6f88fe7742ec532f05b3ea91ece2b40df21` — Edição 0; diferente = **PARE**):

````
/**
 * documentStore.ts
 *
 * O documento aberto no editor e as ações que o mudam (DEC-004, DEC-021). Toda mudança do
 * template passa por `edit`, que roda a receita com `produceWithPatches` do Immer e grava
 * os patches no `historyStore` — é o que faz desfazer e refazer valerem para qualquer ação,
 * presente ou futura. Página ativa e seleção NÃO entram no histórico. Os stores são de
 * `zustand/vanilla`: funcionam fora do React (e nos testes, em Node); o React lê com
 * `useStore` do `zustand`.
 */

import { applyPatches, enablePatches, produceWithPatches } from 'immer';
import type { Draft } from 'immer';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { EditxTemplate } from '../template/TemplateSchema';
import type { Transform } from '../types/frame.types';
import { createHistoryStore } from './historyStore';
import type { HistoryState } from './historyStore';
import { createSelectionStore } from './selectionStore';
import type { SelectionState } from './selectionStore';

enablePatches();

export interface DocumentState {
  /** O template aberto — uma cópia do que foi carregado, nunca o objeto de quem chamou. */
  template: EditxTemplate;
  /** Página mostrada no canvas. */
  pageId: string;
  /**
   * Troca a página mostrada. Não entra no histórico; limpa a seleção.
   * @throws Error se a página não existe.
   */
  setPage(pageId: string): void;
  /**
   * Troca o `transform` de um frame — o que a seleção chama ao soltar um arraste. Valores
   * iguais aos atuais não mudam nada e não entram no histórico.
   * @throws Error se o frame não existe.
   */
  setFrameTransform(frameId: string, transform: Transform): void;
  /**
   * Troca o `transform` de vários frames numa entrada de desfazer só (DEC-024: mover em grupo,
   * alinhar, distribuir, empurrar). Rótulo padrão: o de `setFrameTransform` para um frame;
   * «mover N frames» (ou «redimensionar») para vários. `mergeKey`: ver `HistoryEntry`.
   * @throws Error se algum frame não existe — e aí nada muda.
   */
  setFrameTransforms(
    changes: Readonly<Record<string, Transform>>,
    options?: { label?: string; mergeKey?: string },
  ): void;
  /** Desfaz a última mudança do template. @returns `false` se não havia o que desfazer. */
  undo(): boolean;
  /** Refaz a última mudança desfeita. @returns `false` se não havia o que refazer. */
  redo(): boolean;
}

/** Os três stores de um editor aberto, ligados entre si. */
export interface EditorStores {
  document: StoreApi<DocumentState>;
  history: StoreApi<HistoryState>;
  selection: StoreApi<SelectionState>;
}

export interface EditorStoresOptions {
  /** Página inicial; padrão: a primeira do template. */
  pageId?: string;
  /** Quantas mudanças o histórico guarda; padrão: 100. */
  historyLimit?: number;
  /** Relógio das entradas do histórico (a janela de fusão); padrão: `Date.now`. Para teste. */
  now?: () => number;
}

/** Ids de frame são únicos no documento inteiro (o validador cobra), então basta procurar em todas as páginas. */
function hasFrame(template: EditxTemplate, frameId: string): boolean {
  return template.pages.some((page) => page.frames.some((frame) => frame.id === frameId));
}

/**
 * Cria os stores de um editor com `template` aberto. Guarda uma CÓPIA do template: o Immer
 * congela o estado depois da primeira mudança, e o objeto de quem chamou não deve mudar
 * nem congelar.
 *
 * @throws Error se `options.pageId` não existe no template, ou se ele não tem páginas.
 */
export function createEditorStores(
  template: EditxTemplate,
  options: EditorStoresOptions = {},
): EditorStores {
  const initial = structuredClone(template);
  const pageId = options.pageId ?? initial.pages[0]?.id;
  if (pageId === undefined || !initial.pages.some((page) => page.id === pageId)) {
    throw new Error(`A página "${String(pageId)}" não existe no template.`);
  }
  const history = createHistoryStore(options.historyLimit ?? 100);
  const now = options.now ?? Date.now;
  const selection = createSelectionStore();

  const document = createStore<DocumentState>()((set, get) => {
    /** Ponto ÚNICO de mudança do template: aplica a receita e grava os patches, se algo mudou. */
    const edit = (
      label: string,
      recipe: (draft: Draft<EditxTemplate>) => void,
      mergeKey?: string,
    ): void => {
      const [next, patches, inversePatches] = produceWithPatches(get().template, recipe);
      if (patches.length === 0) return;
      set({ template: next });
      history.getState().record({ label, patches, inversePatches, mergeKey, at: now() });
    };

    return {
      template: initial,
      pageId,
      setPage: (next) => {
        if (!get().template.pages.some((page) => page.id === next)) {
          throw new Error(`A página "${next}" não existe no template.`);
        }
        set({ pageId: next });
        selection.getState().clear();
      },
      setFrameTransform: (frameId, transform) => {
        get().setFrameTransforms({ [frameId]: transform });
      },
      setFrameTransforms: (changes, options = {}) => {
        const ids = Object.keys(changes);
        for (const frameId of ids) {
          if (!hasFrame(get().template, frameId)) {
            throw new Error(`O frame "${frameId}" não existe no template.`);
          }
        }
        // Rótulo do histórico: o tamanho mudou = redimensionar; só a posição = mover (DEC-023).
        const frames = get().template.pages.flatMap((page) => page.frames);
        const resized = ids.some((frameId) => {
          const before = frames.find((frame) => frame.id === frameId)?.transform;
          const after = changes[frameId];
          return (
            before !== undefined && (before.width !== after.width || before.height !== after.height)
          );
        });
        const verb = resized ? 'redimensionar' : 'mover';
        const label =
          options.label ??
          (ids.length === 1 ? `${verb} ${ids[0]}` : `${verb} ${ids.length} frames`);
        edit(
          label,
          (draft) => {
            for (const page of draft.pages) {
              for (const frame of page.frames) {
                const transform = changes[frame.id];
                // Campo por campo: valor igual não é mudança para o Immer; objeto novo seria.
                if (transform !== undefined) Object.assign(frame.transform, transform);
              }
            }
          },
          options.mergeKey,
        );
      },
      undo: () => {
        const entry = history.getState().takeUndo();
        if (entry === undefined) return false;
        set({ template: applyPatches(get().template, entry.inversePatches) });
        return true;
      },
      redo: () => {
        const entry = history.getState().takeRedo();
        if (entry === undefined) return false;
        set({ template: applyPatches(get().template, entry.patches) });
        return true;
      },
    };
  });

  return { document, history, selection };
}
````

## Edição 8 — `src/store/documentStore.test.ts` · substituir (H15–H18)

Só acrescenta H15–H18 no fim; H1–H14 iguais.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `2fe6af72d1f3da0b00c0bd7b37648b2f77b3e2db` — Edição 0; diferente = **PARE**):

````
import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import { validateTemplate } from '../template/TemplateValidator';
import type { Transform } from '../types/frame.types';
import { createEditorStores } from './documentStore';
import type { EditorStores } from './documentStore';

const FOTO = 'frame-foto-produto';
const NOME = 'frame-nome-produto';
const moved: Transform = { x: 20, y: 70, width: 190, height: 120, rotation: 0 };

/** O `transform` do frame `id` no estado atual do documento. */
function transformOf(stores: EditorStores, id: string): Transform {
  for (const page of stores.document.getState().template.pages) {
    const frame = page.frames.find((candidate) => candidate.id === id);
    if (frame !== undefined) return frame.transform;
  }
  throw new Error(`o frame ${id} sumiu`);
}

const open = (pageId = 'page-produto', historyLimit?: number) =>
  createEditorStores(catalogoSimplesExample, { pageId, historyLimit });

describe('createEditorStores', () => {
  it('H1: guarda uma cópia do template e abre na primeira página por padrão', () => {
    const original = structuredClone(catalogoSimplesExample);
    const stores = createEditorStores(original);
    original.pages[1].frames[2].transform.x = 999;
    expect(transformOf(stores, FOTO).x).toBe(10);
    expect(stores.document.getState().pageId).toBe('page-capa');
  });

  it('H2: página inicial que não existe lança', () => {
    expect(() => open('nao-existe')).toThrow('nao-existe');
  });

  it('H3: setFrameTransform muda só aquele frame e grava uma entrada', () => {
    const stores = open();
    stores.document.getState().setFrameTransform(FOTO, moved);
    expect(transformOf(stores, FOTO)).toEqual(moved);
    expect(transformOf(stores, NOME).x).toBe(10);
    expect(stores.history.getState().past).toHaveLength(1);
    expect(stores.history.getState().past[0].label).toBe(`mover ${FOTO}`);
    expect(stores.history.getState().future).toHaveLength(0);
  });

  it('H4: desfazer volta ao anterior e refazer refaz', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    expect(stores.document.getState().undo()).toBe(true);
    expect(transformOf(stores, FOTO).x).toBe(10);
    expect(stores.history.getState().past).toHaveLength(0);
    expect(stores.history.getState().future).toHaveLength(1);
    expect(stores.document.getState().redo()).toBe(true);
    expect(transformOf(stores, FOTO).x).toBe(20);
  });

  it('H5: mudança nova depois de desfazer apaga o que dava para refazer', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.setFrameTransform(FOTO, { ...moved, x: 30 });
    expect(stores.history.getState().future).toHaveLength(0);
    expect(stores.history.getState().past).toHaveLength(1);
    expect(doc.redo()).toBe(false);
  });

  it('H6: mudança que não muda nada não entra no histórico nem troca o template', () => {
    const stores = open();
    const before = stores.document.getState().template;
    stores.document.getState().setFrameTransform(FOTO, { ...transformOf(stores, FOTO) });
    expect(stores.history.getState().past).toHaveLength(0);
    expect(stores.document.getState().template).toBe(before);
  });

  it('H7: frame que não existe lança e não grava nada', () => {
    const stores = open();
    expect(() => stores.document.getState().setFrameTransform('nao-existe', moved)).toThrow(
      'nao-existe',
    );
    expect(stores.history.getState().past).toHaveLength(0);
  });

  it('H8: passou do limite, a mudança mais antiga sai', () => {
    const stores = open('page-produto', 3);
    const doc = stores.document.getState();
    for (const x of [21, 22, 23, 24]) doc.setFrameTransform(FOTO, { ...moved, x });
    expect(stores.history.getState().past).toHaveLength(3);
    doc.undo();
    doc.undo();
    doc.undo();
    expect(transformOf(stores, FOTO).x).toBe(21);
    expect(doc.undo()).toBe(false);
  });

  it('H9: desfazer e refazer sem nada são inofensivos', () => {
    const stores = open();
    const before = stores.document.getState().template;
    expect(stores.document.getState().undo()).toBe(false);
    expect(stores.document.getState().redo()).toBe(false);
    expect(stores.document.getState().template).toBe(before);
  });

  it('H10: trocar de página não entra no histórico e limpa a seleção', () => {
    const stores = open();
    stores.selection.getState().select([FOTO]);
    stores.document.getState().setPage('page-capa');
    expect(stores.document.getState().pageId).toBe('page-capa');
    expect(stores.selection.getState().selectedIds).toEqual([]);
    expect(stores.history.getState().past).toHaveLength(0);
    expect(() => stores.document.getState().setPage('nao-existe')).toThrow('nao-existe');
  });

  it('H11: seleção sem repetição, e limpa', () => {
    const stores = open();
    stores.selection.getState().select([FOTO, FOTO, NOME]);
    expect(stores.selection.getState().selectedIds).toEqual([FOTO, NOME]);
    stores.selection.getState().clear();
    expect(stores.selection.getState().selectedIds).toEqual([]);
  });

  it('H12: depois de mudar, desfazer e refazer, o documento continua válido', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.redo();
    expect(validateTemplate(stores.document.getState().template).ok).toBe(true);
  });

  it('H13: quem assina o documento é avisado da mudança e do desfazer — e não da mudança vazia', () => {
    const stores = open();
    let calls = 0;
    stores.document.subscribe(() => {
      calls += 1;
    });
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.setFrameTransform(FOTO, { ...transformOf(stores, FOTO) });
    expect(calls).toBe(2);
  });

  it('H14: redimensionar e mover entram no histórico com rótulos diferentes', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, { ...transformOf(stores, FOTO), width: 150 });
    doc.setFrameTransform(FOTO, { ...transformOf(stores, FOTO), x: 30 });
    expect(stores.history.getState().past.map((entry) => entry.label)).toEqual([
      `redimensionar ${FOTO}`,
      `mover ${FOTO}`,
    ]);
  });

  it('H15: vários frames mudam numa entrada só, e desfazer volta todos', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransforms({
      [FOTO]: { ...transformOf(stores, FOTO), x: 20 },
      [NOME]: { ...transformOf(stores, NOME), x: 20 },
    });
    expect(stores.history.getState().past.map((entry) => entry.label)).toEqual(['mover 2 frames']);
    doc.undo();
    expect([transformOf(stores, FOTO).x, transformOf(stores, NOME).x]).toEqual([10, 10]);
  });

  it('H16: um frame que não existe lança e nada muda', () => {
    const stores = open();
    const before = stores.document.getState().template;
    expect(() =>
      stores.document.getState().setFrameTransforms({
        [FOTO]: { ...transformOf(stores, FOTO), x: 20 },
        'nao-existe': { ...transformOf(stores, FOTO), x: 20 },
      }),
    ).toThrow('nao-existe');
    expect(stores.document.getState().template).toBe(before);
    expect(stores.history.getState().past).toHaveLength(0);
  });

  it('H17: mesma chave dentro de 1 s junta; desfazer e refazer valem para o todo', () => {
    const clock = { t: 0 };
    const stores = createEditorStores(catalogoSimplesExample, {
      pageId: 'page-produto',
      now: () => clock.t,
    });
    const doc = stores.document.getState();
    doc.setFrameTransforms({ [FOTO]: { ...transformOf(stores, FOTO), x: 11 } }, { mergeKey: 'k' });
    clock.t = 1000;
    doc.setFrameTransforms({ [FOTO]: { ...transformOf(stores, FOTO), x: 12 } }, { mergeKey: 'k' });
    expect(stores.history.getState().past).toHaveLength(1);
    doc.undo();
    expect(transformOf(stores, FOTO).x).toBe(10);
    doc.redo();
    expect(transformOf(stores, FOTO).x).toBe(12);
    clock.t = 2001;
    doc.setFrameTransforms({ [FOTO]: { ...transformOf(stores, FOTO), x: 13 } }, { mergeKey: 'k' });
    expect(stores.history.getState().past).toHaveLength(2);
  });

  it('H18: depois de um desfazer, nada junta com a entrada anterior', () => {
    const clock = { t: 0 };
    const stores = createEditorStores(catalogoSimplesExample, {
      pageId: 'page-produto',
      now: () => clock.t,
    });
    const doc = stores.document.getState();
    doc.setFrameTransforms({ [FOTO]: { ...transformOf(stores, FOTO), x: 11 } }, { mergeKey: 'k' });
    clock.t = 100;
    doc.setFrameTransform(NOME, { ...transformOf(stores, NOME), x: 20 });
    doc.undo();
    clock.t = 200;
    doc.setFrameTransforms({ [FOTO]: { ...transformOf(stores, FOTO), x: 12 } }, { mergeKey: 'k' });
    expect(stores.history.getState().past).toHaveLength(2);
  });
});
````

## Edição 9 — `src/ui/EditorShortcuts.test.ts` · substituir (K6–K8)

Só acrescenta K6–K8 (e o import de `nudgeFor`); K1–K5 iguais.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `80d433d410cfb1f47afdd988639e7ed84f8f3aa0` — Edição 0; diferente = **PARE**):

````
import { describe, expect, it } from 'vitest';
import { nudgeFor, shortcutFor } from './EditorShortcuts';
import type { ShortcutKey } from './EditorShortcuts';

/** Uma tecla sem modificador, com os modificadores que o teste pedir. */
const press = (key: string, mods: Partial<Omit<ShortcutKey, 'key'>> = {}): ShortcutKey => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe('shortcutFor', () => {
  it('K1: Ctrl+Z desfaz; Cmd+Z também (Mac)', () => {
    expect(shortcutFor(press('z', { ctrlKey: true }))).toBe('undo');
    expect(shortcutFor(press('z', { metaKey: true }))).toBe('undo');
  });

  it('K2: Ctrl+Shift+Z refaz — com o Shift, a tecla chega maiúscula', () => {
    expect(shortcutFor(press('Z', { ctrlKey: true, shiftKey: true }))).toBe('redo');
  });

  it('K3: Ctrl+Y refaz (o atalho do Windows)', () => {
    expect(shortcutFor(press('y', { ctrlKey: true }))).toBe('redo');
  });

  it('K4: Esc limpa a seleção', () => {
    expect(shortcutFor(press('Escape'))).toBe('deselect');
  });

  it('K5: sem Ctrl, com Alt ou com Shift+Y, nada', () => {
    expect(shortcutFor(press('z'))).toBeNull();
    expect(shortcutFor(press('z', { ctrlKey: true, altKey: true }))).toBeNull();
    expect(shortcutFor(press('y', { ctrlKey: true, shiftKey: true }))).toBeNull();
    expect(shortcutFor(press('Escape', { ctrlKey: true }))).toBeNull();
  });

  it('K6: Ctrl+A seleciona tudo; Ctrl+Shift+A não', () => {
    expect(shortcutFor(press('a', { ctrlKey: true }))).toBe('selectAll');
    expect(shortcutFor(press('A', { ctrlKey: true, shiftKey: true }))).toBeNull();
  });
});

describe('nudgeFor', () => {
  it('K7: cada seta dá a sua direção; com Shift, o passo grande', () => {
    expect(nudgeFor(press('ArrowLeft'))).toEqual({ dx: -1, dy: 0, big: false });
    expect(nudgeFor(press('ArrowDown', { shiftKey: true }))).toEqual({ dx: 0, dy: 1, big: true });
  });

  it('K8: com Ctrl, Cmd ou Alt, ou outra tecla, nada', () => {
    expect(nudgeFor(press('ArrowUp', { ctrlKey: true }))).toBeNull();
    expect(nudgeFor(press('ArrowUp', { metaKey: true }))).toBeNull();
    expect(nudgeFor(press('ArrowUp', { altKey: true }))).toBeNull();
    expect(nudgeFor(press('z'))).toBeNull();
  });
});
````

## Edição 10a — `src/canvas/SelectionLayout.ts` · criar (alinhar, distribuir, passo da seta — puro)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
/**
 * SelectionLayout.ts
 *
 * As contas de alinhar, distribuir e empurrar frames, PURAS (sem Fabric, sem DOM), testáveis em
 * Node (DEC-024). Trabalham sobre as caixas DESENHADAS (as das alças, em px CSS do mundo) — o
 * texto que cresce tem caixa diferente do `transform` — e devolvem as caixas novas; quem as
 * converte em `transform` é o `transformFromHandle` (`SelectionGeometry.ts`).
 */

import type { DocumentSettings, DocumentUnit } from '../template/TemplateSchema';
import type { DrawRect } from '../text/TextDrawing';
import { pageBox, toPx } from './PageGeometry';

/** A que borda (ou centro) alinhar: três no eixo horizontal, três no vertical. */
export type AlignEdge = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

/** Em que eixo distribuir. */
export type DistributeAxis = 'horizontal' | 'vertical';

/**
 * A menor caixa que contém todas estas.
 * @throws Error se a lista está vazia.
 */
export function unionRect(rects: readonly DrawRect[]): DrawRect {
  if (rects.length === 0) throw new Error('unionRect: nenhuma caixa.');
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

/** A área de corte da página no mundo (px CSS), sem a sangria — a referência de um frame sozinho. */
export function trimRect(document: DocumentSettings): DrawRect {
  const box = pageBox(document);
  return { left: box.bleed, top: box.bleed, width: box.trimWidth, height: box.trimHeight };
}

/**
 * Cada caixa alinhada a `bounds` pela borda (ou centro) `edge`; o outro eixo não muda (DEC-024:
 * dois ou mais frames alinham à caixa da seleção, um sozinho à área de corte — quem chama escolhe
 * `bounds`).
 */
export function alignRects(
  rects: readonly DrawRect[],
  edge: AlignEdge,
  bounds: DrawRect,
): DrawRect[] {
  return rects.map((r) => {
    switch (edge) {
      case 'left':
        return { ...r, left: bounds.left };
      case 'hcenter':
        return { ...r, left: bounds.left + (bounds.width - r.width) / 2 };
      case 'right':
        return { ...r, left: bounds.left + bounds.width - r.width };
      case 'top':
        return { ...r, top: bounds.top };
      case 'vcenter':
        return { ...r, top: bounds.top + (bounds.height - r.height) / 2 };
      case 'bottom':
        return { ...r, top: bounds.top + bounds.height - r.height };
    }
  });
}

/**
 * Distribui as caixas no eixo igualando os ESPAÇOS entre elas (DEC-024, como o Figma): ordena
 * pelo começo no eixo (empate: a ordem recebida), a primeira e a última ficam paradas e as do meio
 * são reposicionadas. Devolve na ordem RECEBIDA. Com menos de três, nada muda.
 */
export function distributeRects(rects: readonly DrawRect[], axis: DistributeAxis): DrawRect[] {
  const result = rects.map((r) => ({ ...r }));
  if (rects.length < 3) return result;
  const start = (r: DrawRect): number => (axis === 'horizontal' ? r.left : r.top);
  const size = (r: DrawRect): number => (axis === 'horizontal' ? r.width : r.height);
  const order = rects
    .map((_, index) => index)
    .sort((a, b) => start(rects[a]) - start(rects[b]) || a - b);
  const first = rects[order[0]];
  const last = rects[order[order.length - 1]];
  const total = order.reduce((sum, index) => sum + size(rects[index]), 0);
  const gap = (start(last) + size(last) - start(first) - total) / (order.length - 1);
  let cursor = start(first) + size(first) + gap;
  for (const index of order.slice(1, -1)) {
    const r = result[index];
    if (axis === 'horizontal') r.left = cursor;
    else r.top = cursor;
    cursor += size(r) + gap;
  }
  return result;
}

/**
 * Quanto uma seta empurra, em px CSS do mundo (DEC-024): 1 mm, e 10 mm com Shift; em documento
 * em px, 1 px e 10 px.
 */
export function nudgeStepPx(unit: DocumentUnit, big: boolean): number {
  const steps = big ? 10 : 1;
  return unit === 'px' ? steps : toPx(steps, 'mm');
}
````

## Edição 10b — `src/canvas/SelectionLayout.test.ts` · criar (testes B1–B7)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import { toPx } from './PageGeometry';
import { alignRects, distributeRects, nudgeStepPx, trimRect, unionRect } from './SelectionLayout';

const a = { left: 10, top: 20, width: 100, height: 50 };
const b = { left: 200, top: 5, width: 40, height: 30 };

describe('SelectionLayout', () => {
  it('B1: unionRect cobre todas; lista vazia lança', () => {
    expect(unionRect([a, b])).toEqual({ left: 10, top: 5, width: 230, height: 65 });
    expect(() => unionRect([])).toThrow('nenhuma caixa');
  });

  it('B2: trimRect é a área de corte, sem a sangria', () => {
    const mm = (v: number): number => toPx(v, 'mm');
    const trim = trimRect(catalogoSimplesExample.document);
    expect(trim.left).toBeCloseTo(mm(3), 9);
    expect(trim.top).toBeCloseTo(mm(3), 9);
    expect(trim.width).toBeCloseTo(mm(210), 9);
    expect(trim.height).toBeCloseTo(mm(297), 9);
  });

  it('B3: alinhar no eixo horizontal não mexe no vertical, e vice-versa', () => {
    const bounds = unionRect([a, b]);
    expect(alignRects([a, b], 'left', bounds).map((r) => [r.left, r.top])).toEqual([
      [10, 20],
      [10, 5],
    ]);
    expect(alignRects([a, b], 'right', bounds).map((r) => r.left)).toEqual([140, 200]);
    expect(alignRects([a, b], 'hcenter', bounds).map((r) => r.left)).toEqual([75, 105]);
    expect(alignRects([a, b], 'top', bounds).map((r) => [r.left, r.top])).toEqual([
      [10, 5],
      [200, 5],
    ]);
    expect(alignRects([a, b], 'bottom', bounds).map((r) => r.top)).toEqual([20, 40]);
    expect(alignRects([a, b], 'vcenter', bounds).map((r) => r.top)).toEqual([12.5, 22.5]);
  });

  it('B4: distribuir iguala os espaços, as pontas paradas, na ordem recebida', () => {
    // Recebidas fora de ordem: a do meio (x 30) vem por último.
    const left = { left: 0, top: 0, width: 10, height: 10 };
    const right = { left: 100, top: 0, width: 20, height: 10 };
    const middle = { left: 30, top: 0, width: 30, height: 10 };
    const out = distributeRects([left, right, middle], 'horizontal');
    // Espaço total = 120 - 0 - (10 + 20 + 30) = 60 → 30 entre cada par.
    expect(out.map((r) => r.left)).toEqual([0, 100, 40]);
    expect(out.map((r) => r.top)).toEqual([0, 0, 0]);
  });

  it('B5: distribuir no vertical usa top e altura', () => {
    const rects = [
      { left: 0, top: 0, width: 10, height: 20 },
      { left: 5, top: 25, width: 10, height: 15 },
      { left: 9, top: 60, width: 10, height: 120 },
    ];
    // Espaço total = 180 - 0 - 155 = 25 → 12,5.
    expect(distributeRects(rects, 'vertical').map((r) => r.top)).toEqual([0, 32.5, 60]);
  });

  it('B6: com menos de três, distribuir não muda nada (e devolve cópias)', () => {
    const out = distributeRects([a, b], 'horizontal');
    expect(out).toEqual([a, b]);
    expect(out[0]).not.toBe(a);
  });

  it('B7: passo da seta — 1 mm e 10 mm; em px, 1 e 10', () => {
    expect(nudgeStepPx('mm', false)).toBeCloseTo(toPx(1, 'mm'), 9);
    expect(nudgeStepPx('cm', true)).toBeCloseTo(toPx(10, 'mm'), 9);
    expect(nudgeStepPx('px', false)).toBe(1);
    expect(nudgeStepPx('px', true)).toBe(10);
  });
});
````

## Edição 10c — `src/ui/EditorActions.ts` · criar (as ações do editor)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
/**
 * EditorActions.ts
 *
 * As ações do editor sobre a seleção que não são um gesto no canvas (DEC-024): selecionar tudo,
 * alinhar, distribuir e empurrar com as setas. Cada ação lê a seleção e as caixas DESENHADAS dos
 * frames (o canvas as fornece; sem canvas, usa as do `transform`), calcula com o
 * `SelectionLayout.ts` e grava o resultado numa entrada de desfazer (`setFrameTransforms`).
 * Sem React e sem Fabric: testável em Node. Alinhar e distribuir não têm atalho até a Toolbar;
 * no `npm run dev` ficam em `__editx.actions`.
 */

import {
  findFrame,
  sameTransform,
  selectableFrames,
  transformFromHandle,
} from '../canvas/SelectionGeometry';
import {
  alignRects,
  distributeRects,
  nudgeStepPx,
  trimRect,
  unionRect,
} from '../canvas/SelectionLayout';
import type { AlignEdge, DistributeAxis } from '../canvas/SelectionLayout';
import type { EditorStores } from '../store/documentStore';
import type { DrawRect } from '../text/TextDrawing';
import type { Transform } from '../types/frame.types';

/** As caixas desenhadas destes frames (px CSS do mundo); frame sem caixa conhecida fica de fora. */
export type FrameBoxes = (frameIds: readonly string[]) => ReadonlyMap<string, DrawRect>;

export interface EditorActions {
  /** Seleciona os frames destravados e visíveis da página mostrada (Ctrl+A). */
  selectAll(): void;
  /**
   * Alinha a seleção (DEC-024): dois ou mais frames, à caixa da seleção; um sozinho, à área de
   * corte da página. @returns `false` se nada mudou.
   */
  align(edge: AlignEdge): boolean;
  /** Distribui a seleção (três ou mais) igualando os espaços. @returns `false` se nada mudou. */
  distribute(axis: DistributeAxis): boolean;
  /**
   * Empurra a seleção um passo (`dx`, `dy` em -1, 0 ou 1; `big` = Shift: 10 mm). Toques seguidos
   * na mesma seleção viram uma entrada de desfazer. @returns `false` se não havia o que empurrar.
   */
  nudge(dx: number, dy: number, big: boolean): boolean;
}

/**
 * Cria as ações do editor sobre estes stores.
 *
 * @param stores - os stores do editor aberto
 * @param boxes - devolve quem fornece as caixas desenhadas agora (o canvas), ou `null` sem canvas
 */
export function createEditorActions(
  stores: EditorStores,
  boxes: () => FrameBoxes | null,
): EditorActions {
  /** A seleção válida (só frames selecionáveis da página) com a caixa de partida de cada um. */
  const selection = (): { ids: string[]; rects: DrawRect[] } => {
    const { template, pageId } = stores.document.getState();
    const selectable = new Map(selectableFrames(template, pageId).map((f) => [f.frameId, f.rect]));
    const ids = stores.selection.getState().selectedIds.filter((id) => selectable.has(id));
    const drawn = boxes()?.(ids);
    return { ids, rects: ids.map((id) => drawn?.get(id) ?? (selectable.get(id) as DrawRect)) };
  };

  /** Grava as caixas novas como `transform`, numa entrada; `false` se nenhuma mudou. */
  const apply = (
    ids: readonly string[],
    from: readonly DrawRect[],
    to: readonly DrawRect[],
    label: string,
    mergeKey?: string,
  ): boolean => {
    const { template } = stores.document.getState();
    const changes: Record<string, Transform> = {};
    ids.forEach((id, index) => {
      const frame = findFrame(template, id);
      if (frame === undefined) return;
      const next = transformFromHandle(
        frame.transform,
        from[index],
        to[index],
        template.document.unit,
      );
      if (!sameTransform(next, frame.transform)) changes[id] = next;
    });
    if (Object.keys(changes).length === 0) return false;
    stores.document.getState().setFrameTransforms(changes, { label, mergeKey });
    return true;
  };

  return {
    selectAll: () => {
      const { template, pageId } = stores.document.getState();
      stores.selection.getState().select(selectableFrames(template, pageId).map((f) => f.frameId));
    },
    align: (edge) => {
      const { ids, rects } = selection();
      if (ids.length === 0) return false;
      const bounds =
        ids.length >= 2 ? unionRect(rects) : trimRect(stores.document.getState().template.document);
      return apply(ids, rects, alignRects(rects, edge, bounds), `alinhar ${edge} (${ids.length})`);
    },
    distribute: (axis) => {
      const { ids, rects } = selection();
      if (ids.length < 3) return false;
      return apply(ids, rects, distributeRects(rects, axis), `distribuir ${axis} (${ids.length})`);
    },
    nudge: (dx, dy, big) => {
      const { ids, rects } = selection();
      if (ids.length === 0 || (dx === 0 && dy === 0)) return false;
      const step = nudgeStepPx(stores.document.getState().template.document.unit, big);
      const moved = rects.map((r) => ({ ...r, left: r.left + dx * step, top: r.top + dy * step }));
      // Mesma chave = mesma seleção: os toques seguidos juntam numa entrada (DEC-024).
      const key = `empurrar ${[...ids].sort().join(',')}`;
      return apply(ids, rects, moved, key, key);
    },
  };
}
````

## Edição 10d — `src/ui/EditorActions.test.ts` · criar (testes E1–E11)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
import { describe, expect, it } from 'vitest';
import { toPx } from '../canvas/PageGeometry';
import { findFrame, selectableFrames } from '../canvas/SelectionGeometry';
import { createEditorStores } from '../store/documentStore';
import type { EditorStores } from '../store/documentStore';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { DrawRect } from '../text/TextDrawing';
import { createEditorActions } from './EditorActions';
import type { FrameBoxes } from './EditorActions';

const FOTO = 'frame-foto-produto';
const NOME = 'frame-nome-produto';
const PRECO = 'frame-preco-produto';

/** Editor com relógio falso (`clock.t`, em ms) e, opcionalmente, caixas desenhadas falsas. */
function open(pageId = 'page-produto', boxes: FrameBoxes | null = null) {
  const clock = { t: 0 };
  const stores = createEditorStores(catalogoSimplesExample, { pageId, now: () => clock.t });
  return { stores, clock, actions: createEditorActions(stores, () => boxes) };
}

const x = (stores: EditorStores, id: string): number | undefined =>
  findFrame(stores.document.getState().template, id)?.transform.x;
const y = (stores: EditorStores, id: string): number | undefined =>
  findFrame(stores.document.getState().template, id)?.transform.y;
const labels = (stores: EditorStores): string[] =>
  stores.history.getState().past.map((entry) => entry.label);

describe('createEditorActions', () => {
  it('E1: selecionar tudo pega os frames destravados da página, na ordem do desenho', () => {
    const { stores, actions } = open();
    actions.selectAll();
    expect(stores.selection.getState().selectedIds).toEqual([FOTO, NOME, PRECO]);
  });

  it('E2: dois frames alinham à caixa da seleção, numa entrada só', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([PRECO, FOTO]);
    expect(actions.align('right')).toBe(true);
    // Borda direita da seleção: a da foto (10 + 190 = 200); o preço (100 de largura) vai a 100.
    expect([x(stores, PRECO), x(stores, FOTO)]).toEqual([100, 10]);
    expect(labels(stores)).toEqual(['alinhar right (2)']);
  });

  it('E3: um frame sozinho alinha à área de corte da página', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([PRECO]);
    actions.align('hcenter');
    expect(x(stores, PRECO)).toBe(55); // (210 − 100) / 2
    actions.align('bottom');
    expect(y(stores, PRECO)).toBe(282); // 297 − 15
  });

  it('E4: alinhamento que não muda nada não entra no histórico', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([FOTO]); // x 10, largura 190: já no centro de 210
    expect(actions.align('hcenter')).toBe(false);
    expect(labels(stores)).toEqual([]);
  });

  it('E5: distribuir três iguala os espaços, as pontas paradas', () => {
    const { stores, actions } = open();
    stores.document.getState().setFrameTransform(PRECO, {
      ...(findFrame(stores.document.getState().template, PRECO)?.transform ?? {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        rotation: 0,
      }),
      y: 50,
    });
    stores.selection.getState().select([FOTO, NOME, PRECO]);
    expect(actions.distribute('vertical')).toBe(true);
    // nome 15–35, foto 60–180, preço 15 de altura: espaço total 10 → 5 de cada lado do preço.
    expect([y(stores, NOME), y(stores, PRECO), y(stores, FOTO)]).toEqual([15, 40, 60]);
    expect(labels(stores).at(-1)).toBe('distribuir vertical (3)');
  });

  it('E6: distribuir com menos de três não faz nada', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([FOTO, NOME]);
    expect(actions.distribute('horizontal')).toBe(false);
  });

  it('E7: a seta anda 1 mm; com Shift, 10 mm', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([FOTO]);
    actions.nudge(1, 0, false);
    expect(x(stores, FOTO)).toBe(11);
    actions.nudge(0, -1, true);
    expect(y(stores, FOTO)).toBe(50);
  });

  it('E8: toques seguidos na mesma seleção viram uma entrada; desfazer volta tudo', () => {
    const { stores, clock, actions } = open();
    stores.selection.getState().select([FOTO]);
    actions.nudge(1, 0, false);
    clock.t = 500;
    actions.nudge(1, 0, false);
    clock.t = 900;
    actions.nudge(1, 0, false);
    expect(x(stores, FOTO)).toBe(13);
    expect(stores.history.getState().past).toHaveLength(1);
    stores.document.getState().undo();
    expect(x(stores, FOTO)).toBe(10);
  });

  it('E9: passou mais de 1 s, ou a seleção mudou, é outra entrada', () => {
    const { stores, clock, actions } = open();
    stores.selection.getState().select([FOTO]);
    actions.nudge(1, 0, false);
    clock.t = 1500;
    actions.nudge(1, 0, false);
    stores.selection.getState().select([FOTO, NOME]);
    clock.t = 1600;
    actions.nudge(1, 0, false);
    expect(stores.history.getState().past).toHaveLength(3);
  });

  it('E10: usa a caixa DESENHADA (texto que cresce), não a do transform', () => {
    const mm = (v: number): number => toPx(v, 'mm');
    const rects = new Map(
      selectableFrames(catalogoSimplesExample, 'page-produto').map((f) => [f.frameId, f.rect]),
    );
    const nomeRect = rects.get(NOME) as DrawRect;
    // O desenho do nome está 5 mm à direita do transform (como um grow com âncora deslocaria).
    rects.set(NOME, { ...nomeRect, left: nomeRect.left + mm(5) });
    const boxes: FrameBoxes = (ids) => new Map(ids.map((id) => [id, rects.get(id) as DrawRect]));
    const { stores, actions } = open('page-produto', boxes);
    stores.selection.getState().select([NOME, PRECO]);
    actions.align('left');
    // A borda esquerda da seleção é a do preço (x 10): o nome anda −5 mm sobre o transform.
    expect([x(stores, NOME), x(stores, PRECO)]).toEqual([5, 10]);
  });

  it('E11: frame travado na seleção é ignorado', () => {
    const { stores, actions } = open('page-capa');
    stores.selection.getState().select(['frame-fundo-capa']);
    expect(actions.align('left')).toBe(false);
    expect(actions.nudge(1, 0, false)).toBe(false);
  });
});
````

## Edição 11a — `meta/STATUS.md` · Funcionando (multi-seleção)

A âncora é a linha inteira (longa); o texto novo a repete.

**Âncora:**

````
- **Seleção, mover e redimensionar no canvas** *(wo0020, DEC-023; conferido pelo chat no navegador embutido em 2026-11-19, sem piscar ao soltar)* — clicar num frame não travado o seleciona (`selectionStore`); clicar fora ou Esc limpa; arrastar move o frame com o conteúdo acompanhando; as alças redimensionam só a caixa até soltar (canto mantém a proporção, Shift solta; texto que cresce só mostra as alças do eixo que não cresce); ao soltar, UMA entrada de desfazer com o `transform` novo arredondado a 0,01 da unidade (`fromPx`, mínimo 1 mm); Ctrl+Z desfaz, Ctrl+Shift+Z e Ctrl+Y refazem. Uma alça transparente por frame (`canvas/SelectionManager.ts`, dentro do `CanvasEngine`), a parte pura em `canvas/SelectionGeometry.ts`, atalhos em `ui/EditorShortcuts.ts`; imagens decodificadas em cache por caminho (`ImageCache`). Sem alça de girar. Testado em Node (A1–A14, G16–G18, M10–M12, H14, K1–K5)
````

**Substituir por:**

````
- **Multi-seleção, alinhar, distribuir e setas** *(wo0023, DEC-024; conferência de tela pelo chat a fazer)* — Shift+clique soma e tira da seleção, arrastar no vazio seleciona por retângulo (basta tocar), Ctrl+A seleciona os frames destravados da página; vários frames viram um grupo que só move (o conteúdo de todos acompanha), numa entrada de desfazer; setas empurram 1 mm (Shift: 10 mm), e os toques seguidos na mesma seleção viram uma entrada (janela de 1 s, `MERGE_WINDOW_MS`). Alinhar (à caixa da seleção, ou à área de corte com um frame só) e distribuir (três ou mais, espaços iguais) existem como ações (`ui/EditorActions.ts`, contas em `canvas/SelectionLayout.ts`), sem atalho até a Toolbar — no `npm run dev`, `__editx.actions.align('left')`. Testado em Node (B1–B7, E1–E11, H15–H18, K6–K8)
- **Seleção, mover e redimensionar no canvas** *(wo0020, DEC-023; conferido pelo chat no navegador embutido em 2026-11-19, sem piscar ao soltar)* — clicar num frame não travado o seleciona (`selectionStore`); clicar fora ou Esc limpa; arrastar move o frame com o conteúdo acompanhando; as alças redimensionam só a caixa até soltar (canto mantém a proporção, Shift solta; texto que cresce só mostra as alças do eixo que não cresce); ao soltar, UMA entrada de desfazer com o `transform` novo arredondado a 0,01 da unidade (`fromPx`, mínimo 1 mm); Ctrl+Z desfaz, Ctrl+Shift+Z e Ctrl+Y refazem. Uma alça transparente por frame (`canvas/SelectionManager.ts`, dentro do `CanvasEngine`), a parte pura em `canvas/SelectionGeometry.ts`, atalhos em `ui/EditorShortcuts.ts`; imagens decodificadas em cache por caminho (`ImageCache`). Sem alça de girar. Testado em Node (A1–A14, G16–G18, M10–M12, H14, K1–K5)
````

## Edição 11b — `meta/STATUS.md` · Em Progresso

**Âncora:**

````
*Nada em progresso — o próximo item do backlog é a multi-seleção com alinhamento, distribuição e setas (DEC-023).*
````

**Substituir por:**

````
*Nada em progresso — o próximo item do backlog é a UI mínima (Toolbar, PropertiesPanel, LayersList).*
````

## Edição 11c — `meta/STATUS.md` · Backlog (multi-seleção feita, próximo item)

**Âncora:**

````
- [ ] Multi-seleção (Shift+clique), alinhamento, distribuição e setas para empurrar — DEC-023 ← **próximo**
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada)
````

**Substituir por:**

````
- [x] Multi-seleção (Shift+clique, retângulo, Ctrl+A), alinhamento, distribuição e setas para empurrar (wo0023, DEC-024)
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada) ← **próximo**
````

## Edição 11d — `meta/STATUS.md` · Onde parou e rodapé

**Âncora:**

````
**Onde parou:** wo0020 aplicada e conferida pelo chat (wo0021). Em 2026-11-20 o dono decidiu a multi-seleção
(DEC-024) e a wo0022 extraiu o `FrameObjects.ts` do `CanvasEngine.ts` (sem mudança de comportamento). Detalhe em
`logs/2026-11-20.md`.

---

*Próximo passo: conferência de tela rápida da wo0022 pelo chat; depois, a WO da multi-seleção (DEC-024).*
````

**Substituir por:**

````
**Onde parou:** wo0023 aplicada (multi-seleção, alinhar e distribuir como ações, setas). Falta a conferência de tela
pelo chat — que cobre também a da wo0022, que não foi feita porque o `npm run dev` não respondia. Detalhe em
`logs/2026-11-21.md`.

---

*Próximo passo: conferência de tela da wo0022/wo0023 pelo chat; depois, a UI mínima (Toolbar primeiro: é onde
alinhar e distribuir ganham botão).*
````

## Edição 12 — `meta/ROADMAP.md` · F1 (multi-seleção feita)

**Âncora:**

````
- [ ] Multi-seleção, alinhamento, distribuição e setas (DEC-023)
````

**Substituir por:**

````
- [x] Multi-seleção, alinhamento, distribuição e setas (grupo que só move, ações sem atalho até a Toolbar: wo0023, DEC-024)
````

## Edição 13 — `meta/CHANGELOG.md` · Adicionado (multi-seleção)

A âncora é a linha inteira (longa); o texto novo a repete.

**Âncora:**

````
- Seleção no canvas — clicar seleciona (Esc ou clique fora limpa), arrastar move o frame com o conteúdo, as alças redimensionam (canto proporcional, Shift solta; texto que cresce só no eixo livre); cada arraste solto é uma entrada de desfazer; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (`canvas/SelectionManager.ts`, `canvas/SelectionGeometry.ts`, `ui/EditorShortcuts.ts`); `fromPx` em `PageGeometry.ts` (px → unidade do documento, a 0,01); cache das imagens decodificadas (`ImageCache` em `FrameImage.ts`). Ver DEC-023
````

**Substituir por:**

````
- Seleção no canvas — clicar seleciona (Esc ou clique fora limpa), arrastar move o frame com o conteúdo, as alças redimensionam (canto proporcional, Shift solta; texto que cresce só no eixo livre); cada arraste solto é uma entrada de desfazer; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (`canvas/SelectionManager.ts`, `canvas/SelectionGeometry.ts`, `ui/EditorShortcuts.ts`); `fromPx` em `PageGeometry.ts` (px → unidade do documento, a 0,01); cache das imagens decodificadas (`ImageCache` em `FrameImage.ts`). Ver DEC-023
- Multi-seleção no canvas — Shift+clique, retângulo arrastado no vazio e Ctrl+A; o grupo move junto numa entrada de desfazer; setas empurram 1 mm (Shift: 10 mm) e os toques seguidos juntam numa entrada; alinhar e distribuir como ações do editor (`ui/EditorActions.ts`, `canvas/SelectionLayout.ts`), sem atalho até a Toolbar; `setFrameTransforms` e a fusão de entradas no `historyStore`. Ver DEC-024
````

## Edição 14 — `meta/IDEAS.md` · Adiadas (depois da multi-seleção)

**Âncora:**

````
- **Contorno ao passar o mouse sobre um frame** — sugestão do chat (2026-11-19). **Volta quando** a conferência ou o
  uso mostrarem que se clica no frame errado (frames sobrepostos, frame de texto sem fundo).
````

**Substituir por:**

````
- **Contorno ao passar o mouse sobre um frame** — sugestão do chat (2026-11-19). **Volta quando** a conferência ou o
  uso mostrarem que se clica no frame errado (frames sobrepostos, frame de texto sem fundo).
- **Atalhos de alinhar e distribuir** (os do Figma: Alt+A/D/W/S/H/V) — adiados na DEC-024: Alt+D vai à barra de
  endereço no Chrome/Edge, Alt+Shift troca o idioma do teclado no Windows, Ctrl+Alt é o AltGr no ABNT — nada disso
  medido. **Volta quando** a Toolbar existir e alguém pedir atalho, ou no app desktop (Tauri, Fase 2), onde os
  conflitos do navegador somem.
- **Redimensionar em grupo** — adiado na DEC-024: o grupo só move. **Volta quando** um template pedir aumentar vários
  frames juntos — aí decidir o que acontece com o texto que cresce e com a imagem `fit` dentro do grupo.
- **`SelectionManager.ts` acima das ~300 linhas** do CONTEXT (357 com a wo0023). Candidato a sair: o grupo
  (`withGroupReleased`, `styleGroup`, `movedBy`, `sameMembers`). **Volta quando** a seleção ganhar a próxima
  responsabilidade (encaixe e guias, ou girar).
````

## Edição 15 — `logs/2026-11-21.md` · a sua seção

O arquivo é novo, do chat, com a seção dele. Acrescente NO FIM a sua, `## Code (execução) — wo0023`, no formato do `meta/LOG-TEMPLATE.md` (Feito, Entregas, Arquivos modificados, Onde parei), com o corpo escrito por você. Não mexa na seção do chat.

---

## Fora de escopo

- Botões de alinhar e distribuir (a Toolbar é o próximo item); atalhos de alinhar (IDEAS); redimensionar em grupo (IDEAS); encaixe e guias (IDEAS).
- Mudar o formato `.editx`, o `selectionStore`, o `SelectionGeometry.ts` ou o `FrameObjects.ts`.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** sem propriedade de parâmetro no construtor e tipos só por `import type` — como está no texto.
- **Os testes novos não importam `fabric` nem o DOM:** `SelectionLayout.test.ts`, `EditorActions.test.ts` e os novos do `documentStore`/`EditorShortcuts` só tocam funções puras e os stores.
- **Edições 11a e 13 têm como âncora uma linha longa inteira** — recorte-a do arquivo, não da tela.
- **Não suba o `npm run dev` para «conferir»** — o dono deixa o dele rodando e o chat confere a tela.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: ` M meta/CHANGELOG.md`, ` M meta/CONTEXT.md`, ` M meta/IDEAS.md`, ` M meta/ROADMAP.md`, ` M meta/STATUS.md`, ` M src/App.tsx`, ` M src/canvas/CanvasEngine.ts`, ` M src/canvas/SelectionManager.ts`, ` M src/store/documentStore.test.ts`, ` M src/store/documentStore.ts`, ` M src/store/historyStore.ts`, ` M src/ui/CanvasView.tsx`, ` M src/ui/EditorShortcuts.test.ts`, ` M src/ui/EditorShortcuts.ts`, `?? logs/2026-11-21.md`, `?? meta/workorders/261121-wo0023-multi-selecao.md`, `?? src/canvas/SelectionLayout.test.ts`, `?? src/canvas/SelectionLayout.ts`, `?? src/ui/EditorActions.test.ts`, `?? src/ui/EditorActions.ts` (20 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 215 testes** (190 + B1–B7, E1–E11, H15–H18, K6–K8 = 25). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida 1 (nada junta depois de desfazer):** em `src/store/historyStore.ts`, apague temporariamente a linha `        future.length === 0 &&` e rode `npm test` — esperado **falhar só H18** (1 teste). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `documentStore.test.ts` → `setFrameTransforms` → `edit` → `historyStore.record` → a condição da fusão. **NÃO responde:** se segurar a seta na tela junta mesmo — isso é a conferência de tela do chat.
- [ ] **Prova de vida 2 (as setas juntam):** em `src/ui/EditorActions.ts`, troque temporariamente `return apply(ids, rects, moved, key, key);` por `return apply(ids, rects, moved, key);` e rode `npm test` — esperado **falhar só E8** (1 teste). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `EditorActions.test.ts` → `nudge` → `apply` → `setFrameTransforms(…, { mergeKey })`. **NÃO responde:** se a tecla chega ao `nudge` no navegador.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -rlE "from '(fabric|react)'" src/canvas/SelectionLayout.ts src/canvas/SelectionLayout.test.ts src/ui/EditorActions.ts src/ui/EditorActions.test.ts | wc -l` = 0
      - `grep -c "      selection: true," src/canvas/CanvasEngine.ts` = 1
      - `grep -c "on('selection:" src/canvas/SelectionManager.ts` = 0 (a seleção segue o gesto, não os eventos `selection:*`)
      - `grep -c "withGroupReleased(" src/canvas/SelectionManager.ts` = 4 (a definição e as chamadas em `setFrames`, `updateBases` e `resetFrames`)
      - `grep -c "^export function \(alignRects\|distributeRects\|unionRect\|trimRect\|nudgeStepPx\)" src/canvas/SelectionLayout.ts` = 5
      - `grep -c "^- \*\*Multi-seleção, alinhar, distribuir e setas\*\*" meta/STATUS.md` = 1
      - `grep -c "^- \[x\] Multi-seleção" meta/STATUS.md` = 1
      - `grep -c "^- \[x\] Multi-seleção" meta/ROADMAP.md` = 1
      - `grep -c "^- Multi-seleção no canvas" meta/CHANGELOG.md` = 1
      - `grep -c "^- \*\*Atalhos de alinhar e distribuir\*\*" meta/IDEAS.md` = 1
      - `grep -c "^## Code (execução) — wo0023" logs/2026-11-21.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] **Teste de tela:** NÃO é seu. O chat confere no navegador embutido com o `npm run dev` do dono.
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0023.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Inclua as saídas cruas acima, `wc -l` dos arquivos novos e dos substituídos, e qualquer decisão sua. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-21.md meta/CHANGELOG.md meta/CONTEXT.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md meta/workorders/261121-wo0023-multi-selecao.md src/App.tsx src/canvas/CanvasEngine.ts src/canvas/SelectionLayout.ts src/canvas/SelectionLayout.test.ts src/canvas/SelectionManager.ts src/store/documentStore.ts src/store/documentStore.test.ts src/store/historyStore.ts src/ui/CanvasView.tsx src/ui/EditorActions.ts src/ui/EditorActions.test.ts src/ui/EditorShortcuts.ts src/ui/EditorShortcuts.test.ts
```

```
git commit -m "feat(canvas): seleciona varios frames, alinha, distribui e empurra com as setas" -m "Shift+clique, retangulo e Ctrl+A; o grupo move junto numa entrada de desfazer; setas de 1 mm e 10 mm com os toques seguidos numa entrada; alinhar e distribuir como acoes do editor, sem atalho ate a Toolbar. DEC-024 (wo0023)."
```

```
git push
```
