# IDEAS.md — Ideias, Sugestões e Visão de Futuro

> Captura TODAS as ideias — tanto as suas quanto as sugeridas pelo Claude.
> Funciona como "segundo cérebro" do projeto.
> Lido pelo Claude no início de novas sessões para ter continuidade de raciocínio.

---

## 💡 Suas Ideias (capturadas durante as sessões)

### 2026-05-24

**Ideia:** Ferramenta de geração em massa de materiais editoriais (catálogos, cartazes, menus, stories, dobráveis) populada via CSV
**Contexto:** Ideia inicial que deu origem ao projeto
**Status:** `aprovada` — é o produto inteiro
**Detalhes originais (preservados):** *"geração completa de catalogo de produtos, cartazes de ofertas, cartazes digitais de story, menu digital, menu de story, menu imprimivel, menu de estilo pdf com index, cardapios imprimiveis, menus c fold, z fold entre outras produções editorias, de forma a ser mais 'pratica' em popular coisas em massa (pegaria os dados de um csv)"*

---

**Ideia:** Interface "Canva-like" com opções de coluna — nomear e marcar o padrão/modelo de cada informação
**Contexto:** Parte da ideia original
**Status:** `aprovada` — é o mapeamento CSV → frames no canvas
**Impacto estimado:** alto

---

**Ideia:** Templates salvos reutilizáveis — quando for atualizar algo que já foi feito, poder abrir o template existente
**Contexto:** Parte da ideia original
**Status:** `aprovada` — implementado via arquivo `.editx` com gerenciador de templates
**Impacto estimado:** alto

---

**Ideia:** Frames de imagem populáveis automaticamente se o CSV contiver o nome exato do arquivo
**Contexto:** Parte da ideia original
**Status:** `aprovada` — implementado no `ImageResolver.ts`
**Impacto estimado:** alto — resolve um dos maiores pontos de atrito do fluxo

---

**Ideia:** Frames de texto com comportamento configurável ao atingir as bordas — crescer horizontal, crescer vertical, ou não ultrapassar (diminuir fonte automaticamente)
**Contexto:** Referenciou o comportamento do Figma para frames de texto
**Status:** `aprovada` — especificado como 4 modos de overflow: `grow-vertical`, `grow-horizontal`, `fixed-shrink`, `fixed-clip`
**Impacto estimado:** alto

---

**Ideia:** Sistema de estilos de texto globais — alterar o estilo atualiza todos os frames vinculados automaticamente
**Contexto:** Referenciou o Affinity Publisher e o Word
**Status:** `aprovada` — implementado via `StyleRegistry.ts` com observer pattern
**Impacto estimado:** alto — essencial para manter identidade visual consistente em lote

---

**Ideia:** Suporte a formas, objetos, bordas, ornamentos, cores, paletas de marca
**Contexto:** Parte da ideia original
**Status:** `aprovada` — `FrameShape.ts` + sistema de paletas no `.editx`
**Impacto estimado:** médio

---

**Ideia:** Capacidade de popular imagens em massa — pasta de imagens + CSV com nomes dos arquivos
**Contexto:** Parte da ideia original, reforçada ao descrever o fluxo
**Status:** `aprovada` — `ImageResolver.ts` + `imageBasePath` no `csvMapping`
**Impacto estimado:** alto

---

**Ideia:** Rodar no navegador ou como app desktop
**Contexto:** Requisito de plataforma desde o início
**Status:** `aprovada` — web primeiro, desktop via Tauri na Fase 2
**Impacto estimado:** médio

---

## 🤖 Sugestões do Claude

### 2026-05-24

**Sugestão:** Usar Tauri em vez de Electron para a versão desktop
**Por que:** Bundle 15× menor (~10MB vs ~150MB), sem Chromium embutido, mais seguro, performance melhor
**Status:** `aceita` — registrada em DEC-005
**Prioridade:** média (Fase 2)

---

**Sugestão:** BatchGenerator.ts rodar em Web Worker
**Por que:** Geração de 200+ itens no thread principal trava a UI por vários segundos; Web Worker mantém a interface responsiva com progresso em tempo real
**Status:** `aceita` — registrada em DEC-007
**Prioridade:** alta

---

**Sugestão:** `TemplateSchema.ts` como primeira coisa a implementar (antes do canvas)
**Por que:** É o contrato entre todos os módulos. Implementar o canvas antes dos tipos cria inconsistências difíceis de corrigir
**Status:** `aceita` — registrada em DEC-009
**Prioridade:** alta (primeiro item do backlog)

---

**Sugestão:** Imagens referenciadas por caminho relativo + opção "Empacotar tudo" em base64
**Por que:** Mantém o `.editx` leve e versionável; base64 disponível apenas quando o usuário precisar compartilhar sem a pasta de imagens
**Status:** `aceita` — registrada em DEC-002
**Prioridade:** média

---

**Sugestão:** Coluna `outputNaming` no `csvMapping` para nomear os arquivos gerados com dados do CSV
**Por que:** `"{nome}-{preco}"` → `"coca-cola-5,99.pdf"`. Elimina arquivos numerados sem sentido (item_001.pdf, item_002.pdf)
**Status:** `aceita` — já está no schema do `.editx`
**Prioridade:** média

---

**Sugestão:** `skipRowsWhere` no `csvMapping` — filtro de linhas do CSV
**Por que:** Catálogos frequentemente têm uma coluna "ativo: sim/não". Poder filtrar diretamente no template evita ter que limpar o CSV antes de importar
**Status:** `aceita` — já está no schema do `.editx`
**Prioridade:** baixa

---

**Sugestão:** Campo `"isDataPage": true` nas páginas do template
**Por que:** Em catálogos, a página de produto se repete para cada linha do CSV. A página de capa é estática. Sem essa flag, o sistema não sabe qual página repetir.
**Status:** `aceita` — já está no schema do `.editx`
**Prioridade:** alta (sem isso catálogos multipáginas não funcionam)

---

**Sugestão:** Formatadores nativos para colunas CSV: `currency:BRL`, `date:DD/MM/YYYY`, `uppercase`
**Por que:** Evita o usuário ter que formatar os dados antes de importar. O CSV pode ter preço como `"12.9"` e o template exibe `"R$ 12,90"` automaticamente
**Status:** `aceita` — já está no schema do `.editx` no `columns[].format`
**Prioridade:** média

---

**Sugestão:** `fallback` nos frames de imagem — imagem padrão quando o arquivo não é encontrado
**Por que:** Em lotes de 500 produtos, é provável que alguns não tenham imagem. Sem fallback, o frame fica vazio ou o sistema quebra. Com fallback, a geração continua com um placeholder
**Status:** `aceita` — já está no schema do `.editx` no `FrameImage.fallback`
**Prioridade:** alta

---

## 🔭 Visão de Longo Prazo

- **Biblioteca de templates:** templates pré-prontos para os tipos mais comuns (supermercado, restaurante, boutique) — usuário abre, importa CSV, gera
- **Integração com Google Sheets:** importar dados diretamente de uma planilha sem exportar CSV
- **Reconhecimento de imagem por IA:** sugerir crop ideal da imagem dentro do frame (evitar rostos cortados, produto centralizado)
- **Exportação para redes sociais:** formatos otimizados para Instagram Feed, Stories, WhatsApp Business Catalog
- **Versão colaborativa:** múltiplos usuários editando o mesmo template (Fase muito distante)
- **Plugin para Canva ou Figma:** exportar o sistema de frames para o workflow de quem já usa essas ferramentas
- **Modo "atualização de preços":** abrir catálogo existente, importar CSV com apenas os preços atualizados, regenerar só as páginas que mudaram

---

## ⚖️ Decisões Registradas Aqui (resumo — detalhes em DECISIONS.md)

| Decisão | Alternativa considerada | Por que escolhemos X | Data |
|---|---|---|---|
| Fabric.js para canvas | Konva.js | API de texto e serialização mais madura | 2026-05-24 |
| Tauri para desktop | Electron | Bundle 15× menor, sem Chromium, mais seguro | 2026-05-24 |
| Zustand + Immer | Redux Toolkit | Sem boilerplate, nativo para undo/redo com patches | 2026-05-24 |
| Motor overflow customizado | Lib existente | Não existe lib que implemente os 4 modos necessários | 2026-05-24 |
| pdf-lib | jsPDF | API TypeScript moderna, suporte a links internos e PDF/X | 2026-05-24 |
| Web Worker para geração | Thread principal | UI não pode travar durante geração de 500+ itens | 2026-05-24 |
| Referência por caminho | Base64 embutido | Arquivos leves, versionáveis com Git | 2026-05-24 |
| `.editx` como extensão | JSON puro | Identidade proprietária, futura associação com o app | 2026-05-24 |

---

## 🚫 Ideias Descartadas (e por quê)

- **Konva.js como motor de canvas** — descartado em favor do Fabric.js (API de texto menos madura para o que precisamos)
- **Electron para desktop** — descartado em favor do Tauri (muito pesado, bundle de 150MB)
- **Imagens sempre em base64 no `.editx`** — descartado (arquivo imenso, não versionável com Git)
- **Renderizar texto em HTML/CSS sobreposto ao canvas** — descartado (sincronização de posição frágil, inviável para exportação)
- **jsPDF** — descartado em favor do pdf-lib (API mais moderna e suporte a PDF/X)
- **Context API do React para estado global** — descartado (re-renders excessivos afetariam performance do canvas)
- **Redux Toolkit** — descartado (boilerplate excessivo para um editor, Zustand resolve com menos código)

---

## 📌 Template para nova ideia

```markdown
### [Data]

**Origem:** [sua ideia / sugestão do Claude / pesquisa]
**Ideia:**
**Problema que resolve:**
**Impacto estimado:** alto | médio | baixo
**Complexidade:** alta | média | baixa
**Status:** nova
```
