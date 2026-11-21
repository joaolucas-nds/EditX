/**
 * EditorShortcuts.ts
 *
 * Atalhos de teclado do editor (DEC-021, DEC-023, DEC-024): desfazer, refazer, limpar e
 * selecionar tudo, e as setas para empurrar. Ficam no host, não no canvas: valem para a janela
 * inteira, e o canvas não tem foco de teclado. `shortcutFor` e `nudgeFor` são puras (testadas em
 * Node); `useEditorShortcuts` só as liga ao `keydown`. Alinhar e distribuir NÃO têm atalho até a
 * Toolbar (DEC-024).
 */

import { useEffect } from 'react';
import type { EditorStores } from '../store/documentStore';
import type { EditorActions } from './EditorActions';

/** O que uma tecla faz no editor. */
export type EditorShortcut = 'undo' | 'redo' | 'deselect' | 'selectAll';

/** O que interessa de um `KeyboardEvent` para decidir o atalho. */
export interface ShortcutKey {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * O atalho desta tecla, ou `null`. Ctrl (ou Cmd no Mac) + Z desfaz; + Shift + Z refaz, e
 * Ctrl + Y também (o atalho do Windows); Ctrl + A seleciona tudo; Esc limpa a seleção. Com Alt,
 * nada.
 */
export function shortcutFor(event: ShortcutKey): EditorShortcut | null {
  if (event.altKey) return null;
  const key = event.key.toLowerCase();
  const command = event.ctrlKey || event.metaKey;
  if (!command) {
    return key === 'escape' && !event.shiftKey ? 'deselect' : null;
  }
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
  if (key === 'y' && !event.shiftKey) return 'redo';
  if (key === 'a' && !event.shiftKey) return 'selectAll';
  return null;
}

/** Direção de cada seta, em passos (x para a direita, y para baixo). */
const ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/**
 * O empurrão desta tecla, ou `null`: seta sozinha anda 1 mm, com Shift 10 mm (DEC-024). Com
 * Ctrl, Cmd ou Alt, nada (ficam livres para atalhos futuros).
 */
export function nudgeFor(event: ShortcutKey): { dx: number; dy: number; big: boolean } | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const arrow = ARROWS[event.key];
  if (arrow === undefined) return null;
  return { dx: arrow[0], dy: arrow[1], big: event.shiftKey };
}

/** A tecla foi digitada num campo de texto — ali Ctrl+Z é do campo, não do editor. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/** Liga os atalhos do editor à janela enquanto o componente estiver montado. */
export function useEditorShortcuts(stores: EditorStores, actions: EditorActions): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return;
      const nudge = nudgeFor(event);
      if (nudge !== null) {
        event.preventDefault();
        actions.nudge(nudge.dx, nudge.dy, nudge.big);
        return;
      }
      const shortcut = shortcutFor(event);
      if (shortcut === null) return;
      event.preventDefault();
      if (shortcut === 'undo') stores.document.getState().undo();
      else if (shortcut === 'redo') stores.document.getState().redo();
      else if (shortcut === 'selectAll') actions.selectAll();
      else stores.selection.getState().clear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stores, actions]);
}
