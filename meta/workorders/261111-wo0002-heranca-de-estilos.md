# WO 0002 — Herança de estilos: estilo derivado guarda só as diferenças (DEC-014)

> **Tipo:** mista — CÓDIGO (refactor do validador, tipo `TextStyle`, regra de estilos, exemplo, testes, format do scaffold) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — mexe em `frame.types.ts` (arquivo crítico) e no validador.
> **Pré-requisito:** escrita sobre `5df80d3` (`docs: abre analise de heranca de estilos e registra achados da wo0001`), árvore limpa exceto os arquivos que o chat gravou (lista abaixo). Suíte em 28 testes verdes (relatório da wo0001, arquivado em `../notas-arquivadas/261111-0926-code-editx-apply-wo0001.txt`).
> **Base:** `meta/analises/261111-ANALISE-heranca-de-estilos.md`, Opção A, aprovada pelo dono em 2026-11-11. Decisão: DEC-014 (entra pela Edição 10).
> **Depende de:** wo0001 (aplicada: `080c3b7`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `5714bd22cd9b410b1ed1f6f6aee2d8a7e3b7e52c  meta/CONTEXT.md`
> - `977028da49bd6182a0c496461c9afdf17a1fa08e  meta/GLOSSARY.md`
> - `d83353c963fbeee765b09ae2ebe536245cae0acc  meta/analises/261111-ANALISE-heranca-de-estilos.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte** — nunca chute um lugar próximo.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (lidas pelo chat em 2026-11-11, no disco, neste turno; todos os arquivos `i/lf w/lf`):
> - Ed. 3 — `src/types/frame.types.ts`: do `/**` cuja 2ª linha é ` * Estilo de texto nomeado e reutilizável, com herança em cadeia via \`basedOn\`` até o `}` que fecha `export interface TextStyle {` (linha `  basedOn: string | null;` + `}`)
> - Ed. 4 — `src/types/template.types.ts`: as linhas `  TextStyle,` + `  TextFrame,` (bloco `export type { ... } from './frame.types'`)
> - Ed. 5a — `src/template/__examples__/catalogo-simples.example.ts`: o bloco `  'preco-destaque': {` … `    basedOn: 'titulo-produto',` + `  },`
> - Ed. 5b — mesmo arquivo: as 3 linhas do JSDoc ` * restante (fontFamily, align, etc.) vem do pai. Resolvido em runtime por` / ` * \`StyleRegistry.ts\` (ainda não implementado — próximo item após` / ` * TemplateSerializer.ts no backlog).`
> - Ed. 8a — `meta/STATUS.md`: o parágrafo que começa `**Mudanças nesta revisão (2026-11-11):** wo0001 aplicada` e termina `A nota de 2026-11-10 saiu — o merge que ela descrevia está em DEC-012.`
> - Ed. 8b — `meta/STATUS.md`: a linha que começa `- **Sistema de estilos de texto especificado** — herança via \`basedOn\` tipada;`
> - Ed. 8c — `meta/STATUS.md`: a linha que começa `- **Estratégia planejada:** Vitest para lógica de negócio`
> - Ed. 8d — `meta/STATUS.md`: o parágrafo que começa `**2026-11-11** — primeira WO aplicada pelo Claude Code (wo0001)` até `**Onde parou:** próximo item é \`StyleRegistry.ts\`.`
> - Ed. 9 — `meta/CHANGELOG.md`: a linha `  por turno/evento no lugar de «por sessão». Ver DEC-012.` (fim do bullet de `### Modificado`)
> - Ed. 10 — `meta/DECISIONS.md`: `## Template para novo ADR (copie e preencha)` (única)
> - Ed. 11 — `logs/2026-11-11.md`: a última linha, `wo0001 aplicada; próximo item é \`StyleRegistry.ts\`.` (fim da seção do Code da wo0001)

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `CHANGELOG.md`, `DECISIONS.md` e a seção do Code no log (Edições 8–11): esta WO É o registro, aplique os textos exatos. `meta/CONTEXT.md`, `meta/GLOSSARY.md` e a análise são do chat e já estão gravados — **só versione**, não edite.

---

## 1. Por que

O JSDoc de `TextStyle.basedOn` promete que o estilo filho herda do pai «sobrescrevendo apenas os campos explicitamente definidos», mas o tipo exige TODOS os campos e o validador da wo0001 rejeita o que faltar — a herança não tem efeito. O dono aprovou a Opção A da análise: estilo **raiz** (`basedOn: null`) é completo; estilo **derivado** guarda só o que muda. Esta WO muda o formato (`0.1.0`, no lugar, sem subir versão — vale só porque não existe nenhum `.editx`); o `StyleRegistry.ts` que resolve a cadeia é a wo0003. Junto, três pendências do relatório da wo0001: o `FrameValidator.ts` com 361 linhas misturando o motor e as regras de frame, o `npm run format` que reescreve `App.tsx`/`main.tsx`, e a linha «Estratégia planejada» do STATUS ainda no futuro.

## Inventário — de onde saiu a lista de edições

- **Quem lê `TextStyle`:** `grep -rln "textStyles\|TextStyle" src` (chat, neste turno) = **7 arquivos**: `src/types/frame.types.ts`, `src/types/template.types.ts`, `src/template/TemplateSchema.ts`, o exemplo, `TemplateValidator.ts`, `FrameValidator.ts`, `TemplateSerializer.test.ts`. `TemplateSchema.ts` (`TextStyleMap = Record<string, TextStyle>`) e `FrameValidator.ts` (só `styleRef`) **não precisam mudar**. Se o seu `grep` achar um 8º arquivo, **PARE e reporte**.
- **Docs que descrevem a herança:** `GLOSSARY.md` (`basedOn`, gravado pelo chat), JSDoc de `frame.types.ts` (Ed. 3), comentário do exemplo (Ed. 5b), STATUS «Sistema de estilos» (Ed. 8b). Nenhum outro em `meta/`.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos arquivos da lista do cabeçalho. Hash diferente = outro escritor mexeu: **PARE e reporte**.
2. Premissa da exceção de formato (análise, «Recomendação»): rode `find .. -name "*.editx" -not -path "*/node_modules/*" | wc -l` — **tem de dar 0**. Deu mais: **PARE e reporte** (o formato não pode mudar no lugar).
3. Baseline: `npm run lint`, `npm run build` e `npm test` — anote o cru. Esperado: 0 erros, build verde, `Tests  28 passed (28)`. Divergiu: critério vira o DELTA, nomeie cada erro novo.

## Edição 1 — extrair o motor do validador para `src/template/ValidationRules.ts` (refactor puro)

**Mover, sem mudar comportamento.** De `src/template/FrameValidator.ts`, tudo da linha `export type Obj = Record<string, unknown>;` até o fim da função `styleRef` (inclusive) — tipos `Obj`/`Ctx`/`Check`/`Field`/`Spec`, as constantes `HEX_COLOR`/`ISO_DATE`, as seções «utilidades» e «primitivas», `union`, `uniqueId` e `styleRef` — vai para o arquivo NOVO `src/template/ValidationRules.ts`. No `FrameValidator.ts` fica só a seção «frames» (de `const transformSpec` até o fim), importando do `ValidationRules.ts` o que usa.

- Corpos das funções **idênticos** byte a byte; só mudam `import`/`export` e os cabeçalhos dos dois arquivos (JSDoc de arquivo em PT-BR, dizendo o papel de cada um — siga o estilo dos cabeçalhos existentes). `integer` e `union` passam a ser exportados (o `FrameValidator.ts` os usa).
- `TemplateValidator.ts` passa a importar o motor de `./ValidationRules` e só `frame` de `./FrameValidator`. O contrato público dele não muda.
- Sem ciclo de módulo em runtime: `ValidationRules.ts` importa de `TemplateValidator.ts` **só como tipo** (`import type`), como o `FrameValidator.ts` faz hoje.
- **Antes da Edição 2, rode `npm test`: tem de dar `Tests  28 passed (28)`, igual ao baseline.** É a prova de que o refactor não mudou nada. Diferente: **PARE e reporte**.
- Se `ValidationRules.ts` passar de ~300 linhas, siga e diga a contagem no relatório (não quebre mais).

## Edição 2 — formatar o scaffold de uma vez

Rode `npm run format`. Esperado no `git status`: `src/App.tsx` e `src/main.tsx` modificados, mais os arquivos que você já criou ou mudou nesta WO — **nenhum outro**. Rode `npm run format` uma segunda vez: `git diff --stat` não pode mudar (o format ficou idempotente). Não reverta `App.tsx`/`main.tsx` desta vez: formatar os dois É a edição.

## Edição 3 — `src/types/frame.types.ts` · `TextStyle` vira união raiz × derivado

**Âncora:**

```
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
```

**Substituir por:**

```
/**
 * As propriedades visuais de um estilo de texto. Num estilo RAIZ todas são
 * obrigatórias; num estilo DERIVADO todas são opcionais — o que falta vem do
 * estilo-pai. Ver `TextStyle` e DEC-014.
 */
export interface TextStyleProps {
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
}

/**
 * Estilo de texto nomeado e reutilizável, com herança em cadeia via `basedOn`
 * (como estilos baseados no Word). Vive em `EditxTemplate.textStyles`,
 * indexado pelo nome do estilo — ver TemplateSchema.ts.
 *
 * União discriminada pelo próprio `basedOn` (DEC-014):
 * - `basedOn: null`   → estilo RAIZ: todas as `TextStyleProps`, completo.
 * - `basedOn: string` → estilo DERIVADO: nome de outro estilo em `textStyles`;
 *   guarda SÓ as propriedades que diferem do pai, e o resto é herdado em
 *   cadeia até a raiz — como o «Baseado em» do Word.
 *
 * Nunca leia uma propriedade de um estilo derivado diretamente: resolva antes
 * pelo `StyleRegistry.ts`. O `Partial` existe para o compilador cobrar isso.
 *
 * Alterar um estilo propaga automaticamente para todos os frames vinculados
 * — implementado por observer pattern em `StyleRegistry.ts` (ver DEC-006,
 * seção de estilos globais em CONTEXT.md § Modos de Overflow).
 */
export type TextStyle =
  | ({ basedOn: null } & TextStyleProps)
  | ({ basedOn: string } & Partial<TextStyleProps>);
```

## Edição 4 — `src/types/template.types.ts` · reexportar `TextStyleProps`

**Âncora:**

```
  TextStyle,
  TextFrame,
```

**Substituir por:**

```
  TextStyle,
  TextStyleProps,
  TextFrame,
```

## Edição 5a — exemplo · `preco-destaque` só com as diferenças

Arquivo: `src/template/__examples__/catalogo-simples.example.ts`.

**Âncora:**

```
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
```

**Substituir por:**

```
  'preco-destaque': {
    fontWeight: 800,
    fontSize: 22,
    color: '#E63946',
    basedOn: 'titulo-produto',
  },
```

## Edição 5b — exemplo · comentário dos estilos

**Âncora:**

```
 * restante (fontFamily, align, etc.) vem do pai. Resolvido em runtime por
 * `StyleRegistry.ts` (ainda não implementado — próximo item após
 * TemplateSerializer.ts no backlog).
```

**Substituir por:**

```
 * restante (fontFamily, align, etc.) vem do pai — por isso o objeto dele só
 * tem esses três campos (estilo derivado, DEC-014). Resolvido em runtime por
 * `StyleRegistry.ts` (wo0003).
```

## Edição 6 — `src/template/TemplateValidator.ts` · regra de estilos raiz × derivado

Comportamento EXATO da validação de cada entrada de `textStyles` (o código é seu; o contrato público do arquivo não muda):

| `basedOn` | O que acontece |
|---|---|
| ausente | `missing-field` em `….basedOn`; **não desce** (sem `basedOn` não se sabe qual regra vale) |
| `null` | estilo RAIZ: as 10 propriedades **obrigatórias** (`missing-field` para cada uma que faltar), com as mesmas regras de valor de hoje |
| texto | estilo DERIVADO: `basedOn` passa por `styleRef` (R11, `unknown-reference`); as 10 propriedades **opcionais**, mas as presentes passam pelas MESMAS regras de valor (cor `#RRGGBB`, `fontSize` > 0…) |
| outro tipo | `invalid-type` em `….basedOn`; **não desce** |

Nos dois ramos, **continua estrito**: chave fora das 10 + `basedOn` é `unknown-field`. A checagem de ciclo (R12) **não muda**. Monte o spec do derivado a partir do spec das propriedades (envolvendo cada regra em `optional`) — uma lista de regras, não duas cópias.

## Edição 7 — `src/template/TemplateSerializer.test.ts` · casos novos

**Acrescente** (os 28 existentes continuam, nenhum sai) um `describe('herança de estilos (DEC-014)', …)` com, no mínimo:

| T | Entrada (sobre `fresh()`) | Esperado |
|---|---|---|
| T20 | `Object.keys(textStyles['preco-destaque']).sort()` | `['basedOn', 'color', 'fontSize', 'fontWeight']` — o fixture usa mesmo o derivado parcial |
| T21 | apagar `textStyles['titulo-capa'].fontFamily` (raiz) | contém `missing-field` em `$.textStyles["titulo-capa"].fontFamily` |
| T22 | novo estilo `textStyles['so-pai'] = { basedOn: 'titulo-produto' }` | `ok: true` |
| T23 | `textStyles['preco-destaque'].fontSise = 10` | contém `unknown-field` em `$.textStyles["preco-destaque"].fontSise` |
| T24 | `textStyles['preco-destaque'].fontSize = 0` | contém `invalid-value` em `$.textStyles["preco-destaque"].fontSize` |
| T25 | apagar `textStyles['titulo-capa'].basedOn` | os erros com caminho começando em `$.textStyles["titulo-capa"]` são exatamente 1: `missing-field` em `$.textStyles["titulo-capa"].basedOn` |
| T26 | `textStyles['titulo-capa'].basedOn = 7` | exatamente 1 erro sob `$.textStyles["titulo-capa"]`: `invalid-type` em `….basedOn` |
| T27 | `textStyles['preco-destaque'].basedOn = 'inexistente'` | contém `unknown-reference` em `$.textStyles["preco-destaque"].basedOn` |

---

## Edição 8a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-11):** wo0001 aplicada — `TemplateSerializer.ts` +
`TemplateValidator.ts` + suíte Vitest (DEC-013). Saíram de «Em Progresso» o commit do merge
(feito: `222c5f8`) e o serializer (feito); backlog avança para `StyleRegistry.ts` e ganha a
sanitização de `customSvg`; «Testes» deixa de dizer 0%; a contagem de ADRs deixou de ser número
congelado. A nota de 2026-11-10 saiu — o merge que ela descrevia está em DEC-012.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-11, wo0002):** herança de estilos decidida e aplicada no formato
(estilo derivado guarda só as diferenças — DEC-014); «Sistema de estilos» e «Estratégia» de testes
atualizados; «Última conversa» passa à wo0002. Nenhum item de backlog fechou: o `StyleRegistry.ts`
continua o próximo (wo0003). A nota anterior (wo0001) saiu — o que ela registrava está em DEC-013.
```

## Edição 8b — `meta/STATUS.md` · Sistema de estilos

**Âncora** (linha inteira):

```
- **Sistema de estilos de texto especificado** — herança via `basedOn` tipada; `StyleRegistry.ts` (observer pattern que resolve a herança em runtime) ainda não implementado
```

**Substituir por:**

```
- **Sistema de estilos de texto especificado e validado** — `TextStyle` é raiz (completo, `basedOn: null`) ou derivado (só as diferenças, `basedOn: "<pai>"`), DEC-014; o validador cobra as duas formas. `StyleRegistry.ts` (resolve a cadeia em runtime + observer) ainda não implementado — wo0003
```

## Edição 8c — `meta/STATUS.md` · Estratégia de testes

**Âncora** (linha inteira):

```
- **Estratégia planejada:** Vitest para lógica de negócio (serialização, overflow engine, CSV parser); sem testes de UI no MVP
```

**Substituir por:**

```
- **Estratégia:** Vitest para lógica de negócio — serialização e validação (feito), herança de estilos, overflow engine e CSV parser (a fazer); sem testes de UI no MVP
```

## Edição 8d — `meta/STATUS.md` · Última conversa

**Âncora:**

```
**2026-11-11** — primeira WO aplicada pelo Claude Code (wo0001): Vitest instalado, `npm test`,
`TemplateSerializer.ts` + `TemplateValidator.ts` com os 19 casos obrigatórios da WO; ROADMAP F1
acertado (boilerplate, schema e serializer marcados). Detalhe no relatório
`../*-code-editx-apply-wo0001.txt` e em `logs/2026-11-11.md`.
**Onde parou:** próximo item é `StyleRegistry.ts`.
```

**Substituir por:**

```
**2026-11-11** — wo0001 (serializer + validador + Vitest) e wo0002 (herança de estilos, DEC-014:
`TextStyle` raiz × derivado no tipo, no validador e no exemplo; motor do validador extraído para
`ValidationRules.ts`; scaffold formatado pelo Prettier). Relatórios em `../notas-arquivadas/` e
na pasta-pai; detalhe em `logs/2026-11-11.md`.
**Onde parou:** próximo item é `StyleRegistry.ts` (wo0003).
```

## Edição 9 — `meta/CHANGELOG.md` · Modificado

**Âncora** (linha inteira, último bullet de `### Modificado` em `[Unreleased]`):

```
  por turno/evento no lugar de «por sessão». Ver DEC-012.
```

**Substituir por:**

```
  por turno/evento no lugar de «por sessão». Ver DEC-012.
- Formato `.editx` (`0.1.0`, ainda não lançado): `TextStyle` passa a ser raiz completo
  (`basedOn: null`) ou derivado só com as diferenças (`basedOn: "<pai>"`); novo tipo
  `TextStyleProps`. Motor do validador extraído para `ValidationRules.ts`. Ver DEC-014.
```

## Edição 10 — `meta/DECISIONS.md` · DEC-014

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-014 — Estilo de texto derivado guarda só as diferenças do pai

**Data:** 2026-11-11
**Status:** aceita
**Autor:** dono (decisão), Claude (análise)

### Contexto
O JSDoc de `TextStyle.basedOn` prometia herança («sobrescrevendo apenas os campos explicitamente
definidos»), mas o tipo exigia todos os campos e o validador da DEC-013 rejeitava os ausentes: a
herança não tinha efeito. Raciocínio completo, com as quatro opções:
`meta/analises/261111-ANALISE-heranca-de-estilos.md`.

### Decisão
- `TextStyle` é união discriminada por `basedOn`: **raiz** (`null`, todas as `TextStyleProps`) ou
  **derivado** (nome do pai, `Partial<TextStyleProps>` — só o que difere).
- O validador cobra as duas formas (raiz completa; derivado parcial e ainda estrito).
- O formato `0.1.0` muda **no lugar, sem subir versão** — exceção válida só porque nenhum `.editx`
  existia (`find .. -name "*.editx" -not -path "*/node_modules/*" | wc -l` = 0, conferido na wo0002).
  Depois do primeiro arquivo de usuário, mudança de formato sobe versão e traz migração.

### Alternativas consideradas
- **Tudo obrigatório, propagação por igualdade de valor** — regra implícita; erra quando o usuário
  escolheu de propósito o mesmo valor do pai.
- **Tudo obrigatório + lista `overrides`** — duas fontes da mesma verdade no mesmo objeto.
- **Sem herança** — contradiz o requisito de estilos em cascata (Affinity/Word).

### Consequências
- **Positivas:** o arquivo diz sem ambiguidade o que é herdado; o compilador impede ler propriedade de
  estilo derivado sem resolver (`number | undefined`).
- **Negativas:** todo consumidor de estilo depende do `StyleRegistry.ts` (wo0003) para o valor final.
- **Riscos:** `as TextStyleProps` forçado fora do `StyleRegistry.ts` desfaz a proteção — sinal:
  `grep -rn "as TextStyleProps" src`.

---

## Template para novo ADR (copie e preencha)
```

## Edição 11 — `logs/2026-11-11.md` · seção do Code

**Âncora** (última linha do arquivo):

```
wo0001 aplicada; próximo item é `StyleRegistry.ts`.
```

**Substituir por:** a mesma linha, depois uma linha em branco, depois uma seção `## Code (execução) — wo0002` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md` — só o que você viu ao aplicar. Não reescreva as seções anteriores.

---

## Fora de escopo

- O `StyleRegistry.ts` (resolver a cadeia, observer) — wo0003.
- «Desanexar» um estilo derivado (achatar em raiz) ou trocar o pai — operações de editor, vêm com a UI.
- Subir a versão do schema ou escrever migração (DEC-014: exceção enquanto não há `.editx`).
- Mexer em `TemplateSchema.ts` ou em `FrameValidator.ts` além da Edição 1.
- Qualquer outra mudança no `App.tsx`/`main.tsx` além do que o Prettier fizer.

## Armadilhas desta WO

- **Python não serve aqui:** no Git Bash desta máquina, `python3` é o stub da Microsoft Store e trava (CEREBRO, «Técnicas específicas»). Script de apoio: `node`.
- **`erasableSyntaxOnly` e `verbatimModuleSyntax`** continuam valendo (ver wo0001): sem `enum`/parameter properties; tipo só como `import type`.
- **Os testes fazem parte do `tsc -b`:** com `TextStyle` virando união, mutar o fixture com tipo «errado» exige o mesmo `as unknown as Loose` que os testes já usam.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short` mostra **exatamente**, e nada além:
      `M logs/2026-11-11.md`, `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/GLOSSARY.md`, `M meta/STATUS.md`, `M meta/analises/261111-ANALISE-heranca-de-estilos.md`, `M src/App.tsx`, `M src/main.tsx`, `M src/template/FrameValidator.ts`, `M src/template/TemplateSerializer.test.ts`, `M src/template/TemplateValidator.ts`, `M src/template/__examples__/catalogo-simples.example.ts`, `M src/types/frame.types.ts`, `M src/types/template.types.ts`, `?? meta/workorders/261111-wo0002-heranca-de-estilos.md`, `?? src/template/ValidationRules.ts`. Um arquivo a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros (ou o baseline, sem erro novo). Saída crua.
- [ ] `npm run build` — passa. Última linha crua.
- [ ] `npm test` — passa com **pelo menos 36 testes** (28 + T20–T27). Linha de resumo crua. Menos de 36 = **VERMELHO**.
- [ ] `npm test` também deu `28 passed` **entre a Edição 1 e a Edição 2** (refactor puro). Cole essa linha crua.
- [ ] **Prova de vida (par negativo):** troque temporariamente a regra do estilo RAIZ para tratar as propriedades como opcionais (como no derivado), rode `npm test` e confirme que **o T21 falha** — cole a linha crua —, restaure e rode até verde. T21 passando com a regra afrouxada = **VERMELHO**.
      - **Quem roda:** quem aplica. **Chega no ramo?** `TemplateSerializer.test.ts` → `validateTemplate` → a validação de `textStyles` em `TemplateValidator.ts`, ramo `basedOn: null`. **Pergunta que este passo NÃO responde:** se o ramo derivado está certo — esse é T22–T24 e T27.
- [ ] `npm run format` rodado de novo não muda o `git diff --stat` (idempotente).
- [ ] Conferências por `grep` (contagem de LINHAS, `grep -c`):
      - `grep -c "^export interface TextStyleProps" src/types/frame.types.ts` = 1
      - `grep -c "^export interface TextStyle {" src/types/frame.types.ts` = 0
      - `grep -c "^  TextStyleProps,$" src/types/template.types.ts` = 1
      - `grep -c "^    fontFamily: 'Montserrat',$" src/template/__examples__/catalogo-simples.example.ts` = 2 (sobram `titulo-produto` e `titulo-capa`; eram 3)
      - `grep -rn "as TextStyleProps" src | wc -l` = 0
      - `grep -c "^## DEC-014" meta/DECISIONS.md` = 1
      - `grep -c "^## Code (execução) — wo0002" logs/2026-11-11.md` = 1
      - `wc -l src/template/FrameValidator.ts src/template/ValidationRules.ts` — cole o cru (nenhum esperado fixo; o relatório diz se algum passou de ~300)
      *(escritos pelo chat e não testados no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0002.txt` (`date +%y%m%d-%H%M`, na hora). Inclua as saídas cruas acima, a contagem de linhas dos 4 arquivos de `src/template/` e qualquer decisão sua na Edição 6.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-11.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/GLOSSARY.md meta/STATUS.md meta/analises/261111-ANALISE-heranca-de-estilos.md meta/workorders/261111-wo0002-heranca-de-estilos.md src/App.tsx src/main.tsx src/template/FrameValidator.ts src/template/TemplateSerializer.test.ts src/template/TemplateValidator.ts src/template/ValidationRules.ts src/template/__examples__/catalogo-simples.example.ts src/types/frame.types.ts src/types/template.types.ts
```

```
git commit -m "feat(template): estilo derivado guarda so as diferencas do pai" -m "TextStyle vira uniao raiz x derivado (DEC-014); validador cobra as duas formas; exemplo enxuto; 8 testes novos. Extrai o motor do validador para ValidationRules.ts e formata o scaffold com Prettier (wo0002)."
```

```
git push
```
