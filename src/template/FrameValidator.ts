/**
 * FrameValidator.ts
 *
 * Regras dos FRAMES (texto, imagem, forma) do `TemplateValidator.ts`, escritas
 * sobre o motor de `ValidationRules.ts`. Extraído por tamanho (~300 linhas por
 * arquivo, CONTEXT.md). Ver DEC-013.
 */

import type {
  ImageFit,
  ImageHorizontalAlign,
  OverflowMode,
  ShapeKind,
  StrokeStyle,
  TextAnchor,
} from '../types/frame.types';
import {
  anyNumber,
  boolean,
  checkObject,
  child,
  fail,
  hexColor,
  integer,
  nonNegative,
  object,
  oneOf,
  optional,
  positive,
  relativePath,
  string,
  styleRef,
  union,
  uniqueId,
  validated,
} from './ValidationRules';
import type { Check, Spec } from './ValidationRules';

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
