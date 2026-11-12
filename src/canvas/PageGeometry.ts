/**
 * PageGeometry.ts
 *
 * Geometria da página, PURA (sem Fabric, sem DOM): unidade do documento → px CSS,
 * caixa com sangria, zoom para caber e centralização. Existe separada do
 * `CanvasEngine.ts` para ser testável em Node (DEC-016).
 */

import type { DocumentSettings, DocumentUnit } from '../template/TemplateSchema';

/** Pixels CSS por polegada — o padrão do CSS (1in = 96px). Zoom 1 = tamanho físico na tela. */
export const CSS_PX_PER_INCH = 96;
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;

/** Caixa da página em px CSS com zoom 1. `width`/`height` incluem a sangria dos dois lados. */
export interface PageBox {
  trimWidth: number;
  trimHeight: number;
  bleed: number;
  width: number;
  height: number;
}

/** Converte `value` de `unit` para px CSS (96 px/pol). */
export function toPx(value: number, unit: DocumentUnit): number {
  switch (unit) {
    case 'mm':
      return (value * CSS_PX_PER_INCH) / 25.4;
    case 'cm':
      return (value * CSS_PX_PER_INCH) / 2.54;
    case 'px':
      return value;
  }
}

/**
 * Caixa da página do documento. `width`/`height` do documento mandam;
 * `orientation` é metadado e NÃO troca nada aqui (DEC-016).
 */
export function pageBox(document: DocumentSettings): PageBox {
  const trimWidth = toPx(document.width, document.unit);
  const trimHeight = toPx(document.height, document.unit);
  const bleed = toPx(document.bleed, document.unit);
  return {
    trimWidth,
    trimHeight,
    bleed,
    width: trimWidth + 2 * bleed,
    height: trimHeight + 2 * bleed,
  };
}

/**
 * Zoom que faz a caixa (com sangria) caber na janela, deixando `margin` px
 * livres de cada lado. Janela sem espaço útil devolve `MIN_ZOOM`.
 */
export function fitZoom(
  viewportWidth: number,
  viewportHeight: number,
  box: PageBox,
  margin = 32,
): number {
  const availableWidth = viewportWidth - 2 * margin;
  const availableHeight = viewportHeight - 2 * margin;
  if (availableWidth <= 0 || availableHeight <= 0) return MIN_ZOOM;
  const zoom = Math.min(availableWidth / box.width, availableHeight / box.height);
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Deslocamento (px da janela) que centraliza a caixa na janela com o `zoom` dado. */
export function centeredOffset(
  viewportWidth: number,
  viewportHeight: number,
  box: PageBox,
  zoom: number,
): { x: number; y: number } {
  return {
    x: (viewportWidth - box.width * zoom) / 2,
    y: (viewportHeight - box.height * zoom) / 2,
  };
}
