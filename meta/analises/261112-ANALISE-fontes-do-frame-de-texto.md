# ANALISE — De onde vêm os arquivos de fonte do `FrameText.ts` na F1

> **Status:** Em discussao
> **Data:** 2026-11-12 (data de criacao; nao muda depois)
> **Origem:** preparação da WO do `FrameText.ts`, logo depois de o canvas da wo0004/wo0005 ser conferido pelo dono na tela.

## Problema

O motor de overflow (DEC-006, CONTEXT «Como o Motor de Overflow de Texto Funciona») mede a altura das
linhas com o `opentype.js` — ascender e descender **da fonte real**. Para isso o motor precisa dos BYTES
do arquivo da fonte. O `.editx` só guarda o NOME (`TextStyle.fontFamily`: `'Montserrat'`, nos pesos 600,
700 e 800 no exemplo), e **nenhum documento decide de onde vem o arquivo**: upload de fontes é item da F2
(ROADMAP, «Upload de fontes customizadas (TTF/OTF via opentype.js)»).

Se nada for decidido, o `FrameText.ts` não tem como medir — ou mede com a fonte que o navegador tiver à
mão, e o mesmo `.editx` gera layouts diferentes em máquinas diferentes (quebra de linha e `fixed-shrink`
dependem da largura exata de cada letra). Em geração de lote isso é o pior defeito possível: o arquivo de
saída muda conforme o computador.

## Restricoes / o que foi medido

- **`opentype.js` instalado = 1.3.4** (`node_modules/opentype.js/package.json`). O README declara suporte a
  **WOFF, OTF e TTF**; `grep -i "woff2\|wOF2" dist/opentype.module.js` = **0 ocorrências** → **não lê WOFF2**.
  Fonte variável: só há código de *encode* de deltas `gvar` — tratar como **sem suporte** (um arquivo
  estático por peso).
- **O Google Fonts serve WOFF2** a navegadores modernos pela API de CSS — baixar de lá em tempo de execução
  não serve para o `opentype.js` sem um decodificador WOFF2 a mais. *(Comportamento do Google Fonts: de
  conhecimento, não medido neste turno.)*
- **A exportação em PDF (pdf-lib, DEC-008) vai precisar dos mesmos bytes** para embutir a fonte no arquivo.
  Qualquer opção que não tenha o arquivo só adia o problema até a exportação.
- **O exemplo usa Montserrat 600, 700 e 800**; um estilo novo usaria 400 (o normal).
- **`opentype.js` roda em Node** (o pacote tem build CommonJS, `dist/opentype.js`): o motor de layout pode ser
  testado no Vitest lendo o `.ttf` do disco — mesma estratégia da DEC-016 (lógica pura testada, adaptador fino).

## Opcoes consideradas

**A — Fontes embarcadas no app, lista fechada na F1 (recomendada).** Arquivos `.ttf` estáticos, de licença
livre, versionados em `public/fonts/` com o arquivo de licença ao lado. Um `FontRegistry.ts` mapeia
`(família, peso)` → arquivo e carrega/cacheia o `opentype.Font`. Na F1: **Montserrat em 400, 600, 700 e 800**
(cobre o exemplo e o peso normal). Peso pedido que não existe → usa o peso disponível mais próximo, pela
regra de correspondência do CSS, e avisa no console.
Ganho: layout determinístico em qualquer máquina, funciona offline, o PDF da F3 já tem os bytes, e o motor é
testável em Node. Custo: alguns arquivos binários no repositório (da ordem de centenas de KB) e uma lista
curta de famílias até a F2.

**B — Baixar do Google Fonts em tempo de execução.** Descartada: entrega WOFF2, que o `opentype.js` 1.3.4 não
lê (medido); exigiria decodificador extra, rede para abrir qualquer template e quebra offline (o desktop Tauri
da F2 é justamente para uso offline).

**C — Fontes do sistema, medidas só pelo `measureText` do canvas.** Descartada: contradiz a DEC-006 (altura
pelo `opentype.js`), dá layout diferente por máquina, e não resolve o PDF (sem bytes para embutir).

**D — Antecipar o upload de fontes da F2.** Descartada para agora: escopo de outra fase; e mesmo com upload o
app precisa de fontes padrão. Fica como evolução natural de A — o `FontRegistry.ts` passa a aceitar fontes do
usuário.

## Recomendacao

**Opção A**, com Montserrat 400/600/700/800, e o `FrameText.ts` em **duas WOs**:

1. **Fontes + `FontRegistry.ts` + motor de layout puro** (`TextLayout.ts`: quebra de linha e os modos
   `grow-vertical` e `fixed-clip`), testado no Vitest com a Montserrat real lida do disco.
2. **Desenho no Fabric** (`FrameText.ts`): mostrar os frames de texto do exemplo na página, conferido por você
   na tela.

Porquê: é a única opção com layout igual em toda máquina — sem isso, a geração em massa não é confiável — e
a que já deixa pronta a exportação em PDF. O melhor argumento contra: amarrar a F1 a uma família só, que pode
não combinar com os primeiros templates reais. Resposta: acrescentar outra família de licença livre é só
mais arquivos na mesma pasta e uma linha no registro — a decisão cara (o formato e o caminho) é a desta análise.

**Quem baixa os arquivos:** o Claude Code, com a sua aprovação na hora (download é ação que pede permissão),
do repositório oficial `google/fonts` no GitHub, pasta da Montserrat, junto com o `OFL.txt` (a licença vem no
próprio repositório; o nome e a licença exatos são conferidos ao baixar, não de memória).

## Riscos

- **Arquivo de fonte trocado ou corrompido** muda layout em silêncio. Sinal: teste do motor com medida fixa
  da Montserrat (largura de uma palavra conhecida) passa a falhar.
- **Template com `fontFamily` fora da lista** (digitado à mão ou de outra fonte): sem arquivo, não mede.
  Proposta: o `FontRegistry.ts` acusa com erro claro na tela, não troca de família em silêncio. O validador
  NÃO passa a recusar a família agora (seria mudar o formato; volta a pensar com o upload da F2).
- **Peso mais próximo** pode surpreender (pedir 500 e receber 400). Sinal: o aviso no console.

## Ponto de decisao

Aprova a **Opção A** (Montserrat 400/600/700/800 em `.ttf`, versionadas em `public/fonts/` com a licença,
baixadas pelo Claude Code do `google/fonts` com a sua aprovação), com o `FrameText.ts` em duas WOs — primeiro
fontes + motor de layout testado, depois o desenho no canvas?
