/**
 * TemplateSchema.ts
 *
 * Fonte única da verdade dos tipos TypeScript do formato `.editx` — ver DEC-009.
 * Nenhum outro módulo do projeto define tipos de frame, página ou documento
 * próprios; todos importam daqui (ou de `frame.types.ts`, para onde os tipos
 * de frame/overflow/estilo foram extraídos por tamanho de arquivo).
 *
 * Este arquivo cobre: metadados do documento, paleta de cores, páginas,
 * mapeamento CSV e o tipo raiz `EditxTemplate` que amarra tudo.
 *
 * ARMADILHA (ver CONTEXT.md): nunca usar `any` aqui — cada campo tipado
 * explicitamente, porque este arquivo é o contrato entre todos os módulos.
 */

import type { Frame, TextStyle } from '../types/frame.types';

/**
 * Tipos de documento suportados pelo EditX — ver a tabela completa em
 * CONTEXT.md § "Tipos de Documentos Suportados" para as características
 * especiais de cada um (multipágina, dobras, proporção fixa, etc.).
 */
export type DocumentType =
  | 'catalog'
  | 'poster'
  | 'story'
  | 'menu-digital'
  | 'menu-print'
  | 'cfold'
  | 'zfold'
  | 'menu-pdf'
  | 'cardapio'
  | 'card';

/** Unidade de medida usada em todas as dimensões do documento (`document.*`, `Transform.*`). */
export type DocumentUnit = 'mm' | 'cm' | 'px';

/**
 * Modo de cor do documento. `CMYK` é o padrão para materiais destinados à
 * impressão profissional (gráficas); `RGB` para saída puramente digital.
 */
export type ColorMode = 'RGB' | 'CMYK';

export type PageOrientation = 'portrait' | 'landscape';

/**
 * Metadados físicos do documento: dimensões, resolução de exportação,
 * sangria para impressão e modo de cor.
 */
export interface DocumentSettings {
  width: number;
  height: number;
  unit: DocumentUnit;
  /** Resolução em DPI usada na exportação raster (PNG/JPG). Ignorado em exportação vetorial (PDF/SVG). */
  dpi: number;
  /**
   * Sangria em `unit`, para impressão profissional (área extra além do
   * corte final, evita borda branca por imprecisão de corte). 0 = sem sangria
   * (padrão para materiais digitais).
   */
  bleed: number;
  colorMode: ColorMode;
  orientation: PageOrientation;
}

/**
 * Cor da paleta de marca, com equivalente CMYK explícito — necessário
 * porque a conversão automática RGB→CMYK não é confiável para impressão
 * profissional (perfis de cor variam por gráfica).
 */
export interface BrandColor {
  name: string;
  hex: string;
  /** [Cyan, Magenta, Yellow, Key/Black], cada valor de 0 a 100. */
  cmyk: [number, number, number, number];
}

export interface Palette {
  brand: BrandColor[];
}

/**
 * Uma página do documento. Frames estáticos (capa, moldura fixa) e
 * populáveis (repetidos por linha do CSV) podem coexistir na mesma página
 * — o que muda o comportamento da página como um todo é `isDataPage`.
 */
export interface Page {
  id: string;
  /** Nome amigável exibido na UI (painel de páginas), não usado na exportação. */
  label: string;
  frames: Frame[];
  /**
   * Se `true`, esta página se repete uma vez por linha do CSV (ex.: página
   * de produto num catálogo). Se ausente ou `false`, a página é estática e
   * aparece uma única vez no documento gerado (ex.: capa, contracapa).
   * Sem esta flag, o `TemplateRenderer.ts` não sabe qual página repetir —
   * item de prioridade alta no backlog (ver STATUS.md).
   */
  isDataPage?: boolean;
}

/** Tipo de dado de uma coluna do CSV, usado para decidir formatação e frame de destino compatível. */
export type ColumnType = 'text' | 'image';

/**
 * Formatador nativo aplicado ao valor bruto da célula do CSV antes de
 * popular o frame. `currency:BRL` e `date:DD/MM/YYYY` carregam parâmetro
 * após `:`; os demais são fixos. `null` = sem formatação, valor literal.
 */
export type ColumnFormat =
  null | 'uppercase' | 'lowercase' | `currency:${string}` | `date:${string}`;

/**
 * Definição de uma coluna do CSV mapeada para o template: como ela se
 * chama no arquivo, como é rotulada na UI, que tipo de frame aceita, e
 * qual formatador aplicar antes de exibir.
 */
export interface ColumnDef {
  /** Nome exato da coluna no cabeçalho do CSV — usado para o lookup real dos dados. */
  csvName: string;
  /** Nome amigável mostrado na UI de mapeamento (`CsvMapper.tsx`). */
  label: string;
  type: ColumnType;
  format: ColumnFormat;
}

/** Operadores suportados pelo filtro `skipRowsWhere`. */
export type FilterOperator = 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';

/**
 * Filtro de linhas do CSV aplicado ANTES da geração em massa — evita que o
 * usuário precise limpar o CSV manualmente (ex.: gerar só produtos com
 * `ativo = "sim"`).
 */
export interface SkipRowsWhereFilter {
  column: string;
  operator: FilterOperator;
  value: string;
}

/**
 * Bloco que define como as colunas do CSV se conectam aos frames do
 * template: delimitador, encoding, colunas tipadas, formatadores, filtro
 * de linhas e padrão de nomenclatura dos arquivos gerados.
 */
export interface CsvMapping {
  delimiter: string;
  encoding: string;
  /** Se `true`, a primeira linha do CSV é tratada como cabeçalho (nomes de coluna), não como dado. */
  hasHeader: boolean;
  /**
   * Pasta (relativa ao `.editx`) onde `ImageResolver.ts` procura os
   * arquivos referenciados por colunas do tipo `image` — ver DEC-002.
   */
  imageBasePath: string;
  columns: ColumnDef[];
  /**
   * Padrão de nomenclatura dos arquivos gerados em lote, com variáveis do
   * CSV entre chaves (ex.: `"{nome}-{preco}"` → `"coca-cola-5,99.pdf"`).
   * As variáveis devem corresponder a um `ColumnDef.csvName` existente —
   * validado em runtime pelo `BatchGenerator.ts`, não em nível de tipo
   * (string de template livre demais para tipar com segurança).
   */
  outputNaming: string;
  /** Se `true`, linhas com todas as colunas mapeadas vazias são ignoradas silenciosamente. */
  skipEmptyRows: boolean;
  skipRowsWhere?: SkipRowsWhereFilter;
}

/**
 * Registro de estilos de texto globais do documento, indexado pelo nome do
 * estilo (o mesmo nome referenciado em `TextFrame.textStyle`). A resolução
 * de herança via `basedOn` é responsabilidade de `StyleRegistry.ts` — este
 * tipo só descreve o formato de armazenamento no `.editx`.
 */
export type TextStyleMap = Record<string, TextStyle>;

/**
 * Tipo raiz de um arquivo `.editx` — ver DEC-001. Representa o documento
 * completo: metadados, dimensões físicas, paleta, páginas (com seus
 * frames), estilos de texto globais e o mapeamento de dados do CSV.
 *
 * `version` existe desde a v0.1.0 para permitir migração de schema sem
 * quebrar arquivos `.editx` já salvos por usuários — ver DEC-009,
 * seção "Riscos".
 */
export interface EditxTemplate {
  /** Versão do formato do schema (SemVer), não a versão do documento do usuário. */
  version: string;
  /** Identificador único do template (UUID), estável entre salvamentos. */
  id: string;
  name: string;
  type: DocumentType;
  /** Timestamps ISO 8601. */
  createdAt: string;
  updatedAt: string;
  document: DocumentSettings;
  palette: Palette;
  pages: Page[];
  textStyles: TextStyleMap;
  csvMapping: CsvMapping;
}
