/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { toPx } from '../canvas/PageGeometry';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import { resolveStyle } from '../template/StyleRegistry';
import type { Frame, TextFrame } from '../types/frame.types';
import { FontRegistry } from './FontRegistry';
import type { FontLoader } from './FontRegistry';
import { drawTextFrame, frameRect, frameText } from './TextDrawing';
import { layoutText } from './TextLayout';

/** Lê o `.ttf` de `public/` direto do disco, como o `fetch` faria no navegador. */
const diskLoader: FontLoader = async (url) => {
  const buf = await readFile(new URL(`../../public${url}`, import.meta.url));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};

const fonts = new FontRegistry(diskLoader);
const { document, textStyles } = catalogoSimplesExample;

function textFrame(id: string): TextFrame {
  const frame = catalogoSimplesExample.pages
    .flatMap((page) => page.frames)
    .find((candidate: Frame) => candidate.id === id);
  if (frame === undefined || frame.type !== 'text') throw new Error(`frame de texto ${id} ausente`);
  return structuredClone(frame);
}

/** Fonte da família/peso do estilo resolvido do frame. */
async function fontOf(frame: TextFrame) {
  const style = resolveStyle(textStyles, frame.textStyle);
  return fonts.load(style.fontFamily, style.fontWeight);
}

describe('TextDrawing', () => {
  it('D1: frameRect põe o transform a partir do canto da área de corte (sangria somada)', () => {
    const rect = frameRect(textFrame('frame-nome-produto'), document);
    expect(rect.left).toBeCloseTo(toPx(13, 'mm'), 6);
    expect(rect.top).toBeCloseTo(toPx(18, 'mm'), 6);
    expect(rect.width).toBeCloseTo(toPx(190, 'mm'), 6);
    expect(rect.height).toBeCloseTo(toPx(20, 'mm'), 6);
  });

  it('D2: frameText — dado vira {coluna}, estático devolve o conteúdo', () => {
    expect(frameText(textFrame('frame-nome-produto'))).toBe('{nome}');
    expect(frameText(textFrame('frame-titulo-capa'))).toBe('Ofertas de Verão');
  });

  it('D3: frame grow-vertical top-left vira um contorno, sem recorte', async () => {
    const frame = textFrame('frame-nome-produto');
    const font = await fontOf(frame);
    const drawing = drawTextFrame(frame, document, textStyles, font);
    const rect = frameRect(frame, document);
    const layout = layoutText({
      text: frameText(frame),
      font,
      style: resolveStyle(textStyles, frame.textStyle),
      overflow: frame.overflow,
      width: rect.width,
      height: rect.height,
    });

    expect(drawing.kind).toBe('text');
    expect(drawing.fill).toBe('#1D3557');
    expect(drawing.clip).toBeNull();
    expect(drawing.paths).toHaveLength(1);
    expect(drawing.paths[0].startsWith('M')).toBe(true);
    expect(drawing.frame.top).toBe(rect.top);
    expect(drawing.frame.height).toBe(layout.height);
  });

  it('D3b: o contorno nasce na linha de base do layout (posição vertical do primeiro ponto)', async () => {
    const frame = textFrame('frame-nome-produto');
    const font = await fontOf(frame);
    const style = resolveStyle(textStyles, frame.textStyle);
    const drawing = drawTextFrame(frame, document, textStyles, font);
    const rect = frameRect(frame, document);
    const layout = layoutText({
      text: frameText(frame),
      font,
      style,
      overflow: frame.overflow,
      width: rect.width,
      height: rect.height,
    });
    const line = layout.lines[0];
    const expected = font
      .getPath(
        line.text,
        rect.left + layout.offsetX + line.x,
        rect.top + layout.offsetY + line.baseline,
        layout.fontSizePx,
        {
          kerning: true,
          letterSpacing: style.letterSpacing,
        },
      )
      .toPathData(3);
    expect(drawing.paths[0]).toBe(expected);
  });

  it('D4: fixed-shrink recorta no próprio retângulo do frame', async () => {
    const frame = textFrame('frame-preco-produto');
    const font = await fontOf(frame);
    const drawing = drawTextFrame(frame, document, textStyles, font);
    const rect = frameRect(frame, document);
    expect(drawing.clip).toEqual(rect);
    expect(drawing.frame).toEqual(rect);
  });

  it('D5: conteúdo vazio não gera caminho', async () => {
    const frame = textFrame('frame-titulo-capa');
    if (frame.role !== 'static') throw new Error('esperava frame estático');
    frame.content = '';
    const drawing = drawTextFrame(frame, document, textStyles, await fontOf(frame));
    expect(drawing.paths).toEqual([]);
  });

  it('D6: letterSpacing soma um espaço por glifo — sem ligadura em «fi»', async () => {
    const font = await fonts.load('Montserrat', 400);
    const px = 20;
    const withSpacing = font.getAdvanceWidth('fi', px, { kerning: true, letterSpacing: 0.5 });
    const without = font.getAdvanceWidth('fi', px, { kerning: true });
    expect(withSpacing - without).toBeCloseTo(0.5 * px * 2, 6);
  });
});
