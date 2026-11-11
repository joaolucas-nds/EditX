# STATUS.md — Estado Atual do Projeto EditX

> Atualizado a cada turno que muda o estado do projeto.
> Este é o "estado da arte" — o que está funcionando, o que não está, o que vem a seguir.

**Mudanças nesta revisão (2026-11-10):** merge do template-update do KCM v1.135.0 com o modo
Code (DEC-012). A seção «📁 Arquivos Críticos» SAIU daqui e foi para o CONTEXT.md (é
conhecimento estável, não estado — regra do template novo). «Notas da Última Sessão» virou
«Última conversa». A contagem do `npm audit` foi atualizada com o número da máquina do dono.
Nenhum item de backlog mudou.

---

## Versão Atual

**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 2 de 14 itens prontos)

---

## ✅ Funcionando / Concluído

- **Arquitetura definida** — stack tecnológica decidida, estrutura de pastas projetada
- **Schema `.editx` desenhado e IMPLEMENTADO** — `TemplateSchema.ts` (documento raiz + CSV mapping) e `frame.types.ts` (frames/overflow/estilos) com tipos TypeScript completos, zero `any`, JSDoc em cada export público
- **Boilerplate do projeto criado** — Vite 8 + React 19 + TypeScript 6, ESLint 9 (flat config) + Prettier configurados, todas as dependências de CONTEXT.md instaladas
- **Schema validado por exemplo real** — `src/template/__examples__/catalogo-simples.example.ts` satisfaz `EditxTemplate` de ponta a ponta (2 páginas, 3 tipos de frame, herança de estilo via `basedOn`, `isDataPage`, `csvMapping` completo) — compila limpo, passa lint, `npm run build` funciona
- **Motor de overflow de texto especificado** — 4 modos: `grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip` (tipos prontos em `frame.types.ts`; lógica de runtime ainda não implementada — é o `FrameText.ts`, mais à frente no backlog)
- **Sistema de estilos de texto especificado** — herança via `basedOn` tipada; `StyleRegistry.ts` (observer pattern que resolve a herança em runtime) ainda não implementado
- **Mapeamento CSV especificado e tipado** — colunas tipadas, formatadores (currency, date, uppercase), filtro de linhas, padrão de nomenclatura de saída (`outputNaming`)
- **Decisões técnicas registradas** — 11 ADRs documentados no DECISIONS.md
- **Sistema de documentação operacional** — CONTEXT/STATUS/CHANGELOG/DECISIONS/IDEAS/ROADMAP/GLOSSARY/HISTORY, alinhado ao KCM v1.135.0
- **Modo Code instalado** — `CLAUDE.md` na raiz, `.claude/settings.json`, skills `/apply-wo`, `/wrap` e `/sondar`, modelo de WO em `meta/workorders/`

---

## 🔧 Em Progresso

- [ ] **Commit do merge KCM v1.135.0** — arquivos gravados no disco em 2026-11-10, aguardando commit/push do dono
- [ ] **`TemplateSerializer.ts`** — próximo item do backlog: salvar/carregar/validar JSON `.editx` (0%)

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
- [ ] `TemplateSerializer.ts` — serialização/deserialização + validação de schema ← **próximo**
- [ ] `StyleRegistry.ts` — estilos globais com herança e observer
- [ ] `CanvasEngine.ts` — wrapper Fabric.js com eventos e ciclo de vida
- [ ] `FrameText.ts` — frame de texto com overflow básico (grow-vertical e fixed-clip primeiro)
- [ ] `FrameImage.ts` — frame de imagem com fit modes
- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos
- [ ] `SelectionManager.ts` — seleção simples, mover, redimensionar
- [ ] `documentStore.ts` + `selectionStore.ts` + `historyStore.ts`
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada)
- [ ] `CsvParser.ts` + `ColumnMapper.ts` básico
- [ ] `BatchGenerator.ts` em Web Worker (PNG por enquanto)
- [ ] Exportação PNG básica por frame

---

## 🧪 Testes

- **Cobertura:** 0% (Vitest ainda não instalado — entra com `TemplateSerializer.ts`, primeiro módulo com lógica de runtime de fato testável)
- **Validação atual do schema:** compilação limpa (`tsc --noEmit`) do exemplo em `__examples__/` — prova que o schema é ergonômico, mas não substitui testes automatizados quando houver lógica
- **Estratégia planejada:** Vitest para lógica de negócio (serialização, overflow engine, CSV parser); sem testes de UI no MVP
- **Módulos críticos que PRECISAM de testes:**
  - `TemplateSerializer.ts` — qualquer bug aqui corrompe arquivos de template
  - `FrameText.ts` — lógica de overflow é sensível a edge cases (texto vazio, texto muito longo, font-size mínimo)
  - `CsvParser.ts` — CSV com aspas, delimitadores internos, encoding UTF-8 com BOM

---

## 💬 Última conversa

**2026-11-10** — merge do template-update do KCM **v1.135.0** com o **modo Code** (DEC-012).
Gravados direto no disco: `CLAUDE.md`, `.claude/` (settings + 3 skills), `meta/SPEC.md`,
`meta/workorders/_TEMPLATE.md`; CEREBRO fundido (seção ASU removida, carimbo v1.135.0);
INSTRUCOES reescritas pelo esqueleto (7.355 → 5.588 caracteres); 45 trocas sessão→turno/
conversa/dia nos meta/; «Arquivos Críticos» movido para o CONTEXT. Nenhum código tocado.
**Onde parou:** falta o commit (bloco no chat) e colar as INSTRUCOES novas no painel do Projeto.

---

*Próximo passo: commit deste merge; depois `TemplateSerializer.ts` + setup do Vitest — a primeira
tarefa feita pelo Claude Code, com WO.*
