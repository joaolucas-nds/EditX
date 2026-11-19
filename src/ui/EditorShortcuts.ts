/**
 * EditorShortcuts.ts
 *
 * Atalhos de teclado do editor (DEC-021, DEC-023): desfazer, refazer e limpar a seleção. Ficam
 * no host, não no canvas: valem para a janela inteira, e o canvas não tem foco de teclado.
 * `shortcutFor` é pura (testada em Node); `useEditorShortcuts` só a liga ao `keydown`.
 */

import { useEffect } from 'react';
import type { EditorStores } from '../store/documentStore';

/** O que uma tecla faz no editor. */
export type EditorShortcut = 'undo' | 'redo' | 'deselect';

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
 * Ctrl + Y também (o atalho do Windows); Esc limpa a seleção. Com Alt, nada.
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
  return null;
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
export function useEditorShortcuts(stores: EditorStores): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return;
      const shortcut = shortcutFor(event);
      if (shortcut === null) return;
      event.preventDefault();
      if (shortcut === 'undo') stores.document.getState().undo();
      else if (shortcut === 'redo') stores.document.getState().redo();
      else stores.selection.getState().clear();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stores]);
}
