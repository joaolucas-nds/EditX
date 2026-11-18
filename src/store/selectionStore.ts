/**
 * selectionStore.ts
 *
 * Quais frames estão selecionados (DEC-021). Só ids — o frame em si mora no
 * `documentStore`. Seleção não entra no histórico.
 */

import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';

export interface SelectionState {
  /** Ids dos frames selecionados, na ordem em que foram escolhidos, sem repetição. */
  selectedIds: string[];
  /** Troca a seleção por estes ids (repetidos contam uma vez). */
  select(ids: readonly string[]): void;
  /** Nada selecionado. */
  clear(): void;
}

/** Cria o store da seleção, vazio. */
export function createSelectionStore(): StoreApi<SelectionState> {
  return createStore<SelectionState>()((set) => ({
    selectedIds: [],
    select: (ids) => set({ selectedIds: [...new Set(ids)] }),
    clear: () => set({ selectedIds: [] }),
  }));
}
