import { describe, expect, it } from 'vitest';
import { toPx } from '../canvas/PageGeometry';
import { findFrame, selectableFrames } from '../canvas/SelectionGeometry';
import { createEditorStores } from '../store/documentStore';
import type { EditorStores } from '../store/documentStore';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { DrawRect } from '../text/TextDrawing';
import { createEditorActions } from './EditorActions';
import type { FrameBoxes } from './EditorActions';

const FOTO = 'frame-foto-produto';
const NOME = 'frame-nome-produto';
const PRECO = 'frame-preco-produto';

/** Editor com relógio falso (`clock.t`, em ms) e, opcionalmente, caixas desenhadas falsas. */
function open(pageId = 'page-produto', boxes: FrameBoxes | null = null) {
  const clock = { t: 0 };
  const stores = createEditorStores(catalogoSimplesExample, { pageId, now: () => clock.t });
  return { stores, clock, actions: createEditorActions(stores, () => boxes) };
}

const x = (stores: EditorStores, id: string): number | undefined =>
  findFrame(stores.document.getState().template, id)?.transform.x;
const y = (stores: EditorStores, id: string): number | undefined =>
  findFrame(stores.document.getState().template, id)?.transform.y;
const labels = (stores: EditorStores): string[] =>
  stores.history.getState().past.map((entry) => entry.label);

describe('createEditorActions', () => {
  it('E1: selecionar tudo pega os frames destravados da página, na ordem do desenho', () => {
    const { stores, actions } = open();
    actions.selectAll();
    expect(stores.selection.getState().selectedIds).toEqual([FOTO, NOME, PRECO]);
  });

  it('E2: dois frames alinham à caixa da seleção, numa entrada só', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([PRECO, FOTO]);
    expect(actions.align('right')).toBe(true);
    // Borda direita da seleção: a da foto (10 + 190 = 200); o preço (100 de largura) vai a 100.
    expect([x(stores, PRECO), x(stores, FOTO)]).toEqual([100, 10]);
    expect(labels(stores)).toEqual(['alinhar right (2)']);
  });

  it('E3: um frame sozinho alinha à área de corte da página', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([PRECO]);
    actions.align('hcenter');
    expect(x(stores, PRECO)).toBe(55); // (210 − 100) / 2
    actions.align('bottom');
    expect(y(stores, PRECO)).toBe(282); // 297 − 15
  });

  it('E4: alinhamento que não muda nada não entra no histórico', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([FOTO]); // x 10, largura 190: já no centro de 210
    expect(actions.align('hcenter')).toBe(false);
    expect(labels(stores)).toEqual([]);
  });

  it('E5: distribuir três iguala os espaços, as pontas paradas', () => {
    const { stores, actions } = open();
    stores.document.getState().setFrameTransform(PRECO, {
      ...(findFrame(stores.document.getState().template, PRECO)?.transform ?? {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        rotation: 0,
      }),
      y: 50,
    });
    stores.selection.getState().select([FOTO, NOME, PRECO]);
    expect(actions.distribute('vertical')).toBe(true);
    // nome 15–35, foto 60–180, preço 15 de altura: espaço total 10 → 5 de cada lado do preço.
    expect([y(stores, NOME), y(stores, PRECO), y(stores, FOTO)]).toEqual([15, 40, 60]);
    expect(labels(stores).at(-1)).toBe('distribuir vertical (3)');
  });

  it('E6: distribuir com menos de três não faz nada', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([FOTO, NOME]);
    expect(actions.distribute('horizontal')).toBe(false);
  });

  it('E7: a seta anda 1 mm; com Shift, 10 mm', () => {
    const { stores, actions } = open();
    stores.selection.getState().select([FOTO]);
    actions.nudge(1, 0, false);
    expect(x(stores, FOTO)).toBe(11);
    actions.nudge(0, -1, true);
    expect(y(stores, FOTO)).toBe(50);
  });

  it('E8: toques seguidos na mesma seleção viram uma entrada; desfazer volta tudo', () => {
    const { stores, clock, actions } = open();
    stores.selection.getState().select([FOTO]);
    actions.nudge(1, 0, false);
    clock.t = 500;
    actions.nudge(1, 0, false);
    clock.t = 900;
    actions.nudge(1, 0, false);
    expect(x(stores, FOTO)).toBe(13);
    expect(stores.history.getState().past).toHaveLength(1);
    stores.document.getState().undo();
    expect(x(stores, FOTO)).toBe(10);
  });

  it('E9: passou mais de 1 s, ou a seleção mudou, é outra entrada', () => {
    const { stores, clock, actions } = open();
    stores.selection.getState().select([FOTO]);
    actions.nudge(1, 0, false);
    clock.t = 1500;
    actions.nudge(1, 0, false);
    stores.selection.getState().select([FOTO, NOME]);
    clock.t = 1600;
    actions.nudge(1, 0, false);
    expect(stores.history.getState().past).toHaveLength(3);
  });

  it('E10: usa a caixa DESENHADA (texto que cresce), não a do transform', () => {
    const mm = (v: number): number => toPx(v, 'mm');
    const rects = new Map(
      selectableFrames(catalogoSimplesExample, 'page-produto').map((f) => [f.frameId, f.rect]),
    );
    const nomeRect = rects.get(NOME) as DrawRect;
    // O desenho do nome está 5 mm à direita do transform (como um grow com âncora deslocaria).
    rects.set(NOME, { ...nomeRect, left: nomeRect.left + mm(5) });
    const boxes: FrameBoxes = (ids) => new Map(ids.map((id) => [id, rects.get(id) as DrawRect]));
    const { stores, actions } = open('page-produto', boxes);
    stores.selection.getState().select([NOME, PRECO]);
    actions.align('left');
    // A borda esquerda da seleção é a do preço (x 10): o nome anda −5 mm sobre o transform.
    expect([x(stores, NOME), x(stores, PRECO)]).toEqual([5, 10]);
  });

  it('E11: frame travado na seleção é ignorado', () => {
    const { stores, actions } = open('page-capa');
    stores.selection.getState().select(['frame-fundo-capa']);
    expect(actions.align('left')).toBe(false);
    expect(actions.nudge(1, 0, false)).toBe(false);
  });
});
