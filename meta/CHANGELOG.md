# CHANGELOG.md — EditX

> Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/)
> Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)
>
> **MAJOR.MINOR.PATCH**
> - MAJOR: mudança que quebra compatibilidade com arquivos `.editx` existentes
> - MINOR: nova funcionalidade (novo tipo de frame, novo modo de exportação, etc.)
> - PATCH: correção de bug sem quebrar compatibilidade

**Mudanças nesta revisão (2026-07-11):** links atualizados para as versões em PT-BR do
Keep a Changelog e do SemVer (coerente com o projeto ser documentado em português).
Adicionada nota sobre a reorganização de documentação desta sessão em [Unreleased].

---

## [Unreleased] — Em desenvolvimento

### Notas
- Sistema de documentação atualizado via template-update do KCM: backlog de fases
  migrado de STATUS.md para ROADMAP.md, IDEAS.md reestruturado em Ativas/Concluídas/
  Descartadas, GLOSSARY.md populado, HISTORICO.md renomeado para HISTORY.md, CEREBRO.md e
  instruções do projeto atualizados com protocolo mais recente. Nenhuma mudança de
  produto/código — puramente organizacional. Ver DEC-010.

### Planejado para v0.1.0 (MVP do editor)
- Setup inicial do projeto (Vite + React + TypeScript)
- `TemplateSchema.ts` — tipos TypeScript completos do formato `.editx`
- `TemplateSerializer.ts` — salvar e carregar arquivos `.editx`
- `StyleRegistry.ts` — estilos de texto globais com herança
- `CanvasEngine.ts` — wrapper Fabric.js básico
- `FrameText.ts` — frame de texto com modos `grow-vertical` e `fixed-clip`
- `FrameImage.ts` — frame de imagem com fit modes
- `documentStore.ts`, `selectionStore.ts`, `historyStore.ts`
- `CsvParser.ts` — importação e parsing de CSV
- `BatchGenerator.ts` em Web Worker — geração PNG básica
- UI mínima: Toolbar, PropertiesPanel, LayersList

---

## [0.0.0] — 2026-05-24

### Adicionado
- Concepção completa do produto: visão, público-alvo, proposta de valor
- Decisão de stack tecnológica: React + TypeScript + Vite + Fabric.js + Zustand + Immer + pdf-lib + JSZip + PapaParse + opentype.js
- Estrutura de pastas do projeto projetada e documentada
- Schema do arquivo `.editx` especificado:
  - Raiz do documento (metadados, dimensões, paleta, modo de cor, sangria)
  - Frame de texto populável (vem do CSV, com `csvColumn` e `overflow`)
  - Frame de texto estático (digitado no canvas, com `content`)
  - Frame de imagem populável (resolve nome de arquivo → imagem)
  - Frame de forma/ornamento (rect, ellipse, line, polygon, custom-svg)
  - Sistema de `textStyles` com herança via `basedOn`
  - `csvMapping` com colunas tipadas, formatadores e `outputNaming`
- Modos de overflow de texto especificados: `grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip`
- Sistema de estilos de texto globais especificado (observer pattern, herança em cadeia)
- 8 ADRs registrados no DECISIONS.md
- Sistema completo de documentação do projeto (CONTEXT, STATUS, CHANGELOG, DECISIONS, IDEAS, logs)

### Decisões de arquitetura registradas
- Fabric.js escolhido sobre Konva.js (DEC-003)
- Tauri escolhido sobre Electron para desktop (DEC-005)
- Motor de overflow de texto customizado (sem lib existente que resolva) (DEC-006)
- Imagens referenciadas por caminho, não embutidas em base64 (DEC-007)
- BatchGenerator em Web Worker (DEC-008)

### Notas
- Projeto em fase pré-código. Toda a v0.0.0 é arquitetura e documentação.
- Nenhum arquivo de produção existe ainda além da documentação.

---

## Template para nova entrada (copie ao fazer commit/release)

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Adicionado
-

### Alterado
-

### Corrigido
-

### Removido
-

### Notas
- [Observações técnicas, breaking changes para arquivos .editx existentes, instruções de migração]
```

---

> **Workflow Git recomendado:**
>
> ```bash
> # Antes de começar nova feature
> git checkout -b feature/nome-da-feature
>
> # Ao concluir
> git commit -m "feat: adiciona FrameText com overflow grow-vertical"
> git commit -m "fix: corrige cálculo de métricas de texto com opentype.js"
> git commit -m "docs: atualiza CHANGELOG e STATUS"
>
> # Versionar
> git tag v0.1.0
> git push origin main --tags
> ```
>
> **Atenção:** mudanças no schema do `.editx` que quebrem compatibilidade
> com arquivos existentes exigem bump de MAJOR e nota de migração no CHANGELOG.
