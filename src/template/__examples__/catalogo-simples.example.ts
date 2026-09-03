/**
 * catalogo-simples.example.ts
 *
 * Exemplo mínimo, porém completo, de um `EditxTemplate` válido: um catálogo
 * de 2 páginas (capa estática + página de produto populável). Cobre os 3
 * tipos de frame, herança de `TextStyle` via `basedOn` e um `csvMapping`
 * básico com formatador de moeda.
 *
 * Não é usado em produção — existe para:
 * 1. Validar por compilação que o schema é ergonômico de satisfazer
 *    (se `tsc --noEmit` passa aqui, o schema "funciona" na prática, não só
 *    na teoria dos tipos).
 * 2. Servir de referência viva para quem for implementar o
 *    `TemplateSerializer.ts` ou o `CanvasEngine.ts` a seguir.
 */

import type { EditxTemplate, TextStyleMap } from '../TemplateSchema';

/**
 * Estilos de texto do catálogo. `preco-destaque` herda de `titulo-produto`
 * via `basedOn` e sobrescreve só `fontSize`/`color`/`fontWeight` — o
 * restante (fontFamily, align, etc.) vem do pai. Resolvido em runtime por
 * `StyleRegistry.ts` (ainda não implementado — próximo item após
 * TemplateSerializer.ts no backlog).
 */
const textStyles: TextStyleMap = {
  'titulo-produto': {
    fontFamily: 'Montserrat',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.3,
    letterSpacing: 0,
    color: '#1D3557',
    align: 'left',
    verticalAlign: 'top',
    transform: 'uppercase',
    decoration: 'none',
    basedOn: null,
  },
  'preco-destaque': {
    fontFamily: 'Montserrat',
    fontWeight: 800,
    fontSize: 22,
    lineHeight: 1.3,
    letterSpacing: 0,
    color: '#E63946',
    align: 'left',
    verticalAlign: 'top',
    transform: 'uppercase',
    decoration: 'none',
    basedOn: 'titulo-produto',
  },
  'titulo-capa': {
    fontFamily: 'Montserrat',
    fontWeight: 600,
    fontSize: 32,
    lineHeight: 1.1,
    letterSpacing: 0,
    color: '#FFFFFF',
    align: 'center',
    verticalAlign: 'middle',
    transform: 'none',
    decoration: 'none',
    basedOn: null,
  },
};

export const catalogoSimplesExample: EditxTemplate = {
  version: '0.1.0',
  id: 'exemplo-catalogo-simples',
  name: 'Catálogo Verão — Exemplo',
  type: 'catalog',
  createdAt: '2026-07-24T00:00:00Z',
  updatedAt: '2026-07-24T00:00:00Z',

  document: {
    width: 210,
    height: 297,
    unit: 'mm',
    dpi: 300,
    bleed: 3,
    colorMode: 'CMYK',
    orientation: 'portrait',
  },

  palette: {
    brand: [
      { name: 'primária', hex: '#E63946', cmyk: [0, 77, 69, 10] },
      { name: 'secundária', hex: '#1D3557', cmyk: [89, 64, 0, 34] },
    ],
  },

  pages: [
    {
      // Capa — estática, aparece uma única vez, sem `isDataPage`.
      id: 'page-capa',
      label: 'Capa',
      frames: [
        {
          id: 'frame-titulo-capa',
          type: 'text',
          role: 'static',
          content: 'Ofertas de Verão',
          transform: { x: 10, y: 120, width: 190, height: 40, rotation: 0 },
          textStyle: 'titulo-capa',
          overflow: { mode: 'grow-vertical', anchor: 'middle-center' },
          zIndex: 1,
          lock: false,
          visible: true,
        },
        {
          // Forma de fundo da capa — sem `role`/`csvColumn`, formas não são populáveis.
          id: 'frame-fundo-capa',
          type: 'shape',
          shape: 'rect',
          transform: { x: 0, y: 0, width: 210, height: 297, rotation: 0 },
          fill: { type: 'solid', color: '#1D3557' },
          stroke: { color: '#1D3557', width: 0, style: 'solid' },
          borderRadius: 0,
          zIndex: 0,
          lock: true,
          visible: true,
        },
      ],
    },
    {
      // Página de produto — populável, repete uma vez por linha do CSV.
      id: 'page-produto',
      label: 'Produto',
      isDataPage: true,
      frames: [
        {
          id: 'frame-nome-produto',
          type: 'text',
          role: 'data',
          csvColumn: 'nome',
          transform: { x: 10, y: 15, width: 190, height: 20, rotation: 0 },
          textStyle: 'titulo-produto',
          overflow: { mode: 'grow-vertical', anchor: 'top-left' },
          zIndex: 3,
          lock: false,
          visible: true,
        },
        {
          id: 'frame-preco-produto',
          type: 'text',
          role: 'data',
          csvColumn: 'preco',
          transform: { x: 10, y: 40, width: 100, height: 15, rotation: 0 },
          textStyle: 'preco-destaque',
          // fixed-shrink evita que um preço com muitos dígitos estoure o
          // frame — diminui a fonte até `minFontSize` em vez de cortar.
          overflow: { mode: 'fixed-shrink', anchor: 'top-left', minFontSize: 12 },
          zIndex: 3,
          lock: false,
          visible: true,
        },
        {
          id: 'frame-foto-produto',
          type: 'image',
          role: 'data',
          csvColumn: 'arquivo_imagem',
          transform: { x: 10, y: 60, width: 190, height: 120, rotation: 0 },
          fit: 'contain',
          align: 'center',
          borderRadius: 4,
          fallback: './imagens/_placeholder.png',
          zIndex: 2,
          lock: false,
          visible: true,
        },
      ],
    },
  ],

  textStyles,

  csvMapping: {
    delimiter: ',',
    encoding: 'UTF-8',
    hasHeader: true,
    imageBasePath: './imagens',
    columns: [
      { csvName: 'nome', label: 'Nome do produto', type: 'text', format: null },
      { csvName: 'preco', label: 'Preço', type: 'text', format: 'currency:BRL' },
      { csvName: 'arquivo_imagem', label: 'Foto do produto', type: 'image', format: null },
    ],
    outputNaming: '{nome}-{preco}',
    skipEmptyRows: true,
    skipRowsWhere: { column: 'ativo', operator: 'equals', value: 'sim' },
  },
};
