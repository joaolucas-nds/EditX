# WO 0020 — Seleção no canvas: clicar, mover com o conteúdo, redimensionar e desfazer pelo teclado (DEC-023)

> **Tipo:** mista — CÓDIGO (seleção no Fabric, parte pura testada, cache de imagens, atalhos) + DOC (registro nos `meta/` e no log).
> **Config sugerida:** Opus · `/effort` alto — primeira interação do editor; mexe no `CanvasEngine`, no `CanvasView` e no `FrameImage`.
> **Pré-requisito:** escrita sobre `c59c0cf` (`docs: fecha o merge do KCM v1.151.0 e registra o log de 2026-11-19`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo) e esta WO. 164 testes verdes no último relatório de WO de código (wo0016; wo0017–wo0019 foram só de doc).
> **Base:** `meta/analises/261119-ANALISE-selection-manager.md`, decidida pelo dono em 2026-11-19 — as três recomendações: só seleção simples; canto mantém a proporção e o Shift solta; texto que cresce só mostra as alças do eixo que não cresce. Decisão: DEC-023 (Edição 14b), que emenda a DEC-021 (Edição 14a).
> **Depende de:** wo0019 (aplicada: `c59c0cf`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `ff8823a48d219a04316c1363b1de2b3fd749dbaf  meta/CEREBRO.md` (item novo em «Técnicas específicas deste projeto»)
> - `e9e2377855d11fd13746dc0ab7aa6c56828cda82  meta/CONTEXT.md`
> - `571a9a8b5a2aacfd41a080da4fe1e3006c80bb67  meta/GLOSSARY.md`
> - `9ee82b155a6288c8540c2c3239bf8d57f48f1b93  meta/analises/261119-ANALISE-selection-manager.md` (novo, `??`)
> **Arquivos substituídos inteiros** (Edições 6, 7 e 9) — `sha1sum` de ANTES, medido pelo chat no disco sobre `c59c0cf`:
> - `b9c32b667ecf1bbae066e4e6fed6bde00061bcac  src/canvas/CanvasEngine.ts`
> - `8e47c4ccd21eedc6759e43a5a6d3e1973db53b7c  src/ui/CanvasView.tsx`
> - `95a39842d23c18158ae1deb9f87d52bfcce431ba  src/App.tsx`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte** — nunca chute um lugar próximo.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo a forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório. Arquivo novo que já existe: **PARE e reporte**. Arquivo substituído inteiro cujo `sha1sum` não é o de antes nem o do texto novo: **PARE**.
> **Âncoras lidas em** (pelo chat, 2026-11-19, no disco, neste turno, sobre `c59c0cf`): `src/canvas/PageGeometry.ts` — o fim do `toPx` (as 4 linhas a partir de «case 'px':», que aparece 1 vez); `src/canvas/FrameImage.ts` — o import do `ProjectFiles`, o JSDoc e a assinatura de `prepareImageDrawings`, e as 6 linhas do laço de «const blob = await files.read(path);» a «const image = await decode(blob);»; `src/store/documentStore.ts` — a linha do `edit` com o rótulo «mover» (1 ocorrência); `src/canvas/PageGeometry.test.ts` — «  fitZoom,» (1) e o fim do G15 («pixelRatio: 1.25,», 1); `src/canvas/FrameImage.test.ts` — o import de `DecodedImage` (1) e o fim do M9 (1); `src/store/documentStore.test.ts` — o fim do H13; `meta/STATUS.md` — a nota de revisão (3 linhas), as linhas «- **Documento nos stores, com desfazer e refazer**», «*Nada em progresso — …*», a do `CanvasEngine.ts` e a do `SelectionManager.ts` no backlog, o bloco de «Última conversa» e o rodapé; `meta/ROADMAP.md` — a linha do `SelectionManager.ts`; `meta/CHANGELOG.md` — a linha «- Forma no canvas — » (última de «Adicionado»); `meta/DECISIONS.md` — o título e as 3 linhas seguintes da DEC-021, e «## Template para novo ADR (copie e preencha)» (1 ocorrência); `meta/IDEAS.md` — o item «- **Polígono com pontos**» (3 linhas, último de «Adiadas»); `logs/2026-11-19.md` — a última linha. Os três arquivos substituídos inteiros foram lidos inteiros.
> **Medido pelo chat** (2026-11-19, `node_modules/fabric/dist/index.mjs`, fabric 6.9.1): `object:modified` só dispara com `transform.actionPerformed` (`_finalizeCurrentTransform`); objeto com `clipPath` `absolutePositioned` tem o cache sempre sujo (`isCacheDirty`) — mover o recorte não pede `dirty`; remover o objeto ativo dispara `selection:cleared` (`Canvas._onObjectRemoved`); `setActiveObject` e `discardActiveObject` disparam `_fireSelectionEvents`; os controles são desenhados DEPOIS de todos os objetos (`renderCanvas` → `drawControls`); `bringObjectToFront` reordena o array sem chamar `remove`; `uniformScaling: true` e `uniScaleKey: 'shiftKey'` são o padrão; `setControlsVisibility` existe. No repositório: o validador aceita largura e altura zero (`nonNegative`); `TextDrawing.frame` é a caixa depois do grow e da âncora.
> **Simulado pelo chat:** as edições aplicadas numa cópia do repositório a partir do texto DESTA WO (duas passadas, a segunda provando a idempotência); `tsc -p tsconfig.app.json --noEmit`, `eslint` e `prettier --check` nos arquivos tocados, e os testes NOVOS e os dos arquivos de teste editados rodados com uma réplica mínima do `vitest` sobre o JS compilado — resultado no relatório do chat. A suíte completa e o build são do seu shell.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md` e o log (Edições 11–16). `meta/CEREBRO.md`, `meta/CONTEXT.md`, `meta/GLOSSARY.md` e a análise são do chat e já estão gravados — **só versione**. A seção do chat no log vai DENTRO da Edição 16 (o arquivo já tem seções do Code).

---

## 1. Por que

O canvas desenha o `.editx`, mas nada na tela o muda: todo objeto do Fabric é `selectable: false`. Esta WO põe a primeira interação: uma **alça** (um `Rect` transparente) sobre cada frame visível e não travado. Clicar seleciona (o id vai para o `selectionStore`); clicar fora ou Esc limpa. Arrastar move o frame e o conteúdo dele acompanha (texto, imagem e os recortes). As alças redimensionam só a caixa até soltar; o canto mantém a proporção e o Shift solta; o texto que cresce só mostra as alças do eixo que não cresce. Ao soltar, o `CanvasView` converte a caixa no `transform` novo (diferença somada ao atual, arredondada a 0,01 da unidade, mínimo 1 mm) e chama `setFrameTransform` — uma entrada de desfazer por arraste. Ctrl+Z desfaz; Ctrl+Shift+Z e Ctrl+Y refazem. As imagens decodificadas ficam em cache, para a foto não ser relida a cada mudança.

Se a seleção some ao soltar, o conteúdo sai do recorte durante o arraste, ou o título da capa (texto que cresce, âncora no meio) salta ao soltar, a aplicação saiu errada — são os três riscos que o desenho trata.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos quatro arquivos do chat e nos três arquivos substituídos inteiros (listas do cabeçalho). Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  164 passed (164)` (relatório da wo0016 — número diferente: relate o cru e siga, o piso da conferência final sobe ou desce junto).
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `M meta/CEREBRO.md`, `M meta/CONTEXT.md`, `M meta/GLOSSARY.md`, `?? meta/analises/261119-ANALISE-selection-manager.md`, `?? meta/workorders/261119-wo0020-selecao-mover-redimensionar.md` (5 entradas).

## Edição 1 — `src/canvas/PageGeometry.ts` · `fromPx`, o inverso de `toPx`

**Âncora:**

````
    case 'px':
      return value;
  }
}
````

**Substituir por:**

````
    case 'px':
      return value;
  }
}

/**
 * Converte `px` (px CSS do mundo) de volta para `unit`, arredondado a 0,01 da unidade — o valor
 * que vai para o `.editx` (DEC-021). 0,01 mm = 0,038 px CSS: abaixo do que a tela mostra, e sem
 * `10.000000003` no arquivo. Inverso de `toPx` até o arredondamento; nunca devolve `-0`.
 */
export function fromPx(px: number, unit: DocumentUnit): number {
  const value = px / toPx(1, unit);
  // `+ 0` troca -0 por 0: o arredondamento de -0,001 daria -0.
  return Math.round(value * 100) / 100 + 0;
}
````

## Edição 2a — `src/canvas/FrameImage.ts` · import do `normalizeProjectPath`

**Âncora:**

````
import type { ProjectFiles } from '../project/ProjectFiles';
````

**Substituir por:**

````
import type { ProjectFiles } from '../project/ProjectFiles';
import { normalizeProjectPath } from '../project/ProjectPath';
````

## Edição 2b — `src/canvas/FrameImage.ts` · cache das imagens decodificadas

**Âncora:**

````
/**
 * Desenhos de todos os frames de imagem visíveis da página `pageId`, por `zIndex`
 * crescente (empate mantém a ordem dos frames). Frame estático tenta o `src` e depois o
 * `fallback`; frame de dados ainda não tem valor de CSV e tenta só o `fallback`. Sem
 * caminho a tentar → `placeholder`; caminho(s) tentado(s) e nenhum legível → `error`.
 * Um frame que falha não derruba os outros.
 *
 * @throws Error (promessa rejeitada) se a página não existe.
 */
export async function prepareImageDrawings<T>(
  template: EditxTemplate,
  pageId: string,
  files: ProjectFiles,
  decode: ImageDecoder<T>,
): Promise<ImageFrameDrawing<T>[]> {
````

**Substituir por:**

````
/**
 * Imagens já decodificadas, pelo caminho normalizado (DEC-023). Guarda a PROMESSA: dois frames
 * com o mesmo caminho leem o arquivo uma vez só. `null` = arquivo não encontrado. Falha e
 * arquivo não encontrado não ficam guardados — o arquivo consertado é tentado de novo.
 */
export type ImageCache<T> = Map<string, Promise<DecodedImage<T> | null>>;

/** Lê e decodifica `path`, passando pelo cache quando há um; `null` se o arquivo não existe. */
async function loadImage<T>(
  path: string,
  files: ProjectFiles,
  decode: ImageDecoder<T>,
  cache: ImageCache<T> | undefined,
): Promise<DecodedImage<T> | null> {
  const key = normalizeProjectPath(path) ?? path;
  const cached = cache?.get(key);
  if (cached !== undefined) return cached;
  const loading = files.read(path).then((blob) => (blob === null ? null : decode(blob)));
  cache?.set(key, loading);
  try {
    const image = await loading;
    if (image === null) cache?.delete(key);
    return image;
  } catch (error) {
    cache?.delete(key);
    throw error;
  }
}

/**
 * Desenhos de todos os frames de imagem visíveis da página `pageId`, por `zIndex`
 * crescente (empate mantém a ordem dos frames). Frame estático tenta o `src` e depois o
 * `fallback`; frame de dados ainda não tem valor de CSV e tenta só o `fallback`. Sem
 * caminho a tentar → `placeholder`; caminho(s) tentado(s) e nenhum legível → `error`.
 * Um frame que falha não derruba os outros.
 *
 * @param cache - imagens já decodificadas (DEC-023); sem ele, toda chamada lê e decodifica
 * @throws Error (promessa rejeitada) se a página não existe.
 */
export async function prepareImageDrawings<T>(
  template: EditxTemplate,
  pageId: string,
  files: ProjectFiles,
  decode: ImageDecoder<T>,
  cache?: ImageCache<T>,
): Promise<ImageFrameDrawing<T>[]> {
````

## Edição 2c — `src/canvas/FrameImage.ts` · o laço lê pelo cache

**Âncora:**

````
          const blob = await files.read(path);
          if (blob === null) {
            failures.push(`${path}: não encontrado`);
            continue;
          }
          const image = await decode(blob);
````

**Substituir por:**

````
          const image = await loadImage(path, files, decode, cache);
          if (image === null) {
            failures.push(`${path}: não encontrado`);
            continue;
          }
````

## Edição 3 — `src/store/documentStore.ts` · rótulo «redimensionar» no histórico

A verificação `hasFrame` logo acima continua — o rótulo só olha o tamanho de antes.

**Âncora:**

````
        edit(`mover ${frameId}`, (draft) => {
````

**Substituir por:**

````
        // Rótulo do histórico: o tamanho mudou = redimensionar; só a posição = mover (DEC-023).
        const before = get()
          .template.pages.flatMap((page) => page.frames)
          .find((frame) => frame.id === frameId)?.transform;
        const resized =
          before !== undefined &&
          (before.width !== transform.width || before.height !== transform.height);
        edit(`${resized ? 'redimensionar' : 'mover'} ${frameId}`, (draft) => {
````

## Edição 4 — `src/canvas/SelectionGeometry.ts` · criar (parte pura da seleção)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
/**
 * SelectionGeometry.ts
 *
 * A parte PURA da seleção (sem Fabric, sem DOM), testável em Node (DEC-021, DEC-023): quais
 * frames da página ganham alça, quais alças de redimensionar cada um mostra, e como a caixa
 * arrastada na tela vira o `transform` novo do frame, na unidade do documento. Quem mexe no
 * Fabric é o `SelectionManager.ts`.
 */

import type { DocumentUnit, EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { DrawRect } from '../text/TextDrawing';
import type { Frame, Transform } from '../types/frame.types';
import { fromPx, toPx } from './PageGeometry';

/** Em que eixos as alças redimensionam o frame. */
export type ResizeAxes = 'both' | 'width' | 'height';

/** Um frame que pode ser selecionado na página mostrada. */
export interface SelectableFrame {
  frameId: string;
  /**
   * Caixa do frame no mundo (px CSS). Sai do `transform`; no texto que cresce, o `CanvasEngine`
   * a troca pela caixa do desenho quando o texto chega (`TextDrawing.frame`).
   */
  rect: DrawRect;
  axes: ResizeAxes;
}

/** As nove alças do Fabric: quatro cantos, quatro meios e a de girar (`mtr`). */
export type ControlKey = 'tl' | 'tr' | 'bl' | 'br' | 'ml' | 'mr' | 'mt' | 'mb' | 'mtr';

/** Empate de `zIndex`: a mesma ordem do desenho (forma < imagem < texto — `CanvasEngine.relayer`). */
const TYPE_ORDER = { shape: 0, image: 1, text: 2 } as const;

/** Tamanho mínimo de um frame redimensionado na tela, em mm: o validador aceita zero. */
export const MIN_FRAME_MM = 1;

/**
 * Eixos que as alças do frame redimensionam (DEC-023): o texto que cresce sozinho só mostra as
 * alças do eixo que NÃO cresce — arrastar no outro gravaria um tamanho que o desenho ignora.
 */
export function resizeAxes(frame: Frame): ResizeAxes {
  if (frame.type !== 'text') return 'both';
  if (frame.overflow.mode === 'grow-vertical') return 'width';
  if (frame.overflow.mode === 'grow-horizontal') return 'height';
  return 'both';
}

/**
 * Quais alças aparecem para estes eixos. A de girar nunca: nenhum desenho mostra rotação ainda
 * (IDEAS, «Rotação de frame desenhada»).
 */
export function visibleControls(axes: ResizeAxes): Record<ControlKey, boolean> {
  const corners = axes === 'both';
  const sides = axes !== 'height'; // ml/mr mudam a largura
  const ends = axes !== 'width'; // mt/mb mudam a altura
  return {
    tl: corners,
    tr: corners,
    bl: corners,
    br: corners,
    ml: sides,
    mr: sides,
    mt: ends,
    mb: ends,
    mtr: false,
  };
}

/**
 * Frames da página `pageId` que ganham alça: visíveis e não travados, na ordem do desenho
 * (`zIndex`; empate: forma, imagem, texto; depois a ordem da página). O último fica por cima
 * no clique.
 *
 * @throws Error se a página não existe.
 */
export function selectableFrames(template: EditxTemplate, pageId: string): SelectableFrame[] {
  const page = template.pages.find((candidate) => candidate.id === pageId);
  if (page === undefined) {
    throw new Error(`A página "${pageId}" não existe no template.`);
  }
  return page.frames
    .map((frame, index) => ({ frame, index }))
    .filter(({ frame }) => frame.visible && !frame.lock)
    .sort(
      (a, b) =>
        a.frame.zIndex - b.frame.zIndex ||
        TYPE_ORDER[a.frame.type] - TYPE_ORDER[b.frame.type] ||
        a.index - b.index,
    )
    .map(({ frame }) => ({
      frameId: frame.id,
      rect: frameRect(frame, template.document),
      axes: resizeAxes(frame),
    }));
}

/** O frame `frameId` em qualquer página (ids são únicos no documento — o validador cobra). */
export function findFrame(template: EditxTemplate, frameId: string): Frame | undefined {
  for (const page of template.pages) {
    const frame = page.frames.find((candidate) => candidate.id === frameId);
    if (frame !== undefined) return frame;
  }
  return undefined;
}

/**
 * O `transform` novo de um frame depois de um arraste: a diferença entre a caixa arrastada
 * (`next`) e a de partida (`base`), em px CSS do mundo, somada ao `transform` atual e convertida
 * para a unidade do documento (arredondada a 0,01 por `fromPx`). Somar a DIFERENÇA — e não
 * converter a posição da caixa — é o que mantém certo o texto que cresce: a caixa dele é a do
 * desenho (depois do grow e da âncora), não a do `transform`. Lado que não mudou fica com o
 * valor exato de antes; largura e altura redimensionadas não ficam abaixo de `MIN_FRAME_MM`.
 * A rotação não muda.
 *
 * @param transform - o `transform` atual do frame, na unidade do documento
 * @param base - a caixa da alça antes do arraste, em px CSS do mundo
 * @param next - a caixa da alça ao soltar, em px CSS do mundo
 * @param unit - unidade do documento
 */
export function transformFromHandle(
  transform: Transform,
  base: DrawRect,
  next: DrawRect,
  unit: DocumentUnit,
): Transform {
  const min = fromPx(toPx(MIN_FRAME_MM, 'mm'), unit);
  const along = (value: number, delta: number): number =>
    delta === 0 ? value : fromPx(toPx(value, unit) + delta, unit);
  const size = (value: number, delta: number): number =>
    delta === 0 ? value : Math.max(min, along(value, delta));
  return {
    x: along(transform.x, next.left - base.left),
    y: along(transform.y, next.top - base.top),
    width: size(transform.width, next.width - base.width),
    height: size(transform.height, next.height - base.height),
    rotation: transform.rotation,
  };
}

/** Os dois `transform` são iguais campo a campo. */
export function sameTransform(a: Transform, b: Transform): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.rotation === b.rotation
  );
}
````

## Edição 5 — `src/canvas/SelectionManager.ts` · criar (alças no Fabric)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
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
````

## Edição 6 — `src/canvas/CanvasEngine.ts` · substituir (alças dentro do engine)

O que muda em relação ao arquivo de hoje: o comentário do módulo e o de `FRAME_OBJECT`; `CanvasEngineOptions.selection`; `preserveObjectStacking: true` no `Canvas`; o campo `selection` (o `SelectionManager`) e o `frameOf` (id do frame de cada objeto de conteúdo), preenchido nos três `set*Drawings`; `setTextDrawings` chama `selection.updateBase`; os métodos públicos `setFrames`, `setSelected`, `resetFrame`; `resize` chama `selection.setPixelRatio`; o privado `contentOf`; uma frase no comentário do `relayer`. O resto é o arquivo de hoje, sem mudança.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `b9c32b667ecf1bbae066e4e6fed6bde00061bcac` — Edição 0; diferente = **PARE**):

````
/**
 * CanvasEngine.ts
 *
 * Adaptador FINO do Fabric 6 (DEC-016): monta o canvas num elemento, desenha a
 * página (área de corte + guia de sangria), enquadra com zoom para caber e
 * libera tudo ao descartar. Toda conta mora em `PageGeometry.ts`; aqui só se
 * repassam valores ao Fabric. As alças de seleção são do `SelectionManager.ts`,
 * que vive aqui dentro (DEC-023).
 */

import { Canvas, FabricImage, Path, Rect } from 'fabric';
import type { FabricObject } from 'fabric';
import type { DocumentSettings } from '../template/TemplateSchema';
import type { DrawRect, TextFrameDrawing } from '../text/TextDrawing';
import type { ImageFrameDrawing } from './FrameImage';
import type { ShapeFrameDrawing } from './FrameShape';
import { centeredOffset, fitZoom, pageBox } from './PageGeometry';
import type { CanvasSize, PageBox } from './PageGeometry';
import type { SelectableFrame } from './SelectionGeometry';
import { SelectionManager } from './SelectionManager';
import type { SelectionCallbacks } from './SelectionManager';

export interface CanvasEngineOptions {
  /** Margem em px CSS ao redor da página no enquadramento. Padrão: 32. */
  fitMargin?: number;
  /** Para onde vão o clique num frame e o fim de um arraste (DEC-023). */
  selection?: SelectionCallbacks;
}

/**
 * Opções comuns aos objetos de frame: canto superior esquerdo como origem; o conteúdo nunca é
 * interativo — quem recebe o clique é a alça do `SelectionManager`.
 */
const FRAME_OBJECT = {
  originX: 'left',
  originY: 'top',
  selectable: false,
  evented: false,
} as const;

/** Recorte no mundo (`absolutePositioned`: não acompanha o objeto recortado). */
function clipRect(rect: DrawRect, radius: number): Rect {
  return new Rect({
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    rx: radius,
    ry: radius,
    originX: 'left',
    originY: 'top',
    absolutePositioned: true,
  });
}

/** Frame que não pôde ser desenhado: retângulo vermelho tracejado no lugar dele. */
function frameErrorRect(rect: DrawRect): Rect {
  return new Rect({
    ...FRAME_OBJECT,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    fill: 'rgba(217, 48, 37, 0.08)',
    stroke: '#D93025',
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    strokeUniform: true,
  });
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
      selection: false,
      backgroundColor: '#E5E5E5',
      renderOnAddRemove: false,
      // DESLIGADO de propósito (FIX-002): o retina do Fabric 6 trunca `css × dpr` e ignora
      // DPR < 1, e o buffer fica de tamanho diferente da tela. Quem dá os px do dispositivo
      // é o `resize`, já medidos pelo navegador.
      enableRetinaScaling: false,
      // O clique acerta o frame de cima pela ordem das alças, mesmo com outro selecionado
      // (sem isto o Fabric dá preferência ao objeto ativo — DEC-023).
      preserveObjectStacking: true,
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

    for (const drawing of drawings) {
      if (drawing.kind === 'text') {
        for (const data of drawing.paths) {
          // Sem left/top: o Path se posiciona pelas próprias coordenadas (Fabric 6, DEC-018).
          const path = new Path(data, { fill: drawing.fill, selectable: false, evented: false });
          if (drawing.clip !== null) path.clipPath = clipRect(drawing.clip, 0);
          this.frameZ.set(path, drawing.zIndex);
          this.frameOf.set(path, drawing.frameId);
          this.textObjects.push(path);
        }
      } else {
        const rect = frameErrorRect(drawing.frame);
        this.frameZ.set(rect, drawing.zIndex);
        this.frameOf.set(rect, drawing.frameId);
        this.textObjects.push(rect);
      }
      // A caixa do texto que cresce só se conhece agora (depois do grow e da âncora).
      this.selection.updateBase(drawing.frameId, drawing.frame);
    }

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
      let object: FabricObject;
      if (drawing.kind === 'shape') {
        const { stroke } = drawing;
        // Sem left/top: o Path se posiciona pelas próprias coordenadas (Fabric 6, DEC-018).
        object = new Path(drawing.path, {
          fill: drawing.fill,
          stroke: stroke === null ? null : stroke.color,
          strokeWidth: stroke === null ? 0 : stroke.width,
          strokeDashArray: stroke === null ? null : stroke.dash,
          strokeLineCap: stroke === null ? 'butt' : stroke.cap,
          selectable: false,
          evented: false,
        });
      } else {
        object = frameErrorRect(drawing.frame);
      }
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
      let object: FabricObject;
      if (drawing.kind === 'image') {
        const { image, place } = drawing;
        object = new FabricImage(image.source, {
          ...FRAME_OBJECT,
          left: place.left,
          top: place.top,
          scaleX: place.width / image.width,
          scaleY: place.height / image.height,
        });
        object.clipPath = clipRect(drawing.frame, drawing.radius);
      } else if (drawing.kind === 'placeholder') {
        object = new Rect({
          ...FRAME_OBJECT,
          left: drawing.frame.left,
          top: drawing.frame.top,
          width: drawing.frame.width,
          height: drawing.frame.height,
          rx: drawing.radius,
          ry: drawing.radius,
          fill: '#F1F3F4',
          stroke: '#9AA0A6',
          strokeWidth: 1,
          strokeDashArray: [4, 4],
          strokeUniform: true,
        });
      } else {
        object = frameErrorRect(drawing.frame);
      }
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

  /** Mostra este frame como selecionado, ou nenhum (`null`). */
  setSelected(frameId: string | null): void {
    this.assertAlive();
    this.selection.setSelected(frameId);
  }

  /** Devolve a alça e o conteúdo do frame ao lugar do documento (arraste que não mudou nada). */
  resetFrame(frameId: string): void {
    this.assertAlive();
    this.selection.resetFrame(frameId);
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

## Edição 7 — `src/ui/CanvasView.tsx` · substituir (seleção ligada aos stores, cache de imagens)

O que muda: três props novas (`selectedIds`, `onSelect`, `onFrameChange`); o `templateRef` vira `latest` (template + as duas funções); o engine nasce com os callbacks da seleção; o efeito de desenho chama `setFrames(selectableFrames(...))` e passa o cache ao `prepareImageDrawings`; um efeito novo mostra a seleção. O ciclo de montagem, os dois `ResizeObserver` e a limpeza do FIX-001 (`element.remove()`) ficam como estão.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `8e47c4ccd21eedc6759e43a5a6d3e1973db53b7c` — Edição 0; diferente = **PARE**):

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

export interface CanvasViewProps {
  /** Template cujo documento e página serão mostrados. */
  template: EditxTemplate;
  /** Id da página a mostrar. */
  pageId: string;
  /** Arquivos do projeto (imagens), lidos por caminho relativo ao `.editx` (DEC-019). */
  files: ProjectFiles;
  /** Ids dos frames selecionados (`selectionStore`); o canvas mostra o primeiro. */
  selectedIds: readonly string[];
  /** O usuário clicou num frame (`[id]`) ou fora deles (`[]`). */
  onSelect: (ids: string[]) => void;
  /** O usuário soltou um arraste que muda o frame: o `transform` novo, já na unidade do documento. */
  onFrameChange: (frameId: string, transform: Transform) => void;
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
  onFrameChange,
}: CanvasViewProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  // Sempre as props mais recentes: o efeito de montagem desenha já na criação, e os eventos do
  // canvas (criados uma vez) leem o template e as funções de agora.
  const latest = useRef({ template, onSelect, onFrameChange });
  latest.current = { template, onSelect, onFrameChange };

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const element = document.createElement('canvas');
    host.appendChild(element);

    const engine = new CanvasEngine(element, {
      selection: {
        onSelect: (frameId) => latest.current.onSelect(frameId === null ? [] : [frameId]),
        onFrameChange: (frameId, base, next) => {
          const { template: current, onFrameChange: change } = latest.current;
          const frame = findFrame(current, frameId);
          if (frame === undefined) return;
          const transform = transformFromHandle(frame.transform, base, next, current.document.unit);
          // Arraste que, arredondado, não muda nada: o documento não muda e a página não vai ser
          // redesenhada — então a alça e o conteúdo voltam ao lugar aqui.
          if (sameTransform(transform, frame.transform)) engine.resetFrame(frameId);
          else change(frameId, transform);
        },
      },
    });
    engineRef.current = engine;
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
  const selectedId = selectedIds[0] ?? null;
  useEffect(() => {
    engineRef.current?.setSelected(selectedId);
  }, [selectedId, template, pageId]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
}
````

## Edição 8 — `src/ui/EditorShortcuts.ts` · criar (atalhos de teclado)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
/**
 * EditorShortcuts.ts
 *
 * Atalhos de teclado do editor (DEC-021, DEC-023): desfazer, refazer e limpar a seleção. Ficam
 * no host, não no canvas: valem para a janela inteira, e o canvas não tem foco de teclado.
 * `shortcutFor` é pura (testada em Node); `useEditorShortcuts` só a liga ao `keydown`.
 */

import { useEffect } from 'react';
import type { EditorStores } from '../store/documentStore';

/** O que uma tecla faz no editor. */
export type EditorShortcut = 'undo' | 'redo' | 'deselect';

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
 * Ctrl + Y também (o atalho do Windows); Esc limpa a seleção. Com Alt, nada.
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
  return null;
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
export function useEditorShortcuts(stores: EditorStores): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return;
      const shortcut = shortcutFor(event);
      if (shortcut === null) return;
      event.preventDefault();
      if (shortcut === 'undo') stores.document.getState().undo();
      else if (shortcut === 'redo') stores.document.getState().redo();
      else stores.selection.getState().clear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stores]);
}
````

## Edição 9 — `src/App.tsx` · substituir (host com seleção e atalhos)

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `95a39842d23c18158ae1deb9f87d52bfcce431ba` — Edição 0; diferente = **PARE**):

````
import { useStore } from 'zustand';
import { UrlProjectFiles } from './project/ProjectFiles';
import { createEditorStores } from './store/documentStore';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import type { Transform } from './types/frame.types';
import { CanvasView } from './ui/CanvasView';
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

// Só no `npm run dev`: o console alcança os stores (ex.: `__editx.document.getState().undo()`).
if (import.meta.env.DEV) (window as unknown as { __editx?: typeof stores }).__editx = stores;

/** O clique no canvas troca a seleção (DEC-023). No escopo do módulo: a mesma função sempre. */
const selectFrames = (ids: string[]): void => stores.selection.getState().select(ids);

/** O arraste solto grava o `transform` novo — uma entrada de desfazer por arraste (DEC-021). */
const changeFrame = (frameId: string, transform: Transform): void =>
  stores.document.getState().setFrameTransform(frameId, transform);

/**
 * Host de desenvolvimento: mostra a página ativa do documento no canvas, ocupando a janela,
 * com seleção, mover, redimensionar e os atalhos de desfazer. Some quando existir a UI do editor.
 */
export default function App() {
  const template = useStore(stores.document, (state) => state.template);
  const pageId = useStore(stores.document, (state) => state.pageId);
  const selectedIds = useStore(stores.selection, (state) => state.selectedIds);
  useEditorShortcuts(stores);
  return (
    <CanvasView
      template={template}
      pageId={pageId}
      files={exampleFiles}
      selectedIds={selectedIds}
      onSelect={selectFrames}
      onFrameChange={changeFrame}
    />
  );
}
````

## Edição 10a — `src/canvas/SelectionGeometry.test.ts` · criar (testes A1–A14)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { Transform } from '../types/frame.types';
import { toPx } from './PageGeometry';
import {
  findFrame,
  sameTransform,
  selectableFrames,
  transformFromHandle,
  visibleControls,
} from './SelectionGeometry';

const template = (): EditxTemplate => structuredClone(catalogoSimplesExample);
const mm = (value: number): number => toPx(value, 'mm');

/** O `transform` da foto da página de produto do exemplo: 10, 60, 190 × 120 mm. */
const FOTO: Transform = { x: 10, y: 60, width: 190, height: 120, rotation: 0 };

describe('selectableFrames', () => {
  it('A1: o frame travado não ganha alça (capa: só o título)', () => {
    const frames = selectableFrames(template(), 'page-capa');
    expect(frames.map((frame) => frame.frameId)).toEqual(['frame-titulo-capa']);
  });

  it('A2: na ordem do desenho — zIndex, depois a ordem da página', () => {
    const frames = selectableFrames(template(), 'page-produto');
    expect(frames.map((frame) => frame.frameId)).toEqual([
      'frame-foto-produto',
      'frame-nome-produto',
      'frame-preco-produto',
    ]);
  });

  it('A3: texto que cresce na vertical só redimensiona a largura; o resto, os dois eixos', () => {
    const axes = selectableFrames(template(), 'page-produto').map((frame) => frame.axes);
    // foto (imagem), nome (grow-vertical), preço (fixed-shrink)
    expect(axes).toEqual(['both', 'width', 'both']);
  });

  it('A4: grow-horizontal só redimensiona a altura', () => {
    const t = template();
    const nome = findFrame(t, 'frame-nome-produto');
    if (nome?.type !== 'text') throw new Error('o exemplo mudou: o nome não é texto');
    nome.overflow = { mode: 'grow-horizontal', anchor: 'top-left' };
    const frame = selectableFrames(t, 'page-produto').find((f) => f.frameId === nome.id);
    expect(frame?.axes).toBe('height');
  });

  it('A5: frame invisível não ganha alça', () => {
    const t = template();
    const nome = findFrame(t, 'frame-nome-produto');
    if (nome === undefined) throw new Error('o exemplo mudou: sem o nome do produto');
    nome.visible = false;
    expect(selectableFrames(t, 'page-produto').map((frame) => frame.frameId)).toEqual([
      'frame-foto-produto',
      'frame-preco-produto',
    ]);
  });

  it('A6: a caixa da alça é a do transform, no mundo (com a sangria)', () => {
    const t = template();
    const [foto] = selectableFrames(t, 'page-produto');
    const frame = findFrame(t, 'frame-foto-produto');
    if (frame === undefined) throw new Error('o exemplo mudou: sem a foto');
    expect(foto.rect).toEqual(frameRect(frame, t.document));
  });

  it('A7: página inexistente lança', () => {
    expect(() => selectableFrames(template(), 'nao-existe')).toThrow('nao-existe');
  });
});

describe('visibleControls', () => {
  it('A8: a alça de girar nunca aparece; cada eixo mostra só as suas', () => {
    expect(visibleControls('both')).toEqual({
      tl: true,
      tr: true,
      bl: true,
      br: true,
      ml: true,
      mr: true,
      mt: true,
      mb: true,
      mtr: false,
    });
    const width = visibleControls('width');
    expect(Object.keys(width).filter((key) => width[key as keyof typeof width])).toEqual([
      'ml',
      'mr',
    ]);
    const height = visibleControls('height');
    expect(Object.keys(height).filter((key) => height[key as keyof typeof height])).toEqual([
      'mt',
      'mb',
    ]);
  });
});

describe('transformFromHandle', () => {
  const base = { left: mm(13), top: mm(63), width: mm(190), height: mm(120) };

  it('A9: mover 5 mm para a direita muda só o x', () => {
    const next = { ...base, left: base.left + mm(5) };
    expect(transformFromHandle(FOTO, base, next, 'mm')).toEqual({ ...FOTO, x: 15 });
  });

  it('A10: soma a DIFERENÇA — a caixa de partida do texto que cresce não é o transform', () => {
    // Caixa do desenho de um grow-vertical com âncora no meio: em outro lugar e mais alta.
    const grown = { left: 50, top: 400, width: 700, height: 300 };
    const next = { ...grown, left: grown.left + mm(2), width: grown.width - mm(10) };
    const title: Transform = { x: 10, y: 120, width: 190, height: 40, rotation: 0 };
    expect(transformFromHandle(title, grown, next, 'mm')).toEqual({
      ...title,
      x: 12,
      width: 180,
    });
  });

  it('A11: arredonda a 0,01 da unidade', () => {
    const next = { ...base, left: base.left + 1 };
    expect(transformFromHandle(FOTO, base, next, 'mm').x).toBe(10.26);
  });

  it('A12: o lado que não mudou fica com o valor exato de antes, e a rotação passa igual', () => {
    const odd: Transform = { x: 10.005, y: 60.001, width: 190.0049, height: 120, rotation: 15 };
    const next = { ...base, height: base.height + mm(10) };
    expect(transformFromHandle(odd, base, next, 'mm')).toEqual({ ...odd, height: 130 });
  });

  it('A13: redimensionar não desce de 1 mm (0,1 cm; 3,78 px)', () => {
    const next = { ...base, width: 0.5, height: 0.5 };
    const small = transformFromHandle(FOTO, base, next, 'mm');
    expect([small.width, small.height]).toEqual([1, 1]);
    const cm: Transform = { x: 1, y: 6, width: 19, height: 12, rotation: 0 };
    expect(transformFromHandle(cm, base, next, 'cm').width).toBe(0.1);
    const px: Transform = { x: 38, y: 227, width: 718, height: 454, rotation: 0 };
    expect(transformFromHandle(px, base, next, 'px').width).toBe(3.78);
  });

  it('A14: arraste que volta ao lugar devolve um transform igual (sameTransform)', () => {
    const back = transformFromHandle(FOTO, base, { ...base }, 'mm');
    expect(sameTransform(back, FOTO)).toBe(true);
    expect(sameTransform({ ...FOTO, x: 10.01 }, FOTO)).toBe(false);
  });
});
````

## Edição 10b — `src/ui/EditorShortcuts.test.ts` · criar (testes K1–K5)

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
import { describe, expect, it } from 'vitest';
import { shortcutFor } from './EditorShortcuts';
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
});
````

## Edição 10c — `src/canvas/PageGeometry.test.ts` · import do `fromPx` no teste

**Âncora:**

````
  fitZoom,
  MAX_ZOOM,
````

**Substituir por:**

````
  fitZoom,
  fromPx,
  MAX_ZOOM,
````

## Edição 10d — `src/canvas/PageGeometry.test.ts` · testes G16–G18 do `fromPx`

**Âncora:**

````
      pixelRatio: 1.25,
    });
  });
});
````

**Substituir por:**

````
      pixelRatio: 1.25,
    });
  });

  it('G16: fromPx desfaz o toPx — 96 px = 25,4 mm = 2,54 cm', () => {
    expect(fromPx(96, 'mm')).toBe(25.4);
    expect(fromPx(96, 'cm')).toBe(2.54);
    expect(fromPx(96, 'px')).toBe(96);
  });

  it('G17: ida e volta exata para valores com duas casas', () => {
    for (const unit of ['mm', 'cm', 'px'] as const) {
      for (const value of [0, 0.01, 10, 12.34, 297]) {
        expect(fromPx(toPx(value, unit), unit)).toBe(value);
      }
    }
  });

  it('G18: arredonda a 0,01 da unidade e nunca devolve -0', () => {
    expect(fromPx(toPx(10, 'mm') + 1, 'mm')).toBe(10.26);
    expect(Object.is(fromPx(-0.001, 'mm'), 0)).toBe(true);
  });
});
````

## Edição 10e — `src/canvas/FrameImage.test.ts` · import do `ImageCache` no teste

**Âncora:**

````
import type { DecodedImage } from './FrameImage';
````

**Substituir por:**

````
import type { DecodedImage, ImageCache } from './FrameImage';
````

## Edição 10f — `src/canvas/FrameImage.test.ts` · testes M10–M12 do cache

**Âncora:**

````
    expect(drawings.map((d) => d.frameId)).toEqual(['foto-fundo', 'frame-foto-produto']);
  });
});
````

**Substituir por:**

````
    expect(drawings.map((d) => d.frameId)).toEqual(['foto-fundo', 'frame-foto-produto']);
  });

  it('M10: com cache, a segunda chamada não lê o arquivo de novo', async () => {
    const t = template();
    let reads = 0;
    const files = fakeFiles(sample);
    const counting: ProjectFiles = {
      read: (path) => {
        reads += 1;
        return files.read(path);
      },
    };
    const cache: ImageCache<string> = new Map();
    await prepareImageDrawings(t, 'page-produto', counting, fakeDecode, cache);
    const [drawing] = await prepareImageDrawings(t, 'page-produto', counting, fakeDecode, cache);
    expect(reads).toBe(1);
    expect(drawing.kind).toBe('image');
  });

  it('M11: falha não fica no cache — o arquivo consertado é lido de novo', async () => {
    const t = template();
    makeStatic(t, './imagens/foto.png');
    const entries: Record<string, string> = { 'imagens/foto.png': 'lixo' };
    const files = fakeFiles(entries); // lê `entries` na hora da leitura
    const cache: ImageCache<string> = new Map();
    const [broken] = await prepareImageDrawings(t, 'page-produto', files, fakeDecode, cache);
    expect(broken.kind).toBe('error');
    entries['imagens/foto.png'] = '800x800';
    const [fixed] = await prepareImageDrawings(t, 'page-produto', files, fakeDecode, cache);
    expect(fixed.kind).toBe('image');
    expect(cache.size).toBe(1);
  });

  it('M12: dois frames com o mesmo caminho leem o arquivo uma vez só', async () => {
    const t = template();
    t.pages[1].frames.unshift({ ...photo(t), id: 'foto-copia', zIndex: 1 });
    let reads = 0;
    const files = fakeFiles(sample);
    const counting: ProjectFiles = {
      read: (path) => {
        reads += 1;
        return files.read(path);
      },
    };
    const drawings = await prepareImageDrawings(t, 'page-produto', counting, fakeDecode, new Map());
    expect(drawings.map((d) => d.kind)).toEqual(['image', 'image']);
    expect(reads).toBe(1);
  });
});
````

## Edição 10g — `src/store/documentStore.test.ts` · teste H14 do rótulo

**Âncora:**

````
    doc.setFrameTransform(FOTO, { ...transformOf(stores, FOTO) });
    expect(calls).toBe(2);
  });
});
````

**Substituir por:**

````
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
});
````

## Edição 11a — `meta/STATUS.md` · nota de revisão

**Âncora:**

````
**Mudanças nesta revisão (2026-11-18, wo0018):** merge do KCM v1.151.0 feito (DEC-022); «Em Progresso» vazio e o
próximo item é o `SelectionManager.ts`. A nota anterior (wo0017) saiu — o que ela registrava está no log de
2026-11-18.
````

**Substituir por:**

````
**Mudanças nesta revisão (2026-11-19, wo0020):** seleção no canvas (DEC-023): entra «Seleção, mover e
redimensionar» em Funcionando, o `SelectionManager.ts` sai do backlog como feito e o próximo item é a multi-seleção
com alinhamento, distribuição e setas. A nota anterior (wo0018) saiu — o merge do KCM está na DEC-022 e no log de
2026-11-18.
````

## Edição 11b — `meta/STATUS.md` · Funcionando (seleção)

A âncora é a linha inteira (uma linha longa); o texto novo a repete no fim (11b) ou no começo (13).

**Âncora:**

````
- **Documento nos stores, com desfazer e refazer** *(wo0016, DEC-021; conferido pelo chat no navegador embutido em 2026-11-18)* — `createEditorStores(template)` (`store/documentStore.ts`) guarda uma cópia do template e a página ativa; toda mudança passa por `edit` (`produceWithPatches` do Immer) e entra no `historyStore` (limite 100; mudança vazia não entra); `undo`/`redo` aplicam os patches; `selectionStore` guarda os ids selecionados. Página e seleção não entram no histórico. Primeira ação: `setFrameTransform`. O `App` lê o documento com `useStore`; no `npm run dev` os stores ficam em `window.__editx`. Testado em Node (H1–H13)
````

**Substituir por:**

````
- **Seleção, mover e redimensionar no canvas** *(wo0020, DEC-023; conferência de tela pelo chat a fazer)* — clicar num frame não travado o seleciona (`selectionStore`); clicar fora ou Esc limpa; arrastar move o frame com o conteúdo acompanhando; as alças redimensionam só a caixa até soltar (canto mantém a proporção, Shift solta; texto que cresce só mostra as alças do eixo que não cresce); ao soltar, UMA entrada de desfazer com o `transform` novo arredondado a 0,01 da unidade (`fromPx`, mínimo 1 mm); Ctrl+Z desfaz, Ctrl+Shift+Z e Ctrl+Y refazem. Uma alça transparente por frame (`canvas/SelectionManager.ts`, dentro do `CanvasEngine`), a parte pura em `canvas/SelectionGeometry.ts`, atalhos em `ui/EditorShortcuts.ts`; imagens decodificadas em cache por caminho (`ImageCache`). Sem alça de girar. Testado em Node (A1–A14, G16–G18, M10–M12, H14, K1–K5)
- **Documento nos stores, com desfazer e refazer** *(wo0016, DEC-021; conferido pelo chat no navegador embutido em 2026-11-18)* — `createEditorStores(template)` (`store/documentStore.ts`) guarda uma cópia do template e a página ativa; toda mudança passa por `edit` (`produceWithPatches` do Immer) e entra no `historyStore` (limite 100; mudança vazia não entra); `undo`/`redo` aplicam os patches; `selectionStore` guarda os ids selecionados. Página e seleção não entram no histórico. Primeira ação: `setFrameTransform`. O `App` lê o documento com `useStore`; no `npm run dev` os stores ficam em `window.__editx`. Testado em Node (H1–H13)
````

## Edição 11c — `meta/STATUS.md` · Em Progresso

**Âncora:**

````
*Nada em progresso — o próximo item do backlog é o `SelectionManager.ts`.*
````

**Substituir por:**

````
*Nada em progresso — o próximo item do backlog é a multi-seleção com alinhamento, distribuição e setas (DEC-023).*
````

## Edição 11d — `meta/STATUS.md` · Backlog (CanvasEngine)

A âncora é a linha inteira.

**Âncora:**

````
- [x] `CanvasEngine.ts` — wrapper Fabric.js: ciclo de vida, página e zoom (wo0004, DEC-016; eventos de objeto entram com `SelectionManager.ts`)
````

**Substituir por:**

````
- [x] `CanvasEngine.ts` — wrapper Fabric.js: ciclo de vida, página e zoom (wo0004, DEC-016; as alças de seleção do `SelectionManager.ts` vivem nele desde a wo0020)
````

## Edição 11e — `meta/STATUS.md` · Backlog (seleção feita, próximo item)

A âncora é a linha inteira.

**Âncora:**

````
- [ ] `SelectionManager.ts` — seleção simples, mover (o conteúdo acompanha), redimensionar (só a caixa até soltar), Ctrl+Z/Ctrl+Shift+Z, cache das imagens decodificadas — DEC-021 ← **próximo**
````

**Substituir por:**

````
- [x] `SelectionManager.ts` — seleção simples, mover (o conteúdo acompanha), redimensionar (só a caixa até soltar), Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y, cache das imagens decodificadas (wo0020, DEC-021/DEC-023)
- [ ] Multi-seleção (Shift+clique), alinhamento, distribuição e setas para empurrar — DEC-023 ← **próximo**
````

## Edição 11f — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

````
**2026-11-18** — `FrameShape.ts` (wo0014, DEC-020): retângulo, elipse e linha com o traço por dentro do frame. Detalhe
em `logs/2026-11-18.md`. Antes, em 2026-11-17: FIX-002 fechado, DEC-019 e `FrameImage.ts` conferido (`logs/2026-11-17.md`).
Depois: análise da ordem entre seleção e stores, decidida pelo dono (DEC-021), e os stores (wo0016).
**Onde parou:** merge do KCM v1.151.0 fechado (wo0018, DEC-022; pacote movido para `notas-arquivadas/` em 2026-11-19) e Instruções novas coladas no painel do Projeto [relatado pelo dono, 2026-11-19]. Detalhe em `logs/2026-11-19.md`.

---

*Próximo passo: `SelectionManager.ts` — WO a escrever pelo chat (DEC-021).*
````

**Substituir por:**

````
**2026-11-19** — fecho do merge do KCM v1.151.0 (wo0019) e, numa conversa nova, a análise do `SelectionManager.ts`
(`meta/analises/261119-ANALISE-selection-manager.md`, decidida pelo dono: DEC-023) e a wo0020. Detalhe em
`logs/2026-11-19.md`. Antes, em 2026-11-18: `FrameShape.ts` (wo0014), stores (wo0016, DEC-021) e o merge do kit
(wo0018) — `logs/2026-11-18.md`.
**Onde parou:** wo0020 aplicada (seleção, mover, redimensionar, desfazer pelo teclado); falta a conferência de tela
pelo chat no navegador embutido.

---

*Próximo passo: conferência de tela da wo0020 pelo chat; depois, multi-seleção com alinhamento, distribuição e setas
(DEC-023).*
````

## Edição 12 — `meta/ROADMAP.md` · F1 (seleção feita)

**Âncora:**

````
- [ ] `SelectionManager.ts` — seleção, mover, redimensionar (sobre os stores — DEC-021)
````

**Substituir por:**

````
- [x] `SelectionManager.ts` — seleção, mover, redimensionar (alça por frame, cache das imagens, atalhos de desfazer: wo0020, DEC-021/DEC-023)
- [ ] Multi-seleção, alinhamento, distribuição e setas (DEC-023)
````

## Edição 13 — `meta/CHANGELOG.md` · Adicionado (seleção)

A âncora é a linha inteira (uma linha longa); o texto novo a repete no fim (11b) ou no começo (13).

**Âncora:**

````
- Forma no canvas — retângulo (com cantos arredondados), elipse e linha, preenchimento sólido ou nenhum, traço contínuo, tracejado ou pontilhado por dentro do frame (`canvas/FrameShape.ts`, `CanvasEngine.setShapeDrawings`); forma, imagem e texto empilhados pelo `zIndex`; `?page=` na URL do host de desenvolvimento. Ver DEC-020
````

**Substituir por:**

````
- Forma no canvas — retângulo (com cantos arredondados), elipse e linha, preenchimento sólido ou nenhum, traço contínuo, tracejado ou pontilhado por dentro do frame (`canvas/FrameShape.ts`, `CanvasEngine.setShapeDrawings`); forma, imagem e texto empilhados pelo `zIndex`; `?page=` na URL do host de desenvolvimento. Ver DEC-020
- Seleção no canvas — clicar seleciona (Esc ou clique fora limpa), arrastar move o frame com o conteúdo, as alças redimensionam (canto proporcional, Shift solta; texto que cresce só no eixo livre); cada arraste solto é uma entrada de desfazer; Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (`canvas/SelectionManager.ts`, `canvas/SelectionGeometry.ts`, `ui/EditorShortcuts.ts`); `fromPx` em `PageGeometry.ts` (px → unidade do documento, a 0,01); cache das imagens decodificadas (`ImageCache` em `FrameImage.ts`). Ver DEC-023
````

## Edição 14a — `meta/DECISIONS.md` · DEC-021 emendada

**Âncora:**

````
## DEC-021 — Stores antes da seleção; toda mudança do documento passa por um ponto que grava o desfazer

**Data:** 2026-11-18
**Status:** aceita
````

**Substituir por:**

````
## DEC-021 — Stores antes da seleção; toda mudança do documento passa por um ponto que grava o desfazer

**Data:** 2026-11-18
**Status:** aceita — emendada por DEC-023
````

## Edição 14b — `meta/DECISIONS.md` · DEC-023

**Âncora:**

````
## Template para novo ADR (copie e preencha)
````

**Substituir por:**

````
## DEC-023 — Seleção: uma alça por frame, seleção simples, canto proporcional, texto que cresce só no eixo livre

**Data:** 2026-11-19
**Status:** aceita
**Autor:** dono (as três escolhas de comportamento) + chat (análise e desenho)

### Contexto
A DEC-021 fixou o comportamento do arraste (mover com o conteúdo, redimensionar só a caixa até soltar, uma entrada de
desfazer por arraste, `fromPx`, cache das imagens, atalhos). Faltavam o COMO e três escolhas de produto. Análise:
`meta/analises/261119-ANALISE-selection-manager.md` — leitura do código e do fonte do Fabric 6.9.1 (`index.mjs`).

### Decisão
- **Escopo (dono):** só seleção simples — clicar, Esc, clicar no vazio —, mover, redimensionar e desfazer pelo
  teclado. Multi-seleção (Shift+clique), alinhamento, distribuição e setas na WO seguinte; encaixe e guias depois.
- **Cantos (dono):** mantêm a proporção e o Shift solta; alças do meio livres — o padrão do Fabric
  (`uniformScaling: true`) e o comportamento do Canva.
- **Texto que cresce (dono):** só as alças do eixo que não cresce — `grow-vertical`, as laterais; `grow-horizontal`,
  as de cima e de baixo; sem cantos.
- **Como (chat):** uma alça (`Rect` transparente) por frame visível e não travado, ATUALIZADA no lugar por `frameId`
  — remover a alça ativa faria o Fabric limpar a seleção. A seleção mora no `selectionStore` e quem a decide é o
  clique (`mouse:down`); os eventos `selection:*` do Fabric não são usados, porque também disparam quando o código
  troca o objeto ativo. Ao mover, o conteúdo e os recortes andam com a alça. Ao soltar, `transform` novo = `transform`
  atual + a diferença da caixa (o texto que cresce tem caixa diferente do `transform`), arredondado a 0,01 da unidade
  (`fromPx`), mínimo 1 mm. Sem alça de girar (nada desenha rotação). `preserveObjectStacking` ligado. Controles ×
  `pixelRatio`. Cache das imagens decodificadas por caminho, um por pasta de projeto. Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y e
  Esc no host.

### Alternativas consideradas
- **Multi-seleção já** — o `ActiveSelection` do Fabric passa os objetos para coordenadas relativas ao grupo; é outra
  frente, com outros testes.
- **Canto livre, Shift mantém a proporção** (Figma) — o produto mira o público do Canva.
- **Arrastar no eixo que cresce troca o frame para fixo** (Figma) — muda o `overflow.mode` no mesmo arraste e pede
  uma regra (fixo com redução ou com corte?); fica no IDEAS.
- **Todas as alças no texto que cresce** — a altura gravada seria ignorada e a caixa «voltaria» ao soltar.
- **Sincronizar pela `selection:*` do Fabric** — dispara também com `setActiveObject` e ao remover a alça ativa.

### Consequências
- **Positivas:** a primeira interação do editor; a seleção sobrevive ao redesenho; a imagem não é relida a cada
  mudança; a parte que decide (`SelectionGeometry.ts`) é testada em Node.
- **Negativas:** o `CanvasEngine.ts` passa das ~300 linhas da regra do CONTEXT (extração no IDEAS); a página ainda é
  redesenhada inteira a cada arraste solto.
- **Riscos:** piscar ao soltar — a hipótese de que não pisca (fonte e imagem em cache resolvem antes do próximo
  quadro) não foi medida; vai para a conferência de tela. Controles em DPR ≠ 1 real nunca conferidos (FIX-002).

---

## Template para novo ADR (copie e preencha)
````

## Edição 15 — `meta/IDEAS.md` · Adiadas (seleção)

**Âncora:**

````
- **Polígono com pontos** — `shape: 'polygon'` existe no formato, mas sem os pontos (DEC-020); na F1 sai como
  retângulo vermelho de erro. **Volta quando** um template real precisar de selo ou estrela — aí acrescentar
  `points` (relativos ao frame, de 0 a 1) ao `ShapeFrame` e ao validador, com o exemplo usando o campo.
````

**Substituir por:**

````
- **Polígono com pontos** — `shape: 'polygon'` existe no formato, mas sem os pontos (DEC-020); na F1 sai como
  retângulo vermelho de erro. **Volta quando** um template real precisar de selo ou estrela — aí acrescentar
  `points` (relativos ao frame, de 0 a 1) ao `ShapeFrame` e ao validador, com o exemplo usando o campo.
- **Texto que cresce vira fixo ao arrastar no eixo que cresce** (como o Figma) — adiada na DEC-023: hoje esse frame
  só mostra as alças do eixo livre. Trocar muda o `overflow.mode` no mesmo arraste e pede uma regra (fixo com
  redução ou com corte?). **Volta quando** alguém precisar fixar a altura de um texto que cresce pela tela.
- **Encaixe e guias ao mover** — adiada na DEC-023. **Volta depois** da multi-seleção com alinhamento: as guias
  reaproveitam as contas de alinhar.
- **Contorno ao passar o mouse sobre um frame** — sugestão do chat (2026-11-19). **Volta quando** a conferência ou o
  uso mostrarem que se clica no frame errado (frames sobrepostos, frame de texto sem fundo).
- **`CanvasEngine.ts` acima das ~300 linhas** do CONTEXT (passou com a wo0020). Candidato a sair: a conversão de
  desenho em objeto do Fabric (`setTextDrawings`, `setImageDrawings`, `setShapeDrawings`). **Volta quando** o
  engine ganhar a próxima responsabilidade (a multi-seleção).
````

## Edição 16 — `logs/2026-11-19.md` · seção do chat (conversa 2) — e a sua, depois dela

Depois de aplicar esta edição, acrescente NO FIM do arquivo a sua seção, `## Code (execução) — wo0020`, no formato do `meta/LOG-TEMPLATE.md` (Feito, Entregas, Arquivos modificados, Onde parei), com o corpo escrito por você.

**Âncora:**

````
Merge do KCM v1.151.0 fechado e versionado. Próximo: análise do `SelectionManager.ts` (chat).
````

**Substituir por:**

````
Merge do KCM v1.151.0 fechado e versionado. Próximo: análise do `SelectionManager.ts` (chat).

## Chat (planejamento) — conversa 2: análise do `SelectionManager.ts` e wo0020

### Objetivo
Retomar pelo ritual, ler o `261119-HANDOFF-BRIEF.md` e analisar o `SelectionManager.ts` antes da WO.

### ✅ Feito
- Ritual: wo0019 conferida (`c59c0cf`, empurrado); o relatório dela e o brief movidos para `notas-arquivadas/`.
- Análise `meta/analises/261119-ANALISE-selection-manager.md`: lidos o código e o fonte do Fabric 6.9.1 — remover o
  objeto ativo dispara `selection:cleared`; `setActiveObject` dispara os eventos de seleção; `object:modified` só com
  ação; recorte absoluto deixa o cache sempre sujo; controles desenhados depois dos objetos; `bringObjectToFront`
  reordena sem remover. Dez escolhas técnicas e três perguntas ao dono.
- O dono aceitou as três recomendações (DEC-023, pela wo0020).
- wo0020 escrita e simulada pelo chat numa cópia do repositório (`tsc`, ESLint, Prettier, testes novos com calço do
  `vitest`).
- `meta/CONTEXT.md`, `meta/GLOSSARY.md` («Alça») e a análise (Status: Decidida) gravados pelo chat; versionados pela
  wo0020.
- Medido na simulação: regravar a WO a partir do MESMO arquivo de saída respondeu «written» e deixou a versão anterior
  no disco; o item foi para o CEREBRO, «Técnicas específicas deste projeto» (versionado pela wo0020).

### 📦 Entregas
- `meta/analises/261119-ANALISE-selection-manager.md` e `meta/workorders/261119-wo0020-selecao-mover-redimensionar.md`.

### ⚖️ Decisões tomadas
- DEC-023 — seleção simples, canto proporcional, texto que cresce só no eixo livre, uma alça por frame.

### 💡 Ideias capturadas
**Sugestões geradas:**
- Contorno ao passar o mouse; texto que cresce vira fixo ao arrastar; encaixe e guias; extrair a conversão
  desenho → Fabric do `CanvasEngine` — em «Adiadas» do IDEAS (pela wo0020).

### 📊 Onde parei (estado ao final)
wo0020 entregue para aplicação; depois dela, a conferência de tela pelo chat no navegador embutido.

### ➡️ Próximos passos
- Code: aplicar a wo0020. Chat: conferir a seleção na tela. Depois: multi-seleção, alinhamento, distribuição e setas.
````

---

## Fora de escopo

- Multi-seleção (Shift+clique, `ActiveSelection`), alinhamento, distribuição, setas para empurrar — próxima WO (DEC-023).
- Encaixe/guias, contorno ao passar o mouse, girar, trocar o texto que cresce para fixo — no IDEAS (Edição 15).
- Redesenhar só o frame que mudou, ou `showPage` deixar de limpar os frames — só se a conferência de tela mostrar que pisca.
- Extrair partes do `CanvasEngine.ts` (passa das ~300 linhas) — no IDEAS.
- Qualquer mudança no `selectionStore`, no `historyStore` ou no formato `.editx`.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** sem propriedade de parâmetro no construtor (o `SelectionManager` atribui os campos à mão) e tipos só por `import type` — como está no texto.
- **Os testes novos não importam `fabric` nem o DOM:** `SelectionGeometry.test.ts` e `EditorShortcuts.test.ts` só tocam funções puras (o `isTypingTarget` usa `HTMLElement` e só roda no gancho).
- **Edições 11b, 11d, 11e e 13 têm como âncora uma linha longa inteira** — recorte-a do arquivo, não da tela.
- **Edição 14b:** `## Template para novo ADR (copie e preencha)` tem de existir UMA vez em `meta/DECISIONS.md` antes e depois.
- **Não suba o `npm run dev` para «conferir»** — o dono deixa o dele rodando e o chat confere a tela. Se subir, feche antes de commitar e diga.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `M logs/2026-11-19.md`, `M meta/CEREBRO.md`, `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/GLOSSARY.md`, `M meta/IDEAS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M src/App.tsx`, `M src/canvas/CanvasEngine.ts`, `M src/canvas/FrameImage.test.ts`, `M src/canvas/FrameImage.ts`, `M src/canvas/PageGeometry.test.ts`, `M src/canvas/PageGeometry.ts`, `M src/store/documentStore.test.ts`, `M src/store/documentStore.ts`, `M src/ui/CanvasView.tsx`, `?? meta/analises/261119-ANALISE-selection-manager.md`, `?? meta/workorders/261119-wo0020-selecao-mover-redimensionar.md`, `?? src/canvas/SelectionGeometry.test.ts`, `?? src/canvas/SelectionGeometry.ts`, `?? src/canvas/SelectionManager.ts`, `?? src/ui/EditorShortcuts.test.ts`, `?? src/ui/EditorShortcuts.ts` (25 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 190 testes** (164 + A1–A14, K1–K5, G16–G18, M10–M12, H14 = 26). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida 1 (o lado que não mudou fica exato):** em `src/canvas/SelectionGeometry.ts`, troque temporariamente `delta === 0 ? value : fromPx(toPx(value, unit) + delta, unit);` por `fromPx(toPx(value, unit) + delta, unit);` e rode `npm test` — esperado **falhar só A12** (1 teste). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `SelectionGeometry.test.ts` → `transformFromHandle` → `along`. **NÃO responde:** se o arraste na tela chega a chamar `transformFromHandle` — isso é a conferência de tela do chat.
- [ ] **Prova de vida 2 (o cache):** em `src/canvas/FrameImage.ts`, apague temporariamente a linha `  cache?.set(key, loading);` e rode `npm test` — esperado **falharem M10, M11 e M12** (3 testes). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `FrameImage.test.ts` → `prepareImageDrawings` → `loadImage`. **NÃO responde:** se a imagem deixa de piscar na tela.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -rlE "from '(fabric|react)'" src/canvas/SelectionGeometry.ts src/canvas/SelectionGeometry.test.ts src/ui/EditorShortcuts.test.ts | wc -l` = 0
      - `grep -c "this.canvas.remove(" src/canvas/SelectionManager.ts` = 1 (só a alça de frame que saiu da página)
      - `grep -c "on('selection:" src/canvas/SelectionManager.ts` = 0 (a seleção não escuta os eventos `selection:*` do Fabric)
      - `grep -c "^export function fromPx" src/canvas/PageGeometry.ts` = 1
      - `grep -c "^## DEC-023" meta/DECISIONS.md` = 1
      - `grep -c "^\*\*Status:\*\* aceita — emendada por DEC-023" meta/DECISIONS.md` = 1
      - `grep -c "^## Template para novo ADR" meta/DECISIONS.md` = 1
      - `grep -c "^- \[x\] \`SelectionManager.ts\`" meta/STATUS.md` = 1
      - `grep -c "^- \[x\] \`SelectionManager.ts\`" meta/ROADMAP.md` = 1
      - `grep -c "^- \*\*Seleção, mover e redimensionar no canvas\*\*" meta/STATUS.md` = 1
      - `grep -c "^- \*\*Encaixe e guias ao mover\*\*" meta/IDEAS.md` = 1
      - `grep -c "^## Chat (planejamento) — conversa 2" logs/2026-11-19.md` = 1
      - `grep -c "^## Code (execução) — wo0020" logs/2026-11-19.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] **Teste de tela:** NÃO é seu. O chat confere no navegador embutido com o `npm run dev` do dono (roteiro no chat); o que o painel não cobre vai ao dono.
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0020.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Inclua as saídas cruas acima, `wc -l` dos arquivos novos e do `CanvasEngine.ts`, e qualquer decisão sua. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-19.md meta/CEREBRO.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/GLOSSARY.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md meta/analises/261119-ANALISE-selection-manager.md meta/workorders/261119-wo0020-selecao-mover-redimensionar.md src/App.tsx src/canvas/CanvasEngine.ts src/canvas/FrameImage.ts src/canvas/FrameImage.test.ts src/canvas/PageGeometry.ts src/canvas/PageGeometry.test.ts src/canvas/SelectionGeometry.ts src/canvas/SelectionGeometry.test.ts src/canvas/SelectionManager.ts src/store/documentStore.ts src/store/documentStore.test.ts src/ui/CanvasView.tsx src/ui/EditorShortcuts.ts src/ui/EditorShortcuts.test.ts
```

```
git commit -m "feat(canvas): seleciona, move e redimensiona frames no canvas" -m "Uma alca transparente por frame (SelectionManager) com a parte pura testada (SelectionGeometry); ao mover o conteudo acompanha, ao redimensionar so a caixa ate soltar; cada arraste solto e uma entrada de desfazer; Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y e Esc; fromPx e cache das imagens decodificadas. DEC-023 (wo0020)."
```

```
git push
```
