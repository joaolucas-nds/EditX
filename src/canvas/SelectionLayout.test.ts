import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import { toPx } from './PageGeometry';
import { alignRects, distributeRects, nudgeStepPx, trimRect, unionRect } from './SelectionLayout';

const a = { left: 10, top: 20, width: 100, height: 50 };
const b = { left: 200, top: 5, width: 40, height: 30 };

describe('SelectionLayout', () => {
  it('B1: unionRect cobre todas; lista vazia lança', () => {
    expect(unionRect([a, b])).toEqual({ left: 10, top: 5, width: 230, height: 65 });
    expect(() => unionRect([])).toThrow('nenhuma caixa');
  });

  it('B2: trimRect é a área de corte, sem a sangria', () => {
    const mm = (v: number): number => toPx(v, 'mm');
    const trim = trimRect(catalogoSimplesExample.document);
    expect(trim.left).toBeCloseTo(mm(3), 9);
    expect(trim.top).toBeCloseTo(mm(3), 9);
    expect(trim.width).toBeCloseTo(mm(210), 9);
    expect(trim.height).toBeCloseTo(mm(297), 9);
  });

  it('B3: alinhar no eixo horizontal não mexe no vertical, e vice-versa', () => {
    const bounds = unionRect([a, b]);
    expect(alignRects([a, b], 'left', bounds).map((r) => [r.left, r.top])).toEqual([
      [10, 20],
      [10, 5],
    ]);
    expect(alignRects([a, b], 'right', bounds).map((r) => r.left)).toEqual([140, 200]);
    expect(alignRects([a, b], 'hcenter', bounds).map((r) => r.left)).toEqual([75, 105]);
    expect(alignRects([a, b], 'top', bounds).map((r) => [r.left, r.top])).toEqual([
      [10, 5],
      [200, 5],
    ]);
    expect(alignRects([a, b], 'bottom', bounds).map((r) => r.top)).toEqual([20, 40]);
    expect(alignRects([a, b], 'vcenter', bounds).map((r) => r.top)).toEqual([12.5, 22.5]);
  });

  it('B4: distribuir iguala os espaços, as pontas paradas, na ordem recebida', () => {
    // Recebidas fora de ordem: a do meio (x 30) vem por último.
    const left = { left: 0, top: 0, width: 10, height: 10 };
    const right = { left: 100, top: 0, width: 20, height: 10 };
    const middle = { left: 30, top: 0, width: 30, height: 10 };
    const out = distributeRects([left, right, middle], 'horizontal');
    // Espaço total = 120 - 0 - (10 + 20 + 30) = 60 → 30 entre cada par.
    expect(out.map((r) => r.left)).toEqual([0, 100, 40]);
    expect(out.map((r) => r.top)).toEqual([0, 0, 0]);
  });

  it('B5: distribuir no vertical usa top e altura', () => {
    const rects = [
      { left: 0, top: 0, width: 10, height: 20 },
      { left: 5, top: 25, width: 10, height: 15 },
      { left: 9, top: 60, width: 10, height: 120 },
    ];
    // Espaço total = 180 - 0 - 155 = 25 → 12,5.
    expect(distributeRects(rects, 'vertical').map((r) => r.top)).toEqual([0, 32.5, 60]);
  });

  it('B6: com menos de três, distribuir não muda nada (e devolve cópias)', () => {
    const out = distributeRects([a, b], 'horizontal');
    expect(out).toEqual([a, b]);
    expect(out[0]).not.toBe(a);
  });

  it('B7: passo da seta — 1 mm e 10 mm; em px, 1 e 10', () => {
    expect(nudgeStepPx('mm', false)).toBeCloseTo(toPx(1, 'mm'), 9);
    expect(nudgeStepPx('cm', true)).toBeCloseTo(toPx(10, 'mm'), 9);
    expect(nudgeStepPx('px', false)).toBe(1);
    expect(nudgeStepPx('px', true)).toBe(10);
  });
});
