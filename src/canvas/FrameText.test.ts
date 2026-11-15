/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { EditxTemplate } from '../template/TemplateSchema';
import { FontRegistry } from '../text/FontRegistry';
import type { FontLoader } from '../text/FontRegistry';
import { prepareTextDrawings } from './FrameText';

/** Lê o `.ttf` de `public/` direto do disco, como o `fetch` faria no navegador. */
const diskLoader: FontLoader = async (url) => {
  const buf = await readFile(new URL(`../../public${url}`, import.meta.url));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
};

const fonts = new FontRegistry(diskLoader);

afterEach(() => vi.restoreAllMocks());

/** Clone do exemplo, para mutar sem afetar os outros testes. */
function example(): EditxTemplate {
  return structuredClone(catalogoSimplesExample);
}

describe('prepareTextDrawings', () => {
  it('P1: página de produto → 2 desenhos de texto, na ordem estável do zIndex empatado', async () => {
    const drawings = await prepareTextDrawings(example(), 'page-produto', fonts);
    expect(drawings.map((d) => d.kind)).toEqual(['text', 'text']);
    expect(drawings.map((d) => d.frameId)).toEqual(['frame-nome-produto', 'frame-preco-produto']);
  });

  it('P2: capa → 1 desenho, em branco', async () => {
    const drawings = await prepareTextDrawings(example(), 'page-capa', fonts);
    expect(drawings).toHaveLength(1);
    const [drawing] = drawings;
    expect(drawing.kind).toBe('text');
    if (drawing.kind === 'text') expect(drawing.fill).toBe('#FFFFFF');
  });

  it('P3: família fora do catálogo vira erro no frame — e o filho que herda a família também', async () => {
    const template = example();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const style = template.textStyles['titulo-produto'];
    if (style.basedOn !== null) throw new Error('esperava estilo raiz');
    style.fontFamily = 'Inter';

    const drawings = await prepareTextDrawings(template, 'page-produto', fonts);
    expect(drawings.map((d) => d.kind)).toEqual(['error', 'error']);
    const [nome] = drawings;
    expect(nome.frameId).toBe('frame-nome-produto');
    if (nome.kind === 'error') expect(nome.message).toContain('Inter');
  });

  it('P4: frame invisível não é desenhado', async () => {
    const template = example();
    const page = template.pages.find((p) => p.id === 'page-produto');
    const frame = page?.frames.find((f) => f.id === 'frame-nome-produto');
    if (frame === undefined) throw new Error('frame ausente');
    frame.visible = false;

    const drawings = await prepareTextDrawings(template, 'page-produto', fonts);
    expect(drawings.map((d) => d.frameId)).toEqual(['frame-preco-produto']);
  });

  it('P5: página inexistente rejeita a promessa', async () => {
    await expect(prepareTextDrawings(example(), 'nao-existe', fonts)).rejects.toThrow(/nao-existe/);
  });
});
