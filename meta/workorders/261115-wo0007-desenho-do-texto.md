# WO 0007 — Texto desenhado no canvas como contorno das letras (FrameText.ts, DEC-018)

> **Tipo:** mista — CÓDIGO (desenho puro + testes, cola assíncrona + testes, adaptador do Fabric, host React) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — primeira vez que dado do `.editx` vira desenho no Fabric.
> **Pré-requisito:** escrita sobre `a15b8d1` (`feat(text): embarca fontes Montserrat e cria motor de layout de texto`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 89 testes verdes (relatório da wo0006).
> **Base:** o dono escolheu em 2026-11-15 desenhar o texto como **contorno das letras** (opção A) em vez de texto do Fabric com fonte do navegador. Decisão: DEC-018 (Edição 9).
> **Depende de:** wo0006 (aplicada: `a15b8d1`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `c522d6a7d7973c813b902de49d0828a57d73096c  meta/CONTEXT.md`
> - `4544d7fffdcd968f082a7c5102b51fb2c8f44291  logs/2026-11-15.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar») = já aplicada: **PULE** e diga no relatório. Na REMOÇÃO (8b, segunda parte), «já aplicada» = a linha não existe mais.
> **Âncoras lidas em** (pelo chat, 2026-11-15, no disco, neste turno): `meta/STATUS.md` — a nota `**Mudanças nesta revisão (2026-11-15, wo0006):**…`, a linha `**v0.0.0** … 5 de 14 …`, a linha que começa `- **Motor de layout de texto funcionando (puro)** —`, `*Nada em progresso — próximo item do backlog é \`FrameText.ts\`.*`, as linhas de backlog `FrameText.ts`/`FrameImage.ts`, o bloco «Última conversa» e o rodapé; `meta/ROADMAP.md` — as linhas `FrameText.ts`/`FrameImage.ts` da F1; `meta/CHANGELOG.md` — a linha do `CanvasEngine.ts` em «Adicionado» e `- \`FrameText.ts\` — frame de texto com modos \`grow-vertical\` e \`fixed-clip\``; `meta/DECISIONS.md` — `## Template para novo ADR (copie e preencha)`; `meta/IDEAS.md` — a linha `  texto justificado em várias linhas (catálogo com descrição longa, cardápio).`; `logs/2026-11-15.md` — a última linha; `src/App.tsx` inteiro (substituído).
> **Medido pelo chat** (2026-11-15, no código instalado): **Fabric 6.9.1** — `new Path(d, opções)` sem `left`/`top` chama `setBoundingBox(true)` → `setPositionByOrigin(pathOffset, CENTER, CENTER)`, ou seja, o objeto fica onde as coordenadas do contorno dizem; com `left`/`top` ele é movido. `absolutePositioned` existe nas props de objeto; `sendObjectToBack` existe no canvas. **opentype.js 1.3.4** — `forEachGlyph` mescla `defaultRenderOptions` com as opções do chamador e `updateFeatures` só mantém `liga`/`rlig` latinos se a opção os pedir por nome: com `{ kerning: true }` **não há ligadura**, um glifo por caractere; `letterSpacing` (em em) soma `letterSpacing × fontSize` depois de CADA glifo — as posições batem com o `measure` da wo0006 (espaço entre caracteres), só a sobra final difere, e ela não desenha nada.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md` e a seção do Code no log (Edições 7–11). `meta/CONTEXT.md` e `logs/2026-11-15.md` (seção do chat) são do chat e já estão gravados — **só versione**.

---

## 1. Por que

O motor de layout (wo0006) calcula linhas, posições e tamanho; nada aparece ainda. Esta WO desenha os frames de texto da página: cada linha vira o **contorno vetorial** gerado pelo `opentype.js` com a mesma fonte, o mesmo tamanho e as mesmas posições que o motor calculou — o que se vê é exatamente o que foi medido, em qualquer máquina, sem depender de o navegador carregar a fonte. Mesma divisão da DEC-016: o cálculo (`TextDrawing.ts`, `FrameText.ts`) é testado em Node com a fonte real; o Fabric só recebe contornos prontos e é conferido pelo dono na tela.

**Frames de dados** (`role: 'data'`) mostram um texto de amostra, `{<coluna>}` (ex.: `{nome}`), até existir CSV importado. **Rotação** (`transform.rotation ≠ 0`) ainda não é desenhada: o frame sai sem girar e um aviso vai ao console — o ponto de giro não está definido no formato (ideia adiada, Edição 10).

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  89 passed (89)`.
3. `git status -sb` sem `ahead`/`behind`.

## Edição 1 — `src/text/TextDrawing.ts` · criar arquivo novo (puro)

Se já existir, **PARE e reporte**. Contrato EXATO (JSDoc PT-BR em cada export):

```ts
import type { Font } from 'opentype.js';
import type { DocumentSettings, TextStyleMap } from '../template/TemplateSchema';
import type { BaseFrame, TextFrame } from '../types/frame.types';

/** Retângulo em px CSS no MUNDO do canvas (zoom 1; origem no canto da caixa de sangria). */
export interface DrawRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface TextDrawing {
  kind: 'text';
  frameId: string;
  zIndex: number;
  /** Retângulo final do frame (depois de grow-* e da âncora). */
  frame: DrawRect;
  /** Contorno de cada linha NÃO vazia, em dados de caminho SVG, já em coordenadas do mundo. */
  paths: string[];
  fill: string;
  /** Recorte do frame (modos fixed-*), ou null. */
  clip: DrawRect | null;
}

export interface TextDrawingError {
  kind: 'error';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  message: string;
}

export type TextFrameDrawing = TextDrawing | TextDrawingError;

export function frameText(frame: TextFrame): string;
export function frameRect(frame: BaseFrame, document: DocumentSettings): DrawRect;
export function drawTextFrame(frame: TextFrame, document: DocumentSettings, styles: TextStyleMap, font: Font): TextDrawing;
```

- **`frameText`** — `role: 'static'` → `content`; `role: 'data'` → `` `{${csvColumn}}` ``.
- **`frameRect`** — o `transform` é relativo ao CANTO DA ÁREA DE CORTE, na unidade do documento (`document.unit`; JSDoc de `Transform`). No mundo, a área de corte começa em `(bleed, bleed)` (wo0004: `PageGeometry.pageBox`). Logo: `left = box.bleed + toPx(x, unit)`, `top = box.bleed + toPx(y, unit)`, `width = toPx(width, unit)`, `height = toPx(height, unit)`.
- **`drawTextFrame`** — `style = resolveStyle(styles, frame.textStyle)`; `rect = frameRect(...)`; `layout = layoutText({ text: frameText(frame), font, style, overflow: frame.overflow, width: rect.width, height: rect.height })`; origem do frame final `ox = rect.left + layout.offsetX`, `oy = rect.top + layout.offsetY`; `frame = { left: ox, top: oy, width: layout.width, height: layout.height }`; para cada linha com `text !== ''`: `font.getPath(line.text, ox + line.x, oy + line.baseline, layout.fontSizePx, { kerning: true, letterSpacing: style.letterSpacing }).toPathData(3)`; `fill = style.color`; `clip = frame` nos modos `fixed-clip` e `fixed-shrink`, `null` nos `grow-*`. A `font` recebida é responsabilidade de quem chama (família/peso do estilo resolvido).

## Edição 2 — `src/canvas/FrameText.ts` · criar arquivo novo (cola assíncrona; NÃO importa `fabric`)

Se já existir, **PARE e reporte**. Contrato EXATO:

```ts
import type { EditxTemplate } from '../template/TemplateSchema';
import type { FontRegistry } from '../text/FontRegistry';
import type { TextFrameDrawing } from '../text/TextDrawing';

export function prepareTextDrawings(template: EditxTemplate, pageId: string, fonts: FontRegistry): Promise<TextFrameDrawing[]>;
```

- Página `pageId` inexistente → a promessa **rejeita** com `Error` em PT-BR.
- Para cada frame da página com `type === 'text'` e `visible === true`: resolve o estilo (`resolveStyle`), carrega a fonte (`fonts.load(style.fontFamily, style.fontWeight)`) e chama `drawTextFrame`. **Qualquer erro desse frame** (estilo inexistente, `FontNotAvailableError`, falha de carga) vira `{ kind: 'error', frameId, zIndex, frame: frameRect(frame, template.document), message }` e um `console.error` em PT-BR com o id do frame — os outros frames seguem.
- `transform.rotation !== 0` → `console.warn` em PT-BR («rotação ainda não é desenhada na F1», com o id) e desenha sem girar.
- Resultado ordenado por `zIndex` crescente, **estável** (empate mantém a ordem dos frames na página).
- Frames de imagem e forma são ignorados aqui (próximas WOs).

## Edição 3 — `src/canvas/CanvasEngine.ts` · desenhar os contornos

Acrescente o método público (o resto da classe não muda, salvo o item `showPage` abaixo):

```ts
/** Substitui os desenhos de texto da página. Contornos prontos, em coordenadas do mundo. */
setTextDrawings(drawings: readonly TextFrameDrawing[]): void;
```

- `assertAlive()`; remove os objetos de texto anteriores (só os que este método criou); para cada desenho, na ordem recebida:
  - `kind: 'text'` → um `Path` por item de `paths`, com `fill`, `selectable: false`, `evented: false`, e — se `clip` não for `null` — `clipPath: new Rect({ left, top, width, height, originX: 'left', originY: 'top', absolutePositioned: true })` (um `Rect` por `Path`). **NÃO passe `left`/`top` ao `Path`** (ele se posiciona pela caixa do contorno — ver cabeçalho, medido).
  - `kind: 'error'` → um `Rect` na posição do `frame` (`originX: 'left'`, `originY: 'top'`), `fill: 'rgba(217, 48, 37, 0.08)'`, `stroke: '#D93025'`, `strokeWidth: 1`, `strokeDashArray: [4, 4]`, `strokeUniform: true`, `selectable: false`, `evented: false`.
  - adiciona todos e `requestRenderAll()`.
- **`showPage`** passa a remover também os objetos de texto (página nova = desenhos velhos não valem; quem chama manda os novos).
- Tipo `TextFrameDrawing` só via `import type`. Nenhuma conta de layout aqui (DEC-016): só repassa números.

## Edição 4 — `src/ui/CanvasView.tsx` · mostrar uma página do template

Mude as props para:

```tsx
export interface CanvasViewProps {
  /** Template cujo documento e página serão mostrados. */
  template: EditxTemplate;
  /** Id da página a mostrar. */
  pageId: string;
}
```

- **Mantenha intacta** a limpeza do FIX-001 (`element.remove()` no `.finally`) e o `<canvas>` criado por montagem — nada de `useRef` num `<canvas>` do JSX.
- O efeito de montagem desenha a página com `template.document` (o `settingsRef` vira `templateRef`).
- Um `FontRegistry` **no escopo do módulo** (`const fonts = new FontRegistry();`) — o cache dura entre montagens.
- Efeito de `[template, pageId]`: `engine.showPage(template.document)`; depois `prepareTextDrawings(template, pageId, fonts)` e, quando resolver, `engine.setTextDrawings(drawings)` **só se** o efeito não foi limpo nesse meio-tempo e o engine não foi liberado (bandeira `cancelado` na limpeza do efeito). Rejeição → `console.error` em PT-BR.

## Edição 5 — `src/App.tsx` · substituir o arquivo inteiro

```tsx
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Host de desenvolvimento: mostra a página de PRODUTO do exemplo no canvas, ocupando a
 * janela. A capa ainda não serve para conferir: o título dela é branco sobre a forma de
 * fundo, e formas ainda não são desenhadas. Some quando existir a UI do editor.
 */
export default function App() {
  return <CanvasView template={catalogoSimplesExample} pageId="page-produto" />;
}
```

## Edição 6 — testes · dois arquivos novos

Os dois começam, na PRIMEIRA linha, com `/// <reference types="node" />` (DEC-017) e usam um carregador de fonte do disco como o de `src/text/FontRegistry.test.ts` (copie o padrão; o `FontRegistry` real, com esse carregador). Clone o exemplo com `structuredClone` antes de mutar.

**6a — `src/text/TextDrawing.test.ts`** (Montserrat da família/peso de cada estilo, carregada pelo `FontRegistry` com o carregador do disco):

| D | Entrada | Esperado |
|---|---|---|
| D1 | `frameRect(frame-nome-produto, document)` (x10 y15 w190 h20 mm, sangria 3 mm) | `left ≈ toPx(13,'mm')`, `top ≈ toPx(18,'mm')`, `width ≈ toPx(190,'mm')`, `height ≈ toPx(20,'mm')` |
| D2 | `frameText` do frame de dados `nome` e do estático `frame-titulo-capa` | `'{nome}'` e `'Ofertas de Verão'` |
| D3 | `drawTextFrame(frame-nome-produto, …)` | `kind 'text'`; `fill '#1D3557'`; `clip === null`; `paths.length === 1` e `paths[0]` começa com `'M'`; `frame.top === frameRect(...).top` (âncora `top-left`); `frame.height` = altura do layout (`layoutText` com os mesmos dados) |
| D4 | `drawTextFrame(frame-preco-produto, …)` (`fixed-shrink`) | `clip` = `frame` = `frameRect(frame-preco-produto)` |
| D5 | frame estático com `content: ''` | `paths` = `[]` |
| D6 | paridade sem ligadura: `font.getAdvanceWidth('fi', px, { kerning: true, letterSpacing: 0.5 }) - font.getAdvanceWidth('fi', px, { kerning: true })` | `≈ 0.5 × px × 2` (dois glifos → sem ligadura; medido no código, aqui fica preso por teste) |

**6b — `src/canvas/FrameText.test.ts`:**

| P | Entrada | Esperado |
|---|---|---|
| P1 | `prepareTextDrawings(exemplo, 'page-produto', fonts)` | 2 desenhos `kind 'text'`, ids `['frame-nome-produto', 'frame-preco-produto']` nessa ordem (os dois têm `zIndex` 3 — ordem estável) |
| P2 | `prepareTextDrawings(exemplo, 'page-capa', fonts)` | 1 desenho, `fill '#FFFFFF'` |
| P3 | estilo `titulo-produto` com `fontFamily: 'Inter'` (clone) | o desenho de `frame-nome-produto` tem `kind 'error'` e `message` contém `Inter`; o de `frame-preco-produto` existe — com `kind 'error'` também, porque herda a família (DEC-014) |
| P4 | `frame-nome-produto` com `visible: false` | só `frame-preco-produto` no resultado |
| P5 | `pageId: 'nao-existe'` | a promessa rejeita |

---

## Edição 7a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-15, wo0006):** fontes do app (Montserrat 400/600/700/800, DEC-017) e motor
de layout de texto puro com os 4 modos de overflow, testados com a fonte real; `FrameText.ts` continua o próximo
(falta o desenho no canvas). A conferência de tela da wo0005 deixa de constar como pendente (feita pelo dono em
2026-11-12). A nota anterior (wo0004) saiu — o que ela registrava está em DEC-016.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-15, wo0007):** o texto aparece no canvas, desenhado como contorno das letras
(DEC-018) — `FrameText.ts` sai do backlog (conferência de tela do dono pendente), `FrameImage.ts` vira o próximo;
F1 em 6 de 14. A nota anterior (wo0006) saiu — o que ela registrava está em DEC-017.
```

## Edição 7b — `meta/STATUS.md` · versão

**Âncora** (linha inteira):

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 5 de 14 itens prontos)
```

**Substituir por:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 6 de 14 itens prontos)
```

## Edição 7c — `meta/STATUS.md` · Funcionando

**Âncora** (início da linha — única):

```
- **Motor de layout de texto funcionando (puro)** —
```

**Substituir por:**

```
- **Texto aparece no canvas** *(conferência de tela do dono pendente)* — os frames de texto da página são desenhados como contorno das letras gerado pelo `opentype.js` com a mesma medida do motor (`text/TextDrawing.ts` puro + `canvas/FrameText.ts`, testados com a fonte real; `CanvasEngine.setTextDrawings`); frames de dados mostram `{coluna}`; frame com fonte/estilo inválido aparece como retângulo vermelho tracejado — wo0007, DEC-018. Rotação ainda não é desenhada
- **Motor de layout de texto funcionando (puro)** —
```

## Edição 7d — `meta/STATUS.md` · Em Progresso

**Âncora** (linha inteira):

```
*Nada em progresso — próximo item do backlog é `FrameText.ts`.*
```

**Substituir por:**

```
*Nada em progresso — próximo item do backlog é `FrameImage.ts`.*
```

## Edição 7e — `meta/STATUS.md` · Backlog

**Âncora:**

```
- [ ] `FrameText.ts` — frame de texto desenhado no canvas ← **próximo** (motor de layout com os 4 modos e fontes já existem — wo0006, DEC-017)
- [ ] `FrameImage.ts` — frame de imagem com fit modes
```

**Substituir por:**

```
- [x] `FrameText.ts` — frame de texto desenhado no canvas como contorno das letras (wo0006 + wo0007, DEC-017/DEC-018; conferência de tela do dono pendente)
- [ ] `FrameImage.ts` — frame de imagem com fit modes ← **próximo**
```

## Edição 7f — `meta/STATUS.md` · Última conversa

**Âncora:**

```
**2026-11-15** — wo0006: fontes Montserrat embarcadas (DEC-017) e motor de layout de texto puro com os 4 modos
de overflow, testado com a fonte real. Antes: wo0004/wo0005 (canvas mostra a página; FIX-001, conferido pelo
dono na tela em 2026-11-12). Detalhe em `logs/2026-11-12.md` e `logs/2026-11-15.md`.
**Onde parou:** próximo item é o desenho do texto no canvas (`FrameText.ts`).
```

**Substituir por:**

```
**2026-11-15** — wo0006 (fontes Montserrat e motor de layout, DEC-017) e wo0007 (texto desenhado como contorno
das letras na página de produto, DEC-018). Detalhe em `logs/2026-11-15.md`.
**Onde parou:** conferência de tela do texto pelo dono; depois `FrameImage.ts`.
```

## Edição 7g — `meta/STATUS.md` · rodapé

**Âncora** (linha inteira):

```
*Próximo passo: `FrameText.ts` — desenhar no Fabric os frames de texto do exemplo, usando `TextLayout.ts` e `FontRegistry.ts` — WO a escrever pelo chat.*
```

**Substituir por:**

```
*Próximo passo: `FrameImage.ts` (frame de imagem com fit modes) — WO a escrever pelo chat, depois da conferência de tela do texto.*
```

## Edição 8a — `meta/ROADMAP.md` · F1

**Âncora:**

```
- [ ] `FrameText.ts` — overflow (motor de layout com os 4 modos + fontes: wo0006, DEC-017; falta o desenho no canvas)
```

**Substituir por:**

```
- [x] `FrameText.ts` — overflow e desenho (motor de layout com os 4 modos + fontes: wo0006, DEC-017; contorno das letras no canvas: wo0007, DEC-018)
```

## Edição 8b — `meta/CHANGELOG.md` · Adicionado e Planejado

**Âncora** (linha inteira, em «Adicionado»):

```
- `CanvasEngine.ts` + `PageGeometry.ts` + `ui/CanvasView.tsx` — a página do documento aparece no canvas (área de corte, guia de sangria, zoom para caber, reenquadra ao redimensionar); o app deixa de ser o scaffold do Vite. Ver DEC-016
```

**Substituir por:**

```
- `CanvasEngine.ts` + `PageGeometry.ts` + `ui/CanvasView.tsx` — a página do documento aparece no canvas (área de corte, guia de sangria, zoom para caber, reenquadra ao redimensionar); o app deixa de ser o scaffold do Vite. Ver DEC-016
- Texto no canvas — fontes Montserrat embarcadas (`public/fonts/`, `text/FontRegistry.ts`), motor de layout com os 4 modos de overflow (`text/TextLayout.ts`) e desenho como contorno das letras (`text/TextDrawing.ts`, `canvas/FrameText.ts`). Ver DEC-017 e DEC-018
```

**E remova a linha inteira** (em «Planejado para v0.1.0»):

```
- `FrameText.ts` — frame de texto com modos `grow-vertical` e `fixed-clip`
```

## Edição 9 — `meta/DECISIONS.md` · DEC-018

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-018 — Texto desenhado no canvas como contorno das letras

**Data:** 2026-11-15
**Status:** aceita
**Autor:** dono (escolha entre as duas formas), Claude (forma e medições)

### Contexto
O motor de layout (DEC-017) mede com o `opentype.js`. Desenhar com o texto do Fabric faria o NAVEGADOR medir de
novo, com o motor de texto dele: as larguras podem divergir das do motor, mudando quebra de linha e encaixe —
exatamente o que a geração em massa não tolera.

### Decisão
- Cada linha é desenhada como o contorno vetorial do `opentype.js` (`font.getPath(...).toPathData`), com a mesma
  fonte, tamanho e posições do layout, e vira um `Path` do Fabric posicionado pelas próprias coordenadas.
- Frames de dados mostram `{coluna}` até haver CSV importado. Rotação ainda não é desenhada (ponto de giro
  indefinido no formato — ideia adiada).
- Frame cujo estilo/fonte falha vira um retângulo vermelho tracejado no lugar, e os outros seguem.

### Alternativas consideradas
- **Texto do Fabric (`Textbox`/`IText`) com a fonte carregada pelo navegador** — permite digitar no canvas mais
  cedo, mas o desenho deixa de ser o que o motor mediu. Escolha do dono: fidelidade primeiro.

### Consequências
- **Positivas:** o que aparece é o que o motor calculou, em qualquer máquina; sem corrida de carregamento de fonte.
- **Negativas:** editar texto digitando direto no canvas exige, depois, uma caixa de edição por cima do frame (ou o
  painel de propriedades). Texto desenhado não é selecionável como texto no canvas (o PDF da F3 é outra rota).
- **Riscos:** passar `left`/`top` a um `Path` de texto o desloca da linha de base — armadilha no CONTEXT.

---

## Template para novo ADR (copie e preencha)
```

## Edição 10 — `meta/IDEAS.md` · Adiadas (rotação e edição no canvas)

**Âncora** (linha inteira):

```
  texto justificado em várias linhas (catálogo com descrição longa, cardápio).
```

**Substituir por:**

```
  texto justificado em várias linhas (catálogo com descrição longa, cardápio).
- **Rotação de frame desenhada** — `transform.rotation` existe no formato, mas o ponto de giro (canto ou centro)
  não está definido; na F1 o frame sai sem girar e avisa no console (DEC-018). **Volta quando** o
  `SelectionManager.ts` permitir girar um frame — aí definir o ponto de giro no JSDoc de `Transform` e desenhar.
- **Editar texto digitando direto no canvas** — com o texto como contorno (DEC-018), a edição na tela pede uma caixa
  de edição por cima do frame. **Volta quando** a UI mínima (Toolbar/PropertiesPanel) existir e editar pelo painel
  se mostrar lento no uso real.
```

## Edição 11 — `logs/2026-11-15.md` · seção do Code

**Âncora** (última linha do arquivo):

```
wo0007 escrita; aguardando `/apply-wo` e o roteiro de tela do dono.
```

**Substituir por:** a mesma linha, uma linha em branco, e uma seção `## Code (execução) — wo0007` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`.

---

## Fora de escopo

- Frames de imagem e de forma; rotação; edição de texto no canvas; dados de CSV de verdade.
- Mexer em `TextLayout.ts`, `FontRegistry.ts`, no validador ou no formato.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **`/// <reference types="node" />` na PRIMEIRA linha dos dois testes novos** (DEC-017). Nunca em arquivo que não é teste.
- **Nenhum teste importa `fabric`** (DEC-016) — `FrameText.ts` e `TextDrawing.ts` não importam `fabric`.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** tipos só via `import type`.
- **Não suba o `npm run dev` para «conferir»** — a tela é do dono (roteiro no chat). Se subir, feche antes de commitar e diga.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `M logs/2026-11-15.md`, `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/IDEAS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M src/App.tsx`, `M src/canvas/CanvasEngine.ts`, `M src/ui/CanvasView.tsx`, `?? meta/workorders/261115-wo0007-desenho-do-texto.md`, `?? src/canvas/FrameText.ts`, `?? src/canvas/FrameText.test.ts`, `?? src/text/TextDrawing.ts`, `?? src/text/TextDrawing.test.ts`. Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 100 testes** (89 + D1–D6 + P1–P5). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida:** troque temporariamente `oy + line.baseline` por `oy` em `drawTextFrame`, rode `npm test` — **se nenhum teste falhar, acrescente um** que compare o primeiro ponto do `paths[0]` de D3 com o de `font.getPath(...)` montado no teste com a linha de base, e prove que ele falha com a troca. Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `TextDrawing.test.ts` → `drawTextFrame` → `font.getPath` com a linha de base. **NÃO responde:** se o Fabric põe o contorno no lugar certo — isso é o roteiro do dono.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -rln "from 'fabric'" src/text src/canvas/FrameText.ts | wc -l` = 0
      - `grep -c "^/// <reference types=\"node\" />" src/text/TextDrawing.test.ts src/canvas/FrameText.test.ts` = 1 e 1
      - `grep -c "element.remove();" src/ui/CanvasView.tsx` = 1 (FIX-001 intacto)
      - `grep -c "^## DEC-018" meta/DECISIONS.md` = 1
      - `grep -c "^- \[x\] \`FrameText.ts\`" meta/STATUS.md meta/ROADMAP.md` = 1 e 1
      - `grep -c "^- \`FrameText.ts\` — frame de texto com modos" meta/CHANGELOG.md` = 0
      - `grep -c "^## Code (execução) — wo0007" logs/2026-11-15.md` = 1
      *(escritos pelo chat e não testados no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0007.txt` (`date +%y%m%d-%H%M`, na hora). Inclua as saídas cruas acima, `wc -l` dos arquivos novos e de `CanvasEngine.ts`/`CanvasView.tsx`, e qualquer decisão sua. **Se o push falhar** (a porta 22 já falhou nesta máquina em 2026-11-15), diga o erro cru e deixe o commit local — o dono resolve a rede.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-15.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md meta/workorders/261115-wo0007-desenho-do-texto.md src/App.tsx src/canvas/CanvasEngine.ts src/canvas/FrameText.ts src/canvas/FrameText.test.ts src/text/TextDrawing.ts src/text/TextDrawing.test.ts src/ui/CanvasView.tsx
```

```
git commit -m "feat(canvas): desenha texto como contorno das letras" -m "TextDrawing gera o contorno de cada linha com o opentype na medida do motor de layout; FrameText resolve estilo e fonte por frame; CanvasEngine recebe os Paths prontos. Frames de dados mostram a coluna entre chaves. DEC-018 (wo0007)."
```

```
git push
```
