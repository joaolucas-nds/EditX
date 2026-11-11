# WO 0001 — TemplateSerializer.ts + TemplateValidator.ts com suíte Vitest

> **Tipo:** mista — CÓDIGO (Vitest, serializer, validador, testes) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — o validador tem julgamento (descer ou não num pai inválido, mensagens, caminhos).
> **Pré-requisito:** escrita sobre `222c5f8` (`docs: integra template-update do KCM v1.135.0 e ativa o modo Code`), árvore limpa exceto os arquivos que o chat gravou (lista abaixo). `npm run lint` e `npm run build` verdes em 2026-07-24 — reconferidos na Edição 0.
> **Base:** pedido do dono em 2026-11-11 («escreva a WO do TemplateSerializer.ts com o setup do Vitest»); backlog do `meta/STATUS.md`; JSDoc de `src/types/frame.types.ts` que delega ao serializer a regra de `minFontSize`. Decisão de método: DEC-013 (entra pela Edição 8).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `0512bae9b383da08f09f29e0ed8becdf9162f34b  CLAUDE.md`
> - `3a2e9aae7bf31f658474360b94ff1641a99773a3  .claude/settings.json`
> - `685ab830da737578924da63f5c0c31c9d45d3c5c  meta/CONTEXT.md`
> - `97bf7e911c52c9c2b45322edc5458d63bb0cd200  logs/2026-11-11.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte** — nunca chute um lugar próximo.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório. Na REMOÇÃO (7b), «já aplicada» = a linha não existe mais.
> **Âncoras lidas em** (lidas pelo chat em 2026-11-11, no disco, neste turno):
> - Ed. 2 — `package.json`: `    "preview": "vite preview"` (linha única, 4 espaços, LF — `git ls-files --eol` = `i/lf w/lf`)
> - Ed. 6a — `meta/STATUS.md`: o parágrafo que começa `**Mudanças nesta revisão (2026-11-10):** merge do template-update do KCM v1.135.0 com o modo` e termina `Nenhum item de backlog mudou.`
> - Ed. 6b — `meta/STATUS.md`: `- **Decisões técnicas registradas** — 11 ADRs documentados no DECISIONS.md`
> - Ed. 6c — `meta/STATUS.md`: a linha que começa `- **Modo Code instalado** — `
> - Ed. 6d — `meta/STATUS.md`: `- [ ] **Commit do merge KCM v1.135.0** — arquivos gravados no disco em 2026-11-10, aguardando commit/push do dono` + a linha seguinte `- [ ] **`TemplateSerializer.ts`** — próximo item do backlog: salvar/carregar/validar JSON `.editx` (0%)`
> - Ed. 6e — `meta/STATUS.md`: `- [ ] `TemplateSerializer.ts` — serialização/deserialização + validação de schema ← **próximo**` + `- [ ] `StyleRegistry.ts` — estilos globais com herança e observer`
> - Ed. 6f — `meta/STATUS.md`: `- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos`
> - Ed. 6g — `meta/STATUS.md`: `- **Cobertura:** 0% (Vitest ainda não instalado — entra com `TemplateSerializer.ts`, primeiro módulo com lógica de runtime de fato testável)`
> - Ed. 6h — `meta/STATUS.md`: o parágrafo que começa `**2026-11-10** — merge do template-update do KCM **v1.135.0**` e termina `falta o commit (bloco no chat) e colar as INSTRUCOES novas no painel do Projeto.`
> - Ed. 6i — `meta/STATUS.md`: as duas linhas finais `*Próximo passo: commit deste merge; depois ...` / `tarefa feita pelo Claude Code, com WO.*`
> - Ed. 7a/7b — `meta/CHANGELOG.md`: a linha que começa `- `TemplateSchema.ts` + `frame.types.ts` + `template.types.ts` — schema completo` e `- `TemplateSerializer.ts` — salvar e carregar arquivos `.editx``
> - Ed. 8 — `meta/DECISIONS.md`: `## Template para novo ADR (copie e preencha)` (única)
> - Ed. 9 — `meta/IDEAS.md`: `*Nenhuma ainda.*` (única; a de «Concluídas» é `*Nenhuma ainda — o boilerplate...`, outra string)
> - Ed. 10 — `meta/ROADMAP.md`: as três linhas `- [ ] Boilerplate: ...`, `- [ ] `TemplateSchema.ts` — ...`, `- [ ] `TemplateSerializer.ts` — serialização/deserialização + validação`
> - Ed. 11 — `logs/2026-11-11.md`: última linha `wo0001 escrita e gravada; aguardando `/apply-wo` no Claude Code.`

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md`, `ROADMAP.md` e a seção do Code no log (Edições 6–11): esta WO É o registro, aplique os textos exatos. `meta/CONTEXT.md` é do chat e já está gravado — **só versione**, não edite.

---

## 1. Por que

Não existe ainda nenhuma forma de salvar ou abrir um `.editx`: o schema é só tipo, e tipo não protege arquivo vindo do disco. O `TemplateSerializer.ts` é o primeiro módulo com lógica de runtime e o mais perigoso do projeto (CONTEXT, «Arquivos Críticos»: bug aqui corrompe arquivo de usuário) — por isso entra com a suíte de testes junto, não depois. Esta WO também acerta três registros atrasados: o `meta/ROADMAP.md` ainda marca `[ ]` no boilerplate e no schema (prontos desde 2026-07-24), e o `meta/STATUS.md` ainda diz «11 ADRs» e lista como pendente o commit do merge, que é o `222c5f8`.

## Inventário — de onde saiu a lista de edições

- **Código:** 3 arquivos novos em `src/template/` + `package.json`/`package-lock.json` (instalação e script). Nenhum arquivo de código existente é tocado — `TemplateSchema.ts`, `frame.types.ts` e `template.types.ts` ficam como estão.
- **Docs:** procurei no repo, por `grep -rn` em `meta/`, todo lugar que declara o estado do `TemplateSerializer.ts` ou do Vitest: **8 pontos** — STATUS (Em Progresso, Backlog, Testes, Última conversa, rodapé), CHANGELOG (Planejado), ROADMAP (F1) e CONTEXT (stack, árvore, parágrafo de testes, Arquivos Críticos — este já gravado pelo chat). Se você achar outro ponto que diga que o serializer não existe ou que o Vitest não está instalado, **PARE e reporte antes de editar**.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. Rode `sha1sum` nos arquivos da lista do cabeçalho. Hash diferente do listado = outro escritor mexeu: **PARE e reporte**.
2. Baseline: rode `npm run lint` e `npm run build` **antes** de qualquer edição e anote o resultado cru (número de erros/avisos). Se algum já falha, o critério desta WO vira o **DELTA** — nomeie cada erro novo no relatório; não conserte erro antigo aqui.

## Edição 1 — instalar o Vitest

```
npm install -D vitest@^5.1.0
```

Pede aprovação (fora do `allow` de propósito). Medido pelo chat no registro do npm em 2026-11-11: `vitest` 5.1.0, peer `vite ^6.4.0 || ^7.0.0 || ^8.0.0` e `@types/node ^22.0.0 || >=24.0.0` — o projeto tem `vite ^8.1.1` e `@types/node ^24.13.2`. Se o npm acusar conflito de peer (`ERESOLVE`), **PARE e reporte** — não use `--force` nem `--legacy-peer-deps`. **Não** instale `jsdom`, `happy-dom` nem `@vitest/coverage-*`: o serializer roda em ambiente Node, e cobertura fica para quando for medida de propósito. **Não** crie `vitest.config.ts` (DEC-013: config zero).

## Edição 2 — `package.json` · script de teste

**Âncora** (bloco `scripts`):

```
    "preview": "vite preview"
```

**Substituir por:**

```
    "preview": "vite preview",
    "test": "vitest run"
```

## Edição 3 — `src/template/TemplateValidator.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato público EXATO (nomes e formas não mudam; o corpo é seu):

```ts
import type { EditxTemplate } from './TemplateSchema';

/** Versões de schema que este validador entende. Lista explícita: versão fora dela é rejeitada, nunca "tentada". */
export const SUPPORTED_SCHEMA_VERSIONS: readonly string[] = ['0.1.0'];

export type ValidationErrorCode =
  | 'invalid-json'
  | 'unsupported-version'
  | 'missing-field'
  | 'unknown-field'
  | 'invalid-type'
  | 'invalid-value'
  | 'duplicate-id'
  | 'unknown-reference';

export interface ValidationError {
  /** Caminho no documento, estilo JSONPath: `$`, `$.document.dpi`, `$.pages[1].frames[0].id`, `$.textStyles["preco-destaque"].basedOn`. */
  path: string;
  code: ValidationErrorCode;
  /** Mensagem em PT-BR, legível pelo usuário final. */
  message: string;
}

export type ValidationResult =
  | { ok: true; template: EditxTemplate }
  | { ok: false; errors: ValidationError[] };

export function validateTemplate(value: unknown): ValidationResult;
```

**Comportamento:**
- **Coleta TODOS os erros**, não para no primeiro. Mas **não desce** num nó cujo tipo já está errado ou ausente (objeto que não é objeto, frame com `type` inválido): um erro na raiz do defeito, não uma cascata.
- **Versão primeiro:** `version` ausente → `missing-field` em `$.version`; presente e fora de `SUPPORTED_SCHEMA_VERSIONS` → `unsupported-version` em `$.version`. Nos dois casos, **devolva só esse erro** — as outras regras são da versão conhecida.
- **Estrito:** chave que o tipo não declara → `unknown-field` no caminho da chave. Vale também para as uniões discriminadas: `csvColumn` num frame `role: 'static'` é `unknown-field`; `content` num `role: 'data'` também.
- **Sucesso:** `{ ok: true, template: value as EditxTemplate }` — a MESMA referência, sem clonar nem normalizar.
- Raiz que não é objeto (número, array, `null`) → `invalid-type` em `$`.

**Regras (todas obrigatórias — derivadas de `TemplateSchema.ts` e `frame.types.ts`, lidos pelo chat neste turno):**

| # | Regra | Código |
|---|---|---|
| R1 | Todo campo obrigatório do tipo presente; opcionais (`isDataPage`, `minFontSize`, `fallback`, `customSvg`, `skipRowsWhere`) podem faltar | `missing-field` |
| R2 | Tipo primitivo certo (string, number finito, boolean, array, objeto); `ColumnFormat` aceita `null` | `invalid-type` |
| R3 | Valores de união de literais só os do tipo (`DocumentType`, `DocumentUnit`, `ColorMode`, `PageOrientation`, `ColumnType`, `FilterOperator`, `OverflowMode`, `TextAnchor`, `TextAlign`, `VerticalAlign`, `TextCase`, `TextDecoration`, `ImageFit`, `ImageHorizontalAlign`, `ShapeKind`, `StrokeStyle`, discriminantes `type`/`role`/`fill.type`) | `invalid-value` |
| R4 | `ColumnFormat`: `null`, `'uppercase'`, `'lowercase'`, ou `currency:`/`date:` seguido de pelo menos 1 caractere | `invalid-value` |
| R5 | Cor `#RRGGBB` (`/^#[0-9A-Fa-f]{6}$/`) em `BrandColor.hex`, `TextStyle.color`, `ShapeFill.color`, `ShapeStroke.color` | `invalid-value` |
| R6 | `cmyk`: array de exatamente 4 números, cada um de 0 a 100 | `invalid-value` (`invalid-type` se não for array) |
| R7 | Faixas: `document.width`/`height` > 0; `dpi` > 0; `bleed` ≥ 0; `fontSize` > 0; `fontWeight` inteiro de 1 a 1000; `lineHeight` > 0; `transform.width`/`height` ≥ 0 (linha pode ter altura 0); `stroke.width` ≥ 0; `borderRadius` ≥ 0; `zIndex` inteiro; `minFontSize` > 0 | `invalid-value` |
| R8 | `createdAt`/`updatedAt`: ISO 8601 com hora e fuso (`/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z\|[+-]\d{2}:\d{2})$/`) e `Date.parse` não `NaN` | `invalid-value` |
| R9 | `overflow.mode === 'fixed-shrink'` exige `minFontSize` (o JSDoc de `OverflowConfig.minFontSize` delega esta regra ao serializer) | `missing-field` |
| R10 | `shape === 'custom-svg'` exige `customSvg` string não vazia; `customSvg` presente com outro `shape` | `missing-field` / `invalid-value` |
| R11 | `textStyle` de frame de texto existe em `textStyles`; `basedOn` é `null` ou nome existente | `unknown-reference` |
| R12 | `basedOn` sem ciclo (A→B→A, ou A→A) — reporte no `basedOn` de pelo menos um estilo do ciclo | `invalid-value` |
| R13 | `id` de página único entre páginas; `id` de frame único no DOCUMENTO inteiro (JSDoc de `BaseFrame.id`) — o erro vai na SEGUNDA ocorrência | `duplicate-id` |
| R14 | Caminhos relativos (DEC-002): `src`, `fallback` e `csvMapping.imageBasePath` não começam com `/` nem `\`, e não casam `/^[A-Za-z]:/` | `invalid-value` |
| R15 | `pages` com pelo menos 1 página; `id` de documento, página e frame não vazio | `invalid-value` |

**NÃO valide** (decisões já registradas em outro lugar — validar aqui contradiria o schema): variáveis de `outputNaming` (JSDoc diz `BatchGenerator.ts`); `csvColumn` × `columns` e `skipRowsWhere.column` × `columns` (o exemplo usa `skipRowsWhere.column: 'ativo'`, que não está em `columns`); formato UUID do `id` (o exemplo usa `'exemplo-catalogo-simples'`); conteúdo do SVG (fora de escopo, abaixo).

Se o arquivo passar de ~300 linhas (convenção do CONTEXT), extraia as regras de frame para `src/template/FrameValidator.ts`, mantendo o contrato público acima em `TemplateValidator.ts`, e **diga no relatório** — a árvore do CONTEXT é do chat e será atualizada por ele.

## Edição 4 — `src/template/TemplateSerializer.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Contrato público EXATO:

```ts
import type { EditxTemplate } from './TemplateSchema';
import type { ValidationError, ValidationResult } from './TemplateValidator';

/** Lançado por `serializeTemplate` quando o template não passa na validação. */
export class TemplateValidationError extends Error {
  readonly errors: ValidationError[];
  // construtor recebe os erros; mensagem em PT-BR com a contagem
}

export function serializeTemplate(template: EditxTemplate): string;
export function parseTemplate(json: string): ValidationResult;
```

- `serializeTemplate`: valida com `validateTemplate`; inválido → lança `TemplateValidationError` (**nunca grava `.editx` inválido**); válido → `JSON.stringify(template, null, 2) + '\n'`. Não muta a entrada e **não** mexe em `updatedAt` — carimbar a hora é de quem salva, e o JSDoc diz isso.
- `parseTemplate`: remove um BOM UTF-8 inicial (`\uFEFF`) se houver; `JSON.parse` que falha → `{ ok: false, errors: [ { path: '$', code: 'invalid-json', message } ] }` (exatamente 1 erro); senão devolve `validateTemplate(parsed)`.
- Reexporte os tipos de `TemplateValidator.ts` que o chamador precisa? **Não** — quem usa importa de `TemplateValidator.ts`. Um módulo, uma responsabilidade.

## Edição 5 — `src/template/TemplateSerializer.test.ts` · criar arquivo novo

Se já existir, **PARE e reporte**. Importe `describe`/`it`/`expect` de `vitest` (sem globals). Fixture: `catalogoSimplesExample` de `./__examples__/catalogo-simples.example` — **sempre** `structuredClone` dentro de cada teste antes de mutar (o export é compartilhado; mutar vaza entre testes). Para mutar com tipo errado, use `as unknown as Record<string, unknown>` — `any` é erro de lint no projeto. Casos obrigatórios (um `it` por linha; caminhos e códigos EXATOS):

| T | Entrada | Esperado |
|---|---|---|
| T1 | `validateTemplate(exemplo)` | `ok: true` |
| T2 | `parseTemplate(serializeTemplate(exemplo))` | `ok: true` e `template` `toEqual` o exemplo; e `serializeTemplate` do resultado `===` a primeira serialização |
| T3 | `serializeTemplate(exemplo)` | `=== JSON.stringify(exemplo, null, 2) + '\n'` |
| T4 | `parseTemplate('{')` | `errors` com exatamente 1 item, `code: 'invalid-json'`, `path: '$'` |
| T5 | `version = '9.0.0'` | exatamente 1 erro: `unsupported-version` em `$.version` |
| T6 | `delete name` | contém `missing-field` em `$.name` |
| T7 | `document.dpi = '300'` (string) | contém `invalid-type` em `$.document.dpi` |
| T8 | apagar `pages[1].frames[1].overflow.minFontSize` (o frame `fixed-shrink`) | contém `missing-field` em `$.pages[1].frames[1].overflow.minFontSize` |
| T9 | `pages[0].frames[0].textStyle = 'inexistente'` | contém `unknown-reference` em `$.pages[0].frames[0].textStyle` |
| T10 | `textStyles['titulo-produto'].basedOn = 'preco-destaque'` (ciclo com `preco-destaque` → `titulo-produto`) | contém `invalid-value` com `path` casando `/^\$\.textStyles\["(titulo-produto\|preco-destaque)"\]\.basedOn$/` |
| T11 | `pages[1].frames[1].id = 'frame-nome-produto'` | contém `duplicate-id` em `$.pages[1].frames[1].id` |
| T12 | `pages[0].frames[0].csvColumn = 'x'` (frame `static`) | contém `unknown-field` em `$.pages[0].frames[0].csvColumn` |
| T13 | `palette.brand[0].hex = 'E63946'` | contém `invalid-value` em `$.palette.brand[0].hex` |
| T14 | T6 + T7 juntos | contém OS DOIS erros (coleta tudo) |
| T15 | `pages[0].frames[1].shape = 'custom-svg'` sem `customSvg` | contém `missing-field` em `$.pages[0].frames[1].customSvg` |
| T16 | `pages[1].frames[2].fallback` = `'C:\\imagens\\x.png'` e, noutro `it`, `'/x.png'` | contém `invalid-value` em `$.pages[1].frames[2].fallback` |
| T17 | `serializeTemplate` com T6 aplicado | lança `TemplateValidationError` com `errors.length >= 1` |
| T18 | `parseTemplate('42')` e `parseTemplate('[]')` | contém `invalid-type` em `$` |
| T19 | `'\uFEFF' + serializeTemplate(exemplo)` | `parseTemplate` dá `ok: true` |

Teste extra seu é bem-vindo; nenhum dos 19 pode sair.

## Edição 6a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-10):** merge do template-update do KCM v1.135.0 com o modo
Code (DEC-012). A seção «📁 Arquivos Críticos» SAIU daqui e foi para o CONTEXT.md (é
conhecimento estável, não estado — regra do template novo). «Notas da Última Sessão» virou
«Última conversa». A contagem do `npm audit` foi atualizada com o número da máquina do dono.
Nenhum item de backlog mudou.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-11):** wo0001 aplicada — `TemplateSerializer.ts` +
`TemplateValidator.ts` + suíte Vitest (DEC-013). Saíram de «Em Progresso» o commit do merge
(feito: `222c5f8`) e o serializer (feito); backlog avança para `StyleRegistry.ts` e ganha a
sanitização de `customSvg`; «Testes» deixa de dizer 0%; a contagem de ADRs deixou de ser número
congelado. A nota de 2026-11-10 saiu — o merge que ela descrevia está em DEC-012.
```

## Edição 6b — `meta/STATUS.md` · contagem de ADRs

**Âncora:**

```
- **Decisões técnicas registradas** — 11 ADRs documentados no DECISIONS.md
```

**Substituir por:**

```
- **Decisões técnicas registradas** — ADRs DEC-NNN e FIX-NNN no DECISIONS.md (conte lá; o número não se repete aqui)
```

## Edição 6c — `meta/STATUS.md` · Funcionando

**Âncora** (linha inteira):

```
- **Modo Code instalado** — `CLAUDE.md` na raiz, `.claude/settings.json`, skills `/apply-wo`, `/wrap` e `/sondar`, modelo de WO em `meta/workorders/`
```

**Substituir por:**

```
- **Modo Code instalado** — `CLAUDE.md` na raiz, `.claude/settings.json`, skills `/apply-wo`, `/wrap` e `/sondar`, modelo de WO em `meta/workorders/`
- **Salvar/abrir `.editx`** — `TemplateSerializer.ts` (`serializeTemplate`, `parseTemplate`) + `TemplateValidator.ts` (`validateTemplate`, estrito, erros com caminho `$.…`); suíte Vitest verde (`npm test`) — wo0001, DEC-013
```

## Edição 6d — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
- [ ] **Commit do merge KCM v1.135.0** — arquivos gravados no disco em 2026-11-10, aguardando commit/push do dono
- [ ] **`TemplateSerializer.ts`** — próximo item do backlog: salvar/carregar/validar JSON `.editx` (0%)
```

**Substituir por:**

```
*Nada em progresso — próximo item do backlog é `StyleRegistry.ts`.*
```

## Edição 6e — `meta/STATUS.md` · Backlog, item feito e próximo

**Âncora:**

```
- [ ] `TemplateSerializer.ts` — serialização/deserialização + validação de schema ← **próximo**
- [ ] `StyleRegistry.ts` — estilos globais com herança e observer
```

**Substituir por:**

```
- [x] `TemplateSerializer.ts` — serialização/deserialização + validação de schema (+ `TemplateValidator.ts`, Vitest — wo0001)
- [ ] `StyleRegistry.ts` — estilos globais com herança e observer ← **próximo**
```

## Edição 6f — `meta/STATUS.md` · Backlog, sanitização do SVG

**Âncora** (linha inteira):

```
- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos
```

**Substituir por:**

```
- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos
- [ ] Sanitizar `customSvg` antes do primeiro render de SVG — prometido no JSDoc de `ShapeFrame.customSvg`; fora da wo0001 (o validador só exige presença)
```

## Edição 6g — `meta/STATUS.md` · Testes

**Âncora:**

```
- **Cobertura:** 0% (Vitest ainda não instalado — entra com `TemplateSerializer.ts`, primeiro módulo com lógica de runtime de fato testável)
```

**Substituir por:**

```
- **Suíte:** Vitest (`npm test`, `vitest run`) desde a wo0001 — cobre `TemplateSerializer.ts` e `TemplateValidator.ts`; contagem de testes no relatório da wo0001; cobertura em % não medida (sem `@vitest/coverage-*`)
```

## Edição 6h — `meta/STATUS.md` · Última conversa

**Âncora:**

```
**2026-11-10** — merge do template-update do KCM **v1.135.0** com o **modo Code** (DEC-012).
Gravados direto no disco: `CLAUDE.md`, `.claude/` (settings + 3 skills), `meta/SPEC.md`,
`meta/workorders/_TEMPLATE.md`; CEREBRO fundido (seção ASU removida, carimbo v1.135.0);
INSTRUCOES reescritas pelo esqueleto (7.355 → 5.588 caracteres); 45 trocas sessão→turno/
conversa/dia nos meta/; «Arquivos Críticos» movido para o CONTEXT. Nenhum código tocado.
**Onde parou:** falta o commit (bloco no chat) e colar as INSTRUCOES novas no painel do Projeto.
```

**Substituir por:**

```
**2026-11-11** — primeira WO aplicada pelo Claude Code (wo0001): Vitest instalado, `npm test`,
`TemplateSerializer.ts` + `TemplateValidator.ts` com os 19 casos obrigatórios da WO; ROADMAP F1
acertado (boilerplate, schema e serializer marcados). Detalhe no relatório
`../*-code-editx-apply-wo0001.txt` e em `logs/2026-11-11.md`.
**Onde parou:** próximo item é `StyleRegistry.ts`.
```

## Edição 6i — `meta/STATUS.md` · rodapé

**Âncora:**

```
*Próximo passo: commit deste merge; depois `TemplateSerializer.ts` + setup do Vitest — a primeira
tarefa feita pelo Claude Code, com WO.*
```

**Substituir por:**

```
*Próximo passo: `StyleRegistry.ts` (resolução de `basedOn` em runtime + observer) — WO a escrever pelo chat.*
```

## Edição 7a — `meta/CHANGELOG.md` · Adicionado

**Âncora** (linha inteira, em `[Unreleased]` → `### Adicionado`):

```
- `TemplateSchema.ts` + `frame.types.ts` + `template.types.ts` — schema completo do `.editx` tipado (documento, páginas, 3 tipos de frame, textStyles com herança, csvMapping), com exemplo de validação em `__examples__/`
```

**Substituir por:**

```
- `TemplateSchema.ts` + `frame.types.ts` + `template.types.ts` — schema completo do `.editx` tipado (documento, páginas, 3 tipos de frame, textStyles com herança, csvMapping), com exemplo de validação em `__examples__/`
- `TemplateSerializer.ts` + `TemplateValidator.ts` — salvar e abrir `.editx` com validação estrita (erros com caminho `$.…`, versão de schema explícita, nunca grava arquivo inválido); Vitest 5 configurado (`npm test`). Ver DEC-013
```

## Edição 7b — `meta/CHANGELOG.md` · remover do Planejado

**Remover a linha inteira** (em `### Planejado para v0.1.0 (MVP do editor)`):

```
- `TemplateSerializer.ts` — salvar e carregar arquivos `.editx`
```

## Edição 8 — `meta/DECISIONS.md` · DEC-013

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-013 — Validação do `.editx` escrita à mão, estrita, com Vitest sem configuração

**Data:** 2026-11-11
**Status:** aceita
**Autor:** Claude (chat), dentro do pedido do dono de escrever a wo0001

### Contexto
O `TemplateSerializer.ts` é o primeiro código de runtime e precisa validar arquivo vindo do disco,
que tipo TypeScript não protege. A DEC-009 fez de `TemplateSchema.ts` a fonte única dos tipos.

### Decisão
- Validador **escrito à mão** (`TemplateValidator.ts`), sem biblioteca de schema; **estrito** (chave
  desconhecida é erro), **coleta todos os erros** com caminho estilo JSONPath, e aceita só as versões
  de schema listadas em `SUPPORTED_SCHEMA_VERSIONS`.
- `serializeTemplate` **lança** em template inválido — nunca grava `.editx` inválido.
- **Vitest 5** sem arquivo de configuração: ambiente Node, `*.test.ts` ao lado do módulo, imports
  explícitos de `vitest`, `npm test` = `vitest run`.

### Alternativas consideradas
- **zod / valibot** — o schema da biblioteca viraria a fonte dos tipos (`z.infer`), invertendo a
  DEC-009; trocar a fonte da verdade é decisão do dono, não efeito colateral de uma WO. Adiada com
  gatilho em IDEAS «Adiadas».
- **Validador tolerante (ignora chave desconhecida)** — esconde erro de digitação (`isDatapage` faria
  a página parar de repetir em silêncio); com versão explícita, estrito é seguro.
- **Serializar sem validar** — mais simples para autosave, mas grava arquivo que o próprio app depois
  recusa abrir.

### Consequências
- **Positivas:** zero dependência nova em produção; a DEC-009 continua valendo; erro aponta o lugar exato.
- **Negativas:** duas descrições do mesmo formato (o tipo e o validador) que podem divergir — campo novo
  no schema sem regra no validador faz o `.editx` com esse campo ser REJEITADO (armadilha no CONTEXT).
- **Riscos:** autosave de trabalho incompleto vai esbarrar na validação estrita — quando o editor tiver
  autosave, decidir se ele usa um caminho de rascunho próprio.

---

## Template para novo ADR (copie e preencha)
```

## Edição 9 — `meta/IDEAS.md` · Adiadas

**Âncora:**

```
*Nenhuma ainda.*
```

**Substituir por:**

```
- **Validação do `.editx` por biblioteca de schema (zod/valibot)** — adiada porque faria o schema da
  biblioteca virar a fonte dos tipos, invertendo a DEC-009 (ver DEC-013) — **volta quando** o
  `TemplateValidator.ts` divergir do tipo em produção pela segunda vez, ou passar de ~600 linhas.
```

## Edição 10 — `meta/ROADMAP.md` · F1, itens feitos

**Âncora:**

```
- [ ] Boilerplate: Vite + React + TypeScript + ESLint + Prettier
- [ ] `TemplateSchema.ts` — tipos completos do `.editx`
- [ ] `TemplateSerializer.ts` — serialização/deserialização + validação
```

**Substituir por:**

```
- [x] Boilerplate: Vite + React + TypeScript + ESLint + Prettier
- [x] `TemplateSchema.ts` — tipos completos do `.editx`
- [x] `TemplateSerializer.ts` — serialização/deserialização + validação
```

## Edição 11 — `logs/2026-11-11.md` · seção do Code

**Âncora** (última linha do arquivo):

```
wo0001 escrita e gravada; aguardando `/apply-wo` no Claude Code.
```

**Substituir por:** a mesma linha, depois uma linha em branco, depois uma seção `## Code (execução) — wo0001` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md` (Feito, Problemas, Arquivos modificados, Aprendizados, Onde parei) — só o que você viu ao aplicar. Não reescreva a seção do chat.

---

## Fora de escopo

- Sanitizar o conteúdo de `customSvg` (vira item de backlog na Edição 6f — exige biblioteca e decisão de segurança próprias).
- Migração entre versões de schema (não há segunda versão ainda).
- Ler/gravar arquivo de verdade (File System Access API, Tauri): o serializer trabalha com `string`.
- Resolver herança de `basedOn` (é o `StyleRegistry.ts`); aqui só existência e ciclo.
- Mexer em `TemplateSchema.ts`, `frame.types.ts`, `template.types.ts` ou no exemplo. Se o exemplo não passar em T1, **PARE e reporte** — o defeito pode estar na regra.
- CI, cobertura em %, `vitest.config.ts`.

## Armadilhas desta WO

- **`tsconfig.app.json` tem `erasableSyntaxOnly: true`:** nada de `enum`, `namespace` nem *parameter properties* (`constructor(readonly errors: …)`). Em `TemplateValidationError`, declare o campo e atribua no corpo do construtor.
- **`verbatimModuleSyntax: true`:** tipo importado só como tipo vai em `import type`; misturar quebra o `tsc -b`.
- **Os testes ficam em `src/`, então o `npm run build` (`tsc -b`) os checa por tipo** — teste com tipo errado derruba o build, não só o `npm test`.
- **`npm run format` reescreve todo `src/**/*.{ts,tsx}`.** Rode-o e confira no `git diff` que ele só tocou os 3 arquivos novos; se tocar arquivo existente, reverta esse arquivo e diga no relatório.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short` mostra **exatamente**, e nada além:
      `M .claude/settings.json`, `M CLAUDE.md`, `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/IDEAS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M package-lock.json`, `M package.json`, `?? logs/2026-11-11.md`, `?? meta/workorders/261111-wo0001-template-serializer-vitest.md`, `?? src/template/TemplateSerializer.test.ts`, `?? src/template/TemplateSerializer.ts`, `?? src/template/TemplateValidator.ts` (e `?? src/template/FrameValidator.ts` só se você extraiu). Um arquivo a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros (ou o mesmo baseline da Edição 0, sem erro novo). Cole a saída crua.
- [ ] `npm run build` — passa. Cole a última linha crua.
- [ ] `npm test` — passa, com **pelo menos 19 testes**. Cole a linha de resumo crua do Vitest (`Tests  N passed`). Piso: menos de 19 = **VERMELHO**.
- [ ] **Prova de vida (par negativo):** desligue temporariamente a regra R9 (`fixed-shrink` sem `minFontSize`), rode `npm test` e confirme que **o T8 falha** — cole a linha crua de falha —, restaure a regra e rode de novo até verde. Se o T8 passar com a regra desligada, o teste não testa a regra: **VERMELHO**.
      - **Quem roda:** quem aplica. **Chega no ramo?** `TemplateSerializer.test.ts` → `validateTemplate` → a checagem de `overflow` em `TemplateValidator.ts`. **Pergunta que este passo NÃO responde:** se as outras 14 regras estão certas — só prova que a suíte morde de verdade.
- [ ] Conferências dos meta (padrões recortados das âncoras e dos textos acima; contagem de LINHAS com `grep -c`):
      - `grep -c "^- \[ \] \*\*Commit do merge" meta/STATUS.md` = 0
      - `grep -c "^- \[ \] \`TemplateSerializer.ts\`" meta/STATUS.md meta/ROADMAP.md` = 0 e 0
      - `grep -c "^- \[x\] \`TemplateSerializer.ts\`" meta/STATUS.md meta/ROADMAP.md` = 1 e 1
      - `grep -c "^- \`TemplateSerializer.ts\` — salvar e carregar" meta/CHANGELOG.md` = 0
      - `grep -c "^## DEC-013" meta/DECISIONS.md` = 1
      - `grep -c "^## Template para novo ADR" meta/DECISIONS.md` = 1
      - `grep -c "^\*Nenhuma ainda\.\*" meta/IDEAS.md` = 0
      - `grep -c '"test": "vitest run"' package.json` = 1
      - `grep -c "^## Code (execução) — wo0001" logs/2026-11-11.md` = 1
      *(comandos escritos pelo chat e não testados no seu shell — vermelho aqui é suspeita do instrumento antes de ser da aplicação: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo (processo do Vitest em watch, arquivo temporário). `vitest run` não fica residente.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0001.txt` (`date +%y%m%d-%H%M`, na hora). Inclua: a versão do `vitest` que o npm de fato instalou (`npm ls vitest`, cru); o número de linhas de cada arquivo novo (`wc -l`); se extraiu `FrameValidator.ts`; e qualquer regra das 15 que você achou ambígua e como resolveu.

## Commit — blocos separados, mensagem SEM acento

```
git add .claude/settings.json CLAUDE.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md package.json package-lock.json logs/2026-11-11.md meta/workorders/261111-wo0001-template-serializer-vitest.md src/template/TemplateSerializer.ts src/template/TemplateValidator.ts src/template/TemplateSerializer.test.ts
```

(Se extraiu, acrescente `src/template/FrameValidator.ts`.)

```
git commit -m "feat(template): cria TemplateSerializer e TemplateValidator com suite Vitest" -m "Valida o editx de forma estrita, coletando todos os erros com caminho JSONPath, aceita so versoes de schema listadas e nunca serializa template invalido. Instala Vitest 5 sem arquivo de config e adiciona npm test. Registra DEC-013, atualiza STATUS, CHANGELOG, IDEAS e ROADMAP (wo0001)."
```

```
git push
```
