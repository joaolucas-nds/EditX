# WO 0024 — Fecha a conferência de tela da wo0022 e da wo0023 (multi-seleção)

> **Tipo:** WO de DOC (registro). Não toca o produto: sem build; a rede é o `git diff` e o `sha1sum`.
> **Config sugerida:** Sonnet · `/effort` baixo.
> **Pré-requisito:** escrita sobre `3a72125` (`feat(canvas): seleciona varios frames, alinha, distribui e empurra com as setas`), já em `origin/main`; árvore limpa exceto os dois arquivos do chat e esta WO.
> **Base:** conferência de tela da wo0022 e da wo0023 pelo chat no navegador embutido, 2026-11-21 (o `npm run dev` do dono, painel visível).
> **Depende de:** wo0023 (aplicada: `3a72125`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat; diferente = PARE e reporte):
> - `4fc1be2b15ec5a064948fe710ec66b194875a738  meta/CEREBRO.md` (item «Conferência de tela» em «Técnicas específicas deste projeto»)
> - `704eb0b75c56e4c6e78567b0fbff14a6465e2a48  meta/CONTEXT.md` (armadilha nova: caixas do canvas um redesenho atrás)
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo a forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-21, no disco, neste turno, sobre `3a72125`; recortadas por script e conferidas como ocorrência única): `meta/STATUS.md` — a linha inteira «- **Multi-seleção, alinhar, distribuir e setas** …», a linha «- [ ] UI mínima: … ← **próximo**» e o bloco de «**Onde parou:** wo0023 aplicada …» até o rodapé; `meta/DECISIONS.md` — as 3 linhas «- **Riscos:** alça no lugar errado …» da DEC-024; `logs/2026-11-21.md` — a última linha.
> **Simulado pelo chat:** as cinco edições aplicadas numa cópia dos arquivos a partir do texto DESTA WO, duas passadas (a segunda pula as cinco).

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `DECISIONS.md` e o log. `meta/CEREBRO.md` e `meta/CONTEXT.md` são do chat e já estão gravados — **só versione**. A seção do chat no log vai DENTRO da Edição 5.

---

## 1. Por que

A wo0022 e a wo0023 foram conferidas na tela: a extração não mudou o desenho, e a multi-seleção funciona como a DEC-024 pede — os três riscos dela não apareceram. A conferência achou uma pendência real: as ações de alinhar e distribuir leem a caixa do canvas um redesenho atrasada, e duas seguidas erram a segunda. Esta WO tira o «a fazer» do STATUS, põe a pendência no backlog antes da UI mínima, registra os riscos medidos na DEC-024 e versiona o log e as duas notas do chat.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = ` M meta/CEREBRO.md`, ` M meta/CONTEXT.md`, `?? meta/workorders/261121-wo0024-fecha-conferencia-multi-selecao.md` (3 entradas).
2. `sha1sum meta/CEREBRO.md meta/CONTEXT.md` = os valores do cabeçalho.

## Edição 1 — `meta/STATUS.md` · Funcionando (multi-seleção conferida)

A âncora é a linha inteira (longa); só o trecho entre parênteses do começo muda.

**Âncora:**

````
- **Multi-seleção, alinhar, distribuir e setas** *(wo0023, DEC-024; conferência de tela pelo chat a fazer)* — Shift+clique soma e tira da seleção, arrastar no vazio seleciona por retângulo (basta tocar), Ctrl+A seleciona os frames destravados da página; vários frames viram um grupo que só move (o conteúdo de todos acompanha), numa entrada de desfazer; setas empurram 1 mm (Shift: 10 mm), e os toques seguidos na mesma seleção viram uma entrada (janela de 1 s, `MERGE_WINDOW_MS`). Alinhar (à caixa da seleção, ou à área de corte com um frame só) e distribuir (três ou mais, espaços iguais) existem como ações (`ui/EditorActions.ts`, contas em `canvas/SelectionLayout.ts`), sem atalho até a Toolbar — no `npm run dev`, `__editx.actions.align('left')`. Testado em Node (B1–B7, E1–E11, H15–H18, K6–K8)
````

**Substituir por:**

````
- **Multi-seleção, alinhar, distribuir e setas** *(wo0023, DEC-024; conferido pelo chat no navegador embutido em 2026-11-21)* — Shift+clique soma e tira da seleção, arrastar no vazio seleciona por retângulo (basta tocar), Ctrl+A seleciona os frames destravados da página; vários frames viram um grupo que só move (o conteúdo de todos acompanha), numa entrada de desfazer; setas empurram 1 mm (Shift: 10 mm), e os toques seguidos na mesma seleção viram uma entrada (janela de 1 s, `MERGE_WINDOW_MS`). Alinhar (à caixa da seleção, ou à área de corte com um frame só) e distribuir (três ou mais, espaços iguais) existem como ações (`ui/EditorActions.ts`, contas em `canvas/SelectionLayout.ts`), sem atalho até a Toolbar — no `npm run dev`, `__editx.actions.align('left')`. Testado em Node (B1–B7, E1–E11, H15–H18, K6–K8)
````

## Edição 2 — `meta/STATUS.md` · Backlog (pendência antes da Toolbar)

**Âncora:**

````
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada) ← **próximo**
````

**Substituir por:**

````
- [ ] Ações do editor com a caixa do canvas um redesenho atrasada — duas ações de alinhar/distribuir no mesmo clique erram a segunda (CONTEXT, armadilhas; medido na conferência da wo0023). Corrigir ANTES de um botão chamar duas ações juntas
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada) ← **próximo**
````

## Edição 3 — `meta/STATUS.md` · Onde parou e rodapé

**Âncora:**

````
**Onde parou:** wo0023 aplicada (multi-seleção, alinhar e distribuir como ações, setas). Falta a conferência de tela
pelo chat — que cobre também a da wo0022, que não foi feita porque o `npm run dev` não respondia. Detalhe em
`logs/2026-11-21.md`.

---

*Próximo passo: conferência de tela da wo0022/wo0023 pelo chat; depois, a UI mínima (Toolbar primeiro: é onde
alinhar e distribuir ganham botão).*
````

**Substituir por:**

````
**Onde parou:** wo0022 e wo0023 conferidas pelo chat no navegador embutido (wo0024): a extração não mudou o
desenho; Shift+clique, retângulo, Ctrl+A, grupo que move, setas (com a fusão em 1 s), alinhar e distribuir pelo
console funcionam; os três riscos da DEC-024 não apareceram. Achado: as ações leem a caixa do canvas um redesenho
atrasada (pendência no backlog). Detalhe em `logs/2026-11-21.md`.

---

*Próximo passo: a UI mínima — análise da Toolbar primeiro (é onde alinhar e distribuir ganham botão, e onde a
pendência das caixas atrasadas passa a importar).*
````

## Edição 4 — `meta/DECISIONS.md` · DEC-024, riscos medidos

**Âncora:**

````
- **Riscos:** alça no lugar errado depois de soltar um grupo (coordenada relativa ao grupo); store e Fabric divergirem
  num Shift+clique que tira um frame; toques de seta juntados de mais — os três vão para a conferência de tela e os
  testes da WO da multi-seleção.
````

**Substituir por:**

````
- **Riscos:** os três — alça no lugar errado depois de soltar um grupo, store e Fabric divergirem num Shift+clique que
  tira um frame, toques de seta juntados de mais — **conferidos na tela em 2026-11-21 (wo0024): nenhum apareceu.**
  Medido na mesma conferência: as ações leem a caixa do canvas um redesenho atrasada; duas ações de alinhar seguidas
  sem redesenho erram a segunda (pendência no STATUS, antes da Toolbar).
````

## Edição 5 — `logs/2026-11-21.md` · seção do chat (conferência de tela) — e a sua, depois dela

Depois de aplicar esta edição, acrescente NO FIM do arquivo a sua seção, `## Code (execução) — wo0024`, no formato do `meta/LOG-TEMPLATE.md` (Feito, Entregas, Arquivos modificados, Onde parei), com o corpo escrito por você.

**Âncora:**

````
wo0023 aplicada; lint, build e 215 testes verdes. Falta a conferência de tela pelo chat (grupo, retângulo, setas, alinhar pelo console), que cobre também a wo0022. Próximo item do backlog: UI mínima (Toolbar primeiro).
````

**Substituir por:**

````
wo0023 aplicada; lint, build e 215 testes verdes. Falta a conferência de tela pelo chat (grupo, retângulo, setas, alinhar pelo console), que cobre também a wo0022. Próximo item do backlog: UI mínima (Toolbar primeiro).

## Chat (planejamento) — conferência de tela da wo0022 e da wo0023

### ✅ Feito
- Relatório da wo0023 lido inteiro e movido para `notas-arquivadas/`; `3a72125` empurrado, 215 testes.
- Primeira tentativa com o painel oculto (a página abriu em 0 × 0): só as ações pelo console, que já mostraram o
  achado abaixo. O dono deixou o painel visível e a conferência foi feita no navegador embutido (`localhost:5173`,
  DPR 1), com o estado lido de `window.__editx` a cada passo:
  - **wo0022:** produto (texto, imagem) e capa (forma de fundo, título) desenhados como antes; console sem erro.
  - **Shift+clique** foto → preço: grupo com a borda dos dois, sem alças de redimensionar; store `[foto, preço]`.
  - **Arrastar o grupo** 40 px: os dois andaram +15,47 / +15,11 mm, o nome não; UMA entrada «mover 2 frames»; seleção
    mantida e as alças em cima dos frames depois de soltar.
  - **Shift+clique** no preço com o grupo ativo: store `[foto]`, e a foto volta com as oito alças.
  - **Esc** limpa; **retângulo** no vazio pegou nome e preço (não a foto) sem entrar no histórico.
  - **Setas:** 3× → e Shift+↓ = uma entrada (nome 13/25, preço 28,47/65,11); depois de 2 s, a seguinte abriu outra
    entrada; dois Ctrl+Z voltaram ao começo, com o grupo selecionado.
  - **Console:** `selectAll` = os 3 destravados; `align('left')` com nome e preço = x 10 e 10; `distribute('vertical')`
    com os 3 = nome 15, preço 41,47, foto 75,11 — o preço em 41,47 mostra que distribuir usou a caixa DESENHADA do
    nome (~7,8 mm, texto que cresce), não os 20 mm do `transform`; na tela, espaços de 49 e 48 px.
- **Achado:** as ações leem a caixa do canvas um redesenho atrasada — `align('right')` e `align('hcenter')` no mesmo
  script deram o preço em x 145 em vez de 55; com 100 ms entre as duas, 55. As setas não sofrem (diferença). Vira
  pendência no STATUS (antes da Toolbar) e armadilha no CONTEXT.
- CEREBRO, «Técnicas»: a captura sai um quadro atrasada logo depois de uma ação, linha de 1 px some em captura
  reduzida, Shift+clique e setas pela ferramenta do painel. CONTEXT: a armadilha das caixas atrasadas. Versionados
  pela wo0024.

### 📦 Entregas
- `meta/workorders/261121-wo0024-fecha-conferencia-multi-selecao.md`.

### 📊 Onde parei (estado ao final)
wo0022 e wo0023 conferidas. Próximo: a UI mínima, começando pela análise da Toolbar.
````

---

## Fora de escopo

- Corrigir as caixas atrasadas (fica no backlog, antes da Toolbar). Código nenhum.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **Edição 1 tem como âncora uma linha longa inteira** — recorte-a do arquivo, não da tela.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: ` M logs/2026-11-21.md`, ` M meta/CEREBRO.md`, ` M meta/CONTEXT.md`, ` M meta/DECISIONS.md`, ` M meta/STATUS.md`, `?? meta/workorders/261121-wo0024-fecha-conferencia-multi-selecao.md` (6 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "conferência de tela pelo chat a fazer" meta/STATUS.md` = 0
      - `grep -c "^- \[ \] Ações do editor com a caixa do canvas" meta/STATUS.md` = 1
      - `grep -c "^\*Próximo passo: a UI mínima" meta/STATUS.md` = 1
      - `grep -c "conferidos na tela em 2026-11-21 (wo0024): nenhum apareceu" meta/DECISIONS.md` = 1
      - `grep -c "^## Chat (planejamento) — conferência de tela da wo0022 e da wo0023" logs/2026-11-21.md` = 1
      - `grep -c "^## Code (execução) — wo0024" logs/2026-11-21.md` = 1
      *(escritos pelo chat e simulados fora do seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] WO só de doc: sem build.
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0024.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo, com as saídas cruas acima. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-21.md meta/CEREBRO.md meta/CONTEXT.md meta/DECISIONS.md meta/STATUS.md meta/workorders/261121-wo0024-fecha-conferencia-multi-selecao.md
```

```
git commit -m "docs: registra a conferencia de tela da multi-selecao" -m "wo0022 e wo0023 conferidas no navegador embutido: desenho igual, grupo, Shift+clique, retangulo, setas e acoes funcionam; os tres riscos da DEC-024 nao apareceram. Pendencia: acoes leem a caixa do canvas um redesenho atrasada. (wo0024)"
```

```
git push
```
