/**
 * FrameValidator.ts
 *
 * Motor de regras do `TemplateValidator.ts` (primitivas, objeto estrito, união
 * discriminada) mais as regras dos FRAMES — extraído por tamanho (~300 linhas
 * por arquivo, CONTEXT.md). Os tipos públicos do validador continuam em
 * `TemplateValidator.ts`; aqui só os importamos como tipo, o que mantém o grafo
 * de módulos sem ciclo em tempo de execução. Ver DEC-013.
 */

import type {
  ImageFit,
  ImageHorizontalAlign,
  OverflowMode,
  ShapeKind,
  StrokeStyle,
  TextAnchor,
} from '../types/frame.types';
import type { ValidationError, ValidationErrorCode } from './TemplateValidator';

export type Obj = Record<string, unknown>;

/** Estado de uma validação em curso: erros coletados e o que as regras entre-nós precisam lembrar. */
export interface Ctx {
  errors: ValidationError[];
  pageIds: Set<string>;
  /** Único no DOCUMENTO inteiro, não por página (JSDoc de `BaseFrame.id`). */
  frameIds: Set<string>;
  /** `null` quando `textStyles` não é objeto: sem lista confiável não há referência a checar. */
  styleNames: Set<string> | null;
}

/** Regra sobre um valor já presente. Não devolve nada: reporta em `ctx.errors`. */
export type Check = (value: unknown, path: string, ctx: Ctx) => void;
/** Campo de um objeto: obrigatório (a própria regra) ou opcional. */
export type Field = Check | { check: Check; optional: true };
export type Spec = Record<string, Field>;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

// ---------------------------------------------------------------- utilidades

export const isObject = (v: unknown): v is Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const child = (path: string, key: string) => `${path}.${key}`;
const at = (path: string, i: number) => `${path}[${i}]`;
export const keyed = (path: string, key: string) => `${path}[${JSON.stringify(key)}]`;

function describe(v: unknown): string {
  if (v === null) return 'nulo';
  if (Array.isArray(v)) return 'uma lista';
  const names: Record<string, string> = {
    string: 'um texto',
    number: 'um número',
    boolean: 'um booleano',
    object: 'um objeto',
  };
  return names[typeof v] ?? 'um valor inesperado';
}

export function fail(ctx: Ctx, path: string, code: ValidationErrorCode, message: string): void {
  ctx.errors.push({ path, code, message });
}

export function typeError(ctx: Ctx, path: string, expected: string, v: unknown): void {
  fail(ctx, path, 'invalid-type', `${path}: esperado ${expected}, mas veio ${describe(v)}.`);
}

export const optional = (check: Check): Field => ({ check, optional: true });

/**
 * Valida um objeto contra `spec`: campo obrigatório ausente → `missing-field`,
 * chave fora do spec → `unknown-field`. Devolve o objeto, ou `null` se o valor
 * nem objeto é (então não desce).
 */
export function checkObject(value: unknown, path: string, ctx: Ctx, spec: Spec): Obj | null {
  if (!isObject(value)) {
    typeError(ctx, path, 'um objeto', value);
    return null;
  }
  for (const [key, field] of Object.entries(spec)) {
    const v = value[key];
    if (v !== undefined) {
      (typeof field === 'function' ? field : field.check)(v, child(path, key), ctx);
    } else if (typeof field === 'function') {
      fail(
        ctx,
        child(path, key),
        'missing-field',
        `${child(path, key)}: campo obrigatório ausente.`,
      );
    }
  }
  for (const key of Object.keys(value)) {
    if (!Object.hasOwn(spec, key) && value[key] !== undefined) {
      fail(ctx, child(path, key), 'unknown-field', `${child(path, key)}: campo desconhecido.`);
    }
  }
  return value;
}

// ---------------------------------------------------------------- primitivas

/** Discriminante já validado pelo `union` — o campo existe no spec só para não virar `unknown-field`. */
export const validated: Check = () => undefined;

export const string: Check = (v, p, c) => {
  if (typeof v !== 'string') typeError(c, p, 'um texto', v);
};

export const nonEmptyString: Check = (v, p, c) => {
  if (typeof v !== 'string') typeError(c, p, 'um texto', v);
  else if (v.trim() === '') fail(c, p, 'invalid-value', `${p}: não pode ser vazio.`);
};

export const boolean: Check = (v, p, c) => {
  if (typeof v !== 'boolean') typeError(c, p, 'verdadeiro ou falso', v);
};

/** Número finito que ainda precisa passar em `rule` (descrita em `expected`, para a mensagem). */
const num =
  (rule: (n: number) => boolean = () => true, expected = ''): Check =>
  (v, p, c) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) typeError(c, p, 'um número', v);
    else if (!rule(v)) fail(c, p, 'invalid-value', `${p}: deve ser ${expected}.`);
  };

export const anyNumber = num();
export const positive = num((n) => n > 0, 'maior que zero');
export const nonNegative = num((n) => n >= 0, 'zero ou maior');
const integer = num(Number.isInteger, 'um número inteiro');
export const fontWeight = num(
  (n) => Number.isInteger(n) && n >= 1 && n <= 1000,
  'um inteiro de 1 a 1000',
);

export const oneOf =
  <T extends string>(values: readonly T[]): Check =>
  (v, p, c) => {
    if (typeof v !== 'string') typeError(c, p, 'um texto', v);
    else if (!(values as readonly string[]).includes(v)) {
      fail(c, p, 'invalid-value', `${p}: "${v}" não é válido. Aceitos: ${values.join(', ')}.`);
    }
  };

export const hexColor: Check = (v, p, c) => {
  if (typeof v !== 'string') typeError(c, p, 'um texto', v);
  else if (!HEX_COLOR.test(v)) fail(c, p, 'invalid-value', `${p}: cor deve ser #RRGGBB.`);
};

/** DEC-002: caminhos de imagem são relativos ao `.editx`, nunca absolutos (`/x`, `\x`, `C:`). */
export const relativePath: Check = (v, p, c) => {
  if (typeof v !== 'string') typeError(c, p, 'um texto', v);
  else if (/^[/\\]/.test(v) || /^[A-Za-z]:/.test(v)) {
    fail(c, p, 'invalid-value', `${p}: o caminho deve ser relativo ao arquivo, não absoluto.`);
  }
};

export const isoDate: Check = (v, p, c) => {
  if (typeof v !== 'string') typeError(c, p, 'um texto', v);
  else if (!ISO_DATE.test(v) || Number.isNaN(Date.parse(v))) {
    fail(
      c,
      p,
      'invalid-value',
      `${p}: data deve ser ISO 8601 com hora e fuso (ex.: 2026-07-24T00:00:00Z).`,
    );
  }
};

export const cmyk: Check = (v, p, c) => {
  if (!Array.isArray(v)) return typeError(c, p, 'uma lista de 4 números', v);
  const valid = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;
  if (v.length !== 4 || !v.every(valid)) {
    fail(c, p, 'invalid-value', `${p}: CMYK deve ter exatamente 4 números de 0 a 100.`);
  }
};

export const columnFormat: Check = (v, p, c) => {
  if (v === null) return;
  if (typeof v !== 'string') return typeError(c, p, 'nulo ou um texto', v);
  const parametrized = /^(currency|date):./.test(v);
  if (v !== 'uppercase' && v !== 'lowercase' && !parametrized) {
    fail(
      c,
      p,
      'invalid-value',
      `${p}: formato "${v}" não é válido (uppercase, lowercase, currency:X ou date:X).`,
    );
  }
};

export const array =
  (item: Check, minItems = 0): Check =>
  (v, p, c) => {
    if (!Array.isArray(v)) return typeError(c, p, 'uma lista', v);
    if (v.length < minItems) {
      fail(c, p, 'invalid-value', `${p}: precisa de pelo menos ${minItems} item(ns).`);
    }
    v.forEach((x, i) => item(x, at(p, i), c));
  };

export const object =
  (spec: Spec): Check =>
  (v, p, c) => {
    checkObject(v, p, c, spec);
  };

/**
 * União discriminada por `key`: valida o discriminante e, se bom, aplica a
 * variante (um spec, ou outra regra, para uniões aninhadas). Discriminante
 * ausente ou inválido → um erro e NÃO desce.
 */
const union =
  <K extends string>(key: string, variants: Record<K, Spec | Check>): Check =>
  (v, p, c) => {
    if (!isObject(v)) return typeError(c, p, 'um objeto', v);
    const tag = v[key];
    const kp = child(p, key);
    if (tag === undefined) return fail(c, kp, 'missing-field', `${kp}: campo obrigatório ausente.`);
    if (typeof tag !== 'string' || !Object.hasOwn(variants, tag)) {
      return fail(
        c,
        kp,
        'invalid-value',
        `${kp}: valor inválido. Aceitos: ${Object.keys(variants).join(', ')}.`,
      );
    }
    const variant = variants[tag as K];
    if (typeof variant === 'function') variant(v, p, c);
    else checkObject(v, p, c, variant);
  };

/** Id não vazio e único dentro do conjunto que `pick` escolhe; o erro vai na SEGUNDA ocorrência. */
export const uniqueId =
  (pick: (c: Ctx) => Set<string>): Check =>
  (v, p, c) => {
    if (typeof v !== 'string') return typeError(c, p, 'um texto', v);
    if (v.trim() === '') return fail(c, p, 'invalid-value', `${p}: não pode ser vazio.`);
    const seen = pick(c);
    if (seen.has(v)) fail(c, p, 'duplicate-id', `${p}: o id "${v}" já foi usado.`);
    seen.add(v);
  };

/** Nome de estilo precisa existir em `textStyles` (R11). Sem lista confiável, só checa o tipo. */
export const styleRef: Check = (v, p, c) => {
  if (typeof v !== 'string') return typeError(c, p, 'um texto', v);
  if (c.styleNames && !c.styleNames.has(v)) {
    fail(c, p, 'unknown-reference', `${p}: o estilo "${v}" não existe em textStyles.`);
  }
};

// ------------------------------------------------------------------- frames

const transformSpec: Spec = {
  x: anyNumber,
  y: anyNumber,
  // Largura/altura 0 é legítima: uma linha pode ter altura 0.
  width: nonNegative,
  height: nonNegative,
  rotation: anyNumber,
};

const baseFrame: Spec = {
  id: uniqueId((c) => c.frameIds),
  type: validated,
  transform: object(transformSpec),
  zIndex: integer,
  lock: boolean,
  visible: boolean,
};

const overflowSpec: Spec = {
  mode: oneOf<OverflowMode>(['grow-vertical', 'grow-horizontal', 'fixed-shrink', 'fixed-clip']),
  anchor: oneOf<TextAnchor>([
    'top-left',
    'top-center',
    'top-right',
    'middle-left',
    'middle-center',
    'middle-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ]),
  minFontSize: optional(positive),
};

/** `fixed-shrink` sem `minFontSize` não tem onde parar de encolher — o JSDoc de `OverflowConfig` delega esta regra aqui (R9). */
const overflow: Check = (v, p, c) => {
  const o = checkObject(v, p, c, overflowSpec);
  if (o && o.mode === 'fixed-shrink' && o.minFontSize === undefined) {
    const mp = child(p, 'minFontSize');
    fail(c, mp, 'missing-field', `${mp}: obrigatório quando o modo é fixed-shrink.`);
  }
};

/** `customSvg` só existe — e é obrigatório — com `shape: 'custom-svg'` (R10). Conteúdo do SVG: fora de escopo. */
const SHAPE_KINDS: readonly ShapeKind[] = ['rect', 'ellipse', 'line', 'polygon', 'custom-svg'];

const shapeSpec: Spec = {
  ...baseFrame,
  shape: oneOf(SHAPE_KINDS),
  fill: union('type', {
    none: { type: validated },
    solid: { type: validated, color: hexColor },
  }),
  stroke: object({
    color: hexColor,
    width: nonNegative,
    style: oneOf<StrokeStyle>(['solid', 'dashed', 'dotted']),
  }),
  borderRadius: nonNegative,
  customSvg: optional(string),
};

const shape: Check = (v, p, c) => {
  const o = checkObject(v, p, c, shapeSpec);
  if (!o || !(SHAPE_KINDS as readonly unknown[]).includes(o.shape)) return;
  const sp = child(p, 'customSvg');
  const svg = o.customSvg;
  if (o.shape === 'custom-svg') {
    if (svg === undefined)
      fail(c, sp, 'missing-field', `${sp}: obrigatório quando a forma é custom-svg.`);
    else if (typeof svg === 'string' && svg.trim() === '')
      fail(c, sp, 'invalid-value', `${sp}: não pode ser vazio.`);
  } else if (typeof svg === 'string') {
    fail(c, sp, 'invalid-value', `${sp}: só vale quando a forma é custom-svg.`);
  }
};

const textBase: Spec = {
  ...baseFrame,
  role: validated,
  textStyle: styleRef,
  overflow,
};

const imageBase: Spec = {
  ...baseFrame,
  role: validated,
  fit: oneOf<ImageFit>(['contain', 'cover', 'fill', 'none']),
  align: oneOf<ImageHorizontalAlign>(['left', 'center', 'right']),
  borderRadius: nonNegative,
  fallback: optional(relativePath),
};

/** Frame inteiro: `type` escolhe o ramo e `role` (texto/imagem) escolhe entre `csvColumn` e `content`/`src`. */
export const frame = union('type', {
  text: union('role', {
    data: { ...textBase, csvColumn: string },
    static: { ...textBase, content: string },
  }),
  image: union('role', {
    data: { ...imageBase, csvColumn: string },
    static: { ...imageBase, src: relativePath },
  }),
  shape,
});
