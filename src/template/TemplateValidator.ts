/**
 * TemplateValidator.ts
 *
 * Valida em runtime um valor desconhecido (tipicamente o `JSON.parse` de um
 * arquivo `.editx`) contra o schema de `TemplateSchema.ts` — ver DEC-013.
 * Tipo TypeScript não protege arquivo vindo do disco; este módulo protege.
 *
 * Princípios: ESTRITO (chave desconhecida é erro), COLETA TODOS os erros
 * com caminho estilo JSONPath, e NÃO DESCE num nó cujo tipo já está errado
 * (um erro na raiz do defeito, não uma cascata).
 *
 * ARMADILHA (ver CONTEXT.md): campo ou valor de união novo no schema exige
 * a regra correspondente aqui, senão o `.editx` com ele é REJEITADO.
 */

import type {
  ColorMode,
  ColumnType,
  DocumentType,
  DocumentUnit,
  EditxTemplate,
  FilterOperator,
  PageOrientation,
} from './TemplateSchema';
import type { TextAlign, TextCase, TextDecoration, VerticalAlign } from '../types/frame.types';
import {
  anyNumber,
  array,
  boolean,
  checkObject,
  child,
  cmyk,
  columnFormat,
  fail,
  fontWeight,
  hexColor,
  isObject,
  isoDate,
  keyed,
  nonEmptyString,
  nonNegative,
  object,
  oneOf,
  optional,
  positive,
  relativePath,
  string,
  styleRef,
  typeError,
  uniqueId,
  validated,
} from './ValidationRules';
import type { Check, Ctx, Obj, Spec } from './ValidationRules';
import { frame } from './FrameValidator';

/** Versões de schema que este validador entende. Lista explícita: versão fora dela é rejeitada, nunca "tentada". */
export const SUPPORTED_SCHEMA_VERSIONS: readonly string[] = ['0.1.0'];

export type ValidationErrorCode =
  | 'invalid-json'
  | 'unsupported-version'
  | 'missing-field'
  | 'unknown-field'
  | 'invalid-type'
  | 'invalid-value'
  | 'duplicate-id'
  | 'unknown-reference';

export interface ValidationError {
  /** Caminho no documento, estilo JSONPath: `$`, `$.document.dpi`, `$.pages[1].frames[0].id`, `$.textStyles["preco-destaque"].basedOn`. */
  path: string;
  code: ValidationErrorCode;
  /** Mensagem em PT-BR, legível pelo usuário final. */
  message: string;
}

export type ValidationResult =
  { ok: true; template: EditxTemplate } | { ok: false; errors: ValidationError[] };

// --------------------------------------------------------- estilos de texto

/** As 10 propriedades visuais (`TextStyleProps`) e a regra de valor de cada uma — fonte única para raiz e derivado. */
const textStyleProps: Record<string, Check> = {
  fontFamily: string,
  fontWeight,
  fontSize: positive,
  lineHeight: positive,
  letterSpacing: anyNumber,
  color: hexColor,
  align: oneOf<TextAlign>(['left', 'center', 'right', 'justify']),
  verticalAlign: oneOf<VerticalAlign>(['top', 'middle', 'bottom']),
  transform: oneOf<TextCase>(['none', 'uppercase', 'lowercase', 'capitalize']),
  decoration: oneOf<TextDecoration>(['none', 'underline', 'strikethrough']),
};

/** Estilo RAIZ (`basedOn: null`): as 10 propriedades são obrigatórias. */
const rootStyleSpec: Spec = { ...textStyleProps, basedOn: validated };

/** Estilo DERIVADO (`basedOn: "<pai>"`): as mesmas regras, mas só o que difere do pai precisa estar presente (DEC-014). */
const derivedStyleSpec: Spec = {
  ...Object.fromEntries(Object.entries(textStyleProps).map(([key, rule]) => [key, optional(rule)])),
  basedOn: styleRef,
};

/**
 * Um estilo de `textStyles`. O `basedOn` decide qual regra vale, então ele é
 * checado primeiro: ausente ou de tipo errado → um erro e NÃO desce (sem saber
 * a forma, as demais chaves só gerariam cascata).
 */
const textStyle: Check = (v, p, c) => {
  if (!isObject(v)) return typeError(c, p, 'um objeto', v);
  const bp = child(p, 'basedOn');
  const based = v.basedOn;
  if (based === undefined) return fail(c, bp, 'missing-field', `${bp}: campo obrigatório ausente.`);
  if (based === null) checkObject(v, p, c, rootStyleSpec);
  else if (typeof based === 'string') checkObject(v, p, c, derivedStyleSpec);
  else typeError(c, bp, 'nulo ou um texto', based);
};

/**
 * Ciclo em `basedOn` (A→B→A, A→A) tornaria a herança infinita no
 * `StyleRegistry.ts`. Reporta uma vez por ciclo, no primeiro estilo dele.
 */
function checkBasedOnCycles(styles: Obj, path: string, ctx: Ctx): void {
  const parents = new Map<string, string>();
  for (const [name, style] of Object.entries(styles)) {
    if (isObject(style) && typeof style.basedOn === 'string') parents.set(name, style.basedOn);
  }
  const inCycle = new Set<string>();
  for (const start of parents.keys()) {
    if (inCycle.has(start)) continue;
    const chain: string[] = [];
    let cur: string | undefined = start;
    while (cur !== undefined && !chain.includes(cur)) {
      chain.push(cur);
      cur = parents.get(cur);
    }
    // Cadeia que desemboca em ciclo alheio será reportada quando o laço chegar a um membro dele.
    if (cur !== start) continue;
    chain.forEach((name) => inCycle.add(name));
    const bp = child(keyed(path, start), 'basedOn');
    fail(
      ctx,
      bp,
      'invalid-value',
      `${bp}: herança circular entre estilos (${chain.join(' → ')} → ${start}).`,
    );
  }
}

const textStyles: Check = (v, p, c) => {
  if (!isObject(v)) return typeError(c, p, 'um objeto', v);
  for (const [name, style] of Object.entries(v)) textStyle(style, keyed(p, name), c);
  checkBasedOnCycles(v, p, c);
};

// ------------------------------------------------------------ raiz do .editx

const rootSpec: Spec = {
  version: validated,
  id: nonEmptyString,
  name: string,
  type: oneOf<DocumentType>([
    'catalog',
    'poster',
    'story',
    'menu-digital',
    'menu-print',
    'cfold',
    'zfold',
    'menu-pdf',
    'cardapio',
    'card',
  ]),
  createdAt: isoDate,
  updatedAt: isoDate,
  document: object({
    width: positive,
    height: positive,
    unit: oneOf<DocumentUnit>(['mm', 'cm', 'px']),
    dpi: positive,
    bleed: nonNegative,
    colorMode: oneOf<ColorMode>(['RGB', 'CMYK']),
    orientation: oneOf<PageOrientation>(['portrait', 'landscape']),
  }),
  palette: object({
    brand: array(object({ name: string, hex: hexColor, cmyk })),
  }),
  pages: array(
    object({
      id: uniqueId((c) => c.pageIds),
      label: string,
      frames: array(frame),
      isDataPage: optional(boolean),
    }),
    1,
  ),
  textStyles,
  csvMapping: object({
    delimiter: string,
    encoding: string,
    hasHeader: boolean,
    imageBasePath: relativePath,
    columns: array(
      object({
        csvName: string,
        label: string,
        type: oneOf<ColumnType>(['text', 'image']),
        format: columnFormat,
      }),
    ),
    // Variáveis de `outputNaming` são validadas pelo BatchGenerator.ts (JSDoc do schema), não aqui.
    outputNaming: string,
    skipEmptyRows: boolean,
    skipRowsWhere: optional(
      object({
        column: string,
        operator: oneOf<FilterOperator>([
          'equals',
          'not-equals',
          'contains',
          'greater-than',
          'less-than',
        ]),
        value: string,
      }),
    ),
  }),
};

/**
 * Valida um valor desconhecido como `EditxTemplate`.
 *
 * @param value Normalmente o resultado de `JSON.parse` de um `.editx`.
 * @returns `{ ok: true, template }` com a MESMA referência recebida (sem clonar
 *   nem normalizar), ou `{ ok: false, errors }` com TODOS os erros achados.
 *   A versão do schema é conferida primeiro: ausente ou não suportada devolve
 *   só esse erro, porque as demais regras pertencem à versão conhecida.
 */
export function validateTemplate(value: unknown): ValidationResult {
  const ctx: Ctx = { errors: [], pageIds: new Set(), frameIds: new Set(), styleNames: null };

  if (!isObject(value)) {
    typeError(ctx, '$', 'um objeto', value);
    return { ok: false, errors: ctx.errors };
  }

  const version = value.version;
  if (version === undefined) {
    fail(ctx, '$.version', 'missing-field', '$.version: campo obrigatório ausente.');
    return { ok: false, errors: ctx.errors };
  }
  if (typeof version !== 'string' || !SUPPORTED_SCHEMA_VERSIONS.includes(version)) {
    fail(
      ctx,
      '$.version',
      'unsupported-version',
      `Versão de schema não suportada: ${String(version)}. Suportadas: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}.`,
    );
    return { ok: false, errors: ctx.errors };
  }

  if (isObject(value.textStyles)) ctx.styleNames = new Set(Object.keys(value.textStyles));
  checkObject(value, '$', ctx, rootSpec);

  return ctx.errors.length === 0
    ? { ok: true, template: value as unknown as EditxTemplate }
    : { ok: false, errors: ctx.errors };
}
