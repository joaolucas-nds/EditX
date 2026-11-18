# WO 0015 — Registra a conferência de tela do `FrameShape.ts` (wo0014)

> **Tipo:** WO de DOC (registro). Não toca o produto: sem build; a rede é o `git diff`.
> **Config sugerida:** Sonnet · `/effort` médio.
> **Pré-requisito:** escrita sobre `9790a73` (`feat(canvas): desenha formas com o traco por dentro do frame`), já em `origin/main`; árvore limpa exceto esta WO.
> **Base:** conferência de tela feita pelo chat no navegador embutido em 2026-11-18, com o `npm run dev` do dono rodando (CEREBRO, «Técnicas específicas»). Resultados na Edição 2.
> **Depende de:** wo0014 (aplicada: `9790a73`).
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-18, no disco, neste turno, sobre `9790a73`): `meta/STATUS.md` — a nota `**Mudanças nesta revisão (2026-11-18, wo0014):**` (2 linhas), o começo `- **Forma aparece no canvas** *(wo0014, DEC-020; conferência de tela pendente — ver «Em Progresso»)*`, a linha `- **Conferência de tela do \`FrameShape.ts\`** —` inteira, a linha de backlog `- [ ] \`SelectionManager.ts\` — seleção simples, mover, redimensionar`, a linha `**Onde parou:** wo0014 aplicada; …` e o rodapé; `logs/2026-11-18.md` — a última linha, `wo0014 aplicada e validada; falta a conferência de tela pelo chat. Próximo item do backlog: \`SelectionManager.ts\`.` (1 ocorrência).

> **Canal dos meta neste ciclo = CODE** para `STATUS.md` e o log (Edições 1–2). O texto é do chat; você só posiciona. A seção do chat no log vai DENTRO da Edição 2 (o arquivo já tem a seção do Code).

---

## 1. Por que

O STATUS deixou o `FrameShape.ts` em «Em Progresso» até a conferência de tela. O chat a fez: a capa mostra o fundo sob o título, e retângulo, elipse e linha saem com o traço onde o DEC-020 diz. Esta WO registra isso e devolve o STATUS ao backlog (`SelectionManager.ts`).

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `?? meta/workorders/261118-wo0015-fecha-conferencia-frame-de-forma.md`.

## Edição 1a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-18, wo0014):** formas no canvas (DEC-020) — `FrameShape.ts` feito, conferência de
tela pelo chat em «Em Progresso». A nota anterior (wo0013) saiu — o que ela registrava está no log de 2026-11-17.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-18, wo0015):** `FrameShape.ts` conferido na tela pelo chat; o item sai de «Em
Progresso» e o próximo do backlog é `SelectionManager.ts`. A nota anterior (wo0014) saiu — o que ela registrava está
em DEC-020, no CHANGELOG e no log de 2026-11-18.
```

## Edição 1b — `meta/STATUS.md` · Funcionando (forma conferida)

**Âncora** (o COMEÇO da linha da forma — troque só este trecho; o resto da linha, de ` — os frames de forma da página` em diante, fica como está):

```
- **Forma aparece no canvas** *(wo0014, DEC-020; conferência de tela pendente — ver «Em Progresso»)*
```

**Substituir por:**

```
- **Forma aparece no canvas** *(wo0014, DEC-020; conferido pelo chat no navegador embutido em 2026-11-18)*
```

## Edição 1c — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
- **Conferência de tela do `FrameShape.ts`** — o chat confere no navegador embutido com o `npm run dev` do dono rodando (`?page=page-capa`: fundo azul sob o título branco; e retângulo, elipse, linha e traços desenhados num template montado na página). Depois dela, o próximo item do backlog é `SelectionManager.ts`.
```

**Substituir por:**

```
*Nada em progresso — próximo item do backlog é `SelectionManager.ts`.*
```

## Edição 1d — `meta/STATUS.md` · Backlog

**Âncora:**

```
- [ ] `SelectionManager.ts` — seleção simples, mover, redimensionar
```

**Substituir por:**

```
- [ ] `SelectionManager.ts` — seleção simples, mover, redimensionar ← **próximo**
```

## Edição 1e — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**Onde parou:** wo0014 aplicada; falta a conferência de tela do `FrameShape.ts` pelo chat.

---

*Próximo passo: conferência de tela do `FrameShape.ts` (chat, navegador embutido); depois, `SelectionManager.ts` — WO a escrever pelo chat.*
```

**Substituir por:**

```
**Onde parou:** `FrameShape.ts` conferido na tela pelo chat (wo0015); o próximo item do backlog é `SelectionManager.ts`.

---

*Próximo passo: `SelectionManager.ts` (seleção simples, mover, redimensionar) — muda o `.editx` a partir da tela, então provavelmente pede antes os stores (`documentStore`/`historyStore`) ou uma análise de ordem; pelo chat.*
```

## Edição 2 — `logs/2026-11-18.md` · seção do chat (conferência do `FrameShape.ts`) e seção do Code

**Âncora** (última linha do arquivo):

```
wo0014 aplicada e validada; falta a conferência de tela pelo chat. Próximo item do backlog: `SelectionManager.ts`.
```

**Substituir por:**

```
wo0014 aplicada e validada; falta a conferência de tela pelo chat. Próximo item do backlog: `SelectionManager.ts`.

## Chat (planejamento) — conferência de tela do `FrameShape.ts`

### ✅ Feito
- Relatório da wo0014 lido (`9790a73` empurrado, 151 testes, prova de vida com 5 falhas previstas) e arquivado.
- Conferência no navegador embutido (`localhost:5173`, DPR 1) [medido por instrumento]:
  - `?page=page-capa`: fundo `#1D3557` (cor exata nos pixels) sob o título branco «Ofertas de Verão» — ordem forma <
    texto; o azul cobre a área de corte inteira (fora dele, só o cinza da sangria), proporção 1,4172 contra 297/210 =
    1,4143 (1 px);
  - template montado na página e desenhado num `CanvasEngine` à parte (escala 2,1 px/mm no buffer), bordas EXTERNAS
    do traço contra as bordas do frame (px do buffer):

| Forma | Medido | Esperado |
|---|---|---|
| Retângulo, traço 4 mm, raio 8 | esq. 301 · dir. 468 · traço 9 px | 300,6 · 468,5 · 8,4 px |
| Elipse sem preenchimento, tracejada 2 mm | topo 59 · base 143 · esq. 511 · dir. 678 | 59,3 · 143,2 · 510,5 · 678,4 |
| Linha pontilhada 2 mm | centro 196 · espessura 4 px · 45 pontos | 195,7 · 4,2 px · ~46 |

  - polígono saiu como o retângulo vermelho de erro; console sem erro; engine de teste liberado e removido da página
    ao fim, aba fechada.
- Não conferido: cantos arredondados medidos em pixel (só no olho: arredondados), DPR ≠ 1.

### ⚖️ Decisões tomadas
- Nenhuma nova.

### ➡️ Próximos passos
- `SelectionManager.ts` — a seleção vai mudar o `.editx` a partir da tela; decidir antes se os stores vêm primeiro.
```

E depois dela, uma linha em branco e uma seção `## Code (execução) — wo0015` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md` (curta: WO de doc).

---

## Fora de escopo

- Código. CHANGELOG, ROADMAP e DECISIONS (já registrados pela wo0014).

## Armadilhas desta WO

- **Edição 1b troca o COMEÇO de uma linha longa** — o resto da linha fica intacto.
- **A Edição 2 tem uma tabela em Markdown** — copie as linhas com as barras `|` exatamente como estão.
- **Python não serve:** use `node` se precisar de script.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: `M logs/2026-11-18.md`, `M meta/STATUS.md`, `?? meta/workorders/261118-wo0015-fecha-conferencia-frame-de-forma.md`. Um a mais ou a menos = **VERMELHO**.
- [ ] WO só de doc: sem build — a rede é o `git diff`.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "conferido pelo chat no navegador embutido em 2026-11-18)\* — os frames de forma" meta/STATUS.md` = 1
      - `grep -c "^- \*\*Conferência de tela do \`FrameShape.ts\`\*\*" meta/STATUS.md` = 0
      - `grep -c "^\*Nada em progresso — próximo item do backlog é \`SelectionManager.ts\`.\*$" meta/STATUS.md` = 1
      - `grep -c "← \*\*próximo\*\*$" meta/STATUS.md` = 1
      - `grep -c "^## Chat (planejamento) — conferência de tela do \`FrameShape.ts\`" logs/2026-11-18.md` = 1
      - `grep -c "^## Code (execução) — wo0015" logs/2026-11-18.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0015.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Saídas cruas acima, `git diff --stat`, commit e push.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-18.md meta/STATUS.md meta/workorders/261118-wo0015-fecha-conferencia-frame-de-forma.md
```

```
git commit -m "docs: registra conferencia de tela do FrameShape" -m "Conferido pelo chat no navegador embutido: fundo da capa sob o titulo, e retangulo, elipse e linha com a borda externa do traco na borda do frame (wo0015)."
```

```
git push
```
