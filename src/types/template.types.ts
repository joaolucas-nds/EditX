/**
 * template.types.ts
 *
 * Fachada de re-export dos tipos do formato `.editx`. Não define nenhum
 * tipo novo — existe só para que o resto do app importe de um único lugar
 * estável (`src/types/`) sem precisar saber que o schema está fisicamente
 * dividido entre `template/TemplateSchema.ts` (documento raiz + CSV) e
 * `types/frame.types.ts` (frames/overflow/estilos), por regra de tamanho
 * de arquivo (ver CONTEXT.md § Convenções de Código).
 *
 * `TemplateSchema.ts` continua sendo a fonte da verdade (DEC-009); este
 * arquivo nunca deve redefinir ou estender um tipo — só reexportar.
 */

export type {
  DocumentType,
  DocumentUnit,
  ColorMode,
  PageOrientation,
  DocumentSettings,
  BrandColor,
  Palette,
  Page,
  ColumnType,
  ColumnFormat,
  ColumnDef,
  FilterOperator,
  SkipRowsWhereFilter,
  CsvMapping,
  TextStyleMap,
  EditxTemplate,
} from '../template/TemplateSchema';

export type {
  Transform,
  OverflowMode,
  TextAnchor,
  OverflowConfig,
  FrameRole,
  BaseFrame,
  TextAlign,
  VerticalAlign,
  TextCase,
  TextDecoration,
  TextStyle,
  TextFrame,
  ImageFit,
  ImageHorizontalAlign,
  ImageFrame,
  ShapeKind,
  ShapeFill,
  StrokeStyle,
  ShapeStroke,
  ShapeFrame,
  Frame,
} from './frame.types';
