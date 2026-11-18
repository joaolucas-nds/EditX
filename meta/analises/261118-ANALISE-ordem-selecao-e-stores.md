# ANALISE — Ordem entre o `SelectionManager.ts` e os stores (`documentStore`, `historyStore`, `selectionStore`)

> **Status:** Decidida — o dono aceitou as três recomendações em 2026-11-18 (stores primeiro; desfazer junto; no
> arraste o conteúdo acompanha ao mover e só a caixa ao redimensionar) → DEC-021; aplicação: wo0016 (stores) e a WO
> seguinte (`SelectionManager.ts`). O texto abaixo fica como estava quando foi decidido.
> **Data:** 2026-11-18 (data de criacao; nao muda depois)
> **Origem:** pedido do dono depois da wo0015: «Analise a ordem entre SelectionManager.ts e os stores antes da WO».
> O backlog da F1 (STATUS e ROADMAP) lista o `SelectionManager.ts` ANTES dos stores.

## Problema

Até aqui o canvas só DESENHA o `.editx`: o `App.tsx` passa um template fixo (o exemplo importado) e o `CanvasView`
redesenha quando ele muda. O `SelectionManager.ts` é o primeiro passo em que a TELA muda o documento — selecionar,
mover, redimensionar. O resultado de mover precisa ir para algum lugar que guarde o documento novo, avise quem
desenha e permita desfazer. Hoje esse lugar não existe (`src/store/` não existe). Se a seleção vier primeiro, ela
escreve num estado provisório que os stores vão substituir; se os stores vierem primeiro, eles nascem sem quem os use
na tela. É uma decisão de ordem com retrabalho dos dois lados — por isso a análise.

## Restricoes / o que foi medido

**No repositório** (lido em 2026-11-18, sobre `6abc413`):
- **DEC-004** (aceita): Zustand + Immer para todo o estado global, «patches de undo/redo» com `produceWithPatches`,
  stores separados por domínio (`documentStore`, `selectionStore`, …). Instalados: zustand **4.5.7** (tem
  `zustand/vanilla`, que roda em Node sem React) e immer **10.2.0** (`enablePatches`, `produceWithPatches`,
  `applyPatches` no `immer.d.ts`).
- **Como cada frame vira objeto no Fabric hoje:** texto = **um `Path` por linha**, cada um com o próprio `clipPath`
  absoluto; imagem = `FabricImage` + `clipPath` absoluto; forma = um `Path`. Todos `selectable: false`,
  `evented: false`. Nenhum frame tem UM objeto que represente o frame inteiro — a seleção precisa de um.
- **`clipPath` com `absolutePositioned: true` não acompanha o objeto** quando ele é movido (é a razão de usá-lo).
- **`lock: true`** existe no formato e o exemplo usa (`frame-fundo-capa`): frame travado não deve ser selecionável.
- O `transform` é guardado na **unidade do documento** (mm no exemplo); o `PageGeometry.ts` tem `toPx` e não tem o
  inverso. Mover na tela produz px do mundo → precisa voltar para mm (e arredondar, para o `.editx` não guardar
  `10.0000000003`).
- **Custo de redesenhar a página** (medido no navegador embutido, `localhost:5173`, 2026-11-18, 5 rodadas com cache
  aquecido; painel oculto, tempos podem estar inflados): `prepareTextDrawings` **0,7–1,0 ms**; `prepareShapeDrawings`
  **~0 ms**; `prepareImageDrawings` **30–50 ms** (primeira: 371 ms) — a imagem é lida pelo `fetch` e decodificada
  de novo a cada vez, não há cache. Como `showPage` limpa tudo antes, **a cada mudança do documento a imagem some
  por ~2–3 quadros** — invisível hoje, porque nada muda o documento; visível a cada arraste quando a seleção existir.

## Opcoes consideradas

**A — Stores primeiro, seleção depois (duas WOs).** WO 1: `documentStore` (o template e a página ativa; ações puras
como `setFrameTransform`), `historyStore` (cada mudança do documento gera patches com `produceWithPatches`; desfazer
e refazer aplicam os inversos) e `selectionStore` (ids selecionados), todos em `zustand/vanilla` e testados em Node;
o `App`/`CanvasView` passam a ler o documento do store. WO 2: o `SelectionManager.ts` como adaptador fino — uma alça
por frame (retângulo invisível, `selectable` se o frame não está travado), eventos do Fabric viram ações do store; e
o cache das imagens decodificadas. *A favor:* a seleção já nasce escrevendo no lugar definitivo, com desfazer; os
stores são testáveis em Node (mesma divisão da DEC-016); a decisão do DEC-004 é cumprida como escrita. *Contra:* a
primeira WO não muda nada na tela.

**B — Seleção primeiro, com estado local no `CanvasView`.** O `SelectionManager` muda um `useState` do template; os
stores vêm depois e substituem esse estado. *Descartada:* o estado local é exatamente o que os stores vão trocar —
retrabalho certo, e mover sem desfazer é hostil a quem usa (um arraste errado não volta).

**C — Tudo numa WO só (stores + seleção + cache).** *Descartada:* três frentes novas no mesmo ciclo — store,
eventos do Fabric e cache — e a conferência de tela teria de separar defeito de um e de outro. As WOs deste projeto
que deram certo de primeira tinham uma frente cada.

**D — Stores primeiro, sem histórico (desfazer depois).** *Descartada:* o histórico com patches muda a FORMA das
ações do `documentStore` (toda mudança passa por um único ponto que gera patches); acrescentá-lo depois é reescrever
as ações. Custa pouco fazer junto.

## Recomendacao

**A — duas WOs, stores primeiro.**

1. **wo-stores** — `src/store/documentStore.ts`, `historyStore.ts` e `selectionStore.ts` em `zustand/vanilla`, com
   testes em Node: carregar template, trocar de página, `setFrameTransform` (o que a seleção vai chamar), desfazer,
   refazer, limite do histórico, e a regra de que mudança que não muda nada não entra no histórico. O `App` cria o
   store com o exemplo e o `CanvasView` lê o documento dele. Na tela: nada muda — e isso é a conferência (o canvas
   continua igual).
2. **wo-seleção** — `SelectionManager.ts`: uma alça por frame não travado; clicar seleciona (os controles do Fabric
   ajustados ao `pixelRatio`, armadilha do CONTEXT); **mover**: o desenho acompanha a alça durante o arraste
   (deslocamento só visual, inclusive dos `clipPath`) e o documento recebe o `transform` novo ao soltar — **uma**
   entrada no histórico por arraste; **redimensionar**: só a caixa muda durante o arraste e o frame é redesenhado ao
   soltar (redesenhar texto a cada movimento do mouse fica para depois). Junto: `fromPx` no `PageGeometry.ts`
   (com arredondamento a 0,01 da unidade) e **cache das imagens decodificadas por caminho**, para a imagem não piscar a
   cada mudança. Ctrl+Z / Ctrl+Shift+Z ligados ao histórico.

O backlog troca de ordem: stores antes do `SelectionManager.ts`.

*O melhor argumento contra:* a primeira WO é invisível, e um ciclo inteiro sem nada novo na tela é caro para quem
acompanha o projeto pela tela. A resposta é que ela é pequena e inteiramente testável sem tela, e que a alternativa
(B) troca esse ciclo invisível por um ciclo de retrabalho mais tarde.

## Riscos

- **O desenho e a alça se separarem durante o arraste** (o `clipPath` absoluto não acompanha). *Sinal:* texto ou
  imagem saindo do recorte enquanto se arrasta. *Mitigação:* deslocar os `clipPath` junto — escrito na WO.
- **Histórico guardando mudanças de mais** (um patch por movimento do mouse). *Sinal:* Ctrl+Z desfaz 1 px. A regra
  «uma entrada por arraste, gravada ao soltar» vai para os testes do store.
- **Ruído de casas decimais no `.editx`** depois de mover (`10.000000003`). Arredondar em `fromPx` — teste.
- **Redesenho inteiro a cada mudança** ainda redesenha todos os frames (texto ~1 ms, aceitável); só a imagem pede
  cache. Se uma página com dezenas de frames ficar lenta, o próximo passo é redesenhar só o frame que mudou — medir
  antes de fazer.
- **Tempos medidos com o painel oculto** (o próprio painel avisa que tempos em segundo plano podem estar distorcidos):
  a ordem de grandeza (texto ~1 ms × imagem ~40 ms) é o que importa para a decisão, não o número exato.

## Ponto de decisao

Três perguntas — as três com recomendação:

1. **Ordem:** stores primeiro (uma WO só deles, sem mudança na tela) e seleção depois — *recomendado* —, ou outra?
2. **Desfazer já na primeira WO** (`historyStore` com patches junto do `documentStore`) — *recomendado* —, ou depois?
3. **Durante o arraste:** ao mover, o conteúdo acompanha; ao redimensionar, só a caixa muda e o frame é redesenhado
   ao soltar — *recomendado* —, ou redesenhar o conteúdo continuamente também ao redimensionar (mais caro, mais
   parecido com o Canva)?

Respondidas, a próxima WO é a dos stores, e a decisão vira a DEC-021.
