/**
 * FontRegistry.ts
 *
 * Liga família + peso ao arquivo `.ttf` do app e carrega a fonte com o
 * `opentype.js` (DEC-017). Carregamento separado do layout: o `TextLayout.ts`
 * recebe a `Font` já pronta e continua puro.
 */

import type { Font } from 'opentype.js';
import { parse } from 'opentype.js';

/** Um arquivo de fonte do app: família + peso → URL servido da pasta `public/`. */
export interface FontFace {
  family: string;
  weight: number;
  url: string;
}

/** Fontes disponíveis na F1 (DEC-017). Acrescentar família = arquivo em `public/fonts/` + linha aqui. */
export const FONT_CATALOG: readonly FontFace[] = [
  { family: 'Montserrat', weight: 400, url: '/fonts/montserrat/Montserrat-Regular.ttf' },
  { family: 'Montserrat', weight: 600, url: '/fonts/montserrat/Montserrat-SemiBold.ttf' },
  { family: 'Montserrat', weight: 700, url: '/fonts/montserrat/Montserrat-Bold.ttf' },
  { family: 'Montserrat', weight: 800, url: '/fonts/montserrat/Montserrat-ExtraBold.ttf' },
];

/** Família pedida que não está no catálogo — erro visível, nunca troca silenciosa de fonte. */
export class FontNotAvailableError extends Error {
  /** Família pedida que não está no catálogo. */
  readonly family: string;

  constructor(family: string, available: readonly string[]) {
    super(
      `Fonte "${family}" não está disponível. Famílias disponíveis: ${available.join(', ') || '(nenhuma)'}.`,
    );
    this.name = 'FontNotAvailableError';
    this.family = family;
  }
}

/**
 * Escolhe o arquivo de `family` mais próximo de `weight`, pela regra de
 * correspondência de peso do CSS (CSS Fonts 4, «font-weight»), só entre os pesos
 * que a família tem. Família fora do catálogo lança `FontNotAvailableError`.
 */
export function pickFace(
  family: string,
  weight: number,
  catalog: readonly FontFace[] = FONT_CATALOG,
): FontFace {
  const faces = catalog.filter((face) => face.family === family);
  if (faces.length === 0) {
    throw new FontNotAvailableError(family, [...new Set(catalog.map((face) => face.family))]);
  }

  const weights = faces.map((face) => face.weight);
  const ascending = [...weights].sort((a, b) => a - b);
  const descending = [...ascending].reverse();
  const below = descending.filter((w) => w < weight);
  const above = ascending.filter((w) => w > weight);

  let order: number[];
  if (weight >= 400 && weight <= 500) {
    order = [...above.filter((w) => w <= 500), ...below, ...above.filter((w) => w > 500)];
  } else if (weight < 400) {
    order = [...below, ...above];
  } else {
    order = [...above, ...below];
  }

  const chosen = weights.includes(weight) ? weight : order[0];
  return faces.find((face) => face.weight === chosen) as FontFace;
}

/** Entrega os bytes de um arquivo de fonte a partir do URL. */
export type FontLoader = (url: string) => Promise<ArrayBuffer>;

/** Carregador do navegador: `fetch` do URL; resposta não-`ok` vira erro com URL e status. */
export const fetchFontLoader: FontLoader = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar a fonte ${url}: HTTP ${response.status}.`);
  }
  return response.arrayBuffer();
};

/**
 * Carrega e guarda em cache as fontes do catálogo. O cache é por URL e guarda a
 * `Promise`, então duas chamadas simultâneas rodam o carregador uma vez só.
 */
export class FontRegistry {
  private readonly loader: FontLoader;
  private readonly catalog: readonly FontFace[];
  private readonly cache = new Map<string, Promise<Font>>();

  constructor(loader: FontLoader = fetchFontLoader, catalog: readonly FontFace[] = FONT_CATALOG) {
    this.loader = loader;
    this.catalog = catalog;
  }

  /**
   * Devolve a `Font` de `family`/`weight`. Se o peso exato não existe, usa o mais
   * próximo (`pickFace`) e avisa no console. Carga que falha sai do cache.
   */
  load(family: string, weight: number): Promise<Font> {
    const face = pickFace(family, weight, this.catalog);
    if (face.weight !== weight) {
      console.warn(`Fonte "${family}" não tem o peso ${weight}; usando o peso ${face.weight}.`);
    }

    const cached = this.cache.get(face.url);
    if (cached) return cached;

    const pending = this.loader(face.url).then((buffer) => parse(buffer));
    this.cache.set(face.url, pending);
    pending.catch(() => {
      if (this.cache.get(face.url) === pending) this.cache.delete(face.url);
    });
    return pending;
  }
}
