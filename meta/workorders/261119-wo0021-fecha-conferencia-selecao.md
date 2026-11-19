# WO 0021 — Fecha a conferência de tela da seleção (wo0020) e mede o piscar

> **Tipo:** WO de DOC (registro). Não toca o produto: sem build; a rede é o `git diff` e o `sha1sum`.
> **Config sugerida:** Sonnet · `/effort` baixo.
> **Pré-requisito:** escrita sobre `91d875c` (`feat(canvas): seleciona, move e redimensiona frames no canvas`), já em `origin/main`; árvore limpa exceto `meta/CEREBRO.md` e esta WO.
> **Base:** conferência de tela da wo0020 pelo chat no navegador embutido, 2026-11-19 (o `npm run dev` do dono; o dono deixou o painel visível para a medida do piscar).
> **Depende de:** wo0020 (aplicada: `91d875c`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat; diferente = PARE e reporte):
> - `90257188f3e754050af1b4b73288e987fc0e3439  meta/CEREBRO.md` (item «Conferência de tela» em «Técnicas específicas deste projeto» ganha o que foi medido)
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo a forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-19, no disco, neste turno, sobre `91d875c`; recortadas por script e conferidas como ocorrência única): `meta/STATUS.md` — a linha inteira «- **Seleção, mover e redimensionar no canvas** …» e as 7 linhas de «**Onde parou:** wo0020 aplicada …» até o rodapé «(DEC-023).*»; `meta/DECISIONS.md` — as 2 linhas «- **Riscos:** piscar ao soltar …» da DEC-023; `logs/2026-11-19.md` — a última linha.
> **Simulado pelo chat:** as quatro edições aplicadas numa cópia dos arquivos a partir do texto DESTA WO, duas passadas (a segunda pula as quatro).

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `DECISIONS.md` e o log. `meta/CEREBRO.md` é do chat e já está gravado — **só versione**. A seção do chat no log vai DENTRO da Edição 4.

---

## 1. Por que

A wo0020 foi conferida na tela pelo chat e o risco que a DEC-023 deixou aberto (piscar ao soltar) foi medido: não pisca. Esta WO tira o «a fazer» do STATUS, registra a medida na DEC-023 e versiona o log da conferência e a técnica nova do CEREBRO.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = ` M meta/CEREBRO.md`, `?? meta/workorders/261119-wo0021-fecha-conferencia-selecao.md` (2 entradas).
2. `sha1sum meta/CEREBRO.md` = o valor do cabeçalho.

## Edição 1 — `meta/STATUS.md` · Funcionando (seleção conferida)

A âncora é a linha inteira (longa); só o trecho entre parênteses do começo muda.

**Âncora:**

````
- **Seleção, mover e redimensionar no canvas** *(wo0020, DEC-023; conferência de tela pelo chat a fazer)* — clicar num frame não travado o seleciona (`selectionStore`); clicar fora ou Esc limpa; arrastar move o frame com o conteúdo acompanhando; as alças redimensionam só a caixa até soltar (canto mantém a proporção, Shift solta; texto que cresce só mostra as alças do eixo que não cresce); ao soltar, UMA entrada de desfazer com o `transform` novo arredondado a 0,01 da unidade (`fromPx`, mínimo 1 mm); Ctrl+Z desfaz, Ctrl+Shift+Z e Ctrl+Y refazem. Uma alça transparente por frame (`canvas/SelectionManager.ts`, dentro do `CanvasEngine`), a parte pura em `canvas/SelectionGeometry.ts`, atalhos em `ui/EditorShortcuts.ts`; imagens decodificadas em cache por caminho (`ImageCache`). Sem alça de girar. Testado em Node (A1–A14, G16–G18, M10–M12, H14, K1–K5)
````

**Substituir por:**

````
- **Seleção, mover e redimensionar no canvas** *(wo0020, DEC-023; conferido pelo chat no navegador embutido em 2026-11-19, sem piscar ao soltar)* — clicar num frame não travado o seleciona (`selectionStore`); clicar fora ou Esc limpa; arrastar move o frame com o conteúdo acompanhando; as alças redimensionam só a caixa até soltar (canto mantém a proporção, Shift solta; texto que cresce só mostra as alças do eixo que não cresce); ao soltar, UMA entrada de desfazer com o `transform` novo arredondado a 0,01 da unidade (`fromPx`, mínimo 1 mm); Ctrl+Z desfaz, Ctrl+Shift+Z e Ctrl+Y refazem. Uma alça transparente por frame (`canvas/SelectionManager.ts`, dentro do `CanvasEngine`), a parte pura em `canvas/SelectionGeometry.ts`, atalhos em `ui/EditorShortcuts.ts`; imagens decodificadas em cache por caminho (`ImageCache`). Sem alça de girar. Testado em Node (A1–A14, G16–G18, M10–M12, H14, K1–K5)
````

## Edição 2 — `meta/STATUS.md` · Onde parou e rodapé

**Âncora:**

````
**Onde parou:** wo0020 aplicada (seleção, mover, redimensionar, desfazer pelo teclado); falta a conferência de tela
pelo chat no navegador embutido.

---

*Próximo passo: conferência de tela da wo0020 pelo chat; depois, multi-seleção com alinhamento, distribuição e setas
(DEC-023).*
````

**Substituir por:**

````
**Onde parou:** wo0020 aplicada e conferida pelo chat no navegador embutido (wo0021): seleção, mover com o conteúdo,
redimensionar só a caixa até soltar, texto que cresce só no eixo livre, fundo travado sem alça, atalhos de desfazer, e
nenhum quadro sem a foto ou o texto depois de soltar. Fica para o dono, opcional: os controles com zoom real do
navegador (DPR ≠ 1).

---

*Próximo passo: multi-seleção com alinhamento, distribuição e setas (DEC-023) — análise ou WO a escrever pelo chat.*
````

## Edição 3 — `meta/DECISIONS.md` · DEC-023, risco do piscar medido

**Âncora:**

````
- **Riscos:** piscar ao soltar — a hipótese de que não pisca (fonte e imagem em cache resolvem antes do próximo
  quadro) não foi medida; vai para a conferência de tela. Controles em DPR ≠ 1 real nunca conferidos (FIX-002).
````

**Substituir por:**

````
- **Riscos:** piscar ao soltar — **medido em 2026-11-19 (wo0021): não pisca.** Um pixel da foto e um do texto lidos
  a cada quadro, por 12–20 quadros depois de soltar, ficaram iguais; a prova de vida (um ponto da borda que a foto
  deixa) mudou de cor no meio do arraste. Controles em DPR ≠ 1 real nunca conferidos (FIX-002).
````

## Edição 4 — `logs/2026-11-19.md` · seção do chat (conferência de tela) — e a sua, depois dela

Depois de aplicar esta edição, acrescente NO FIM do arquivo a sua seção, `## Code (execução) — wo0021`, no formato do `meta/LOG-TEMPLATE.md` (Feito, Entregas, Arquivos modificados, Onde parei), com o corpo escrito por você.

**Âncora:**

````
wo0020 aplicada; falta a conferência de tela pelo chat no navegador embutido (não subi o `npm run dev`).
````

**Substituir por:**

````
wo0020 aplicada; falta a conferência de tela pelo chat no navegador embutido (não subi o `npm run dev`).

## Chat (planejamento) — conferência de tela da wo0020

### ✅ Feito
- Relatório da wo0020 lido inteiro e movido para `notas-arquivadas/`; `91d875c` empurrado; fim de linha conferido
  (todos os arquivos tocados continuam LF — a frase «preservou CRLF» do relatório não teve efeito).
- Conferido no navegador embutido (`npm run dev` do dono, `localhost:5173`, DPR 1), com o estado lido de
  `window.__editx` a cada passo:
  - clicar na foto seleciona (8 alças; a caixa é a do frame 190 × 120 mm, mais alta que a foto 16:9 contida); clicar
    no vazio, Esc e clicar no fundo travado da capa não selecionam nada;
  - mover: no meio do arraste o conteúdo acompanha a alça, sem sair do recorte, e o histórico não muda; ao soltar,
    UMA entrada «mover» com o deslocamento medido (80 px = 36,95 mm) e a seleção continua;
  - redimensionar pelo canto: no meio só a caixa muda; ao soltar, foto redesenhada no tamanho novo com a proporção
    mantida (190 × 120 → 152,95 × 96,6 mm) e entrada «redimensionar»;
  - nome do produto (`grow-vertical`): só as 2 alças laterais, na caixa do texto desenhado; preço (`fixed-shrink`): 8;
  - título da capa (`grow-vertical`, âncora no meio) arrastado 40 px: `y` 120 → 149,56 mm, `x` e altura iguais, sem
    salto ao soltar;
  - Ctrl+Z ×2, Ctrl+Shift+Z e Ctrl+Y voltam exatamente aos valores; console sem erro.
- **Piscar ao soltar, medido** com o painel visível: um pixel dentro da foto e um do texto «{PRECO}» lidos a cada
  quadro, por 12–20 quadros depois de soltar, nunca mudaram; prova de vida: um ponto 4 px dentro da borda esquerda da
  foto ficou branco já no meio do arraste e continuou branco depois. Não pisca.
- Primeira tentativa com o painel oculto: a página recarregada abriu com o canvas de tamanho 0 e o script que esperava
  `requestAnimationFrame` travou — técnica registrada no CEREBRO, «Técnicas específicas deste projeto» (versionado
  pela wo0021).

### 📦 Entregas
- `meta/workorders/261119-wo0021-fecha-conferencia-selecao.md`.

### ⚖️ Decisões tomadas
- Nenhuma nova; a DEC-023 ganha o risco medido (pela wo0021).

### 📊 Onde parei (estado ao final)
Seleção conferida. Próximo: multi-seleção com alinhamento, distribuição e setas (DEC-023).
````

---

## Fora de escopo

- Código. Os controles em DPR ≠ 1 (conferência opcional do dono). A multi-seleção (próxima frente).

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **Edição 1 tem como âncora uma linha longa inteira** — recorte-a do arquivo, não da tela.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: ` M logs/2026-11-19.md`, ` M meta/CEREBRO.md`, ` M meta/DECISIONS.md`, ` M meta/STATUS.md`, `?? meta/workorders/261119-wo0021-fecha-conferencia-selecao.md` (5 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] `git diff --stat` — só esses 4 arquivos rastreados.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "conferência de tela pelo chat a fazer" meta/STATUS.md` = 0
      - `grep -c "^\*Próximo passo: multi-seleção" meta/STATUS.md` = 1
      - `grep -c "medido em 2026-11-19 (wo0021): não pisca" meta/DECISIONS.md` = 1
      - `grep -c "^## Chat (planejamento) — conferência de tela da wo0020" logs/2026-11-19.md` = 1
      - `grep -c "^## Code (execução) — wo0021" logs/2026-11-19.md` = 1
      *(escritos pelo chat e simulados fora do seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] WO só de doc: sem build.
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0021.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo, com as saídas cruas acima. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-19.md meta/CEREBRO.md meta/DECISIONS.md meta/STATUS.md meta/workorders/261119-wo0021-fecha-conferencia-selecao.md
```

```
git commit -m "docs: registra a conferencia de tela da selecao" -m "Selecao, mover, redimensionar e atalhos conferidos no navegador embutido; piscar ao soltar medido quadro a quadro: nao pisca. DEC-023 recebe o risco medido; tecnica nova do painel no CEREBRO. (wo0021)"
```

```
git push
```
