# LOG-TEMPLATE.md — Formato do Log do Dia

> **Referência fixa.** Este arquivo é o MOLDE — não é substituído.
> O log entra ao bater um gatilho de evento — cortar versão, registrar decisão ou erro grave, virar o dia —, e não «no fim», que numa conversa longa nunca chega. Quem registra escreve `logs/AAAA-MM-DD.md` neste formato. **Duas conversas no mesmo dia = o MESMO arquivo**, com `## Conversa N` para cada uma (o nome é da data, não da conversa).
> Os logs vivem em `logs/` no Git (NÃO no Projeto) e são lidos só sob demanda — quando você precisar recuperar o detalhe de um dia antigo.

**Mudanças nesta revisão (2026-11-18, wo0018):** KCM v1.151.0 — nova seção «📦 Entregas» (as WOs aplicadas com o
commit, as specs e análises do dia: o que outro turno procura pelo nome). As tabelas e seções extras deste projeto
ficam: o modelo enxuto do kit não as tem. A nota de 2026-11-10 saiu; o histórico daquele merge está em DEC-012.

---

# Log — AAAA-MM-DD

**Projeto:** [nome] · **Versão ao final:** [x.y.z] · **Duração estimada:** [curta/média/longa]

## Objetivo do dia
[O que se pretendia fazer ao começar.]

## ✅ Feito
- [Mudanças concretas: arquivos tocados, funções criadas, bugs resolvidos.]

## 📦 Entregas
- [WOs aplicadas (com o commit), specs e análises escritas no dia — o que outro turno vai procurar pelo nome.]

## 🐛 Problemas encontrados
| Problema | Causa identificada | Solução aplicada |
|---|---|---|
| [sintoma observado] | [causa raiz, não o sintoma] | [o que foi feito] |

*(Se nenhum: "Nenhum problema encontrado neste dia.") Bug grave → vira FIX-N em DECISIONS.md.*

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
[Estado exato ao encerrar + próximo passo óbvio. Isto alimenta a «Última conversa» do STATUS.]

## ➡️ Próximos passos
- [Ações para o próximo turno.]

## ⚠️ Atenção para a próxima conversa
- [Riscos, dependências externas, coisas para não esquecer — que não viraram armadilha permanente em CONTEXT mas importam agora.]
