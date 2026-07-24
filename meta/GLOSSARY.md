# GLOSSARY.md — Termos do Projeto

> Use quando o projeto tem vocabulário próprio que o assistente reexplicaria a cada sessão sem isto.

**Mudanças nesta revisão (2026-07-11):** arquivo estava vazio (placeholder nunca
preenchido). Populado com os termos que o projeto já usa em CONTEXT.md, DECISIONS.md e no
schema `.editx`, para não precisar reexplicar a cada sessão nova.

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
- **`basedOn`** — campo de herança entre `textStyles`. Um estilo com `basedOn` herda todas
  as propriedades do estilo referenciado e só sobrescreve o que for diferente — como
  estilos baseados no Word.
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
- **`StyleRegistry.ts`** — registro de estilos de texto globais com observer pattern:
  alterar um estilo propaga automaticamente para todos os frames vinculados via `basedOn`.
- **`BatchGenerator.ts`** — motor de geração em massa (CSV → N arquivos), roda
  exclusivamente em Web Worker para não travar a UI. Ver DEC-007.
- **`TemplateSchema.ts`** — fonte única de tipos TypeScript do `.editx`. Todos os outros
  módulos importam daqui; nenhum define tipos de frame próprios. Ver DEC-009.
- **`ImageResolver.ts`** — resolve o nome de arquivo de uma célula do CSV para o objeto de
  imagem correspondente na pasta importada, com `fallback` quando não encontra.

---

## Comandos / artefatos

- **ASU (Atualizador Automático de Scripts)** — ferramenta usada neste projeto para
  aplicar patches a arquivos de código existentes via instrução YAML, em vez de reenviar
  o arquivo inteiro. Referência: `INSTRUCTION_GUIDE.md` e `PROMPT_IA.md`.
- **`demo.yaml`** — instrução ASU de demonstração, executável de ponta a ponta contra
  `examples/demo_project/`, cobrindo os quatro tipos de arquivo suportados (Python,
  Markdown, JSON, texto genérico) + criação de arquivo novo.

---

## Identificadores

- **DEC-N** — entrada de decisão de arquitetura/design em DECISIONS.md (ADR simplificado).
- **FIX-N** — entrada de bug grave resolvido em DECISIONS.md (sintoma/causa raiz/solução/lição).
- **ADR** — Architecture Decision Record — formato usado nas entradas DEC.
- **KCM** — Kit de Contexto (Universal) — o sistema de templates de documentação que
  estrutura este projeto (CONTEXT/STATUS/DECISIONS/CHANGELOG/IDEAS/ROADMAP/GLOSSARY/HISTORY).
