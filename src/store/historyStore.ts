/**
 * historyStore.ts
 *
 * Pilhas de desfazer e refazer (DEC-021). Cada entrada guarda os patches de UMA mudança
 * do template e os inversos dela — quem aplica é o `documentStore`; este store só faz a
 * contabilidade das pilhas. Não conhece o documento.
 */

import type { Patch } from 'immer';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';

/** Uma mudança do template: o que ela fez e como desfazê-la. */
export interface HistoryEntry {
  /** Rótulo curto da ação (ex.: «mover frame-foto-produto») — para a UI e para depurar. */
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
  /**
   * Entradas seguidas com a mesma chave viram UMA (DEC-024: toques de seta na mesma seleção).
   * Sem chave, a entrada nunca junta.
   */
  mergeKey?: string;
  /** Quando a mudança foi feita (ms, `Date.now()` ou o relógio dado ao editor) — a janela da fusão. */
  at?: number;
}

/** Até quanto tempo depois da anterior uma entrada com a mesma `mergeKey` junta com ela (ms). */
export const MERGE_WINDOW_MS = 1000;

export interface HistoryState {
  /** Mudanças feitas, da mais antiga à mais recente. */
  past: HistoryEntry[];
  /** Mudanças desfeitas, da mais antiga à mais recente (a próxima a refazer é a última). */
  future: HistoryEntry[];
  /**
   * Grava uma mudança nova: apaga o que dava para refazer e respeita o limite. Junta com a última
   * quando as duas têm a mesma `mergeKey`, a nova veio em até `MERGE_WINDOW_MS` e não há o que
   * refazer (depois de um desfazer, nada junta).
   */
  record(entry: HistoryEntry): void;
  /** Tira a última mudança de `past` e a põe em `future`. @returns a entrada, ou `undefined`. */
  takeUndo(): HistoryEntry | undefined;
  /** Tira a última de `future` e a devolve a `past`. @returns a entrada, ou `undefined`. */
  takeRedo(): HistoryEntry | undefined;
  /** Esvazia as duas pilhas. */
  clear(): void;
}

/**
 * Cria o store do histórico.
 *
 * @param limit - quantas mudanças `past` guarda; passou disso, a mais antiga sai
 */
export function createHistoryStore(limit: number): StoreApi<HistoryState> {
  return createStore<HistoryState>()((set, get) => ({
    past: [],
    future: [],
    record: (entry) => {
      const { past: before, future } = get();
      const last = before.at(-1);
      if (
        entry.mergeKey !== undefined &&
        future.length === 0 &&
        last !== undefined &&
        last.mergeKey === entry.mergeKey &&
        last.at !== undefined &&
        entry.at !== undefined &&
        entry.at - last.at <= MERGE_WINDOW_MS
      ) {
        // Fazer = a anterior e depois a nova; desfazer = a inversa da nova e depois a da anterior.
        const merged: HistoryEntry = {
          label: entry.label,
          patches: [...last.patches, ...entry.patches],
          inversePatches: [...entry.inversePatches, ...last.inversePatches],
          mergeKey: entry.mergeKey,
          at: entry.at,
        };
        set({ past: [...before.slice(0, -1), merged] });
        return;
      }
      const past = [...before, entry];
      set({ past: past.length > limit ? past.slice(past.length - limit) : past, future: [] });
    },
    takeUndo: () => {
      const { past, future } = get();
      const entry = past.at(-1);
      if (entry === undefined) return undefined;
      set({ past: past.slice(0, -1), future: [...future, entry] });
      return entry;
    },
    takeRedo: () => {
      const { past, future } = get();
      const entry = future.at(-1);
      if (entry === undefined) return undefined;
      set({ past: [...past, entry], future: future.slice(0, -1) });
      return entry;
    },
    clear: () => set({ past: [], future: [] }),
  }));
}
