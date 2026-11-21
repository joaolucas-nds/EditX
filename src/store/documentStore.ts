/**
 * documentStore.ts
 *
 * O documento aberto no editor e as ações que o mudam (DEC-004, DEC-021). Toda mudança do
 * template passa por `edit`, que roda a receita com `produceWithPatches` do Immer e grava
 * os patches no `historyStore` — é o que faz desfazer e refazer valerem para qualquer ação,
 * presente ou futura. Página ativa e seleção NÃO entram no histórico. Os stores são de
 * `zustand/vanilla`: funcionam fora do React (e nos testes, em Node); o React lê com
 * `useStore` do `zustand`.
 */

import { applyPatches, enablePatches, produceWithPatches } from 'immer';
import type { Draft } from 'immer';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { EditxTemplate } from '../template/TemplateSchema';
import type { Transform } from '../types/frame.types';
import { createHistoryStore } from './historyStore';
import type { HistoryState } from './historyStore';
import { createSelectionStore } from './selectionStore';
import type { SelectionState } from './selectionStore';

enablePatches();

export interface DocumentState {
  /** O template aberto — uma cópia do que foi carregado, nunca o objeto de quem chamou. */
  template: EditxTemplate;
  /** Página mostrada no canvas. */
  pageId: string;
  /**
   * Troca a página mostrada. Não entra no histórico; limpa a seleção.
   * @throws Error se a página não existe.
   */
  setPage(pageId: string): void;
  /**
   * Troca o `transform` de um frame — o que a seleção chama ao soltar um arraste. Valores
   * iguais aos atuais não mudam nada e não entram no histórico.
   * @throws Error se o frame não existe.
   */
  setFrameTransform(frameId: string, transform: Transform): void;
  /**
   * Troca o `transform` de vários frames numa entrada de desfazer só (DEC-024: mover em grupo,
   * alinhar, distribuir, empurrar). Rótulo padrão: o de `setFrameTransform` para um frame;
   * «mover N frames» (ou «redimensionar») para vários. `mergeKey`: ver `HistoryEntry`.
   * @throws Error se algum frame não existe — e aí nada muda.
   */
  setFrameTransforms(
    changes: Readonly<Record<string, Transform>>,
    options?: { label?: string; mergeKey?: string },
  ): void;
  /** Desfaz a última mudança do template. @returns `false` se não havia o que desfazer. */
  undo(): boolean;
  /** Refaz a última mudança desfeita. @returns `false` se não havia o que refazer. */
  redo(): boolean;
}

/** Os três stores de um editor aberto, ligados entre si. */
export interface EditorStores {
  document: StoreApi<DocumentState>;
  history: StoreApi<HistoryState>;
  selection: StoreApi<SelectionState>;
}

export interface EditorStoresOptions {
  /** Página inicial; padrão: a primeira do template. */
  pageId?: string;
  /** Quantas mudanças o histórico guarda; padrão: 100. */
  historyLimit?: number;
  /** Relógio das entradas do histórico (a janela de fusão); padrão: `Date.now`. Para teste. */
  now?: () => number;
}

/** Ids de frame são únicos no documento inteiro (o validador cobra), então basta procurar em todas as páginas. */
function hasFrame(template: EditxTemplate, frameId: string): boolean {
  return template.pages.some((page) => page.frames.some((frame) => frame.id === frameId));
}

/**
 * Cria os stores de um editor com `template` aberto. Guarda uma CÓPIA do template: o Immer
 * congela o estado depois da primeira mudança, e o objeto de quem chamou não deve mudar
 * nem congelar.
 *
 * @throws Error se `options.pageId` não existe no template, ou se ele não tem páginas.
 */
export function createEditorStores(
  template: EditxTemplate,
  options: EditorStoresOptions = {},
): EditorStores {
  const initial = structuredClone(template);
  const pageId = options.pageId ?? initial.pages[0]?.id;
  if (pageId === undefined || !initial.pages.some((page) => page.id === pageId)) {
    throw new Error(`A página "${String(pageId)}" não existe no template.`);
  }
  const history = createHistoryStore(options.historyLimit ?? 100);
  const now = options.now ?? Date.now;
  const selection = createSelectionStore();

  const document = createStore<DocumentState>()((set, get) => {
    /** Ponto ÚNICO de mudança do template: aplica a receita e grava os patches, se algo mudou. */
    const edit = (
      label: string,
      recipe: (draft: Draft<EditxTemplate>) => void,
      mergeKey?: string,
    ): void => {
      const [next, patches, inversePatches] = produceWithPatches(get().template, recipe);
      if (patches.length === 0) return;
      set({ template: next });
      history.getState().record({ label, patches, inversePatches, mergeKey, at: now() });
    };

    return {
      template: initial,
      pageId,
      setPage: (next) => {
        if (!get().template.pages.some((page) => page.id === next)) {
          throw new Error(`A página "${next}" não existe no template.`);
        }
        set({ pageId: next });
        selection.getState().clear();
      },
      setFrameTransform: (frameId, transform) => {
        get().setFrameTransforms({ [frameId]: transform });
      },
      setFrameTransforms: (changes, options = {}) => {
        const ids = Object.keys(changes);
        for (const frameId of ids) {
          if (!hasFrame(get().template, frameId)) {
            throw new Error(`O frame "${frameId}" não existe no template.`);
          }
        }
        // Rótulo do histórico: o tamanho mudou = redimensionar; só a posição = mover (DEC-023).
        const frames = get().template.pages.flatMap((page) => page.frames);
        const resized = ids.some((frameId) => {
          const before = frames.find((frame) => frame.id === frameId)?.transform;
          const after = changes[frameId];
          return (
            before !== undefined && (before.width !== after.width || before.height !== after.height)
          );
        });
        const verb = resized ? 'redimensionar' : 'mover';
        const label =
          options.label ??
          (ids.length === 1 ? `${verb} ${ids[0]}` : `${verb} ${ids.length} frames`);
        edit(
          label,
          (draft) => {
            for (const page of draft.pages) {
              for (const frame of page.frames) {
                const transform = changes[frame.id];
                // Campo por campo: valor igual não é mudança para o Immer; objeto novo seria.
                if (transform !== undefined) Object.assign(frame.transform, transform);
              }
            }
          },
          options.mergeKey,
        );
      },
      undo: () => {
        const entry = history.getState().takeUndo();
        if (entry === undefined) return false;
        set({ template: applyPatches(get().template, entry.inversePatches) });
        return true;
      },
      redo: () => {
        const entry = history.getState().takeRedo();
        if (entry === undefined) return false;
        set({ template: applyPatches(get().template, entry.patches) });
        return true;
      },
    };
  });

  return { document, history, selection };
}
