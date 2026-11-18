/**
 * FrameShape.ts
 *
 * Desenho dos frames de forma, PURO (sem Fabric, sem DOM): cada forma vira um contorno
 * SVG em coordenadas do mundo do canvas, com o traço por DENTRO do frame (DEC-020). O
 * Fabric só recebe o contorno pronto — quem pinta é o `CanvasEngine.ts`.
 */

import type { DocumentSettings, EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { DrawRect } from '../text/TextDrawing';
import type { ShapeFrame, StrokeStyle } from '../types/frame.types';
import { toPx } from './PageGeometry';

/** Traço pronto para pintar: espessura e tracejado em px CSS do mundo. */
export interface ShapeStrokeDrawing {
  color: string;
  width: number;
  /** Comprimentos de traço e vão, ou `null` para traço contínuo. */
  dash: number[] | null;
  /** `round` no pontilhado: cada traço de comprimento 0 vira um ponto. */
  cap: 'butt' | 'round';
}

export interface ShapeDrawing {
  kind: 'shape';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  /** Contorno em dados de caminho SVG, já em coordenadas do mundo e já recuado para o traço. */
  path: string;
  /** Cor de preenchimento, ou `null` sem preenchimento. */
  fill: string | null;
  stroke: ShapeStrokeDrawing | null;
}

export interface ShapeDrawingError {
  kind: 'error';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  message: string;
}

export type ShapeFrameDrawing = ShapeDrawing | ShapeDrawingError;

/** Número curto e estável para o contorno: 3 casas, e nunca «-0». */
function num(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded === 0 ? 0 : rounded);
}

/**
 * Contorno SVG de uma forma no retângulo `rect`, com o traço por DENTRO: a geometria
 * recua meia espessura de cada lado (no máximo metade do frame), então a borda externa do
 * traço coincide com o frame. Linha é horizontal, no meio do frame, de borda a borda, com
 * o traço centrado nela.
 *
 * @param kind - `rect`, `ellipse` ou `line`
 * @param rect - retângulo do frame no mundo
 * @param radius - raio dos cantos (só `rect`), em px; limitado à metade do lado menor
 * @param strokeWidth - espessura do traço em px (0 = sem traço)
 */
export function shapePath(
  kind: 'rect' | 'ellipse' | 'line',
  rect: DrawRect,
  radius: number,
  strokeWidth: number,
): string {
  if (kind === 'line') {
    const y = rect.top + rect.height / 2;
    return `M ${num(rect.left)} ${num(y)} H ${num(rect.left + rect.width)}`;
  }

  const inset = Math.min(strokeWidth / 2, rect.width / 2, rect.height / 2);
  const left = rect.left + inset;
  const top = rect.top + inset;
  const width = rect.width - 2 * inset;
  const height = rect.height - 2 * inset;
  const right = left + width;
  const bottom = top + height;

  if (kind === 'ellipse') {
    const rx = num(width / 2);
    const ry = num(height / 2);
    const cy = num(top + height / 2);
    // Duas meias-elipses: um arco só, de um ponto a ele mesmo, não desenha nada.
    return `M ${num(left)} ${cy} A ${rx} ${ry} 0 1 0 ${num(right)} ${cy} A ${rx} ${ry} 0 1 0 ${num(left)} ${cy} Z`;
  }

  // O raio é da borda EXTERNA do traço: o contorno recuado usa o raio menos o recuo.
  const r = Math.max(0, Math.min(radius - inset, width / 2, height / 2));
  if (r === 0) {
    return `M ${num(left)} ${num(top)} H ${num(right)} V ${num(bottom)} H ${num(left)} Z`;
  }
  const arc = `A ${num(r)} ${num(r)} 0 0 1`;
  return [
    `M ${num(left + r)} ${num(top)}`,
    `H ${num(right - r)}`,
    `${arc} ${num(right)} ${num(top + r)}`,
    `V ${num(bottom - r)}`,
    `${arc} ${num(right - r)} ${num(bottom)}`,
    `H ${num(left + r)}`,
    `${arc} ${num(left)} ${num(bottom - r)}`,
    `V ${num(top + r)}`,
    `${arc} ${num(left + r)} ${num(top)}`,
    'Z',
  ].join(' ');
}

/** Tracejado em múltiplos da espessura: escala junto com o traço. */
function dashFor(style: StrokeStyle, width: number): number[] | null {
  if (style === 'dashed') return [3 * width, 2 * width];
  if (style === 'dotted') return [0, 2 * width];
  return null;
}

/**
 * Desenha um frame de forma. Polígono (o formato não tem os pontos) e SVG customizado
 * (falta a sanitização) ainda não são desenhados e saem como `error`.
 */
export function drawShapeFrame(frame: ShapeFrame, document: DocumentSettings): ShapeFrameDrawing {
  const rect = frameRect(frame, document);
  if (frame.shape === 'polygon' || frame.shape === 'custom-svg') {
    const message =
      frame.shape === 'polygon'
        ? 'Polígono ainda não é desenhado: o formato não tem os pontos dele.'
        : 'SVG customizado ainda não é desenhado: falta a sanitização (backlog).';
    return { kind: 'error', frameId: frame.id, zIndex: frame.zIndex, frame: rect, message };
  }

  // Espessura e raio são em mm no formato, qualquer que seja a unidade do documento.
  const width = toPx(frame.stroke.width, 'mm');
  const stroke: ShapeStrokeDrawing | null =
    width > 0
      ? {
          color: frame.stroke.color,
          width,
          dash: dashFor(frame.stroke.style, width),
          cap: frame.stroke.style === 'dotted' ? 'round' : 'butt',
        }
      : null;
  const fill = frame.shape === 'line' || frame.fill.type === 'none' ? null : frame.fill.color;
  const radius = frame.shape === 'rect' ? toPx(frame.borderRadius, 'mm') : 0;

  return {
    kind: 'shape',
    frameId: frame.id,
    zIndex: frame.zIndex,
    frame: rect,
    path: shapePath(frame.shape, rect, radius, width),
    fill,
    stroke,
  };
}

/**
 * Desenhos de todos os frames de forma visíveis da página `pageId`, por `zIndex`
 * crescente (empate mantém a ordem dos frames).
 *
 * @throws Error se a página não existe.
 */
export function prepareShapeDrawings(template: EditxTemplate, pageId: string): ShapeFrameDrawing[] {
  const page = template.pages.find((candidate) => candidate.id === pageId);
  if (page === undefined) {
    throw new Error(`A página "${pageId}" não existe no template.`);
  }

  const drawings = page.frames
    .filter((frame): frame is ShapeFrame => frame.type === 'shape' && frame.visible)
    .map((frame) => {
      if (frame.transform.rotation !== 0) {
        console.warn(
          `Frame "${frame.id}": rotação ainda não é desenhada na F1; desenhado sem girar.`,
        );
      }
      return drawShapeFrame(frame, template.document);
    });

  // Array.prototype.sort é estável: empate de zIndex mantém a ordem da página.
  return drawings.sort((a, b) => a.zIndex - b.zIndex);
}
