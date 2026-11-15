/// <reference types="node" />
import { readFile, stat } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import {
  FONT_CATALOG,
  FontNotAvailableError,
  FontRegistry,
  pickFace,
  type FontLoader,
} from './FontRegistry';

/** Lê o `.ttf` de `public/` direto do disco, como o `fetch` faria no navegador. */
const diskLoader: FontLoader = async (url) => {
  const buf = await readFile(new URL(`../../public${url}`, import.meta.url));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};

const urlOf = (weight: number) => FONT_CATALOG.find((face) => face.weight === weight)?.url;

describe('FontRegistry', () => {
  it('F1: pesos exatos devolvem os 4 URLs do catálogo', () => {
    for (const face of FONT_CATALOG) {
      expect(pickFace('Montserrat', face.weight).url).toBe(face.url);
    }
    expect(FONT_CATALOG).toHaveLength(4);
  });

  it('F2: peso 500 sem correspondência cai para Regular (400)', () => {
    expect(pickFace('Montserrat', 500).url).toBe(urlOf(400));
  });

  it('F3: peso 300 sobe para Regular (400)', () => {
    expect(pickFace('Montserrat', 300).url).toBe(urlOf(400));
  });

  it('F4: peso 900 desce para ExtraBold (800)', () => {
    expect(pickFace('Montserrat', 900).url).toBe(urlOf(800));
  });

  it('F5: peso 650 sobe primeiro para Bold (700)', () => {
    expect(pickFace('Montserrat', 650).url).toBe(urlOf(700));
  });

  it('F6: família fora do catálogo lança FontNotAvailableError', () => {
    try {
      pickFace('Inter', 400);
      expect.unreachable('devia lançar');
    } catch (error) {
      expect(error).toBeInstanceOf(FontNotAvailableError);
      expect((error as FontNotAvailableError).family).toBe('Inter');
      expect((error as Error).message).toContain('Montserrat');
    }
  });

  it('F7: duas cargas do mesmo peso rodam o carregador uma vez e devolvem a mesma fonte', async () => {
    const loader = vi.fn(diskLoader);
    const registry = new FontRegistry(loader);
    const a = await registry.load('Montserrat', 700);
    const b = await registry.load('Montserrat', 700);
    expect(a).toBe(b);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(a.names.fontFamily.en).toBe('Montserrat');
  });

  it('F8: cada arquivo do catálogo existe com o tamanho medido', async () => {
    const sizes: Record<number, number> = { 400: 445928, 600: 454716, 700: 454864, 800: 455468 };
    for (const face of FONT_CATALOG) {
      const info = await stat(new URL(`../../public${face.url}`, import.meta.url));
      expect(info.size).toBe(sizes[face.weight]);
    }
  });

  it('carga que falha sai do cache e a próxima tenta de novo', async () => {
    const loader = vi
      .fn<FontLoader>()
      .mockRejectedValueOnce(new Error('rede'))
      .mockImplementation(diskLoader);
    const registry = new FontRegistry(loader);
    await expect(registry.load('Montserrat', 400)).rejects.toThrow('rede');
    const font = await registry.load('Montserrat', 400);
    expect(font.names.fontFamily.en).toBe('Montserrat');
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('peso diferente do pedido avisa no console', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await new FontRegistry(diskLoader).load('Montserrat', 500);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('500');
    warn.mockRestore();
  });
});
