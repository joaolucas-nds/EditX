# ANALISE — Multi-seleção, alinhamento, distribuição e setas

> **Status:** Decidida — o dono aceitou as quatro recomendações em 2026-11-20 («vou com as quatro recomendações;
> escreva a WO de extração do CanvasEngine e depois a da multi-seleção») → DEC-024; aplicação: wo0022 (extração) e a
> WO seguinte (multi-seleção). O texto abaixo fica como estava quando foi decidido.
> **Data:** 2026-11-19 (data de criacao; nao muda depois)
> **Origem:** pedido do dono depois da wo0021: «Comece a análise da multi-seleção com alinhamento, distribuição e setas».
> A DEC-023 adiou estas quatro coisas para «a WO seguinte»; o QUÊ ainda não tem comportamento definido.

## Problema

Hoje só um frame fica selecionado por vez. Montar um cartaz ou um cardápio é, quase sempre, pôr vários frames em
linha, espaçá-los por igual e acertar posições por pouco — e nada disso existe. O `selectionStore` já guarda uma lista
de ids (DEC-021), mas a tela só mostra e move o primeiro. Sem decidir o comportamento antes, a WO chuta: o que o
Shift+clique faz, a que se alinha um frame sozinho, quanto anda uma seta, e se segurar a seta enche o histórico.

## Restricoes / o que foi medido

Lido em 2026-11-19, sobre `c1ecd2a` (wo0021 empurrada). Fabric: `node_modules/fabric/dist/index.mjs` (6.9.1).

**Do Fabric 6.9.1 (lido no fonte)**
- **Shift+clique só junta com `selection: true`.** `handleMultiSelection` exige `this.selection`; o `CanvasEngine`
  cria o canvas com `selection: false`. Ligar a opção liga também o retângulo arrastado no vazio (`handleSelection`, no
  `mouseup`) — os dois vêm juntos. `selectionKey` padrão: `'shiftKey'`; `selectionFullyContained: false` (basta o
  retângulo TOCAR o objeto).
- **Objeto dentro de uma `ActiveSelection` guarda posição RELATIVA ao grupo:** `_enterGroup` aplica a inversa da
  matriz do grupo. Hoje o `SelectionManager.setFrames` põe cada alça em coordenadas do mundo (`left`/`top`); com a alça
  dentro do grupo, isso a poria no lugar errado. `getCoords()` devolve o mundo mesmo para membro de grupo.
- **Ordem dos eventos:** o `mouse:down` dispara DEPOIS de o Fabric juntar ou tirar o clicado da seleção; o retângulo
  se resolve no `mouseup` antes do `mouse:up`. Ler `getActiveObjects()` nesses dois eventos dá o resultado do gesto —
  sem usar os `selection:*`, que também disparam com mudança feita pelo código (DEC-023).

**Do repositório**
- `setFrameTransform` grava UMA entrada por frame; alinhar 3 frames assim daria 3 entradas — Ctrl+Z desfaria um terço.
- O texto que cresce tem caixa desenhada diferente do `transform` (DEC-023): alinhar e distribuir precisam usar a caixa
  DESENHADA (a das alças) e converter pela diferença (`transformFromHandle`), não o `transform`.
- Na página de produto do exemplo há 3 frames destravados (foto, nome, preço) — dá para testar distribuição; na capa, 1.
- `SelectionManager.ts` tem 240 linhas e o `CanvasEngine.ts` 388; o IDEAS já marca a extração do engine para «quando o
  engine ganhar a próxima responsabilidade (a multi-seleção)».
- Não há UI: nenhum botão onde pôr «alinhar». A UI mínima (Toolbar) é o item seguinte do backlog.

**Das ferramentas de referência (pesquisa, 2026-11-19)**
- Figma, Canva e Adobe Express: Shift+clique soma/tira da seleção; arrastar no vazio seleciona por retângulo;
  Ctrl+A seleciona tudo (Canva); setas empurram 1 px e Shift+setas 10 px (os três).
- Figma distribui mantendo os dois frames das pontas no lugar e igualando os ESPAÇOS entre eles.
- Figma alinha por Alt+A/D/W/S/H/V; para distribuir as fontes divergem (Alt+Shift+H/V × Ctrl+Alt+H/V) — não conferi
  na fonte oficial. **Não medido aqui, e é o que pesa:** no navegador, Alt+D leva o foco à barra de endereço do Chrome e
  do Edge; no Windows, Alt+Shift troca o idioma do teclado quando há mais de um instalado; num teclado ABNT, Ctrl+Alt é
  o AltGr. Em app desktop (Tauri, Fase 2) os conflitos do navegador somem.

## Escolhas tecnicas (minhas — vão para as armadilhas da WO)

1. **`ActiveSelection` do Fabric, com `selection: true`** — Shift+clique e retângulo sem código próprio. O store
   continua sendo a fonte: no `mouse:down` e no `mouse:up` o `SelectionManager` lê `getActiveObjects()` e manda os ids
   (`onSelect(ids)`); `setSelected(ids)` monta a `ActiveSelection` a partir do store.
2. **Redesenho com grupo ativo:** antes de reposicionar as alças, o `setFrames` desfaz o grupo (sem avisar o store),
   põe cada alça no mundo e remonta o grupo pelos ids do store — a medida do `_enterGroup` é o porquê.
3. **Mover em grupo:** no `object:moving` com o grupo como alvo, o conteúdo de TODOS os membros anda a diferença do
   grupo; ao soltar, a caixa de cada membro sai de `getCoords()` e vira `transform` por `transformFromHandle`.
4. **Uma entrada de desfazer por gesto:** ação nova `setFrameTransforms(mudanças, rótulo)` — um `edit` só, para mover
   em grupo, alinhar, distribuir e empurrar. `setFrameTransform` continua para um frame.
5. **Contas puras e testadas em Node** num módulo novo (`SelectionLayout.ts`): alinhar e distribuir sobre as caixas
   desenhadas, e o passo da seta convertido para a unidade do documento. O `SelectionManager` não ganha contas.
6. **Extração do `CanvasEngine`** (gatilho do IDEAS disparado): numa WO própria, ANTES desta, só de mover código
   (as conversões desenho → objeto do Fabric) — refactor separado de comportamento novo.

## Opcoes consideradas (para as quatro perguntas do dono)

**1 — Escopo do gesto**
- **A — Shift+clique, retângulo no vazio (basta tocar) e Ctrl+A; o grupo só MOVE** (sem alças de redimensionar).
  *A favor:* é o que as três ferramentas fazem para juntar; o Fabric dá os dois gestos juntos. Redimensionar em grupo
  escala frames de texto que crescem e imagens com `fit` — outra frente, com outras regras. *Contra:* quem quer
  aumentar dois frames juntos não consegue.
- **B — Só Shift+clique** (retângulo depois). *Descartada como recomendação:* desligar o retângulo é trabalho a mais,
  não a menos — vem junto com o Shift+clique.
- **C — Com redimensionar em grupo.** *Descartada como recomendação:* pelo motivo acima.

**2 — Referência de alinhar e distribuir**
- **A — Dois ou mais frames: alinham à caixa da seleção; um frame sozinho: alinha à área de corte da página (sem a
  sangria). Distribuir pede três ou mais e iguala os espaços, com as pontas paradas** (Figma). *A favor:* um frame
  sozinho «centralizado» é o pedido mais comum num cartaz. *Contra:* a mesma ação muda de referência com o número de
  frames — e isso precisa estar escrito no botão quando ele existir.
- **B — Sempre à caixa da seleção** (um frame sozinho não alinha). *Descartada como recomendação:* perde o
  «centralizar na página».
- **C — Distribuir pelos centros** (passo igual entre centros). *Descartada como recomendação:* com frames de tamanhos
  diferentes os espaços ficam desiguais, que é o que se vê.

**3 — Como acionar alinhar e distribuir agora, sem UI**
- **A — Só as ações, testadas, nesta WO; botões vêm com a Toolbar (próximo item); na tela, conferência pelo console
  (`__editx`).** *A favor:* nenhum atalho escolhido no escuro — Alt+D, Alt+Shift e Ctrl+Alt têm conflitos não medidos
  no navegador e no Windows do dono. *Contra:* por um ciclo, alinhar só existe pelo console.
- **B — Atalhos do Figma já** (Alt+A/D/W/S/H/V; distribuir em Alt+Shift+H/V). *Descartada como recomendação:* os
  conflitos acima; pode voltar depois de medi-los.
- **C — Fazer a Toolbar agora, junto.** *Descartada:* é outra frente (a UI mínima) — duas frentes na mesma WO.

**4 — Setas**
- **A — 1 mm, e 10 mm com Shift** (em documento em px: 1 px e 10 px); vale para um frame ou para o grupo; **toques
  seguidos na mesma seleção viram UMA entrada de desfazer** até ela mudar ou passar 1 s sem tecla. *A favor:* mm é a
  unidade de quem imprime; segurar a seta 1 s gera ~30 toques — sem juntar, enche o histórico (limite 100) e Ctrl+Z
  desfaz 1 mm por vez. *Contra:* juntar pede uma operação nova no `historyStore`.
- **B — 1 px de tela e 10 com Shift, como Canva e Figma.** *Descartada como recomendação:* 1 px CSS = 0,26 mm, e o
  passo mudaria com o zoom; num documento em mm o passo inteiro é o que se confere na régua.
- **C — Uma entrada por toque.** Mais simples; o custo é o histórico acima.

## Recomendacao

**Duas WOs: primeiro a extração do `CanvasEngine` (só mover código), depois a multi-seleção** com as escolhas técnicas
acima e **1A, 2A, 3A, 4A**: Shift+clique, retângulo e Ctrl+A, grupo que só move; alinhar à seleção ou, sozinho, à
página, e distribuir igualando espaços; alinhar e distribuir como ações testadas, sem atalho, até a Toolbar; setas de
1 mm e 10 mm, com os toques seguidos juntos numa entrada.

*O melhor argumento contra:* 3A deixa a funcionalidade mais visível desta frente sem gatilho na tela por um ciclo. A
resposta é que o gatilho certo é o botão — e a Toolbar é justamente o próximo item; escolher letras de atalho agora é
apostar em três conflitos que ninguém mediu.

## Riscos

- **Alça no lugar errado depois de soltar um grupo** (coordenada relativa ao grupo, medida). *Sinal:* depois de mover
  dois frames, as alças aparecem deslocadas. *Mitigação:* escolha 2; conferência de tela «soltar o grupo e as alças
  ficam nos frames».
- **Seleção do store e do Fabric divergirem** (Shift+clique tira um frame e o store não sabe). *Mitigação:* escolha 1
  — ler o resultado nos dois eventos do gesto; teste de tela com tirar e pôr.
- **Toques de seta juntados de mais** (um empurrão de agora somado a um de minutos atrás). *Mitigação:* janela de 1 s
  e seleção igual; teste em Node com relógio falso.
- **`SelectionManager.ts` passar de ~300 linhas** com o grupo. *Mitigação:* contas no módulo puro (escolha 5); se
  passar mesmo assim, entra no IDEAS como a extração do engine entrou.
- **Atalhos de referência não conferidos na fonte oficial** (o de distribuir no Figma diverge entre fontes): não pesa
  em 3A, pesa se o dono escolher 3B.

## Ponto de decisao

Quatro perguntas, as quatro com recomendação:

1. **Gesto:** Shift+clique, retângulo no vazio (basta tocar) e Ctrl+A, com o grupo só movendo — *recomendado* —, ou
   outro recorte?
2. **Referência:** com dois ou mais frames, alinhar à caixa da seleção; com um, à área de corte da página; distribuir
   (três ou mais) igualando os espaços com as pontas paradas — *recomendado* —, ou outra?
3. **Acionar agora:** só as ações testadas, botões com a Toolbar — *recomendado* —, ou atalhos do Figma já?
4. **Setas:** 1 mm e 10 mm com Shift, toques seguidos numa entrada de desfazer — *recomendado* —, ou 1 px/10 px de
   tela, ou uma entrada por toque?

E a ordem: a WO de extração do `CanvasEngine` antes desta — escolha técnica minha; diga se preferir o contrário.
