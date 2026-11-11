# GLOSSARY.md — Termos do Projeto

> Use quando o projeto tem vocabulário próprio que o assistente reexplicaria a cada conversa sem isto.

**Mudanças nesta revisão (2026-11-10):** em «Comandos / artefatos», saíram ASU e `demo.yaml`
(ASU removido em DEC-012; `demo.yaml` e `examples/demo_project/` nunca existiram neste repo) e
entraram WO, as skills do Claude Code e spec de feature. Nota anterior (2026-07-11): arquivo
populado a partir do que já se usava em CONTEXT, DECISIONS e no schema.

---

## Conceitos do projeto

- **`.editx`** — extensão proprietária do arquivo de template do EditX. JSON estruturado
  com documento, páginas, frames, estilos e mapeamento CSV. Ver DEC-001.
- **Frame populável** — frame de texto ou imagem cujo conteúdo vem de uma coluna do CSV
  (`role: "data"`, com `csvColumn`). Repete um valor diferente por linha do CSV.
- **Frame estático** — frame de texto ou imagem definido diretamente no canvas
  (`role: "static"`, com `content` fixo). Não muda entre itens do lote.
- **Overflow (modo)** — comportamento de um frame de texto ao atingir suas próprias
  bordas: `grow-vertical`, `grow-horizontal`, `fixed-shrink` ou `fixed-clip`. Ver
  CONTEXT.md, seção "Como o Motor de Overflow Funciona".
- **`isDataPage`** — flag booleana numa página do template. Se `true`, a página se repete
  uma vez por linha do CSV (ex.: página de produto num catálogo). Se ausente/`false`, a
  página é estática (ex.: capa).
- **`basedOn`** — campo de herança entre `textStyles`, e discriminante do tipo `TextStyle`
  (DEC-014): `null` = estilo **raiz**, completo; nome de outro estilo = estilo **derivado**, que
  guarda SÓ as propriedades que diferem do pai — o resto vem em cadeia até a raiz, como o
  «Baseado em» do Word. Estilo derivado nunca se lê direto: resolve-se pelo `StyleRegistry.ts`.
- **`TextStyleProps`** — as 10 propriedades visuais de um estilo (fonte, peso, tamanho, cor…);
  todas obrigatórias na raiz, todas opcionais no derivado.
- **`outputNaming`** — padrão de nomenclatura dos arquivos gerados em lote, com variáveis
  do CSV entre chaves. Ex.: `"{nome}-{preco}"` → `"coca-cola-5,99.pdf"`.
- **`skipRowsWhere`** — filtro de linhas do CSV aplicado antes da geração em massa (ex.:
  gerar só onde `ativo = "sim"`).
- **`csvMapping`** — bloco do `.editx` que define como as colunas do CSV se conectam aos
  frames: delimitador, encoding, colunas tipadas, formatadores, filtro e nomenclatura.
- **Empacotar (modo)** — opção de exportação do `.editx` que embute todas as imagens em
  base64 no próprio arquivo, tornando-o autossuficiente (sem precisar da pasta de
  imagens) às custas de tamanho. Ver DEC-002.

---

## Arquiteturas / módulos

- **`FrameText.ts`** — motor de overflow de texto 100% customizado (nenhuma lib de canvas
  cobre os 4 modos necessários). Ver DEC-006.
- **`StyleRegistry.ts`** — funções PURAS sobre o mapa `textStyles` do documento (DEC-015):
  `resolveStyle` dá o estilo final de um nome subindo a cadeia de `basedOn`; `setStyle`/`removeStyle`
  devolvem um mapa novo sem quebrar a herança. Não guarda estado: o mapa vive no `documentStore`
  (Zustand + Immer), e «alterar o pai muda os filhos» acontece porque o estilo final é sempre
  resolvido do mapa atual.
- **`BatchGenerator.ts`** — motor de geração em massa (CSV → N arquivos), roda
  exclusivamente em Web Worker para não travar a UI. Ver DEC-007.
- **`TemplateSchema.ts`** — fonte única de tipos TypeScript do `.editx`. Todos os outros
  módulos importam daqui; nenhum define tipos de frame próprios. Ver DEC-009.
- **`ImageResolver.ts`** — resolve o nome de arquivo de uma célula do CSV para o objeto de
  imagem correspondente na pasta importada, com `fallback` quando não encontra.

---

## Comandos / artefatos

- **WO (ordem de trabalho)** — instrução de aplicação chat → Claude Code em `meta/workorders/`,
  nome `AAMMDD-woNNNN-desc.md`, com âncora exata e texto exato de cada edição. Modelo em
  `meta/workorders/_TEMPLATE.md`. Substitui o papel que o ASU tinha (DEC-012).
- **`/apply-wo`, `/wrap`, `/sondar`** — skills do Claude Code em `.claude/skills/`: aplicar uma WO,
  fechar a tarefa (STATUS/DECISIONS/log + commit), exploração sem hipótese prévia.
- **Spec de feature** — `specs/AAMMDD-<nome>.md` a partir de `meta/SPEC.md`: o QUÊ construir; a WO é o COMO aplicar.
- *ASU (Atualizador Automático de Scripts) — usado até 2026-11 para patch via YAML; removido em DEC-012.*

---

## Identificadores

- **DEC-N** — entrada de decisão de arquitetura/design em DECISIONS.md (ADR simplificado).
- **FIX-N** — entrada de bug grave resolvido em DECISIONS.md (sintoma/causa raiz/solução/lição).
- **ADR** — Architecture Decision Record — formato usado nas entradas DEC.
- **KCM** — Kit de Contexto (Universal) — o sistema de templates de documentação que
  estrutura este projeto (CONTEXT/STATUS/DECISIONS/CHANGELOG/IDEAS/ROADMAP/GLOSSARY/HISTORY).
