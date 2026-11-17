/**
 * ImageLayout.ts
 *
 * Onde a imagem cai dentro do frame, PURO (sem Fabric, sem DOM): os quatro `fit` e o
 * `align` do `ImageFrame` (DEC-019). O que passa da borda do frame é recortado por quem
 * desenha. Vertical é sempre centralizado — o formato só tem alinhamento horizontal.
 */

import type { DrawRect } from '../text/TextDrawing';
import type { ImageFit, ImageHorizontalAlign } from '../types/frame.types';

/**
 * Retângulo, no mundo do canvas, em que a imagem INTEIRA é desenhada.
 * - `fill`: ocupa o frame (deforma se a proporção difere);
 * - `contain`: o maior tamanho que cabe inteiro, sem deformar;
 * - `cover`: o menor tamanho que cobre o frame, sem deformar (o excesso é recortado);
 * - `none`: tamanho natural (1 px da imagem = 1 px CSS do mundo).
 * Sobra ou excesso na horizontal segue `align`; na vertical, centraliza. Imagem sem
 * tamanho (0 px) ocupa o frame.
 *
 * @param frame - retângulo do frame no mundo
 * @param imageWidth - largura natural da imagem, em px
 * @param imageHeight - altura natural da imagem, em px
 * @param fit - modo de encaixe do frame
 * @param align - alinhamento horizontal do frame
 */
export function placeImage(
  frame: DrawRect,
  imageWidth: number,
  imageHeight: number,
  fit: ImageFit,
  align: ImageHorizontalAlign,
): DrawRect {
  if (fit === 'fill' || imageWidth <= 0 || imageHeight <= 0) return { ...frame };
  let scale = 1;
  if (fit === 'contain') scale = Math.min(frame.width / imageWidth, frame.height / imageHeight);
  else if (fit === 'cover') scale = Math.max(frame.width / imageWidth, frame.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  // Sobra (positiva) ou excesso (negativo) na horizontal: o align decide onde fica.
  const slack = frame.width - width;
  const offset = align === 'left' ? 0 : align === 'right' ? slack : slack / 2;
  return { left: frame.left + offset, top: frame.top + (frame.height - height) / 2, width, height };
}
