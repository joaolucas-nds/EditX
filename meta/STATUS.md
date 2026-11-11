# STATUS.md — Estado Atual do Projeto EditX

> Atualizado a cada turno que muda o estado do projeto.
> Este é o "estado da arte" — o que está funcionando, o que não está, o que vem a seguir.

**Mudanças nesta revisão (2026-11-11, wo0002):** herança de estilos decidida e aplicada no formato
(estilo derivado guarda só as diferenças — DEC-014); «Sistema de estilos» e «Estratégia» de testes
atualizados; «Última conversa» passa à wo0002. Nenhum item de backlog fechou: o `StyleRegistry.ts`
continua o próximo (wo0003). A nota anterior (wo0001) saiu — o que ela registrava está em DEC-013.

---

## Versão Atual

**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 3 de 14 itens prontos)

---

## ✅ Funcionando / Concluído

- **Arquitetura definida** — stack tecnológica decidida, estrutura de pastas projetada
- **Schema `.editx` desenhado e IMPLEMENTADO** — `TemplateSchema.ts` (documento raiz + CSV mapping) e `frame.types.ts` (frames/overflow/estilos) com tipos TypeScript completos, zero `any`, JSDoc em cada export público
- **Boilerplate do projeto criado** — Vite 8 + React 19 + TypeScript 6, ESLint 9 (flat config) + Prettier configurados, todas as dependências de CONTEXT.md instaladas
- **Schema validado por exemplo real** — `src/template/__examples__/catalogo-simples.example.ts` satisfaz `EditxTemplate` de ponta a ponta (2 páginas, 3 tipos de frame, herança de estilo via `basedOn`, `isDataPage`, `csvMapping` completo) — compila limpo, passa lint, `npm run build` funciona
- **Motor de overflow de texto especificado** — 4 modos: `grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip` (tipos prontos em `frame.types.ts`; lógica de runtime ainda não implementada — é o `FrameText.ts`, mais à frente no backlog)
- **Sistema de estilos de texto especificado e validado** — `TextStyle` é raiz (completo, `basedOn: null`) ou derivado (só as diferenças, `basedOn: "<pai>"`), DEC-014; o validador cobra as duas formas. `StyleRegistry.ts` (resolve a cadeia em runtime + observer) ainda não implementado — wo0003
- **Mapeamento CSV especificado e tipado** — colunas tipadas, formatadores (currency, date, uppercase), filtro de linhas, padrão de nomenclatura de saída (`outputNaming`)
- **Decisões técnicas registradas** — ADRs DEC-NNN e FIX-NNN no DECISIONS.md (conte lá; o número não se repete aqui)
- **Sistema de documentação operacional** — CONTEXT/STATUS/CHANGELOG/DECISIONS/IDEAS/ROADMAP/GLOSSARY/HISTORY, alinhado ao KCM v1.135.0
- **Modo Code instalado** — `CLAUDE.md` na raiz, `.claude/settings.json`, skills `/apply-wo`, `/wrap` e `/sondar`, modelo de WO em `meta/workorders/`
- **Salvar/abrir `.editx`** — `TemplateSerializer.ts` (`serializeTemplate`, `parseTemplate`) + `TemplateValidator.ts` (`validateTemplate`, estrito, erros com caminho `$.…`); suíte Vitest verde (`npm test`) — wo0001, DEC-013

---

## 🔧 Em Progresso

*Nada em progresso — próximo item do backlog é `StyleRegistry.ts`.*

---

## ❌ Quebrado / Com Problema

*Nenhum bug — projeto compila, lint passa, build de produção funciona.* Dois avisos
não-bloqueantes valem registro (não são bugs do projeto, são de dependências de
terceiros — ver DEC-011 e as armadilhas correspondentes em CONTEXT.md):
- `npm audit` na máquina do dono: **6 vulnerabilidades (5 altas, 1 crítica)** [relatado pelo dono —
  saída do `npm install` de 2026-09-03, arquivada em `notas-arquivadas/260903-0147.txt`]; no sandbox
  de 2026-07-24 eram 11. As cadeias conhecidas (`fabric`→`canvas`/`jsdom`→`tar` e
  `eslint@9`→`minimatch`→`brace-expansion`) são inertes para o nosso código — quais delas compõem
  as 6 não foi reconferido (rode `npm audit` para ver)

---

## 📋 Backlog (curto prazo — Fase 1, MVP do Editor)

> Plano completo de médio/longo prazo (Fases 2–5) está no ROADMAP.md.
> Aqui só o que é acionável já nos próximos turnos, em ordem de dependência.

- [x] Boilerplate: Vite + React + TypeScript + ESLint + Prettier
- [x] `TemplateSchema.ts` — tipos completos do `.editx`
- [x] `TemplateSerializer.ts` — serialização/deserialização + validação de schema (+ `TemplateValidator.ts`, Vitest — wo0001)
- [ ] `StyleRegistry.ts` — estilos globais com herança e observer ← **próximo**
- [ ] `CanvasEngine.ts` — wrapper Fabric.js com eventos e ciclo de vida
- [ ] `FrameText.ts` — frame de texto com overflow básico (grow-vertical e fixed-clip primeiro)
- [ ] `FrameImage.ts` — frame de imagem com fit modes
- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos
- [ ] Sanitizar `customSvg` antes do primeiro render de SVG — prometido no JSDoc de `ShapeFrame.customSvg`; fora da wo0001 (o validador só exige presença)
- [ ] `SelectionManager.ts` — seleção simples, mover, redimensionar
- [ ] `documentStore.ts` + `selectionStore.ts` + `historyStore.ts`
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada)
- [ ] `CsvParser.ts` + `ColumnMapper.ts` básico
- [ ] `BatchGenerator.ts` em Web Worker (PNG por enquanto)
- [ ] Exportação PNG básica por frame

---

## 🧪 Testes

- **Suíte:** Vitest (`npm test`, `vitest run`) desde a wo0001 — cobre `TemplateSerializer.ts` e `TemplateValidator.ts`; contagem de testes no relatório da wo0001; cobertura em % não medida (sem `@vitest/coverage-*`)
- **Validação atual do schema:** compilação limpa (`tsc --noEmit`) do exemplo em `__examples__/` — prova que o schema é ergonômico, mas não substitui testes automatizados quando houver lógica
- **Estratégia:** Vitest para lógica de negócio — serialização e validação (feito), herança de estilos, overflow engine e CSV parser (a fazer); sem testes de UI no MVP
- **Módulos críticos que PRECISAM de testes:**
  - `TemplateSerializer.ts` — qualquer bug aqui corrompe arquivos de template
  - `FrameText.ts` — lógica de overflow é sensível a edge cases (texto vazio, texto muito longo, font-size mínimo)
  - `CsvParser.ts` — CSV com aspas, delimitadores internos, encoding UTF-8 com BOM

---

## 💬 Última conversa

**2026-11-11** — wo0001 (serializer + validador + Vitest) e wo0002 (herança de estilos, DEC-014:
`TextStyle` raiz × derivado no tipo, no validador e no exemplo; motor do validador extraído para
`ValidationRules.ts`; scaffold formatado pelo Prettier). Relatórios em `../notas-arquivadas/` e
na pasta-pai; detalhe em `logs/2026-11-11.md`.
**Onde parou:** próximo item é `StyleRegistry.ts` (wo0003).

---

*Próximo passo: `StyleRegistry.ts` (resolução de `basedOn` em runtime + observer) — WO a escrever pelo chat.*
