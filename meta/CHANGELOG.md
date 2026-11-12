# CHANGELOG.md — EditX

> Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/)
> Versionamento: [Semantic Versioning](https://semver.org/lang/pt-BR/)
>
> **MAJOR.MINOR.PATCH**
> - MAJOR: mudança que quebra compatibilidade com arquivos `.editx` existentes
> - MINOR: nova funcionalidade (novo tipo de frame, novo modo de exportação, etc.)
> - PATCH: correção de bug sem quebrar compatibilidade

**Mudanças nesta revisão (2026-11-10):** nova seção «Modificado» em [Unreleased] com o merge do
KCM v1.135.0 (modo Code). Nenhuma versão lançada. A nota de 2026-07-24 saiu (o que ela dizia
está nas entradas «Adicionado» abaixo).

---

## [Unreleased] — Em desenvolvimento

### Adicionado
- Boilerplate do projeto: Vite 8 + React 19 + TypeScript 6, ESLint 9 (flat config) + Prettier
- `TemplateSchema.ts` + `frame.types.ts` + `template.types.ts` — schema completo do `.editx` tipado (documento, páginas, 3 tipos de frame, textStyles com herança, csvMapping), com exemplo de validação em `__examples__/`
- `TemplateSerializer.ts` + `TemplateValidator.ts` — salvar e abrir `.editx` com validação estrita (erros com caminho `$.…`, versão de schema explícita, nunca grava arquivo inválido); Vitest 5 configurado (`npm test`). Ver DEC-013
- `StyleRegistry.ts` — estilo de texto final resolvido pela cadeia de `basedOn` (`resolveStyle`, com cache por mapa), estilos derivados (`dependentsOf`) e edição do mapa sem quebrar a herança (`setStyle`/`removeStyle`); funções puras sobre o mapa do documento. Ver DEC-015
- `CanvasEngine.ts` + `PageGeometry.ts` + `ui/CanvasView.tsx` — a página do documento aparece no canvas (área de corte, guia de sangria, zoom para caber, reenquadra ao redimensionar); o app deixa de ser o scaffold do Vite. Ver DEC-016

### Corrigido
- Página em branco no `npm run dev`: a limpeza do `CanvasView` removia por diferença de filhos e apagava o canvas da 2ª montagem (StrictMode); agora remove só o próprio `<canvas>`. Ver FIX-001

### Modificado
- Documentação e ferramentas alinhadas ao KCM v1.135.0 com modo Code: `CLAUDE.md`, `.claude/`
  (settings + skills `apply-wo`/`wrap`/`sondar`), `meta/workorders/_TEMPLATE.md`, `meta/SPEC.md`;
  CEREBRO fundido (seção ASU removida), INSTRUCOES reescritas (7.355 → 5.588 caracteres), cadência
  por turno/evento no lugar de «por sessão». Ver DEC-012.
- Formato `.editx` (`0.1.0`, ainda não lançado): `TextStyle` passa a ser raiz completo
  (`basedOn: null`) ou derivado só com as diferenças (`basedOn: "<pai>"`); novo tipo
  `TextStyleProps`. Motor do validador extraído para `ValidationRules.ts`. Ver DEC-014.

### Notas
- Sistema de documentação atualizado via template-update do KCM: backlog de fases
  migrado de STATUS.md para ROADMAP.md, IDEAS.md reestruturado em Ativas/Concluídas/
  Descartadas, GLOSSARY.md populado, HISTORICO.md renomeado para HISTORY.md, CEREBRO.md e
  instruções do projeto atualizados com protocolo mais recente. Ver DEC-010.
- Versões de dependências instaladas divergem das documentadas originalmente em maio
  (React 19/Vite 8/TS 6, não 18/5/5.4) — aceito como atualização natural do ecossistema,
  não regressão. ESLint fixado em 9.x (não 10.x) por incompatibilidade real com
  `eslint-plugin-react-hooks`. Ver DEC-011.

### Planejado para v0.1.0 (MVP do editor)
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
