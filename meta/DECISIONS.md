# DECISIONS.md — Registro de Decisões Técnicas (ADRs)

> ADR — Architecture Decision Records (simplificado)
> Registra TODAS as decisões importantes com contexto e motivo.
> Evita reabrir discussões já resolvidas e dá contexto ao Claude em novas conversas.
> Duas naturezas: **DEC** (arquitetura/design) e **FIX** (bugs graves resolvidos, para não repetir).
> Arquiva por EVENTO, não por tamanho: decisão substituída ou evento fechado vai para `DECISIONS-archive.md`, e **FIX fica enquanto a lição valer** — a lição é o conteúdo dele; ~700 linhas é só alarme. Toda entrada traz `**Status:**` com valor fechado.

**Mudanças nesta revisão (2026-11-18, wo0018):** adicionada a DEC-022 (merge do KCM v1.151.0). O conjunto fechado
de `Status` ganha «aceita — emendada por DEC-X», e o critério de arquivamento diz que FIX fica enquanto a lição
valer. Com 832 linhas o arquivo passou do alarme (~700); o dono decidiu não arquivar agora (DEC-022). A nota de
2026-11-10 saiu; o que ela registrava está na DEC-012.

---

## DEC-001 — Formato de arquivo proprietário `.editx`

**Data:** 2026-05-24
**Status:** aceita
**Autor:** ambos

### Contexto
O editor precisa salvar e carregar templates completos: dimensões do documento, todas as páginas, todos os frames (texto, imagem, forma), estilos de texto globais, paleta de cores e mapeamentos CSV. Esse arquivo é a unidade de trabalho principal do usuário.

### Decisão
Usar JSON com extensão proprietária `.editx`. O JSON é legível, versionável com Git, e não requer parser binário. A extensão proprietária diferencia claramente os arquivos do projeto de JSONs genéricos e permite associação de arquivo no desktop no futuro.

### Alternativas consideradas
- **Formato binário (ex: MessagePack)** — menor, mais rápido de parsear, mas não é versionável com diff legível e dificulta debug
- **SQLite** — ótimo para dados relacionais, mas excessivo para um documento de template; sem suporte nativo no browser
- **JSON puro sem extensão proprietária** — funcional mas sem identidade; não permite associação com o app desktop

### Consequências
- **Positivas:** versionável com Git, editável manualmente para debug, fácil de compartilhar, sem dependência de formato externo
- **Negativas:** para arquivos com muitos frames e imagens em base64 (modo "empacotar"), o arquivo pode ficar grande
- **Riscos:** mudanças no schema que quebrem arquivos existentes exigem migração — mitigado com campo `"version"` no JSON e módulo de migração futuro

---

## DEC-002 — Imagens referenciadas por caminho, não embutidas

**Data:** 2026-05-24
**Status:** aceita
**Autor:** ambos

### Contexto
Templates de catálogo podem ter dezenas de frames de imagem. Embutir todas em base64 no `.editx` tornaria o arquivo imenso (uma imagem JPEG de 1MB vira ~1.3MB em base64) e não versionável.

### Decisão
Por padrão, frames de imagem armazenam o caminho relativo ao arquivo `.editx` (ex: `"./imagens/coca-cola.jpg"`). O template é portátil desde que a pasta de imagens acompanhe o arquivo. Uma opção "Empacotar tudo" gera um `.editx` autossuficiente com imagens em base64 — útil para compartilhar o template sem a pasta de imagens.

### Alternativas consideradas
- **Sempre base64** — simples para compartilhamento, mas inutilizável para Git e lento para abrir
- **Sempre caminho absoluto** — o template não funciona em outra máquina sem ajuste manual

### Consequências
- **Positivas:** arquivos `.editx` leves, versionáveis, portáteis quando acompanhados da pasta de imagens
- **Negativas:** o usuário precisa manter a pasta de imagens junto com o `.editx`
- **Riscos:** caminhos relativos podem quebrar se o usuário mover o arquivo sem mover a pasta — mitigado com aviso na UI e validação ao abrir

---

## DEC-003 — Fabric.js como motor de canvas (sobre Konva.js)

**Data:** 2026-05-24
**Status:** aceita
**Autor:** ambos

### Contexto
O editor precisa de um motor de canvas 2D que suporte: objetos interativos (mover, redimensionar, rotacionar), z-order, seleção múltipla, serialização/deserialização de objetos, e extensibilidade para frames customizados.

### Decisão
Usar Fabric.js 6.x.

### Alternativas consideradas
- **Konva.js** — performance superior com React (Konva tem binding React oficial), mas API de serialização menos madura e menos recursos built-in para manipulação de objetos de texto
- **Canvas API pura** — controle total, zero overhead, mas implementar seleção, transformação e hit-testing do zero levaria meses
- **PixiJS** — otimizado para jogos (WebGL), não para edição de documentos; sem conceito de objetos editáveis

### Consequências
- **Positivas:** serialização built-in, tipos de objeto prontos (IText, Image, Rect, etc.), comunidade grande, boa documentação
- **Negativas:** Fabric.js v6 quebrou compatibilidade com a v5 em serialização — tutoriais antigos podem enganar
- **Riscos:** a API de texto do Fabric.js não suporta os modos de overflow necessários — o FrameText.ts precisará estender a classe IText com lógica customizada

**⚠️ Armadilha conhecida:** Fabric.js v6 mudou a estrutura do `toJSON()`. Tutoriais que mostram a estrutura de v5 estão desatualizados. Sempre consultar a documentação da v6.

---

## DEC-004 — Zustand + Immer para estado global

**Data:** 2026-05-24
**Status:** aceita
**Autor:** Claude

### Contexto
O editor tem estado complexo e interconectado: documento ativo com múltiplas páginas e frames, seleção atual, histórico de undo/redo, dados CSV importados. Esse estado precisa ser acessível por vários componentes sem prop-drilling.

### Decisão
Usar Zustand para gerenciamento de estado + Immer para mutações imutáveis e patches de undo/redo.

### Alternativas consideradas
- **Redux Toolkit** — poderoso, mas boilerplate excessivo para um app de editor; o overhead de ações e reducers atrasa o desenvolvimento
- **Context API do React** — simples, mas re-render excessivo em contextos grandes afeta performance do canvas
- **MobX** — reativo e elegante, mas a magia do MobX dificulta debug e é menos familiar para a maioria dos devs React

### Consequências
- **Positivas:** API simples, zero boilerplate, compatível nativamente com Immer para undo/redo com `produceWithPatches`
- **Negativas:** sem devtools tão sofisticadas quanto Redux para inspecionar estado complexo
- **Riscos:** stores grandes sem divisão correta podem causar re-renders desnecessários — mitigado com stores separadas por domínio (`documentStore`, `selectionStore`, etc.)

---

## DEC-005 — Tauri em vez de Electron para versão desktop

**Data:** 2026-05-24
**Status:** aceita
**Autor:** Claude

### Contexto
O app precisa de uma versão desktop para acesso direto ao sistema de arquivos (pasta de imagens sem upload manual). Duas opções principais: Electron e Tauri.

### Decisão
Tauri 2.x, implementado na Fase 2 (não antes).

### Alternativas consideradas
- **Electron** — mais maduro, mais fácil de encontrar recursos, mas bundle de ~150MB por app (inclui Chromium + Node.js); RAM elevada; histórico de vulnerabilidades de segurança
- **PWA com File System Access API** — sem instalação, mas API ainda não tem suporte universal e não funciona no Safari iOS

### Consequências
- **Positivas:** bundle de ~10MB, usa WebView nativo do SO (sem Chromium embutido), backend Rust mais seguro, API de sistema de arquivos rica
- **Negativas:** Rust no backend requer aprendizado adicional; menor comunidade que Electron; algumas APIs Electron não têm equivalente direto em Tauri
- **Riscos:** a API Tauri 2.x mudou significativamente da 1.x — não misturar documentação das versões

---

## DEC-006 — Motor de overflow de texto 100% customizado

**Data:** 2026-05-24
**Status:** aceita
**Autor:** ambos

### Contexto
O editor precisa de frames de texto com comportamentos avançados de overflow, similares ao Figma: crescer verticalmente, crescer horizontalmente, diminuir fonte para caber, ou cortar. Nenhuma biblioteca de canvas (Fabric.js, Konva.js, ou qualquer outra) implementa esses modos nativamente.

### Decisão
Implementar um motor customizado em `FrameText.ts` usando a Canvas 2D API para medir métricas de texto (`measureText`, `opentype.js` para métricas precisas de fonte) e calcular as dimensões finais do frame antes de renderizar.

### Alternativas consideradas
- **Adaptar IText do Fabric.js** — a classe tem overflow básico mas não os modos específicos; seria necessário sobrescrever tantos métodos que vale mais a pena uma implementação própria
- **Renderizar texto em HTML/CSS e sobrepor ao canvas** — HTML tem overflow nativo, mas sincronizar a posição com o canvas é frágil e inviável para exportação

### Consequências
- **Positivas:** controle total sobre o comportamento; pode implementar exatamente o que o produto precisa
- **Negativas:** é o módulo mais custoso de implementar e testar; edge cases de tipografia são numerosos (texto vazio, uma única palavra longa, RTL, ligaduras)
- **Riscos:** performance em geração de lote com 500+ itens — cada item precisa rodar o motor de layout. Mitigado com Web Worker e cache de métricas de fonte

**⚠️ Armadilha conhecida:** `ctx.measureText()` da Canvas 2D API não retorna altura real da linha (só `width`). Para altura precisa, usar `opentype.js` para calcular ascender + descender da fonte. Não depender de `measureText().actualBoundingBoxAscent`.

---

## DEC-007 — BatchGenerator.ts roda em Web Worker

**Data:** 2026-05-24
**Status:** aceita
**Autor:** Claude

### Contexto
A geração em massa de N arquivos (renderizar template + popular com dados + exportar PNG/PDF) é CPU-intensiva. Com 200+ linhas no CSV, rodar no thread principal da UI trava o browser por vários segundos, tornando o app inutilizável durante a geração.

### Decisão
`BatchGenerator.ts` roda exclusivamente em Web Worker. A UI recebe atualizações de progresso via `postMessage` e pode cancelar a geração a qualquer momento.

### Alternativas consideradas
- **Thread principal com `requestAnimationFrame` yield** — divide a carga em frames de 16ms; funciona para lotes pequenos mas ainda degrada a UI em lotes grandes
- **setTimeout yield** — similar ao anterior, mais simples de implementar mas menos previsível

### Consequências
- **Positivas:** UI permanece responsiva durante toda a geração; progresso em tempo real; cancelamento limpo
- **Negativas:** Web Workers não têm acesso ao DOM — a renderização precisa usar OffscreenCanvas (suportado nos browsers modernos)
- **Riscos:** `OffscreenCanvas` ainda tem suporte limitado em Safari (verificar compatibilidade ao implementar); fallback para thread principal pode ser necessário em Safari antigo

---

## DEC-008 — pdf-lib em vez de jsPDF

**Data:** 2026-05-24
**Status:** aceita
**Autor:** Claude

### Contexto
O editor precisa gerar PDFs multipáginas com índice, links internos, sangria para impressão, e possível suporte a PDF/X para gráficas.

### Decisão
Usar `pdf-lib` como biblioteca de geração de PDF.

### Alternativas consideradas
- **jsPDF** — mais antigo, mais exemplos na internet, mas API de baixo nível e suporte a tipografia avançada limitado; sem manipulação de PDFs existentes
- **Puppeteer** — gera PDF via headless Chrome, qualidade excelente, mas requer Node.js (não roda no browser) e é pesado demais para um app client-side
- **Pdfmake** — declarativo e simples para layouts de texto, mas não tem suporte a elementos canvas/imagem com a fidelidade necessária

### Consequências
- **Positivas:** API TypeScript moderna; suporte a embedar imagens, fontes e links; pode ler e modificar PDFs existentes; roda no browser sem servidor
- **Negativas:** curva de aprendizado maior que jsPDF; documentação menos extensa; layouts complexos exigem cálculo manual de coordenadas
- **Riscos:** PDF/X para impressão profissional pode exigir configurações específicas de colorimetria (ICC profiles) que pdf-lib não suporta nativamente — a ser investigado na Fase 4

---

## DEC-009 — `TemplateSchema.ts` é a fonte da verdade — implementar primeiro

**Data:** 2026-05-24
**Status:** aceita
**Autor:** ambos

### Contexto
Com múltiplos módulos interdependentes (canvas, serialização, geração em massa, UI de propriedades), há risco de cada módulo definir suas próprias interfaces e criar inconsistências entre eles.

### Decisão
`TemplateSchema.ts` (re-exportado como `template.types.ts`) é a única fonte de tipos para o formato `.editx`. Todos os outros módulos importam desse arquivo. O canvas não pode definir seus próprios tipos de frame — deve usar e estender os tipos do schema.

### Alternativas consideradas
- **Cada módulo define seus próprios tipos** — rápido de começar, mas cria divergências que exigem conversões e adaptadores entre módulos
- **Gerar tipos automaticamente a partir de um JSON Schema** — mais robusto para validação, mas adiciona complexidade de tooling desde o início

### Consequências
- **Positivas:** consistência garantida entre todos os módulos; mudança de tipo em um lugar propaga por todo o projeto via TypeScript
- **Negativas:** exige disciplina para sempre importar do arquivo correto; risco de tipos muito acoplados ao formato de armazenamento
- **Riscos:** mudanças no schema após o `v0.1.0` (quando usuários tiverem arquivos `.editx`) exigem módulo de migração — planejar o campo `"version"` com cuidado

---

## DEC-010 — Integração do template-update do KCM (v2) e reestruturação da documentação

**Data:** 2026-07-11
**Status:** aceita
**Autor:** ambos

### Contexto
Um template-update do Kit de Contexto (KCM) foi recebido para o projeto, trazendo versões
mais recentes dos 13 arquivos estruturais (CONTEXT, STATUS, DECISIONS, CHANGELOG, IDEAS,
LOG-TEMPLATE, ROADMAP, GLOSSARY, HISTORY, CEREBRO, INSTRUCOES, .gitignore, .flatdropignore).
A comparação com os arquivos vivos revelou tanto novidades comportamentais (protocolo de
ASU mais detalhado, ritual de leitura de mount, recomendação de configuração) quanto
inconsistências estruturais já existentes no projeto antes mesmo do update (backlog de
fases hospedado em STATUS.md em vez de ROADMAP.md; IDEAS.md sem separação física entre
ideias ativas e concluídas; ausência de template FIX-N em DECISIONS.md).

### Decisão
Aplicar o merge completo: (1) mover o backlog de fases 2–5 de STATUS.md para ROADMAP.md;
(2) reestruturar IDEAS.md em Ativas/Concluídas/Descartadas; (3) adicionar template FIX-N
e este DEC-010 a DECISIONS.md; (4) popular GLOSSARY.md com os termos já em uso no projeto;
(5) renomear HISTORICO.md para HISTORY.md, padronizando com os demais arquivos (nomes em
inglês); (6) mesclar em CEREBRO.md as três seções novas do template (ritual de mount,
recomendação de configuração, ASU detalhado); (7) consolidar INSTRUCOES-DO-PROJETO.md com
o ritual de início de sessão mais completo; (8) adotar `.gitignore` e `.flatdropignore` do
pacote, sem equivalente vivo para comparar.

### Alternativas consideradas
- **Manter tudo como estava, ignorar o update** — mais simples, mas perpetua as
  inconsistências já identificadas (backlog no lugar errado, IDEAS sem higiene de seções)
  e deixa de fora protocolo comportamental que o próprio Claude já deveria seguir
- **Aplicar só os arquivos `template` puros, sem tocar CEREBRO/INSTRUCOES (`fusao`)** —
  mais conservador, mas deixaria o comportamento do assistente desatualizado em relação
  à documentação que o descreve, um risco de deriva entre "o que o CEREBRO diz" e "o que
  o Claude realmente faz"

### Consequências
- **Positivas:** documentação agora segue as próprias regras de higiene que ela mesma
  define (uma fonte de verdade por dado, STATUS só o agora, IDEAS nunca perde mas migra
  de seção); comportamento do assistente (CEREBRO/INSTRUCOES) alinhado ao protocolo mais
  recente do kit
- **Negativas:** nenhum arquivo de código foi tocado nesta sessão — é puramente
  organizacional; o histórico de nomes (HISTORICO → HISTORY) exige que o usuário delete
  manualmente o arquivo antigo, já que o assistente não tem acesso de escrita ao disco do
  usuário
- **Riscos:** nenhum identificado — mudança é aditiva e reversível (nada foi sobrescrito
  sem registro do que mudou e por quê, conforme regra de higiene do CEREBRO.md)

---

## DEC-011 — Aceitar versões reais do npm (React 19/Vite 8/TS 6) em vez das documentadas; ESLint 9 mantido (não 10) por incompatibilidade de plugin; duas vulnerabilidades de `npm audit` aceitas como inertes

**Data:** 2026-07-24
**Status:** aceita
**Autor:** ambos

### Contexto
Ao rodar o boilerplate pela primeira vez (`npm create vite@latest -- --template react-ts`),
o npm serviu versões bem mais novas do que as documentadas em CONTEXT.md desde 2026-05-24:
React 19.2.7 (documentado: ^18.3.0), Vite 8.1.5 (documentado: ^5.2.0), TypeScript 6.0.2
(documentado: ^5.4.0). O scaffold atual do `create-vite` também vem com `oxlint` por
padrão, não ESLint+Prettier como as "Ferramentas" do CONTEXT.md especificam.

Duas cadeias de vulnerabilidade apareceram no `npm audit`:
1. **`fabric` → `canvas`/`jsdom` (optionalDependencies) → `@mapbox/node-pre-gyp` → `tar`**
   — crítica. `canvas`/`jsdom` só existem para renderização server-side em Node; nosso
   app é 100% client-side (Vite/browser) e nunca importa esse caminho (confirmado:
   `canvas` não chega a instalar de fato neste ambiente, por exigir compilação nativa).
   Corrigir exigiria `fabric@7.4.0` — breaking change não avaliado.
2. **`eslint@9.x` → `@eslint/eslintrc`/`@eslint/config-array` → `minimatch` → `brace-expansion`**
   — alta (DoS por expansão de string). Testamos a correção óbvia (`eslint@^10.0.0`), que
   resolve essa cadeia sem tocar no fabric. Porém `eslint-plugin-react-hooks@5.2.0` (nossa
   dependência) trava seu peer dependency em `eslint <= ^9.0.0` — a v10 quebra a instalação
   do projeto (`ERESOLVE`). Não é uma escolha de manter compatibilidade "por via das
   dúvidas": tentamos de verdade, o conflito é real e documentado no log do npm.

### Decisão
1. **Manter as versões que o npm serviu hoje** (React 19, Vite 8, TS 6) em vez de fixar
   às versões antigas documentadas — CEREBRO.md princípio 11 ("usa a versão mais recente;
   não regride"). CONTEXT.md atualizado para refletir a realidade instalada.
2. **Trocar `oxlint` por ESLint 9 (flat config) + Prettier**, conforme já documentado em
   CONTEXT.md § Ferramentas.
3. **Manter ESLint em `^9.0.0`, não `^10.0.0`** — testamos a v10, ela resolve a
   vulnerabilidade do minimatch mas quebra a instalação por incompatibilidade real com
   `eslint-plugin-react-hooks@5.2.0`. Revisitar quando esse plugin liberar suporte à v10.
4. **Não fazer downgrade nem forçar `fabric@7.4.0`** para eliminar o alerta crítico do
   `npm audit` — a vulnerabilidade está numa dependência opcional inerte para o nosso
   caso de uso. Forçar a v7 seria um breaking change não avaliado, quebrando as
   armadilhas já documentadas sobre a API de serialização da v6.

### Alternativas consideradas
- **Fixar versões antigas manualmente (`react@18.3.0` etc.)** — mais "fiel" ao que foi
  documentado em maio, mas regride para versões que o próprio ecossistema já deixou para
  trás; contraria o princípio de usar a versão mais recente
- **Forçar `eslint@^10.0.0` mesmo com o conflito** (`--force`/`--legacy-peer-deps`) —
  eliminaria o alerta do minimatch, mas deixaria uma árvore de dependências
  inconsistente logo no primeiro commit, com risco real de o plugin de react-hooks
  simplesmente não funcionar
- **Forçar `npm audit fix --force` para tudo (fabric@7.4.0 + eslint@10)** — eliminaria
  ambos os alertas, mas empilharia dois breaking changes não avaliados por cima de uma
  incompatibilidade de peer dependency conhecida
- **Manter `oxlint`** — mais rápido, já vem pronto, mas contraria a stack já documentada
  e tem cobertura de regras mais rasa para o que precisamos garantir (ex.: proibir `any`
  de forma confiável no schema)

### Consequências
- **Positivas:** projeto começa com as versões atuais do ecossistema, não com débito
  técnico de dia zero; ESLint configurado já cobre a regra "nunca usar `any`" como erro
  de lint; a decisão sobre o ESLint v10 foi testada de verdade, não assumida — evita
  descobrir a incompatibilidade mais tarde, no meio de um merge
- **Negativas:** CONTEXT.md precisou de mais uma atualização de "Mudanças nesta revisão"
  logo em sequência à sessão anterior — mas é o comportamento correto (documentação
  seguindo a realidade do código, não o contrário)
- **Riscos:** `npm audit` vai continuar mostrando 11 vulnerabilidades (10 altas, 1
  crítica) mesmo com o projeto saudável — isso é ESPERADO e não deve ser tratado como
  sinal de problema em sessões futuras (ver armadilha em CONTEXT.md). Revisitar a
  decisão do ESLint quando `eslint-plugin-react-hooks` liberar suporte à v10 (checar
  `npm view eslint-plugin-react-hooks peerDependencies` periodicamente); se o fabric.js
  algum dia tornar `canvas`/`jsdom` dependências obrigatórias, essa parte também precisa
  ser revisada

**⚠️ Armadilha conhecida:** o `.gitignore` que o `create-vite` gera por padrão ignora a
pasta `logs/` inteira — no nosso projeto essa pasta é versionada de propósito (logs de
sessão). Corrigido manualmente no primeiro `.gitignore` entregue; se algum dia o
boilerplate for regenerado do zero, conferir esse ponto de novo.

**⚠️ Armadilha conhecida:** `npx eslint --version` retornando a versão nova não é prova
de que a atualização é segura — só confirma que o binário instalado localmente naquele
momento é aquele. A prova real é tentar instalar mais alguma coisa (ou rodar `npm install`
do zero) e ver se o peer dependency resolve sem conflito. Descobrimos isso ao tentar
adicionar `@eslint/js` depois de já ter "confirmado" a v10 funcionando.

---

## DEC-012 — Merge do template-update do KCM v1.135.0 e adoção do modo Code

**Data:** 2026-11-10
**Status:** aceita
**Autor:** ambos (o dono aprovou as recomendações do relatório de merge)

### Contexto
O projeto estava no KCM v2 (2026-07-11). Um pacote v1.122.0 (2026-09-03) foi relatado e nunca
aplicado. O v1.135.0 veio com **Code sim · ASU não**. O CEREBRO vivo tinha a seção de ASU (marcador
do modo) e cadência «por sessão», que o kit revogou; `CLAUDE.md` e `.claude/` não existiam.

### Decisão
- **Modo Code adotado:** `CLAUDE.md` (build `npm run build`, validação `npm run lint`, slug `editx`),
  `.claude/settings.json` (o do kit + `npm run build`, `npm run lint` e `date` no `allow` — as skills
  pedem `date` para nomear o relatório), skills `apply-wo`/`wrap`/`sondar`, `meta/workorders/_TEMPLATE.md`
  e `meta/SPEC.md`. `meta/analises/_TEMPLATE.md` NÃO entrou (modelo-em-espera: a pasta nasce no 1º uso).
- **ASU removido como sobra:** marcador presente + modo `nao` no pacote; pré-requisitos do ASU
  (`INSTRUCTION_GUIDE.md`, `PROMPT_IA.md`) nunca existiram aqui. A aplicação cirúrgica passa a ser por WO.
- **CEREBRO:** texto do kit adotado por inteiro + nota de revisão; carimbo `v1.135.0`.
- **INSTRUCOES reescritas pelo esqueleto do kit:** 7.355 → **5.588** caracteres (`LC_ALL=C.UTF-8 wc -m`;
  teto com modo Code ~7.450). Saíram ASU, Feedback ASU, «Nome de download» e o ritual de sessão;
  entraram ritual de turno, canal da pasta vinculada, análise, WO e fecho de turno. **A cópia do painel
  do Projeto precisa ser colada à mão** — o arquivo do repo é a fonte.
- **45 ocorrências de «sessão» que mandam** trocadas por turno/conversa/dia nos meta/ e nas INSTRUCOES;
  as 20 que relatam fato ficaram (lista no relatório de merge e no log de 2026-11-10).
- **«📁 Arquivos Críticos» movido do STATUS para o CONTEXT** (conhecimento estável, regra do template).
- **`.flatdropignore`** passou à forma do kit (`logs/*`, `meta/workorders/*`, `!meta/workorders/_TEMPLATE.md`,
  dentro do bloco do editor); **`.gitignore`** ganhou o aviso «não ignore `.claude/`, `meta/`, `logs/`» e `Thumbs.db`.

### Desvio registrado
- **Mantida a nota viva da tabela de gatilhos** que declara CHANGELOG.md e ROADMAP.md ativos neste projeto.
  O texto do kit os chama de arquivos «de outros nichos» que não se criam — contradiz o próprio
  manifesto do nicho Desenvolvimento, que envia os dois. Registrado em IDEAS «Feedback para o Kit».

### Alternativas consideradas
- **Manter o ASU** — rejeitada: modo desligado em dois pacotes seguidos, ferramenta nunca instalada aqui,
  e a WO cobre o mesmo papel com o executor no repositório.
- **Remendar as INSTRUCOES vivas** em vez de reescrever — rejeitada: o arquivo já estava acima do teto
  padrão (7.355 > ~6.900) e a maior parte do texto era a regra revogada.
- **Renomear arquivos antigos para o vocabulário novo** — rejeitada: vocabulário novo não renomeia
  arquivo antigo (forja histórico e deixa ponteiros órfãos).

### Consequências
- **Positivas:** o chat grava direto na pasta; o Code aplica WOs e commita no verde; releitura por turno.
- **Negativas:** duas cópias das INSTRUCOES (repo e painel) a manter em sincronia.
- **Riscos:** o primeiro uso real de `/apply-wo` e `/wrap` ainda não aconteceu — conferir as permissões
  do `settings.json` nessa primeira tarefa (comando que pedir aprovação = falta no `allow`).

---

## DEC-013 — Validação do `.editx` escrita à mão, estrita, com Vitest sem configuração

**Data:** 2026-11-11
**Status:** aceita
**Autor:** Claude (chat), dentro do pedido do dono de escrever a wo0001

### Contexto
O `TemplateSerializer.ts` é o primeiro código de runtime e precisa validar arquivo vindo do disco,
que tipo TypeScript não protege. A DEC-009 fez de `TemplateSchema.ts` a fonte única dos tipos.

### Decisão
- Validador **escrito à mão** (`TemplateValidator.ts`), sem biblioteca de schema; **estrito** (chave
  desconhecida é erro), **coleta todos os erros** com caminho estilo JSONPath, e aceita só as versões
  de schema listadas em `SUPPORTED_SCHEMA_VERSIONS`.
- `serializeTemplate` **lança** em template inválido — nunca grava `.editx` inválido.
- **Vitest 5** sem arquivo de configuração: ambiente Node, `*.test.ts` ao lado do módulo, imports
  explícitos de `vitest`, `npm test` = `vitest run`.

### Alternativas consideradas
- **zod / valibot** — o schema da biblioteca viraria a fonte dos tipos (`z.infer`), invertendo a
  DEC-009; trocar a fonte da verdade é decisão do dono, não efeito colateral de uma WO. Adiada com
  gatilho em IDEAS «Adiadas».
- **Validador tolerante (ignora chave desconhecida)** — esconde erro de digitação (`isDatapage` faria
  a página parar de repetir em silêncio); com versão explícita, estrito é seguro.
- **Serializar sem validar** — mais simples para autosave, mas grava arquivo que o próprio app depois
  recusa abrir.

### Consequências
- **Positivas:** zero dependência nova em produção; a DEC-009 continua valendo; erro aponta o lugar exato.
- **Negativas:** duas descrições do mesmo formato (o tipo e o validador) que podem divergir — campo novo
  no schema sem regra no validador faz o `.editx` com esse campo ser REJEITADO (armadilha no CONTEXT).
- **Riscos:** autosave de trabalho incompleto vai esbarrar na validação estrita — quando o editor tiver
  autosave, decidir se ele usa um caminho de rascunho próprio.

---

## DEC-014 — Estilo de texto derivado guarda só as diferenças do pai

**Data:** 2026-11-11
**Status:** aceita
**Autor:** dono (decisão), Claude (análise)

### Contexto
O JSDoc de `TextStyle.basedOn` prometia herança («sobrescrevendo apenas os campos explicitamente
definidos»), mas o tipo exigia todos os campos e o validador da DEC-013 rejeitava os ausentes: a
herança não tinha efeito. Raciocínio completo, com as quatro opções:
`meta/analises/261111-ANALISE-heranca-de-estilos.md`.

### Decisão
- `TextStyle` é união discriminada por `basedOn`: **raiz** (`null`, todas as `TextStyleProps`) ou
  **derivado** (nome do pai, `Partial<TextStyleProps>` — só o que difere).
- O validador cobra as duas formas (raiz completa; derivado parcial e ainda estrito).
- O formato `0.1.0` muda **no lugar, sem subir versão** — exceção válida só porque nenhum `.editx`
  existia (`find .. -name "*.editx" -not -path "*/node_modules/*" | wc -l` = 0, conferido na wo0002).
  Depois do primeiro arquivo de usuário, mudança de formato sobe versão e traz migração.

### Alternativas consideradas
- **Tudo obrigatório, propagação por igualdade de valor** — regra implícita; erra quando o usuário
  escolheu de propósito o mesmo valor do pai.
- **Tudo obrigatório + lista `overrides`** — duas fontes da mesma verdade no mesmo objeto.
- **Sem herança** — contradiz o requisito de estilos em cascata (Affinity/Word).

### Consequências
- **Positivas:** o arquivo diz sem ambiguidade o que é herdado; o compilador impede ler propriedade de
  estilo derivado sem resolver (`number | undefined`).
- **Negativas:** todo consumidor de estilo depende do `StyleRegistry.ts` (wo0003) para o valor final.
- **Riscos:** `as TextStyleProps` forçado fora do `StyleRegistry.ts` desfaz a proteção — sinal:
  `grep -rn "as TextStyleProps" src`.

---

## DEC-015 — `StyleRegistry.ts` é um conjunto de funções puras, não um registro com estado

**Data:** 2026-11-11
**Status:** aceita
**Autor:** Claude (chat), ao escrever a wo0003 — o dono pode vetar antes da aplicação

### Contexto
Os docs de maio (CONTEXT, IDEAS, GLOSSARY, JSDoc de `TextStyle`) descreviam o `StyleRegistry.ts` como
«registro com observer pattern», citando a DEC-006 — que não fala de estilos. A DEC-004 (aceita) põe
**todo** o estado global no Zustand + Immer, com undo/redo por patches. O requisito do dono é de
comportamento: alterar um estilo atualiza os frames vinculados (IDEAS, 2026-05).

### Decisão
- `StyleRegistry.ts` exporta funções puras sobre o mapa `textStyles` do documento: `resolveStyle`
  (estilo final, cache `WeakMap` por mapa), `dependentsOf`, `setStyle` e `removeStyle` (devolvem mapa
  novo e recusam o que quebraria a herança).
- O mapa vive no `documentStore` (quando existir). A propagação vem de o estilo final ser sempre
  resolvido do mapa ATUAL; o «observer» é a assinatura do próprio store.

### Alternativas consideradas
- **Classe com estado próprio + `subscribe`** — duplica os estilos do documento (duas fontes da mesma
  verdade) e tira a edição de estilo do histórico do Immer: o undo pararia de desfazer estilo.
- **Resolver sem cache** — correto, mas recalcula a cadeia a cada leitura do canvas; com Immer o cache
  por identidade do mapa é de graça.

### Consequências
- **Positivas:** uma fonte da verdade (o documento); undo/redo cobre estilo sem código extra; testável sem DOM.
- **Negativas:** o cache supõe que o mapa nunca é mutado no lugar — mutação direta serve estilo velho.
- **Riscos:** alguém mutar `textStyles` fora do Immer. Sinal: estilo que não muda na tela após edição;
  conferência: todo `textStyles[` com `=` fora de `produce`/`setStyle` é suspeito.

---

## DEC-016 — CanvasEngine em duas camadas: geometria pura + adaptador fino do Fabric

**Data:** 2026-11-12
**Status:** aceita
**Autor:** Claude (chat), ao escrever a wo0004 — o dono pode vetar antes da aplicação

### Contexto
O Fabric precisa de DOM e de `<canvas>`; o Vitest do projeto roda em Node, sem DOM (DEC-013), e o
`canvas`/`jsdom` do Fabric são dependências opcionais que o projeto decidiu não usar (DEC-011). O Fabric
6.9.1 tem `dispose()` assíncrono e recusa reinicializar um elemento com `data-fabric` — o que colide com
o StrictMode do React (medido no código instalado; armadilhas no CONTEXT).

### Decisão
- Toda conta (unidade → px CSS a 96 px/pol, caixa com sangria, zoom para caber, centralização) mora em
  `canvas/PageGeometry.ts`, puro e testado em Node. O `CanvasEngine.ts` só traduz isso para o Fabric.
- O adaptador é conferido pelo **dono, na tela** (roteiro da wo0004), não por teste automático.
- `width`/`height` do documento mandam; `orientation` é metadado e não gira a página.
- `ui/CanvasView.tsx` cria um `<canvas>` novo a cada montagem e libera com `dispose()` sem `await`.

### Alternativas consideradas
- **Testar o adaptador com jsdom + `canvas` (node-canvas)** — reativa as dependências opcionais que a
  DEC-011 deixou de fora (e a vulnerabilidade da cadeia `canvas`→`tar`), e mede o Fabric, não a tela.
- **Vitest em modo navegador** — ferramenta a mais para conferir uma página vazia; reavaliar quando os
  frames tiverem lógica de desenho que valha teste visual.
- **`<canvas>` do JSX com `useRef`** — quebra no StrictMode (elemento reaproveitado com `data-fabric`).

### Consequências
- **Positivas:** a parte com lógica tem teste; o adaptador é pequeno o bastante para ler; dev e produção
  montam igual.
- **Negativas:** regressão visual do canvas só aparece no roteiro do dono.
- **Riscos:** lógica de desenho escorregar para dentro do `CanvasEngine.ts` sem teste — sinal: operador
  aritmético (`+ - * /`) aplicado a `bleed`, `zoom` ou px no `CanvasEngine.ts`; é checagem de LEITURA (o
  adaptador usa esses nomes legitimamente ao repassar valores do `PageGeometry.ts`, então `grep` não separa).

---

## FIX-001 — Página em branco: a limpeza do `CanvasView` apagava a montagem viva no StrictMode

**Data:** 2026-11-12
**Status:** resolvida

- **Sintoma:** no primeiro `npm run dev` depois da wo0004, a página ficou inteira branca — nem o fundo
  cinza do canvas —, sem erro no console (prints do dono, 2026-11-12 14:43).
- **Causa raiz:** a limpeza do efeito de montagem removia do `<div>` todo filho que não existia antes da
  montagem. O `dispose()` do Fabric 6 devolve o `<canvas>` original na hora (`cleanupDOM` síncrono) mas só
  resolve depois do próximo quadro; no StrictMode, quando resolvia, a 2ª montagem já tinha inserido o canvas
  dela — e a limpeza da 1ª apagava os dois. Medido no navegador: filhos do `<div>` = `CANVAS` + `DIV.canvas-container`
  antes da promessa resolver.
- **Solução:** a limpeza remove só o próprio `<canvas>` daquela montagem (wo0005).
- **Lição:** limpeza assíncrona não pode decidir o que remover por diferença de estado tirada ANTES — outro
  dono pode ter escrito no meio. Guarde a referência do que é seu. Instrução de WO que diz «remova o que esta
  montagem inseriu» precisa dizer COMO (por referência, não por diferença). Armadilha no CONTEXT.

---

## DEC-017 — Fontes estáticas embarcadas no app; motor de layout de texto puro

**Data:** 2026-11-15
**Status:** aceita
**Autor:** dono (decisão das fontes), Claude (análise e motor)

### Contexto
O motor de overflow mede com o `opentype.js` (DEC-006), que precisa dos bytes da fonte; o `.editx` só tem o
nome. O `opentype.js` 1.3.4 não lê WOFF2 nem fonte variável (medido). Raciocínio completo e opções descartadas:
`meta/analises/261112-ANALISE-fontes-do-frame-de-texto.md`.

### Decisão
- Fontes do app = `.ttf` ESTÁTICOS versionados em `public/fonts/<família>/` com a licença. F1: Montserrat
  400/600/700/800, do repositório oficial `JulietaUla/Montserrat` fixado no commit
  `555facfb2a18c72c3c0380f0d9c0f060453a9058` (SIL OFL 1.1).
- `src/text/FontRegistry.ts`: catálogo família+peso → URL; peso pela regra de correspondência do CSS; família
  fora do catálogo é ERRO visível, nunca troca silenciosa. O validador NÃO passa a recusar família desconhecida.
- `src/text/TextLayout.ts`: motor PURO (quebra de linha + os 4 modos), testado no Vitest com a fonte real lida
  do disco. Unidades: px CSS; `fontSize` em pt → `ptToPx` (`PageGeometry.ts`).
- Teste que lê disco declara `/// <reference types="node" />` na primeira linha — o `tsconfig.app.json` carrega
  só `vite/client`, e sem a referência o `tsc -b` falha (`TS2591`, medido).

### Alternativas consideradas
- **Google Fonts em tempo de execução** — WOFF2, que o `opentype.js` não lê; rede obrigatória; quebra offline.
- **Fontes do sistema medidas pelo canvas** — layout diferente por máquina; sem bytes para o PDF.
- **Upload de fontes já na F1** — escopo da F2; o app precisa de fontes padrão de qualquer forma.
- **`"types": ["node"]` no `tsconfig.app.json`** — daria tipos do Node ao código do app inteiro (`process`,
  `Buffer`) para servir dois arquivos de teste.

### Consequências
- **Positivas:** mesmo `.editx`, mesmo layout em qualquer máquina; funciona offline; o PDF da F3 já tem os bytes.
- **Negativas:** ~1,8 MB de binário no repositório; uma família só na F1.
- **Riscos:** a referência de tipos do Node num teste vale para a compilação inteira do app — sinal: uso de
  `process`/`Buffer` em arquivo que não é `*.test.ts` (`grep -rln "process\.\|Buffer\." src --include=*.ts | grep -v test`).

---

## DEC-018 — Texto desenhado no canvas como contorno das letras

**Data:** 2026-11-15
**Status:** aceita
**Autor:** dono (escolha entre as duas formas), Claude (forma e medições)

### Contexto
O motor de layout (DEC-017) mede com o `opentype.js`. Desenhar com o texto do Fabric faria o NAVEGADOR medir de
novo, com o motor de texto dele: as larguras podem divergir das do motor, mudando quebra de linha e encaixe —
exatamente o que a geração em massa não tolera.

### Decisão
- Cada linha é desenhada como o contorno vetorial do `opentype.js` (`font.getPath(...).toPathData`), com a mesma
  fonte, tamanho e posições do layout, e vira um `Path` do Fabric posicionado pelas próprias coordenadas.
- Frames de dados mostram `{coluna}` até haver CSV importado. Rotação ainda não é desenhada (ponto de giro
  indefinido no formato — ideia adiada).
- Frame cujo estilo/fonte falha vira um retângulo vermelho tracejado no lugar, e os outros seguem.

### Alternativas consideradas
- **Texto do Fabric (`Textbox`/`IText`) com a fonte carregada pelo navegador** — permite digitar no canvas mais
  cedo, mas o desenho deixa de ser o que o motor mediu. Escolha do dono: fidelidade primeiro.

### Consequências
- **Positivas:** o que aparece é o que o motor calculou, em qualquer máquina; sem corrida de carregamento de fonte.
- **Negativas:** editar texto digitando direto no canvas exige, depois, uma caixa de edição por cima do frame (ou o
  painel de propriedades). Texto desenhado não é selecionável como texto no canvas (o PDF da F3 é outra rota).
- **Riscos:** passar `left`/`top` a um `Path` de texto o desloca da linha de base — armadilha no CONTEXT.

---

## FIX-002 — Canvas borrado com o zoom do navegador diferente de 100%

**Data:** 2026-11-16
**Status:** resolvida — conferida pelo chat no navegador embutido em 2026-11-17 depois da wo0010: com a página aberta, zoom de CSS 1 → 1.1 → 1.25 → 0.9, o buffer bateu com a tela em todos (1280×720), e o contêiner de 1000,5×700,5 px CSS deu buffer 1001×701 = os px de tela que o navegador informa para o canvas. Limite: o painel roda em DPR 1 — monitor HiDPI e zoom real do navegador (que muda o `devicePixelRatio`) não foram conferidos; se o borrão voltar num deles, reabrir aqui

- **Sintoma:** em 100% a página e o texto ficam nítidos; em qualquer outro zoom do navegador ficam borrados, e
  continuam assim esperando minutos [relatado pelo dono, 2026-11-15].
- **Causa raiz:** o buffer do `<canvas>` ficava com tamanho diferente do que o canvas ocupa na tela, e o navegador
  reamostrava tudo. O retina do Fabric 6.9.1 grava `css × dpr` como atributo de largura, que é inteiro (a fração é
  truncada), e trata DPR < 1 como 1; o `ResizeObserver` entregava px CSS fracionários. Medido no navegador em
  2026-11-16: contêiner de 1000,5 × 700,5 px CSS → buffer 1000 × 700, quando a tela dá 1001 × 701
  (`devicePixelContentBoxSize`). A hipótese do cache dos objetos caiu na leitura do código: ele é refeito quando
  `zoom × retina` muda.
- **Solução:** retina do Fabric desligado; o `CanvasEngine.resize` recebe `canvasSize(...)` (`PageGeometry.ts`,
  puro, testado) — px do dispositivo no buffer (a medida do navegador, ou `css × dpr` arredondado), px CSS no estilo;
  margem do enquadramento e `getZoom()` convertidos pela razão; o `CanvasView` observa `device-pixel-content-box`
  (wo0009).
- **Alternativa descartada:** manter o retina do Fabric e compensar o arredondamento — não cobre o zoom abaixo de
  100%, onde o Fabric não escala.
- **Regressão da wo0009 (corrigida na wo0010):** o `CanvasView` observava SÓ a caixa `device-pixel-content-box`, e o
  estilo do canvas recebia px CSS. Trocar o zoom com a página aberta não muda os px físicos da janela — nenhum
  evento — e o estilo ficava velho: medido em 2026-11-17 (zoom de CSS no `<html>`, 1.1 → 1.25), 0 disparos e o
  canvas ocupando 1454 px da tela para um buffer de 1280. Na carga da página saía certo, por isso passou. Correção:
  estilo `100%` do contêiner e dois observadores (caixa de conteúdo + caixa em px do dispositivo) com o mesmo
  callback (wo0010). Conferência que só olha a página recém-carregada não pega isso: o roteiro de tela do canvas
  troca o zoom COM a página aberta.
- **Lição:** buffer de canvas é inteiro e precisa bater com o pixel da tela; quem sabe quantos pixels a tela dá é o
  navegador (`devicePixelContentBoxSize`), não a conta `css × dpr`. Conferência visual em 100% não testa isso —
  todo roteiro de tela do canvas inclui um zoom ≠ 100%. Armadilhas no CONTEXT (retina truncando; px da tela nos
  controles de seleção).

---

## DEC-019 — Projeto = pasta; arquivos do projeto lidos por um contrato único (`ProjectFiles`)

**Data:** 2026-11-17
**Status:** aceita
**Autor:** dono (escolha das opções) + chat (análise)

### Contexto
O DEC-002 guarda imagens por caminho relativo ao `.editx`, mas no navegador abrir um arquivo não dá acesso à pasta
dele. `showDirectoryPicker` só existe no Chrome/Edge (Firefox: posição negativa; Safari: se opõe); `<input
webkitdirectory>` existe em todos, só leitura e sem persistência. Análise: `meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md`.

### Decisão
- **Projeto = pasta:** o usuário abre a pasta que contém o `.editx` e as imagens.
- **Um contrato só** para ler arquivos do projeto: `ProjectFiles.read(caminho) → Blob | null` (`src/project/ProjectFiles.ts`).
  Implementações: pasta por `showDirectoryPicker` no Chrome/Edge (handle no IndexedDB, grava o `.editx`); pasta por
  `webkitdirectory` no Firefox/Safari (só leitura); `UrlProjectFiles` só para o exemplo em desenvolvimento
  (`public/exemplo/`); Tauri na F5. As duas da pasta entram com a UI de abrir projeto.
- **Caminhos:** `src` e `fallback` relativos ao `.editx`; valor da coluna de imagem do CSV relativo a `imageBasePath`.
  Todo caminho passa por `normalizeProjectPath`; `..` que sai da pasta do projeto é recusado, também pelo validador.
- **Desenho** (wo0012): estático tenta `src` e depois `fallback`; dados (sem CSV ainda) tenta o `fallback`; sem
  caminho → área reservada; nada legível → erro. Vertical sempre centralizado; `borderRadius` em mm; empate de
  `zIndex` põe a imagem embaixo do texto.

### Alternativas consideradas
- **Copiar as imagens para o armazenamento do navegador (OPFS/IndexedDB)** — a pasta deixaria de ser a fonte de
  verdade; cópias divergem em silêncio.
- **Base64 sempre** — já recusado no DEC-002.
- **Esperar o Tauri (F5)** — travaria a F3 inteira.
- **Só Chrome/Edge na F1** — mais barato, mas o editor não abriria no Firefox/Safari; o dono escolheu manter os dois.

### Consequências
- **Positivas:** quem desenha não sabe de onde vêm os bytes; o Tauri entra pela mesma porta; caminho inválido é pego
  ao abrir o arquivo, não no meio de um lote.
- **Negativas:** duas implementações de navegador para manter; no Firefox/Safari salvar = baixar um `.editx` novo e
  a pasta é escolhida de novo a cada sessão.
- **Riscos:** caixa de nome de arquivo trocada (`Coca.JPG` × `coca.jpg`) — o `ImageResolver.ts` procura sem diferenciar
  caixa; permissão de pasta negada ou esquecida; pasta enorme no `webkitdirectory` (não medido). Armadilhas no CONTEXT.

---

## DEC-020 — Como as formas são desenhadas: traço por dentro, linha horizontal, polígono e SVG adiados

**Data:** 2026-11-18
**Status:** aceita
**Autor:** chat (escolhas técnicas dentro do formato; apresentadas ao dono com a wo0014)

### Contexto
O `ShapeFrame` define `shape`, `fill`, `stroke` (mm) e `borderRadius` (mm), mas não diz onde o traço fica em relação ao
frame, de onde a linha vai a onde, nem quais são os pontos de um polígono; e o JSDoc de `customSvg` promete
sanitização antes de desenhar (item aberto do backlog).

### Decisão
- **Traço por DENTRO do frame:** o contorno recua meia espessura de cada lado; a borda externa do traço coincide com o
  frame. O raio de `borderRadius` é o da borda externa.
- **Linha:** horizontal, no meio do frame, de borda a borda, traço centrado nela, sem preenchimento. Inclinação virá
  com a rotação (`transform.rotation`), quando ela for desenhada.
- **Tracejado:** traço 3× e vão 2× a espessura. **Pontilhado:** pontos redondos (traço 0, ponta redonda) a cada 2× a
  espessura.
- **Polígono e SVG customizado** saem como o retângulo vermelho de erro até existirem os pontos no formato e a
  sanitização.
- **Empilhamento:** forma, imagem e texto pelo `zIndex`; empate: forma < imagem < texto.
- Contorno calculado puro (`FrameShape.ts`, testado em Node) e pintado como `Path` do Fabric (DEC-016/DEC-018).

### Alternativas consideradas
- **Traço centrado na borda (o padrão do Fabric e do SVG)** — metade do traço sairia do frame: o que se vê passa do
  retângulo que o usuário desenhou, e o PDF teria de repetir a mesma sobra.
- **Linha diagonal do canto superior esquerdo ao inferior direito** — o desenho dependeria da proporção do frame; o
  caso comum no varejo (fio separador) é horizontal.
- **Objetos `Rect`/`Ellipse`/`Line` do Fabric** — cada um com regra própria de posição e de traço; o `Path` único
  calculado fora do Fabric é testável e é o mesmo caminho do texto.

### Consequências
- **Positivas:** o tamanho visual da forma é o do frame; o mesmo contorno serve ao PDF (F4).
- **Negativas:** polígono e SVG ainda não aparecem; traço mais grosso que meio frame «enche» a forma.
- **Riscos:** quem portar o desenho para outro destino (PDF, PNG) e usar o retângulo do frame com traço centrado erra
  meia espessura — armadilha no CONTEXT.

---

## DEC-021 — Stores antes da seleção; toda mudança do documento passa por um ponto que grava o desfazer

**Data:** 2026-11-18
**Status:** aceita — emendada por DEC-023
**Autor:** dono (ordem e comportamento do arraste) + chat (análise e desenho dos stores)

### Contexto
A seleção é o primeiro passo em que a tela muda o `.editx`, e não havia lugar para o documento mudar
(`src/store/` não existia). O backlog listava a seleção antes dos stores. Análise:
`meta/analises/261118-ANALISE-ordem-selecao-e-stores.md`.

### Decisão
- **Ordem:** stores primeiro (wo0016), seleção depois.
- **Três stores em `zustand/vanilla`**, criados juntos por `createEditorStores(template)` — documento (cópia do
  template + página ativa), histórico (pilhas de patches, limite 100) e seleção (ids). Factory, não singletons: um
  editor por chamada, e os testes rodam em Node sem React.
- **Desfazer desde já:** toda mudança do template passa por `edit`, que usa `produceWithPatches` e grava os patches
  e os inversos; `undo`/`redo` aplicam com `applyPatches`. Mudança que não muda nada não entra. Página ativa e seleção
  não entram no histórico.
- **Para a seleção (próxima WO):** ao MOVER, o conteúdo acompanha a alça durante o arraste e o documento recebe o
  `transform` ao soltar — uma entrada de desfazer por arraste; ao REDIMENSIONAR, só a caixa muda e o frame é
  redesenhado ao soltar. Junto: `fromPx` com arredondamento, cache das imagens decodificadas, Ctrl+Z/Ctrl+Shift+Z.

### Alternativas consideradas
- **Seleção primeiro, com estado local** — retrabalho certo quando os stores chegassem, e mover sem desfazer.
- **Tudo numa WO só** — três frentes novas no mesmo ciclo.
- **Stores sem histórico** — o histórico muda a forma das ações; acrescentá-lo depois é reescrevê-las.
- **Redesenhar o conteúdo continuamente ao redimensionar** — mais parecido com o Canva, mas redesenha o texto a cada
  movimento do mouse; fica para quando a seleção básica existir.

### Consequências
- **Positivas:** qualquer ação futura ganha desfazer passando por `edit`; os stores são testados sem tela.
- **Negativas:** a wo0016 não muda nada na tela; o redesenho ainda é da página inteira a cada mudança (texto ~1 ms,
  imagem 30–50 ms sem cache — medido em 2026-11-18).
- **Riscos:** ação que faz `set({ template })` sem passar por `edit` fica fora do desfazer, em silêncio; atribuir um
  objeto novo dentro da receita gera entrada vazia de desfazer — armadilhas no CONTEXT.

---

## DEC-022 — Merge do template-update do KCM v1.151.0

**Data:** 2026-11-18
**Status:** aceita
**Autor:** ambos

### Contexto
Chegou à pasta-pai o pacote `261118-kcm-update-v1.151.0/` (template-update do kit, v1.135.0 → v1.151.0; 25
arquivos). O pacote manda instalar as skills novas antes de aplicar qualquer WO de migração. Fase 1 (preliminares)
na wo0017; fase 2 (comparação dos 23 arquivos e inventário) em `meta/analises/261118-ANALISE-merge-kcm-v1.151.0.md`,
com 5 pontos de decisão.

### Decisão
- **Natureza por arquivo, como na análise.** Do kit, substituídos inteiros: as 3 skills, `meta/workorders/_TEMPLATE.md`
  (cerca de QUATRO crases nos blocos de âncora e de texto novo) e o `meta/GUIA-DO-KIT.md` novo. Modelos (template):
  só o que é novo entra no vivo — «Entregas» no `LOG-TEMPLATE.md`, o marcador de fim do `IDEAS.md`, a seção «Build e
  validação» do `CONTEXT.md`, o `Status` «aceita — emendada» aqui, `.claude/settings.local.json` no `.gitignore`, 6
  permissões de leitura no `.claude/settings.json` (`git show`, `git ls-files`, `git cat-file`, `wc`, `grep`,
  `head`). `CLAUDE.md` fica o vivo (o do pacote é o genérico de que ele é a especialização).
- **Fusão do CEREBRO e das Instruções com o PACOTE como base.** Transplantado do vivo: as duas «Técnicas específicas
  deste projeto»; «Ambiente (sistema operacional)» e a nota do CMD em «Commit pronto» (o pacote foi gerado sem SO
  marcado — ponto 1: o SO volta); a nota de que CHANGELOG e ROADMAP são arquivos ativos aqui; nas Instruções, o
  título do projeto, a nota «FONTE das Instruções do painel» e a linha do Windows/CMD (5.740 caracteres).
- **Pontos 2–5, decididos pelo dono em 2026-11-18:** `meta/SETUP.md` criado (este projeto tem conteúdo real de
  ambiente); `README.md` do scaffold do Vite trocado por um curto do EditX; **sem LICENSE por enquanto** (repositório
  privado); **DECISIONS não arquivado agora**, apesar das 832 linhas.
- **Desvio declarado:** o chat gravou no disco, ANTES desta WO, todos os arquivos que são do kit ou do chat (skills,
  modelo de WO, GUIA, settings, CEREBRO, Instruções, CONTEXT, SETUP, os dois README); a wo0018 os versiona por
  `sha1sum` e posiciona só o que é do Code. Motivo: o pacote manda instalar as skills antes de aplicar a WO.

### Alternativas consideradas
- **Base = o CEREBRO vivo, somando as regras novas** — 15 revisões de kit para costurar à mão; o pacote é o texto
  inteiro e o que é deste projeto cabe em 5 transplantes.
- **SO de fora, como veio o pacote** — os comandos voltariam a sair na sintaxe de outro shell.
- **Arquivar DEC-010 e DEC-012 (99 linhas)** — o dono preferiu manter o arquivo inteiro por ora.

### Consequências
- **Positivas:** carimbos dos 6 arquivos do kit em v1.151.0; o `/apply-wo` passa a delimitar por quatro crases e a
  parada grava relatório em arquivo; a rede do projeto descrita num lugar só (CONTEXT, «Build e validação»).
- **Negativas:** as Instruções mudaram no repositório — o dono cola o texto novo no painel do Projeto.
- **Riscos:** o pacote continua na pasta-pai até o commit desta WO; depois o chat o MOVE para `notas-arquivadas/`.

---

## DEC-023 — Seleção: uma alça por frame, seleção simples, canto proporcional, texto que cresce só no eixo livre

**Data:** 2026-11-19
**Status:** aceita
**Autor:** dono (as três escolhas de comportamento) + chat (análise e desenho)

### Contexto
A DEC-021 fixou o comportamento do arraste (mover com o conteúdo, redimensionar só a caixa até soltar, uma entrada de
desfazer por arraste, `fromPx`, cache das imagens, atalhos). Faltavam o COMO e três escolhas de produto. Análise:
`meta/analises/261119-ANALISE-selection-manager.md` — leitura do código e do fonte do Fabric 6.9.1 (`index.mjs`).

### Decisão
- **Escopo (dono):** só seleção simples — clicar, Esc, clicar no vazio —, mover, redimensionar e desfazer pelo
  teclado. Multi-seleção (Shift+clique), alinhamento, distribuição e setas na WO seguinte; encaixe e guias depois.
- **Cantos (dono):** mantêm a proporção e o Shift solta; alças do meio livres — o padrão do Fabric
  (`uniformScaling: true`) e o comportamento do Canva.
- **Texto que cresce (dono):** só as alças do eixo que não cresce — `grow-vertical`, as laterais; `grow-horizontal`,
  as de cima e de baixo; sem cantos.
- **Como (chat):** uma alça (`Rect` transparente) por frame visível e não travado, ATUALIZADA no lugar por `frameId`
  — remover a alça ativa faria o Fabric limpar a seleção. A seleção mora no `selectionStore` e quem a decide é o
  clique (`mouse:down`); os eventos `selection:*` do Fabric não são usados, porque também disparam quando o código
  troca o objeto ativo. Ao mover, o conteúdo e os recortes andam com a alça. Ao soltar, `transform` novo = `transform`
  atual + a diferença da caixa (o texto que cresce tem caixa diferente do `transform`), arredondado a 0,01 da unidade
  (`fromPx`), mínimo 1 mm. Sem alça de girar (nada desenha rotação). `preserveObjectStacking` ligado. Controles ×
  `pixelRatio`. Cache das imagens decodificadas por caminho, um por pasta de projeto. Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y e
  Esc no host.

### Alternativas consideradas
- **Multi-seleção já** — o `ActiveSelection` do Fabric passa os objetos para coordenadas relativas ao grupo; é outra
  frente, com outros testes.
- **Canto livre, Shift mantém a proporção** (Figma) — o produto mira o público do Canva.
- **Arrastar no eixo que cresce troca o frame para fixo** (Figma) — muda o `overflow.mode` no mesmo arraste e pede
  uma regra (fixo com redução ou com corte?); fica no IDEAS.
- **Todas as alças no texto que cresce** — a altura gravada seria ignorada e a caixa «voltaria» ao soltar.
- **Sincronizar pela `selection:*` do Fabric** — dispara também com `setActiveObject` e ao remover a alça ativa.

### Consequências
- **Positivas:** a primeira interação do editor; a seleção sobrevive ao redesenho; a imagem não é relida a cada
  mudança; a parte que decide (`SelectionGeometry.ts`) é testada em Node.
- **Negativas:** o `CanvasEngine.ts` passa das ~300 linhas da regra do CONTEXT (extração no IDEAS); a página ainda é
  redesenhada inteira a cada arraste solto.
- **Riscos:** piscar ao soltar — a hipótese de que não pisca (fonte e imagem em cache resolvem antes do próximo
  quadro) não foi medida; vai para a conferência de tela. Controles em DPR ≠ 1 real nunca conferidos (FIX-002).

---

## Template para novo ADR (copie e preencha)

```markdown
## DEC-[número] — [Título curto]

**Data:** YYYY-MM-DD
**Status:** aceita | aceita — emendada por DEC-[N] | substituída por DEC-[N] | resolvida | aberta
**Autor:** você | Claude | ambos

### Contexto
[Por que essa decisão precisou ser tomada? Qual problema estava sendo resolvido?]

### Decisão
[O que foi decidido]

### Alternativas consideradas
- [Opção A] — [por que não]
- [Opção B] — [por que não]

### Consequências
- **Positivas:** [o que melhora]
- **Negativas:** [trade-offs aceitos]
- **Riscos:** [o que pode dar errado]

**⚠️ Armadilha conhecida:** [se a decisão já criou um problema, registrar aqui]
```

---

## Template para novo FIX (copie e preencha)

```markdown
## FIX-[número] — [Título do bug grave]

**Data:** YYYY-MM-DD
**Status:** resolvida | aberta

- **Sintoma:** [o que se observava.]
- **Causa raiz:** [o que realmente estava errado — não o sintoma.]
- **Solução:** [o que foi feito.]
- **Lição:** [o que evita que volte a acontecer; virou armadilha em CONTEXT?]
```
