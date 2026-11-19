# ANALISE — Merge do template-update do KCM v1.151.0 (fase 2: comparação e inventário)

> **Status:** Em discussao
> **Data:** 2026-11-18 (data de criacao; nao muda depois)
> **Origem:** pacote `261118-kcm-update-v1.151.0/` na pasta-pai (25 arquivos, ~208 KB); fase 1 (preliminares) registrada
> no log de 2026-11-18 pela wo0017. O projeto está na v1.135.0 do kit (DEC-012).

## Problema

O kit evoluiu de v1.135.0 para v1.151.0. O pacote traz regras novas (algumas mudam o formato das WOs), um arquivo novo
(`meta/GUIA-DO-KIT.md`), skills novas, e duas fusões (CEREBRO e Instruções) que partem do PACOTE. Aplicar sem
inventário perde o que este projeto aprendeu; não aplicar deixa o projeto preso a regras que o kit já corrigiu. As
escolhas abaixo são do dono.

## Restricoes / o que foi medido

**Coberturas — duas, separadas:**
- **Arquivos do pacote comparados: 23/23** (+ `_UPDATE-MANIFEST.md` e `_UPDATE-PROMPT.md` lidos inteiros). Por bloco:
  CEREBRO **49/49 seções** (31 iguais, 13 com mudança, 2 só no pacote, 3 só no vivo); GUIA **98/98 linhas** (preâmbulo
  + 4 seções comparadas às vivas); Instruções, modelo de WO, skills, `settings.json`, `.gitignore`, `.flatdropignore`,
  modelo de análise e `SPEC.md`: diff completo; os outros modelos de `meta/` (CONTEXT, STATUS, DECISIONS, CHANGELOG,
  IDEAS, ROADMAP, GLOSSARY, HISTORY, SETUP, LOG-TEMPLATE): estrutura (títulos e notas de orientação) contra o vivo.
- **Varredura de linhas revogadas no repositório:** 4 termos literais — 0 ocorrências; pelo FATO («sessão» no lugar de
  turno/conversa/dia, padrão aberto `sess(ã|a)o(es|ões)?` em `meta/` [fora WOs e análises datadas], `CLAUDE.md`,
  `.claude/`, Instruções, `.gitignore`, `.flatdropignore`): **26 ocorrências em 10 arquivos; a corrigir: 1; justificadas:
  25** (lista no fim; contadas uma a uma, ocorrência e não linha). **A fase 1 tinha declarado 5 — o padrão fechado não pegou o `.gitignore`** (que ela não varreu pelo
  fato); esta é a cobertura que vale.

**Comparação — o que mudou, por arquivo:**

| Arquivo | Natureza | O que o pacote traz | Leitura |
|---|---|---|---|
| `.claude/skills/apply-wo/SKILL.md` | template | 2 regras novas: âncora e texto novo delimitados pela **cerca de QUATRO crases**; a PARADA também grava o relatório em arquivo | vivo = genérico v1.135.0 → **adotar inteiro** |
| `.claude/skills/wrap/SKILL.md`, `sondar/SKILL.md` | template | só o carimbo de versão | **adotar inteiro** |
| `meta/workorders/_TEMPLATE.md` | template | blocos de âncora/texto novo com cerca de **quatro** crases + nota do porquê; carimbo | vivo = genérico → **adotar inteiro** |
| `.claude/settings.json` | template | `allow` ganha `git show`, `git ls-files`, `git cat-file`, `wc`, `grep`, `head` | o vivo tem os `npm` do projeto → **somar** |
| `.gitignore` | template | `.claude/settings.local.json` (o Code cria e enche de caminhos da máquina) | **somar**; e corrigir «logs de sessao» → «log do dia» (linha 4) |
| `meta/LOG-TEMPLATE.md` | template | seção **«Entregas»** (WOs aplicadas com o commit, specs e análises do dia) | **somar**; as seções a mais do vivo ficam |
| `meta/CONTEXT.md` | template | seção **«Build e validação (a rede deste projeto)»** — rede automática, linha de base, o que se confere na tela, o que o chat não roda | **somar** com o conteúdo deste projeto (`npm test`/`lint`/`build`; tela = chat no navegador embutido; o chat não roda o `vitest` — binário do Windows) |
| `meta/IDEAS.md` | template | marcador de fim («Acréscimo entra sob o título da seção certa, nunca aqui embaixo») | **somar** |
| `meta/DECISIONS.md` | template | Status ganha «aceita — emendada por DEC-X»; arquivar «decisão substituída **ou evento fechado**»; **FIX fica enquanto a lição valer** | o vivo tem **832 linhas** (alarme: ~700) — ver ponto de decisão 5 |
| `meta/SETUP.md` | template (opcional) | arquivo novo: ambiente para o HUMANO (instalar, rodar, o que já deu errado) | não existe aqui — ponto de decisão 2 |
| `meta/HISTORY.md`, `ROADMAP`, `GLOSSARY`, `STATUS`, `CHANGELOG`, `SPEC` | template | nada novo de estrutura (HISTORY: dois tipos de seção a mais no modelo; SPEC idêntico) | fica o vivo |
| `CLAUDE.md` | template | nada novo — o pacote é o genérico do qual o vivo é a especialização | **fica o vivo** (c) |
| `.flatdropignore`, `meta/analises/_TEMPLATE.md` | template / modelo | idênticos | nada a fazer |
| `meta/GUIA-DO-KIT.md` | **do-kit** | arquivo NOVO, inteiro: «Ao receber um template-update», «Transferência — canal de reserva», «Sonda e exploração», «Correspondência entre projetos» (saem do CEREBRO) | **criar inteiro**; as 4 seções vivas não têm linha própria deste projeto (comparado bloco a bloco: os blocos que só o vivo tem são o texto genérico da v1.135.0, que o GUIA reescreveu) |
| `meta/CEREBRO.md` | **fusão** | ver inventário abaixo | base = pacote |
| `INSTRUCOES-DO-PROJETO.md` | **fusão** | = o vivo sem o que é deste projeto, + 2 linhas do `SETUP.md` | base = pacote |

**CEREBRO — o que o pacote traz de novo** (13 seções com mudança, palavra a palavra): índice de seções no
preâmbulo; «Canal do chat» ganha «insumo permanente não é nota» (`material/`) e «permissão pedida pode expirar»;
princípio 10 ganha «quando uma parte restringe o escopo, a restrição vence»; «Como manter os documentos» ganha o
`SETUP.md`; «Regras de higiene» ganha «acréscimo entra sob o título da seção certa», «FIX fica enquanto a lição valer»,
«evento fechado» e o conjunto de Status; «Privacidade» ganha «nome de arquivo não leva dado pessoal»; «Medição
delegada» ganha a marca `[proposto pelo assistente]`; «Tabela de gatilhos» ganha 3 linhas (traceback colado sem
descrição; projeto com documentos ainda no molde; a mesma regra em dois módulos) e ponteiros para o GUIA; «Ao final da
conversa» ganha o `SETUP.md`; «Idioma» ganha «código de registro (`DEC-`, `FIX-`, `wo`) vem explicado na primeira vez»;
seções novas «A rede deste projeto» e «README e LICENSE»; «Ao receber», «Transferência», «Sonda» e «Correspondência»
viram ponteiros para o GUIA; carimbo v1.151.0.

## Opcoes consideradas

**Inventário da fusão do CEREBRO** (base = pacote):
- **Transplantar** (é deste projeto): (1) **«Técnicas específicas deste projeto»** — os dois itens (o `python3` do Git
  Bash trava; a conferência de tela é do chat no navegador embutido, com os limites do painel); (2) **«Ambiente (sistema
  operacional)»** e a nota do CMD em «Commit pronto» — o pacote não as traz, e as Instruções do pacote também perderam a
  linha do Windows: **o pacote foi gerado sem sistema operacional marcado** (ponto de decisão 1); (3) a nota da Tabela
  de gatilhos «**neste projeto (Desenvolvimento), CHANGELOG.md e ROADMAP.md já são arquivos ativos**» — o pacote volta
  a dizer que os dois são «de outros nichos» e não são criados; aqui eles existem e são vivos (choque, já registrado como
  feedback no merge v1.135.0); (4) a nota de revisão do topo, trocada por uma nova deste merge.
- **Do vivo, fica de fora:** as seções «Sonda e exploração» (8 KB) e «Correspondência entre projetos» (2,5 KB) e as
  versões longas de «Ao receber» e «Transferência» — vão para o GUIA, como o pacote manda; nenhuma tem conteúdo próprio
  deste projeto (comparado). A nota de revisão de 2026-11-10 (o histórico dela está no DEC-012).
- **Do pacote, cortado:** nada. (Toda linha do pacote entra; o que entra a mais é só o transplante.)

**Inventário da fusão das Instruções** (base = pacote): transplantar o título «Projeto: EditX», a nota «Este arquivo é a
FONTE das Instruções do painel do Projeto: mudou aqui, cole lá» e a linha do Windows/CMD. As 2 linhas do `SETUP.md`
entram se o `SETUP.md` for adotado (ponto 2); senão saem — são do pacote, então cortá-las vai para este inventário.
Tamanho: vivo 5.588 caracteres; pacote 5.456; resultado previsto ≈ 5.790 com o SETUP (≈ 5.600 sem), abaixo do teto do
modo Code (6.900 + 550). **Medir na hora de gravar** (`LC_ALL=C.UTF-8 wc -m`), não usar este número.

**Como aplicar — duas formas:**
- **A — uma WO só de merge (wo0018)**, com o chat gravando antes, inteiros, os arquivos que são dele ou do kit (CEREBRO,
  Instruções, GUIA, `CONTEXT.md`, `settings.json`, as 3 skills e o modelo de WO — estes três últimos são texto do kit sem
  nada deste projeto) e a WO versionando-os com sha1 e posicionando o resto (LOG-TEMPLATE, `.gitignore`, IDEAS,
  DECISIONS, STATUS, CHANGELOG, log). **As skills ficam gravadas ANTES de a WO ser aplicada** — o pacote manda instalar
  as skills novas antes de qualquer WO; se elas fossem instaladas PELA WO, a WO do merge seria aplicada pela skill velha.
  Isso desvia da regra «a skill muda por WO» (CEREBRO, «Canal do chat») e o desvio vai para o DEC do merge.
- **B — duas WOs** (primeiro só as skills e o modelo de WO; depois o resto). *Descartada:* um ciclo a mais para o dono
  sem ganho — a forma A já resolve a ordem gravando as skills antes.

## Recomendacao

**Forma A.** Respostas recomendadas para os pontos de decisão abaixo: 1 = transplantar o Windows/CMD; 2 = criar o
`SETUP.md` (este projeto tem conteúdo real: `npm install`/`npm run dev`, o push pela porta 443, o `python3` do Git Bash);
3 = trocar o README do scaffold por um README curto do EditX (o atual é o do Vite e descreve outro projeto — informação
errada é pior que pouca); 4 = sem LICENSE até o dono dizer se o repositório é público; 5 = não arquivar agora (nenhuma
entrada é «substituída»; os FIX ficam pela regra nova; o alarme fica registrado). Depois do merge: os 6 carimbos dizem
v1.151.0 e a pasta do pacote vai para `notas-arquivadas/`.

*O melhor argumento contra:* a cerca de quatro crases muda o formato de toda WO daqui para a frente, e as 17 WOs
anteriores usam três — o histórico fica com dois formatos. É o preço de não quebrar a WO cujo texto novo traz um bloco
de código de três crases (as WOs de código deste projeto têm vários); as antigas não se reescrevem (vocabulário novo
não renomeia arquivo antigo).

## Riscos

- **A fusão do CEREBRO perder um transplante.** *Conferência:* depois de gravar, `grep` dos quatro transplantes (os
  dois itens de «Técnicas», «Ambiente (sistema operacional)», a nota dos arquivos ativos) e diff de seções contra o
  pacote — toda seção do pacote presente, só o transplante a mais.
- **Carimbo esquecido** (o último a se perder num merge): os 6 portadores conferidos por `grep` na WO.
- **A WO do merge ser escrita no formato novo e aplicada pela skill nova** — por isso as skills são gravadas antes, e a
  WO usa cerca de quatro crases.
- **Varredura pelo fato com falso negativo:** a fase 1 já errou por padrão fechado; a da fase 2 usa padrão aberto e a
  lista de 26 ocorrências abaixo é contestável uma a uma.

## Ponto de decisao

1. **Sistema operacional:** transplantar «Ambiente (sistema operacional)», a nota do CMD e a linha do Windows nas
   Instruções (*recomendado* — o pacote foi gerado sem SO marcado), ou o SO saiu de propósito?
2. **`SETUP.md`:** criar (*recomendado*), ou não usar?
3. **README:** trocar o do scaffold do Vite por um curto do EditX agora (*recomendado*), ou esperar?
4. **LICENSE:** o repositório `joaolucas-nds/EditX` é público? Se for, qual licença? (Não escolho por você.)
5. **DECISIONS com 832 linhas:** não arquivar agora (*recomendado*), ou arquivar os registros de merges fechados
   (DEC-010 e DEC-012, 99 linhas) em `DECISIONS-archive.md`?

## Varredura «sessão» pelo fato — as 26 ocorrências

**A corrigir (1):** `.gitignore:4` «os logs de sessao» → log do dia.
**Justificadas (25):** `meta/CEREBRO.md:10, :13` (relato da revisão de 2026-11-10 — saem com a fusão) · `:47` (relato:
«já custou uma sessão») · `:175` (contraste: «não é de SESSÃO: é de TURNO») · `:194` (relato: «servidor esquecido entre
sessões») · `meta/LOG-TEMPLATE.md:8` (×2, relato da revisão) · `meta/SPEC.md:11` (domínio: sessão de usuário no exemplo) ·
`meta/workorders/_TEMPLATE.md:105` (sessão do Claude Code, real — mantida no pacote) · `meta/ROADMAP.md:15` (descrição
do sistema de documentos «que sobrevive entre sessões» — não manda nada) · `meta/DECISIONS.md:254, :271, :341, :345,
:353, :373, :384, :387` (histórico) · `:707` (domínio: sessão do navegador, DEC-019) · `meta/CHANGELOG.md:38` (relato) ·
`.claude/skills/apply-wo/SKILL.md:13` e `wrap/SKILL.md:6 (×2), :9, :14` (sessão do Claude Code; o pacote mantém o mesmo
texto — vêm com a adoção das skills).
