import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { DocumentSettings } from '../template/TemplateSchema';
import { centeredOffset, fitZoom, MAX_ZOOM, MIN_ZOOM, pageBox, toPx } from './PageGeometry';

const doc = (): DocumentSettings => structuredClone(catalogoSimplesExample.document);

describe('PageGeometry', () => {
  it('G1: 25,4 mm = 96 px', () => {
    expect(toPx(25.4, 'mm')).toBeCloseTo(96, 6);
  });

  it('G2: 2,54 cm = 96 px', () => {
    expect(toPx(2.54, 'cm')).toBeCloseTo(96, 6);
  });

  it('G3: px passa direto', () => {
    expect(toPx(10, 'px')).toBe(10);
  });

  it('G4: caixa do exemplo (210×297 mm, sangria 3) soma a sangria dos dois lados', () => {
    const box = pageBox(doc());
    expect(box.trimWidth).toBeCloseTo(793.7008, 3);
    expect(box.trimHeight).toBeCloseTo(1122.5197, 3);
    expect(box.bleed).toBeCloseTo(11.3386, 3);
    expect(box.width).toBeCloseTo(box.trimWidth + 2 * box.bleed, 6);
    expect(box.height).toBeCloseTo(box.trimHeight + 2 * box.bleed, 6);
  });

  it('G5: sem sangria a caixa é a área de corte', () => {
    const box = pageBox({ ...doc(), bleed: 0 });
    expect(box.width).toBe(box.trimWidth);
    expect(box.height).toBe(box.trimHeight);
  });

  it('G6: orientation não troca a caixa', () => {
    expect(pageBox({ ...doc(), orientation: 'landscape' })).toEqual(pageBox(doc()));
  });

  it('G7: janela larga é limitada pela altura', () => {
    const box = pageBox(doc());
    expect(fitZoom(1600, 900, box)).toBeCloseTo((900 - 64) / box.height, 6);
  });

  it('G8: janela sem espaço útil devolve MIN_ZOOM', () => {
    const box = pageBox(doc());
    expect(fitZoom(40, 40, box)).toBe(MIN_ZOOM);
    expect(fitZoom(10, 10, box)).toBe(MIN_ZOOM);
  });

  it('G9: janela enorme é limitada por MAX_ZOOM', () => {
    expect(fitZoom(100000, 100000, pageBox(doc()))).toBe(MAX_ZOOM);
  });

  it('G10: centraliza a caixa ampliada na janela', () => {
    const box = { trimWidth: 200, trimHeight: 100, bleed: 0, width: 200, height: 100 };
    expect(centeredOffset(1000, 800, box, 2)).toEqual({ x: 300, y: 300 });
  });
});
