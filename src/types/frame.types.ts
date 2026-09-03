/**
 * frame.types.ts
 *
 * Tipos relacionados a frames (texto, imagem, forma), overflow de texto e
 * estilos de texto globais. Parte do contrato de tipos do formato `.editx`
 * — ver DEC-009 (TemplateSchema.ts é a fonte única de tipos, nenhum módulo
 * define tipos de frame próprios).
 *
 * Extraído de TemplateSchema.ts por tamanho (regra de ~300 linhas por
 * arquivo em CONTEXT.md) — a divisão já estava prevista na estrutura de
 * pastas do projeto (ver CONTEXT.md § Estrutura do Projeto).
 */

/**
 * Posição, tamanho e rotação de um frame dentro da página.
 * Unidade: mm, mesma unidade do documento (ver DocumentSettings.unit em TemplateSchema.ts).
 */
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotação em graus, sentido horário. 0 = sem rotação. */
  rotation: number;
}

/**
 * Modos de overflow de um frame de texto ao atingir suas próprias bordas.
 * Mecanismo central do sistema — ver CONTEXT.md § "Como o Motor de Overflow
 * de Texto Funciona (CRÍTICO)" e DEC-006.
 *
 * - `grow-vertical`   → o frame cresce para baixo/cima conforme o texto.
 * - `grow-horizontal` → o frame cresce para a esquerda/direita.
 * - `fixed-shrink`    → o frame NÃO muda de tamanho; a fonte diminui até `minFontSize`.
 * - `fixed-clip`      → o frame não muda; o texto que ultrapassa a borda é cortado.
 */
export type OverflowMode = 'grow-vertical' | 'grow-horizontal' | 'fixed-shrink' | 'fixed-clip';

/**
 * Ponto de ancoragem usado pelos modos `grow-*` para decidir a partir de
 * onde o frame cresce (ex.: `top-left` cresce para baixo e para a direita).
 * Nem toda combinação faz sentido com todo `OverflowMode` — ver a tabela
 * "Modos de Overflow de Texto" em CONTEXT.md para o pareamento esperado.
 */
export type TextAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Configuração de overflow de um frame de texto.
 */
export interface OverflowConfig {
  mode: OverflowMode;
  anchor: TextAnchor;
  /**
   * Tamanho mínimo de fonte (pt) que o modo `fixed-shrink` pode atingir
   * antes de parar de reduzir. Obrigatório apenas quando `mode === 'fixed-shrink'`
   * — não validado em nível de tipo (união discriminada tornaria o schema
   * bem mais verboso para um único campo condicional); validado em runtime
   * pelo TemplateSerializer.ts.
   */
  minFontSize?: number;
}

/**
 * Origem do conteúdo de um frame.
 * - `data`   → o conteúdo vem de uma coluna do CSV (`csvColumn` obrigatório).
 * - `static` → o conteúdo é fixo, definido no canvas (`content`/`src` obrigatório).
 */
export type FrameRole = 'data' | 'static';

/**
 * Campos comuns a todo frame, independente do tipo (texto, imagem ou forma).
 * Frames específicos estendem esta interface — nunca a duplicam.
 */
export interface BaseFrame {
  /** Identificador único do frame dentro do documento. */
  id: string;
  transform: Transform;
  /** Ordem de empilhamento (z-order). Maior = mais à frente. */
  zIndex: number;
  /** Se `true`, o frame não pode ser movido/editado no canvas. */
  lock: boolean;
  visible: boolean;
}

/**
 * Alinhamento horizontal do texto dentro do frame.
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/**
 * Alinhamento vertical do texto dentro do frame (relevante sobretudo para
 * `fixed-shrink` e `fixed-clip`, onde o frame não cresce).
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom';

/**
 * Transformação de capitalização aplicada ao texto na renderização
 * (não altera o `content`/dado original — só a apresentação).
 */
export type TextCase = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export type TextDecoration = 'none' | 'underline' | 'strikethrough';

/**
 * Estilo de texto nomeado e reutilizável, com herança em cadeia via `basedOn`
 * (como estilos baseados no Word). Vive em `EditxTemplate.textStyles`,
 * indexado pelo nome do estilo — ver TemplateSchema.ts.
 *
 * Alterar um estilo propaga automaticamente para todos os frames vinculados
 * — implementado por observer pattern em `StyleRegistry.ts` (ver DEC-006,
 * seção de estilos globais em CONTEXT.md § Modos de Overflow).
 */
export interface TextStyle {
  fontFamily: string;
  /** Peso da fonte no padrão CSS (400 = normal, 700 = bold, etc.). */
  fontWeight: number;
  /** Tamanho da fonte em pontos (pt). */
  fontSize: number;
  /** Multiplicador de altura de linha (1.0 = sem espaçamento extra). */
  lineHeight: number;
  /** Espaçamento entre letras, em `em` (0 = padrão da fonte). */
  letterSpacing: number;
  /** Cor em hexadecimal (`#RRGGBB`). */
  color: string;
  align: TextAlign;
  verticalAlign: VerticalAlign;
  transform: TextCase;
  decoration: TextDecoration;
  /**
   * Nome de outro estilo em `textStyles` do qual este herda todas as
   * propriedades — sobrescrevendo apenas os campos explicitamente definidos
   * aqui. `null` = estilo raiz, sem herança. Resolvido por `StyleRegistry.ts`.
   */
  basedOn: string | null;
}

/**
 * Frame de texto — populável (`role: 'data'`, vem do CSV) ou estático
 * (`role: 'static'`, digitado no canvas). A união discriminada por `role`
 * garante que `csvColumn` só exista em frames populáveis e `content` só em
 * frames estáticos, sem campos opcionais ambíguos.
 */
export type TextFrame = BaseFrame & {
  type: 'text';
  /** Nome do estilo em `textStyles` aplicado a este frame. */
  textStyle: string;
  overflow: OverflowConfig;
} & ({ role: 'data'; csvColumn: string } | { role: 'static'; content: string });

/**
 * Modo de ajuste da imagem dentro das dimensões do frame — mesma semântica
 * do `object-fit` do CSS.
 * - `contain` → a imagem inteira cabe no frame, pode sobrar espaço vazio.
 * - `cover`   → o frame é preenchido, a imagem pode ser cortada nas bordas.
 * - `fill`    → a imagem é esticada para preencher exatamente o frame.
 * - `none`    → tamanho original da imagem, sem redimensionar.
 */
export type ImageFit = 'contain' | 'cover' | 'fill' | 'none';

export type ImageHorizontalAlign = 'left' | 'center' | 'right';

/**
 * Frame de imagem — populável (`role: 'data'`, nome do arquivo vem do CSV
 * e é resolvido por `ImageResolver.ts`) ou estático (`role: 'static'`,
 * caminho fixo definido no canvas).
 *
 * Caminhos de imagem (`src`) são relativos ao arquivo `.editx`, nunca
 * absolutos — ver DEC-002. `fallback` evita frame quebrado quando o CSV
 * aponta para um arquivo que não existe na pasta importada.
 */
export type ImageFrame = BaseFrame & {
  type: 'image';
  fit: ImageFit;
  align: ImageHorizontalAlign;
  /** Raio de borda em mm, para cantos arredondados. 0 = cantos retos. */
  borderRadius: number;
  /**
   * Caminho relativo (à pasta de imagens do `.editx`) usado quando a
   * imagem não é encontrada — evita que o lote quebre por uma linha de
   * CSV com nome de arquivo inválido ou ausente.
   */
  fallback?: string;
} & ({ role: 'data'; csvColumn: string } | { role: 'static'; src: string });

/** Formas geométricas suportadas por um frame do tipo `shape`. */
export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'polygon' | 'custom-svg';

/**
 * Preenchimento de uma forma. `type: 'none'` = sem preenchimento (só
 * contorno). `type: 'solid'` = cor sólida.
 */
export type ShapeFill = { type: 'none' } | { type: 'solid'; color: string };

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface ShapeStroke {
  color: string;
  /** Espessura do contorno em mm. */
  width: number;
  style: StrokeStyle;
}

/**
 * Frame de forma/ornamento (retângulos, elipses, linhas, polígonos ou SVG
 * customizado). Sem `role`/`csvColumn` — formas não são populáveis pelo CSV
 * nesta versão do schema (todo o valor visual vem de `fill`/`stroke`).
 */
export interface ShapeFrame extends BaseFrame {
  type: 'shape';
  shape: ShapeKind;
  fill: ShapeFill;
  stroke: ShapeStroke;
  /** Raio de borda em mm — só tem efeito em `shape: 'rect'`. */
  borderRadius: number;
  /**
   * Marcação SVG bruta, usada apenas quando `shape === 'custom-svg'`.
   * Validado/sanitizado pelo TemplateSerializer.ts antes de renderizar
   * (nunca injetado diretamente sem sanitização — risco de XSS se vier de
   * template compartilhado por terceiros).
   */
  customSvg?: string;
}

/**
 * União discriminada de todo frame possível num template `.editx`.
 * O campo `type` é o discriminante — permite ao TypeScript estreitar o
 * tipo automaticamente em `switch(frame.type)` sem type assertions.
 */
export type Frame = TextFrame | ImageFrame | ShapeFrame;
