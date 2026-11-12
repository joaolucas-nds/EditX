# WO 0005 — Corrige a página em branco: a limpeza do CanvasView apagava a montagem viva (FIX-001)

> **Tipo:** mista — CÓDIGO (1 arquivo, texto exato) + DOC (registro nos `meta/`).
> **Config sugerida:** Sonnet ou Opus · `/effort` médio — diff fechado, só posicionar e validar.
> **Pré-requisito:** escrita sobre `be22c3f` (`feat(canvas): cria CanvasEngine que mostra a pagina com sangria e zoom`), árvore limpa exceto o arquivo que o chat gravou (lista abaixo). 60 testes verdes (relatório da wo0004).
> **Base:** roteiro de tela da wo0004 — o dono rodou `npm run dev` e viu a página TODA BRANCA (prints `Captura de tela 2026-11-12 144309.png` / `144312.png`, arquivados em `../notas-arquivadas/`: Vite subiu em `localhost:5173`, página vazia).
> **Depende de:** wo0004 (aplicada: `be22c3f`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `7fd2007a493f4a554daeefba437a19a258ec5ecb  meta/CONTEXT.md`
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (lidas pelo chat em 2026-11-12, no disco, neste turno): `src/ui/CanvasView.tsx` (as linhas `const before = new Set(Array.from(host.childNodes));` + `const element = document.createElement('canvas');`, e o bloco `.finally(() => { … });` da limpeza); `meta/STATUS.md` (a linha que começa `- **Canvas mostra a página** —` e o parágrafo `*Nenhum bug — projeto compila, lint passa, build de produção funciona.* Dois avisos`); `meta/DECISIONS.md` (`## Template para novo ADR (copie e preencha)`); `logs/2026-11-12.md` (última linha `- Dono confere a página na tela (\`npm run dev\`); depois WO do \`FrameText.ts\`.`).

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `DECISIONS.md` e a seção do Code no log (Edições 2–4). `meta/CONTEXT.md` é do chat e já está gravado — **só versione**.

---

## 1. Por que — a causa raiz, medida

**Defeito introduzido pela wo0004, e a ambiguidade é do chat:** a WO pedia «remove do `<div>` o que ESTA montagem inseriu», e a implementação («remove o que não existia antes da montagem») é uma leitura razoável que quebra no StrictMode. A sequência, medida pelo chat no navegador do app (`localhost:5173`) e no código do Fabric 6.9.1:

1. 1ª montagem: `before` = {} (vazio); insere o canvas A (o Fabric o embrulha em `div.canvas-container`).
2. StrictMode desmonta: `engine.dispose()` — `StaticCanvas.dispose` chama `cleanupDOM` **na hora** e devolve o `<canvas>` A ao lugar do embrulho; a promessa só resolve **depois do próximo quadro**.
3. 2ª montagem, imediata: insere o canvas B no mesmo `<div>`. **Medido:** filhos do `<div>` = `CANVAS` (o A devolvido) + `DIV.canvas-container` (o B).
4. A promessa do passo 2 resolve e o `.finally` remove todo filho que não estava em `before` (vazio) — **o A e o B**. `<div>` vazio = página branca, sem erro no console.

Correção: a limpeza remove **só o próprio `<canvas>`** daquela montagem, que o Fabric já pôs de volta no lugar do embrulho.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` no arquivo da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  60 passed (60)`.

## Edição 1a — `src/ui/CanvasView.tsx` · sem o retrato dos filhos

**Âncora:**

```
    const before = new Set(Array.from(host.childNodes));
    const element = document.createElement('canvas');
```

**Substituir por:**

```
    const element = document.createElement('canvas');
```

## Edição 1b — `src/ui/CanvasView.tsx` · a limpeza remove só o próprio canvas

**Âncora:**

```
        .finally(() => {
          // Remove só o que ESTA montagem inseriu (o Fabric embrulha o <canvas> num div.canvas-container).
          for (const node of Array.from(host.childNodes)) {
            if (!before.has(node)) host.removeChild(node);
          }
        });
```

**Substituir por:**

```
        .finally(() => {
          // O dispose() do Fabric já devolveu ESTE <canvas> ao lugar do div.canvas-container
          // (cleanupDOM é síncrono); aqui só ele sai. Não remova por diferença de filhos: no
          // StrictMode a montagem seguinte já inseriu o canvas dela no mesmo <div> (FIX-001).
          element.remove();
        });
```

## Edição 2a — `meta/STATUS.md` · o «Funcionando» passa a dizer o que falta conferir

**Âncora** (início da linha — a linha inteira começa assim e é única):

```
- **Canvas mostra a página** — `npm run dev` abre a página do exemplo
```

**Substituir por:**

```
- **Canvas mostra a página** *(corrigido na wo0005, FIX-001 — conferência de tela do dono pendente)* — `npm run dev` abre a página do exemplo
```

## Edição 2b — `meta/STATUS.md` · Quebrado

**Âncora:**

```
*Nenhum bug — projeto compila, lint passa, build de produção funciona.* Dois avisos
```

**Substituir por:**

```
*Nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do
primeiro `npm run dev` (wo0004) foi corrigida na wo0005 (FIX-001); falta o dono confirmar na tela. Dois avisos
```

## Edição 3 — `meta/DECISIONS.md` · FIX-001

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
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

## Template para novo ADR (copie e preencha)
```

## Edição 4 — `logs/2026-11-12.md` · seção do Code

**Âncora** (última linha do arquivo):

```
- Dono confere a página na tela (`npm run dev`); depois WO do `FrameText.ts`.
```

**Substituir por:** a mesma linha, depois uma linha em branco, depois uma seção `## Code (execução) — wo0005` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`. Não reescreva as seções anteriores.

---

## Fora de escopo

- Qualquer outra mudança no `CanvasView.tsx` ou no `CanvasEngine.ts`.
- Teste automático do `CanvasView` (precisa de DOM; DEC-016). A conferência é o roteiro do dono.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **Não suba o `npm run dev` para «conferir»:** a conferência é do dono, na tela; se subir, feche antes de commitar e diga no relatório.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short` mostra **exatamente**: `M logs/2026-11-12.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/STATUS.md`, `M src/ui/CanvasView.tsx`, `?? meta/workorders/261112-wo0005-fix-canvas-em-branco.md`. Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. `npm test` — `Tests  60 passed (60)` (nenhum teste novo, nenhum a menos). Cru.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "before" src/ui/CanvasView.tsx` = 0
      - `grep -c "^          element.remove();$" src/ui/CanvasView.tsx` = 1
      - `grep -c "^## FIX-001" meta/DECISIONS.md` = 1
      - `grep -c "conferência de tela do dono pendente" meta/STATUS.md` = 1
      - `grep -c "^## Code (execução) — wo0005" logs/2026-11-12.md` = 1
      *(escritos pelo chat e não testados no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0005.txt` (`date +%y%m%d-%H%M`, na hora), com as saídas cruas acima.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-12.md meta/CONTEXT.md meta/DECISIONS.md meta/STATUS.md meta/workorders/261112-wo0005-fix-canvas-em-branco.md src/ui/CanvasView.tsx
```

```
git commit -m "fix(canvas): limpeza do CanvasView remove so o proprio canvas" -m "No StrictMode o dispose do Fabric resolvia depois que a segunda montagem ja tinha inserido o canvas dela, e a limpeza por diferenca de filhos apagava os dois: pagina em branco. FIX-001 (wo0005)."
```

```
git push
```
