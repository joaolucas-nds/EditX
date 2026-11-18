import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { ShapeFrame } from '../types/frame.types';
import { drawShapeFrame, prepareShapeDrawings, shapePath } from './FrameShape';

const template = (): EditxTemplate => structuredClone(catalogoSimplesExample);

/** A forma de fundo da capa do exemplo (rect, sólido #1D3557, sem traço, zIndex 0). */
function fundo(t: EditxTemplate): ShapeFrame {
  const frame = t.pages[0].frames.find((candidate) => candidate.id === 'frame-fundo-capa');
  if (frame?.type !== 'shape') throw new Error('o exemplo mudou: sem frame-fundo-capa');
  return frame;
}

const box = { left: 0, top: 0, width: 100, height: 50 };

describe('shapePath', () => {
  it('R1: retângulo sem raio e sem traço ocupa o frame', () => {
    expect(shapePath('rect', box, 0, 0)).toBe('M 0 0 H 100 V 50 H 0 Z');
  });

  it('R2: o traço recua o contorno meia espessura de cada lado', () => {
    expect(shapePath('rect', box, 0, 10)).toBe('M 5 5 H 95 V 45 H 5 Z');
  });

  it('R3: cantos arredondados descontam o recuo do raio', () => {
    expect(shapePath('rect', box, 20, 10)).toBe(
      'M 20 5 H 80 A 15 15 0 0 1 95 20 V 30 A 15 15 0 0 1 80 45 H 20 A 15 15 0 0 1 5 30 V 20 A 15 15 0 0 1 20 5 Z',
    );
  });

  it('R4: raio maior que a metade do lado menor é limitado', () => {
    expect(shapePath('rect', box, 40, 0)).toBe(
      'M 25 0 H 75 A 25 25 0 0 1 100 25 V 25 A 25 25 0 0 1 75 50 H 25 A 25 25 0 0 1 0 25 V 25 A 25 25 0 0 1 25 0 Z',
    );
  });

  it('R5: elipse recuada pelo traço, em duas meias-elipses', () => {
    expect(shapePath('ellipse', box, 0, 10)).toBe(
      'M 5 25 A 45 20 0 1 0 95 25 A 45 20 0 1 0 5 25 Z',
    );
  });

  it('R6: linha é horizontal no meio do frame, de borda a borda, sem recuo', () => {
    expect(shapePath('line', box, 0, 10)).toBe('M 0 25 H 100');
  });

  it('R7: traço mais grosso que o frame não inverte o contorno', () => {
    expect(shapePath('rect', { left: 0, top: 0, width: 10, height: 10 }, 0, 20)).toBe(
      'M 5 5 H 5 V 5 H 5 Z',
    );
  });
});

describe('drawShapeFrame / prepareShapeDrawings', () => {
  it('R8: o fundo da capa é um retângulo sólido do tamanho da página, sem traço', () => {
    const t = template();
    const drawing = drawShapeFrame(fundo(t), t.document);
    if (drawing.kind !== 'shape') throw new Error(`esperava forma, veio ${drawing.kind}`);
    expect(drawing.frame).toEqual(frameRect(fundo(t), t.document));
    // Sangria de 3 mm = 11,339 px; 210 × 297 mm = 793,701 × 1122,52 px.
    expect(drawing.path).toBe('M 11.339 11.339 H 805.039 V 1133.858 H 11.339 Z');
    expect(drawing.fill).toBe('#1D3557');
    expect(drawing.stroke).toBeNull();
  });

  it('R9: traço tracejado em mm vira px, recua o contorno e escala o tracejado', () => {
    const t = template();
    fundo(t).stroke = { color: '#000000', width: 0.75, style: 'dashed' };
    const drawing = drawShapeFrame(fundo(t), t.document);
    if (drawing.kind !== 'shape' || drawing.stroke === null) throw new Error('esperava traço');
    expect(drawing.stroke.width).toBeCloseTo(2.8346, 4);
    expect(drawing.stroke.dash?.[0]).toBeCloseTo(8.5039, 4);
    expect(drawing.stroke.dash?.[1]).toBeCloseTo(5.6693, 4);
    expect(drawing.stroke.cap).toBe('butt');
    expect(drawing.path.startsWith('M 12.756 12.756 ')).toBe(true);
  });

  it('R10: pontilhado é traço 0 com ponta redonda', () => {
    const t = template();
    fundo(t).stroke = { color: '#000000', width: 1, style: 'dotted' };
    const drawing = drawShapeFrame(fundo(t), t.document);
    if (drawing.kind !== 'shape' || drawing.stroke === null) throw new Error('esperava traço');
    expect(drawing.stroke.dash?.[0]).toBe(0);
    expect(drawing.stroke.dash?.[1]).toBeCloseTo(7.5591, 4);
    expect(drawing.stroke.cap).toBe('round');
  });

  it('R11: sem preenchimento, e linha nunca preenche', () => {
    const t = template();
    fundo(t).fill = { type: 'none' };
    expect(drawShapeFrame(fundo(t), t.document)).toMatchObject({ kind: 'shape', fill: null });
    const linha = template();
    fundo(linha).shape = 'line';
    const drawing = drawShapeFrame(fundo(linha), linha.document);
    if (drawing.kind !== 'shape') throw new Error(`esperava forma, veio ${drawing.kind}`);
    expect(drawing.fill).toBeNull();
    expect(drawing.path).toBe('M 11.339 572.598 H 805.039');
  });

  it('R12: polígono e SVG customizado saem como erro, com o motivo', () => {
    const t = template();
    fundo(t).shape = 'polygon';
    expect(drawShapeFrame(fundo(t), t.document)).toMatchObject({ kind: 'error' });
    const message = (frame: ShapeFrame) => {
      const drawing = drawShapeFrame(frame, t.document);
      return drawing.kind === 'error' ? drawing.message : '';
    };
    expect(message(fundo(t))).toContain('pontos');
    fundo(t).shape = 'custom-svg';
    fundo(t).customSvg = '<svg/>';
    expect(message(fundo(t))).toContain('sanitização');
  });

  it('R13: saem por zIndex crescente', () => {
    const t = template();
    t.pages[0].frames.unshift({ ...fundo(t), id: 'faixa', zIndex: 5 });
    expect(prepareShapeDrawings(t, 'page-capa').map((d) => d.frameId)).toEqual([
      'frame-fundo-capa',
      'faixa',
    ]);
  });

  it('R14: forma invisível não sai, e página inexistente lança', () => {
    const t = template();
    fundo(t).visible = false;
    expect(prepareShapeDrawings(t, 'page-capa')).toEqual([]);
    expect(() => prepareShapeDrawings(t, 'nao-existe')).toThrow('nao-existe');
  });
});
