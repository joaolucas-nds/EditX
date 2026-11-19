import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { Transform } from '../types/frame.types';
import { toPx } from './PageGeometry';
import {
  findFrame,
  sameTransform,
  selectableFrames,
  transformFromHandle,
  visibleControls,
} from './SelectionGeometry';

const template = (): EditxTemplate => structuredClone(catalogoSimplesExample);
const mm = (value: number): number => toPx(value, 'mm');

/** O `transform` da foto da página de produto do exemplo: 10, 60, 190 × 120 mm. */
const FOTO: Transform = { x: 10, y: 60, width: 190, height: 120, rotation: 0 };

describe('selectableFrames', () => {
  it('A1: o frame travado não ganha alça (capa: só o título)', () => {
    const frames = selectableFrames(template(), 'page-capa');
    expect(frames.map((frame) => frame.frameId)).toEqual(['frame-titulo-capa']);
  });

  it('A2: na ordem do desenho — zIndex, depois a ordem da página', () => {
    const frames = selectableFrames(template(), 'page-produto');
    expect(frames.map((frame) => frame.frameId)).toEqual([
      'frame-foto-produto',
      'frame-nome-produto',
      'frame-preco-produto',
    ]);
  });

  it('A3: texto que cresce na vertical só redimensiona a largura; o resto, os dois eixos', () => {
    const axes = selectableFrames(template(), 'page-produto').map((frame) => frame.axes);
    // foto (imagem), nome (grow-vertical), preço (fixed-shrink)
    expect(axes).toEqual(['both', 'width', 'both']);
  });

  it('A4: grow-horizontal só redimensiona a altura', () => {
    const t = template();
    const nome = findFrame(t, 'frame-nome-produto');
    if (nome?.type !== 'text') throw new Error('o exemplo mudou: o nome não é texto');
    nome.overflow = { mode: 'grow-horizontal', anchor: 'top-left' };
    const frame = selectableFrames(t, 'page-produto').find((f) => f.frameId === nome.id);
    expect(frame?.axes).toBe('height');
  });

  it('A5: frame invisível não ganha alça', () => {
    const t = template();
    const nome = findFrame(t, 'frame-nome-produto');
    if (nome === undefined) throw new Error('o exemplo mudou: sem o nome do produto');
    nome.visible = false;
    expect(selectableFrames(t, 'page-produto').map((frame) => frame.frameId)).toEqual([
      'frame-foto-produto',
      'frame-preco-produto',
    ]);
  });

  it('A6: a caixa da alça é a do transform, no mundo (com a sangria)', () => {
    const t = template();
    const [foto] = selectableFrames(t, 'page-produto');
    const frame = findFrame(t, 'frame-foto-produto');
    if (frame === undefined) throw new Error('o exemplo mudou: sem a foto');
    expect(foto.rect).toEqual(frameRect(frame, t.document));
  });

  it('A7: página inexistente lança', () => {
    expect(() => selectableFrames(template(), 'nao-existe')).toThrow('nao-existe');
  });
});

describe('visibleControls', () => {
  it('A8: a alça de girar nunca aparece; cada eixo mostra só as suas', () => {
    expect(visibleControls('both')).toEqual({
      tl: true,
      tr: true,
      bl: true,
      br: true,
      ml: true,
      mr: true,
      mt: true,
      mb: true,
      mtr: false,
    });
    const width = visibleControls('width');
    expect(Object.keys(width).filter((key) => width[key as keyof typeof width])).toEqual([
      'ml',
      'mr',
    ]);
    const height = visibleControls('height');
    expect(Object.keys(height).filter((key) => height[key as keyof typeof height])).toEqual([
      'mt',
      'mb',
    ]);
  });
});

describe('transformFromHandle', () => {
  const base = { left: mm(13), top: mm(63), width: mm(190), height: mm(120) };

  it('A9: mover 5 mm para a direita muda só o x', () => {
    const next = { ...base, left: base.left + mm(5) };
    expect(transformFromHandle(FOTO, base, next, 'mm')).toEqual({ ...FOTO, x: 15 });
  });

  it('A10: soma a DIFERENÇA — a caixa de partida do texto que cresce não é o transform', () => {
    // Caixa do desenho de um grow-vertical com âncora no meio: em outro lugar e mais alta.
    const grown = { left: 50, top: 400, width: 700, height: 300 };
    const next = { ...grown, left: grown.left + mm(2), width: grown.width - mm(10) };
    const title: Transform = { x: 10, y: 120, width: 190, height: 40, rotation: 0 };
    expect(transformFromHandle(title, grown, next, 'mm')).toEqual({
      ...title,
      x: 12,
      width: 180,
    });
  });

  it('A11: arredonda a 0,01 da unidade', () => {
    const next = { ...base, left: base.left + 1 };
    expect(transformFromHandle(FOTO, base, next, 'mm').x).toBe(10.26);
  });

  it('A12: o lado que não mudou fica com o valor exato de antes, e a rotação passa igual', () => {
    const odd: Transform = { x: 10.005, y: 60.001, width: 190.0049, height: 120, rotation: 15 };
    const next = { ...base, height: base.height + mm(10) };
    expect(transformFromHandle(odd, base, next, 'mm')).toEqual({ ...odd, height: 130 });
  });

  it('A13: redimensionar não desce de 1 mm (0,1 cm; 3,78 px)', () => {
    const next = { ...base, width: 0.5, height: 0.5 };
    const small = transformFromHandle(FOTO, base, next, 'mm');
    expect([small.width, small.height]).toEqual([1, 1]);
    const cm: Transform = { x: 1, y: 6, width: 19, height: 12, rotation: 0 };
    expect(transformFromHandle(cm, base, next, 'cm').width).toBe(0.1);
    const px: Transform = { x: 38, y: 227, width: 718, height: 454, rotation: 0 };
    expect(transformFromHandle(px, base, next, 'px').width).toBe(3.78);
  });

  it('A14: arraste que volta ao lugar devolve um transform igual (sameTransform)', () => {
    const back = transformFromHandle(FOTO, base, { ...base }, 'mm');
    expect(sameTransform(back, FOTO)).toBe(true);
    expect(sameTransform({ ...FOTO, x: 10.01 }, FOTO)).toBe(false);
  });
});
