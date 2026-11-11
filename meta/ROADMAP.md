# ROADMAP.md — Plano Intencional de Evolução

> Cada fase tem um objetivo e um critério de conclusão. Estado: 🟢 concluída · 🟡 em curso/próxima · 🔵 futura · 🚫 descartada.
> Médio e longo prazo vivem AQUI, não no STATUS.

**Mudanças nesta revisão (2026-07-11):** arquivo estava vazio (nunca preenchido). Recebeu
o plano de 5 fases que antes estava incorretamente hospedado em STATUS.md → "Backlog por
Fase" — nada foi inventado, é o mesmo conteúdo, só realocado para o arquivo certo.

---

## 🟢 F0 — Arquitetura e Documentação *(concluída)*

**Objetivo:** Definir visão de produto, stack tecnológica, schema completo do `.editx`,
estrutura de pastas e um sistema de documentação operacional que sobrevive entre sessões.
**Critério de conclusão:** CONTEXT/STATUS/CHANGELOG/DECISIONS/IDEAS criados e coerentes;
schema `.editx` especificado por completo; decisões técnicas centrais registradas.
- Concepção de produto e stack tecnológica (ver CHANGELOG [0.0.0])
- Schema `.editx` completo (documento, páginas, 4 tipos de frame, textStyles, csvMapping)
- 10 ADRs registrados em DECISIONS.md
- Sistema de documentação alinhado ao template-update do KCM

---

## 🟡 F1 — MVP do Editor *(próxima / em curso)*

**Objetivo:** Ter um editor funcional de ponta a ponta — canvas com frames de texto e
imagem, importação de CSV, mapeamento básico, geração de PNG em lote.
**Critério de conclusão:** um usuário consegue criar um template simples, importar um
CSV pequeno, mapear colunas e gerar N arquivos PNG sem travar a UI.
**Estimativa:** 3–4 meses (solo).
- [x] Boilerplate: Vite + React + TypeScript + ESLint + Prettier
- [x] `TemplateSchema.ts` — tipos completos do `.editx`
- [x] `TemplateSerializer.ts` — serialização/deserialização + validação
- [x] `StyleRegistry.ts` — estilos globais com herança (funções puras, DEC-015)
- [ ] `CanvasEngine.ts` — wrapper Fabric.js
- [ ] `FrameText.ts` — overflow básico (grow-vertical, fixed-clip)
- [ ] `FrameImage.ts` — fit modes
- [ ] `FrameShape.ts` — retângulo, elipse, linha
- [ ] `SelectionManager.ts` — seleção, mover, redimensionar
- [ ] Stores: `documentStore`, `selectionStore`, `historyStore`
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList
- [ ] `CsvParser.ts` + `ColumnMapper.ts` básico
- [ ] `BatchGenerator.ts` em Web Worker (PNG)
- [ ] Exportação PNG básica por frame

---

## 🔵 F2 — Tipografia e Estilos Avançados *(futuro)*

**Objetivo:** Cobrir os 4 modos de overflow por completo e dar controle profissional de
tipografia e paleta ao usuário.
- Modos `grow-horizontal` e `fixed-shrink`
- Upload de fontes customizadas (TTF/OTF via opentype.js)
- UI de estilos de texto (criar, editar, aplicar em massa)
- Painel de paleta de cores e temas da marca

---

## 🔵 F3 — Geração em Massa Robusta *(futuro)*

**Objetivo:** Tornar a geração em lote confiável em escala (200–500+ linhas de CSV) e
com boa experiência de preview/erro.
- `ImageResolver.ts` com busca por nome exato + fallback
- `BatchPreview.tsx` — preview dos N primeiros antes de gerar
- `ZipPacker.ts` — exportação ZIP com nomes personalizados (`outputNaming`)
- Filtro de linhas do CSV na UI (`skipRowsWhere`)
- Progresso de geração em tempo real via `postMessage` do Worker

---

## 🔵 F4 — Tipos Editoriais Avançados *(futuro)*

**Objetivo:** Suportar os formatos editoriais que diferenciam o produto de um editor
genérico: catálogos multipágina, PDFs com índice, menus dobráveis.
- `PdfExporter.ts` — PDF multipáginas com índice automático
- Suporte a C-fold e Z-fold (guias de dobra, painéis corretos)
- Catálogo multipáginas (capa estática + loop de página de produto via `isDataPage`)
- Menu imprimível com marcas de corte e sangria

---

## 🔵 F5 — Desktop *(futuro)*

**Objetivo:** Versão desktop com acesso direto ao sistema de arquivos, sem upload manual
de imagens.
- Integração Tauri 2.x
- Acesso direto à pasta de imagens local
- Menu nativo do SO, atalhos de teclado

---

## 🚫 Itens descartados desta visão

*Nenhum item de escopo descartado até o momento.* Alternativas técnicas descartadas
(Konva.js, Electron, jsPDF, base64 sempre, Context API, Redux Toolkit) estão registradas
em IDEAS.md → "🚫 Ideias Descartadas", por serem decisões de implementação, não de escopo
de produto.
