import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { DocumentSettings } from '../template/TemplateSchema';
import {
  canvasSize,
  centeredOffset,
  fitZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  pageBox,
  ptToPx,
  toPx,
} from './PageGeometry';

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

  it('G11: pt para px (72pt = 96px)', () => {
    expect(ptToPx(72)).toBe(96);
    expect(ptToPx(12)).toBe(16);
  });

  it('G12: a medida exata do navegador vence o arredondamento', () => {
    // Medido no navegador em 2026-11-16: 1000,5 × 700,5 px CSS ocupam 1001 × 701 px da tela.
    expect(canvasSize(1000.5, 700.5, 1, { width: 1001, height: 701 })).toEqual({
      cssWidth: 1000.5,
      cssHeight: 700.5,
      pixelWidth: 1001,
      pixelHeight: 701,
      pixelRatio: 1001 / 1000.5,
    });
  });

  it('G13: sem a medida, arredonda css × dpr — nunca trunca (zoom 110%)', () => {
    // 1745,4545 × 1,1 = 1919,99995: truncar daria 1919 numa tela de 1920 px.
    const size = canvasSize(1745.4545, 859.0909, 1.1);
    expect(size.pixelWidth).toBe(1920);
    expect(size.pixelHeight).toBe(945);
  });

  it('G14: DPR abaixo de 1 também vale (zoom 90%)', () => {
    const size = canvasSize(2133.3333, 1050, 0.9);
    expect(size.pixelWidth).toBe(1920);
    expect(size.pixelHeight).toBe(945);
    expect(size.pixelRatio).toBeCloseTo(0.9, 4);
  });

  it('G15: contêiner vazio não divide por zero', () => {
    expect(canvasSize(0, 0, 1.25)).toEqual({
      cssWidth: 0,
      cssHeight: 0,
      pixelWidth: 0,
      pixelHeight: 0,
      pixelRatio: 1.25,
    });
  });
});
