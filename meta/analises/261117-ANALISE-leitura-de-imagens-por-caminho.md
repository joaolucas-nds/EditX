# ANALISE — Como o navegador lê as imagens referenciadas por caminho relativo (`FrameImage.ts`)

> **Status:** Decidida — o dono aceitou as três recomendações em 2026-11-17 (Chrome/Edge com a pasta do projeto e
> Firefox/Safari só leitura; projeto = pasta; caminhos relativos ao `.editx` e `..` recusado) → DEC-019; aplicação:
> wo0012 (`FrameImage.ts` sobre a fonte de arquivos de desenvolvimento). As fontes da pasta (Chrome/Edge e
> Firefox/Safari) entram com a UI de abrir projeto. O texto abaixo fica como estava quando foi decidido.
> **Data:** 2026-11-17 (data de criacao; nao muda depois)
> **Origem:** preparação da WO do `FrameImage.ts` (próximo item do backlog da F1), a pedido do dono: «comece pela
> análise de como o navegador lê a imagem por caminho».

## Problema

O DEC-002 decidiu que frame de imagem guarda um **caminho relativo ao `.editx`** (ex.: `./imagens/coca-cola.jpg`)
e que «o template é portátil desde que a pasta de imagens acompanhe o arquivo». Isso pressupõe que o programa saiba
**onde está o `.editx`** e possa ler a pasta ao lado dele. Um app de navegador não sabe nenhuma das duas coisas: abrir
um arquivo (por `<input type="file">` ou `showOpenFilePicker`) entrega o CONTEÚDO do arquivo, nunca a pasta em que
ele está — e por segurança não existe API que suba de um arquivo para a pasta-mãe. Sem decidir de onde vêm os bytes
das imagens, o `FrameImage.ts` não tem o que desenhar, e o `ImageResolver.ts` (F3, coluna de imagem do CSV) herda o
mesmo buraco.

É o mesmo tipo de pergunta que a análise das fontes respondeu para o texto (`261112-ANALISE-fontes-do-frame-de-texto.md`):
o `.editx` guarda um NOME, e alguém precisa dizer de onde vêm os bytes.

## Restricoes / o que foi medido

**No repositório** (lido em 2026-11-17, sobre `e3da928`):
- `src/types/frame.types.ts` — `ImageFrame`: `fit: 'contain' | 'cover' | 'fill' | 'none'`, `align: 'left' | 'center' | 'right'`,
  `borderRadius` (mm), `fallback?` (caminho), e `role: 'data'` + `csvColumn` ou `role: 'static'` + `src`.
- `src/template/TemplateSchema.ts` — `csvMapping.imageBasePath`: «Pasta (relativa ao `.editx`) onde `ImageResolver.ts`
  procura os arquivos referenciados por colunas do tipo `image`».
- `src/template/ValidationRules.ts` — `relativePath` só recusa caminho que começa com `/`, `\` ou `C:`. **Aceita
  `..`** — um caminho como `../outra-pasta/x.jpg` passa no validador.
- **Incoerência no formato:** o JSDoc de `fallback` diz «relativo (à pasta de imagens do `.editx`)», enquanto o JSDoc do
  frame, o DEC-002, a mensagem do validador e o exemplo (`fallback: './imagens/_placeholder.png'`, com
  `imageBasePath: './imagens'`) tratam como relativo ao `.editx`. Se fosse relativo à pasta de imagens, o exemplo
  apontaria para `./imagens/imagens/_placeholder.png`.
- O exemplo só tem frame de imagem `role: 'data'`; **nenhum arquivo de imagem existe no repositório** (`public/assets/`
  vazio — o `placeholder.png` citado no CONTEXT também não existe).
- **Não há UI de abrir arquivo:** o `App.tsx` mostra o exemplo importado no código. Como o usuário abre um `.editx` ainda
  não foi decidido — e esta análise toca nisso.
- ROADMAP: F5 (Tauri) traz «acesso direto à pasta de imagens local» — o desktop resolve o caso de vez, mas é a última fase.

**Nas plataformas** (pesquisado em 2026-11-17; fontes no fim):
- **File System Access API (`showDirectoryPicker`)** — o usuário escolhe uma PASTA e o app recebe um
  `FileSystemDirectoryHandle` para ler (e, se pedir, gravar) dentro dela. Só em navegadores Chromium (Chrome e Edge
  desde a 86). Firefox tem posição **negativa** e Safari **se opõe** (segurança); a web-features classifica como
  «muito improvável de virar Baseline nesta forma».
- **Persistência:** o handle pode ser guardado no IndexedDB (é o que o VS Code web faz). Desde o Chrome 122, na visita
  seguinte o app chama `requestPermission()` e o usuário vê um aviso de três opções que pode liberar a pasta de vez;
  em app instalado (PWA) a permissão persiste sozinha.
- **Um handle de pasta não sobe para a pasta-mãe:** caminho com `..` que sai da pasta escolhida não é legível. [lido na
  especificação do handle: só há `getDirectoryHandle`/`getFileHandle` para filhos — deduzido para o caso `..`]
- **`<input type="file" webkitdirectory>`** — escolher uma pasta funciona em Chrome, Edge, Firefox (50+) e Safari
  (11.1+). Entrega a LISTA de todos os arquivos da pasta e subpastas, com o caminho relativo de cada um
  (`webkitRelativePath`). Só leitura, sem persistência (escolher de novo a cada sessão), e o Chrome mostra um aviso de
  confirmação. Há bug aberto no WebKit sobre o Safari deixar escolher arquivos soltos em vez da pasta.
- **Tauri 2 (F5):** o protocolo `asset` serve arquivos do disco ao WebView com `convertFileSrc(caminhoAbsoluto)`,
  limitado por um escopo em `tauri.conf.json`; pasta escolhida em tempo de execução precisa do
  `tauri-plugin-persisted-scope` para sobreviver ao reinício.

**Público do produto** (CONTEXT, «Para quem»): PMEs e profissionais de marketing — na prática, Windows com Chrome ou
Edge é o caso dominante [deduzido, não medido: não há dado de uso].

## Opcoes consideradas

**A — Pasta do projeto via File System Access (Chromium).** O usuário abre a PASTA do projeto (onde está o `.editx`);
o app guarda o handle no IndexedDB, lê o `.editx` e todas as imagens por caminho relativo a ela, e pode GRAVAR o
`.editx` de volta no mesmo lugar. *A favor:* é exatamente o modelo do DEC-002 (pasta = projeto); leitura sob demanda
(não enumera milhares de fotos); salvar sem «baixar»; reabre na próxima visita com um clique. *Contra:* só Chrome/Edge;
caminho com `..` não funciona.

**B — Pasta escolhida por `webkitdirectory` (todos os navegadores).** O app recebe a lista de arquivos da pasta e monta
um mapa `caminho relativo → File`. *A favor:* funciona em Firefox e Safari. *Contra:* só leitura (salvar = baixar um
`.editx` novo); escolher a pasta a cada sessão; enumera a pasta inteira de uma vez (lento em pasta com milhares de
fotos — não medido); aviso de confirmação do Chrome; bug do Safari.

**C — Copiar as imagens para dentro do app (OPFS/IndexedDB).** O usuário «importa» as imagens uma vez e o app guarda
cópias no armazenamento do navegador. *Descartada:* a fonte de verdade deixa de ser a pasta no disco (DEC-002) — foto
trocada na pasta não aparece no app, e duas cópias divergem em silêncio; o armazenamento do navegador pode ser apagado
pelo próprio navegador sob pressão de espaço.

**D — Embutir as imagens em base64 sempre.** *Descartada:* é a alternativa que o DEC-002 já recusou (arquivo imenso,
não versionável). Continua existindo como a opção «Empacotar tudo» do DEC-002, que é outra funcionalidade.

**E — Esperar o Tauri (F5).** *Descartada:* trava o `FrameImage.ts` e a F3 inteira atrás da última fase do roadmap.

**F — Buscar por URL (`fetch`) a partir de uma base conhecida.** Para o exemplo em desenvolvimento, as imagens ficam em
`public/` e o app as busca por `fetch('/exemplo/imagens/x.jpg')`. *A favor:* já funciona hoje, sem UI, e é testável.
*Contra:* não serve para o usuário (ele não tem servidor). **Só como fonte de desenvolvimento e demonstração**, nunca
como a solução do produto.

## Recomendacao

**Uma interface de «fonte de arquivos do projeto», com A como caminho principal, B como alternativa para Firefox/Safari,
F para o exemplo em desenvolvimento, e Tauri entrando depois pela mesma porta.**

1. **Um contrato só para ler bytes por caminho**, que o resto do app usa sem saber de onde vêm:
   `read(caminhoRelativo) → Blob | null` (e, mais tarde, `write` para salvar o `.editx`). O `FrameImage.ts` e o
   `ImageResolver.ts` recebem essa fonte pronta — é a mesma separação da DEC-016 (cálculo puro × adaptador).
2. **Regras de caminho puras e testadas**, num módulo sem DOM: normalizar (`./` some, `\` vira `/`, barras repetidas
   colapsam) e **recusar caminho que sai da pasta do projeto** (`..` acima da raiz). O validador passa a recusar
   esse caso também — o `.editx` está em `0.1.0`, não lançado, então a regra entra sem migração.
3. **Uma regra para todos os caminhos de imagem:** `src` e `fallback` são relativos ao `.editx`; o valor da coluna
   de imagem do CSV é relativo a `imageBasePath`. O JSDoc de `fallback` é corrigido para dizer isso.
4. **Projeto = pasta.** «Abrir» passa a ser «abrir a pasta do projeto» (achar o `.editx` dentro dela). É o que torna
   o DEC-002 verdadeiro no navegador, e é o mesmo modelo que o Tauri usa na F5.
5. **Ordem de entrega:** a próxima WO faz o `FrameImage.ts` (desenho com os quatro `fit` e o `align`, recorte pelo
   frame, `borderRadius`, `fallback` e o retângulo de erro como o do texto) sobre o contrato do item 1, com a fonte F
   lendo imagens de exemplo em `public/`. As fontes A e B entram com a UI de abrir projeto (junto do `documentStore`
   e da Toolbar, ainda na F1) — sem UI de abrir não há quem escolha a pasta.

*O melhor argumento contra:* duas implementações de navegador (A e B) são o dobro de código de leitura para manter,
e B nunca grava — o usuário de Firefox terá uma experiência pior (salvar baixa um arquivo). Uma alternativa mais
barata seria declarar o app «só Chrome/Edge» na F1 e adiar B. A recomendação mantém B porque o contrato do item 1
deixa B pequena (um mapa de `File`s) e porque um editor que não abre no Firefox perde usuário na primeira visita; mas
adiar B é escolha legítima do dono (ponto de decisão 1).

## Riscos

- **Maiúsculas e minúsculas.** No Windows, `Coca.JPG` e `coca.jpg` são o mesmo arquivo; o handle de pasta e o mapa da
  opção B comparam nomes como texto. CSV escrito à mão vai errar a caixa. *Sinal cedo:* imagem que existe na pasta e
  cai no `fallback`. *Mitigação:* o `ImageResolver.ts` (F3) procura sem diferenciar caixa e avisa quando achou assim.
- **Permissão negada ou esquecida** (A). *Sinal:* reabrir o projeto e todas as imagens caírem no `fallback`.
  *Mitigação:* o app pede a permissão de novo ao abrir e mostra um aviso claro em vez de desenhar o lote com fallback.
- **Pasta enorme** (B). Enumerar milhares de fotos de uma vez pode travar a escolha — não medido; medir quando B for
  implementada.
- **Imagem grande no canvas.** Foto de câmera (20+ MP) decodificada inteira por frame pesa memória no lote de 500;
  é assunto do `BatchGenerator.ts` (Web Worker, F3), mas o contrato do item 1 devolver `Blob` (e não um elemento
  `<img>` já decodificado) deixa a porta aberta para redimensionar antes.
- **`..` já usado por alguém.** Nenhum `.editx` foi distribuído (formato não lançado) — risco teórico hoje; vira real
  depois do lançamento, por isso a regra entra agora.

## Ponto de decisao

Três perguntas — as três com recomendação; a 1 é a única com custo real dos dois lados:

1. **Navegadores na F1:** Chrome/Edge com pasta do projeto (A) **e** Firefox/Safari só leitura (B) — *recomendado* —,
   ou só Chrome/Edge por enquanto (B adiada)?
2. **Projeto = pasta:** «Abrir» passa a ser escolher a pasta do projeto, que contém o `.editx` e as imagens. Aceita?
3. **Caminhos:** todos relativos ao `.editx` (coluna do CSV relativa a `imageBasePath`) e `..` que sai da pasta passa
   a ser recusado pelo validador. Aceita?

Com as três respondidas, a próxima WO é o `FrameImage.ts` (item 5 da recomendação), com a decisão registrada como
DEC-019.

## Fontes

- [web.dev — How to open a directory](https://web.dev/articles/files/open-a-directory)
- [caniuse — Window API: showDirectoryPicker](https://caniuse.com/mdn-api_window_showdirectorypicker)
- [web-features — File system access](https://web-platform-dx.github.io/web-features-explorer/features/file-system-access)
- [Chrome for Developers — Persistent permissions for the File System Access API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api)
- [caniuse — HTML element: input: webkitdirectory](https://caniuse.com/mdn-html_elements_input_webkitdirectory)
- [WebKit Bugzilla 284457 — webkitdirectory no Safari](https://bugs.webkit.org/show_bug.cgi?id=284457)
- [Tauri 2 — Asset protocol scope](https://v2.tauri.app/security/asset-protocol/)
