/**
 * TextDrawing.ts
 *
 * Desenho de um frame de texto, PURO (sem Fabric, sem DOM): transforma o layout do
 * `TextLayout.ts` em contornos vetoriais das letras (`opentype.js`), já em
 * coordenadas do mundo do canvas (DEC-018). O Fabric só recebe o resultado pronto.
 */

import type { Font } from 'opentype.js';
import { pageBox, toPx } from '../canvas/PageGeometry';
import { resolveStyle } from '../template/StyleRegistry';
import type { DocumentSettings, TextStyleMap } from '../template/TemplateSchema';
import type { BaseFrame, TextFrame } from '../types/frame.types';
import { layoutText } from './TextLayout';

/** Retângulo em px CSS no MUNDO do canvas (zoom 1; origem no canto da caixa de sangria). */
export interface DrawRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TextDrawing {
  kind: 'text';
  frameId: string;
  zIndex: number;
  /** Retângulo final do frame (depois de grow-* e da âncora). */
  frame: DrawRect;
  /** Contorno de cada linha NÃO vazia, em dados de caminho SVG, já em coordenadas do mundo. */
  paths: string[];
  fill: string;
  /** Recorte do frame (modos fixed-*), ou null. */
  clip: DrawRect | null;
}

export interface TextDrawingError {
  kind: 'error';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  message: string;
}

export type TextFrameDrawing = TextDrawing | TextDrawingError;

/**
 * Texto que o frame mostra: o conteúdo do estático; do frame de dados, o nome da
 * coluna entre chaves (amostra, até existir CSV importado).
 */
export function frameText(frame: TextFrame): string {
  return frame.role === 'static' ? frame.content : `{${frame.csvColumn}}`;
}

/**
 * Retângulo do frame em px CSS no mundo do canvas. O `transform` é relativo ao
 * canto da área de corte, e a área de corte começa em `(bleed, bleed)` (wo0004).
 */
export function frameRect(frame: BaseFrame, document: DocumentSettings): DrawRect {
  const { bleed } = pageBox(document);
  const { x, y, width, height } = frame.transform;
  return {
    left: bleed + toPx(x, document.unit),
    top: bleed + toPx(y, document.unit),
    width: toPx(width, document.unit),
    height: toPx(height, document.unit),
  };
}

/**
 * Desenha um frame de texto: diagrama com o motor de layout e converte cada linha
 * não vazia no contorno das letras, na linha de base calculada. A `font` é a da
 * família/peso do estilo resolvido — quem chama a carrega.
 */
export function drawTextFrame(
  frame: TextFrame,
  document: DocumentSettings,
  styles: TextStyleMap,
  font: Font,
): TextDrawing {
  const style = resolveStyle(styles, frame.textStyle);
  const rect = frameRect(frame, document);
  const layout = layoutText({
    text: frameText(frame),
    font,
    style,
    overflow: frame.overflow,
    width: rect.width,
    height: rect.height,
  });

  const ox = rect.left + layout.offsetX;
  const oy = rect.top + layout.offsetY;
  const finalRect: DrawRect = { left: ox, top: oy, width: layout.width, height: layout.height };

  const paths = layout.lines
    .filter((line) => line.text !== '')
    .map((line) =>
      font
        .getPath(line.text, ox + line.x, oy + line.baseline, layout.fontSizePx, {
          kerning: true,
          letterSpacing: style.letterSpacing,
        })
        .toPathData(3),
    );

  const clips = frame.overflow.mode === 'fixed-clip' || frame.overflow.mode === 'fixed-shrink';
  return {
    kind: 'text',
    frameId: frame.id,
    zIndex: frame.zIndex,
    frame: finalRect,
    paths,
    fill: style.color,
    clip: clips ? finalRect : null,
  };
}
