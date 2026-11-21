import { describe, expect, it } from 'vitest';
import { nudgeFor, shortcutFor } from './EditorShortcuts';
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

  it('K6: Ctrl+A seleciona tudo; Ctrl+Shift+A não', () => {
    expect(shortcutFor(press('a', { ctrlKey: true }))).toBe('selectAll');
    expect(shortcutFor(press('A', { ctrlKey: true, shiftKey: true }))).toBeNull();
  });
});

describe('nudgeFor', () => {
  it('K7: cada seta dá a sua direção; com Shift, o passo grande', () => {
    expect(nudgeFor(press('ArrowLeft'))).toEqual({ dx: -1, dy: 0, big: false });
    expect(nudgeFor(press('ArrowDown', { shiftKey: true }))).toEqual({ dx: 0, dy: 1, big: true });
  });

  it('K8: com Ctrl, Cmd ou Alt, ou outra tecla, nada', () => {
    expect(nudgeFor(press('ArrowUp', { ctrlKey: true }))).toBeNull();
    expect(nudgeFor(press('ArrowUp', { metaKey: true }))).toBeNull();
    expect(nudgeFor(press('ArrowUp', { altKey: true }))).toBeNull();
    expect(nudgeFor(press('z'))).toBeNull();
  });
});
