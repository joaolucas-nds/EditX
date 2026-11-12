# WO 0004 — CanvasEngine.ts: página vazia no canvas, com sangria e zoom para caber (DEC-016)

> **Tipo:** mista — CÓDIGO (geometria pura + testes, adaptador do Fabric, host React, limpeza do scaffold, 2 correções no `StyleRegistry.ts`) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — primeira peça com Fabric e DOM; o adaptador não tem teste automático.
> **Pré-requisito:** escrita sobre `d2ef009` (`feat(template): cria StyleRegistry com resolucao pura de estilos`), árvore limpa exceto os arquivos que o chat gravou (lista abaixo). Suíte em 49 testes verdes (relatório da wo0003, em `../notas-arquivadas/`).
> **Base:** backlog do STATUS («`CanvasEngine.ts` ← próximo»); DEC-003 (Fabric 6); DEC-004/DEC-015 (estado no store, módulos puros). Decisão de forma: DEC-016 (entra pela Edição 13).
> **Depende de:** wo0003 (aplicada: `d2ef009`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `ff0b81eaaec33b08c556c00aabe1c09105e0afdf  meta/CONTEXT.md`
> - `a5048f41c9527c07f59c081b073a53706a8413f0  meta/analises/261111-ANALISE-heranca-de-estilos.md`
> - `23cb4b73723be22bd314cddef9e64428a37114d5  logs/2026-11-12.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte** — nunca chute um lugar próximo.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar») = já aplicada: **PULE** e diga no relatório. Na REMOÇÃO (12b), «já aplicada» = a linha não existe mais.
> **Âncoras lidas em** (lidas pelo chat em 2026-11-12, no disco, neste turno): os blocos citados em cada edição abaixo foram copiados dos arquivos vivos — `meta/STATUS.md` (nota `…(2026-11-11, wo0003)`, linha `**v0.0.0** …4 de 14…`, linha `- **Salvar/abrir \`.editx\`** …`, `*Nada em progresso … \`CanvasEngine.ts\`.*`, backlog `CanvasEngine`/`FrameText`, «Última conversa», rodapé), `meta/ROADMAP.md` (`- [ ] \`CanvasEngine.ts\` — wrapper Fabric.js`), `meta/CHANGELOG.md` (linha do `StyleRegistry.ts` em Adicionado; `- \`CanvasEngine.ts\` — wrapper Fabric.js básico` em Planejado), `meta/DECISIONS.md` (`## Template para novo ADR (copie e preencha)`), `meta/IDEAS.md` (última linha do item zod em «Adiadas»), `logs/2026-11-12.md` (última linha), `src/App.tsx` e `src/index.css` (arquivos inteiros — substituídos, sem âncora).
> **Afirmações sobre o Fabric** (lidas pelo chat em `node_modules/fabric/dist`, versão **6.9.1**): `new Canvas(el?, options?)`; `dispose(): Promise<boolean>`; `destroy()` marcado inseguro; `setDimensions`, `setViewportTransform`, `getZoom`, `requestRenderAll` existem; `Canvas`, `Rect`, `Point` exportados de `fabric`; `selectable`, `evented`, `strokeDashArray`, `strokeUniform` são props de objeto; `selection`, `renderOnAddRemove`, `enableRetinaScaling`, `backgroundColor` são opções de canvas; `StaticCanvasDOMManager.createLowerCanvas` lança «Trying to initialize a canvas that has already been initialized» se o elemento tem `data-fabric`.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md` e a seção do Code no log (Edições 10–15). `meta/CONTEXT.md`, a análise e `logs/2026-11-12.md` (seção do chat) são do chat e já estão gravados — **só versione**.

---

## 1. Por que

Nada aparece na tela ainda: o app é o scaffold do Vite. O `CanvasEngine.ts` é a base de todo frame que vem depois (`FrameText`, `FrameImage`, `FrameShape`): monta o Fabric num elemento, desenha a página do documento (área de corte + guia de sangria), enquadra com zoom para caber e libera tudo ao desmontar. Para ser testável sem navegador, a matemática (unidade → px, caixa com sangria, zoom, centralização) fica num módulo puro, `PageGeometry.ts`, testado em Node; o adaptador do Fabric fica fino e é conferido pelo dono na tela (roteiro no chat). Junto, duas pendências da revisão da wo0003 no `StyleRegistry.ts`: mensagens sem acento (são lidas pelo usuário final) e `setStyle` que não acusa ciclo quando a cadeia do novo pai passa pelo estilo e depois cai num pai inexistente.

**Eventos de objeto** (seleção, mover, redimensionar) **não entram aqui**: chegam com `SelectionManager.ts`, quando houver objeto para selecionar. Esta WO entrega ciclo de vida, página e zoom.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. `npm ls fabric` tem de dizer `fabric@6.9.1`. Outra versão: **PARE e reporte** (as afirmações do cabeçalho são dessa versão).
3. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  49 passed (49)`.
4. `grep -rn "App.css\|assets/" src index.html` — esperado: só as 4 linhas de `src/App.tsx` (os 3 assets e o `App.css`). Outra linha: **PARE e reporte** (a Edição 9 apaga esses arquivos).

## Edição 1 — `src/template/StyleRegistry.test.ts` · S14 (antes da correção)

Acrescente ao `describe` existente:

| S | Entrada | Esperado |
|---|---|---|
| S14 | mapa montado à mão `{ a: { basedOn: 'fantasma', fontSize: 10 }, b: { basedOn: 'a' } }` (tipo `TextStyleMap`); `setStyle(mapa, 'a', { basedOn: 'b' })` | lança `StyleRegistryError` (o novo elo fecharia `a → b → a`) |

Rode `npm test` **agora, antes da Edição 2**: o S14 **tem de falhar** (é o defeito). Cole a linha crua. Se passar, o teste não reproduz o defeito: **PARE e reporte**.

## Edição 2 — `src/template/StyleRegistry.ts` · correções

- **2a — ciclo em `setStyle`:** troque a detecção de ciclo por uma caminhada que não depende de a cadeia do novo pai estar inteira: a partir de `parent`, siga `basedOn` com um conjunto de visitados, parando em `null`, em nome inexistente ou em nome já visitado; se em algum passo o nome for `name`, lance o erro de ciclo de hoje. Mantenha o resto da função como está. Depois: `npm test` com o S14 verde.
- **2b — acento nas mensagens:** toda mensagem de `StyleRegistryError` em PT-BR com acento — `nao` → `não`, `heranca` → `herança`, e qualquer outra palavra do mesmo tipo nas mensagens. Comentários e identificadores não mudam. Conferência: `grep -c "nao \|heranca" src/template/StyleRegistry.ts` = 0 (hoje = 9, medido pelo chat).

## Edição 3 — `src/canvas/PageGeometry.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato público EXATO (JSDoc PT-BR em cada export):

```ts
import type { DocumentSettings, DocumentUnit } from '../template/TemplateSchema';

/** Pixels CSS por polegada — o padrão do CSS (1in = 96px). Zoom 1 = tamanho físico na tela. */
export const CSS_PX_PER_INCH = 96;
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;

/** Caixa da página em px CSS com zoom 1. `width`/`height` incluem a sangria dos dois lados. */
export interface PageBox {
  trimWidth: number;
  trimHeight: number;
  bleed: number;
  width: number;
  height: number;
}

export function toPx(value: number, unit: DocumentUnit): number;
export function pageBox(document: DocumentSettings): PageBox;
export function fitZoom(viewportWidth: number, viewportHeight: number, box: PageBox, margin?: number): number;
export function centeredOffset(viewportWidth: number, viewportHeight: number, box: PageBox, zoom: number): { x: number; y: number };
```

- `toPx`: `mm` → `value * 96 / 25.4`; `cm` → `value * 96 / 2.54`; `px` → `value`.
- `pageBox`: `trimWidth = toPx(width)`, `trimHeight = toPx(height)`, `bleed = toPx(bleed)`, `width = trimWidth + 2*bleed`, `height = trimHeight + 2*bleed`. **`width`/`height` do documento mandam; `orientation` NÃO troca nada aqui** (é metadado — consistência entre os dois é ideia adiada, Edição 14).
- `fitZoom`: `margin` padrão `32`. Disponível = `viewport - 2*margin` em cada eixo; se algum ≤ 0 → `MIN_ZOOM`; senão `min(dispW / box.width, dispH / box.height)`, limitado a `[MIN_ZOOM, MAX_ZOOM]`.
- `centeredOffset`: `{ x: (viewportWidth - box.width*zoom) / 2, y: (viewportHeight - box.height*zoom) / 2 }`.

## Edição 4 — `src/canvas/PageGeometry.test.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Use `toBeCloseTo` para ponto flutuante. Casos obrigatórios:

| G | Entrada | Esperado |
|---|---|---|
| G1 | `toPx(25.4, 'mm')` | `96` |
| G2 | `toPx(2.54, 'cm')` | `96` |
| G3 | `toPx(10, 'px')` | `10` |
| G4 | `pageBox(catalogoSimplesExample.document)` (210×297 mm, sangria 3) | `trimWidth ≈ 793.7008`, `trimHeight ≈ 1122.5197`, `bleed ≈ 11.3386`, `width = trimWidth + 2*bleed`, `height = trimHeight + 2*bleed` |
| G5 | mesmo documento com `bleed: 0` | `width === trimWidth` e `height === trimHeight` |
| G6 | mesmo documento com `orientation: 'landscape'` | `pageBox` igual ao do G4 (`toEqual`) |
| G7 | `fitZoom(1600, 900, box do G4)` | `≈ (900 - 64) / box.height` (limitado pela altura) |
| G8 | `fitZoom(40, 40, box do G4)` e `fitZoom(10, 10, …)` | `MIN_ZOOM` nos dois |
| G9 | `fitZoom(100000, 100000, box do G4)` | `MAX_ZOOM` |
| G10 | `centeredOffset(1000, 800, { …, width: 200, height: 100 }, 2)` | `{ x: 300, y: 300 }` |

## Edição 5 — `src/canvas/CanvasEngine.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato público EXATO:

```ts
import type { DocumentSettings } from '../template/TemplateSchema';

export interface CanvasEngineOptions {
  /** Margem em px CSS ao redor da página no enquadramento. Padrão: 32. */
  fitMargin?: number;
}

export class CanvasEngine {
  constructor(element: HTMLCanvasElement, options?: CanvasEngineOptions);
  /** Desenha a página destas configurações (substitui a anterior) e reenquadra. */
  showPage(document: DocumentSettings): void;
  /** Ajusta o tamanho do canvas ao contêiner e reenquadra a página. */
  resize(width: number, height: number): void;
  getZoom(): number;
  get disposed(): boolean;
  /** Libera o Fabric. Idempotente: chamadas repetidas devolvem a mesma promessa. */
  dispose(): Promise<void>;
}
```

- **Construtor:** `new Canvas(element, { selection: false, backgroundColor: '#E5E5E5', renderOnAddRemove: false, enableRetinaScaling: true })`.
- **`showPage`:** remove só os objetos da página anterior (os que ele mesmo criou); cria com `PageGeometry.pageBox`:
  - área de corte: `Rect` com `left: bleed`, `top: bleed`, `width: trimWidth`, `height: trimHeight`, `fill: '#FFFFFF'`, `strokeWidth: 0`;
  - guia de sangria, **só se `bleed > 0`**: `Rect` com `left: 0`, `top: 0`, `width: box.width`, `height: box.height`, `fill: 'transparent'`, `stroke: '#D93025'`, `strokeWidth: 1`, `strokeDashArray: [4, 4]`, `strokeUniform: true`;
  - nos dois: `originX: 'left'`, `originY: 'top'` **explícitos** (o padrão de origem mudou entre versões do Fabric), `selectable: false`, `evented: false`.
  Depois reenquadra e `requestRenderAll()`.
- **Reenquadrar** (privado): `z = fitZoom(largura, altura do canvas, box, fitMargin)`; `{x, y} = centeredOffset(...)`; `setViewportTransform([z, 0, 0, z, x, y])`. Sem página mostrada, `resize` só ajusta o tamanho.
- **`resize`:** `setDimensions({ width, height })`, reenquadra, `requestRenderAll()`.
- **Depois do `dispose`:** `showPage`, `resize` e `getZoom` lançam `Error('CanvasEngine já foi liberado.')`. `disposed` vira `true` **na hora** da chamada; a promessa resolve quando o `dispose()` do Fabric resolver. **Nunca** use `destroy()`.

## Edição 6 — `src/ui/CanvasView.tsx` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato:

```tsx
import type { JSX } from 'react';
import type { DocumentSettings } from '../template/TemplateSchema';

export interface CanvasViewProps {
  /** Configurações da página a mostrar. */
  settings: DocumentSettings;
}

export function CanvasView({ settings }: CanvasViewProps): JSX.Element;
```

- Renderiza um `<div>` que ocupa 100% × 100% do pai, `overflow: hidden`.
- **Efeito de montagem (`[]`):** cria um `<canvas>` NOVO com `document.createElement('canvas')` e o anexa ao `<div>` (o Fabric 6 lança se reaproveitar elemento com `data-fabric`, e o StrictMode monta duas vezes — ver CONTEXT, armadilhas); cria o `CanvasEngine`; um `ResizeObserver` no `<div>` chama `engine.resize(largura, altura)` do `contentRect`. **Limpeza:** desconecta o observer, descarta a referência do engine e chama `engine.dispose()` **sem `await`**, com `.catch` que registra no console; quando a promessa terminar, remove do `<div>` o que ESTA montagem inseriu (o Fabric embrulha o `<canvas>` num `div.canvas-container`).
- **Efeito de `[settings]`:** `engine?.showPage(settings)`.
- Não use `useRef` num `<canvas>` do JSX.
- **`JSX` vem de `import type { JSX } from 'react'`:** com React 19 não há namespace `JSX` global — sem o import, `tsc -b` dá `TS2503: Cannot find namespace 'JSX'` (medido pelo chat no `tsc` 6.0.3 do projeto).

## Edição 7 — `src/App.tsx` · substituir o arquivo inteiro

Substitua TODO o conteúdo por:

```tsx
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Host de desenvolvimento: mostra a página do exemplo no canvas, ocupando a
 * janela. Some quando existir a UI do editor (Toolbar/PropertiesPanel/LayersList).
 */
export default function App() {
  return <CanvasView settings={catalogoSimplesExample.document} />;
}
```

## Edição 8 — `src/index.css` · substituir o arquivo inteiro

O `#root` do scaffold tem `width: 1126px` (medido pelo chat, `src/index.css`), o que impede o canvas de ocupar a janela. Substitua TODO o conteúdo por:

```css
/* index.css — reset mínimo: a aplicação ocupa a janela inteira; o resto é do canvas. */
html,
body,
#root {
  margin: 0;
  height: 100%;
}

body {
  font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
}
```

## Edição 9 — remover o scaffold que ficou órfão

Com a Edição 7, `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg` e `src/assets/vite.svg` não são importados por ninguém (Edição 0, passo 4). Rode:

```
git rm src/App.css src/assets/hero.png src/assets/react.svg src/assets/vite.svg
```

(Pede aprovação: `git rm` não está no `allow`.) `public/` não muda.

---

## Edição 10a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-11, wo0003):** `StyleRegistry.ts` feito (funções puras, DEC-015) —
sai do backlog, `CanvasEngine.ts` vira o próximo; F1 em 4 de 14; a linha «Suíte» deixa de apontar para
o relatório de uma WO específica. A nota anterior (wo0002) saiu — o que ela registrava está em DEC-014.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-12, wo0004):** `CanvasEngine.ts` feito (página vazia com sangria e
zoom para caber, DEC-016) — sai do backlog, `FrameText.ts` vira o próximo; F1 em 5 de 14; o app deixa de
ser o scaffold do Vite. A nota anterior (wo0003) saiu — o que ela registrava está em DEC-015.
```

## Edição 10b — `meta/STATUS.md` · versão

**Âncora** (linha inteira):

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 4 de 14 itens prontos)
```

**Substituir por:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 5 de 14 itens prontos)
```

## Edição 10c — `meta/STATUS.md` · Funcionando

**Âncora** (linha inteira):

```
- **Salvar/abrir `.editx`** — `TemplateSerializer.ts` (`serializeTemplate`, `parseTemplate`) + `TemplateValidator.ts` (`validateTemplate`, estrito, erros com caminho `$.…`); suíte Vitest verde (`npm test`) — wo0001, DEC-013
```

**Substituir por:**

```
- **Salvar/abrir `.editx`** — `TemplateSerializer.ts` (`serializeTemplate`, `parseTemplate`) + `TemplateValidator.ts` (`validateTemplate`, estrito, erros com caminho `$.…`); suíte Vitest verde (`npm test`) — wo0001, DEC-013
- **Canvas mostra a página** — `npm run dev` abre a página do exemplo (área de corte branca + guia de sangria tracejada) centralizada e com zoom para caber, reenquadrando ao redimensionar a janela; `CanvasEngine.ts` (Fabric) + `PageGeometry.ts` (puro, testado) + `ui/CanvasView.tsx` — wo0004, DEC-016. Ainda sem frames
```

## Edição 10d — `meta/STATUS.md` · Em Progresso

**Âncora** (linha inteira):

```
*Nada em progresso — próximo item do backlog é `CanvasEngine.ts`.*
```

**Substituir por:**

```
*Nada em progresso — próximo item do backlog é `FrameText.ts`.*
```

## Edição 10e — `meta/STATUS.md` · Backlog

**Âncora:**

```
- [ ] `CanvasEngine.ts` — wrapper Fabric.js com eventos e ciclo de vida ← **próximo**
- [ ] `FrameText.ts` — frame de texto com overflow básico (grow-vertical e fixed-clip primeiro)
```

**Substituir por:**

```
- [x] `CanvasEngine.ts` — wrapper Fabric.js: ciclo de vida, página e zoom (wo0004, DEC-016; eventos de objeto entram com `SelectionManager.ts`)
- [ ] `FrameText.ts` — frame de texto com overflow básico (grow-vertical e fixed-clip primeiro) ← **próximo**
```

## Edição 10f — `meta/STATUS.md` · Última conversa

**Âncora:**

```
**2026-11-11** — wo0001 (serializer + validador + Vitest), wo0002 (herança de estilos no formato,
DEC-014) e wo0003 (`StyleRegistry.ts` como funções puras, DEC-015; `satisfies` no validador).
Relatórios em `../notas-arquivadas/` e na pasta-pai; detalhe em `logs/2026-11-11.md`.
**Onde parou:** próximo item é `CanvasEngine.ts`.
```

**Substituir por:**

```
**2026-11-12** — wo0004: `CanvasEngine.ts` mostra a página do exemplo no `npm run dev` (DEC-016),
geometria pura testada em `PageGeometry.ts`, scaffold do Vite removido; `StyleRegistry.ts` com
mensagens acentuadas e ciclo detectado mesmo com cadeia quebrada. Dias anteriores em
`logs/2026-11-11.md`; detalhe de hoje em `logs/2026-11-12.md`.
**Onde parou:** próximo item é `FrameText.ts`.
```

## Edição 10g — `meta/STATUS.md` · rodapé

**Âncora** (linha inteira):

```
*Próximo passo: `CanvasEngine.ts` (wrapper Fabric.js com eventos e ciclo de vida) — WO a escrever pelo chat.*
```

**Substituir por:**

```
*Próximo passo: `FrameText.ts` (frame de texto no canvas, overflow grow-vertical e fixed-clip) — WO a escrever pelo chat.*
```

## Edição 11 — `meta/ROADMAP.md` · F1

**Âncora** (linha inteira):

```
- [ ] `CanvasEngine.ts` — wrapper Fabric.js
```

**Substituir por:**

```
- [x] `CanvasEngine.ts` — wrapper Fabric.js (ciclo de vida, página, zoom — DEC-016)
```

## Edição 12a — `meta/CHANGELOG.md` · Adicionado

**Âncora** (linha inteira):

```
- `StyleRegistry.ts` — estilo de texto final resolvido pela cadeia de `basedOn` (`resolveStyle`, com cache por mapa), estilos derivados (`dependentsOf`) e edição do mapa sem quebrar a herança (`setStyle`/`removeStyle`); funções puras sobre o mapa do documento. Ver DEC-015
```

**Substituir por:**

```
- `StyleRegistry.ts` — estilo de texto final resolvido pela cadeia de `basedOn` (`resolveStyle`, com cache por mapa), estilos derivados (`dependentsOf`) e edição do mapa sem quebrar a herança (`setStyle`/`removeStyle`); funções puras sobre o mapa do documento. Ver DEC-015
- `CanvasEngine.ts` + `PageGeometry.ts` + `ui/CanvasView.tsx` — a página do documento aparece no canvas (área de corte, guia de sangria, zoom para caber, reenquadra ao redimensionar); o app deixa de ser o scaffold do Vite. Ver DEC-016
```

## Edição 12b — `meta/CHANGELOG.md` · remover do Planejado

**Remover a linha inteira:**

```
- `CanvasEngine.ts` — wrapper Fabric.js básico
```

## Edição 13 — `meta/DECISIONS.md` · DEC-016

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-016 — CanvasEngine em duas camadas: geometria pura + adaptador fino do Fabric

**Data:** 2026-11-12
**Status:** aceita
**Autor:** Claude (chat), ao escrever a wo0004 — o dono pode vetar antes da aplicação

### Contexto
O Fabric precisa de DOM e de `<canvas>`; o Vitest do projeto roda em Node, sem DOM (DEC-013), e o
`canvas`/`jsdom` do Fabric são dependências opcionais que o projeto decidiu não usar (DEC-011). O Fabric
6.9.1 tem `dispose()` assíncrono e recusa reinicializar um elemento com `data-fabric` — o que colide com
o StrictMode do React (medido no código instalado; armadilhas no CONTEXT).

### Decisão
- Toda conta (unidade → px CSS a 96 px/pol, caixa com sangria, zoom para caber, centralização) mora em
  `canvas/PageGeometry.ts`, puro e testado em Node. O `CanvasEngine.ts` só traduz isso para o Fabric.
- O adaptador é conferido pelo **dono, na tela** (roteiro da wo0004), não por teste automático.
- `width`/`height` do documento mandam; `orientation` é metadado e não gira a página.
- `ui/CanvasView.tsx` cria um `<canvas>` novo a cada montagem e libera com `dispose()` sem `await`.

### Alternativas consideradas
- **Testar o adaptador com jsdom + `canvas` (node-canvas)** — reativa as dependências opcionais que a
  DEC-011 deixou de fora (e a vulnerabilidade da cadeia `canvas`→`tar`), e mede o Fabric, não a tela.
- **Vitest em modo navegador** — ferramenta a mais para conferir uma página vazia; reavaliar quando os
  frames tiverem lógica de desenho que valha teste visual.
- **`<canvas>` do JSX com `useRef`** — quebra no StrictMode (elemento reaproveitado com `data-fabric`).

### Consequências
- **Positivas:** a parte com lógica tem teste; o adaptador é pequeno o bastante para ler; dev e produção
  montam igual.
- **Negativas:** regressão visual do canvas só aparece no roteiro do dono.
- **Riscos:** lógica de desenho escorregar para dentro do `CanvasEngine.ts` sem teste — sinal: operador
  aritmético (`+ - * /`) aplicado a `bleed`, `zoom` ou px no `CanvasEngine.ts`; é checagem de LEITURA (o
  adaptador usa esses nomes legitimamente ao repassar valores do `PageGeometry.ts`, então `grep` não separa).

---

## Template para novo ADR (copie e preencha)
```

## Edição 14 — `meta/IDEAS.md` · Adiadas

**Âncora** (linha inteira — última do item zod/valibot):

```
  `TemplateValidator.ts` divergir do tipo em produção pela segunda vez, ou passar de ~600 linhas.
```

**Substituir por:**

```
  `TemplateValidator.ts` divergir do tipo em produção pela segunda vez, ou passar de ~600 linhas.
- **`orientation` coerente com `width`/`height`** — hoje `width`/`height` mandam e `orientation` é só
  metadado (DEC-016); nada impede um `.editx` com `orientation: 'landscape'` e página em pé. Adiada porque
  ninguém troca a orientação ainda — **volta quando** a UI permitir trocar a orientação (aí trocar deve
  girar `width`/`height`, e o validador pode cobrar a coerência).
```

## Edição 15 — `logs/2026-11-12.md` · seção do Code

**Âncora** (última linha do arquivo):

```
wo0004 escrita e gravada; aguardando `/apply-wo` no Claude Code e o roteiro de tela do dono.
```

**Substituir por:** a mesma linha, depois uma linha em branco, depois uma seção `## Code (execução) — wo0004` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`. Não reescreva a seção do chat.

---

## Fora de escopo

- Desenhar frames (texto, imagem, forma) — `FrameText.ts` e seguintes.
- Eventos de objeto, seleção, arrastar — `SelectionManager.ts`.
- Zoom com roda do mouse, pan, régua, várias páginas, troca de página — vêm com a UI.
- `documentStore.ts`: o `App.tsx` passa o exemplo direto até o store existir.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava (CEREBRO, «Técnicas específicas»). Use `node`.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** sem *parameter properties* (declare campos e atribua no construtor); tipos via `import type`.
- **`tsc -b` checa `src/` inteiro, inclusive `.tsx`** — o `CanvasView.tsx` e o `App.tsx` precisam compilar com `jsx: react-jsx` (já no `tsconfig.app.json`).
- **O Vitest roda em Node:** NÃO importe `CanvasEngine.ts` (nem `fabric`) de nenhum arquivo de teste. Só `PageGeometry.ts` é testado.
- **`npm run dev` deixa processo rodando:** se você subir o servidor para olhar algo, **feche antes de commitar** (CEREBRO: quem abre, fecha) e diga no relatório. A conferência de tela é do dono (roteiro no chat), não sua.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short` mostra **exatamente**, e nada além:
      `?? logs/2026-11-12.md` (criado pelo chat neste turno), `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/IDEAS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M meta/analises/261111-ANALISE-heranca-de-estilos.md`, `M src/App.tsx`, `M src/index.css`, `M src/template/StyleRegistry.test.ts`, `M src/template/StyleRegistry.ts`, `D src/App.css`, `D src/assets/hero.png`, `D src/assets/react.svg`, `D src/assets/vite.svg`, `?? meta/workorders/261112-wo0004-canvas-engine.md`, `?? src/canvas/`, `?? src/ui/`. Com `git status --short -uall`, `src/canvas/` = `CanvasEngine.ts`, `PageGeometry.ts`, `PageGeometry.test.ts` e `src/ui/` = `CanvasView.tsx`. Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros (avisos de `react-refresh` só se forem em arquivo novo e você os explicar). `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 60 testes** (49 + S14 + G1–G10). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] S14 falhou ANTES da Edição 2 e passa depois (as duas linhas cruas).
- [ ] **Prova de vida (geometria):** troque temporariamente `2 * bleed` por `bleed` em `pageBox`, rode `npm test` e confirme que **G4 falha** — linha crua —, restaure, verde.
      - **Quem roda:** quem aplica. **Chega no ramo?** `PageGeometry.test.ts` → `pageBox`. **NÃO responde:** se o Fabric desenha na posição certa — isso é o roteiro do dono.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "nao \|heranca" src/template/StyleRegistry.ts` = 0
      - `grep -rn "from 'fabric'" src | grep -c "test"` = 0
      - `grep -c "\.destroy()" src/canvas/CanvasEngine.ts` = 0
      - `grep -c "createElement('canvas')" src/ui/CanvasView.tsx` = 1
      - `grep -c "^## DEC-016" meta/DECISIONS.md` = 1
      - `grep -c "^- \[x\] \`CanvasEngine.ts\`" meta/STATUS.md meta/ROADMAP.md` = 1 e 1
      - `grep -c "^- \`CanvasEngine.ts\` — wrapper Fabric.js básico$" meta/CHANGELOG.md` = 0
      - `grep -c "^## Code (execução) — wo0004" logs/2026-11-12.md` = 1
      *(escritos pelo chat e não testados no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo (servidor de dev fechado, se subiu).

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0004.txt` (`date +%y%m%d-%H%M`, na hora). Inclua as saídas cruas acima, `wc -l` dos arquivos novos, e como o `CanvasView.tsx` remove o que inseriu na limpeza.

## Commit — blocos separados, mensagem SEM acento

(As quatro remoções já estão no índice pelo `git rm` da Edição 9.)

```
git add logs/2026-11-12.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md meta/analises/261111-ANALISE-heranca-de-estilos.md meta/workorders/261112-wo0004-canvas-engine.md src/App.tsx src/index.css src/canvas src/ui src/template/StyleRegistry.ts src/template/StyleRegistry.test.ts
```

```
git commit -m "feat(canvas): cria CanvasEngine que mostra a pagina com sangria e zoom" -m "Geometria pura em PageGeometry.ts com testes, adaptador fino do Fabric 6 e CanvasView com canvas novo a cada montagem (StrictMode). App deixa de ser o scaffold do Vite. StyleRegistry com mensagens acentuadas e ciclo detectado com cadeia quebrada. DEC-016 (wo0004)."
```

```
git push
```
