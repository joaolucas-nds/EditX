# ANALISE — Como o `SelectionManager.ts` seleciona, move e redimensiona (e o que fica para depois)

> **Status:** Decidida — o dono aceitou as três recomendações em 2026-11-19 («vou com as três recomendações (só
> seleção simples, cantos proporcionais com Shift soltando, só as alças do eixo livre no texto que cresce)») →
> DEC-023; aplicação: wo0020. O texto abaixo fica como estava quando foi decidido.
> **Data:** 2026-11-19 (data de criacao; nao muda depois)
> **Origem:** pedido do dono: «Retome o EditX pelo ritual; leia o 261119-HANDOFF-BRIEF.md e faça a análise do
> SelectionManager.ts antes da WO». O brief (seção 4) listava sete pontos não decididos. A leitura do código e do
> Fabric 6.9.1 instalado resolve quatro deles como escolha técnica (seção «Escolhas técnicas», que vão para as
> armadilhas da WO); três são de produto e ficam no «Ponto de decisão».

## Problema

O canvas desenha o `.editx` e os stores guardam o documento com desfazer (DEC-021), mas nada na tela muda o
documento: todos os objetos do Fabric são `selectable: false, evented: false`. O `SelectionManager.ts` é o primeiro
passo interativo. O QUÊ principal já está decidido (DEC-021: mover com o conteúdo acompanhando, redimensionar só a
caixa até soltar, uma entrada de desfazer por arraste, `fromPx` com arredondamento, cache das imagens,
Ctrl+Z/Ctrl+Shift+Z). Falta decidir o COMO — que é meu — e três escolhas de comportamento — que são do dono. Sem elas a
WO ou chuta o comportamento (e o dono descobre na tela), ou cresce para cobrir tudo.

## Restricoes / o que foi medido

Lido em 2026-11-19, sobre `c59c0cf`, árvore limpa. Fabric: `node_modules/fabric/dist/index.mjs` (6.9.1).

**Do código do EditX**
- `src/canvas/SelectionManager.ts` **não existe** — só está previsto no CONTEXT («Seleção, multi-select, alinhamento,
  distribuição»).
- Cada frame vira VÁRIOS objetos: texto = um `Path` por linha, cada um com o próprio `clipPath`; imagem =
  `FabricImage` + `clipPath`; forma = um `Path`. Os `clipPath` são `absolutePositioned`. Não há objeto que represente o
  frame inteiro — a seleção precisa de um («alça»).
- **Todo desenho já carrega o `frameId` e o retângulo do frame** (`TextFrameDrawing`, `ImageFrameDrawing`,
  `ShapeFrameDrawing`, inclusive os de erro). O mapa objeto→id que o brief dava como ausente sai daí.
- **No texto, o retângulo desenhado NÃO é o `transform`:** `TextDrawing.frame` é o «retângulo final do frame (depois de
  grow-* e da âncora)» (`TextDrawing.ts:28`). O exemplo tem dois frames `grow-vertical` (um com âncora
  `middle-center`) e um `fixed-shrink`.
- O exemplo: 5 frames em 2 páginas, **1 travado** (`frame-fundo-capa`, a forma de fundo da capa), todos visíveis,
  **todos com `rotation: 0`**. Rotação não é desenhada em nenhum tipo (aviso no console).
- O validador aceita `width`/`height` **zero** (`nonNegative`, `FrameValidator.ts:45/96`): nada impede, hoje, um
  redimensionamento de gravar um frame de tamanho 0.
- `CanvasEngine.relayer()` **remove e readiciona** todos os objetos de frame a cada chegada de desenho (texto e imagem
  chegam por promessas separadas). `showPage` limpa os três tipos a cada mudança do template.
- `CanvasView` redesenha a página inteira a cada mudança do template; a imagem é lida e decodificada de novo a cada vez
  (30–50 ms, medido em 2026-11-18 — DEC-021).

**Do Fabric 6.9.1 (lido no fonte)**
- `object:modified` só dispara quando houve ação (`transform.actionPerformed`, linha 14313): clique sem arraste não
  grava nada — casa com a regra «mudança vazia não entra no histórico».
- Objeto com `clipPath` absoluto tem o cache **sempre sujo** (linha 7374): mover o `clipPath` junto com o conteúdo
  dispensa marcar `dirty`.
- **Remover o objeto ativo dispara `selection:cleared`** (linhas 13505–13515). Com o `relayer` e o `showPage` de hoje,
  qualquer redesenho apagaria a seleção — e, se o evento for repassado ao `selectionStore`, a apagaria também no
  documento.
- Padrões: `uniformScaling: true` com `uniScaleKey: 'shiftKey'` (linhas 13295–13296) — canto mantém a proporção,
  Shift solta; alças do meio são livres. `cornerSize: 13`, `padding: 0`, `borderScaleFactor: 1`,
  `transparentCorners: true`. `setControlVisible(chave, visível)` existe (linha 9674); a alça de girar é `mtr`.

## Escolhas tecnicas (minhas — vão para as armadilhas da WO, nao para o dono)

1. **Uma alça por frame:** `Rect` transparente, construída a partir do DESENHO (não do `transform`), então cobre o que
   o usuário vê — inclusive o texto que cresceu. Frame travado não ganha alça; invisível já não tem desenho. Frame com
   erro (retângulo vermelho) ganha: é o que o usuário vai querer arrastar ou consertar.
2. **Alças fora do `relayer` e reconciliadas por `frameId`:** um `Map<frameId, Rect>` no engine; desenho novo
   ATUALIZA a alça existente (posição e tamanho), cria a que falta e remove a que sumiu. **A alça ativa nunca passa por
   `canvas.remove`** — é o que mantém a seleção viva no redesenho. Entre si, as alças ficam na ordem do `zIndex` (o
   clique acerta o frame de cima); o conteúdo é `evented: false` e não atrapalha o clique.
3. **A seleção mora no `selectionStore`; o objeto ativo do Fabric é derivado.** Seleção feita por clique →
   `select([id])`; clique no vazio e Esc → `clear()`. Evento de seleção que o PRÓPRIO código provocou (troca de página,
   alça removida) não volta para o store.
4. **Mover:** no `object:moving`, desloca os objetos de conteúdo daquele frame (e os `clipPath` deles) pela mesma
   diferença — o engine passa a guardar os objetos por `frameId`. No `object:modified`, o documento recebe o
   `transform` novo. **A conta é por diferença, aplicada ao `transform`:** `x += fromPx(alça.left − desenho.left)`, idem
   `y`, `width`, `height`. Somar a diferença, e não converter a posição da alça, é o que não quebra o texto
   `grow-vertical` com âncora no meio (o retângulo desenhado não é o `transform`).
5. **Redimensionar:** no arraste só a alça escala (padrão do Fabric); ao soltar, largura = `width × scaleX`, a alça
   volta a escala 1 e o documento recebe o `transform`. `lockScalingFlip: true` e tamanho mínimo de 1 mm (convertido
   para a unidade do documento), porque o validador aceita zero.
6. **Rotação:** a alça `mtr` fica escondida. Girar gravaria um valor que nenhum desenho mostra; volta junto com o
   desenho da rotação (já está no IDEAS, «Rotação de frame desenhada»).
7. **Controles × `pixelRatio`** (`cornerSize`, `padding`, `borderScaleFactor`), atualizados quando o `resize` muda o
   `pixelRatio` — armadilha já registrada no CONTEXT (FIX-002).
8. **`fromPx(valor, unidade)`** no `PageGeometry.ts`, inverso do `toPx`, arredondado a 0,01 da unidade — o passo que a
   análise de 2026-11-18 já recomendava. 0,01 mm = 0,038 px CSS: abaixo do que a tela mostra, e sem `10.000000003` no
   `.editx`. Testes de ida e volta.
9. **Cache das imagens decodificadas** por caminho, por instância de `ProjectFiles` (um `WeakMap` no `CanvasView`):
   guarda a PROMESSA da imagem decodificada, não guarda falha (arquivo consertado é tentado de novo). Entra como
   parâmetro opcional de `prepareImageDrawings`, testado em Node (a 2ª chamada não lê o arquivo). Invalidação por
   arquivo mudado no disco fica para quando o projeto for pasta gravável (DEC-019).
10. **Atalhos no host, não no canvas:** um gancho em `ui/` com Ctrl+Z (desfazer), Ctrl+Shift+Z **e Ctrl+Y** (refazer —
    o atalho do Windows, que é o sistema do dono), Meta no lugar de Ctrl no Mac, e Esc (limpa a seleção). Ignora
    teclas digitadas em campo de texto (os painéis da UI mínima vêm depois). O rótulo do histórico distingue «mover» de
    «redimensionar».

## Opcoes consideradas (para as tres perguntas do dono)

**Escopo da WO**
- **A — Só seleção simples** (clicar, Esc, clicar no vazio), mover, redimensionar, desfazer. Multi-seleção,
  alinhamento e distribuição numa WO seguinte. *A favor:* uma frente; a multi-seleção do Fabric (`ActiveSelection`)
  passa os objetos para coordenadas RELATIVAS ao grupo, o que muda a conta de mover e o tratamento dos `clipPath` —
  é outra frente, com outros testes. *Contra:* o `selectionStore` já guarda lista e fica sub-usado por um ciclo.
- **B — Com multi-seleção** (Shift+clique, mover em grupo). *Descartada como recomendação:* soma a frente do
  `ActiveSelection` à primeira interação; se a tela errar, não se sabe qual das duas errou.
- **C — Com setas (empurrar 1 mm) e encaixe/guias.** *Descartada como recomendação:* as setas são baratas, mas o
  encaixe é uma frente inteira (de onde vêm as guias, tolerância, desenho delas). As setas podem vir com a
  multi-seleção.

**Cantos ao redimensionar**
- **A — Padrão do Fabric:** canto mantém a proporção, Shift solta; alças do meio livres. É o comportamento do Canva,
  que é a referência do produto (CONTEXT, «Visão Geral»). *Contra:* quem vem do Figma espera o inverso.
- **B — Canto livre, Shift mantém a proporção** (Figma). Uma linha de configuração (`uniformScaling: false`).

**Texto que cresce sozinho** (`grow-vertical` / `grow-horizontal`)
- **A — Só as alças do eixo livre:** `grow-vertical` mostra as alças laterais (largura); `grow-horizontal`, as de cima
  e de baixo; os cantos somem nos dois. *A favor:* a tela só oferece o que tem efeito. *Contra:* o usuário não
  consegue «fixar» a altura arrastando.
- **B — Arrastar no eixo que cresce troca o modo para fixo** (como o Figma faz com texto de altura automática).
  *Descartada como recomendação:* muda o `overflow.mode` do frame — uma segunda mudança no mesmo arraste, e uma regra
  de produto (para `fixed-shrink` ou `fixed-clip`?) que ainda não existe. Fica no IDEAS.
- **C — Todas as alças, e o motor recalcula.** *Descartada:* a altura gravada é ignorada pelo desenho; a caixa
  «volta» ao soltar e parece defeito.

## Recomendacao

**Uma WO (wo0020), na forma que a DEC-021 já fixou** — seleção + mover + redimensionar + `fromPx` + cache das imagens
+ atalhos —, com as dez escolhas técnicas acima como armadilhas e testes, e:
1. **Escopo A** — só seleção simples; multi-seleção, alinhamento, distribuição e setas na WO seguinte; encaixe/guias
   depois.
2. **Cantos A** — padrão do Fabric (proporção no canto, Shift solta).
3. **Texto que cresce A** — só as alças do eixo livre.

Juntar o cache à seleção não é troca de método: a DEC-021 já os juntou, e sem o cache a imagem pisca a cada arraste.

*O melhor argumento contra:* a WO ainda tem quatro peças (alça, cache, `fromPx`, atalhos) e mexe no `CanvasEngine`,
no `CanvasView`, no `FrameImage` e no `PageGeometry`. A resposta: `fromPx` e o cache são puros e testados em Node; o
risco de tela fica concentrado na alça, e é ela que a conferência do chat no navegador embutido examina.

## Riscos

- **Seleção apagada pelo redesenho** (o `selection:cleared` medido no fonte). *Sinal:* soltar um arraste e a seleção
  sumir. *Mitigação:* escolhas 2 e 3; teste da reconciliação em Node; conferência de tela «soltar e continuar
  selecionado».
- **Conteúdo e recorte se separando no arraste.** *Sinal:* texto ou foto saindo do recorte. Mitigação: escolha 4 —
  desloca o `clipPath` junto (sem `dirty`, medido).
- **Pisca ao soltar**, mesmo com o cache: `showPage` limpa tudo e texto e imagem voltam por promessas. Com fonte e
  imagem em cache as promessas devem resolver antes do próximo quadro — **hipótese, não medida**. *Sinal:* o frame some
  por um quadro ao soltar. *Se acontecer:* `showPage` deixa de limpar os frames quando só o template mudou (cada
  `set*Drawings` já substitui os seus) — fica como passo condicional da WO, a decidir pela conferência.
- **Texto que cresce saltando ao mover** (âncora no meio). Mitigação: a conta por diferença da escolha 4; teste com o
  `frame-titulo-capa`.
- **Frame de tamanho zero** gravado por redimensionamento. Mitigação: o mínimo da escolha 5; teste.
- **DPR ≠ 1 real nunca conferido** (FIX-002): os controles × `pixelRatio` só se conferem no navegador do dono — item
  sinalizado no roteiro.

## Ponto de decisao

Três perguntas, as três com recomendação:

1. **Escopo:** só seleção simples nesta WO (multi-seleção, alinhamento, distribuição e setas na seguinte; encaixe
   depois) — *recomendado* —, ou trazer a multi-seleção já?
2. **Cantos:** mantêm a proporção e o Shift solta (Canva, padrão do Fabric) — *recomendado* —, ou livres e o Shift
   mantém (Figma)?
3. **Texto que cresce:** só as alças do eixo que não cresce — *recomendado* —, ou arrastar no eixo que cresce troca o
   frame para fixo (Figma)?

Respondidas, a próxima entrega é a wo0020, e a decisão vira uma emenda da DEC-021 (ou uma DEC nova, se o dono
preferir). Vão para o IDEAS, pela WO: contorno ao passar o mouse sobre um frame; trocar o texto que cresce para fixo
ao arrastar (opção B da pergunta 3); setas para empurrar; encaixe e guias.
