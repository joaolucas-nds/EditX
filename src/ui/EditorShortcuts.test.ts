import { describe, expect, it } from 'vitest';
import { shortcutFor } from './EditorShortcuts';
import type { ShortcutKey } from './EditorShortcuts';

/** Uma tecla sem modificador, com os modificadores que o teste pedir. */
const press = (key: string, mods: Partial<Omit<ShortcutKey, 'key'>> = {}): ShortcutKey => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
});

describe('shortcutFor', () => {
  it('K1: Ctrl+Z desfaz; Cmd+Z também (Mac)', () => {
    expect(shortcutFor(press('z', { ctrlKey: true }))).toBe('undo');
    expect(shortcutFor(press('z', { metaKey: true }))).toBe('undo');
  });

  it('K2: Ctrl+Shift+Z refaz — com o Shift, a tecla chega maiúscula', () => {
    expect(shortcutFor(press('Z', { ctrlKey: true, shiftKey: true }))).toBe('redo');
  });

  it('K3: Ctrl+Y refaz (o atalho do Windows)', () => {
    expect(shortcutFor(press('y', { ctrlKey: true }))).toBe('redo');
  });

  it('K4: Esc limpa a seleção', () => {
    expect(shortcutFor(press('Escape'))).toBe('deselect');
  });

  it('K5: sem Ctrl, com Alt ou com Shift+Y, nada', () => {
    expect(shortcutFor(press('z'))).toBeNull();
    expect(shortcutFor(press('z', { ctrlKey: true, altKey: true }))).toBeNull();
    expect(shortcutFor(press('y', { ctrlKey: true, shiftKey: true }))).toBeNull();
    expect(shortcutFor(press('Escape', { ctrlKey: true }))).toBeNull();
  });
});
