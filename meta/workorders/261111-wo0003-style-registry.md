# WO 0003 — StyleRegistry.ts: estilo final resolvido por funções puras (DEC-015)

> **Tipo:** mista — CÓDIGO (`StyleRegistry.ts` + testes, `satisfies` no validador, JSDoc de `TextStyle`) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` médio-alto — contrato fechado na WO, julgamento só no corpo das funções.
> **Pré-requisito:** escrita sobre `4aa9923` (`feat(template): estilo derivado guarda so as diferencas do pai`), árvore limpa exceto os arquivos que o chat gravou (lista abaixo). Suíte em 36 testes verdes (relatório da wo0002, `../261111-1024-code-editx-apply-wo0002.txt` → depois em `../notas-arquivadas/`).
> **Base:** backlog do STATUS («`StyleRegistry.ts` ← próximo»); DEC-014 (raiz × derivado); DEC-004 (estado global em Zustand + Immer). Decisão de forma: DEC-015 (entra pela Edição 8).
> **Depende de:** wo0002 (aplicada: `4aa9923`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `133d4ef128269467b944b45088070e7342c8ca9d  meta/CONTEXT.md`
> - `e85f3b72060e32763cff11382d3902534ea67ed1  meta/GLOSSARY.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte** — nunca chute um lugar próximo.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar») = já aplicada: **PULE** e diga no relatório. Na REMOÇÃO (7b), «já aplicada» = a linha não existe mais.
> **Âncoras lidas em** (lidas pelo chat em 2026-11-11, no disco, neste turno):
> - Ed. 3 — `src/template/TemplateValidator.ts`: a linha `import type { TextAlign, TextCase, TextDecoration, VerticalAlign } from '../types/frame.types';` e o bloco de `/** As 10 propriedades visuais (\`TextStyleProps\`)…` até o `};` que fecha `const textStyleProps`
> - Ed. 4 — `src/types/frame.types.ts`: as 3 linhas ` * Alterar um estilo propaga automaticamente…` / ` * — implementado por observer pattern em \`StyleRegistry.ts\` (ver DEC-006,` / ` * seção de estilos globais em CONTEXT.md § Modos de Overflow).`
> - Ed. 5a–5h — `meta/STATUS.md`: a nota `**Mudanças nesta revisão (2026-11-11, wo0002):**…`; a linha `**v0.0.0** — …3 de 14 itens prontos)`; a linha `- **Sistema de estilos de texto especificado e validado** — …`; `*Nada em progresso — próximo item do backlog é \`StyleRegistry.ts\`.*`; as linhas de backlog do `StyleRegistry.ts` e do `CanvasEngine.ts`; a linha `- **Suíte:** Vitest …`; o parágrafo `**2026-11-11** — wo0001 … e wo0002 …` até `**Onde parou:** …(wo0003).`; o rodapé `*Próximo passo: \`StyleRegistry.ts\` …*`
> - Ed. 6 — `meta/ROADMAP.md`: `- [ ] \`StyleRegistry.ts\` — estilos globais com herança e observer`
> - Ed. 7a/7b — `meta/CHANGELOG.md`: a linha que começa `- \`TemplateSerializer.ts\` + \`TemplateValidator.ts\` — salvar e abrir` e a linha `- \`StyleRegistry.ts\` — estilos de texto globais com herança`
> - Ed. 8 — `meta/DECISIONS.md`: `## Template para novo ADR (copie e preencha)` (única)
> - Ed. 9 — `meta/IDEAS.md`: as 2 linhas `consistente em lote. **Onde vive:** \`StyleRegistry.ts\`, observer pattern, herança via` / `` `basedOn`. ``
> - Ed. 10 — `logs/2026-11-11.md`: a última linha `wo0002 aplicada; próximo item é \`StyleRegistry.ts\` (wo0003).`

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md` e a seção do Code no log (Edições 5–10): esta WO É o registro, aplique os textos exatos. `meta/CONTEXT.md` e `meta/GLOSSARY.md` são do chat e já estão gravados — **só versione**.

---

## 1. Por que

Com a DEC-014, um estilo derivado guarda só as diferenças — e ninguém consegue ler o estilo final de um frame. O `StyleRegistry.ts` resolve isso. Os docs de maio o descreviam como «registro com observer pattern»; esta WO o faz **funções puras sobre o mapa `textStyles` do documento**, porque a DEC-004 põe todo o estado global no Zustand + Immer: um registro com estado próprio duplicaria os estilos do documento e deixaria a edição de estilo **fora do undo/redo** (patches do Immer). A propagação «altero o pai, os filhos mudam» continua: o estilo final é sempre resolvido do mapa ATUAL. Junto, duas correções pequenas: o `satisfies` que faz o build cobrar regra de validação para toda propriedade nova de `TextStyleProps` (o risco da DEC-013), e o JSDoc de `TextStyle`, que cita a DEC-006 para um observer que a DEC-006 não menciona.

## Inventário — de onde saiu a lista de edições

- **Onde o «observer» aparece** (`grep -rn -i "observer" src meta`, fora de `meta/workorders/`, `meta/analises/` e `logs/`, que são registro — chat, neste turno): **6 lugares que esta WO troca** — `src/types/frame.types.ts` (Ed. 4), `meta/STATUS.md` ×3 (Ed. 5c, 5e, 5h), `meta/ROADMAP.md` (Ed. 6), `meta/IDEAS.md` (Ed. 9) — e **2 que FICAM**: `meta/CHANGELOG.md`, entrada `[0.0.0]` («Sistema de estilos de texto globais especificado (observer pattern, herança em cadeia)» — relato histórico de 2026-05-24, não se reescreve) e `meta/CONTEXT.md`, nota de revisão do chat (relata a troca). Depois de aplicar, o mesmo `grep` tem de achar **4 linhas**: esses 2 e as 2 linhas da própria DEC-015 (Ed. 8) que citam o observer ao explicar por que ele saiu — medido pelo chat simulando esta WO numa cópia. Se, ANTES de editar, ele achar um 9º, **PARE e reporte**.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  36 passed (36)`.

## Edição 1 — `src/template/StyleRegistry.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato público EXATO (o corpo é seu; JSDoc completo em PT-BR em cada export, como nos módulos vizinhos):

```ts
import type { TextStyleMap } from './TemplateSchema';
import type { TextStyle, TextStyleProps } from '../types/frame.types';

/** Lançado quando um estilo não existe, ou quando a operação quebraria a herança. */
export class StyleRegistryError extends Error {
  /** Nome do estilo que causou o erro. */
  readonly styleName: string;
  // construtor recebe (styleName, message); name = 'StyleRegistryError'
}

export function resolveStyle(styles: TextStyleMap, name: string): Readonly<TextStyleProps>;
export function dependentsOf(styles: TextStyleMap, name: string): string[];
export function setStyle(styles: TextStyleMap, name: string, style: TextStyle): TextStyleMap;
export function removeStyle(styles: TextStyleMap, name: string): TextStyleMap;
```

**Nenhum estado de módulo além do cache abaixo. Nenhuma função muta o mapa recebido.**

- **`resolveStyle`** — o estilo final de `name`: sobe a cadeia de `basedOn` até a raiz e aplica as propriedades de cima para baixo (raiz primeiro; o mais específico vence). Propriedade `undefined` num derivado **não** sobrescreve. O resultado tem **exatamente** as 10 chaves de `TextStyleProps` (sem `basedOn`) e é `Object.freeze`. Lança `StyleRegistryError` se `name` não existe, se um pai da cadeia não existe, se há ciclo (nunca laço infinito), ou se a raiz não tem as 10 propriedades. **Cache:** `WeakMap<TextStyleMap, Map<string, Readonly<TextStyleProps>>>` — mesmo mapa + mesmo nome = **mesma referência**. Isso pressupõe que o mapa não é mutado no lugar (Immer, DEC-004): diga isso no JSDoc.
- **`dependentsOf`** — todos os estilos cuja cadeia passa por `name` (filhos, netos…), sem incluir `name`, em ordem `.sort()`. Lança se `name` não existe.
- **`setStyle`** — devolve um mapa NOVO com `name` = `style` (inclui ou troca). Lança, e o mapa recebido fica intacto, se: `style.basedOn` não é `null` e não existe no mapa; `style.basedOn === name`; ou o novo pai tem `name` na própria cadeia (criaria ciclo). O objeto `style` entra como recebido, sem clonar.
- **`removeStyle`** — devolve um mapa NOVO sem `name`. Lança se `name` não existe, ou se algum estilo tem `basedOn === name` — a mensagem lista os filhos, em ordem. (Frames que usam o estilo não são problema deste módulo: o validador os acusa ao salvar.)

## Edição 2 — `src/template/StyleRegistry.test.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. `describe`/`it`/`expect` de `vitest`; fixture `catalogoSimplesExample.textStyles`, **sempre** com `structuredClone` antes de qualquer `setStyle` que vá ser comparado com o original. Casos obrigatórios (um `it` cada):

| S | Entrada | Esperado |
|---|---|---|
| S1 | `resolveStyle(styles, 'titulo-capa')` (raiz) | `toEqual` o estilo do fixture sem a chave `basedOn` |
| S2 | `resolveStyle(styles, 'preco-destaque')` | `toEqual` as 10 props de `titulo-produto` com `fontWeight: 800`, `fontSize: 22`, `color: '#E63946'`; sem `basedOn` |
| S3 | `setStyle` de `'preco-promo' = { basedOn: 'preco-destaque', color: '#000000' }`, depois `resolveStyle` dele | `fontSize: 22` (do pai), `color: '#000000'` (dele), `fontFamily: 'Montserrat'` (da raiz) |
| S4 | `setStyle` de `'titulo-produto'` com `fontFamily: 'Inter'` (resto igual) | `resolveStyle(novo, 'preco-destaque').fontFamily === 'Inter'`; `resolveStyle(antigo, 'preco-destaque').fontFamily === 'Montserrat'` |
| S5 | `resolveStyle` duas vezes no mesmo mapa e nome | mesma referência (`toBe`) e `Object.isFrozen` = `true`; num mapa devolvido por `setStyle`, referência diferente |
| S6 | `dependentsOf` | `'titulo-produto'` → `['preco-destaque']`; depois do S3 → `['preco-destaque', 'preco-promo']`; `'titulo-capa'` → `[]` |
| S7 | `setStyle` com `basedOn: 'inexistente'` | lança `StyleRegistryError`; mapa original `toEqual` o clone anterior |
| S8 | `setStyle('x', { basedOn: 'x' })` | lança `StyleRegistryError` |
| S9 | `setStyle('titulo-produto', { ...titulo-produto, basedOn: 'preco-destaque' })` | lança `StyleRegistryError` (ciclo); mapa original intacto |
| S10 | `removeStyle('preco-destaque')` e `removeStyle('titulo-produto')` | o 1º devolve mapa sem a chave, original ainda com ela; o 2º lança, e a `message` contém `preco-destaque` |
| S11 | `resolveStyle(styles, 'inexistente')` | lança `StyleRegistryError` com `styleName === 'inexistente'` |
| S12 | mapa montado à mão com ciclo `a → b → a` (sem `setStyle`) | `resolveStyle(…, 'a')` lança `StyleRegistryError` — e o teste termina (sem laço infinito) |
| S13 | todo nome de `catalogoSimplesExample.textStyles` | `resolveStyle` não lança para nenhum, e `validateTemplate(catalogoSimplesExample).ok` é `true` |

## Edição 3 — `src/template/TemplateValidator.ts` · o build cobra regra para toda propriedade

**3a — Âncora** (linha inteira):

```
import type { TextAlign, TextCase, TextDecoration, VerticalAlign } from '../types/frame.types';
```

**Substituir por:**

```
import type {
  TextAlign,
  TextCase,
  TextDecoration,
  TextStyleProps,
  VerticalAlign,
} from '../types/frame.types';
```

**3b — Âncora:**

```
/** As 10 propriedades visuais (`TextStyleProps`) e a regra de valor de cada uma — fonte única para raiz e derivado. */
const textStyleProps: Record<string, Check> = {
```

**Substituir por:**

```
/**
 * As 10 propriedades visuais (`TextStyleProps`) e a regra de valor de cada uma — fonte única para raiz e derivado.
 * O `satisfies` faz o build FALHAR se `TextStyleProps` ganhar (ou perder) uma propriedade sem a regra aqui (DEC-013).
 */
const textStyleProps = {
```

**3c — Âncora** (linha inteira, a última do mesmo objeto):

```
  decoration: oneOf<TextDecoration>(['none', 'underline', 'strikethrough']),
};
```

**Substituir por:**

```
  decoration: oneOf<TextDecoration>(['none', 'underline', 'strikethrough']),
} satisfies Record<keyof TextStyleProps, Check>;
```

## Edição 4 — `src/types/frame.types.ts` · JSDoc de `TextStyle`

**Âncora:**

```
 * Alterar um estilo propaga automaticamente para todos os frames vinculados
 * — implementado por observer pattern em `StyleRegistry.ts` (ver DEC-006,
 * seção de estilos globais em CONTEXT.md § Modos de Overflow).
```

**Substituir por:**

```
 * Alterar um estilo propaga automaticamente para os estilos derivados dele e
 * para os frames que os usam: o estilo final é sempre resolvido do mapa ATUAL
 * por `resolveStyle` (`StyleRegistry.ts`), sem cópia a manter em dia — DEC-015.
```

---

## Edição 5a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-11, wo0002):** herança de estilos decidida e aplicada no formato
(estilo derivado guarda só as diferenças — DEC-014); «Sistema de estilos» e «Estratégia» de testes
atualizados; «Última conversa» passa à wo0002. Nenhum item de backlog fechou: o `StyleRegistry.ts`
continua o próximo (wo0003). A nota anterior (wo0001) saiu — o que ela registrava está em DEC-013.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-11, wo0003):** `StyleRegistry.ts` feito (funções puras, DEC-015) —
sai do backlog, `CanvasEngine.ts` vira o próximo; F1 em 4 de 14; a linha «Suíte» deixa de apontar para
o relatório de uma WO específica. A nota anterior (wo0002) saiu — o que ela registrava está em DEC-014.
```

## Edição 5b — `meta/STATUS.md` · versão

**Âncora** (linha inteira):

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 3 de 14 itens prontos)
```

**Substituir por:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 4 de 14 itens prontos)
```

## Edição 5c — `meta/STATUS.md` · Sistema de estilos

**Âncora** (linha inteira):

```
- **Sistema de estilos de texto especificado e validado** — `TextStyle` é raiz (completo, `basedOn: null`) ou derivado (só as diferenças, `basedOn: "<pai>"`), DEC-014; o validador cobra as duas formas. `StyleRegistry.ts` (resolve a cadeia em runtime + observer) ainda não implementado — wo0003
```

**Substituir por:**

```
- **Herança de estilos de texto funcionando** — `TextStyle` é raiz (completo, `basedOn: null`) ou derivado (só as diferenças), DEC-014; o validador cobra as duas formas; `StyleRegistry.ts` resolve o estilo final (`resolveStyle`) e edita o mapa sem quebrar a herança (`setStyle`/`removeStyle`), funções puras — DEC-015. A propagação NA TELA vem com o `documentStore`
```

## Edição 5d — `meta/STATUS.md` · Em Progresso

**Âncora** (linha inteira):

```
*Nada em progresso — próximo item do backlog é `StyleRegistry.ts`.*
```

**Substituir por:**

```
*Nada em progresso — próximo item do backlog é `CanvasEngine.ts`.*
```

## Edição 5e — `meta/STATUS.md` · Backlog

**Âncora:**

```
- [ ] `StyleRegistry.ts` — estilos globais com herança e observer ← **próximo**
- [ ] `CanvasEngine.ts` — wrapper Fabric.js com eventos e ciclo de vida
```

**Substituir por:**

```
- [x] `StyleRegistry.ts` — estilos globais com herança (funções puras sobre o mapa do documento — wo0003, DEC-015)
- [ ] `CanvasEngine.ts` — wrapper Fabric.js com eventos e ciclo de vida ← **próximo**
```

## Edição 5f — `meta/STATUS.md` · Suíte

**Âncora** (linha inteira):

```
- **Suíte:** Vitest (`npm test`, `vitest run`) desde a wo0001 — cobre `TemplateSerializer.ts` e `TemplateValidator.ts`; contagem de testes no relatório da wo0001; cobertura em % não medida (sem `@vitest/coverage-*`)
```

**Substituir por:**

```
- **Suíte:** Vitest (`npm test`, `vitest run`) desde a wo0001 — cobre `TemplateSerializer.ts`, `TemplateValidator.ts` e `StyleRegistry.ts`; a contagem sai do `npm test` e do relatório da última WO (não se repete aqui); cobertura em % não medida (sem `@vitest/coverage-*`)
```

## Edição 5g — `meta/STATUS.md` · Última conversa

**Âncora:**

```
**2026-11-11** — wo0001 (serializer + validador + Vitest) e wo0002 (herança de estilos, DEC-014:
`TextStyle` raiz × derivado no tipo, no validador e no exemplo; motor do validador extraído para
`ValidationRules.ts`; scaffold formatado pelo Prettier). Relatórios em `../notas-arquivadas/` e
na pasta-pai; detalhe em `logs/2026-11-11.md`.
**Onde parou:** próximo item é `StyleRegistry.ts` (wo0003).
```

**Substituir por:**

```
**2026-11-11** — wo0001 (serializer + validador + Vitest), wo0002 (herança de estilos no formato,
DEC-014) e wo0003 (`StyleRegistry.ts` como funções puras, DEC-015; `satisfies` no validador).
Relatórios em `../notas-arquivadas/` e na pasta-pai; detalhe em `logs/2026-11-11.md`.
**Onde parou:** próximo item é `CanvasEngine.ts`.
```

## Edição 5h — `meta/STATUS.md` · rodapé

**Âncora** (linha inteira):

```
*Próximo passo: `StyleRegistry.ts` (resolução de `basedOn` em runtime + observer) — WO a escrever pelo chat.*
```

**Substituir por:**

```
*Próximo passo: `CanvasEngine.ts` (wrapper Fabric.js com eventos e ciclo de vida) — WO a escrever pelo chat.*
```

## Edição 6 — `meta/ROADMAP.md` · F1

**Âncora** (linha inteira):

```
- [ ] `StyleRegistry.ts` — estilos globais com herança e observer
```

**Substituir por:**

```
- [x] `StyleRegistry.ts` — estilos globais com herança (funções puras, DEC-015)
```

## Edição 7a — `meta/CHANGELOG.md` · Adicionado

**Âncora** (linha inteira):

```
- `TemplateSerializer.ts` + `TemplateValidator.ts` — salvar e abrir `.editx` com validação estrita (erros com caminho `$.…`, versão de schema explícita, nunca grava arquivo inválido); Vitest 5 configurado (`npm test`). Ver DEC-013
```

**Substituir por:**

```
- `TemplateSerializer.ts` + `TemplateValidator.ts` — salvar e abrir `.editx` com validação estrita (erros com caminho `$.…`, versão de schema explícita, nunca grava arquivo inválido); Vitest 5 configurado (`npm test`). Ver DEC-013
- `StyleRegistry.ts` — estilo de texto final resolvido pela cadeia de `basedOn` (`resolveStyle`, com cache por mapa), estilos derivados (`dependentsOf`) e edição do mapa sem quebrar a herança (`setStyle`/`removeStyle`); funções puras sobre o mapa do documento. Ver DEC-015
```

## Edição 7b — `meta/CHANGELOG.md` · remover do Planejado

**Remover a linha inteira:**

```
- `StyleRegistry.ts` — estilos de texto globais com herança
```

## Edição 8 — `meta/DECISIONS.md` · DEC-015

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-015 — `StyleRegistry.ts` é um conjunto de funções puras, não um registro com estado

**Data:** 2026-11-11
**Status:** aceita
**Autor:** Claude (chat), ao escrever a wo0003 — o dono pode vetar antes da aplicação

### Contexto
Os docs de maio (CONTEXT, IDEAS, GLOSSARY, JSDoc de `TextStyle`) descreviam o `StyleRegistry.ts` como
«registro com observer pattern», citando a DEC-006 — que não fala de estilos. A DEC-004 (aceita) põe
**todo** o estado global no Zustand + Immer, com undo/redo por patches. O requisito do dono é de
comportamento: alterar um estilo atualiza os frames vinculados (IDEAS, 2026-05).

### Decisão
- `StyleRegistry.ts` exporta funções puras sobre o mapa `textStyles` do documento: `resolveStyle`
  (estilo final, cache `WeakMap` por mapa), `dependentsOf`, `setStyle` e `removeStyle` (devolvem mapa
  novo e recusam o que quebraria a herança).
- O mapa vive no `documentStore` (quando existir). A propagação vem de o estilo final ser sempre
  resolvido do mapa ATUAL; o «observer» é a assinatura do próprio store.

### Alternativas consideradas
- **Classe com estado próprio + `subscribe`** — duplica os estilos do documento (duas fontes da mesma
  verdade) e tira a edição de estilo do histórico do Immer: o undo pararia de desfazer estilo.
- **Resolver sem cache** — correto, mas recalcula a cadeia a cada leitura do canvas; com Immer o cache
  por identidade do mapa é de graça.

### Consequências
- **Positivas:** uma fonte da verdade (o documento); undo/redo cobre estilo sem código extra; testável sem DOM.
- **Negativas:** o cache supõe que o mapa nunca é mutado no lugar — mutação direta serve estilo velho.
- **Riscos:** alguém mutar `textStyles` fora do Immer. Sinal: estilo que não muda na tela após edição;
  conferência: todo `textStyles[` com `=` fora de `produce`/`setStyle` é suspeito.

---

## Template para novo ADR (copie e preencha)
```

## Edição 9 — `meta/IDEAS.md` · onde vive a ideia de estilos

**Âncora:**

```
consistente em lote. **Onde vive:** `StyleRegistry.ts`, observer pattern, herança via
`basedOn`.
```

**Substituir por:**

```
consistente em lote. **Onde vive:** `StyleRegistry.ts` (funções puras sobre o mapa do documento,
DEC-015) + herança via `basedOn` (DEC-014); a propagação na tela vem com o `documentStore`.
```

## Edição 10 — `logs/2026-11-11.md` · seção do Code

**Âncora** (última linha do arquivo):

```
wo0002 aplicada; próximo item é `StyleRegistry.ts` (wo0003).
```

**Substituir por:** a mesma linha, depois uma linha em branco, depois uma seção `## Code (execução) — wo0003` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`. Não reescreva as seções anteriores.

---

## Fora de escopo

- `documentStore.ts` e a ligação do registro com o canvas/UI (propagação na tela).
- Renomear estilo, «desanexar» derivado em raiz, saber quais frames usam um estilo.
- Mexer no validador além da Edição 3, ou no formato `.editx`.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava (CEREBRO, «Técnicas específicas»). Use `node`.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** sem *parameter properties* no `StyleRegistryError` (declare o campo e atribua no construtor); tipos só via `import type`.
- **O Prettier pode reformatar o `satisfies`** e o `import` da Edição 3: aceite o que o `npm run format` fizer, desde que só toque arquivos desta WO.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short` mostra **exatamente**, e nada além:
      `M logs/2026-11-11.md`, `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/GLOSSARY.md`, `M meta/IDEAS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M src/template/TemplateValidator.ts`, `M src/types/frame.types.ts`, `?? meta/workorders/261111-wo0003-style-registry.md`, `?? src/template/StyleRegistry.test.ts`, `?? src/template/StyleRegistry.ts`. Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 49 testes** (36 + S1–S13). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida 1 (o registro):** inverta temporariamente a ordem da fusão em `resolveStyle` (o derivado primeiro, a raiz por cima), rode `npm test` e confirme que **o S2 falha** — linha crua —, restaure, verde de novo.
      - **Quem roda:** quem aplica. **Chega no ramo?** `StyleRegistry.test.ts` → `resolveStyle` → a fusão da cadeia. **NÃO responde:** se o cache invalida certo — isso é S4/S5.
- [ ] **Prova de vida 2 (o `satisfies`):** apague temporariamente a linha `decoration: …` de `textStyleProps`, rode `npm run build` e confirme que **falha** citando `decoration` — linha crua —, restaure, build verde.
      - **Quem roda:** quem aplica. **Chega no ramo?** `tsc -b` → `TemplateValidator.ts`, o `satisfies Record<keyof TextStyleProps, Check>`. **NÃO responde:** se a regra de cada propriedade está certa — isso são os testes da wo0002.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "^export function resolveStyle" src/template/StyleRegistry.ts` = 1
      - `grep -c "^export class StyleRegistryError" src/template/StyleRegistry.ts` = 1
      - `grep -c "satisfies Record<keyof TextStyleProps, Check>" src/template/TemplateValidator.ts` = 1
      - `grep -rn -i "observer pattern" src | wc -l` = 0
      - `grep -rn -i "observer" src meta | grep -v "meta/workorders/\|meta/analises/" | wc -l` = 4 (entrada `[0.0.0]` do CHANGELOG, nota do CONTEXT e 2 linhas da DEC-015 — medido pelo chat numa simulação desta WO)
      - `grep -c "^- \[x\] \`StyleRegistry.ts\`" meta/STATUS.md meta/ROADMAP.md` = 1 e 1
      - `grep -c "^- \`StyleRegistry.ts\` — estilos de texto globais com herança$" meta/CHANGELOG.md` = 0
      - `grep -c "^## DEC-015" meta/DECISIONS.md` = 1
      - `grep -c "^## Code (execução) — wo0003" logs/2026-11-11.md` = 1
      *(escritos pelo chat e não testados no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0003.txt` (`date +%y%m%d-%H%M`, na hora). Inclua as saídas cruas acima, `wc -l` dos arquivos de `src/template/` e qualquer decisão sua no corpo das funções.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-11.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/GLOSSARY.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md meta/workorders/261111-wo0003-style-registry.md src/template/StyleRegistry.ts src/template/StyleRegistry.test.ts src/template/TemplateValidator.ts src/types/frame.types.ts
```

```
git commit -m "feat(template): cria StyleRegistry com resolucao pura de estilos" -m "resolveStyle, dependentsOf, setStyle e removeStyle sobre o mapa textStyles do documento, sem estado proprio (DEC-015), com 13 testes. Validador passa a usar satisfies para cobrar regra de toda propriedade de TextStyleProps (wo0003)."
```

```
git push
```
