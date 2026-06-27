# STATUS.md — Estado Atual do Projeto EditX

> Atualizado a cada sessão de desenvolvimento.
> Este é o "estado da arte" — o que está funcionando, o que não está, o que vem a seguir.

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
- **Decisões técnicas registradas** — 8 ADRs documentados no DECISIONS.md

---

## 🔧 Em Progresso

- [ ] **Boilerplate do projeto** — criar repositório com Vite + React + TypeScript (0%)
- [ ] **TemplateSchema.ts** — implementar os tipos TypeScript do `.editx` (0%)
- [ ] **TemplateSerializer.ts** — salvar / carregar / validar JSON (0%)

---

## ❌ Quebrado / Com Problema

*Nenhum — projeto ainda não tem código de produção.*

---

## 📋 Backlog por Fase

### Fase 1 — MVP do Editor (estimativa: 3–4 meses solo)

1. Boilerplate: Vite + React + TypeScript + ESLint + Prettier
2. `TemplateSchema.ts` — tipos completos do `.editx`
3. `TemplateSerializer.ts` — serialização/deserialização + validação de schema
4. `StyleRegistry.ts` — estilos globais com herança e observer
5. `CanvasEngine.ts` — wrapper Fabric.js com eventos e ciclo de vida
6. `FrameText.ts` — frame de texto com overflow básico (grow-vertical e fixed-clip primeiro)
7. `FrameImage.ts` — frame de imagem com fit modes
8. `FrameShape.ts` — retângulo, elipse, linha básicos
9. `SelectionManager.ts` — seleção simples, mover, redimensionar
10. `documentStore.ts` + `selectionStore.ts` + `historyStore.ts`
11. UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada)
12. `CsvParser.ts` + `ColumnMapper.ts` básico
13. `BatchGenerator.ts` em Web Worker (PNG por enquanto)
14. Exportação PNG básica por frame

### Fase 2 — Tipografia e Estilos Avançados

- Todos os modos de overflow de texto (grow-horizontal, fixed-shrink)
- Upload de fontes customizadas (TTF/OTF via opentype.js)
- UI de estilos de texto (criar, editar, aplicar em massa)
- Painel de paleta de cores e temas da marca

### Fase 3 — Geração em Massa Robusta

- `ImageResolver.ts` com busca por nome exato + fallback
- `BatchPreview.tsx` — preview dos N primeiros antes de gerar
- `ZipPacker.ts` — exportação ZIP com nomes personalizados
- Filtro de linhas do CSV na UI
- Progresso de geração em tempo real (via postMessage do Worker)

### Fase 4 — Tipos Editoriais Avançados

- `PdfExporter.ts` — PDF multipáginas com índice automático
- Suporte a C-fold e Z-fold (guias de dobra, painéis corretos)
- Catálogo multipáginas (página de capa + loop de página de produto)
- Menu imprimível com marcas de corte e sangria

### Fase 5 — Desktop

- Integração Tauri 2.x
- Acesso direto ao sistema de arquivos (sem upload manual de imagens)
- Menu nativo do SO, atalhos de teclado

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

**Data:** 2026-05-24

**O que foi feito:** Sessão de concepção e arquitetura completa. Definiu-se a visão do produto, stack tecnológica, estrutura de pastas, schema completo do `.editx`, decisões técnicas (ADRs), e inicialização da documentação do projeto.

**Pendências para próxima sessão:** Implementar o boilerplate do projeto e o `TemplateSchema.ts`.

---

*Próxima sessão deve começar por: `npm create vite@latest editor-editorial -- --template react-ts` e implementação do `TemplateSchema.ts`*
