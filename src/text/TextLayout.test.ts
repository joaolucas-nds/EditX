/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import type { Font } from 'opentype.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { ptToPx } from '../canvas/PageGeometry';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import { resolveStyle } from '../template/StyleRegistry';
import type { OverflowConfig, TextStyleProps } from '../types/frame.types';
import { FontRegistry } from './FontRegistry';
import { layoutText, SHRINK_STEP_PT, type TextLayoutInput } from './TextLayout';

let font: Font;

beforeAll(async () => {
  const registry = new FontRegistry(async (url) => {
    const buf = await readFile(new URL(`../../public${url}`, import.meta.url));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  });
  font = await registry.load('Montserrat', 400);
});

const baseStyle = (over: Partial<TextStyleProps> = {}): TextStyleProps => ({
  ...resolveStyle(catalogoSimplesExample.textStyles, 'titulo-produto'),
  transform: 'none',
  ...over,
});

const grow = (mode: OverflowConfig['mode'], anchor: OverflowConfig['anchor'] = 'top-left') => ({
  mode,
  anchor,
});

/** Largura de um trecho pelas fórmulas da regra 3 — calculada aqui, com a própria fonte. */
const measure = (text: string, style: TextStyleProps, fontSize = style.fontSize) => {
  if (text === '') return 0;
  const px = ptToPx(fontSize);
  return (
    font.getAdvanceWidth(text, px, { kerning: true }) +
    style.letterSpacing * px * (Array.from(text).length - 1)
  );
};

const contentOf = (fontSize: number) =>
  (ptToPx(fontSize) * (font.ascender - font.descender)) / font.unitsPerEm;

const run = (over: Partial<TextLayoutInput>) =>
  layoutText({
    text: 'texto',
    font,
    style: baseStyle(),
    overflow: grow('fixed-clip'),
    width: 1000,
    height: 1000,
    ...over,
  });

describe('TextLayout', () => {
  it('L1: palavra curta em caixa larga é uma linha', () => {
    const style = baseStyle();
    const out = run({ text: 'Mesa', style });
    expect(out.lines).toHaveLength(1);
    expect(out.lines[0].width).toBeCloseTo(measure('Mesa', style), 6);
    expect(out.clipped).toBe(false);
  });

  it('L2: quebra gulosa por palavra', () => {
    const style = baseStyle();
    const out = run({ text: 'aa bb cc', style, width: measure('aa bb', style) + 1 });
    expect(out.lines.map((l) => l.text)).toEqual(['aa bb', 'cc']);
  });

  it('L3: \\n força nova linha', () => {
    const out = run({ text: 'aa\nbb' });
    expect(out.lines.map((l) => l.text)).toEqual(['aa', 'bb']);
  });

  it('L4: palavra maior que a caixa é partida por caractere', () => {
    const style = baseStyle();
    const width = measure('aaa', style) + 1;
    const out = run({ text: 'aaaaaaaaaa', style, width });
    expect(out.lines.length).toBeGreaterThan(1);
    for (const line of out.lines) expect(line.width).toBeLessThanOrEqual(width);
    expect(out.lines.map((l) => l.text).join('')).toBe('aaaaaaaaaa');
  });

  it('L5: grow-vertical ancorado embaixo desloca offsetY', () => {
    const out = run({
      text: 'aa\nbb',
      overflow: grow('grow-vertical', 'bottom-left'),
      height: 1000,
    });
    expect(out.height).toBeCloseTo(2 * out.lineHeightPx, 6);
    expect(out.offsetY).toBeCloseTo(1000 - out.height, 6);
    expect(out.offsetX).toBe(0);
    expect(out.width).toBe(1000);
    expect(out.clipped).toBe(false);
  });

  it('L6: grow-horizontal ancorado à direita desloca offsetX', () => {
    const style = baseStyle();
    const out = run({
      text: 'aa bb cc',
      style,
      overflow: grow('grow-horizontal', 'top-right'),
      width: 1000,
    });
    expect(out.lines).toHaveLength(1);
    expect(out.width).toBeCloseTo(measure('aa bb cc', style), 6);
    expect(out.offsetX).toBeCloseTo(1000 - out.width, 6);
  });

  it('L7: fixed-clip mantém a caixa e marca clipped', () => {
    const style = baseStyle();
    const lh = contentOf(style.fontSize) * style.lineHeight;
    const out = run({ text: 'a\nb\nc', style, height: lh * 1.5 });
    expect(out.height).toBeCloseTo(lh * 1.5, 6);
    expect(out.lines).toHaveLength(3);
    expect(out.clipped).toBe(true);
  });

  it('L8: fixed-shrink reduz em passos de 0,5pt até caber', () => {
    const style = baseStyle();
    const lh = (size: number) => contentOf(size) * style.lineHeight;
    const out = run({
      text: 'a\nb\nc',
      style,
      overflow: { ...grow('fixed-shrink'), minFontSize: 6 },
      height: lh(style.fontSize - 2) * 3 + 0.01,
    });
    expect(out.fontSize).toBeLessThan(style.fontSize);
    expect(out.fontSize).toBeGreaterThanOrEqual(6);
    expect((style.fontSize - out.fontSize) % SHRINK_STEP_PT).toBe(0);
    expect(out.lines.length * out.lineHeightPx).toBeLessThanOrEqual(out.height);
    expect(out.clipped).toBe(false);
  });

  it('L9: fixed-shrink que não cabe nem no mínimo para no mínimo com clipped', () => {
    const style = baseStyle();
    const out = run({
      text: 'a\nb\nc',
      style,
      overflow: { ...grow('fixed-shrink'), minFontSize: style.fontSize - 1 },
      height: 1,
    });
    expect(out.fontSize).toBe(style.fontSize - 1);
    expect(out.clipped).toBe(true);
  });

  it('L10: transform uppercase vale antes de medir', () => {
    const out = run({ text: 'abc', style: baseStyle({ transform: 'uppercase' }) });
    expect(out.lines[0].text).toBe('ABC');
  });

  it('L11: align center centraliza a linha na caixa', () => {
    const out = run({ text: 'abc', style: baseStyle({ align: 'center' }), width: 1000 });
    expect(out.lines[0].x).toBeCloseTo((1000 - out.lines[0].width) / 2, 6);
  });

  it('L12: texto vazio é uma linha vazia com a altura de uma linha', () => {
    const out = run({ text: '', overflow: grow('grow-vertical') });
    expect(out.lines).toHaveLength(1);
    expect(out.lines[0].text).toBe('');
    expect(out.height).toBeCloseTo(out.lineHeightPx, 6);
  });

  it('L13: lineHeight 1 é a altura natural da fonte', () => {
    const style = baseStyle({ lineHeight: 1 });
    const out = run({ text: 'abc', style });
    expect(out.lineHeightPx).toBeCloseTo(contentOf(style.fontSize), 6);
  });

  it('L14: letterSpacing soma entre caracteres, sem sobra no fim', () => {
    const plain = baseStyle({ letterSpacing: 0 });
    const spaced = baseStyle({ letterSpacing: 0.1 });
    const out = run({ text: 'abcd', style: spaced });
    expect(out.lines[0].width).toBeCloseTo(
      measure('abcd', plain) + 0.1 * ptToPx(spaced.fontSize) * 3,
      6,
    );
  });

  it('L15: fixed-shrink sem minFontSize lança erro', () => {
    expect(() => run({ overflow: grow('fixed-shrink') })).toThrow(/minFontSize/);
  });

  it('linha de base: topo + meia folga + ascendente', () => {
    const style = baseStyle({ lineHeight: 2 });
    const out = run({ text: 'a\nb', style });
    const px = ptToPx(style.fontSize);
    const content = contentOf(style.fontSize);
    const first = (out.lineHeightPx - content) / 2 + (px * font.ascender) / font.unitsPerEm;
    expect(out.lines[0].baseline).toBeCloseTo(first, 6);
    expect(out.lines[1].baseline).toBeCloseTo(first + out.lineHeightPx, 6);
  });

  it('verticalAlign middle centraliza o bloco nos modos fixed', () => {
    const style = baseStyle({ verticalAlign: 'middle', lineHeight: 1 });
    const out = run({ text: 'a', style, height: 500 });
    const px = ptToPx(style.fontSize);
    const expected = (500 - out.lineHeightPx) / 2 + (px * font.ascender) / font.unitsPerEm;
    expect(out.lines[0].baseline).toBeCloseTo(expected, 6);
  });

  it('capitalize põe maiúscula na primeira letra de cada palavra', () => {
    const out = run({ text: 'mesa de jantar', style: baseStyle({ transform: 'capitalize' }) });
    expect(out.lines[0].text).toBe('Mesa De Jantar');
  });
});
