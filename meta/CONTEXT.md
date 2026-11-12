# CONTEXT.md — EditX — Editor Editorial em Massa

> Este arquivo é lido pelo Claude no início de cada nova conversa.
> Atualize quando o que o projeto É mudar (stack, estrutura, armadilha nova) — não a cada turno.

**Mudanças nesta revisão (2026-11-12, wo0005):** armadilha nova do `dispose()` do Fabric (devolve o
`<canvas>` original na hora e só resolve depois do próximo quadro), que deixou a página em branco no
primeiro `npm run dev` — FIX-001. A nota anterior (wo0004: `PageGeometry.ts`, `CanvasView.tsx`, duas
armadilhas do Fabric) saiu — está em DEC-016 e no corpo deste arquivo.

---

## Visão Geral

**O que é:** EditX é um editor editorial visual (estilo Canva/Figma) especializado em
geração em massa de materiais gráficos para varejo, food service e gráficas. O usuário
cria templates visuais no canvas, importa dados via CSV e o sistema gera automaticamente
N arquivos prontos — um por linha do CSV — com texto e imagens populados.

**Para quem:** Pequenos e médios negócios (supermercados, restaurantes, padarias,
gráficas), profissionais de marketing que produzem materiais editoriais em volume:
catálogos de produto, cartazes de oferta, cardápios, stories digitais, menus dobráveis
(C-fold, Z-fold) e PDFs com índice.

**Objetivo atual:** Fase 1 (MVP do editor). Existem o schema do `.editx`, o
serializer/validador com testes, a herança de estilos (`StyleRegistry.ts`, DEC-014/DEC-015) e o
boilerplate, e o `CanvasEngine.ts` mostra a página vazia (DEC-016). O objetivo imediato são os frames
no canvas (`FrameText.ts`, `FrameImage.ts`, `FrameShape.ts`).

**Problema de mercado resolvido:** Nenhuma ferramenta combina edição visual acessível +
geração em massa + tipos editoriais especializados (dobras, catálogos) em um único
produto acessível para PMEs. Canva é genérico, InDesign é caro e complexo, ferramentas
de catálogo (Catsy, Akeneo) são enterprise.

---

## Nome do Arquivo de Template

Extensão proprietária: **`.editx`** — JSON estruturado que representa documento
completo: páginas, frames, estilos de texto globais, paleta de cores, mapeamentos CSV
e metadados de exportação.

---

## Stack Tecnológica

> Versões abaixo são as REAIS instaladas em 2026-07-24 (confirmadas via `npm list`),
> não as planejadas em maio — desatualização de versão em doc é esperada com o tempo;
> ver armadilha "Não confiar cegamente nesta tabela" abaixo.

- **Linguagem:** TypeScript ~6.0.2 (documentado originalmente: 5.x)
- **Framework UI:** React 19.2.7 + Vite 8.1.5 (documentado originalmente: React 18 + Vite 5)
- **Motor de canvas:** Fabric.js 6.9.1 (canvas 2D interativo)
- **Estado global:** Zustand 4.5.7 + Immer 10.2.0 (estado imutável, patches para undo/redo)
- **Tipografia avançada:** opentype.js 1.3.x (leitura de fontes TTF/OTF, métricas precisas)
- **Exportação PDF:** pdf-lib 1.17.x (multipáginas, links internos, índice, sangria)
- **Exportação raster:** html2canvas 1.4.x + Canvas API nativa
- **Empacotamento em lote:** JSZip 3.10.x
- **Leitura de CSV:** PapaParse 5.5.x
- **Desktop (Fase 2):** Tauri 2.x (Rust) — empacota o app web como executável nativo
- **Deploy web:** Vercel / Netlify (SPA estática)
- **Ferramentas:** Git, ESLint 9.39.x (flat config — NÃO 10.x, ver DEC-011), Prettier 3, Vitest 5.x (testes de lógica em ambiente Node; versão real no `package.json` — entra pela wo0001, DEC-013)

---

## Estrutura do Projeto

```
EditX/
├── src/
│   ├── canvas/
│   │   ├── PageGeometry.ts        # unidade → px CSS, caixa da página com sangria, zoom para caber (puro, DEC-016)
│   │   ├── PageGeometry.test.ts   # Testes Vitest da geometria
│   │   ├── CanvasEngine.ts        # Wrapper do Fabric.js: ciclo de vida, página, zoom (DEC-016)
│   │   ├── FrameText.ts           # Frame de texto: overflow, grow, estilos
│   │   ├── FrameImage.ts          # Frame de imagem: fit, auto-fill por nome de arquivo
│   │   ├── FrameShape.ts          # Formas, bordas, ornamentos vetoriais
│   │   └── SelectionManager.ts   # Seleção, multi-select, alinhamento, distribuição
│   │
│   ├── template/
│   │   ├── TemplateSchema.ts      # Documento raiz + CSV mapping (fonte da verdade, DEC-009)
│   │   ├── __examples__/          # Fixtures que validam o schema por compilação (não é produção)
│   │   │   └── catalogo-simples.example.ts
│   │   ├── TemplateSerializer.ts  # serializeTemplate / parseTemplate — salvar e carregar .editx (DEC-013)
│   │   ├── TemplateValidator.ts   # validateTemplate — contrato público, raiz e estilos de texto (raiz × derivado, DEC-014)
│   │   ├── ValidationRules.ts     # motor do validador: primitivas, objeto estrito, união discriminada
│   │   ├── FrameValidator.ts      # regras dos frames (texto, imagem, forma)
│   │   ├── TemplateSerializer.test.ts # Testes Vitest do serializer + validador
│   │   ├── TemplateRenderer.ts    # Popula template com dados de uma linha CSV
│   │   ├── StyleRegistry.ts       # resolveStyle / dependentsOf / setStyle / removeStyle — funções puras sobre textStyles (DEC-015)
│   │   └── StyleRegistry.test.ts  # Testes Vitest da herança de estilos
│   │
│   ├── csv/
│   │   ├── CsvParser.ts           # Lê CSV, detecta colunas e tipos
│   │   ├── ColumnMapper.ts        # Lógica de mapeamento coluna → frame
│   │   └── ImageResolver.ts       # Resolve nome de arquivo da coluna → objeto de imagem
│   │
│   ├── export/
│   │   ├── BatchGenerator.ts      # Loop CSV → N arquivos (roda em Web Worker)
│   │   ├── PdfExporter.ts         # pdf-lib: multipáginas, índice, dobras
│   │   ├── ImageExporter.ts       # PNG/JPG por frame/página
│   │   └── ZipPacker.ts           # Empacota lote em ZIP nomeado
│   │
│   ├── store/
│   │   ├── documentStore.ts       # Documento ativo, páginas, frames
│   │   ├── selectionStore.ts      # Frame(s) selecionado(s) e propriedades
│   │   ├── historyStore.ts        # Undo/redo com Immer patches
│   │   └── csvStore.ts            # Dados importados, mapeamentos, preview
│   │
│   ├── ui/
│   │   ├── CanvasView.tsx         # Hospeda o CanvasEngine num <div>: cria o <canvas>, ResizeObserver, dispose
│   │   ├── Toolbar.tsx            # Barra de ferramentas superior
│   │   ├── PropertiesPanel.tsx    # Painel direito: propriedades do frame selecionado
│   │   ├── LayersList.tsx         # Painel esquerdo: árvore de camadas/frames
│   │   ├── CsvMapper.tsx          # UI visual de mapeamento CSV → frames
│   │   └── BatchPreview.tsx       # Preview dos N primeiros itens antes de gerar
│   │
│   ├── types/
│   │   ├── template.types.ts      # Fachada de re-export (TemplateSchema.ts + frame.types.ts) — nunca redefine tipos
│   │   └── frame.types.ts         # Tipos de frames, overflow, estilos, transformações (extraído de TemplateSchema.ts por tamanho)
│   │
│   ├── App.tsx                    # Host de desenvolvimento: CanvasView com a página do exemplo (até existir a UI)
│   └── main.tsx                   # Ponto de entrada React (StrictMode)
│
├── src-tauri/                     # App desktop Tauri (Fase 2 — não inicializar ainda)
├── public/
│   └── assets/
│       └── placeholder.png        # Imagem de fallback para frames sem imagem
│
├── logs/                          # Log do dia (logs/AAAA-MM-DD.md), versionado
├── meta/                          # Documentação de contexto (KCM)
│   ├── CEREBRO.md                 # Comportamento do assistente
│   ├── CONTEXT.md                 # Este arquivo
│   ├── STATUS.md                  # Estado atual do projeto
│   ├── CHANGELOG.md               # Histórico de versões
│   ├── IDEAS.md                   # Ideias capturadas e sugestões
│   ├── DECISIONS.md               # Decisões arquiteturais registradas
│   ├── ROADMAP.md                 # Plano de fases de médio/longo prazo
│   ├── GLOSSARY.md                # Termos próprios do projeto
│   ├── HISTORY.md                 # Conhecimento consolidado de fases antigas
│   ├── LOG-TEMPLATE.md            # Formato do log do dia
│   ├── SPEC.md                    # Modelo de spec de feature (sob demanda)
│   └── workorders/                # WOs (AAMMDD-woNNNN-desc.md) + _TEMPLATE.md
├── .claude/                       # Claude Code: settings.json + skills/ (apply-wo, wrap, sondar)
├── CLAUDE.md                      # Guia raiz do Claude Code
├── INSTRUCOES-DO-PROJETO.md       # Fonte das Instruções do painel do Projeto
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Convenções de Código

- **Comentários:** sempre em português
- **Nomenclatura:** `camelCase` para funções e variáveis, `PascalCase` para classes e tipos, `SCREAMING_SNAKE_CASE` para constantes
- **Commits:** em português, formato conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Docstrings:** toda função pública deve ter JSDoc completo (`@param`, `@returns`, `@throws` quando aplicável)
- **Lógica não-óbvia:** sempre comentada com o "porquê", não apenas o "o quê"
- **Tipos:** preferir tipos explícitos a `any`; usar `unknown` quando o tipo é realmente desconhecido
- **Arquivos:** um módulo por arquivo, máximo ~300 linhas — extrair se ultrapassar

---

## Dependências Principais

> Trecho real de `package.json` após `npm install` em 2026-07-24. `oxlint` foi removido
> (era o default do scaffold) e substituído pelo bloco ESLint+Prettier já documentado.
> ESLint fixado em `^9.0.0`, não `^10.0.0` — ver DEC-011.

```json
{
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "fabric": "^6.9.1",
    "zustand": "^4.5.7",
    "immer": "^10.2.0",
    "opentype.js": "^1.3.4",
    "pdf-lib": "^1.17.1",
    "jszip": "^3.10.1",
    "papaparse": "^5.5.4",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vite": "^8.1.1",
    "@vitejs/plugin-react": "^6.0.3",
    "eslint": "^9.0.0",
    "@eslint/js": "^9.0.0",
    "prettier": "^3.2.0",
    "typescript-eslint": "^8.0.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "eslint-config-prettier": "^9.1.0",
    "globals": "^15.0.0"
  }
}
```

**Testes (desde a wo0001, DEC-013):** Vitest, rodado por `npm test` (`vitest run`), **sem arquivo de
configuração** — ambiente Node padrão. Arquivo de teste `*.test.ts` ao lado do módulo testado,
importando `describe`/`it`/`expect` de `vitest` explicitamente (sem globals). Como os testes ficam em
`src/`, o `npm run build` (`tsc -b`) também os checa por tipo. O fixture padrão é o exemplo de
`src/template/__examples__/` — um `.editx` válido de ponta a ponta.

---

## Como o Motor de Overflow de Texto Funciona (CRÍTICO)

> Mecanismo central do sistema — se mal-entendido, gera bug de layout silencioso
> (frame que não cresce, texto cortado sem aviso, fonte minúscula).

O `FrameText.ts` não usa o overflow nativo de nenhuma lib de canvas — é motor próprio
(ver DEC-006). O fluxo, para cada frame de texto a cada renderização (edição no canvas
ou item de um lote):

1. **Medir** — o texto é renderizado em um canvas offscreen para obter largura por linha
   (`ctx.measureText`) e altura por linha via `opentype.js` (ascender + descender da fonte
   real, não `measureText().actualBoundingBoxAscent` — ver armadilha abaixo).
2. **Quebrar linha** — o texto é dividido em linhas respeitando a largura disponível do
   frame (ou largura "infinita" se o modo for `grow-horizontal`).
3. **Decidir overflow** — comparando a altura/largura total calculada contra as dimensões
   atuais do frame, o modo configurado decide o resultado:
   - `grow-vertical` / `grow-horizontal` → o frame é redimensionado para caber o texto,
     crescendo a partir do `anchor` configurado (ex.: `top-left` cresce para baixo).
   - `fixed-shrink` → o frame NÃO muda de tamanho; o `fontSize` é reduzido em passos até
     o texto caber ou até `minFontSize` ser atingido (o que vier primeiro).
   - `fixed-clip` → o frame não muda; o texto que ultrapassa a borda é simplesmente
     cortado (sem reticências, sem redução de fonte).
4. **Aplicar** — o frame é re-renderizado no Fabric.js com as dimensões/fonte finais.

**Exemplo mínimo (pseudocódigo):**
```typescript
const metrics = measureText(content, style, opentypeFont);
const layout = applyOverflow(frame.overflow.mode, metrics, frame.transform, frame.overflow);
// layout.width, layout.height, layout.fontSize já resolvidos → aplica no Fabric.js
```

Em geração de lote (500+ itens), esse cálculo roda uma vez por frame de texto por linha
do CSV — é por isso que o `BatchGenerator.ts` roda em Web Worker (ver DEC-007): sem isso,
a UI trava durante o cálculo de centenas de layouts em sequência.

---

## Arquitetura — Pontos-Chave

> Uma linha por decisão estrutural. O raciocínio completo (alternativas, trade-offs,
> riscos) vive em DECISIONS.md — não duplicado aqui.

- Formato de template é JSON próprio com extensão `.editx` — ver DEC-001.
- Imagens são referenciadas por caminho relativo, não embutidas por padrão — ver DEC-002.
- Fabric.js é o motor de canvas (não Konva.js) — ver DEC-003.
- Zustand + Immer para todo o estado global (não Redux/Context) — ver DEC-004.
- Tauri para desktop na Fase 2 (não Electron) — ver DEC-005.
- Motor de overflow de texto é 100% implementação própria — ver DEC-006.
- `BatchGenerator.ts` roda exclusivamente em Web Worker — ver DEC-007.
- `pdf-lib` para toda geração de PDF (não jsPDF) — ver DEC-008.
- `TemplateSchema.ts` é a fonte única de tipos; nenhum módulo define tipos de frame próprios — ver DEC-009.
- Versões de dependências seguem o que o npm serve no momento da instalação, não datas fixas documentadas; ESLint+Prettier são o padrão de lint/format do projeto (ESLint fixo em 9.x, não 10.x), não o default do scaffold — ver DEC-011.

---

## Tipos de Documentos Suportados

| Tipo | `type` no .editx | Características especiais |
|---|---|---|
| Catálogo de produtos | `catalog` | Multipáginas, índice automático, página de capa + página de produto repetida |
| Cartaz de oferta | `poster` | Página única, formatos livres |
| Story digital | `story` | 1080×1920px, proporção 9:16 |
| Menu digital | `menu-digital` | Proporções de tela, sem sangria |
| Menu imprimível | `menu-print` | Com sangria, marcas de corte |
| Menu C-fold | `cfold` | 3 painéis, dobra em C — guias de dobra obrigatórios |
| Menu Z-fold | `zfold` | 3 painéis, dobra em Z — guias de dobra obrigatórios |
| Menu PDF com índice | `menu-pdf` | Multipáginas, links internos de índice |
| Cardápio imprimível | `cardapio` | Grade de itens, categorias, preços |
| Cartão de produto | `card` | Formato compacto, frente/verso opcional |

---

## Modos de Overflow de Texto (FrameText)

| Modo | Comportamento | Anchor relevante |
|---|---|---|
| `grow-vertical` | Frame cresce para baixo/cima conforme o texto | `top-left`, `top-center`, `top-right`, `bottom-*` |
| `grow-horizontal` | Frame cresce para esquerda/direita | `*-left`, `*-center`, `*-right` |
| `fixed-shrink` | Frame não cresce; fonte diminui até `minFontSize` | N/A |
| `fixed-clip` | Frame não cresce; texto é cortado na borda | N/A |

---

## O que NÃO fazer — Armadilhas Conhecidas

- **Não implementar o motor de canvas antes do TemplateSchema.ts estar completo.** A tipagem do schema é a fonte da verdade. Canvas que não respeita os tipos vai exigir reescrita.
- **Não usar `any` em TemplateSchema.ts.** Cada campo deve ser tipado explicitamente — esse arquivo é o contrato entre todos os módulos.
- **Não rodar geração em massa no thread principal.** Com 500+ linhas no CSV, a UI trava. BatchGenerator.ts deve sempre rodar em Web Worker.
- **Não embutir imagens em base64 no `.editx` por padrão.** O arquivo fica imenso e não é versionável. Referências por caminho relativo são o padrão; base64 é opção de "empacotar".
- **Não inicializar o Tauri (src-tauri/) antes da Fase 2.** A pasta existe na estrutura de referência mas não deve ser criada no boilerplate inicial — adiciona complexidade desnecessária.
- **Não usar Konva.js** — foi avaliado e descartado em favor do Fabric.js (ver DECISIONS.md DEC-003).
- **Fabric.js v6 quebrou a API de serialização do v5.** Se encontrar tutoriais usando `toJSON()` com estrutura de v5, não seguir cegamente — verificar a documentação da v6.
- **Evitar gradients radiais e multi-stop em SVG de preview** — causam artefatos na exportação PNG via html2canvas.
- **`ctx.measureText()` não retorna altura real da linha.** Só retorna `width`. Para altura, usar `opentype.js` (ascender + descender da fonte real) — não depender de `actualBoundingBoxAscent` isoladamente (ver DEC-006).
- **`OffscreenCanvas` tem suporte limitado no Safari.** Verificar compatibilidade antes de finalizar o `BatchGenerator.ts`; pode exigir fallback para thread principal em Safari antigo (ver DEC-007).
- **Não confiar cegamente na tabela de versões deste documento.** Ela reflete o estado em que foi escrita; o npm segue evoluindo (React 19/Vite 8/TS 6 já divergem do que foi documentado em maio — ver DEC-011). Antes de instalar ou depender de uma versão específica, rode `npm list` / confira o `package.json` real em vez de copiar o número daqui.
- **`npm audit` vai sempre mostrar vulnerabilidades mesmo num projeto saudável** (11 no sandbox de 2026-07-24; 6 — 5 altas, 1 crítica — no `npm install` da máquina do dono em 2026-09-03 [relatado pelo dono]). A maior cadeia é `fabric` → `canvas`/`jsdom` (optionalDependencies, só para renderização server-side em Node) → `@mapbox/node-pre-gyp` → `tar` vulnerável. Nosso app é 100% client-side e nunca executa esse caminho — ver DEC-011. Não tentar "corrigir" com `npm audit fix --force` (forçaria fabric v7, breaking change não avaliado).
- **`eslint@^10.0.0` resolveria a vulnerabilidade do `minimatch`, mas quebra a instalação.** `eslint-plugin-react-hooks@5.2.0` trava o peer dependency em `eslint <= ^9.0.0` — confirmado por tentativa real, não suposição. Manter ESLint em `^9.0.0` até esse plugin liberar suporte à v10 (ver DEC-011).
- **`npx eslint --version` mostrando a versão nova NÃO prova que o upgrade é seguro.** Só confirma o binário instalado naquele momento — o teste real é instalar mais alguma coisa (ou reinstalar do zero) e ver se os peer dependencies resolvem sem conflito. Isso pegou a gente de surpresa uma vez (ver DEC-011).
- **O `.gitignore` que o `create-vite` gera por padrão ignora a pasta `logs/` inteira.** Neste projeto `logs/` é versionada de propósito (log do dia). Se o boilerplate for regenerado do zero, lembrar de remover essa linha — ver DEC-011.
- **Fabric 6 recusa reinicializar um `<canvas>` que ainda carrega `data-fabric`.** Lança «Trying to initialize a
  canvas that has already been initialized» (`StaticCanvasDOMManager.createLowerCanvas`, fabric 6.9.1). Com o
  StrictMode do React (monta, desmonta, monta) e o `dispose()` ASSÍNCRONO, reaproveitar o mesmo elemento quebra:
  o `CanvasView.tsx` cria um `<canvas>` NOVO a cada montagem. Não troque por `useRef` num `<canvas>` do JSX.
- **`canvas.dispose()` do Fabric 6 devolve `Promise<boolean>`;** o `destroy()` síncrono é marcado como inseguro
  na própria tipagem. Use sempre `dispose()`; em cleanup de efeito React, sem `await`, com `.catch`.
- **O `dispose()` do Fabric devolve o `<canvas>` original ao DOM NA HORA e só resolve DEPOIS do próximo quadro.**
  `StaticCanvas.dispose` chama `cleanupDOM` (troca o `div.canvas-container` pelo `<canvas>` original) de forma
  síncrona; a promessa espera a renderização pendente. No StrictMode, quando ela resolve a montagem seguinte JÁ
  inseriu o canvas dela no mesmo `<div>`: limpeza que remove «o que não existia antes da montagem» apaga a
  montagem viva e deixa a página em branco, sem erro no console (FIX-001, medido no navegador em 2026-11-12).
  Na limpeza, remova **só o próprio `<canvas>`** daquela montagem. Em aba oculta o quadro não chega e a
  promessa fica pendente — não use aba oculta para conferir a limpeza.
- **Campo novo em `TemplateSchema.ts`/`frame.types.ts` exige o `TemplateValidator.ts` junto.** O
  validador é escrito à mão e ESTRITO (DEC-013): chave que ele não conhece vira erro `unknown-field`, então
  um `.editx` com o campo novo seria REJEITADO até o validador aprender. Mesma regra para valor novo numa
  união de literais (`DocumentType`, `OverflowMode`…). O teste de ida-e-volta do exemplo só pega o
  descompasso se o exemplo usar o campo — ponha-o lá.

---

## 📁 Arquivos Críticos (não mexer sem contexto)

| Arquivo | Por que é crítico |
|---|---|
| `src/types/template.types.ts` | Fachada de re-export — o contrato que todo o resto do app importa. Mudança de tipo quebra serialização de arquivos existentes |
| `src/template/TemplateSchema.ts` + `src/types/frame.types.ts` | Fonte real dos tipos (DEC-009). `template.types.ts` só reexporta daqui |
| `src/template/TemplateSerializer.ts` + `src/template/TemplateValidator.ts` | Qualquer bug corrompe ou rejeita arquivos `.editx` de usuários. Mudança só com `npm test` verde e teste novo para a regra mexida |
| `src/canvas/FrameText.ts` | Ainda não existe. Quando existir: motor de overflow customizado, mudanças exigem re-teste visual |

---

## Contexto de Negócio / Produto

O usuário final típico é um profissional de marketing ou proprietário de negócio que:
1. Mantém uma planilha com produtos (nome, preço, foto, descrição, categoria)
2. Precisa gerar dezenas ou centenas de peças gráficas por semana (atualização de preços, promoções)
3. Quer que as peças sigam a identidade visual da marca (cores, fontes, layout)
4. Não tem habilidade técnica em Illustrator/InDesign
5. Precisa de saída em PDF para impressão ou PNG para digital (Instagram, WhatsApp)

O fluxo de uso principal é:
**Criar template** → **Importar CSV** → **Mapear colunas** → **Gerar lote** → **Baixar ZIP**

---

*Última atualização: 2026-11-11 — preparação da wo0001 (TemplateSerializer + Vitest, DEC-013). Anterior: 2026-11-10 (merge do KCM v1.135.0, DEC-012). Criação original: 2026-05-24.*
