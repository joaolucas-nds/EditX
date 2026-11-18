import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import { validateTemplate } from '../template/TemplateValidator';
import type { Transform } from '../types/frame.types';
import { createEditorStores } from './documentStore';
import type { EditorStores } from './documentStore';

const FOTO = 'frame-foto-produto';
const NOME = 'frame-nome-produto';
const moved: Transform = { x: 20, y: 70, width: 190, height: 120, rotation: 0 };

/** O `transform` do frame `id` no estado atual do documento. */
function transformOf(stores: EditorStores, id: string): Transform {
  for (const page of stores.document.getState().template.pages) {
    const frame = page.frames.find((candidate) => candidate.id === id);
    if (frame !== undefined) return frame.transform;
  }
  throw new Error(`o frame ${id} sumiu`);
}

const open = (pageId = 'page-produto', historyLimit?: number) =>
  createEditorStores(catalogoSimplesExample, { pageId, historyLimit });

describe('createEditorStores', () => {
  it('H1: guarda uma cópia do template e abre na primeira página por padrão', () => {
    const original = structuredClone(catalogoSimplesExample);
    const stores = createEditorStores(original);
    original.pages[1].frames[2].transform.x = 999;
    expect(transformOf(stores, FOTO).x).toBe(10);
    expect(stores.document.getState().pageId).toBe('page-capa');
  });

  it('H2: página inicial que não existe lança', () => {
    expect(() => open('nao-existe')).toThrow('nao-existe');
  });

  it('H3: setFrameTransform muda só aquele frame e grava uma entrada', () => {
    const stores = open();
    stores.document.getState().setFrameTransform(FOTO, moved);
    expect(transformOf(stores, FOTO)).toEqual(moved);
    expect(transformOf(stores, NOME).x).toBe(10);
    expect(stores.history.getState().past).toHaveLength(1);
    expect(stores.history.getState().past[0].label).toBe(`mover ${FOTO}`);
    expect(stores.history.getState().future).toHaveLength(0);
  });

  it('H4: desfazer volta ao anterior e refazer refaz', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    expect(stores.document.getState().undo()).toBe(true);
    expect(transformOf(stores, FOTO).x).toBe(10);
    expect(stores.history.getState().past).toHaveLength(0);
    expect(stores.history.getState().future).toHaveLength(1);
    expect(stores.document.getState().redo()).toBe(true);
    expect(transformOf(stores, FOTO).x).toBe(20);
  });

  it('H5: mudança nova depois de desfazer apaga o que dava para refazer', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.setFrameTransform(FOTO, { ...moved, x: 30 });
    expect(stores.history.getState().future).toHaveLength(0);
    expect(stores.history.getState().past).toHaveLength(1);
    expect(doc.redo()).toBe(false);
  });

  it('H6: mudança que não muda nada não entra no histórico nem troca o template', () => {
    const stores = open();
    const before = stores.document.getState().template;
    stores.document.getState().setFrameTransform(FOTO, { ...transformOf(stores, FOTO) });
    expect(stores.history.getState().past).toHaveLength(0);
    expect(stores.document.getState().template).toBe(before);
  });

  it('H7: frame que não existe lança e não grava nada', () => {
    const stores = open();
    expect(() => stores.document.getState().setFrameTransform('nao-existe', moved)).toThrow(
      'nao-existe',
    );
    expect(stores.history.getState().past).toHaveLength(0);
  });

  it('H8: passou do limite, a mudança mais antiga sai', () => {
    const stores = open('page-produto', 3);
    const doc = stores.document.getState();
    for (const x of [21, 22, 23, 24]) doc.setFrameTransform(FOTO, { ...moved, x });
    expect(stores.history.getState().past).toHaveLength(3);
    doc.undo();
    doc.undo();
    doc.undo();
    expect(transformOf(stores, FOTO).x).toBe(21);
    expect(doc.undo()).toBe(false);
  });

  it('H9: desfazer e refazer sem nada são inofensivos', () => {
    const stores = open();
    const before = stores.document.getState().template;
    expect(stores.document.getState().undo()).toBe(false);
    expect(stores.document.getState().redo()).toBe(false);
    expect(stores.document.getState().template).toBe(before);
  });

  it('H10: trocar de página não entra no histórico e limpa a seleção', () => {
    const stores = open();
    stores.selection.getState().select([FOTO]);
    stores.document.getState().setPage('page-capa');
    expect(stores.document.getState().pageId).toBe('page-capa');
    expect(stores.selection.getState().selectedIds).toEqual([]);
    expect(stores.history.getState().past).toHaveLength(0);
    expect(() => stores.document.getState().setPage('nao-existe')).toThrow('nao-existe');
  });

  it('H11: seleção sem repetição, e limpa', () => {
    const stores = open();
    stores.selection.getState().select([FOTO, FOTO, NOME]);
    expect(stores.selection.getState().selectedIds).toEqual([FOTO, NOME]);
    stores.selection.getState().clear();
    expect(stores.selection.getState().selectedIds).toEqual([]);
  });

  it('H12: depois de mudar, desfazer e refazer, o documento continua válido', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.redo();
    expect(validateTemplate(stores.document.getState().template).ok).toBe(true);
  });

  it('H13: quem assina o documento é avisado da mudança e do desfazer — e não da mudança vazia', () => {
    const stores = open();
    let calls = 0;
    stores.document.subscribe(() => {
      calls += 1;
    });
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.setFrameTransform(FOTO, { ...transformOf(stores, FOTO) });
    expect(calls).toBe(2);
  });
});
