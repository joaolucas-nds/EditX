# ANALISE — Herança de estilos de texto (`basedOn`) antes do `StyleRegistry.ts`

> **Status:** Implementada — Opção A aprovada pelo dono em 2026-11-11 (DEC-014); aplicada na wo0002
> (`4aa9923`: schema, validador, exemplo, testes) e na wo0003 (`d2ef009`: `StyleRegistry.ts`, DEC-015).
> **Data:** 2026-11-11 (data de criacao; nao muda depois)
> **Origem:** revisão do código da wo0001 pelo chat, ao preparar a WO do `StyleRegistry.ts`.

## Problema

O schema promete herança de estilos à moda do Word/Affinity — o JSDoc de `TextStyle.basedOn` em
`src/types/frame.types.ts` diz que o estilo «herda todas as propriedades — sobrescrevendo apenas os
campos explicitamente definidos aqui» —, mas o **tipo exige todos os campos** de todo estilo, e desde a
wo0001 o `TemplateValidator.ts` rejeita com `missing-field` o que faltar. Um estilo filho, portanto,
**não consegue omitir nada**: a herança existe no nome e não tem efeito.

Para quem dói: para o usuário final, que é o motivo de o sistema de estilos existir — mudar a fonte
do estilo-pai e ver todos os filhos mudarem (ver o brief original em IDEAS/CONTEXT). Com o formato
atual, o filho guarda cópia de todos os valores do pai; mudar o pai não muda nada no filho.

Se nada for feito: o `StyleRegistry.ts` (próximo item do backlog) teria de ser escrito em cima dessa
contradição — ou inventando uma regra implícita de propagação, ou ignorando `basedOn`.

## Restricoes / o que foi medido

- **Nenhum arquivo `.editx` existe:** `find . -name '*.editx' -not -path '*/node_modules/*' | wc -l` na
  pasta `Editorial` = **0**. A v0.1.0 **nunca foi lançada** (CHANGELOG: só `[Unreleased]`). Mudar o
  formato agora não quebra arquivo de ninguém.
- **A intenção original está escrita no próprio exemplo:** o comentário de `textStyles` em
  `src/template/__examples__/catalogo-simples.example.ts` diz que `preco-destaque` «sobrescreve só
  `fontSize`/`color`/`fontWeight` — o restante (fontFamily, align, etc.) vem do pai». Medido por script
  sobre o arquivo: `preco-destaque` difere de `titulo-produto` em **exatamente 3 campos**
  (`fontWeight`, `fontSize`, `color`) e repete os outros **7** iguais.
- **Quem lê `TextStyle` hoje:** só tipos, o exemplo, o validador e os testes (`grep -rln textStyles src`
  = 6 arquivos: `frame.types.ts`, `TemplateSchema.ts`, o exemplo, `TemplateValidator.ts`,
  `FrameValidator.ts`, `TemplateSerializer.test.ts`). Nenhum consumidor de runtime (canvas, render) existe.
- **DEC-009** (`TemplateSchema.ts`/`frame.types.ts` são a fonte dos tipos) e **DEC-013** (validador à mão,
  estrito, versão explícita `0.1.0`) continuam valendo em todas as opções abaixo.

## Opcoes consideradas

**A — Estilo derivado guarda só as diferenças (recomendada).** O tipo vira uma união discriminada pelo
próprio `basedOn`:

```ts
/** Propriedades visuais de um estilo; num estilo raiz, todas obrigatórias. */
export interface TextStyleProps { fontFamily: string; fontWeight: number; /* …os 10 campos de hoje… */ }

export type TextStyle =
  | ({ basedOn: null } & TextStyleProps)              // raiz: completo
  | ({ basedOn: string } & Partial<TextStyleProps>);  // derivado: só o que muda
```

O `StyleRegistry.ts` resolve o estilo final subindo a cadeia até a raiz e aplicando as diferenças de
cima para baixo. É o modelo do Word («Baseado em»), e o que o JSDoc e o exemplo já descrevem.
Custo: mudar `frame.types.ts`, a regra de `textStyles` no validador (raiz exige tudo; derivado aceita
parcial, continua estrito contra chave desconhecida), enxugar `preco-destaque` no exemplo para os 3
campos, e acrescentar testes (raiz incompleta → `missing-field`; derivado parcial → ok). Formato
`0.1.0` alterado **no lugar**, sem subir versão — justificável só porque nenhum arquivo existe ainda.
Ganho extra: o TypeScript passa a **impedir** que alguém leia `fontSize` de um estilo derivado sem
resolver a herança (o campo é `number | undefined`) — o erro mais provável do canvas fica barrado pelo compilador.

**B — Manter tudo obrigatório; `basedOn` vira só «parentesco».** Mudar o pai propagaria para os campos do
filho que tinham o MESMO valor do pai antes da mudança. Descartada: regra implícita (o arquivo não diz o
que é herdado e o que é escolha do usuário — `fontFamily: 'Montserrat'` no filho pode ser cópia ou
decisão, e as duas leituras são indistinguíveis); propaga errado no primeiro caso em que o usuário
escolheu, de propósito, o mesmo valor do pai.

**C — Tudo obrigatório + lista explícita `overrides: string[]`.** O arquivo guarda os valores completos e
diz quais são próprios. Descartada: duas fontes da mesma verdade no mesmo objeto (valor de campo herdado
gravado no filho pode divergir do pai e ninguém sabe qual vale); arquivo maior; o validador precisa
cruzar a lista com os campos.

**D — Abolir `basedOn` (sem herança).** Descartada: contradiz requisito do produto (estilos que se
atualizam em cascata, como no Affinity/Word — brief de 2026-05-22) e o `StyleRegistry.ts` previsto em
CONTEXT, DEC-006 e GLOSSARY.

## Recomendacao

**Opção A**, aplicada **antes** do `StyleRegistry.ts`, numa WO própria (schema + validador + exemplo +
testes) e o `StyleRegistry.ts` na WO seguinte — duas WOs pequenas e verificáveis em vez de uma grande.
Porquê: é a única opção em que o arquivo diz sem ambiguidade o que é herdado; é o que o JSDoc, o exemplo
e o glossário já prometem; e a janela para mudar o formato sem migração é agora (0 arquivos, v0.1.0 não
lançada) — depois do primeiro `.editx` de usuário ela custa um módulo de migração.

O melhor argumento contra: A mexe num arquivo crítico (`frame.types.ts`) e no validador recém-entregue,
e «formato alterado no lugar, mesma versão» é exatamente o hábito que quebra arquivo de usuário depois
do lançamento. Resposta: a exceção vale só enquanto o comando de auditoria abaixo der 0; registrar isso
na DEC é o que impede a exceção de virar costume.

**Comando que audita a premissa da exceção** (rodar antes de aplicar a WO; tem de dar 0):

```
find .. -name "*.editx" -not -path "*/node_modules/*" | wc -l
```

## Riscos

- **Consumidor lendo estilo sem resolver:** o tipo `Partial` barra no compilador; o risco que sobra é
  `as TextStyleProps` forçado — sinal cedo: qualquer `as TextStyleProps` fora do `StyleRegistry.ts`
  (`grep -rn "as TextStyleProps" src`).
- **Cadeia que nunca chega a uma raiz:** impossível se não há ciclo (R12) e toda referência existe
  (R11) — as duas regras já estão no validador e testadas.
- **Mesma versão, formato diferente:** se algum `.editx` tiver sido gerado fora do repositório entre hoje e a
  aplicação, ele quebra. O comando de auditoria acima é o sinal.

## Ponto de decisao

Aprova a **Opção A** (estilo derivado guarda só as diferenças; formato `0.1.0` alterado no lugar, sem
subir versão), implementada em duas WOs — primeiro schema/validador/exemplo/testes, depois o
`StyleRegistry.ts`?
