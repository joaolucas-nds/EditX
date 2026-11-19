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
