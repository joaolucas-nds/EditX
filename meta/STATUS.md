# STATUS.md — Estado Atual do Projeto EditX

> Atualizado a cada turno que muda o estado do projeto.
> Este é o "estado da arte" — o que está funcionando, o que não está, o que vem a seguir.

**Mudanças nesta revisão (2026-11-18, wo0016):** stores do editor feitos (DEC-021) e o backlog reordenado — stores
antes da seleção; conferência de tela pelo chat em «Em Progresso». A nota anterior (wo0015) saiu — o que ela
registrava está no log de 2026-11-18.

---

## Versão Atual

**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 9 de 15 itens prontos)

---

## ✅ Funcionando / Concluído

- **Arquitetura definida** — stack tecnológica decidida, estrutura de pastas projetada
- **Schema `.editx` desenhado e IMPLEMENTADO** — `TemplateSchema.ts` (documento raiz + CSV mapping) e `frame.types.ts` (frames/overflow/estilos) com tipos TypeScript completos, zero `any`, JSDoc em cada export público
- **Boilerplate do projeto criado** — Vite 8 + React 19 + TypeScript 6, ESLint 9 (flat config) + Prettier configurados, todas as dependências de CONTEXT.md instaladas
- **Schema validado por exemplo real** — `src/template/__examples__/catalogo-simples.example.ts` satisfaz `EditxTemplate` de ponta a ponta (2 páginas, 3 tipos de frame, herança de estilo via `basedOn`, `isDataPage`, `csvMapping` completo) — compila limpo, passa lint, `npm run build` funciona
- **Documento nos stores, com desfazer e refazer** *(wo0016, DEC-021; conferência de tela pendente — ver «Em Progresso»)* — `createEditorStores(template)` (`store/documentStore.ts`) guarda uma cópia do template e a página ativa; toda mudança passa por `edit` (`produceWithPatches` do Immer) e entra no `historyStore` (limite 100; mudança vazia não entra); `undo`/`redo` aplicam os patches; `selectionStore` guarda os ids selecionados. Página e seleção não entram no histórico. Primeira ação: `setFrameTransform`. O `App` lê o documento com `useStore`; no `npm run dev` os stores ficam em `window.__editx`. Testado em Node (H1–H13)
- **Forma aparece no canvas** *(wo0014, DEC-020; conferido pelo chat no navegador embutido em 2026-11-18)* — os frames de forma da página viram contorno SVG calculado em `canvas/FrameShape.ts` (puro, testado) e pintado como `Path` (`CanvasEngine.setShapeDrawings`): `rect` com cantos arredondados, `ellipse` e `line` (horizontal, no meio do frame); preenchimento sólido ou nenhum; traço contínuo, tracejado ou pontilhado, por DENTRO do frame. Polígono (sem pontos no formato) e SVG customizado (sem sanitização) saem como retângulo vermelho. Forma, imagem e texto empilham pelo `zIndex` (empate: forma < imagem < texto). `?page=page-capa` na URL mostra a capa. Rotação ainda não é desenhada
- **Imagem aparece no canvas** *(wo0012, DEC-019; conferido pelo chat no navegador embutido em 2026-11-17)* — os frames de imagem da página são lidos por caminho relativo ao `.editx` pelo contrato `ProjectFiles` (`project/ProjectFiles.ts`; no `npm run dev`, `UrlProjectFiles` serve a pasta do exemplo em `public/exemplo/`), decodificados e posicionados pelos 4 `fit` e o `align` (`canvas/ImageLayout.ts`, puro), recortados pelo frame com o raio dos cantos (`CanvasEngine.setImageDrawings`); estático tenta `src` e depois `fallback`, dados usa o `fallback`; sem caminho → área reservada cinza; nada legível → retângulo vermelho. Caminhos passam por `normalizeProjectPath` (`project/ProjectPath.ts`) e o validador recusa `..` que sai da pasta. Rotação ainda não é desenhada
- **Texto aparece no canvas** *(conferido pelo dono na tela em 2026-11-15; nítido em qualquer zoom desde o FIX-002)* — os frames de texto da página são desenhados como contorno das letras gerado pelo `opentype.js` com a mesma medida do motor (`text/TextDrawing.ts` puro + `canvas/FrameText.ts`, testados com a fonte real; `CanvasEngine.setTextDrawings`); frames de dados mostram `{coluna}`; frame com fonte/estilo inválido aparece como retângulo vermelho tracejado — wo0007, DEC-018. Rotação ainda não é desenhada
- **Motor de layout de texto funcionando (puro)** — `src/text/TextLayout.ts`: quebra de linha e os 4 modos (`grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip`), medindo com a fonte real via `opentype.js`; `src/text/FontRegistry.ts` liga família+peso ao `.ttf` (Montserrat 400/600/700/800 em `public/fonts/`) — wo0006, DEC-017. Ainda não desenhado no canvas
- **Herança de estilos de texto funcionando** — `TextStyle` é raiz (completo, `basedOn: null`) ou derivado (só as diferenças), DEC-014; o validador cobra as duas formas; `StyleRegistry.ts` resolve o estilo final (`resolveStyle`) e edita o mapa sem quebrar a herança (`setStyle`/`removeStyle`), funções puras — DEC-015. A propagação NA TELA vem com o `documentStore`
- **Mapeamento CSV especificado e tipado** — colunas tipadas, formatadores (currency, date, uppercase), filtro de linhas, padrão de nomenclatura de saída (`outputNaming`)
- **Decisões técnicas registradas** — ADRs DEC-NNN e FIX-NNN no DECISIONS.md (conte lá; o número não se repete aqui)
- **Sistema de documentação operacional** — CONTEXT/STATUS/CHANGELOG/DECISIONS/IDEAS/ROADMAP/GLOSSARY/HISTORY, alinhado ao KCM v1.135.0
- **Modo Code instalado** — `CLAUDE.md` na raiz, `.claude/settings.json`, skills `/apply-wo`, `/wrap` e `/sondar`, modelo de WO em `meta/workorders/`
- **Salvar/abrir `.editx`** — `TemplateSerializer.ts` (`serializeTemplate`, `parseTemplate`) + `TemplateValidator.ts` (`validateTemplate`, estrito, erros com caminho `$.…`); suíte Vitest verde (`npm test`) — wo0001, DEC-013
- **Canvas mostra a página** *(corrigido na wo0005, FIX-001; conferido pelo dono na tela em 2026-11-12)* — `npm run dev` abre a página do exemplo (área de corte branca + guia de sangria tracejada) centralizada e com zoom para caber, reenquadrando ao redimensionar a janela; `CanvasEngine.ts` (Fabric) + `PageGeometry.ts` (puro, testado) + `ui/CanvasView.tsx` — wo0004, DEC-016. Ainda sem frames. **Nítido em qualquer zoom do navegador**, inclusive trocando o zoom com a página aberta: buffer em px do dispositivo, estilo `100%`, dois `ResizeObserver` (FIX-002, wo0009 + wo0010; conferido pelo chat no navegador embutido em 2026-11-17, em DPR 1 com zoom de CSS — DPR ≠ 1 real não conferido)

---

## 🔧 Em Progresso

- **Conferência de tela dos stores** — o chat confere no navegador embutido com o `npm run dev` do dono rodando: o canvas igual a antes, e pelo console (`window.__editx`) mover um frame, ver o canvas acompanhar, desfazer e refazer. Depois dela, o próximo item do backlog é `SelectionManager.ts`.

---

## ❌ Quebrado / Com Problema

*Nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do
primeiro `npm run dev` (wo0004) foi corrigida na wo0005 (FIX-001) e conferida pelo dono na tela. Dois avisos
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
- [x] `StyleRegistry.ts` — estilos globais com herança (funções puras sobre o mapa do documento — wo0003, DEC-015)
- [x] `CanvasEngine.ts` — wrapper Fabric.js: ciclo de vida, página e zoom (wo0004, DEC-016; eventos de objeto entram com `SelectionManager.ts`)
- [x] `FrameText.ts` — frame de texto desenhado no canvas como contorno das letras (wo0006 + wo0007, DEC-017/DEC-018; conferido pelo dono na tela em 2026-11-15)
- [x] `FrameImage.ts` — frame de imagem com fit modes (wo0012, DEC-019; leitura por `ProjectFiles`, exemplo servido de `public/exemplo/`)
- [x] `FrameShape.ts` — retângulo, elipse, linha básicos (wo0014, DEC-020; polígono e SVG customizado ainda não)
- [ ] Sanitizar `customSvg` antes do primeiro render de SVG — prometido no JSDoc de `ShapeFrame.customSvg`; fora da wo0001 (o validador só exige presença)
- [x] `documentStore.ts` + `selectionStore.ts` + `historyStore.ts` (wo0016, DEC-021 — antes da seleção, por decisão do dono)
- [ ] `SelectionManager.ts` — seleção simples, mover (o conteúdo acompanha), redimensionar (só a caixa até soltar), Ctrl+Z/Ctrl+Shift+Z, cache das imagens decodificadas — DEC-021 ← **próximo**
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada)
- [ ] Abrir projeto = pasta — `ProjectFiles` por `showDirectoryPicker` no Chrome/Edge (handle no IndexedDB, grava o `.editx`) e por `<input webkitdirectory>` no Firefox/Safari (só leitura); junto da UI mínima — DEC-019
- [ ] `CsvParser.ts` + `ColumnMapper.ts` básico
- [ ] `BatchGenerator.ts` em Web Worker (PNG por enquanto)
- [ ] Exportação PNG básica por frame

---

## 🧪 Testes

- **Suíte:** Vitest (`npm test`, `vitest run`) desde a wo0001 — cobre `TemplateSerializer.ts`, `TemplateValidator.ts` e `StyleRegistry.ts`; a contagem sai do `npm test` e do relatório da última WO (não se repete aqui); cobertura em % não medida (sem `@vitest/coverage-*`)
- **Validação atual do schema:** compilação limpa (`tsc --noEmit`) do exemplo em `__examples__/` — prova que o schema é ergonômico, mas não substitui testes automatizados quando houver lógica
- **Estratégia:** Vitest para lógica de negócio — serialização e validação (feito), herança de estilos, overflow engine e CSV parser (a fazer); sem testes de UI no MVP
- **Módulos críticos que PRECISAM de testes:**
  - `TemplateSerializer.ts` — qualquer bug aqui corrompe arquivos de template
  - `FrameText.ts` — lógica de overflow é sensível a edge cases (texto vazio, texto muito longo, font-size mínimo)
  - `CsvParser.ts` — CSV com aspas, delimitadores internos, encoding UTF-8 com BOM

---

## 💬 Última conversa

**2026-11-18** — `FrameShape.ts` (wo0014, DEC-020): retângulo, elipse e linha com o traço por dentro do frame. Detalhe
em `logs/2026-11-18.md`. Antes, em 2026-11-17: FIX-002 fechado, DEC-019 e `FrameImage.ts` conferido (`logs/2026-11-17.md`).
Depois: análise da ordem entre seleção e stores, decidida pelo dono (DEC-021), e os stores (wo0016).
**Onde parou:** wo0016 aplicada; falta a conferência de tela dos stores pelo chat.

---

*Próximo passo: conferência de tela dos stores (chat, navegador embutido); depois, `SelectionManager.ts` — WO a escrever pelo chat.*
