# CONTEXT.md — EditX — Editor Editorial em Massa

> Este arquivo é lido pelo Claude no início de cada nova conversa.
> Mantenha-o atualizado a cada sessão de desenvolvimento.

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

**Objetivo atual:** Fase de arquitetura e design técnico. Nenhum código de produção
existe ainda. O objetivo imediato é finalizar o schema do arquivo `.editx`, implementar
o boilerplate do projeto e construir o MVP do canvas com frames de texto e imagem.

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

- **Linguagem:** TypeScript 5.x
- **Framework UI:** React 18 + Vite 5
- **Motor de canvas:** Fabric.js 6.x (canvas 2D interativo)
- **Estado global:** Zustand + Immer (estado imutável, patches para undo/redo)
- **Tipografia avançada:** opentype.js (leitura de fontes TTF/OTF, métricas precisas)
- **Exportação PDF:** pdf-lib (multipáginas, links internos, índice, sangria)
- **Exportação raster:** html2canvas + Canvas API nativa
- **Empacotamento em lote:** JSZip
- **Leitura de CSV:** PapaParse
- **Desktop (Fase 2):** Tauri 2.x (Rust) — empacota o app web como executável nativo
- **Deploy web:** Vercel / Netlify (SPA estática)
- **Ferramentas:** Git, ESLint, Prettier, Vitest

---

## Estrutura do Projeto

```
editor-editorial/
├── src/
│   ├── canvas/
│   │   ├── CanvasEngine.ts        # Wrapper do Fabric.js + gerenciamento de eventos
│   │   ├── FrameText.ts           # Frame de texto: overflow, grow, estilos
│   │   ├── FrameImage.ts          # Frame de imagem: fit, auto-fill por nome de arquivo
│   │   ├── FrameShape.ts          # Formas, bordas, ornamentos vetoriais
│   │   └── SelectionManager.ts   # Seleção, multi-select, alinhamento, distribuição
│   │
│   ├── template/
│   │   ├── TemplateSchema.ts      # Tipos TypeScript do formato .editx (fonte da verdade)
│   │   ├── TemplateSerializer.ts  # Salvar / carregar / validar JSON .editx
│   │   ├── TemplateRenderer.ts    # Popula template com dados de uma linha CSV
│   │   └── StyleRegistry.ts      # Estilos de texto globais com herança (observer pattern)
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
│   │   ├── Toolbar.tsx            # Barra de ferramentas superior
│   │   ├── PropertiesPanel.tsx    # Painel direito: propriedades do frame selecionado
│   │   ├── LayersList.tsx         # Painel esquerdo: árvore de camadas/frames
│   │   ├── CsvMapper.tsx          # UI visual de mapeamento CSV → frames
│   │   └── BatchPreview.tsx       # Preview dos N primeiros itens antes de gerar
│   │
│   ├── types/
│   │   ├── template.types.ts      # Tipos do .editx (re-exportados de TemplateSchema)
│   │   └── frame.types.ts         # Tipos de frames, overflow, estilos, transformações
│   │
│   └── main.tsx                   # Ponto de entrada React
│
├── src-tauri/                     # App desktop Tauri (Fase 2 — não inicializar ainda)
├── public/
│   └── assets/
│       └── placeholder.png        # Imagem de fallback para frames sem imagem
│
├── logs/                          # Logs de sessão (gerados pelo Claude)
├── CONTEXT.md                     # Este arquivo
├── STATUS.md                      # Estado atual do projeto
├── CHANGELOG.md                   # Histórico de versões
├── IDEAS.md                       # Ideias capturadas e sugestões
├── DECISIONS.md                   # Decisões arquiteturais registradas
├── LOG-TEMPLATE.md                # Template de formato para logs de sessão
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

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "fabric": "^6.0.0",
    "zustand": "^4.5.0",
    "immer": "^10.1.0",
    "opentype.js": "^1.3.4",
    "pdf-lib": "^1.17.1",
    "jszip": "^3.10.1",
    "papaparse": "^5.4.1",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.5.0",
    "eslint": "^9.0.0",
    "prettier": "^3.2.0"
  }
}
```

---

## Decisões Técnicas Importantes

| Decisão | Motivo | Data |
|---|---|---|
| Fabric.js como motor de canvas | Mais maduro que Konva para manipulação de objetos (seleção, transformação, z-order). API bem documentada. | 2026-05-24 |
| Zustand + Immer para estado | Zustand é simples e sem boilerplate. Immer permite patches para undo/redo sem complexidade do Redux | 2026-05-24 |
| Formato `.editx` (JSON) com referências de imagem por caminho | Arquivos leves e versionáveis. Opção de "empacotar tudo" (base64) disponível para compartilhamento | 2026-05-24 |
| Tauri em vez de Electron (Fase 2) | Tauri é 10–20x mais leve em bundle, usa WebView nativo do SO, escrito em Rust = mais seguro e eficiente | 2026-05-24 |
| Motor de overflow de texto customizado | Nenhuma lib existente (nem Fabric.js) implementa os modos grow-vertical/horizontal + fixed-shrink como o Figma. Implementação própria necessária | 2026-05-24 |
| StyleRegistry com observer pattern | Permite atualizar um estilo e propagar automaticamente para todos os frames vinculados, como Affinity/Word | 2026-05-24 |
| BatchGenerator em Web Worker | Geração de N arquivos é CPU-intensiva. Rodar no thread principal travaria a UI | 2026-05-24 |
| pdf-lib em vez de jsPDF | pdf-lib tem API mais moderna, suporte a PDF/X para impressão, manipulação de PDFs existentes e tipagem TypeScript nativa | 2026-05-24 |

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

Este é o módulo mais crítico do sistema. Os modos suportados:

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

*Última atualização: 2026-05-24 — Documento inicial criado. Projeto em fase de arquitetura, sem código de produção.*
