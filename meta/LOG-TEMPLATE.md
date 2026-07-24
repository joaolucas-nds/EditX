# LOG-TEMPLATE.md — Formato do Log de Sessão

> **Referência fixa.** Este arquivo é o MOLDE — não é substituído.
> Ao final de cada sessão, o assistente entrega um arquivo novo `logs/AAAA-MM-DD.md` preenchido neste formato.
> Os logs vivem em `logs/` no Git (NÃO no Projeto) e são lidos só sob demanda — quando você precisar recuperar o detalhe de uma sessão antiga.

**Mudanças nesta revisão (2026-07-11):** merge entre o formato vivo (mais rico, com
tabelas e cabeçalho de metadados) e o do template-update (mais enxuto, com pontes
explícitas para onde cada seção alimenta). Nada do formato antigo foi descartado — só
reorganizado e com 2 seções novas: "Objetivo da sessão" (no topo) e a distinção clara
entre "Onde parei" (alimenta STATUS) e "Aprendizados / armadilhas" (alimenta CONTEXT),
que antes estavam misturados em "Atenção para próxima sessão".

---

# Log — AAAA-MM-DD

**Projeto:** [nome] · **Versão ao final:** [x.y.z] · **Duração estimada:** [curta/média/longa]

## Objetivo da sessão
[O que se pretendia fazer ao começar.]

## ✅ Feito
- [Mudanças concretas: arquivos tocados, funções criadas, bugs resolvidos.]

## 🐛 Problemas encontrados
| Problema | Causa identificada | Solução aplicada |
|---|---|---|
| [sintoma observado] | [causa raiz, não o sintoma] | [o que foi feito] |

*(Se nenhum: "Nenhum problema encontrado nesta sessão.")*

## ⚖️ Decisões tomadas
- [Decisão → qual DEC-N em DECISIONS.md, se houver.]

## 💡 Ideias capturadas
**Do usuário:**
- [ideia mencionada, mesmo solta]

**Sugestões geradas:**
- [sugestão do assistente]

## 📁 Arquivos modificados
| Arquivo | Tipo de mudança |
|---|---|
| [caminho] | criado / editado / removido |

## 🎓 Aprendizados / armadilhas
> O que descobrimos que vale virar armadilha em CONTEXT.md.
- [aprendizado]

## 📊 Onde parei (estado ao final)
[Estado exato ao encerrar + próximo passo óbvio. Isto alimenta a «Última Sessão» do STATUS.]

## ➡️ Próximos passos
- [Ações para a próxima sessão.]

## ⚠️ Atenção para próxima sessão
- [Riscos, dependências externas, coisas para não esquecer — que não viraram armadilha permanente em CONTEXT mas importam agora.]
