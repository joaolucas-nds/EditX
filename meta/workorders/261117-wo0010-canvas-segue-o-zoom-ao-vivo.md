# WO 0010 — Canvas acompanha a troca de zoom com a página aberta (regressão da wo0009, FIX-002)

> **Tipo:** mista — CÓDIGO (`CanvasEngine.ts`, `CanvasView.tsx`) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — mesmo adaptador da wo0009; mudança pequena, mas é onde a regressão nasceu.
> **Pré-requisito:** escrita sobre `5d85865` (`fix(canvas): deixa o canvas nitido em qualquer zoom do navegador`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 105 testes verdes (relatório da wo0009).
> **Base:** conferência de tela do FIX-002 feita pelo chat no navegador embutido em 2026-11-17 (o dono deixou o `npm run dev` rodando e pediu que o chat conferisse). Regressão da wo0009 medida (seção 1). Registro: FIX-002 (Edição 4).
> **Depende de:** wo0009 (aplicada: `5d85865`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `bd967605e2181f9a04f002c7a1ad74aab95726fe  meta/CONTEXT.md`
> - `d01fcb5e88aaa4b0cb8092eccba0fd880a13e2a8  meta/CEREBRO.md`
> - `a04d555f8a2372a5b7f8220fb01ff07709a48183  logs/2026-11-17.md` (arquivo novo, `??`)
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-17, no disco, neste turno, sobre `5d85865`): `src/canvas/CanvasEngine.ts` — o JSDoc do `resize` (as 4 linhas de prosa, de `   * Ajusta o canvas ao contêiner e reenquadra a página. O buffer recebe px do DISPOSITIVO` a `   * enquadramento já as inclui.`) e a linha `    this.canvas.setDimensions({ width: size.cssWidth, height: size.cssHeight }, { cssOnly: true });`; `src/ui/CanvasView.tsx` — do `    const observer = new ResizeObserver((entries) => {` ao fecho do `try/catch` (`    }` depois de `      observer.observe(host);`) e a linha `      observer.disconnect();` (1 ocorrência); `meta/STATUS.md` — a nota `**Mudanças nesta revisão (2026-11-16, wo0009):**` (3 linhas), a linha `- **Nitidez fora do zoom 100%** —`, o bloco «Última conversa» e o rodapé; `meta/DECISIONS.md` — a linha `**Status:** aberta — corrigida no código (wo0009); …` e o bullet `- **Alternativa descartada:**` (2 linhas) do FIX-002; `logs/2026-11-17.md` — a última linha.
> **Medido pelo chat** (2026-11-17, navegador embutido em `localhost:5173`, Chromium do app, DPR 1, zoom de CSS no `<html>` para simular o zoom do navegador): (a) 1.1 → 1.25 e → 0.9: o `ResizeObserver` em `device-pixel-content-box` disparou **0** vezes, porque a caixa em px do dispositivo continuou 1280×720; um `ResizeObserver` na caixa de conteúdo, observando o mesmo contêiner, disparou **1** vez em cada troca, e a entrada trazia `devicePixelContentBoxSize` = 1280×720; (b) o app ficou com o estilo `1163.62px`/`654.531px` (escrito para 1.1; o CSSOM arredonda `1163.625` a 6 algarismos): em 1.25 o canvas ocupou **1454** px da tela, em 0.9 **1047**, para um buffer de **1280** — reamostragem de novo; (c) com o estilo do canvas de baixo, do canvas de cima e do `div.canvas-container` em `100%`, o canvas ocupou exatamente o contêiner em 1, 0.9, 1.1 e 1.25 sem evento nenhum. **Deduzido, não medido:** no zoom real do navegador a janela também mantém os px físicos e só o tamanho CSS muda — a mesma situação de (a). **Lido no código instalado** (fabric 6.9.1): `Canvas.setCSSDimensions` aplica o tamanho ao canvas de baixo, ao de cima e ao `container`; `setCSSDimensions` usa a string como está (`'100%'`); tipo `setDimensions(Partial<CSSDimensions>, { cssOnly?: true })`, `CSSDimensions.width: number | string`.
> **Simulado pelo chat:** as edições 1–2 aplicadas numa cópia do repositório a partir do texto DESTA WO; `tsc -p tsconfig.app.json --noEmit`, `eslint` e `prettier --check` nos arquivos tocados — resultado no relatório do chat. `npm test` não roda na VM do chat; a contagem é do seu shell.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `DECISIONS.md` e a seção do Code no log (Edições 3–5). `meta/CONTEXT.md`, `meta/CEREBRO.md` e `logs/2026-11-17.md` (seção do chat) são do chat e já estão gravados — **só versione**.

---

## 1. Por que

A wo0009 trocou o observador da caixa de conteúdo pelo da caixa `device-pixel-content-box` e passou ao estilo do canvas o tamanho em px CSS. Mas cada observação só dispara quando a **sua** caixa muda: ao trocar o zoom do navegador com a página aberta, a janela continua com os mesmos pixels físicos e só o tamanho CSS muda. Resultado: nenhum evento, o estilo do canvas fica com o px CSS do zoom anterior e o canvas volta a ocupar na tela um tamanho diferente do buffer, e borra. Na carga da página (ou com F5) tudo saía certo, por isso a wo0009 parecia boa. A wo0009 é a origem; esta WO a corrige.

**A correção:** (1) o estilo do canvas passa a ser `100%` do contêiner, então o tamanho na tela acompanha o contêiner sem depender de evento e sem o arredondamento do CSSOM; (2) dois observadores com o mesmo callback — caixa de conteúdo (dispara no zoom do navegador) e caixa em px do dispositivo (dispara quando só o DPR muda, ao trocar de monitor). A entrada de qualquer um traz as duas medidas. O `canvasSize` e os testes G12–G15 não mudam.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos três arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  105 passed (105)` (do relatório da wo0009 — número diferente: relate o cru e siga).
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `M meta/CEREBRO.md`, `M meta/CONTEXT.md`, `?? logs/2026-11-17.md`, `?? meta/workorders/261117-wo0010-canvas-segue-o-zoom-ao-vivo.md`.

## Edição 1a — `src/canvas/CanvasEngine.ts` · JSDoc do `resize`

**Âncora:**

```
   * Ajusta o canvas ao contêiner e reenquadra a página. O buffer recebe px do DISPOSITIVO
   * e o estilo recebe px CSS: um pixel do buffer cai num pixel da tela em qualquer zoom do
   * navegador (FIX-002). As coordenadas do canvas passam a ser px do dispositivo; o zoom de
   * enquadramento já as inclui.
```

**Substituir por:**

```
   * Ajusta o canvas ao contêiner e reenquadra a página. O buffer recebe px do DISPOSITIVO;
   * o estilo é `100%` do contêiner, então o tamanho na tela acompanha o contêiner mesmo se
   * um evento de resize faltar (FIX-002). Um pixel do buffer cai num pixel da tela em
   * qualquer zoom do navegador. As coordenadas do canvas são px do dispositivo; o zoom de
   * enquadramento já as inclui.
```

## Edição 1b — `src/canvas/CanvasEngine.ts` · estilo `100%`

**Âncora:**

```
    this.canvas.setDimensions({ width: size.cssWidth, height: size.cssHeight }, { cssOnly: true });
```

**Substituir por:**

```
    // 100%, não px: px fixos ficam velhos quando o zoom do navegador muda sem evento, e o
    // CSSOM ainda arredonda a 6 algarismos (1163.625 → "1163.62px", medido).
    this.canvas.setDimensions({ width: '100%', height: '100%' }, { cssOnly: true });
```

## Edição 2a — `src/ui/CanvasView.tsx` · dois observadores

**Âncora:**

```
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      // Quantos pixels da TELA o contêiner ocupa, já arredondados pelo navegador como ele
      // vai desenhar (escrita horizontal: inline = largura). Safari não tem; aí canvasSize
      // arredonda css × dpr.
      const device = entry.devicePixelContentBoxSize?.[0];
      const devicePixels =
        device === undefined ? null : { width: device.inlineSize, height: device.blockSize };
      if (!engine.disposed) {
        engine.resize(canvasSize(width, height, window.devicePixelRatio, devicePixels));
      }
    });
    try {
      // Esta caixa também dispara quando só o DPR muda (outro monitor), sem mudar o tamanho CSS.
      observer.observe(host, { box: 'device-pixel-content-box' });
    } catch {
      // Navegador sem a caixa: a de conteúdo dispara quando o tamanho CSS muda.
      observer.observe(host);
    }
```

**Substituir por:**

```
    // Um callback para os dois observadores: a entrada traz as medidas CSS e em px do
    // dispositivo qualquer que seja a caixa observada.
    const onResize = (entries: ResizeObserverEntry[]): void => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      // Quantos pixels da TELA o contêiner ocupa, já arredondados pelo navegador como ele
      // vai desenhar (escrita horizontal: inline = largura). Safari não tem; aí canvasSize
      // arredonda css × dpr.
      const device = entry.devicePixelContentBoxSize?.[0];
      const devicePixels =
        device === undefined ? null : { width: device.inlineSize, height: device.blockSize };
      if (!engine.disposed) {
        engine.resize(canvasSize(width, height, window.devicePixelRatio, devicePixels));
      }
    };
    // DOIS observadores, porque cada um só dispara quando a SUA caixa muda (FIX-002):
    // - caixa de conteúdo: muda com o zoom do navegador (a janela mantém os px físicos);
    // - caixa em px do dispositivo: muda quando só o DPR muda (outro monitor).
    const observer = new ResizeObserver(onResize);
    observer.observe(host);
    const deviceObserver = new ResizeObserver(onResize);
    try {
      deviceObserver.observe(host, { box: 'device-pixel-content-box' });
    } catch {
      // Navegador sem a caixa (Safari): fica só o observador da caixa de conteúdo.
    }
```

## Edição 2b — `src/ui/CanvasView.tsx` · desligar os dois na limpeza

**Âncora:**

```
      observer.disconnect();
```

**Substituir por:**

```
      observer.disconnect();
      deviceObserver.disconnect();
```

## Edição 3a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-16, wo0009):** o borrão fora do zoom 100% foi corrigido no código (FIX-002) e sai
de «Quebrado» para «Em Progresso» até o dono conferir na tela. A nota anterior (wo0008) saiu — o que ela registrava
está no log de 2026-11-15 e no bug, agora em FIX-002.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-17, wo0010):** a conferência de tela do FIX-002 achou uma regressão da wo0009
(trocar o zoom com a página aberta voltava a borrar), corrigida nesta WO; o item segue em «Em Progresso» até a
conferência depois dela. A nota anterior (wo0009) saiu — o que ela registrava está em FIX-002 e no log de 2026-11-16.
```

## Edição 3b — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
- **Nitidez fora do zoom 100%** — corrigida no código (wo0009, FIX-002: buffer do canvas em px do dispositivo, retina do Fabric desligado); falta a conferência do dono na tela em 90%, 110% e 125%. Depois dela, o próximo item do backlog é `FrameImage.ts`.
```

**Substituir por:**

```
- **Nitidez fora do zoom 100%** — corrigida no código (wo0009 + wo0010, FIX-002: buffer do canvas em px do dispositivo, retina do Fabric desligado, estilo `100%`, dois `ResizeObserver`); falta a conferência de tela depois da wo0010 — o chat confere no navegador embutido com o `npm run dev` do dono rodando (o painel roda em DPR 1; DPR ≠ 1 real fica sinalizado). Depois dela, o próximo item do backlog é `FrameImage.ts`.
```

## Edição 3c — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**2026-11-16** — causa raiz do borrão fora do zoom 100% medida no navegador e corrigida (wo0009, FIX-002). Detalhe
em `logs/2026-11-16.md`.
**Onde parou:** correção aplicada; falta o roteiro de tela do dono (90%, 110%, 125%).

---

*Próximo passo: conferência de tela do FIX-002 pelo dono; depois, `FrameImage.ts` (frame de imagem com fit modes) — WO a escrever pelo chat.*
```

**Substituir por:**

```
**2026-11-17** — conferência de tela do FIX-002 feita pelo chat no navegador embutido: achou a regressão da wo0009
(zoom trocado com a página aberta), corrigida na wo0010. Detalhe em `logs/2026-11-17.md`.
**Onde parou:** wo0010 aplicada; falta a conferência de tela depois dela.

---

*Próximo passo: conferência de tela do FIX-002 depois da wo0010 (chat, navegador embutido); depois, `FrameImage.ts` (frame de imagem com fit modes) — WO a escrever pelo chat.*
```

## Edição 4a — `meta/DECISIONS.md` · FIX-002, status

**Âncora:**

```
**Status:** aberta — corrigida no código (wo0009); fecha quando o dono conferir na tela em 90%, 110% e 125%
```

**Substituir por:**

```
**Status:** aberta — corrigida no código (wo0009 + wo0010); fecha com a conferência de tela depois da wo0010
```

## Edição 4b — `meta/DECISIONS.md` · FIX-002, regressão da wo0009

**Âncora:**

```
- **Alternativa descartada:** manter o retina do Fabric e compensar o arredondamento — não cobre o zoom abaixo de
  100%, onde o Fabric não escala.
```

**Substituir por:**

```
- **Alternativa descartada:** manter o retina do Fabric e compensar o arredondamento — não cobre o zoom abaixo de
  100%, onde o Fabric não escala.
- **Regressão da wo0009 (corrigida na wo0010):** o `CanvasView` observava SÓ a caixa `device-pixel-content-box`, e o
  estilo do canvas recebia px CSS. Trocar o zoom com a página aberta não muda os px físicos da janela — nenhum
  evento — e o estilo ficava velho: medido em 2026-11-17 (zoom de CSS no `<html>`, 1.1 → 1.25), 0 disparos e o
  canvas ocupando 1454 px da tela para um buffer de 1280. Na carga da página saía certo, por isso passou. Correção:
  estilo `100%` do contêiner e dois observadores (caixa de conteúdo + caixa em px do dispositivo) com o mesmo
  callback (wo0010). Conferência que só olha a página recém-carregada não pega isso: o roteiro de tela do canvas
  troca o zoom COM a página aberta.
```

## Edição 5 — `logs/2026-11-17.md` · seção do Code

**Âncora** (última linha do arquivo):

```
  troca entre px CSS e px da tela, não a mudança do `devicePixelRatio`.
```

**Substituir por:** a mesma linha, uma linha em branco, e uma seção `## Code (execução) — wo0010` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`.

---

## Fora de escopo

- `canvasSize` e `PageGeometry.test.ts` (não mudam), `FrameImage.ts`, `SelectionManager.ts`.
- Teste automático do `CanvasView`/`CanvasEngine` (DEC-016: o adaptador do Fabric é conferido na tela, não em Node).
- `meta/CHANGELOG.md`: a linha do FIX-002 em «Corrigido» continua verdadeira.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **O `catch` fica vazio com um comentário dentro** (Edição 2a) — é de propósito: sem a caixa, o observador da caixa de conteúdo já está ligado. O `no-empty` do ESLint aceita bloco com comentário.
- **Mantenha intacta** a limpeza do FIX-001 (`element.remove()` no `.finally`) e o `<canvas>` criado por montagem.
- **Não suba o `npm run dev` para «conferir»** — o dono deixa o dele rodando e o chat confere. Se subir, feche antes de commitar e diga.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `M meta/CEREBRO.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/STATUS.md`, `M src/canvas/CanvasEngine.ts`, `M src/ui/CanvasView.tsx`, `?? logs/2026-11-17.md`, `?? meta/workorders/261117-wo0010-canvas-segue-o-zoom-ao-vivo.md`. Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — **105 testes** verdes (nenhum teste novo; nenhum deve sumir). Linha de resumo crua. Menos = **VERMELHO**.
      - **Quem roda:** quem aplica. **NÃO responde:** se o canvas acompanha o zoom ao vivo — nenhum teste em Node chega ao `CanvasView` (DEC-016); isso é a conferência de tela do chat.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "{ width: '100%', height: '100%' }, { cssOnly: true }" src/canvas/CanvasEngine.ts` = 1
      - `grep -c "size.cssWidth" src/canvas/CanvasEngine.ts` = 0
      - `grep -c "new ResizeObserver(onResize)" src/ui/CanvasView.tsx` = 2
      - `grep -c "^    observer.observe(host);" src/ui/CanvasView.tsx` = 1
      - `grep -c "disconnect();" src/ui/CanvasView.tsx` = 2
      - `grep -c "element.remove();" src/ui/CanvasView.tsx` = 1 (FIX-001 intacto)
      - `grep -c "^- \*\*Regressão da wo0009" meta/DECISIONS.md` = 1
      - `grep -c "^## Code (execução) — wo0010" logs/2026-11-17.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0010.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Inclua as saídas cruas acima, `wc -l` de `CanvasEngine.ts`/`CanvasView.tsx`, e qualquer decisão sua. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-17.md meta/CEREBRO.md meta/CONTEXT.md meta/DECISIONS.md meta/STATUS.md meta/workorders/261117-wo0010-canvas-segue-o-zoom-ao-vivo.md src/canvas/CanvasEngine.ts src/ui/CanvasView.tsx
```

```
git commit -m "fix(canvas): acompanha a troca de zoom com a pagina aberta" -m "O ResizeObserver so na caixa em px do dispositivo nao dispara quando o zoom do navegador muda, e o estilo do canvas em px ficava velho. Agora o estilo e 100% do conteiner e ha dois observadores (caixa de conteudo e px do dispositivo). Regressao da wo0009, FIX-002 (wo0010)."
```

```
git push
```
