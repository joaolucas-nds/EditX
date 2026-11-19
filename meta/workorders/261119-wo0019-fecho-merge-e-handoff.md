# WO 0019 — Fecha o merge do KCM v1.151.0 e versiona o log de 2026-11-19

> **Tipo:** WO de DOC (registro). Não toca o produto: sem build; a rede é o `git diff` e os `sha1sum`.
> **Config sugerida:** Sonnet · `/effort` baixo.
> **Pré-requisito:** escrita sobre `562d9d1` (`docs: funde o template-update do KCM v1.151.0`), já em `origin/main`.
> **Base:** relatório da wo0018 (arquivado); o dono relatou no chat, em 2026-11-19, que colou as Instruções novas no painel; o chat moveu o pacote do kit para `notas-arquivadas/`; transferência para conversa nova.
> **Depende de:** wo0018 (aplicada: `562d9d1`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat; diferente = PARE e reporte):
> - `meta/CEREBRO.md` — `ccc80af1652709a387332bad905cdc2800a297a6`
> - `logs/2026-11-19.md` — arquivo NOVO do chat; a Edição 3 acrescenta a sua seção nele, então o `sha1sum` dele vale só ANTES da Edição 3: `b536e0be308d277d381627ac7f57fde1e2c36be9`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-19, no disco, neste turno, sobre `562d9d1`; recortadas por script e conferidas como ocorrência única): `meta/IDEAS.md` — a última linha da entrada «2026-11-10 — Merge do template-update v1.135.0» em «Feedback para o Kit»; `meta/STATUS.md` — a linha `**Onde parou:** …`; `logs/2026-11-19.md` — a última linha.

> **Canal dos meta neste ciclo = CODE** para `IDEAS.md`, `STATUS.md` e a seção do Code no log. O texto é do chat; você só posiciona. `meta/CEREBRO.md` e a seção do chat no log são do chat: **não os edite**.

---

## 1. Por que

Fechar o merge: o fato «Instruções coladas no painel» [relatado pelo dono] e o arquivamento do pacote só existem no chat; o log de 2026-11-19 e o item novo do CEREBRO precisam ir para o repositório antes da troca de conversa.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` mostra exatamente: ` M meta/CEREBRO.md`, `?? logs/2026-11-19.md` e `?? meta/workorders/261119-wo0019-fecho-merge-e-handoff.md` — 3 linhas.
2. `sha1sum meta/CEREBRO.md logs/2026-11-19.md` = os valores do cabeçalho.

## Edição 1 — `meta/IDEAS.md` · Feedback para o Kit (merge v1.151.0)

**Âncora:**

````
  Valeria pôr a variável no próprio prompt do merge.
````

**Substituir por:**

````
  Valeria pôr a variável no próprio prompt do merge.

### 2026-11-18 — Merge do template-update v1.151.0
- **Pacote gerado sem o SO marcado** — o CEREBRO e as Instruções do pacote vieram sem «Ambiente (sistema
  operacional)» nem a linha do Windows/CMD, embora o projeto declare Windows; voltaram por transplante (DEC-022).
  Valeria o gerador ler o SO do projeto vivo.
- **A nota «CHANGELOG/ROADMAP de outros nichos» continua na tabela de gatilhos** — mesmo achado do v1.135.0; a nota
  viva que os declara ativos foi transplantada de novo.
- **O marcador de fim do IDEAS supõe que o arquivo termina em «Feedback»** — aqui termina no modelo de nova ideia;
  o texto foi ajustado à ordem deste arquivo.
````

## Edição 2 — `meta/STATUS.md` · Onde parou

**Âncora:**

````
**Onde parou:** merge do KCM v1.151.0 feito (wo0018, DEC-022).
````

**Substituir por:**

````
**Onde parou:** merge do KCM v1.151.0 fechado (wo0018, DEC-022; pacote movido para `notas-arquivadas/` em 2026-11-19) e Instruções novas coladas no painel do Projeto [relatado pelo dono, 2026-11-19]. Detalhe em `logs/2026-11-19.md`.
````

## Edição 3 — `logs/2026-11-19.md` · seção do Code

**Âncora:**

````
- Aplicar a wo0019 (Code), depois a análise do `SelectionManager.ts` (chat).
````

**Substituir por:**

````
- Aplicar a wo0019 (Code), depois a análise do `SelectionManager.ts` (chat).

## Code (execução) — wo0019
````

E depois dela, uma linha em branco e o corpo da seção `## Code (execução) — wo0019`, escrito POR VOCÊ no formato de `meta/LOG-TEMPLATE.md` (curto: WO de doc).

---

## Fora de escopo

- Código. Qualquer outro meta. O `../261119-HANDOFF-BRIEF.md` na pasta-pai (não versionar, não mover).

## Armadilhas desta WO

- **Cerca de QUATRO crases:** o texto novo da Edição 1 traz `### título`; o da 3, `## título` — delimite pela de quatro.
- **Python não serve:** use `node` se precisar de script.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: ` M meta/CEREBRO.md`, ` M meta/IDEAS.md`, ` M meta/STATUS.md`, `?? logs/2026-11-19.md`, `?? meta/workorders/261119-wo0019-fecho-merge-e-handoff.md` — **5 linhas**. Uma a mais ou a menos = **VERMELHO**.
- [ ] `sha1sum meta/CEREBRO.md` continua o do cabeçalho.
- [ ] WO só de doc: sem build — a rede é o `git diff`.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "^### 2026-11-18 — Merge do template-update v1.151.0" meta/IDEAS.md` = 1
      - `grep -c "^- \*\*Simulação de WO pelo chat (VM Linux)" meta/CEREBRO.md` = 1
      - `grep -c "relatado pelo dono, 2026-11-19\]" meta/STATUS.md` = 1
      - `grep -c "^## Code (execução) — wo0019" logs/2026-11-19.md` = 1
      - `ls ../261119-HANDOFF-BRIEF.md` existe e NÃO aparece no `git status` (está fora do repositório)
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0019.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Saídas cruas acima, `git diff --stat`, commit e push.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-19.md meta/CEREBRO.md meta/IDEAS.md meta/STATUS.md meta/workorders/261119-wo0019-fecho-merge-e-handoff.md
```

```
git commit -m "docs: fecha o merge do KCM v1.151.0 e registra o log de 2026-11-19" -m "Instrucoes coladas no painel (relatado pelo dono), pacote arquivado, feedback do kit no IDEAS, tecnica de simulacao no CEREBRO (wo0019)."
```

```
git push
```
