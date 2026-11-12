import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from './__examples__/catalogo-simples.example';
import type { TextStyleMap } from './TemplateSchema';
import {
  dependentsOf,
  removeStyle,
  resolveStyle,
  setStyle,
  StyleRegistryError,
} from './StyleRegistry';
import { validateTemplate } from './TemplateValidator';
import type { TextStyle } from '../types/frame.types';

/** Cópia do mapa do exemplo — o export é compartilhado, e `setStyle` não deve vazar entre testes. */
const fresh = (): TextStyleMap => structuredClone(catalogoSimplesExample.textStyles);

describe('StyleRegistry', () => {
  it('S1: raiz resolve para o próprio estilo, sem basedOn', () => {
    const styles = fresh();
    const expected: Record<string, unknown> = { ...styles['titulo-capa'] };
    delete expected.basedOn;
    expect(resolveStyle(styles, 'titulo-capa')).toEqual(expected);
  });

  it('S2: derivado herda da raiz e sobrescreve o que tem', () => {
    const styles = fresh();
    const pai: Record<string, unknown> = { ...styles['titulo-produto'] };
    delete pai.basedOn;
    const resolved = resolveStyle(styles, 'preco-destaque');
    expect(resolved).toEqual({ ...pai, fontWeight: 800, fontSize: 22, color: '#E63946' });
    expect(resolved).not.toHaveProperty('basedOn');
  });

  it('S3: neto herda do pai e da raiz', () => {
    const styles = setStyle(fresh(), 'preco-promo', {
      basedOn: 'preco-destaque',
      color: '#000000',
    });
    const resolved = resolveStyle(styles, 'preco-promo');
    expect(resolved.fontSize).toBe(22);
    expect(resolved.color).toBe('#000000');
    expect(resolved.fontFamily).toBe('Montserrat');
  });

  it('S4: editar o pai muda o filho no mapa novo e não no antigo', () => {
    const antigo = fresh();
    const pai = antigo['titulo-produto'];
    const novo = setStyle(antigo, 'titulo-produto', { ...pai, fontFamily: 'Inter' } as TextStyle);
    expect(resolveStyle(novo, 'preco-destaque').fontFamily).toBe('Inter');
    expect(resolveStyle(antigo, 'preco-destaque').fontFamily).toBe('Montserrat');
  });

  it('S5: cache por mapa devolve a mesma referência, congelada', () => {
    const styles = fresh();
    const a = resolveStyle(styles, 'preco-destaque');
    expect(resolveStyle(styles, 'preco-destaque')).toBe(a);
    expect(Object.isFrozen(a)).toBe(true);
    const outro = setStyle(styles, 'titulo-capa', styles['titulo-capa']);
    expect(resolveStyle(outro, 'preco-destaque')).not.toBe(a);
  });

  it('S6: dependentsOf lista filhos e netos em ordem', () => {
    const styles = fresh();
    expect(dependentsOf(styles, 'titulo-produto')).toEqual(['preco-destaque']);
    expect(dependentsOf(styles, 'titulo-capa')).toEqual([]);
    const com = setStyle(styles, 'preco-promo', { basedOn: 'preco-destaque', color: '#000000' });
    expect(dependentsOf(com, 'titulo-produto')).toEqual(['preco-destaque', 'preco-promo']);
  });

  it('S7: setStyle com pai inexistente lança e não muta', () => {
    const styles = fresh();
    const antes = structuredClone(styles);
    expect(() => setStyle(styles, 'x', { basedOn: 'inexistente' })).toThrow(StyleRegistryError);
    expect(styles).toEqual(antes);
  });

  it('S8: setStyle herdando de si mesmo lança', () => {
    expect(() => setStyle(fresh(), 'x', { basedOn: 'x' })).toThrow(StyleRegistryError);
  });

  it('S9: setStyle que criaria ciclo lança e não muta', () => {
    const styles = fresh();
    const antes = structuredClone(styles);
    const pai = styles['titulo-produto'];
    expect(() =>
      setStyle(styles, 'titulo-produto', { ...pai, basedOn: 'preco-destaque' } as TextStyle),
    ).toThrow(StyleRegistryError);
    expect(styles).toEqual(antes);
  });

  it('S10: removeStyle remove folha e recusa quem tem filhos', () => {
    const styles = fresh();
    const sem = removeStyle(styles, 'preco-destaque');
    expect(sem).not.toHaveProperty('preco-destaque');
    expect(styles).toHaveProperty('preco-destaque');
    expect(() => removeStyle(styles, 'titulo-produto')).toThrow(/preco-destaque/);
  });

  it('S11: estilo inexistente lança com styleName', () => {
    try {
      resolveStyle(fresh(), 'inexistente');
      expect.unreachable('devia lançar');
    } catch (e) {
      expect(e).toBeInstanceOf(StyleRegistryError);
      expect((e as StyleRegistryError).styleName).toBe('inexistente');
    }
  });

  it('S12: ciclo montado à mão lança, sem laço infinito', () => {
    const styles: TextStyleMap = {
      a: { basedOn: 'b', fontSize: 10 },
      b: { basedOn: 'a', fontSize: 12 },
    };
    expect(() => resolveStyle(styles, 'a')).toThrow(StyleRegistryError);
  });

  it('S13: todo estilo do exemplo resolve, e o exemplo continua válido', () => {
    const styles = catalogoSimplesExample.textStyles;
    for (const name of Object.keys(styles)) {
      expect(() => resolveStyle(styles, name)).not.toThrow();
    }
    expect(validateTemplate(catalogoSimplesExample).ok).toBe(true);
  });

  it('S14: setStyle acusa ciclo mesmo quando a cadeia do novo pai cai num pai inexistente', () => {
    const styles: TextStyleMap = {
      a: { basedOn: 'fantasma', fontSize: 10 },
      b: { basedOn: 'a' },
    };
    expect(() => setStyle(styles, 'a', { basedOn: 'b' })).toThrow(StyleRegistryError);
  });
});
