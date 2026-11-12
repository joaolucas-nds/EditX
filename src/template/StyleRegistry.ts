/**
 * StyleRegistry.ts
 *
 * Estilos de texto globais com herança, como FUNÇÕES PURAS sobre o mapa
 * `textStyles` do documento (DEC-015). Não há registro com estado: o mapa vive
 * no `documentStore` (Zustand + Immer, DEC-004), e a propagação «altero o pai,
 * os filhos mudam» vem de o estilo final ser sempre resolvido do mapa ATUAL.
 *
 * Nenhuma função aqui muta o mapa recebido; as que editam devolvem um mapa novo.
 */

import type { TextStyleMap } from './TemplateSchema';
import type { TextStyle, TextStyleProps } from '../types/frame.types';

/** Lançado quando um estilo não existe, ou quando a operação quebraria a herança. */
export class StyleRegistryError extends Error {
  /** Nome do estilo que causou o erro. */
  readonly styleName: string;

  constructor(styleName: string, message: string) {
    super(message);
    this.name = 'StyleRegistryError';
    this.styleName = styleName;
  }
}

/** As 10 chaves de `TextStyleProps`; o `Record` faz o build falhar se a interface mudar sem esta lista. */
const PROP_KEYS = Object.keys({
  fontFamily: 0,
  fontWeight: 0,
  fontSize: 0,
  lineHeight: 0,
  letterSpacing: 0,
  color: 0,
  align: 0,
  verticalAlign: 0,
  transform: 0,
  decoration: 0,
} satisfies Record<keyof TextStyleProps, 0>) as (keyof TextStyleProps)[];

/**
 * Cache do estilo final por mapa. Chave pela IDENTIDADE do mapa: com Immer todo
 * edit produz um mapa novo, então o cache nunca serve valor velho — desde que
 * ninguém mute o mapa no lugar (DEC-015).
 */
const resolvedCache = new WeakMap<TextStyleMap, Map<string, Readonly<TextStyleProps>>>();

/**
 * Sobe a cadeia de `basedOn` a partir de `name` e devolve os nomes do mais
 * específico até a raiz (inclusive `name`). Lança se um elo não existe ou se há ciclo.
 */
function chainOf(styles: TextStyleMap, name: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let current: string | null = name;
  while (current !== null) {
    if (seen.has(current)) {
      throw new StyleRegistryError(
        current,
        `Ciclo de herança de estilos: ${[...chain, current].join(' -> ')}.`,
      );
    }
    const style: TextStyle | undefined = Object.hasOwn(styles, current)
      ? styles[current]
      : undefined;
    if (style === undefined) {
      const msg =
        current === name
          ? `O estilo "${name}" não existe.`
          : `O estilo "${chain[chain.length - 1]}" herda de "${current}", que não existe.`;
      throw new StyleRegistryError(current, msg);
    }
    seen.add(current);
    chain.push(current);
    current = style.basedOn;
  }
  return chain;
}

/**
 * Estilo final de `name`: aplica as propriedades da raiz até o estilo pedido
 * (o mais específico vence; propriedade `undefined` num derivado não sobrescreve).
 *
 * O resultado é congelado e cacheado por (mapa, nome): mesmo mapa + mesmo nome
 * devolve a MESMA referência. Isso pressupõe que o mapa não é mutado no lugar
 * (Immer, DEC-004) — mutação direta serve estilo velho.
 *
 * @throws StyleRegistryError se `name` ou um pai da cadeia não existe, se há
 * ciclo, ou se a raiz não tem as 10 propriedades.
 */
export function resolveStyle(styles: TextStyleMap, name: string): Readonly<TextStyleProps> {
  let perMap = resolvedCache.get(styles);
  const cached = perMap?.get(name);
  if (cached !== undefined) return cached;

  const chain = chainOf(styles, name);
  const merged: Partial<TextStyleProps> = {};
  // Da raiz (fim da cadeia) para o pedido: quem vem depois sobrescreve.
  for (let i = chain.length - 1; i >= 0; i--) {
    const style = styles[chain[i]];
    for (const key of PROP_KEYS) {
      const value = style[key];
      if (value !== undefined) Object.assign(merged, { [key]: value });
    }
  }

  const missing = PROP_KEYS.filter((key) => merged[key] === undefined);
  if (missing.length > 0) {
    const root = chain[chain.length - 1];
    throw new StyleRegistryError(
      root,
      `O estilo raiz "${root}" não tem as propriedades: ${missing.join(', ')}.`,
    );
  }

  // `basedOn` não entra: o resultado tem exatamente as 10 chaves de TextStyleProps.
  const resolved = Object.freeze(merged as TextStyleProps);
  if (perMap === undefined) {
    perMap = new Map();
    resolvedCache.set(styles, perMap);
  }
  perMap.set(name, resolved);
  return resolved;
}

/**
 * Estilos cuja cadeia passa por `name` (filhos, netos…), sem incluir `name`,
 * em ordem alfabética.
 *
 * @throws StyleRegistryError se `name` não existe.
 */
export function dependentsOf(styles: TextStyleMap, name: string): string[] {
  if (!Object.hasOwn(styles, name)) {
    throw new StyleRegistryError(name, `O estilo "${name}" não existe.`);
  }
  return Object.keys(styles)
    .filter((other) => {
      if (other === name) return false;
      // Cadeia quebrada (pai ausente, ciclo) não é dependente de ninguém aqui.
      try {
        return chainOf(styles, other).includes(name);
      } catch {
        return false;
      }
    })
    .sort();
}

/**
 * Mapa NOVO com `name` = `style` (inclui ou troca); o original fica intacto e
 * `style` entra como recebido, sem clonar.
 *
 * @throws StyleRegistryError se `style.basedOn` não existe no mapa, é o próprio
 * `name`, ou tem `name` na própria cadeia (criaria ciclo).
 */
export function setStyle(styles: TextStyleMap, name: string, style: TextStyle): TextStyleMap {
  const parent = style.basedOn;
  if (parent !== null) {
    if (parent === name) {
      throw new StyleRegistryError(name, `O estilo "${name}" não pode herdar de si mesmo.`);
    }
    if (!Object.hasOwn(styles, parent)) {
      throw new StyleRegistryError(
        name,
        `O estilo "${name}" herda de "${parent}", que não existe.`,
      );
    }
    // Se `name` já está na cadeia do novo pai, o novo elo fecharia um ciclo.
    // Caminha sem exigir a cadeia inteira: para em `null`, em pai inexistente ou
    // em nome já visitado — cadeia já quebrada no mapa recebido não esconde o ciclo.
    const visited: string[] = [];
    let current: string | null = parent;
    while (current !== null && !visited.includes(current) && Object.hasOwn(styles, current)) {
      if (current === name) {
        throw new StyleRegistryError(
          name,
          `Herdar de "${parent}" criaria um ciclo: ${[name, ...visited].join(' -> ')}.`,
        );
      }
      visited.push(current);
      current = styles[current].basedOn;
    }
  }
  return { ...styles, [name]: style };
}

/**
 * Mapa NOVO sem `name`. Frames que usam o estilo não são problema deste módulo:
 * o validador os acusa ao salvar.
 *
 * @throws StyleRegistryError se `name` não existe, ou se algum estilo herda
 * dele diretamente (a mensagem lista os filhos, em ordem).
 */
export function removeStyle(styles: TextStyleMap, name: string): TextStyleMap {
  if (!Object.hasOwn(styles, name)) {
    throw new StyleRegistryError(name, `O estilo "${name}" não existe.`);
  }
  const children = Object.keys(styles)
    .filter((other) => styles[other].basedOn === name)
    .sort();
  if (children.length > 0) {
    throw new StyleRegistryError(
      name,
      `O estilo "${name}" não pode ser removido: ${children.join(', ')} herda(m) dele.`,
    );
  }
  const rest = { ...styles };
  delete rest[name];
  return rest;
}
