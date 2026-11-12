# DECISIONS.md — Registro de Decisões Técnicas (ADRs)

> ADR — Architecture Decision Records (simplificado)
> Registra TODAS as decisões importantes com contexto e motivo.
> Evita reabrir discussões já resolvidas e dá contexto ao Claude em novas conversas.
> Duas naturezas: **DEC** (arquitetura/design) e **FIX** (bugs graves resolvidos, para não repetir).
> Arquiva por EVENTO, não por tamanho: entrada resolvida ou substituída vai para `DECISIONS-archive.md`; ~700 linhas é só alarme. Toda entrada traz `**Status:**` com valor fechado.

**Mudanças nesta revisão (2026-11-10):** adicionada a DEC-012 (merge do KCM v1.135.0 com modo
Code). Critério de arquivamento passou de tamanho para evento, e o `Status` dos modelos DEC/FIX
passou ao conjunto fechado do kit (aceita · substituída por X · resolvida · aberta). A nota de
2026-07-11 saiu; o que ela registrava (modelo de FIX, DEC-010) continua no corpo do arquivo.

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

## Template para novo ADR (copie e preencha)

```markdown
## DEC-[número] — [Título curto]

**Data:** YYYY-MM-DD
**Status:** aceita | substituída por DEC-[N] | resolvida | aberta
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
