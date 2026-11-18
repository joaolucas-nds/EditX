# WO 0013 — Registra a conferência de tela do `FrameImage.ts` (wo0012)

> **Tipo:** WO de DOC (registro). Não toca o produto: sem build; a rede é o `git diff`.
> **Config sugerida:** Sonnet · `/effort` médio.
> **Pré-requisito:** escrita sobre `f0e2401` (`feat(canvas): desenha imagens lidas da pasta do projeto`), já em `origin/main`; árvore limpa exceto esta WO.
> **Base:** conferência de tela feita pelo chat no navegador embutido em 2026-11-17, com o `npm run dev` do dono rodando (CEREBRO, «Técnicas específicas»). Resultados na Edição 2.
> **Depende de:** wo0012 (aplicada: `f0e2401`).
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-17, no disco, neste turno, sobre `f0e2401`): `meta/STATUS.md` — a nota `**Mudanças nesta revisão (2026-11-17, wo0012):**` (3 linhas), o começo `- **Imagem aparece no canvas** *(wo0012, DEC-019; conferência de tela pendente — ver «Em Progresso»)*`, a linha `- **Conferência de tela do \`FrameImage.ts\`** —` inteira, a linha de backlog `- [ ] \`FrameShape.ts\` — retângulo, elipse, linha básicos`, a linha `**Onde parou:** wo0012 aplicada; …` e o rodapé; `logs/2026-11-17.md` — a última linha, `- Conferência de tela do \`FrameImage.ts\` (chat); depois \`FrameShape.ts\`.` (1 ocorrência, termina em `\n`).

> **Canal dos meta neste ciclo = CODE** para `STATUS.md` e o log (Edições 1–2). O texto é do chat; você só posiciona. A seção do chat no log vai DENTRO da Edição 2 (o arquivo já tem seções do Code).

---

## 1. Por que

O STATUS deixou o `FrameImage.ts` em «Em Progresso» até a conferência de tela. O chat a fez: a imagem aparece no lugar calculado, o decodificador real do navegador funciona, e o servidor do Vite responde arquivo inexistente do jeito que o `UrlProjectFiles` espera. Esta WO registra isso e devolve o STATUS ao backlog (`FrameShape.ts`).

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `?? meta/workorders/261117-wo0013-fecha-conferencia-frame-de-imagem.md`.

## Edição 1a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-17, wo0012):** imagens no canvas (DEC-019) — `FrameImage.ts` feito, conferência de
tela pelo chat em «Em Progresso»; backlog ganha «Abrir projeto = pasta»; corrigida a linha do texto, que ainda chamava
a nitidez de bug aberto. A nota anterior (wo0011) saiu — o que ela registrava está em FIX-002 e no log de 2026-11-17.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-17, wo0013):** `FrameImage.ts` conferido na tela pelo chat; o item sai de «Em
Progresso» e o próximo do backlog é `FrameShape.ts`. A nota anterior (wo0012) saiu — o que ela registrava está em
DEC-019, no CHANGELOG e no log de 2026-11-17.
```

## Edição 1b — `meta/STATUS.md` · Funcionando (imagem conferida)

**Âncora** (o COMEÇO da linha da imagem — troque só este trecho; o resto da linha, de ` — os frames de imagem da página` em diante, fica como está):

```
- **Imagem aparece no canvas** *(wo0012, DEC-019; conferência de tela pendente — ver «Em Progresso»)*
```

**Substituir por:**

```
- **Imagem aparece no canvas** *(wo0012, DEC-019; conferido pelo chat no navegador embutido em 2026-11-17)*
```

## Edição 1c — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
- **Conferência de tela do `FrameImage.ts`** — o chat confere no navegador embutido com o `npm run dev` do dono rodando (a imagem de exemplo no frame de foto, `contain`, raio dos cantos, ordem sob o texto). Depois dela, o próximo item do backlog é `FrameShape.ts`.
```

**Substituir por:**

```
*Nada em progresso — próximo item do backlog é `FrameShape.ts`.*
```

## Edição 1d — `meta/STATUS.md` · Backlog

**Âncora:**

```
- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos
```

**Substituir por:**

```
- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos ← **próximo**
```

## Edição 1e — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**Onde parou:** wo0012 aplicada; falta a conferência de tela do `FrameImage.ts` pelo chat.

---

*Próximo passo: conferência de tela do `FrameImage.ts` (chat, navegador embutido); depois, `FrameShape.ts` — WO a escrever pelo chat.*
```

**Substituir por:**

```
**Onde parou:** `FrameImage.ts` conferido na tela pelo chat (wo0013); o próximo item do backlog é `FrameShape.ts`.

---

*Próximo passo: `FrameShape.ts` (retângulo, elipse, linha) — WO a escrever pelo chat.*
```

## Edição 2 — `logs/2026-11-17.md` · seção do chat (conferência do `FrameImage.ts`) e seção do Code

**Âncora** (última linha do arquivo):

```
- Conferência de tela do `FrameImage.ts` (chat); depois `FrameShape.ts`.
```

**Substituir por:**

```
- Conferência de tela do `FrameImage.ts` (chat); depois `FrameShape.ts`.

## Chat (planejamento) — conferência de tela do `FrameImage.ts`

### ✅ Feito
- Relatório da wo0012 lido (`f0e2401` empurrado, 137 testes, prova de vida com 4 falhas previstas) e arquivado.
- Conferência no navegador embutido (`localhost:5173`, DPR 1) [medido por instrumento]:
  - a imagem de exemplo aparece no frame de foto da página de produto, sem deformar, abaixo do preço; console sem erro;
  - posição lida nos pixels do buffer (2,3143 px/mm), relativa à área de corte: left 9,94 · top 66,98 · largura 190,12 ·
    altura 106,73 mm, contra o `contain` calculado de 10 · 66,56 · 190 · 106,88 mm — diferença de até ~1 px do buffer;
  - `GET /exemplo/imagens/_placeholder.png` → 200 `image/png` (14.582 bytes); duas vezes — o StrictMode monta duas;
  - arquivo inexistente no servidor do Vite → **200 `text/html`** (o `index.html` da SPA): a regra do `content-type`
    do `UrlProjectFiles` (U4) é necessária, não teórica;
  - `prepareImageDrawings` com o decodificador REAL (`decodeImageInBrowser`), importado pelo Vite na página: `src`
    inexistente + `fallback` → desenha o `fallback` decodificado em 1600×900; com `cover` o lugar sai 806,3 × 453,54 px
    centralizado (left 5,04 = 49,13 − 44,1) sobre o frame de 718,11 × 453,54; sem `fallback` → `error`; `../fora.png`
    → `error`.
- Não observável com o exemplo: o raio dos cantos (com `contain` a imagem não chega aos cantos do frame) e a ordem
  imagem × texto em sobreposição (os frames do exemplo não se sobrepõem). Os dois estão cobertos por código lido e
  pelo `relayer`, não por tela.
- Observação: a mensagem de `../fora.png` diz «não encontrado» — o caminho é recusado pelo `normalizeProjectPath`
  antes de qualquer leitura; o validador já recusa esse `.editx` ao abrir, então a mensagem só aparece com template
  montado no código.

### ⚖️ Decisões tomadas
- Nenhuma nova.

### ➡️ Próximos passos
- `FrameShape.ts` (retângulo, elipse, linha) — WO do chat.
```

E depois dela, uma linha em branco e uma seção `## Code (execução) — wo0013` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md` (curta: WO de doc).

---

## Fora de escopo

- Código. CHANGELOG, ROADMAP e DECISIONS (já registrados pela wo0012).

## Armadilhas desta WO

- **Edição 1b troca o COMEÇO de uma linha longa** — o resto da linha fica intacto.
- **Python não serve:** use `node` se precisar de script.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: `M logs/2026-11-17.md`, `M meta/STATUS.md`, `?? meta/workorders/261117-wo0013-fecha-conferencia-frame-de-imagem.md`. Um a mais ou a menos = **VERMELHO**.
- [ ] WO só de doc: sem build — a rede é o `git diff`.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "conferido pelo chat no navegador embutido em 2026-11-17)\* — os frames de imagem" meta/STATUS.md` = 1
      - `grep -c "^- \*\*Conferência de tela do \`FrameImage.ts\`\*\*" meta/STATUS.md` = 0
      - `grep -c "^\*Nada em progresso — próximo item do backlog é \`FrameShape.ts\`.\*$" meta/STATUS.md` = 1
      - `grep -c "^- \[ \] \`FrameShape.ts\` — retângulo, elipse, linha básicos ← \*\*próximo\*\*$" meta/STATUS.md` = 1
      - `grep -c "^## Chat (planejamento) — conferência de tela do \`FrameImage.ts\`" logs/2026-11-17.md` = 1
      - `grep -c "^## Code (execução) — wo0013" logs/2026-11-17.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0013.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Saídas cruas acima, `git diff --stat`, commit e push.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-17.md meta/STATUS.md meta/workorders/261117-wo0013-fecha-conferencia-frame-de-imagem.md
```

```
git commit -m "docs: registra conferencia de tela do FrameImage" -m "Conferido pelo chat no navegador embutido: imagem no lugar calculado, decodificador real e fallback funcionando, servidor do Vite devolve text/html para arquivo inexistente (wo0013)."
```

```
git push
```
