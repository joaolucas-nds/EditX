# WO 0008 — Registro da conferência de tela da wo0007 e do bug de nitidez

> **Tipo:** WO de DOC (registro). Não toca código.
> **Config sugerida:** Sonnet · `/effort` médio — só registro, âncoras de linha.
> **Pré-requisito:** escrita sobre `148ed1f` (`feat(canvas): desenha texto como contorno das letras`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 101 testes verdes (relatório da wo0007).
> **Base:** conferência de tela da wo0007 respondida pelo dono no chat em 2026-11-15 (22:22 e 22:31) e prints arquivados em `../notas-arquivadas/Captura de tela 2026-11-15 222038.png`, `…222133.png` e `…222205.png`.
> **Depende de:** wo0007 (aplicada: `148ed1f`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `88ff9398593cb94bdca2ce52b8deb6de1def6fe7  logs/2026-11-15.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-15, no disco, neste turno): `meta/STATUS.md` — a nota de 3 linhas `**Mudanças nesta revisão (2026-11-15, wo0007):**…`, a linha que começa `- **Texto aparece no canvas** *(conferência de tela do dono pendente)*`, a linha que começa `*Nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do`, a linha de backlog `- [x] \`FrameText.ts\` …`, a linha `**Onde parou:** …` e o rodapé `*Próximo passo: …*`; `logs/2026-11-15.md` — a última linha.
> **Próximo comando:** nenhum (a próxima conversa do chat decide o próximo passo).

> **Canal dos meta neste ciclo = CODE** para `meta/STATUS.md` (Edições 1a–1f) e a seção do Code no log (Edição 2). A seção «Chat (planejamento) — noite» de `logs/2026-11-15.md` é do chat e já está gravada — **só versione**.

---

## 1. Por que

A conferência de tela da wo0007 foi respondida no chat e não está em arquivo nenhum; o STATUS ainda diz «conferência de tela do dono pendente». O dono também relatou um defeito novo (canvas borrado fora do zoom 100%) que precisa estar no STATUS como bug aberto antes da troca de conversa — fato só relatado no chat não existe para a conversa seguinte.

## 2. Contexto factual

1. Itens 1–4, 6 e 7 do roteiro da wo0007: «sim» **[relatado pelo dono, 22:22]**. Prints conferidos pelo chat: `{NOME}` azul-escuro em negrito e `{PRECO}` maior em vermelho, Montserrat, console sem erro **[observado pelo chat nos prints]**.
2. Item 5 (texto acompanha a página ao redimensionar): o dono não conseguiu arrastar a borda da janela **[relatado pelo dono, 22:31]**; com zoom do Chrome em 500% e com o DevTools aberto, o texto fica no mesmo lugar relativo da página **[observado pelo chat nos prints]** → proporção OK.
3. Em zoom 100% tudo nítido; em qualquer outro zoom o canvas fica borrado e continua assim mesmo esperando minutos **[relatado pelo dono, 22:31]**.
4. No Fabric 6.9.1, `setDimensions` relê `window.devicePixelRatio` via `getRetinaScaling()` e aplica `ctx.scale(retinaScaling)` **[lido pelo chat em `node_modules/fabric/dist/index.mjs`]**. Causa raiz do item 3 **não investigada** — hipóteses no log do chat.

---

## Edição 1a — `meta/STATUS.md` · nota de revisão

**Âncora** (topo do arquivo, 3 linhas):

```
**Mudanças nesta revisão (2026-11-15, wo0007):** o texto aparece no canvas, desenhado como contorno das letras
(DEC-018) — `FrameText.ts` sai do backlog (conferência de tela do dono pendente), `FrameImage.ts` vira o próximo;
F1 em 6 de 14. A nota anterior (wo0006) saiu — o que ela registrava está em DEC-017.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-15, wo0008):** conferência de tela da wo0007 registrada — texto conferido pelo
dono; aberto o bug «canvas borrado fora do zoom 100%». A nota anterior (wo0007) saiu — o que ela registrava está em
DEC-018 e no CHANGELOG.
```

## Edição 1b — `meta/STATUS.md` · item «Texto aparece no canvas»

**Âncora** (trecho do começo da linha, em «Funcionando»):

```
- **Texto aparece no canvas** *(conferência de tela do dono pendente)* —
```

**Substituir por:**

```
- **Texto aparece no canvas** *(conferido pelo dono na tela em 2026-11-15; nitidez fora do zoom 100% é bug aberto — ver «Quebrado»)* —
```

## Edição 1c — `meta/STATUS.md` · bug aberto em «Quebrado»

**Âncora** (trecho do começo da linha, primeira linha da seção «❌ Quebrado / Com Problema»):

```
*Nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do
```

**Substituir por:**

```
- **Canvas borrado com o zoom do navegador diferente de 100%** — em 100% a página e o texto ficam nítidos; em qualquer outro zoom ficam borrados e continuam assim mesmo esperando minutos [relatado pelo dono, 2026-11-15]. Causa raiz não investigada; hipóteses e o que já foi lido no Fabric estão em `logs/2026-11-15.md` («Chat (planejamento) — noite»).

*Fora esse, nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do
```

## Edição 1d — `meta/STATUS.md` · linha de backlog do `FrameText.ts`

**Âncora** (trecho da linha `- [x] \`FrameText.ts\``):

```
(wo0006 + wo0007, DEC-017/DEC-018; conferência de tela do dono pendente)
```

**Substituir por:**

```
(wo0006 + wo0007, DEC-017/DEC-018; conferido pelo dono na tela em 2026-11-15)
```

## Edição 1e — `meta/STATUS.md` · «Onde parou»

**Âncora** (linha inteira, bloco «Última conversa»):

```
**Onde parou:** conferência de tela do texto pelo dono; depois `FrameImage.ts`.
```

**Substituir por:**

```
**Onde parou:** texto conferido na tela pelo dono; bug de nitidez fora do zoom 100% aberto (causa raiz a investigar). A ordem entre investigar o bug e `FrameImage.ts` não está decidida.
```

## Edição 1f — `meta/STATUS.md` · rodapé

**Âncora** (linha inteira, última do arquivo):

```
*Próximo passo: `FrameImage.ts` (frame de imagem com fit modes) — WO a escrever pelo chat, depois da conferência de tela do texto.*
```

**Substituir por:**

```
*Próximo passo: decidir a ordem entre investigar o borrão fora do zoom 100% (bug aberto) e `FrameImage.ts` (frame de imagem com fit modes) — WO a escrever pelo chat.*
```

## Edição 2 — `logs/2026-11-15.md` · seção do Code

**Âncora** (linha inteira, última do arquivo — gravada pelo chat):

```
Texto conferido na tela (itens 1–4, 6, 7 e a proporção do 5); bug de nitidez aberto e registrado no STATUS pela wo0008. Conversa transferida: brief em `../261115-HANDOFF-BRIEF.md`. Próximo: decidir a ordem entre investigar o borrão e o `FrameImage.ts`.
```

**Substituir por** (a âncora repetida, uma linha em branco, a seção nova):

```
Texto conferido na tela (itens 1–4, 6, 7 e a proporção do 5); bug de nitidez aberto e registrado no STATUS pela wo0008. Conversa transferida: brief em `../261115-HANDOFF-BRIEF.md`. Próximo: decidir a ordem entre investigar o borrão e o `FrameImage.ts`.

## Code (execução) — wo0008

### ✅ Feito
- STATUS: conferência de tela da wo0007 registrada (Edições 1a, 1b, 1d–1f) e bug de nitidez aberto em «Quebrado» (1c).

### 🐛 Problemas encontrados
Nenhum problema encontrado na aplicação.

### 📊 Onde parei (estado ao final)
Registro commitado e enviado; nada de código mudou.
```

---

## Fora de escopo

- Investigar ou corrigir o borrão. Não abra o Fabric, não mexa em `CanvasEngine.ts`/`CanvasView.tsx`.
- `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md`: nada muda (a linha do `FrameText.ts` no ROADMAP não cita conferência pendente — lido pelo chat).

---

## Depois de aplicar — conferência antes do commit

- [ ] `sha1sum logs/2026-11-15.md` ANTES de editar = o do cabeçalho. Diferente: **PARE e reporte**.
- [ ] `git status --short -uall` mostra exatamente: `M logs/2026-11-15.md`, `M meta/STATUS.md`, `?? meta/workorders/261115-wo0008-registro-tela-e-bug-nitidez.md`.
- [ ] `grep -c "conferido pelo dono na tela em 2026-11-15" meta/STATUS.md` = **2** (linhas; Edições 1b e 1d).
- [ ] `grep -c "^- \*\*Canvas borrado com o zoom do navegador diferente de 100%\*\*" meta/STATUS.md` = **1**.
- [ ] `grep -c "^\*Nenhum bug aberto" meta/STATUS.md` = **0** (par negativo da 1c).
- [ ] `grep -c "^## Code (execução) — wo0008" logs/2026-11-15.md` = **1**.
- [ ] `git diff --stat meta/STATUS.md`: rode e relate cru (deduzido — não pare por ele).
- [ ] WO só de doc: sem build; a rede é o `git diff`.

## Relatório de aplicação

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0008.txt` (`date +%y%m%d-%H%M` na hora), pela ferramenta de escrita de arquivo.

## Commit — blocos separados, mensagem SEM acento

```
git add meta/STATUS.md logs/2026-11-15.md meta/workorders/261115-wo0008-registro-tela-e-bug-nitidez.md
```

```
git commit -m "docs: registra conferencia de tela da wo0007 e abre bug de nitidez" -m "Texto conferido pelo dono na tela; canvas fica borrado com zoom do navegador diferente de 100%, causa raiz a investigar."
```

```
git push
```
