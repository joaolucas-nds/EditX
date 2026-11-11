# IDEAS.md — Ideias, Sugestões e Visão de Futuro

> Captura TODAS as ideias — tanto as suas quanto as sugeridas pelo Claude.
> Funciona como "segundo cérebro" do projeto.
> Nunca perde: ideia implementada vai para «Concluídas»; ideia recusada vai para «Descartadas» com o motivo.

**Mudanças nesta revisão (2026-11-10):** nova seção «🛌 Adiadas» (template do KCM v1.135.0),
vazia por enquanto; feedback do merge v1.135.0 em «Feedback para o Kit»; corrigida a frase de
«Concluídas» que ainda dizia «pré-boilerplate». Nenhuma ideia mudou de status. A nota de
2026-07-11 saiu; a reestruturação que ela descrevia está em DEC-010.

---

## 💡 Ideias Ativas — Usuário

> Decididas (ver DECISIONS.md), aguardando implementação — nenhuma ainda é código.

### 2026-05 — Ferramenta de geração em massa de materiais editoriais via CSV
Editor visual estilo Canva/Figma especializado em geração em massa de catálogos,
cartazes, cartazes digitais de story, menu digital, menu imprimível, menu PDF com
índice, cardápios, menus C-fold e Z-fold — populados a partir de um CSV.
**Detalhes originais (preservados):** *"geração completa de catalogo de produtos,
cartazes de ofertas, cartazes digitais de story, menu digital, menu de story, menu
imprimivel, menu de estilo pdf com index, cardapios imprimiveis, menus c fold, z fold
entre outras produções editorias, de forma a ser mais 'pratica' em popular coisas em
massa (pegaria os dados de um csv)"*
**Impacto:** alto — é o produto inteiro. **Onde vive no schema:** raiz do `.editx`,
todos os tipos de documento.

### 2026-05 — Interface "Canva-like" com opções de coluna
Nomear e marcar o padrão/modelo de cada informação do CSV visualmente, em vez de editar
JSON à mão. **Onde vive:** mapeamento CSV → frames no canvas (`ColumnMapper.ts`, `CsvMapper.tsx`).

### 2026-05 — Templates salvos e reutilizáveis
Poder abrir um template já usado para atualizar uma peça já produzida (ex.: trocar só os
preços de um catálogo). **Onde vive:** arquivo `.editx` + gerenciador de templates.

### 2026-05 — Frames de imagem populáveis por nome de arquivo
Se o CSV contiver o nome exato do arquivo de imagem, o frame popula sozinho.
**Impacto:** alto — resolve um dos maiores pontos de atrito do fluxo. **Onde vive:**
`ImageResolver.ts`.

### 2026-05 — Frames de texto com comportamento configurável nas bordas
Referência ao Figma: crescer horizontal (com alinhamento esq/meio/dir), crescer vertical
(alinhamento cima/meio/baixo), ou não ultrapassar (com redução automática de fonte).
**Onde vive:** especificado como os 4 modos de overflow (`grow-vertical`,
`grow-horizontal`, `fixed-shrink`, `fixed-clip`) — ver CONTEXT.md, seção "Como o Motor de
Overflow Funciona".

### 2026-05 — Sistema de estilos de texto globais
Referência ao Affinity Publisher e ao Word: alterar um estilo atualiza todos os frames
vinculados automaticamente. **Impacto:** alto — essencial para manter identidade visual
consistente em lote. **Onde vive:** `StyleRegistry.ts`, observer pattern, herança via
`basedOn`.

### 2026-05 — Suporte a formas, objetos, bordas, ornamentos, paletas de marca
**Onde vive:** `FrameShape.ts` + `palette.brand` no `.editx`.

### 2026-05 — Rodar no navegador ou como app desktop
**Onde vive:** web primeiro (Fase 1); desktop via Tauri (Fase 5 do ROADMAP).

---

## 🤖 Ideias Ativas — Assistente

> Sugestões do Claude já aceitas, aguardando implementação.

### 2026-05-24 — Tauri em vez de Electron para desktop
Bundle 15× menor (~10MB vs ~150MB), sem Chromium embutido, mais seguro. → DEC-005.
**Prioridade:** média (Fase 5 do ROADMAP).

### 2026-05-24 — BatchGenerator.ts em Web Worker
Geração de 200+ itens no thread principal trava a UI; Worker mantém a interface
responsiva com progresso em tempo real. → DEC-007. **Prioridade:** alta.

### 2026-05-24 — TemplateSchema.ts implementado primeiro
Contrato entre todos os módulos; implementar o canvas antes dos tipos cria
inconsistências difíceis de corrigir. → DEC-009. **Prioridade:** alta — primeiro item do
backlog em STATUS.md.

### 2026-05-24 — Imagens por caminho relativo + opção "empacotar" em base64
Mantém o `.editx` leve e versionável; base64 só quando o usuário precisar compartilhar
sem a pasta de imagens. → DEC-002. **Prioridade:** média.

### 2026-05-24 — `outputNaming` no `csvMapping`
Nomeia os arquivos gerados com dados do CSV: `"{nome}-{preco}"` → `"coca-cola-5,99.pdf"`.
Elimina arquivos numerados sem sentido. **Prioridade:** média — já está no schema.

### 2026-05-24 — `skipRowsWhere` no `csvMapping`
Filtro de linhas do CSV direto no template (ex.: `ativo = "sim"`), evita limpar o CSV
antes de importar. **Prioridade:** baixa — já está no schema.

### 2026-05-24 — Campo `isDataPage: true` nas páginas
Em catálogos, a página de produto se repete por linha do CSV; a capa é estática. Sem essa
flag o sistema não sabe qual página repetir. **Prioridade:** alta — sem isso, catálogos
multipágina não funcionam.

### 2026-05-24 — Formatadores nativos de coluna CSV
`currency:BRL`, `date:DD/MM/YYYY`, `uppercase` — evita o usuário formatar dados antes de
importar. **Prioridade:** média — já está no schema (`columns[].format`).

### 2026-05-24 — `fallback` em frames de imagem
Em lotes de 500 produtos, é provável que alguns não tenham imagem. Sem fallback, o frame
quebra ou fica vazio. **Prioridade:** alta — já está no schema (`FrameImage.fallback`).

---

## 🛌 Adiadas

> Decisão consciente de não fazer agora. Cada item com **o gatilho que a traz de volta** («quando o
> terceiro caso aparecer», «se o build passar de X»): ideia adiada sem gatilho é ideia perdida.

*Nenhuma ainda.*

---

## ✅ Concluídas

*Nenhuma ainda — o boilerplate e o schema existem, mas nenhuma funcionalidade de runtime. Uma ideia só migra para
cá quando o código correspondente estiver de fato funcionando, não quando apenas
especificado no schema ou decidido em DECISIONS.md.*

---

## 🚫 Descartadas

- **Konva.js como motor de canvas** — descartado em favor do Fabric.js: API de texto e
  serialização menos madura para o tipo de editor necessário. Ver DEC-003.
- **Electron para desktop** — descartado em favor do Tauri: bundle de ~150MB, Chromium
  embutido, RAM elevada. Ver DEC-005.
- **Imagens sempre em base64 no `.editx`** — descartado: arquivo fica imenso e não é
  versionável com Git. Ver DEC-002.
- **Renderizar texto em HTML/CSS sobreposto ao canvas** — descartado: sincronização de
  posição frágil, inviável para exportação. Ver DEC-006.
- **jsPDF** — descartado em favor do pdf-lib: API mais moderna, suporte a PDF/X. Ver DEC-008.
- **Context API do React para estado global** — descartado: re-renders excessivos
  afetariam performance do canvas. Ver DEC-004.
- **Redux Toolkit** — descartado: boilerplate excessivo para um editor; Zustand resolve
  com menos código. Ver DEC-004.

---

## 🔭 Visão de Longo Prazo

> Ideias grandes demais para o ROADMAP atual, sem fase definida ainda.

- **Biblioteca de templates:** templates pré-prontos para os tipos mais comuns
  (supermercado, restaurante, boutique) — usuário abre, importa CSV, gera
- **Integração com Google Sheets:** importar dados diretamente de uma planilha sem
  exportar CSV
- **Reconhecimento de imagem por IA:** sugerir crop ideal da imagem dentro do frame
  (evitar rostos cortados, produto centralizado)
- **Exportação para redes sociais:** formatos otimizados para Instagram Feed, Stories,
  WhatsApp Business Catalog
- **Versão colaborativa:** múltiplos usuários editando o mesmo template (fase muito distante)
- **Plugin para Canva ou Figma:** exportar o sistema de frames para o workflow de quem já
  usa essas ferramentas
- **Modo "atualização de preços":** abrir catálogo existente, importar CSV com apenas os
  preços atualizados, regenerar só as páginas que mudaram

---

## 📌 Feedback para o Kit

> Desvios estruturais deste projeto em relação ao kit — material que volta para evoluir o KCM.

### 2026-07-11 — Integração do template-update (v2)
Ao aplicar o template-update, identificamos que o projeto vinha usando STATUS.md para
guardar plano de fases de médio/longo prazo (deveria estar em ROADMAP.md) e IDEAS.md sem
separação física entre ideias ativas e concluídas — ambos desvios das próprias regras de
higiene do kit, não causados pelo template em si, só expostos por ele ao comparar
estrutura. Também renomeamos `HISTORICO.md` para `HISTORY.md` para consistência de nomes
em inglês com os demais arquivos (CONTEXT/STATUS/DECISIONS/CHANGELOG/IDEAS/GLOSSARY/ROADMAP).
Ver DEC-010 para o registro completo da decisão.

### 2026-11-10 — Merge do template-update v1.135.0 (modo Code)
- **Nota da tabela de gatilhos contradiz o nicho:** o CEREBRO do kit diz que CHANGELOG/ROADMAP são
  «de outros nichos» e não se criam, mas o manifesto do nicho Desenvolvimento envia os dois. Mantida
  aqui a nota viva que os declara ativos (DEC-012).
- **`IDEAS` do template traz «📮 Feedback para o ASU» mesmo com ASU = `nao`** — seção de modo
  desligado viaja no template. Não adotada aqui.
- **`settings.json` do kit sem `Bash(date:*)`:** as três skills mandam rodar `date +%y%m%d-%H%M`
  para nomear o relatório; sem a permissão, cada relatório pede aprovação. Acrescentada aqui.
- **A contradição do v1.122.0 (CEREBRO «não remova sozinho» × manifesto «remova») está resolvida
  no v1.135.0** — os dois agora dizem «sobra sai, dita no relatório».
- **O kit cobra `GIT_OPTIONAL_LOCKS=0` no chat, mas o prompt de merge manda rodar `git status`
  ANTES de o CEREBRO novo ser lido** — quem está atrás de versão roda o comando sem a variável.
  Valeria pôr a variável no próprio prompt do merge.

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
