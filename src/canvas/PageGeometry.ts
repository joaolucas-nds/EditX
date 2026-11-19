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
 * Converte `px` (px CSS do mundo) de volta para `unit`, arredondado a 0,01 da unidade — o valor
 * que vai para o `.editx` (DEC-021). 0,01 mm = 0,038 px CSS: abaixo do que a tela mostra, e sem
 * `10.000000003` no arquivo. Inverso de `toPx` até o arredondamento; nunca devolve `-0`.
 */
export function fromPx(px: number, unit: DocumentUnit): number {
  const value = px / toPx(1, unit);
  // `+ 0` troca -0 por 0: o arredondamento de -0,001 daria -0.
  return Math.round(value * 100) / 100 + 0;
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

/** Pontos tipográficos por polegada (1pt = 1/72in). `TextStyle.fontSize` está em pt. */
export const PT_PER_INCH = 72;

/** Converte pontos tipográficos para px CSS (72pt = 1in = 96px). */
export function ptToPx(pt: number): number {
  return (pt * CSS_PX_PER_INCH) / PT_PER_INCH;
}

/** Tamanho do canvas: o que ele ocupa na página (px CSS) e o buffer de pixels (px do dispositivo). */
export interface CanvasSize {
  /** Largura do contêiner em px CSS (pode ser fracionária). */
  cssWidth: number;
  /** Altura do contêiner em px CSS (pode ser fracionária). */
  cssHeight: number;
  /** Largura do buffer em px do dispositivo — inteiro: um pixel do buffer por pixel da tela. */
  pixelWidth: number;
  /** Altura do buffer em px do dispositivo — inteiro. */
  pixelHeight: number;
  /** px do dispositivo por px CSS de fato usados (`pixelWidth / cssWidth`); o DPR quando a largura é 0. */
  pixelRatio: number;
}

/**
 * Tamanho do buffer para que cada pixel do canvas caia num pixel da tela (FIX-002).
 * `devicePixels` é a medida exata do navegador (`devicePixelContentBoxSize` do
 * `ResizeObserver`) e vence quando existe; sem ela, arredonda `css × dpr`. Nunca
 * trunca: buffer 1 px menor que a tela faz o navegador reamostrar o canvas inteiro.
 *
 * @param cssWidth - largura do contêiner em px CSS
 * @param cssHeight - altura do contêiner em px CSS
 * @param devicePixelRatio - `window.devicePixelRatio` (pode ser < 1 no zoom abaixo de 100%)
 * @param devicePixels - medida exata em px do dispositivo, ou `null` se o navegador não a dá
 * @returns tamanhos CSS e do buffer, e a razão entre eles
 */
export function canvasSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  devicePixels: { width: number; height: number } | null = null,
): CanvasSize {
  const pixelWidth = devicePixels?.width ?? Math.round(cssWidth * devicePixelRatio);
  const pixelHeight = devicePixels?.height ?? Math.round(cssHeight * devicePixelRatio);
  const pixelRatio = cssWidth > 0 && pixelWidth > 0 ? pixelWidth / cssWidth : devicePixelRatio;
  return { cssWidth, cssHeight, pixelWidth, pixelHeight, pixelRatio };
}
