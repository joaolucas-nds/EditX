# WO 0006 — Fontes do app + FontRegistry.ts + motor de layout de texto (DEC-017)

> **Tipo:** mista — CÓDIGO (downloads das fontes, tipos do opentype, 2 módulos puros + testes, `ptToPx`) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — o motor de layout é o módulo mais delicado do projeto (DEC-006).
> **Pré-requisito:** escrita sobre `c1f03c1` (`docs: registra conferencia de tela da wo0005 e abre analise de fontes`), árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 60 testes verdes (relatório da wo0005).
> **Base:** `meta/analises/261112-ANALISE-fontes-do-frame-de-texto.md`, Opção A, aprovada pelo dono em 2026-11-15 — com as duas correções medidas registradas no topo dela (origem `JulietaUla/Montserrat`, ~1,8 MB). Decisão: DEC-017 (Edição 11).
> **Depende de:** wo0005 (aplicada: `44103ac`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `46603564e8e642dbcf6aaf4573aafa4f6a51c19c  meta/CONTEXT.md`
> - `d8d7c271d7d5dbcffa1efad28c8acc19c6d1c989  meta/analises/261112-ANALISE-fontes-do-frame-de-texto.md`
> - `83d48df6023c67155fe0da60a7fae8e3f2f8591a  logs/2026-11-15.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar») = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-15, no disco, neste turno): `meta/STATUS.md` — a nota `**Mudanças nesta revisão (2026-11-12, wo0004):**…`, a linha `- **Motor de overflow de texto especificado** — …`, o trecho `*(corrigido na wo0005, FIX-001 — conferência de tela do dono pendente)*`, o trecho `foi corrigida na wo0005 (FIX-001); falta o dono confirmar na tela.`, a linha de backlog do `FrameText.ts`, o bloco «Última conversa» e o rodapé `*Próximo passo: \`FrameText.ts\` …*`; `meta/ROADMAP.md` — `- [ ] \`FrameText.ts\` — overflow básico (grow-vertical, fixed-clip)`; `meta/CHANGELOG.md` — a linha do `CanvasEngine.ts` em «Adicionado»; `meta/DECISIONS.md` — `## Template para novo ADR (copie e preencha)`; `meta/IDEAS.md` — a linha `  girar \`width\`/\`height\`, e o validador pode cobrar a coerência).`; `logs/2026-11-15.md` — a última linha.
> **Medido pelo chat** (2026-11-15): API do GitHub — `JulietaUla/Montserrat` em `555facfb2a18c72c3c0380f0d9c0f060453a9058` tem `fonts/ttf/Montserrat-{Regular,SemiBold,Bold,ExtraBold}.ttf` e `OFL.txt` (SIL OFL 1.1); os 5 URLs fixados no commit respondem `200` com `content-length` 445928 / 454716 / 454864 / 455468 / 4400. `@types/opentype.js` 1.3.10 declara `class Font { unitsPerEm; ascender; descender; names; getAdvanceWidth(text, fontSize?, options?) }` e `parse(buffer, opt?): Font`; o `opentype.js` instalado (1.3.4) exporta `parse`. Protótipo do contrato abaixo compilado no `tsc` 6.0.3 do projeto: **teste que importa `node:fs/promises` sem `/// <reference types="node" />` dá `TS2591`; com a referência, compila.**

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md` e a seção do Code no log (Edições 9–13). `meta/CONTEXT.md`, a análise e `logs/2026-11-15.md` (seção do chat) são do chat e já estão gravados — **só versione**.

---

## 1. Por que

O `FrameText.ts` precisa medir texto com a fonte real (DEC-006), e o `.editx` só tem o nome da fonte. O dono decidiu: fontes estáticas embarcadas, Montserrat 400/600/700/800, versionadas com a licença. Esta WO traz os arquivos, o catálogo que liga família+peso ao arquivo, e o **motor de layout puro** (quebra de linha e overflow), testado no Vitest com a Montserrat de verdade lida do disco — a mesma divisão da DEC-016: lógica testada, adaptador fino depois. O desenho no Fabric é a WO seguinte.

**Escopo maior que o backlog, de propósito:** o backlog pedia `grow-vertical` e `fixed-clip` primeiro; esta WO faz **os 4 modos**, porque o exemplo usa `fixed-shrink` no preço e os 4 são lógica pura de poucas linhas cada, cobrível por teste. Junto, o STATUS deixa de dizer que a conferência de tela da wo0005 está pendente — o dono a fez em 2026-11-12 (log daquele dia, seção «Chat — tarde»).

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  60 passed (60)`.
3. `ls public/fonts` tem de falhar (a pasta não existe). Se existir, **PARE e reporte**.

## Edição 1 — baixar as fontes e a licença (pede aprovação: download)

```
mkdir -p public/fonts/montserrat && B=https://raw.githubusercontent.com/JulietaUla/Montserrat/555facfb2a18c72c3c0380f0d9c0f060453a9058 && for f in Regular SemiBold Bold ExtraBold; do curl -fsSL -o "public/fonts/montserrat/Montserrat-$f.ttf" "$B/fonts/ttf/Montserrat-$f.ttf" || exit 1; done && curl -fsSL -o public/fonts/montserrat/OFL.txt "$B/OFL.txt"
```

Depois, `wc -c public/fonts/montserrat/*` tem de dar **exatamente** `445928` Regular, `454716` SemiBold, `454864` Bold, `455468` ExtraBold, `4400` OFL.txt. Qualquer tamanho diferente: **PARE e reporte** (arquivo trocado ou corrompido). Cole a saída crua e o `sha1sum` dos 5 arquivos no relatório. **Não** use outra fonte, outro commit nem o CSS do Google Fonts (WOFF2 — o `opentype.js` não lê; CONTEXT, armadilhas).

## Edição 2 — tipos do opentype (pede aprovação: instalar pacote)

```
npm install -D @types/opentype.js@1.3.10
```

Conflito de peer (`ERESOLVE`): **PARE e reporte** — sem `--force`.

## Edição 3 — `src/canvas/PageGeometry.ts` · `ptToPx`

Acrescente ao fim do arquivo (JSDoc PT-BR, no estilo das outras funções):

```ts
/** Pontos tipográficos por polegada (1pt = 1/72in). `TextStyle.fontSize` está em pt. */
export const PT_PER_INCH = 72;

export function ptToPx(pt: number): number;   // pt * CSS_PX_PER_INCH / PT_PER_INCH
```

E em `src/canvas/PageGeometry.test.ts`: **G11** — `ptToPx(72) === 96` e `ptToPx(12) === 16`.

## Edição 4 — `src/text/FontRegistry.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato EXATO (corpo seu; JSDoc PT-BR em cada export):

```ts
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

export class FontNotAvailableError extends Error {
  /** Família pedida que não está no catálogo. */
  readonly family: string;
}

export function pickFace(family: string, weight: number, catalog?: readonly FontFace[]): FontFace;
export type FontLoader = (url: string) => Promise<ArrayBuffer>;
export const fetchFontLoader: FontLoader;

export class FontRegistry {
  constructor(loader?: FontLoader, catalog?: readonly FontFace[]);
  load(family: string, weight: number): Promise<Font>;
}
```

- **`pickFace`** — família fora do catálogo → `FontNotAvailableError` (mensagem PT-BR com a família e as disponíveis). Peso: **regra de correspondência do CSS (CSS Fonts 4, «font-weight»)**, sobre os pesos que a família tem: peso exato se houver; senão, se o pedido está entre 400 e 500 inclusive, os pesos maiores até 500 em ordem crescente, depois os menores em ordem decrescente, depois os maiores que 500 em ordem crescente; se o pedido é menor que 400, os menores em ordem decrescente e depois os maiores em ordem crescente; se é maior que 500, os maiores em ordem crescente e depois os menores em ordem decrescente. O primeiro que existir vence.
- **`fetchFontLoader`** — `fetch(url)`; resposta não-`ok` → `Error` em PT-BR com o URL e o status; senão `arrayBuffer()`.
- **`FontRegistry.load`** — `pickFace`; se o peso escolhido ≠ pedido, `console.warn` em PT-BR (família, pedido, usado); cache **por URL** guardando a `Promise<Font>` (duas chamadas = o carregador roda UMA vez, e a mesma promessa volta); `parse(buffer)` do `opentype.js`. Carga que falha **sai do cache** (a próxima tenta de novo).

## Edição 5 — `src/text/TextLayout.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato EXATO:

```ts
import type { Font } from 'opentype.js';
import type { OverflowConfig, TextStyleProps } from '../types/frame.types';

export interface TextLayoutInput {
  /** Texto a diagramar (o conteúdo do frame estático ou o valor da célula do CSV). */
  text: string;
  /** Fonte já escolhida para a família/peso do estilo (FontRegistry). */
  font: Font;
  /** Estilo RESOLVIDO (resolveStyle) — nunca um estilo derivado cru. */
  style: Readonly<TextStyleProps>;
  overflow: OverflowConfig;
  /** Caixa do frame em px CSS (transform convertido com toPx). */
  width: number;
  height: number;
}

export interface LayoutLine {
  text: string;
  /** Início da linha, em px a partir da borda esquerda do frame (alinhamento aplicado). */
  x: number;
  /** Linha de base, em px a partir do topo do frame. */
  baseline: number;
  width: number;
}

export interface TextLayout {
  lines: LayoutLine[];
  /** Tamanho final do frame em px CSS (muda só nos modos grow-*). */
  width: number;
  height: number;
  /** Quanto a origem do frame se desloca por causa da âncora (grow-*), em px CSS. */
  offsetX: number;
  offsetY: number;
  /** Tamanho final da fonte em pt (muda só em fixed-shrink). */
  fontSize: number;
  fontSizePx: number;
  lineHeightPx: number;
  /** O texto passa da altura do frame (fixed-clip; fixed-shrink que chegou ao mínimo sem caber). */
  clipped: boolean;
}

/** Passo de redução do fixed-shrink, em pt. */
export const SHRINK_STEP_PT = 0.5;

export function layoutText(input: TextLayoutInput): TextLayout;
```

**Regras EXATAS** (são o que os testes da Edição 7 cobram):

1. **Caixa do texto** — antes de medir, aplique `style.transform`: `uppercase` → `toUpperCase()`; `lowercase` → `toLowerCase()`; `capitalize` → primeira letra de cada palavra em maiúscula (palavra = sequência sem espaço); `none` → igual.
2. **Tamanho em px** — `fontSizePx = ptToPx(fontSize)` (Edição 3).
3. **Medida de um trecho** — `''` mede 0; senão `font.getAdvanceWidth(trecho, fontSizePx, { kerning: true }) + style.letterSpacing * fontSizePx * (pontosDeCódigo(trecho) - 1)` (letter-spacing entre caracteres, sem sobra no fim; pontos de código = `Array.from(trecho).length`).
4. **Altura de linha** — `conteúdo = fontSizePx * (font.ascender - font.descender) / font.unitsPerEm`; `lineHeightPx = conteúdo * style.lineHeight` (`lineHeight` 1 = sem espaço extra, como diz o JSDoc do tipo).
5. **Quebra** — o texto se divide em parágrafos por `\n`; parágrafo vazio vira uma linha `''`. No modo `grow-horizontal` **não há quebra**: cada parágrafo é uma linha. Nos outros: palavras = parágrafo dividido por um ou mais espaços, sem vazias; encaixe guloso — a palavra entra na linha se `medida(linha + ' ' + palavra) <= width`; senão a linha fecha e a palavra começa a próxima. Palavra que sozinha passa de `width` é quebrada por pontos de código, gulosamente, cada pedaço com pelo menos 1 caractere. Texto vazio = **uma** linha `''`.
6. **Altura do conteúdo** — `linhas × lineHeightPx`.
7. **Modos:**
   - `grow-vertical` — `width` = entrada; `height` = altura do conteúdo; `offsetY` pela LINHA da âncora (`top-*` 0, `middle-*` `(entrada.height - height)/2`, `bottom-*` `entrada.height - height`); `offsetX` 0; `clipped` false.
   - `grow-horizontal` — `width` = maior largura de linha; `height` = altura do conteúdo; `offsetX` pela COLUNA da âncora (`*-left` 0, `*-center` `(entrada.width - width)/2`, `*-right` `entrada.width - width`) e `offsetY` pela LINHA, como acima; `clipped` false.
   - `fixed-clip` — `width`/`height` = entrada; offsets 0; `clipped` = altura do conteúdo > `height`.
   - `fixed-shrink` — sem `overflow.minFontSize` → `Error` em PT-BR (o validador já exige; aqui é defesa). Começa em `style.fontSize` e reduz `SHRINK_STEP_PT` por vez (nunca abaixo de `minFontSize`), refazendo a quebra a cada tamanho, até a altura do conteúdo caber em `height`. `width`/`height` = entrada; offsets 0; `fontSize` = o final; `clipped` = não coube nem no mínimo.
8. **Alinhamento vertical** (só `fixed-*`): topo do bloco em `top` 0, `middle` `(height - conteúdo)/2`, `bottom` `height - conteúdo` (pode ser negativo). Nos `grow-*`, topo em 0.
9. **Linha de base** da linha `i` = topo do bloco + `i × lineHeightPx` + `(lineHeightPx - conteúdo) / 2` + `fontSizePx × font.ascender / font.unitsPerEm`.
10. **Alinhamento horizontal** (`style.align`), dentro do `width` final: `left` 0; `center` `(width - larguraDaLinha)/2`; `right` `width - larguraDaLinha`; `justify` → **como `left` na F1** (ideia adiada, Edição 12).

## Edição 6 — `src/text/FontRegistry.test.ts` · criar arquivo novo

Primeira linha do arquivo, **obrigatória**: `/// <reference types="node" />` (sem ela o `tsc -b` dá `TS2591` — medido). Carregador de teste lendo do disco: `readFile(new URL(\`../../public${url}\`, import.meta.url))` de `node:fs/promises`, convertido em `ArrayBuffer` (`buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)`). Casos:

| F | Entrada | Esperado |
|---|---|---|
| F1 | `pickFace('Montserrat', 400)` / `600` / `700` / `800` | os 4 URLs do catálogo |
| F2 | `pickFace('Montserrat', 500)` | Regular (400) — pela regra: nada entre 500 e 500, desce |
| F3 | `pickFace('Montserrat', 300)` | Regular (400) — nada abaixo, sobe |
| F4 | `pickFace('Montserrat', 900)` | ExtraBold (800) — nada acima, desce |
| F5 | `pickFace('Montserrat', 650)` | Bold (700) — acima de 500, sobe primeiro |
| F6 | `pickFace('Inter', 400)` | lança `FontNotAvailableError` com `family === 'Inter'` |
| F7 | `new FontRegistry(carregadorDeDisco).load('Montserrat', 700)` duas vezes | as duas resolvem para o MESMO objeto (`toBe`); o carregador rodou 1 vez; `font.names.fontFamily.en === 'Montserrat'` |
| F8 | cada item do `FONT_CATALOG` | o arquivo `public${url}` existe e tem o tamanho medido (445928 / 454716 / 454864 / 455468) |

## Edição 7 — `src/text/TextLayout.test.ts` · criar arquivo novo

Primeira linha **obrigatória**: `/// <reference types="node" />`. Carregue a Montserrat Regular **real** do disco (mesmo carregador) num `beforeAll`. Os esperados saem da PRÓPRIA fonte, calculados no teste com as fórmulas da Edição 5 (largura via `font.getAdvanceWidth(..., { kerning: true })`, `ascender`/`descender`/`unitsPerEm`) — nada de número copiado de outra máquina. Estilo-base: o `titulo-produto` resolvido do exemplo com `transform: 'none'`. Casos:

| L | Entrada | Esperado |
|---|---|---|
| L1 | uma palavra curta, caixa larga, `fixed-clip` | 1 linha; `width` da linha = medida da palavra; `clipped` false |
| L2 | `'aa bb cc'`, `width` = medida(`'aa bb'`) + 1 | linhas `['aa bb', 'cc']` |
| L3 | `'aa\nbb'`, caixa larga | linhas `['aa', 'bb']` |
| L4 | `'aaaaaaaaaa'`, `width` = medida(`'aaa'`) + 1 | várias linhas, cada uma com `width <= ` caixa, e o texto delas concatenado `=== 'aaaaaaaaaa'` |
| L5 | `grow-vertical`, âncora `bottom-left`, texto de 2 linhas, `height` de entrada 1000 | `height = 2 × lineHeightPx`; `offsetY = 1000 - height` |
| L6 | `grow-horizontal`, âncora `top-right`, `'aa bb cc'` | 1 linha; `width` = medida do texto; `offsetX = entrada.width - width` |
| L7 | `fixed-clip`, `height` menor que 2 linhas, texto de 3 linhas | `height` = entrada; 3 linhas; `clipped` true |
| L8 | `fixed-shrink`, `minFontSize` 6, caixa onde o tamanho do estilo não cabe mas um menor cabe | `fontSize` < do estilo, ≥ 6, múltiplo de 0,5 contado a partir do tamanho do estilo; altura do conteúdo ≤ `height`; `clipped` false |
| L9 | `fixed-shrink`, `minFontSize` = tamanho do estilo − 1, caixa minúscula | `fontSize === minFontSize`; `clipped` true |
| L10 | `transform: 'uppercase'`, `'abc'` | texto da linha `'ABC'` |
| L11 | `align: 'center'`, caixa 1000 | `x = (1000 - width da linha)/2` |
| L12 | `''` | 1 linha `''`; `height` (grow-vertical) = `lineHeightPx` |
| L13 | `lineHeight: 1` | `lineHeightPx = fontSizePx × (ascender − descender) / unitsPerEm` |
| L14 | `letterSpacing: 0.1`, `'abcd'` | largura = medida com 0 + `0.1 × fontSizePx × 3` |
| L15 | `fixed-shrink` sem `minFontSize` | lança `Error` |

---

## Edição 8 — conferência, não edita: arquivos de exclusão ficam como estão

As fontes sobem ao Projeto por padrão; esta WO não mexe em `.gitignore` nem em `.flatdropignore`. Confira: `git diff --stat .gitignore .flatdropignore` vazio, e `git check-ignore public/fonts/montserrat/Montserrat-Regular.ttf` sem saída (o arquivo NÃO está ignorado).

## Edição 9a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-12, wo0004):** `CanvasEngine.ts` feito (página vazia com sangria e
zoom para caber, DEC-016) — sai do backlog, `FrameText.ts` vira o próximo; F1 em 5 de 14; o app deixa de
ser o scaffold do Vite. A nota anterior (wo0003) saiu — o que ela registrava está em DEC-015.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-15, wo0006):** fontes do app (Montserrat 400/600/700/800, DEC-017) e motor
de layout de texto puro com os 4 modos de overflow, testados com a fonte real; `FrameText.ts` continua o próximo
(falta o desenho no canvas). A conferência de tela da wo0005 deixa de constar como pendente (feita pelo dono em
2026-11-12). A nota anterior (wo0004) saiu — o que ela registrava está em DEC-016.
```

## Edição 9b — `meta/STATUS.md` · motor de overflow

**Âncora** (linha inteira):

```
- **Motor de overflow de texto especificado** — 4 modos: `grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip` (tipos prontos em `frame.types.ts`; lógica de runtime ainda não implementada — é o `FrameText.ts`, mais à frente no backlog)
```

**Substituir por:**

```
- **Motor de layout de texto funcionando (puro)** — `src/text/TextLayout.ts`: quebra de linha e os 4 modos (`grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip`), medindo com a fonte real via `opentype.js`; `src/text/FontRegistry.ts` liga família+peso ao `.ttf` (Montserrat 400/600/700/800 em `public/fonts/`) — wo0006, DEC-017. Ainda não desenhado no canvas
```

## Edição 9c — `meta/STATUS.md` · conferência feita

**Âncora:**

```
*(corrigido na wo0005, FIX-001 — conferência de tela do dono pendente)*
```

**Substituir por:**

```
*(corrigido na wo0005, FIX-001; conferido pelo dono na tela em 2026-11-12)*
```

## Edição 9d — `meta/STATUS.md` · Quebrado

**Âncora:**

```
foi corrigida na wo0005 (FIX-001); falta o dono confirmar na tela.
```

**Substituir por:**

```
foi corrigida na wo0005 (FIX-001) e conferida pelo dono na tela.
```

## Edição 9e — `meta/STATUS.md` · Backlog

**Âncora** (linha inteira):

```
- [ ] `FrameText.ts` — frame de texto com overflow básico (grow-vertical e fixed-clip primeiro) ← **próximo**
```

**Substituir por:**

```
- [ ] `FrameText.ts` — frame de texto desenhado no canvas ← **próximo** (motor de layout com os 4 modos e fontes já existem — wo0006, DEC-017)
```

## Edição 9f — `meta/STATUS.md` · Última conversa

**Âncora:**

```
**2026-11-12** — wo0004: `CanvasEngine.ts` mostra a página do exemplo no `npm run dev` (DEC-016),
geometria pura testada em `PageGeometry.ts`, scaffold do Vite removido; `StyleRegistry.ts` com
mensagens acentuadas e ciclo detectado mesmo com cadeia quebrada. Dias anteriores em
`logs/2026-11-11.md`; detalhe de hoje em `logs/2026-11-12.md`.
wo0005 (FIX-001): a página em branco do primeiro `npm run dev` era a limpeza do `CanvasView` apagando a montagem viva no StrictMode; corrigida, falta o dono conferir na tela.
**Onde parou:** conferência de tela do dono; depois `FrameText.ts`.
```

**Substituir por:**

```
**2026-11-15** — wo0006: fontes Montserrat embarcadas (DEC-017) e motor de layout de texto puro com os 4 modos
de overflow, testado com a fonte real. Antes: wo0004/wo0005 (canvas mostra a página; FIX-001, conferido pelo
dono na tela em 2026-11-12). Detalhe em `logs/2026-11-12.md` e `logs/2026-11-15.md`.
**Onde parou:** próximo item é o desenho do texto no canvas (`FrameText.ts`).
```

## Edição 9g — `meta/STATUS.md` · rodapé

**Âncora** (linha inteira):

```
*Próximo passo: `FrameText.ts` (frame de texto no canvas, overflow grow-vertical e fixed-clip) — WO a escrever pelo chat.*
```

**Substituir por:**

```
*Próximo passo: `FrameText.ts` — desenhar no Fabric os frames de texto do exemplo, usando `TextLayout.ts` e `FontRegistry.ts` — WO a escrever pelo chat.*
```

## Edição 10 — `meta/ROADMAP.md` · F1

**Âncora** (linha inteira):

```
- [ ] `FrameText.ts` — overflow básico (grow-vertical, fixed-clip)
```

**Substituir por:**

```
- [ ] `FrameText.ts` — overflow (motor de layout com os 4 modos + fontes: wo0006, DEC-017; falta o desenho no canvas)
```

## Edição 11 — `meta/DECISIONS.md` · DEC-017

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-017 — Fontes estáticas embarcadas no app; motor de layout de texto puro

**Data:** 2026-11-15
**Status:** aceita
**Autor:** dono (decisão das fontes), Claude (análise e motor)

### Contexto
O motor de overflow mede com o `opentype.js` (DEC-006), que precisa dos bytes da fonte; o `.editx` só tem o
nome. O `opentype.js` 1.3.4 não lê WOFF2 nem fonte variável (medido). Raciocínio completo e opções descartadas:
`meta/analises/261112-ANALISE-fontes-do-frame-de-texto.md`.

### Decisão
- Fontes do app = `.ttf` ESTÁTICOS versionados em `public/fonts/<família>/` com a licença. F1: Montserrat
  400/600/700/800, do repositório oficial `JulietaUla/Montserrat` fixado no commit
  `555facfb2a18c72c3c0380f0d9c0f060453a9058` (SIL OFL 1.1).
- `src/text/FontRegistry.ts`: catálogo família+peso → URL; peso pela regra de correspondência do CSS; família
  fora do catálogo é ERRO visível, nunca troca silenciosa. O validador NÃO passa a recusar família desconhecida.
- `src/text/TextLayout.ts`: motor PURO (quebra de linha + os 4 modos), testado no Vitest com a fonte real lida
  do disco. Unidades: px CSS; `fontSize` em pt → `ptToPx` (`PageGeometry.ts`).
- Teste que lê disco declara `/// <reference types="node" />` na primeira linha — o `tsconfig.app.json` carrega
  só `vite/client`, e sem a referência o `tsc -b` falha (`TS2591`, medido).

### Alternativas consideradas
- **Google Fonts em tempo de execução** — WOFF2, que o `opentype.js` não lê; rede obrigatória; quebra offline.
- **Fontes do sistema medidas pelo canvas** — layout diferente por máquina; sem bytes para o PDF.
- **Upload de fontes já na F1** — escopo da F2; o app precisa de fontes padrão de qualquer forma.
- **`"types": ["node"]` no `tsconfig.app.json`** — daria tipos do Node ao código do app inteiro (`process`,
  `Buffer`) para servir dois arquivos de teste.

### Consequências
- **Positivas:** mesmo `.editx`, mesmo layout em qualquer máquina; funciona offline; o PDF da F3 já tem os bytes.
- **Negativas:** ~1,8 MB de binário no repositório; uma família só na F1.
- **Riscos:** a referência de tipos do Node num teste vale para a compilação inteira do app — sinal: uso de
  `process`/`Buffer` em arquivo que não é `*.test.ts` (`grep -rln "process\.\|Buffer\." src --include=*.ts | grep -v test`).

---

## Template para novo ADR (copie e preencha)
```

## Edição 12 — `meta/IDEAS.md` · Adiadas (justify)

**Âncora** (linha inteira):

```
  girar `width`/`height`, e o validador pode cobrar a coerência).
```

**Substituir por:**

```
  girar `width`/`height`, e o validador pode cobrar a coerência).
- **`align: 'justify'` de verdade** — na F1 o motor de layout trata `justify` como `left` (DEC-017). Adiada porque
  justificar exige distribuir espaço entre palavras no desenho e no PDF — **volta quando** um template real usar
  texto justificado em várias linhas (catálogo com descrição longa, cardápio).
```

## Edição 13 — `logs/2026-11-15.md` · seção do Code

**Âncora** (última linha do arquivo):

```
wo0006 escrita; aguardando `/apply-wo` (que pede aprovação para baixar as fontes e instalar `@types/opentype.js`).
```

**Substituir por:** a mesma linha, uma linha em branco, e uma seção `## Code (execução) — wo0006` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`.

---

## Fora de escopo

- Desenhar texto no Fabric (`FrameText.ts`), placeholder de frame de dados, carregar fonte no canvas — próxima WO.
- Itálico, outras famílias, upload de fontes, hifenização, RTL, ligaduras além do que o `opentype.js` faz sozinho.
- Mexer no validador ou no formato `.editx`.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **`/// <reference types="node" />` na PRIMEIRA linha dos dois testes de `src/text/`** — antes dos `import`, senão é comentário comum.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** sem *parameter properties* (`FontNotAvailableError` declara o campo e atribui no construtor); `Font` só via `import type`.
- **O CHANGELOG não muda nesta WO:** o `FrameText.ts` ainda não fecha; o registro do que entrou fica no STATUS, na DEC-017 e no log.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `?? logs/2026-11-15.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/IDEAS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M meta/analises/261112-ANALISE-fontes-do-frame-de-texto.md`, `M package.json`, `M package-lock.json`, `M src/canvas/PageGeometry.ts`, `M src/canvas/PageGeometry.test.ts`, `?? meta/workorders/261115-wo0006-fontes-e-layout.md`, `?? public/fonts/montserrat/Montserrat-Regular.ttf`, `?? public/fonts/montserrat/Montserrat-SemiBold.ttf`, `?? public/fonts/montserrat/Montserrat-Bold.ttf`, `?? public/fonts/montserrat/Montserrat-ExtraBold.ttf`, `?? public/fonts/montserrat/OFL.txt`, `?? src/text/FontRegistry.ts`, `?? src/text/FontRegistry.test.ts`, `?? src/text/TextLayout.ts`, `?? src/text/TextLayout.test.ts`. Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 84 testes** (60 + G11 + F1–F8 + L1–L15). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida 1 (quebra de linha):** troque temporariamente o `<=` do encaixe guloso por `< 0` (nunca cabe), rode `npm test` e confirme que **L2 falha** — linha crua —, restaure, verde.
      - **Quem roda:** quem aplica. **Chega no ramo?** `TextLayout.test.ts` → `layoutText` → encaixe guloso. **NÃO responde:** se o texto aparece certo na tela — isso é a próxima WO.
- [ ] **Prova de vida 2 (peso):** troque temporariamente a ordem «maiores primeiro» do peso > 500 por «menores primeiro», rode `npm test` e confirme que **F5 falha**, restaure, verde.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `head -1 src/text/FontRegistry.test.ts src/text/TextLayout.test.ts` = `/// <reference types="node" />` nos dois
      - `grep -c "^/// <reference types=\"node\" />" src/text/FontRegistry.ts src/text/TextLayout.ts` = 0 e 0
      - `grep -c "^export function ptToPx" src/canvas/PageGeometry.ts` = 1
      - `grep -c "^## DEC-017" meta/DECISIONS.md` = 1
      - `grep -c "conferência de tela do dono pendente" meta/STATUS.md` = 0
      - `grep -c "^## Code (execução) — wo0006" logs/2026-11-15.md` = 1
      *(escritos pelo chat e não testados no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0006.txt` (`date +%y%m%d-%H%M`, na hora). Inclua: `wc -c` e `sha1sum` dos 5 arquivos baixados, `npm ls @types/opentype.js`, as saídas cruas acima, `wc -l` dos 4 arquivos de `src/text/`, e qualquer decisão sua no corpo das funções.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-15.md meta/CONTEXT.md meta/DECISIONS.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md meta/analises/261112-ANALISE-fontes-do-frame-de-texto.md meta/workorders/261115-wo0006-fontes-e-layout.md package.json package-lock.json public/fonts src/canvas/PageGeometry.ts src/canvas/PageGeometry.test.ts src/text
```

```
git commit -m "feat(text): embarca fontes Montserrat e cria motor de layout de texto" -m "FontRegistry liga familia e peso ao ttf (regra de peso do CSS); TextLayout faz quebra de linha e os 4 modos de overflow, testado com a fonte real. Fontes do repositorio oficial no commit 555facf, OFL 1.1. DEC-017 (wo0006)."
```

```
git push
```
