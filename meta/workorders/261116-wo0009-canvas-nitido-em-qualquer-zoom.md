# WO 0009 — Canvas nítido em qualquer zoom do navegador (buffer em px do dispositivo, FIX-002)

> **Tipo:** mista — CÓDIGO (`PageGeometry.ts` + teste, `CanvasEngine.ts`, `CanvasView.tsx`) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — mexe no adaptador do Fabric que toda a tela usa.
> **Pré-requisito:** escrita sobre `351d3a0` (`docs: registra conferencia de tela da wo0007 e abre bug de nitidez`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 101 testes verdes (relatório da wo0007; a wo0008 foi só de doc).
> **Base:** bug aberto pela wo0008 — canvas borrado com o zoom do navegador ≠ 100% [relatado pelo dono, 2026-11-15]. O dono escolheu em 2026-11-16 corrigir antes do `FrameImage.ts`. Causa raiz medida pelo chat (seção 1). Registro: FIX-002 (Edição 7).
> **Depende de:** wo0008 (aplicada: `351d3a0`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `1af9dd4bb023eccf113979de3e54de20c35e0fa0  meta/CONTEXT.md`
> - `e431c062df67bdeeaf10d7c9844a4ad828a76d4c  logs/2026-11-16.md` (arquivo novo, `??`)
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório.
> **Âncoras lidas em** (pelo chat, 2026-11-16, no disco, neste turno): `src/canvas/PageGeometry.ts` — a função `ptToPx` inteira (fim do arquivo); `src/canvas/PageGeometry.test.ts` — a linha `import { centeredOffset, fitZoom, MAX_ZOOM, MIN_ZOOM, pageBox, ptToPx, toPx } from './PageGeometry';` e o `it('G11: …')` inteiro; `src/canvas/CanvasEngine.ts` — `import type { PageBox } from './PageGeometry';`, `  private disposal: Promise<void> | null = null;`, `      enableRetinaScaling: true,`, o método `resize` inteiro com o JSDoc, o método `getZoom` inteiro e a linha `    const zoom = fitZoom(width, height, this.box, this.fitMargin);`; `src/ui/CanvasView.tsx` — `import { CanvasEngine } from '../canvas/CanvasEngine';` e o trecho de `engine.resize(host.clientWidth, host.clientHeight);` até `observer.observe(host);`; `meta/STATUS.md` — a nota `**Mudanças nesta revisão (2026-11-15, wo0008):**` (3 linhas), `*Nada em progresso — próximo item do backlog é \`FrameImage.ts\`.*`, a linha `- **Canvas borrado com o zoom do navegador diferente de 100%** —` inteira, o começo `*Fora esse, nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do`, o bloco «Última conversa» e o rodapé; `meta/CHANGELOG.md` — a linha do FIX-001 em «Corrigido» de [Unreleased]; `meta/DECISIONS.md` — `## Template para novo ADR (copie e preencha)` (1 ocorrência); `logs/2026-11-16.md` — a última linha.
> **Medido pelo chat** (2026-11-16, navegador embutido em `localhost:5173`, Chromium do app, DPR 1): contêiner forçado a 1000,5 × 700,5 px CSS → buffer do Fabric **1000 × 700** com CSS `1000.5px`/`700.5px`; o mesmo tamanho no `ResizeObserver` com `box: 'device-pixel-content-box'` → **1001 × 701** px do dispositivo; `'devicePixelContentBoxSize' in ResizeObserverEntry.prototype` = `true`. **Lido no código instalado** (fabric 6.9.1, `node_modules/fabric/dist/index.mjs`): `setCanvasDimensions` faz `el.width = width` e, só se `retinaScaling > 1`, `el.setAttribute('width', (width * retinaScaling).toString())` + `ctx.scale(retinaScaling, retinaScaling)`; `getDevicePixelRatio` = `Math.max(config.devicePixelRatio ?? window.devicePixelRatio, 1)`; `_updateCacheCanvas` refaz o cache do objeto quando `zoom × retina` muda; `_renderStroke` com `strokeUniform` faz `ctx.scale(1 / getObjectScaling())` — só a escala do objeto, não o zoom do viewport; o ponteiro sai multiplicado por `upperCanvasEl.width / boundsWidth`. Tipos (`StaticCanvas.d.ts`): `setDimensions(Partial<TSize>, { backstoreOnly?: true })` e `setDimensions(Partial<CSSDimensions>, { cssOnly?: true })`.
> **Simulado pelo chat:** as edições 1–4 aplicadas numa cópia do repositório a partir do texto DESTA WO; `tsc -p tsconfig.app.json --noEmit` e `eslint` nos arquivos tocados — resultado no relatório do chat, não aqui. `npm test` não roda na VM do chat (binário nativo do Windows); a contagem de testes é do seu shell.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `CHANGELOG.md`, `DECISIONS.md` e a seção do Code no log (Edições 5–8). `meta/CONTEXT.md` e `logs/2026-11-16.md` (seção do chat) são do chat e já estão gravados — **só versione**.

---

## 1. Por que

Com o zoom do navegador ≠ 100%, o **buffer** do `<canvas>` (quantos pixels ele tem) fica com tamanho diferente do que o canvas **ocupa na tela**, e o navegador reamostra o canvas inteiro — página, guia e texto borram juntos. Duas origens, as duas no retina do Fabric 6: (1) ele grava `css × dpr` como atributo de largura, que é inteiro, então a fração é **truncada** (1745,4545 px CSS × 1,1 = 1919,99995 → buffer 1919 numa tela de 1920); (2) ele ignora DPR abaixo de 1 (`Math.max(dpr, 1)`), então no zoom 90% o buffer fica **maior** que a tela. O `ResizeObserver` ainda entregava px CSS fracionários. Em 100% tudo é inteiro e bate — por isso só ali fica nítido.

**A correção:** o Fabric deixa de fazer retina (`enableRetinaScaling: false`). O `CanvasEngine` recebe o tamanho em **px do dispositivo** — a medida exata do navegador (`devicePixelContentBoxSize`) ou, sem ela, `css × dpr` **arredondado** — e põe esse número no buffer e os px CSS no estilo. As coordenadas do canvas passam a ser px do dispositivo; o zoom de enquadramento já as inclui, então a página aparece do mesmo tamanho. `getZoom()` continua devolvendo px CSS por px do mundo (divide pela razão). Observar a caixa `device-pixel-content-box` também faz o observador disparar quando só o DPR muda (trocar de monitor).

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos dois arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  101 passed (101)`. Número diferente de 101: relate o cru e siga (é dedução a partir do relatório da wo0007, não medida desta WO).
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `M meta/CONTEXT.md`, `?? logs/2026-11-16.md`, `?? meta/workorders/261116-wo0009-canvas-nitido-em-qualquer-zoom.md`.

## Edição 1 — `src/canvas/PageGeometry.ts` · tamanho do buffer (puro)

**Âncora** (fim do arquivo):

```
export function ptToPx(pt: number): number {
  return (pt * CSS_PX_PER_INCH) / PT_PER_INCH;
}
```

**Substituir por:**

```
export function ptToPx(pt: number): number {
  return (pt * CSS_PX_PER_INCH) / PT_PER_INCH;
}

/** Tamanho do canvas: o que ele ocupa na página (px CSS) e o buffer de pixels (px do dispositivo). */
export interface CanvasSize {
  /** Largura do contêiner em px CSS (pode ser fracionária). */
  cssWidth: number;
  /** Altura do contêiner em px CSS (pode ser fracionária). */
  cssHeight: number;
  /** Largura do buffer em px do dispositivo — inteiro: um pixel do buffer por pixel da tela. */
  pixelWidth: number;
  /** Altura do buffer em px do dispositivo — inteiro. */
  pixelHeight: number;
  /** px do dispositivo por px CSS de fato usados (`pixelWidth / cssWidth`); o DPR quando a largura é 0. */
  pixelRatio: number;
}

/**
 * Tamanho do buffer para que cada pixel do canvas caia num pixel da tela (FIX-002).
 * `devicePixels` é a medida exata do navegador (`devicePixelContentBoxSize` do
 * `ResizeObserver`) e vence quando existe; sem ela, arredonda `css × dpr`. Nunca
 * trunca: buffer 1 px menor que a tela faz o navegador reamostrar o canvas inteiro.
 *
 * @param cssWidth - largura do contêiner em px CSS
 * @param cssHeight - altura do contêiner em px CSS
 * @param devicePixelRatio - `window.devicePixelRatio` (pode ser < 1 no zoom abaixo de 100%)
 * @param devicePixels - medida exata em px do dispositivo, ou `null` se o navegador não a dá
 * @returns tamanhos CSS e do buffer, e a razão entre eles
 */
export function canvasSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  devicePixels: { width: number; height: number } | null = null,
): CanvasSize {
  const pixelWidth = devicePixels?.width ?? Math.round(cssWidth * devicePixelRatio);
  const pixelHeight = devicePixels?.height ?? Math.round(cssHeight * devicePixelRatio);
  const pixelRatio = cssWidth > 0 && pixelWidth > 0 ? pixelWidth / cssWidth : devicePixelRatio;
  return { cssWidth, cssHeight, pixelWidth, pixelHeight, pixelRatio };
}
```

## Edição 2a — `src/canvas/PageGeometry.test.ts` · import

**Âncora:**

```
import { centeredOffset, fitZoom, MAX_ZOOM, MIN_ZOOM, pageBox, ptToPx, toPx } from './PageGeometry';
```

**Substituir por:**

```
import {
  canvasSize,
  centeredOffset,
  fitZoom,
  MAX_ZOOM,
  MIN_ZOOM,
  pageBox,
  ptToPx,
  toPx,
} from './PageGeometry';
```

## Edição 2b — `src/canvas/PageGeometry.test.ts` · testes G12–G15

**Âncora:**

```
  it('G11: pt para px (72pt = 96px)', () => {
    expect(ptToPx(72)).toBe(96);
    expect(ptToPx(12)).toBe(16);
  });
```

**Substituir por:**

```
  it('G11: pt para px (72pt = 96px)', () => {
    expect(ptToPx(72)).toBe(96);
    expect(ptToPx(12)).toBe(16);
  });

  it('G12: a medida exata do navegador vence o arredondamento', () => {
    // Medido no navegador em 2026-11-16: 1000,5 × 700,5 px CSS ocupam 1001 × 701 px da tela.
    expect(canvasSize(1000.5, 700.5, 1, { width: 1001, height: 701 })).toEqual({
      cssWidth: 1000.5,
      cssHeight: 700.5,
      pixelWidth: 1001,
      pixelHeight: 701,
      pixelRatio: 1001 / 1000.5,
    });
  });

  it('G13: sem a medida, arredonda css × dpr — nunca trunca (zoom 110%)', () => {
    // 1745,4545 × 1,1 = 1919,99995: truncar daria 1919 numa tela de 1920 px.
    const size = canvasSize(1745.4545, 859.0909, 1.1);
    expect(size.pixelWidth).toBe(1920);
    expect(size.pixelHeight).toBe(945);
  });

  it('G14: DPR abaixo de 1 também vale (zoom 90%)', () => {
    const size = canvasSize(2133.3333, 1050, 0.9);
    expect(size.pixelWidth).toBe(1920);
    expect(size.pixelHeight).toBe(945);
    expect(size.pixelRatio).toBeCloseTo(0.9, 4);
  });

  it('G15: contêiner vazio não divide por zero', () => {
    expect(canvasSize(0, 0, 1.25)).toEqual({
      cssWidth: 0,
      cssHeight: 0,
      pixelWidth: 0,
      pixelHeight: 0,
      pixelRatio: 1.25,
    });
  });
```

## Edição 3a — `src/canvas/CanvasEngine.ts` · import do tipo

**Âncora:**

```
import type { PageBox } from './PageGeometry';
```

**Substituir por:**

```
import type { CanvasSize, PageBox } from './PageGeometry';
```

## Edição 3b — `src/canvas/CanvasEngine.ts` · campo da razão

**Âncora:**

```
  private disposal: Promise<void> | null = null;
```

**Substituir por:**

```
  private disposal: Promise<void> | null = null;
  /** px do dispositivo por px CSS do último `resize` (FIX-002); 1 até o primeiro. */
  private pixelRatio = 1;
```

## Edição 3c — `src/canvas/CanvasEngine.ts` · retina do Fabric desligado

**Âncora:**

```
      enableRetinaScaling: true,
```

**Substituir por:**

```
      // DESLIGADO de propósito (FIX-002): o retina do Fabric 6 trunca `css × dpr` e ignora
      // DPR < 1, e o buffer fica de tamanho diferente da tela. Quem dá os px do dispositivo
      // é o `resize`, já medidos pelo navegador.
      enableRetinaScaling: false,
```

## Edição 3d — `src/canvas/CanvasEngine.ts` · `resize` recebe px do dispositivo

**Âncora:**

```
  /** Ajusta o tamanho do canvas ao contêiner e reenquadra a página. */
  resize(width: number, height: number): void {
    this.assertAlive();
    this.canvas.setDimensions({ width, height });
    this.reframe();
    this.canvas.requestRenderAll();
  }
```

**Substituir por:**

```
  /**
   * Ajusta o canvas ao contêiner e reenquadra a página. O buffer recebe px do DISPOSITIVO
   * e o estilo recebe px CSS: um pixel do buffer cai num pixel da tela em qualquer zoom do
   * navegador (FIX-002). As coordenadas do canvas passam a ser px do dispositivo; o zoom de
   * enquadramento já as inclui.
   *
   * @param size - tamanhos vindos de `canvasSize` (`PageGeometry.ts`)
   */
  resize(size: CanvasSize): void {
    this.assertAlive();
    this.pixelRatio = size.pixelRatio;
    this.canvas.setDimensions(
      { width: size.pixelWidth, height: size.pixelHeight },
      { backstoreOnly: true },
    );
    this.canvas.setDimensions({ width: size.cssWidth, height: size.cssHeight }, { cssOnly: true });
    this.reframe();
    this.canvas.requestRenderAll();
  }
```

## Edição 3e — `src/canvas/CanvasEngine.ts` · `getZoom` em px CSS

**Âncora:**

```
  getZoom(): number {
    this.assertAlive();
    return this.canvas.getZoom();
  }
```

**Substituir por:**

```
  /** Zoom da página em px CSS por px do mundo (1 = tamanho físico), independente do DPR. */
  getZoom(): number {
    this.assertAlive();
    return this.canvas.getZoom() / this.pixelRatio;
  }
```

## Edição 3f — `src/canvas/CanvasEngine.ts` · margem do enquadramento em px do dispositivo

**Âncora:**

```
    const zoom = fitZoom(width, height, this.box, this.fitMargin);
```

**Substituir por:**

```
    // width/height são px do dispositivo; a margem é configurada em px CSS.
    const zoom = fitZoom(width, height, this.box, this.fitMargin * this.pixelRatio);
```

## Edição 4a — `src/ui/CanvasView.tsx` · import

**Âncora:**

```
import { CanvasEngine } from '../canvas/CanvasEngine';
```

**Substituir por:**

```
import { CanvasEngine } from '../canvas/CanvasEngine';
import { canvasSize } from '../canvas/PageGeometry';
```

## Edição 4b — `src/ui/CanvasView.tsx` · medir em px do dispositivo

**Âncora:**

```
    engine.resize(host.clientWidth, host.clientHeight);
    engine.showPage(templateRef.current.document);

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (!engine.disposed) engine.resize(width, height);
    });
    observer.observe(host);
```

**Substituir por:**

```
    // Primeiro enquadramento com a melhor estimativa; o ResizeObserver dispara logo em
    // seguida com a medida exata em px do dispositivo e corrige (FIX-002).
    const rect = host.getBoundingClientRect();
    engine.resize(canvasSize(rect.width, rect.height, window.devicePixelRatio));
    engine.showPage(templateRef.current.document);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      // Quantos pixels da TELA o contêiner ocupa, já arredondados pelo navegador como ele
      // vai desenhar (escrita horizontal: inline = largura). Safari não tem; aí canvasSize
      // arredonda css × dpr.
      const device = entry.devicePixelContentBoxSize?.[0];
      const devicePixels =
        device === undefined ? null : { width: device.inlineSize, height: device.blockSize };
      if (!engine.disposed) {
        engine.resize(canvasSize(width, height, window.devicePixelRatio, devicePixels));
      }
    });
    try {
      // Esta caixa também dispara quando só o DPR muda (outro monitor), sem mudar o tamanho CSS.
      observer.observe(host, { box: 'device-pixel-content-box' });
    } catch {
      // Navegador sem a caixa: a de conteúdo dispara quando o tamanho CSS muda.
      observer.observe(host);
    }
```

## Edição 5a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-15, wo0008):** conferência de tela da wo0007 registrada — texto conferido pelo
dono; aberto o bug «canvas borrado fora do zoom 100%». A nota anterior (wo0007) saiu — o que ela registrava está em
DEC-018 e no CHANGELOG.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-16, wo0009):** o borrão fora do zoom 100% foi corrigido no código (FIX-002) e sai
de «Quebrado» para «Em Progresso» até o dono conferir na tela. A nota anterior (wo0008) saiu — o que ela registrava
está no log de 2026-11-15 e no bug, agora em FIX-002.
```

## Edição 5b — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
*Nada em progresso — próximo item do backlog é `FrameImage.ts`.*
```

**Substituir por:**

```
- **Nitidez fora do zoom 100%** — corrigida no código (wo0009, FIX-002: buffer do canvas em px do dispositivo, retina do Fabric desligado); falta a conferência do dono na tela em 90%, 110% e 125%. Depois dela, o próximo item do backlog é `FrameImage.ts`.
```

## Edição 5c — `meta/STATUS.md` · Quebrado

**Âncora** (a linha inteira, e a linha em branco depois dela, e o começo da seguinte):

```
- **Canvas borrado com o zoom do navegador diferente de 100%** — em 100% a página e o texto ficam nítidos; em qualquer outro zoom ficam borrados e continuam assim mesmo esperando minutos [relatado pelo dono, 2026-11-15]. Causa raiz não investigada; hipóteses e o que já foi lido no Fabric estão em `logs/2026-11-15.md` («Chat (planejamento) — noite»).

*Fora esse, nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do
```

**Substituir por:**

```
*Nenhum bug aberto — projeto compila, lint passa, build de produção funciona.* A página em branco do
```

## Edição 5d — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**2026-11-15** — wo0006 (fontes Montserrat e motor de layout, DEC-017) e wo0007 (texto desenhado como contorno
das letras na página de produto, DEC-018). Detalhe em `logs/2026-11-15.md`.
**Onde parou:** texto conferido na tela pelo dono; bug de nitidez fora do zoom 100% aberto (causa raiz a investigar). A ordem entre investigar o bug e `FrameImage.ts` não está decidida.

---

*Próximo passo: decidir a ordem entre investigar o borrão fora do zoom 100% (bug aberto) e `FrameImage.ts` (frame de imagem com fit modes) — WO a escrever pelo chat.*
```

**Substituir por:**

```
**2026-11-16** — causa raiz do borrão fora do zoom 100% medida no navegador e corrigida (wo0009, FIX-002). Detalhe
em `logs/2026-11-16.md`.
**Onde parou:** correção aplicada; falta o roteiro de tela do dono (90%, 110%, 125%).

---

*Próximo passo: conferência de tela do FIX-002 pelo dono; depois, `FrameImage.ts` (frame de imagem com fit modes) — WO a escrever pelo chat.*
```

## Edição 6 — `meta/CHANGELOG.md` · Corrigido

**Âncora:**

```
- Página em branco no `npm run dev`: a limpeza do `CanvasView` removia por diferença de filhos e apagava o canvas da 2ª montagem (StrictMode); agora remove só o próprio `<canvas>`. Ver FIX-001
```

**Substituir por:**

```
- Página em branco no `npm run dev`: a limpeza do `CanvasView` removia por diferença de filhos e apagava o canvas da 2ª montagem (StrictMode); agora remove só o próprio `<canvas>`. Ver FIX-001
- Canvas borrado com o zoom do navegador diferente de 100%: o buffer do `<canvas>` ficava de tamanho diferente da tela (retina do Fabric truncando e ignorando DPR < 1); agora o buffer recebe os px do dispositivo medidos pelo navegador. Ver FIX-002
```

## Edição 7 — `meta/DECISIONS.md` · FIX-002

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## FIX-002 — Canvas borrado com o zoom do navegador diferente de 100%

**Data:** 2026-11-16
**Status:** aberta — corrigida no código (wo0009); fecha quando o dono conferir na tela em 90%, 110% e 125%

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
- **Lição:** buffer de canvas é inteiro e precisa bater com o pixel da tela; quem sabe quantos pixels a tela dá é o
  navegador (`devicePixelContentBoxSize`), não a conta `css × dpr`. Conferência visual em 100% não testa isso —
  todo roteiro de tela do canvas inclui um zoom ≠ 100%. Armadilhas no CONTEXT (retina truncando; px da tela nos
  controles de seleção).

---

## Template para novo ADR (copie e preencha)
```

## Edição 8 — `logs/2026-11-16.md` · seção do Code

**Âncora** (última linha do arquivo):

```
  o efeito em 90/110/125% fica para o roteiro de tela do dono depois da wo0009.
```

**Substituir por:** a mesma linha, uma linha em branco, e uma seção `## Code (execução) — wo0009` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`.

---

## Fora de escopo

- `FrameImage.ts`, `SelectionManager.ts` (o ajuste dos controles ao `pixelRatio` é armadilha no CONTEXT, para quando ele existir).
- Mexer em `TextDrawing.ts`, `FrameText.ts`, `TextLayout.ts` ou no formato `.editx`.
- O aviso de chunk de 661 kB do build.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** `CanvasSize` entra só via `import type` (Edição 3a).
- **Nenhum teste importa `fabric`** (DEC-016) — o teste novo é do `PageGeometry.ts`, que é puro.
- **Mantenha intacta** a limpeza do FIX-001 (`element.remove()` no `.finally`) e o `<canvas>` criado por montagem.
- **Não suba o `npm run dev` para «conferir»** — a tela é do dono (roteiro no chat). Se subir, feche antes de commitar e diga.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/STATUS.md`, `M src/canvas/CanvasEngine.ts`, `M src/canvas/PageGeometry.test.ts`, `M src/canvas/PageGeometry.ts`, `M src/ui/CanvasView.tsx`, `?? logs/2026-11-16.md`, `?? meta/workorders/261116-wo0009-canvas-nitido-em-qualquer-zoom.md`. Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 105 testes** (101 + G12–G15). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida:** troque temporariamente os dois `Math.round` de `canvasSize` por `Math.floor` e rode `npm test` — esperado **2 testes falhando** (G13 e G14). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `PageGeometry.test.ts` → `canvasSize` → o arredondamento sem `devicePixels`. **NÃO responde:** «presta?» na tela — se o navegador mostra o canvas nítido em 110% depende do `CanvasView`/`CanvasEngine` no navegador real; isso é o roteiro do dono.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "^      enableRetinaScaling: false," src/canvas/CanvasEngine.ts` = 1
      - `grep -c "^      enableRetinaScaling: true," src/canvas/CanvasEngine.ts` = 0
      - `grep -c "box: 'device-pixel-content-box'" src/ui/CanvasView.tsx` = 1
      - `grep -c "element.remove();" src/ui/CanvasView.tsx` = 1 (FIX-001 intacto)
      - `grep -c "^## FIX-002" meta/DECISIONS.md` = 1
      - `grep -c "^- \*\*Canvas borrado com o zoom" meta/STATUS.md` = 0
      - `grep -c "^- \*\*Nitidez fora do zoom 100%\*\*" meta/STATUS.md` = 1
      - `grep -c "^## Code (execução) — wo0009" logs/2026-11-16.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0009.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Inclua as saídas cruas acima, `wc -l` de `CanvasEngine.ts`/`CanvasView.tsx`/`PageGeometry.ts`, e qualquer decisão sua. **Se o push falhar**, diga o erro cru e deixe o commit local — o dono resolve a rede.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-16.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/STATUS.md meta/workorders/261116-wo0009-canvas-nitido-em-qualquer-zoom.md src/canvas/CanvasEngine.ts src/canvas/PageGeometry.test.ts src/canvas/PageGeometry.ts src/ui/CanvasView.tsx
```

```
git commit -m "fix(canvas): deixa o canvas nitido em qualquer zoom do navegador" -m "O retina do Fabric truncava css x dpr e ignorava DPR abaixo de 1, e o buffer do canvas ficava de tamanho diferente da tela. Agora o retina do Fabric fica desligado e o CanvasEngine recebe os px do dispositivo medidos pelo navegador (canvasSize, devicePixelContentBoxSize). FIX-002 (wo0009)."
```

```
git push
```
