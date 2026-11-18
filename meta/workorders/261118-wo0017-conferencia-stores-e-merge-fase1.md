# WO 0017 — Registra a conferência de tela dos stores e abre o merge do KCM v1.151.0

> **Tipo:** WO de DOC (registro). Não toca o produto: sem build; a rede é o `git diff`.
> **Config sugerida:** Sonnet · `/effort` médio.
> **Pré-requisito:** escrita sobre `f732c04` (`feat(store): cria os stores do editor com desfazer e refazer`), já em `origin/main`; árvore limpa exceto esta WO.
> **Base:** (1) conferência de tela dos stores feita pelo chat no navegador embutido em 2026-11-18, com o `npm run dev` do dono rodando; (2) chegou à pasta-pai o pacote `261118-kcm-update-v1.151.0/` (template-update do kit, v1.135.0 → v1.151.0); o chat fez a fase preliminar que o `_UPDATE-PROMPT.md` pede. Resultados na Edição 2.
> **Depende de:** wo0016 (aplicada: `f732c04`).
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-18, no disco, neste turno, sobre `f732c04`): `meta/STATUS.md` — a nota `**Mudanças nesta revisão (2026-11-18, wo0016):**` (3 linhas), o começo `- **Documento nos stores, com desfazer e refazer** *(wo0016, DEC-021; conferência de tela pendente — ver «Em Progresso»)*`, a linha `- **Conferência de tela dos stores** —` inteira, e o bloco de `**Onde parou:** wo0016 aplicada; …` ao rodapé; `logs/2026-11-18.md` — a última linha, `wo0016 aplicada; falta a conferência de tela dos stores pelo chat (\`window.__editx\` no \`npm run dev\`). Depois, \`SelectionManager.ts\` (WO a escrever pelo chat).` (1 ocorrência).
> **O pacote do kit NÃO é tocado por esta WO** e fica na pasta-pai até o merge fechar (regra do próprio pacote). Não o mova.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md` e o log (Edições 1–2). O texto é do chat; você só posiciona. A seção do chat no log vai DENTRO da Edição 2 (o arquivo já tem seções do Code).

---

## 1. Por que

Os stores passaram na conferência de tela; o STATUS precisa dizer isso. E o merge do kit passa à frente do `SelectionManager.ts`: o pacote manda instalar as skills novas ANTES de aplicar qualquer WO de migração, e a próxima WO de código seria aplicada pelas skills velhas. O STATUS registra o merge em curso.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `?? meta/workorders/261118-wo0017-conferencia-stores-e-merge-fase1.md`.

## Edição 1a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-18, wo0016):** stores do editor feitos (DEC-021) e o backlog reordenado — stores
antes da seleção; conferência de tela pelo chat em «Em Progresso». A nota anterior (wo0015) saiu — o que ela
registrava está no log de 2026-11-18.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-18, wo0017):** stores conferidos na tela pelo chat; «Em Progresso» passa a ser o
merge do KCM v1.151.0 (antes do `SelectionManager.ts`). A nota anterior (wo0016) saiu — o que ela registrava está em
DEC-021, no CHANGELOG e no log de 2026-11-18.
```

## Edição 1b — `meta/STATUS.md` · Funcionando (stores conferidos)

**Âncora** (o COMEÇO da linha — troque só este trecho; o resto da linha, de ` — \`createEditorStores(template)\`` em diante, fica como está):

```
- **Documento nos stores, com desfazer e refazer** *(wo0016, DEC-021; conferência de tela pendente — ver «Em Progresso»)*
```

**Substituir por:**

```
- **Documento nos stores, com desfazer e refazer** *(wo0016, DEC-021; conferido pelo chat no navegador embutido em 2026-11-18)*
```

## Edição 1c — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
- **Conferência de tela dos stores** — o chat confere no navegador embutido com o `npm run dev` do dono rodando: o canvas igual a antes, e pelo console (`window.__editx`) mover um frame, ver o canvas acompanhar, desfazer e refazer. Depois dela, o próximo item do backlog é `SelectionManager.ts`.
```

**Substituir por:**

```
- **Merge do template-update do KCM v1.151.0** (pacote `261118-kcm-update-v1.151.0/` na pasta-pai; o projeto está em v1.135.0) — fase 1 (preliminares) feita pelo chat em 2026-11-18: superfícies presentes, linhas revogadas sem ocorrência a corrigir, modos coerentes, correções obrigatórias do `settings.json` já satisfeitas (detalhe no log). Falta: comparar os 23 arquivos do pacote, o dono decidir, a fusão do CEREBRO e das Instruções, a instalação das skills e o `GUIA-DO-KIT.md` novo. Vem ANTES do `SelectionManager.ts` — o pacote manda instalar as skills novas antes de aplicar qualquer WO.
```

## Edição 1d — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**Onde parou:** wo0016 aplicada; falta a conferência de tela dos stores pelo chat.

---

*Próximo passo: conferência de tela dos stores (chat, navegador embutido); depois, `SelectionManager.ts` — WO a escrever pelo chat.*
```

**Substituir por:**

```
**Onde parou:** stores conferidos na tela (wo0017); chegou o pacote do KCM v1.151.0 e o merge está na fase 1.

---

*Próximo passo: fase 2 do merge do KCM v1.151.0 (o chat compara os 23 arquivos do pacote e apresenta o que adotar); depois, `SelectionManager.ts` — WO a escrever pelo chat.*
```

## Edição 2 — `logs/2026-11-18.md` · seção do chat (conferência dos stores e fase 1 do merge) e seção do Code

**Âncora** (última linha do arquivo):

```
wo0016 aplicada; falta a conferência de tela dos stores pelo chat (`window.__editx` no `npm run dev`). Depois, `SelectionManager.ts` (WO a escrever pelo chat).
```

**Substituir por:**

```
wo0016 aplicada; falta a conferência de tela dos stores pelo chat (`window.__editx` no `npm run dev`). Depois, `SelectionManager.ts` (WO a escrever pelo chat).

## Chat (planejamento) — conferência de tela dos stores e fase 1 do merge do KCM v1.151.0

### ✅ Feito
- Relatório da wo0016 lido (`f732c04` empurrado, 164 testes, prova de vida com 2 falhas previstas) e arquivado.
- Conferência no navegador embutido (`localhost:5173`, DPR 1) [medido por instrumento]: o canvas igual a antes; pelo
  console, `__editx.document.getState().setFrameTransform('frame-foto-produto', {x: 60, …})` → o canvas redesenhou a
  foto 50 mm à direita (medido nos pixels: **50,07 mm**); `undo()` → `x` 10, `past` 0, `future` 1, foto de volta;
  `redo()` → `x` 60 de novo; mudança vazia → `past` inalterado e o MESMO objeto de template; console sem erro. Página
  recarregada e aba fechada ao fim. (O primeiro medidor do chat achava pixels da cor da foto na borda suavizada do
  texto e devolvia lixo — trocado por uma sequência de 20 px seguidos; defeito do instrumento, não do app.)
- Chegou o pacote `261118-kcm-update-v1.151.0/` (25 arquivos, ~208 KB) — template-update do kit, v1.135.0 → v1.151.0.
  Lidos inteiros: `_UPDATE-MANIFEST.md` e `_UPDATE-PROMPT.md`. **Fase 1 (preliminares) [medido]:**
  - versão do pacote: v1.151.0 (linha `- Kit:`); projeto em `f732c04`, árvore limpa;
  - superfícies: `.claude/settings.json`, `.claude/skills/{apply-wo,wrap,sondar}/SKILL.md`, `CLAUDE.md`,
    `INSTRUCOES-DO-PROJETO.md` e `meta/*` presentes e versionados; NÃO existem `meta/GUIA-DO-KIT.md` (novo, natureza
    `do-kit`) nem `meta/SETUP.md` (opcional);
  - linhas revogadas — 4 termos literais em `meta/` (fora WOs e análises datadas), `CLAUDE.md`, `.claude/`,
    Instruções, `.gitignore`, `.flatdropignore`: **0 ocorrências**; pelo fato («sessão» no lugar de «turno», bloco de
    commit para colar): **5 ocorrências, todas legítimas** — `meta/CEREBRO.md:13` (relato da revisão),
    `meta/CEREBRO.md:175` (contraste: «não é de SESSÃO: é de TURNO»), `meta/LOG-TEMPLATE.md:8` (relato da revisão),
    `meta/DECISIONS.md:254` (histórico do DEC-010), `meta/DECISIONS.md:707` (domínio: sessão do navegador, DEC-019).
    Corrigidas: 0. Cobertura: 4/4 termos × as superfícies acima;
  - marcadores de modo no CEREBRO: Code presente (declarado `sim`), ASU e grupo ausentes (declarados `nao`), só as
    3 skills do Code em `.claude/skills/` — coerente, nada a remover;
  - correções obrigatórias do `.claude/settings.json`: sem comentário `//`, `Write` no `allow`, `additionalDirectories:
    ["../"]` — as três já satisfeitas;
  - carimbos de versão: 5 em v1.135.0 (CEREBRO, `_TEMPLATE.md` de WO, as 3 skills); o 6º (GUIA-DO-KIT) não existe.
- Não feito ainda (fase 2): a comparação por bloco dos 23 arquivos, (a)/(b)/(c) para o dono decidir.

### ⚖️ Decisões tomadas
- O merge passa à frente do `SelectionManager.ts` (o pacote manda instalar as skills novas antes de qualquer WO).
```

E depois dela, uma linha em branco e uma seção `## Code (execução) — wo0017` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md` (curta: WO de doc).

---

## Fora de escopo

- Código. O pacote do kit (não mova, não abra para aplicar). CHANGELOG, ROADMAP, DECISIONS.

## Armadilhas desta WO

- **Edição 1b troca o COMEÇO de uma linha longa** — o resto da linha fica intacto.
- **Python não serve:** use `node` se precisar de script.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: `M logs/2026-11-18.md`, `M meta/STATUS.md`, `?? meta/workorders/261118-wo0017-conferencia-stores-e-merge-fase1.md`. Um a mais ou a menos = **VERMELHO**.
- [ ] WO só de doc: sem build — a rede é o `git diff`.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "conferido pelo chat no navegador embutido em 2026-11-18)\* — \`createEditorStores" meta/STATUS.md` = 1
      - `grep -c "^- \*\*Conferência de tela dos stores\*\*" meta/STATUS.md` = 0
      - `grep -c "^- \*\*Merge do template-update do KCM v1.151.0\*\*" meta/STATUS.md` = 1
      - `grep -c "^## Chat (planejamento) — conferência de tela dos stores e fase 1" logs/2026-11-18.md` = 1
      - `grep -c "^## Code (execução) — wo0017" logs/2026-11-18.md` = 1
      - `ls ../261118-kcm-update-v1.151.0/_UPDATE-MANIFEST.md` existe (o pacote continua na pasta-pai)
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0017.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Saídas cruas acima, `git diff --stat`, commit e push.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-18.md meta/STATUS.md meta/workorders/261118-wo0017-conferencia-stores-e-merge-fase1.md
```

```
git commit -m "docs: registra conferencia dos stores e abre o merge do KCM v1.151.0" -m "Stores conferidos pelo chat no navegador embutido (mover, desfazer, refazer pelo console). Fase 1 do merge do template-update: superficies, linhas revogadas, modos e settings conferidos (wo0017)."
```

```
git push
```
