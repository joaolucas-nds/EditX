/**
 * TextLayout.ts
 *
 * Motor de layout de texto, PURO (sem Fabric, sem DOM): quebra de linha e os 4
 * modos de overflow, medindo com a fonte real via `opentype.js` (DEC-006,
 * DEC-017). Unidades: px CSS; `fontSize` em pt entra por `ptToPx`.
 */

import type { Font } from 'opentype.js';
import { ptToPx } from '../canvas/PageGeometry';
import type { OverflowConfig, TextStyleProps } from '../types/frame.types';

export interface TextLayoutInput {
  /** Texto a diagramar (o conteúdo do frame estático ou o valor da célula do CSV). */
  text: string;
  /** Fonte já escolhida para a família/peso do estilo (FontRegistry). */
  font: Font;
  /** Estilo RESOLVIDO (resolveStyle) — nunca um estilo derivado cru. */
  style: Readonly<TextStyleProps>;
  overflow: OverflowConfig;
  /** Caixa do frame em px CSS (transform convertido com toPx). */
  width: number;
  height: number;
}

export interface LayoutLine {
  text: string;
  /** Início da linha, em px a partir da borda esquerda do frame (alinhamento aplicado). */
  x: number;
  /** Linha de base, em px a partir do topo do frame. */
  baseline: number;
  width: number;
}

export interface TextLayout {
  lines: LayoutLine[];
  /** Tamanho final do frame em px CSS (muda só nos modos grow-*). */
  width: number;
  height: number;
  /** Quanto a origem do frame se desloca por causa da âncora (grow-*), em px CSS. */
  offsetX: number;
  offsetY: number;
  /** Tamanho final da fonte em pt (muda só em fixed-shrink). */
  fontSize: number;
  fontSizePx: number;
  lineHeightPx: number;
  /** O texto passa da altura do frame (fixed-clip; fixed-shrink que chegou ao mínimo sem caber). */
  clipped: boolean;
}

/** Passo de redução do fixed-shrink, em pt. */
export const SHRINK_STEP_PT = 0.5;

/** Aplica `style.transform` ao texto antes de medir. */
function applyCase(text: string, transform: TextStyleProps['transform']): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(
        /(^|\s)(\S)/gu,
        (_, space: string, first: string) => space + first.toUpperCase(),
      );
    default:
      return text;
  }
}

/** Largura de um trecho em px: avanço com kerning + letter-spacing entre caracteres (sem sobra no fim). */
function measure(
  font: Font,
  style: Readonly<TextStyleProps>,
  fontSizePx: number,
  text: string,
): number {
  if (text === '') return 0;
  const codePoints = Array.from(text).length;
  return (
    font.getAdvanceWidth(text, fontSizePx, { kerning: true }) +
    style.letterSpacing * fontSizePx * (codePoints - 1)
  );
}

/** Quebra um parágrafo em linhas, encaixe guloso por palavra; palavra que não cabe sozinha é partida por caractere. */
function wrapParagraph(paragraph: string, fits: (text: string) => boolean): string[] {
  const words = paragraph.split(/ +/).filter((word) => word !== '');
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';

  /** Começa uma linha com `word`; se não cabe sozinha, parte por caractere e deixa o último pedaço aberto. */
  const start = (word: string): string => {
    if (fits(word)) return word;
    let piece = '';
    for (const char of word) {
      if (piece === '' || fits(piece + char)) {
        piece += char;
      } else {
        lines.push(piece);
        piece = char;
      }
    }
    return piece;
  };

  for (const word of words) {
    if (current === '') {
      current = start(word);
    } else if (fits(`${current} ${word}`)) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = start(word);
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Diagrama `input.text` na caixa do frame conforme o modo de overflow: quebra de
 * linha, tamanho final do frame (grow-*), fonte final (fixed-shrink), posição de
 * cada linha e se o texto passa da altura (`clipped`).
 */
export function layoutText(input: TextLayoutInput): TextLayout {
  const { font, style, overflow } = input;
  const mode = overflow.mode;
  const text = applyCase(input.text, style.transform);
  const paragraphs = text.split('\n');

  if (mode === 'fixed-shrink' && overflow.minFontSize === undefined) {
    throw new Error(
      'O modo fixed-shrink exige overflow.minFontSize (tamanho mínimo da fonte, em pt).',
    );
  }

  /** Tamanhos e linhas para um tamanho de fonte (pt). */
  const build = (fontSize: number) => {
    const fontSizePx = ptToPx(fontSize);
    const fits = (candidate: string) => measure(font, style, fontSizePx, candidate) <= input.width;
    const lines =
      mode === 'grow-horizontal'
        ? paragraphs
        : paragraphs.flatMap((paragraph) =>
            paragraph === '' ? [''] : wrapParagraph(paragraph, fits),
          );
    const content = (fontSizePx * (font.ascender - font.descender)) / font.unitsPerEm;
    const lineHeightPx = content * style.lineHeight;
    return {
      fontSize,
      fontSizePx,
      lines,
      content,
      lineHeightPx,
      blockHeight: lines.length * lineHeightPx,
    };
  };

  let sized = build(style.fontSize);
  let clipped = false;

  if (mode === 'fixed-shrink') {
    const min = overflow.minFontSize as number;
    while (sized.blockHeight > input.height) {
      const next = Math.max(min, sized.fontSize - SHRINK_STEP_PT);
      if (next >= sized.fontSize) {
        clipped = true;
        break;
      }
      sized = build(next);
    }
  } else if (mode === 'fixed-clip') {
    clipped = sized.blockHeight > input.height;
  }

  const { fontSizePx, lineHeightPx, content, blockHeight } = sized;
  const lineWidths = sized.lines.map((line) => measure(font, style, fontSizePx, line));
  const grows = mode === 'grow-vertical' || mode === 'grow-horizontal';

  const width = mode === 'grow-horizontal' ? Math.max(0, ...lineWidths) : input.width;
  const height = grows ? blockHeight : input.height;

  const [anchorRow, anchorColumn] = overflow.anchor.split('-');
  let offsetX = 0;
  let offsetY = 0;
  if (grows) {
    if (anchorRow === 'middle') offsetY = (input.height - height) / 2;
    else if (anchorRow === 'bottom') offsetY = input.height - height;
    if (mode === 'grow-horizontal') {
      if (anchorColumn === 'center') offsetX = (input.width - width) / 2;
      else if (anchorColumn === 'right') offsetX = input.width - width;
    }
  }

  let blockTop = 0;
  if (!grows) {
    if (style.verticalAlign === 'middle') blockTop = (height - blockHeight) / 2;
    else if (style.verticalAlign === 'bottom') blockTop = height - blockHeight;
  }

  const ascent = (fontSizePx * font.ascender) / font.unitsPerEm;
  const lines: LayoutLine[] = sized.lines.map((lineText, i) => {
    const lineWidth = lineWidths[i];
    let x = 0;
    if (style.align === 'center') x = (width - lineWidth) / 2;
    else if (style.align === 'right') x = width - lineWidth;
    return {
      text: lineText,
      x,
      baseline: blockTop + i * lineHeightPx + (lineHeightPx - content) / 2 + ascent,
      width: lineWidth,
    };
  });

  return {
    lines,
    width,
    height,
    offsetX,
    offsetY,
    fontSize: sized.fontSize,
    fontSizePx,
    lineHeightPx,
    clipped,
  };
}
