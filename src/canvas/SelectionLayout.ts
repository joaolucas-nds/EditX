/**
 * SelectionLayout.ts
 *
 * As contas de alinhar, distribuir e empurrar frames, PURAS (sem Fabric, sem DOM), testáveis em
 * Node (DEC-024). Trabalham sobre as caixas DESENHADAS (as das alças, em px CSS do mundo) — o
 * texto que cresce tem caixa diferente do `transform` — e devolvem as caixas novas; quem as
 * converte em `transform` é o `transformFromHandle` (`SelectionGeometry.ts`).
 */

import type { DocumentSettings, DocumentUnit } from '../template/TemplateSchema';
import type { DrawRect } from '../text/TextDrawing';
import { pageBox, toPx } from './PageGeometry';

/** A que borda (ou centro) alinhar: três no eixo horizontal, três no vertical. */
export type AlignEdge = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

/** Em que eixo distribuir. */
export type DistributeAxis = 'horizontal' | 'vertical';

/**
 * A menor caixa que contém todas estas.
 * @throws Error se a lista está vazia.
 */
export function unionRect(rects: readonly DrawRect[]): DrawRect {
  if (rects.length === 0) throw new Error('unionRect: nenhuma caixa.');
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.left + r.width));
  const bottom = Math.max(...rects.map((r) => r.top + r.height));
  return { left, top, width: right - left, height: bottom - top };
}

/** A área de corte da página no mundo (px CSS), sem a sangria — a referência de um frame sozinho. */
export function trimRect(document: DocumentSettings): DrawRect {
  const box = pageBox(document);
  return { left: box.bleed, top: box.bleed, width: box.trimWidth, height: box.trimHeight };
}

/**
 * Cada caixa alinhada a `bounds` pela borda (ou centro) `edge`; o outro eixo não muda (DEC-024:
 * dois ou mais frames alinham à caixa da seleção, um sozinho à área de corte — quem chama escolhe
 * `bounds`).
 */
export function alignRects(
  rects: readonly DrawRect[],
  edge: AlignEdge,
  bounds: DrawRect,
): DrawRect[] {
  return rects.map((r) => {
    switch (edge) {
      case 'left':
        return { ...r, left: bounds.left };
      case 'hcenter':
        return { ...r, left: bounds.left + (bounds.width - r.width) / 2 };
      case 'right':
        return { ...r, left: bounds.left + bounds.width - r.width };
      case 'top':
        return { ...r, top: bounds.top };
      case 'vcenter':
        return { ...r, top: bounds.top + (bounds.height - r.height) / 2 };
      case 'bottom':
        return { ...r, top: bounds.top + bounds.height - r.height };
    }
  });
}

/**
 * Distribui as caixas no eixo igualando os ESPAÇOS entre elas (DEC-024, como o Figma): ordena
 * pelo começo no eixo (empate: a ordem recebida), a primeira e a última ficam paradas e as do meio
 * são reposicionadas. Devolve na ordem RECEBIDA. Com menos de três, nada muda.
 */
export function distributeRects(rects: readonly DrawRect[], axis: DistributeAxis): DrawRect[] {
  const result = rects.map((r) => ({ ...r }));
  if (rects.length < 3) return result;
  const start = (r: DrawRect): number => (axis === 'horizontal' ? r.left : r.top);
  const size = (r: DrawRect): number => (axis === 'horizontal' ? r.width : r.height);
  const order = rects
    .map((_, index) => index)
    .sort((a, b) => start(rects[a]) - start(rects[b]) || a - b);
  const first = rects[order[0]];
  const last = rects[order[order.length - 1]];
  const total = order.reduce((sum, index) => sum + size(rects[index]), 0);
  const gap = (start(last) + size(last) - start(first) - total) / (order.length - 1);
  let cursor = start(first) + size(first) + gap;
  for (const index of order.slice(1, -1)) {
    const r = result[index];
    if (axis === 'horizontal') r.left = cursor;
    else r.top = cursor;
    cursor += size(r) + gap;
  }
  return result;
}

/**
 * Quanto uma seta empurra, em px CSS do mundo (DEC-024): 1 mm, e 10 mm com Shift; em documento
 * em px, 1 px e 10 px.
 */
export function nudgeStepPx(unit: DocumentUnit, big: boolean): number {
  const steps = big ? 10 : 1;
  return unit === 'px' ? steps : toPx(steps, 'mm');
}
