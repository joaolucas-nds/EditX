import { describe, expect, it } from 'vitest';
import { normalizeProjectPath } from '../project/ProjectPath';
import type { ProjectFiles } from '../project/ProjectFiles';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { ImageFrame } from '../types/frame.types';
import { prepareImageDrawings } from './FrameImage';
import type { DecodedImage } from './FrameImage';
import { toPx } from './PageGeometry';

const template = (): EditxTemplate => structuredClone(catalogoSimplesExample);

/** Projeto falso: caminho normalizado → conteúdo; o conteúdo «LxA» decodifica nesse tamanho. */
function fakeFiles(entries: Record<string, string>): ProjectFiles {
  return {
    read: (path) => {
      const key = normalizeProjectPath(path);
      const content = key === null ? undefined : entries[key];
      return Promise.resolve(content === undefined ? null : new Blob([content]));
    },
  };
}

/** Decodificador falso: «1600x900» → 1600×900; qualquer outra coisa rejeita. */
async function fakeDecode(blob: Blob): Promise<DecodedImage<string>> {
  const text = await blob.text();
  const match = /^(\d+)x(\d+)$/.exec(text);
  if (match === null) throw new Error(`não é imagem: ${text}`);
  return { width: Number(match[1]), height: Number(match[2]), source: text };
}

/** O frame de foto da página de produto do exemplo (dados, fallback, contain, raio 4 mm). */
function photo(t: EditxTemplate): ImageFrame {
  const frame = t.pages[1].frames[2];
  if (frame.type !== 'image') throw new Error('o exemplo mudou: frames[2] do produto não é imagem');
  return frame;
}

/** Troca o frame de foto por um estático com estes caminhos. */
function makeStatic(t: EditxTemplate, src: string, fallback?: string): void {
  const f = photo(t);
  const frame: ImageFrame = {
    id: f.id,
    type: 'image',
    role: 'static',
    src,
    fallback,
    transform: f.transform,
    fit: f.fit,
    align: f.align,
    borderRadius: f.borderRadius,
    zIndex: f.zIndex,
    lock: f.lock,
    visible: f.visible,
  };
  t.pages[1].frames[2] = frame;
}

const sample = { 'imagens/_placeholder.png': '1600x900', 'imagens/foto.png': '800x800' };

describe('prepareImageDrawings', () => {
  it('M1: frame de dados desenha o fallback, com contain e o raio em px', async () => {
    const t = template();
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    if (drawing.kind !== 'image') throw new Error(`esperava imagem, veio ${drawing.kind}`);
    const rect = frameRect(photo(t), t.document);
    expect(drawing.path).toBe('./imagens/_placeholder.png');
    expect(drawing.frame).toEqual(rect);
    // 1600×900 (1,78) é mais larga que o frame 190×120 mm (1,58): encosta nas laterais.
    expect(drawing.place.left).toBeCloseTo(rect.left, 6);
    expect(drawing.place.width).toBeCloseTo(rect.width, 6);
    expect(drawing.place.height).toBeCloseTo((rect.width * 900) / 1600, 6);
    expect(drawing.radius).toBeCloseTo(toPx(4, 'mm'), 6);
  });

  it('M2: frame de dados sem fallback vira área reservada', async () => {
    const t = template();
    photo(t).fallback = undefined;
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    expect(drawing.kind).toBe('placeholder');
  });

  it('M3: fallback que não existe vira erro com o caminho', async () => {
    const t = template();
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles({}), fakeDecode);
    if (drawing.kind !== 'error') throw new Error(`esperava erro, veio ${drawing.kind}`);
    expect(drawing.message).toContain('./imagens/_placeholder.png: não encontrado');
  });

  it('M4: frame estático desenha o src', async () => {
    const t = template();
    makeStatic(t, './imagens/foto.png', './imagens/_placeholder.png');
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    if (drawing.kind !== 'image') throw new Error(`esperava imagem, veio ${drawing.kind}`);
    expect(drawing.path).toBe('./imagens/foto.png');
    expect(drawing.image.width).toBe(800);
  });

  it('M5: src que não existe cai no fallback', async () => {
    const t = template();
    makeStatic(t, './imagens/sumiu.png', './imagens/_placeholder.png');
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    if (drawing.kind !== 'image') throw new Error(`esperava imagem, veio ${drawing.kind}`);
    expect(drawing.path).toBe('./imagens/_placeholder.png');
  });

  it('M6: src que não decodifica e sem fallback vira erro com o motivo', async () => {
    const t = template();
    makeStatic(t, './imagens/quebrada.png');
    const files = fakeFiles({ 'imagens/quebrada.png': 'lixo' });
    const [drawing] = await prepareImageDrawings(t, 'page-produto', files, fakeDecode);
    if (drawing.kind !== 'error') throw new Error(`esperava erro, veio ${drawing.kind}`);
    expect(drawing.message).toContain('não é imagem: lixo');
  });

  it('M7: frame invisível não é desenhado', async () => {
    const t = template();
    photo(t).visible = false;
    expect(await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode)).toEqual(
      [],
    );
  });

  it('M8: página inexistente rejeita', async () => {
    await expect(
      prepareImageDrawings(template(), 'nao-existe', fakeFiles(sample), fakeDecode),
    ).rejects.toThrow('nao-existe');
  });

  it('M9: saem por zIndex crescente', async () => {
    const t = template();
    const front = photo(t);
    t.pages[1].frames.unshift({ ...front, id: 'foto-fundo', zIndex: 1 });
    const drawings = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    expect(drawings.map((d) => d.frameId)).toEqual(['foto-fundo', 'frame-foto-produto']);
  });
});
