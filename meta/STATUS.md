# STATUS.md — Estado Atual do Projeto EditX

> Atualizado a cada sessão de desenvolvimento.
> Este é o "estado da arte" — o que está funcionando, o que não está, o que vem a seguir.

**Mudanças nesta revisão (2026-07-24):** primeira sessão de código real. Boilerplate
(Vite + React + TypeScript) criado e dependências instaladas; `TemplateSchema.ts` +
`frame.types.ts` + `template.types.ts` implementados, com exemplo de validação em
`__examples__/`. Os 2 primeiros itens do backlog saíram da lista de pendências e foram
para "Funcionando". `TemplateSerializer.ts` é o próximo item.

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
- **Sistema de documentação operacional** — CONTEXT/STATUS/CHANGELOG/DECISIONS/IDEAS/ROADMAP/GLOSSARY/HISTORY, alinhado ao template-update do KCM

---

## 🔧 Em Progresso

- [ ] **`TemplateSerializer.ts`** — próximo item do backlog: salvar/carregar/validar JSON `.editx` (0%)

---

## ❌ Quebrado / Com Problema

*Nenhum bug — projeto compila, lint passa, build de produção funciona.* Dois avisos
não-bloqueantes valem registro (não são bugs do projeto, são de dependências de
terceiros — ver DEC-011 e as armadilhas correspondentes em CONTEXT.md):
- `npm audit` reporta ~11 vulnerabilidades (10 altas, 1 crítica), todas em dependências
  opcionais/de desenvolvimento nunca executadas pelo nosso código (cadeia `fabric`→
  `canvas`/`jsdom`→`tar`, e `eslint@9`→`minimatch`→`brace-expansion`)

---

## 📋 Backlog (curto prazo — Fase 1, MVP do Editor)

> Plano completo de médio/longo prazo (Fases 2–5) está no ROADMAP.md.
> Aqui só o que é acionável já nas próximas sessões, em ordem de dependência.

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

## 📁 Arquivos Críticos (não mexer sem contexto)

| Arquivo | Por que é crítico |
|---|---|
| `src/types/template.types.ts` | Fachada de re-export — o contrato que todo o resto do app importa. Mudança de tipo quebra serialização de arquivos existentes |
| `src/template/TemplateSchema.ts` + `src/types/frame.types.ts` | Fonte real dos tipos (DEC-009). `template.types.ts` só reexporta daqui |
| `src/template/TemplateSerializer.ts` | Ainda não existe. Quando existir: qualquer bug corromperia arquivos `.editx` de usuários. Requer testes antes de qualquer mudança |
| `src/canvas/FrameText.ts` | Ainda não existe. Quando existir: motor de overflow customizado, mudanças exigem re-teste visual |

---

## 💬 Notas da Última Sessão

**Data:** 2026-07-24

**O que foi feito:** Primeira sessão de código real do projeto. Criado o boilerplate
(Vite + React + TypeScript) e instaladas todas as dependências de CONTEXT.md. Implementados
`TemplateSchema.ts`, `frame.types.ts` e `template.types.ts` com tipagem completa, JSDoc em
cada export público e um exemplo (`__examples__/catalogo-simples.example.ts`) que valida o
schema por compilação. Configurado ESLint 9 (flat config) + Prettier no lugar do `oxlint`
padrão do scaffold. Descobertas 3 divergências reais entre o documentado e o instalado
(versões React/Vite/TS mais novas; vulnerabilidade inerte fabric→canvas→tar; tentativa de
upgrade do ESLint para v10 testada e revertida por incompatibilidade real com
`eslint-plugin-react-hooks`) — tudo registrado em DEC-011. Corrigido o `.gitignore` padrão
do Vite, que ignorava a pasta `logs/` (versionada de propósito neste projeto).

**Pendências para próxima sessão:** Implementar `TemplateSerializer.ts` (salvar/carregar/
validar `.editx`) — é aí que o Vitest entra pela primeira vez, com testes reais de
serialização/deserialização e validação de schema malformado.

---

*Próxima sessão deve começar por: implementação do `TemplateSerializer.ts` + setup do Vitest*
