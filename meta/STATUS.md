# STATUS.md — Estado Atual do Projeto EditX

> Atualizado a cada sessão de desenvolvimento.
> Este é o "estado da arte" — o que está funcionando, o que não está, o que vem a seguir.

**Mudanças nesta revisão (2026-07-11):** a seção "Backlog por Fase" (Fases 1–5) foi
**movida para o ROADMAP.md** — é plano de médio/longo prazo, e por regra de higiene do
projeto (CEREBRO.md) não deve viver aqui. STATUS agora traz só a Fase 1 como backlog
curto e acionável — o que dá pra pegar já na próxima sessão. Nada foi perdido: as Fases
2–5 estão completas no ROADMAP.md.

---

## Versão Atual

**v0.0.0** — 2026-05-24 (pré-boilerplate, fase de arquitetura)

---

## ✅ Funcionando / Concluído

- **Arquitetura definida** — stack tecnológica decidida, estrutura de pastas projetada
- **Schema `.editx` desenhado** — formato JSON completo especificado (tipos, páginas, frames, estilos, mapeamento CSV)
- **Motor de overflow de texto especificado** — 4 modos: `grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip`
- **Sistema de estilos de texto especificado** — herança via `basedOn`, observer pattern para propagação automática
- **Mapeamento CSV especificado** — colunas tipadas, formatadores (currency, date, uppercase), filtro de linhas, padrão de nomenclatura de saída (`outputNaming`)
- **Decisões técnicas registradas** — 10 ADRs documentados no DECISIONS.md
- **Sistema de documentação operacional** — CONTEXT/STATUS/CHANGELOG/DECISIONS/IDEAS/ROADMAP/GLOSSARY/HISTORY, alinhado ao template-update do KCM

---

## 🔧 Em Progresso

*Nada em progresso no momento — a sessão atual foi de organização de documentação. Próximo passo é iniciar a Fase 1 (ver backlog abaixo).*

---

## ❌ Quebrado / Com Problema

*Nenhum — projeto ainda não tem código de produção.*

---

## 📋 Backlog (curto prazo — Fase 1, MVP do Editor)

> Plano completo de médio/longo prazo (Fases 2–5) está no ROADMAP.md.
> Aqui só o que é acionável já nas próximas sessões, em ordem de dependência.

- [ ] Boilerplate: Vite + React + TypeScript + ESLint + Prettier
- [ ] `TemplateSchema.ts` — tipos completos do `.editx`
- [ ] `TemplateSerializer.ts` — serialização/deserialização + validação de schema
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

- **Cobertura:** 0% (sem código ainda)
- **Estratégia planejada:** Vitest para lógica de negócio (serialização, overflow engine, CSV parser); sem testes de UI no MVP
- **Módulos críticos que PRECISAM de testes:**
  - `FrameText.ts` — lógica de overflow é sensível a edge cases (texto vazio, texto muito longo, font-size mínimo)
  - `TemplateSerializer.ts` — qualquer bug aqui corrompe arquivos de template
  - `CsvParser.ts` — CSV com aspas, delimitadores internos, encoding UTF-8 com BOM

---

## 📁 Arquivos Críticos (não mexer sem contexto)

| Arquivo | Por que é crítico |
|---|---|
| `src/types/template.types.ts` | É o contrato entre todos os módulos. Mudança de tipo quebra serialização de arquivos existentes |
| `src/template/TemplateSerializer.ts` | Qualquer bug corromperia arquivos `.editx` de usuários. Requer testes antes de qualquer mudança |
| `src/canvas/FrameText.ts` | Motor de overflow customizado. Lógica complexa de métricas de texto — mudanças exigem re-teste visual |

---

## 💬 Notas da Última Sessão

**Data:** 2026-07-11

**O que foi feito:** Integração de um template-update do KCM (nicho Desenvolvimento). Comparação de 13 arquivos do pacote contra os equivalentes vivos do projeto, com relatório de novidades/choques/exclusividades. Após aprovação do usuário, aplicado merge completo: backlog de fases migrado do STATUS para o ROADMAP (antes vazio); IDEAS reestruturado em Ativas/Concluídas/Descartadas; DECISIONS ganhou template de FIX-N e um novo DEC-010 registrando este próprio desvio; GLOSSARY populado com termos do projeto; HISTORICO.md renomeado para HISTORY.md (padronização de nomes em inglês); CEREBRO.md e as instruções do projeto receberam 3 seções novas (ritual de leitura de mount, recomendação de configuração, ASU detalhado); `.gitignore` e `.flatdropignore` adotados. Nenhum código de produção foi escrito nesta sessão.

**Pendências para próxima sessão:** Implementar o boilerplate do projeto e o `TemplateSchema.ts` (primeiro item do backlog acima). Comentários profissionais de código (docstrings) ficam para quando houver código — nada a comentar ainda.

---

*Próxima sessão deve começar por: `npm create vite@latest editor-editorial -- --template react-ts` e implementação do `TemplateSchema.ts`*
