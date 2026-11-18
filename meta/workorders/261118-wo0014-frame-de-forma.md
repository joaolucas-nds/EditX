# WO 0014 — Formas no canvas: `FrameShape.ts` com o traço por dentro do frame (DEC-020)

> **Tipo:** mista — CÓDIGO (desenho puro + teste, adaptador do Fabric, host React) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — terceiro tipo de frame no adaptador; mexe no empilhamento.
> **Pré-requisito:** escrita sobre `4ec7069` (`docs: registra conferencia de tela do FrameImage`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 137 testes verdes (relatório da wo0012; a wo0013 foi só de doc).
> **Base:** próximo item do backlog da F1 (`FrameShape.ts` — retângulo, elipse, linha). O formato deixa quatro lacunas (de onde a linha vai a onde; pontos do polígono; sanitização do SVG; onde o traço fica em relação ao frame) — o chat as decidiu como escolhas técnicas e as registra no DEC-020 (Edição 9). O dono pode vetar antes de aplicar.
> **Depende de:** wo0013 (aplicada: `4ec7069`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `508898498dbfbee9f89bb779b759555960cee25e  meta/CONTEXT.md`
> - `a521c8b8746432e4dfdf808d4856754d9f18f236  logs/2026-11-18.md` (novo, `??`)
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório. Arquivo novo que já existe: **PARE e reporte** (salvo o `App.tsx`, que é substituído).
> **Âncoras lidas em** (pelo chat, 2026-11-18, no disco, neste turno, sobre `4ec7069`): `src/canvas/CanvasEngine.ts` — `import type { ImageFrameDrawing } from './FrameImage';`, `  private imageObjects: FabricObject[] = [];`, as três linhas do `showPage` (`// Página nova = desenhos de texto e de imagem velhos…`, `this.clearText();`, `this.clearImages();`), as duas primeiras linhas do JSDoc de `setImageDrawings`, o `clearImages` inteiro, o JSDoc do `relayer` e a primeira linha do corpo dele; `src/ui/CanvasView.tsx` — `import { decodeImageInBrowser, prepareImageDrawings } from '../canvas/FrameImage';` e `    engine.showPage(template.document);` (1 ocorrência; a da montagem é `templateRef.current.document`); `src/App.tsx` inteiro (substituído); `meta/STATUS.md` — nota de revisão (3 linhas), `**v0.0.0** …`, o começo da linha `- **Imagem aparece no canvas** …`, `*Nada em progresso — …*`, a linha de backlog do `FrameShape.ts`, o bloco «Última conversa» e o rodapé; `meta/ROADMAP.md` — `- [ ] \`FrameShape.ts\` — retângulo, elipse, linha`; `meta/CHANGELOG.md` — a linha «Imagem no canvas» em Adicionado; `meta/DECISIONS.md` — `## Template para novo ADR (copie e preencha)` (1 ocorrência); `meta/IDEAS.md` — `  se mostrar lento no uso real.` (1 ocorrência, fim da seção «Adiadas»); `logs/2026-11-18.md` — a última linha.
> **Medido pelo chat** (2026-11-18, no código instalado e no repositório): `ShapeFrame` (`src/types/frame.types.ts`) — `shape: 'rect' | 'ellipse' | 'line' | 'polygon' | 'custom-svg'`, `fill` `{type:'none'}` ou `{type:'solid', color}`, `stroke {color, width (mm), style: 'solid'|'dashed'|'dotted'}`, `borderRadius` (mm, «só tem efeito em `shape: 'rect'`»), `customSvg?`. O validador (`FrameValidator.ts`) já cobra tudo isso; não muda. O exemplo tem UMA forma: `frame-fundo-capa` na `page-capa` (`rect`, `solid #1D3557`, `stroke.width 0`, `zIndex 0`), sob o título branco (`zIndex 1`). **fabric 6.9.1:** `Path` aceita `fill`/`stroke` `string | null`, `strokeDashArray: number[] | null`, `strokeLineCap`; o traço é centrado no contorno (como no SVG); `new Path(d)` sem `left`/`top` fica nas coordenadas do contorno (armadilha DEC-018).
> **Simulado pelo chat:** as edições aplicadas numa cópia do repositório a partir do texto DESTA WO; `tsc -p tsconfig.app.json --noEmit`, `eslint` e `prettier --check` nos arquivos tocados, e os testes NOVOS (R1–R14) rodados com uma réplica mínima do `vitest` sobre o JS compilado — resultado no relatório do chat. A suíte completa é do seu shell.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md`, `IDEAS.md` e a seção do Code no log (Edições 6–11). `meta/CONTEXT.md` e `logs/2026-11-18.md` (seção do chat) são do chat e já estão gravados — **só versione**.

---

## 1. Por que

Formas são o terceiro tipo de frame e o fundo de quase todo material de varejo (faixas de preço, selos, molduras). Esta WO desenha `rect` (com cantos arredondados), `ellipse` e `line`, com preenchimento sólido ou nenhum e traço contínuo, tracejado ou pontilhado. Mesma divisão da DEC-016/DEC-018: o contorno é calculado num módulo puro e testado em Node (`FrameShape.ts`); o Fabric só recebe o `Path` pronto. O `CanvasEngine` passa a empilhar forma, imagem e texto pelo `zIndex`. O host ganha `?page=` na URL para mostrar a capa — a página que tem a forma do exemplo.

**Regras de desenho** (DEC-020): o traço fica **por dentro** do frame (o contorno recua meia espessura; a borda externa do traço coincide com o frame, como o PDF terá de coincidir); linha é **horizontal, no meio do frame, de borda a borda**, com o traço centrado nela e sem preenchimento; tracejado = traço 3× e vão 2× a espessura; pontilhado = pontos redondos espaçados 2× a espessura; espessura e raio em mm; **polígono** (o formato não tem os pontos) e **SVG customizado** (falta a sanitização) saem como o retângulo vermelho de erro; empate de `zIndex` põe forma < imagem < texto.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos dois arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  137 passed (137)` (do relatório da wo0012 — número diferente: relate o cru e siga).
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `M meta/CONTEXT.md`, `?? logs/2026-11-18.md`, `?? meta/workorders/261118-wo0014-frame-de-forma.md`.

## Edição 1 — `src/canvas/FrameShape.ts` · criar arquivo novo (puro; NÃO importa `fabric`)

**Criar arquivo novo:**

```ts
/**
 * FrameShape.ts
 *
 * Desenho dos frames de forma, PURO (sem Fabric, sem DOM): cada forma vira um contorno
 * SVG em coordenadas do mundo do canvas, com o traço por DENTRO do frame (DEC-020). O
 * Fabric só recebe o contorno pronto — quem pinta é o `CanvasEngine.ts`.
 */

import type { DocumentSettings, EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { DrawRect } from '../text/TextDrawing';
import type { ShapeFrame, StrokeStyle } from '../types/frame.types';
import { toPx } from './PageGeometry';

/** Traço pronto para pintar: espessura e tracejado em px CSS do mundo. */
export interface ShapeStrokeDrawing {
  color: string;
  width: number;
  /** Comprimentos de traço e vão, ou `null` para traço contínuo. */
  dash: number[] | null;
  /** `round` no pontilhado: cada traço de comprimento 0 vira um ponto. */
  cap: 'butt' | 'round';
}

export interface ShapeDrawing {
  kind: 'shape';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  /** Contorno em dados de caminho SVG, já em coordenadas do mundo e já recuado para o traço. */
  path: string;
  /** Cor de preenchimento, ou `null` sem preenchimento. */
  fill: string | null;
  stroke: ShapeStrokeDrawing | null;
}

export interface ShapeDrawingError {
  kind: 'error';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  message: string;
}

export type ShapeFrameDrawing = ShapeDrawing | ShapeDrawingError;

/** Número curto e estável para o contorno: 3 casas, e nunca «-0». */
function num(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded === 0 ? 0 : rounded);
}

/**
 * Contorno SVG de uma forma no retângulo `rect`, com o traço por DENTRO: a geometria
 * recua meia espessura de cada lado (no máximo metade do frame), então a borda externa do
 * traço coincide com o frame. Linha é horizontal, no meio do frame, de borda a borda, com
 * o traço centrado nela.
 *
 * @param kind - `rect`, `ellipse` ou `line`
 * @param rect - retângulo do frame no mundo
 * @param radius - raio dos cantos (só `rect`), em px; limitado à metade do lado menor
 * @param strokeWidth - espessura do traço em px (0 = sem traço)
 */
export function shapePath(
  kind: 'rect' | 'ellipse' | 'line',
  rect: DrawRect,
  radius: number,
  strokeWidth: number,
): string {
  if (kind === 'line') {
    const y = rect.top + rect.height / 2;
    return `M ${num(rect.left)} ${num(y)} H ${num(rect.left + rect.width)}`;
  }

  const inset = Math.min(strokeWidth / 2, rect.width / 2, rect.height / 2);
  const left = rect.left + inset;
  const top = rect.top + inset;
  const width = rect.width - 2 * inset;
  const height = rect.height - 2 * inset;
  const right = left + width;
  const bottom = top + height;

  if (kind === 'ellipse') {
    const rx = num(width / 2);
    const ry = num(height / 2);
    const cy = num(top + height / 2);
    // Duas meias-elipses: um arco só, de um ponto a ele mesmo, não desenha nada.
    return `M ${num(left)} ${cy} A ${rx} ${ry} 0 1 0 ${num(right)} ${cy} A ${rx} ${ry} 0 1 0 ${num(left)} ${cy} Z`;
  }

  // O raio é da borda EXTERNA do traço: o contorno recuado usa o raio menos o recuo.
  const r = Math.max(0, Math.min(radius - inset, width / 2, height / 2));
  if (r === 0) {
    return `M ${num(left)} ${num(top)} H ${num(right)} V ${num(bottom)} H ${num(left)} Z`;
  }
  const arc = `A ${num(r)} ${num(r)} 0 0 1`;
  return [
    `M ${num(left + r)} ${num(top)}`,
    `H ${num(right - r)}`,
    `${arc} ${num(right)} ${num(top + r)}`,
    `V ${num(bottom - r)}`,
    `${arc} ${num(right - r)} ${num(bottom)}`,
    `H ${num(left + r)}`,
    `${arc} ${num(left)} ${num(bottom - r)}`,
    `V ${num(top + r)}`,
    `${arc} ${num(left + r)} ${num(top)}`,
    'Z',
  ].join(' ');
}

/** Tracejado em múltiplos da espessura: escala junto com o traço. */
function dashFor(style: StrokeStyle, width: number): number[] | null {
  if (style === 'dashed') return [3 * width, 2 * width];
  if (style === 'dotted') return [0, 2 * width];
  return null;
}

/**
 * Desenha um frame de forma. Polígono (o formato não tem os pontos) e SVG customizado
 * (falta a sanitização) ainda não são desenhados e saem como `error`.
 */
export function drawShapeFrame(frame: ShapeFrame, document: DocumentSettings): ShapeFrameDrawing {
  const rect = frameRect(frame, document);
  if (frame.shape === 'polygon' || frame.shape === 'custom-svg') {
    const message =
      frame.shape === 'polygon'
        ? 'Polígono ainda não é desenhado: o formato não tem os pontos dele.'
        : 'SVG customizado ainda não é desenhado: falta a sanitização (backlog).';
    return { kind: 'error', frameId: frame.id, zIndex: frame.zIndex, frame: rect, message };
  }

  // Espessura e raio são em mm no formato, qualquer que seja a unidade do documento.
  const width = toPx(frame.stroke.width, 'mm');
  const stroke: ShapeStrokeDrawing | null =
    width > 0
      ? {
          color: frame.stroke.color,
          width,
          dash: dashFor(frame.stroke.style, width),
          cap: frame.stroke.style === 'dotted' ? 'round' : 'butt',
        }
      : null;
  const fill = frame.shape === 'line' || frame.fill.type === 'none' ? null : frame.fill.color;
  const radius = frame.shape === 'rect' ? toPx(frame.borderRadius, 'mm') : 0;

  return {
    kind: 'shape',
    frameId: frame.id,
    zIndex: frame.zIndex,
    frame: rect,
    path: shapePath(frame.shape, rect, radius, width),
    fill,
    stroke,
  };
}

/**
 * Desenhos de todos os frames de forma visíveis da página `pageId`, por `zIndex`
 * crescente (empate mantém a ordem dos frames).
 *
 * @throws Error se a página não existe.
 */
export function prepareShapeDrawings(template: EditxTemplate, pageId: string): ShapeFrameDrawing[] {
  const page = template.pages.find((candidate) => candidate.id === pageId);
  if (page === undefined) {
    throw new Error(`A página "${pageId}" não existe no template.`);
  }

  const drawings = page.frames
    .filter((frame): frame is ShapeFrame => frame.type === 'shape' && frame.visible)
    .map((frame) => {
      if (frame.transform.rotation !== 0) {
        console.warn(
          `Frame "${frame.id}": rotação ainda não é desenhada na F1; desenhado sem girar.`,
        );
      }
      return drawShapeFrame(frame, template.document);
    });

  // Array.prototype.sort é estável: empate de zIndex mantém a ordem da página.
  return drawings.sort((a, b) => a.zIndex - b.zIndex);
}
```

## Edição 2 — `src/canvas/FrameShape.test.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { ShapeFrame } from '../types/frame.types';
import { drawShapeFrame, prepareShapeDrawings, shapePath } from './FrameShape';

const template = (): EditxTemplate => structuredClone(catalogoSimplesExample);

/** A forma de fundo da capa do exemplo (rect, sólido #1D3557, sem traço, zIndex 0). */
function fundo(t: EditxTemplate): ShapeFrame {
  const frame = t.pages[0].frames.find((candidate) => candidate.id === 'frame-fundo-capa');
  if (frame?.type !== 'shape') throw new Error('o exemplo mudou: sem frame-fundo-capa');
  return frame;
}

const box = { left: 0, top: 0, width: 100, height: 50 };

describe('shapePath', () => {
  it('R1: retângulo sem raio e sem traço ocupa o frame', () => {
    expect(shapePath('rect', box, 0, 0)).toBe('M 0 0 H 100 V 50 H 0 Z');
  });

  it('R2: o traço recua o contorno meia espessura de cada lado', () => {
    expect(shapePath('rect', box, 0, 10)).toBe('M 5 5 H 95 V 45 H 5 Z');
  });

  it('R3: cantos arredondados descontam o recuo do raio', () => {
    expect(shapePath('rect', box, 20, 10)).toBe(
      'M 20 5 H 80 A 15 15 0 0 1 95 20 V 30 A 15 15 0 0 1 80 45 H 20 A 15 15 0 0 1 5 30 V 20 A 15 15 0 0 1 20 5 Z',
    );
  });

  it('R4: raio maior que a metade do lado menor é limitado', () => {
    expect(shapePath('rect', box, 40, 0)).toBe(
      'M 25 0 H 75 A 25 25 0 0 1 100 25 V 25 A 25 25 0 0 1 75 50 H 25 A 25 25 0 0 1 0 25 V 25 A 25 25 0 0 1 25 0 Z',
    );
  });

  it('R5: elipse recuada pelo traço, em duas meias-elipses', () => {
    expect(shapePath('ellipse', box, 0, 10)).toBe(
      'M 5 25 A 45 20 0 1 0 95 25 A 45 20 0 1 0 5 25 Z',
    );
  });

  it('R6: linha é horizontal no meio do frame, de borda a borda, sem recuo', () => {
    expect(shapePath('line', box, 0, 10)).toBe('M 0 25 H 100');
  });

  it('R7: traço mais grosso que o frame não inverte o contorno', () => {
    expect(shapePath('rect', { left: 0, top: 0, width: 10, height: 10 }, 0, 20)).toBe(
      'M 5 5 H 5 V 5 H 5 Z',
    );
  });
});

describe('drawShapeFrame / prepareShapeDrawings', () => {
  it('R8: o fundo da capa é um retângulo sólido do tamanho da página, sem traço', () => {
    const t = template();
    const drawing = drawShapeFrame(fundo(t), t.document);
    if (drawing.kind !== 'shape') throw new Error(`esperava forma, veio ${drawing.kind}`);
    expect(drawing.frame).toEqual(frameRect(fundo(t), t.document));
    // Sangria de 3 mm = 11,339 px; 210 × 297 mm = 793,701 × 1122,52 px.
    expect(drawing.path).toBe('M 11.339 11.339 H 805.039 V 1133.858 H 11.339 Z');
    expect(drawing.fill).toBe('#1D3557');
    expect(drawing.stroke).toBeNull();
  });

  it('R9: traço tracejado em mm vira px, recua o contorno e escala o tracejado', () => {
    const t = template();
    fundo(t).stroke = { color: '#000000', width: 0.75, style: 'dashed' };
    const drawing = drawShapeFrame(fundo(t), t.document);
    if (drawing.kind !== 'shape' || drawing.stroke === null) throw new Error('esperava traço');
    expect(drawing.stroke.width).toBeCloseTo(2.8346, 4);
    expect(drawing.stroke.dash?.[0]).toBeCloseTo(8.5039, 4);
    expect(drawing.stroke.dash?.[1]).toBeCloseTo(5.6693, 4);
    expect(drawing.stroke.cap).toBe('butt');
    expect(drawing.path.startsWith('M 12.756 12.756 ')).toBe(true);
  });

  it('R10: pontilhado é traço 0 com ponta redonda', () => {
    const t = template();
    fundo(t).stroke = { color: '#000000', width: 1, style: 'dotted' };
    const drawing = drawShapeFrame(fundo(t), t.document);
    if (drawing.kind !== 'shape' || drawing.stroke === null) throw new Error('esperava traço');
    expect(drawing.stroke.dash?.[0]).toBe(0);
    expect(drawing.stroke.dash?.[1]).toBeCloseTo(7.5591, 4);
    expect(drawing.stroke.cap).toBe('round');
  });

  it('R11: sem preenchimento, e linha nunca preenche', () => {
    const t = template();
    fundo(t).fill = { type: 'none' };
    expect(drawShapeFrame(fundo(t), t.document)).toMatchObject({ kind: 'shape', fill: null });
    const linha = template();
    fundo(linha).shape = 'line';
    const drawing = drawShapeFrame(fundo(linha), linha.document);
    if (drawing.kind !== 'shape') throw new Error(`esperava forma, veio ${drawing.kind}`);
    expect(drawing.fill).toBeNull();
    expect(drawing.path).toBe('M 11.339 572.598 H 805.039');
  });

  it('R12: polígono e SVG customizado saem como erro, com o motivo', () => {
    const t = template();
    fundo(t).shape = 'polygon';
    expect(drawShapeFrame(fundo(t), t.document)).toMatchObject({ kind: 'error' });
    const message = (frame: ShapeFrame) => {
      const drawing = drawShapeFrame(frame, t.document);
      return drawing.kind === 'error' ? drawing.message : '';
    };
    expect(message(fundo(t))).toContain('pontos');
    fundo(t).shape = 'custom-svg';
    fundo(t).customSvg = '<svg/>';
    expect(message(fundo(t))).toContain('sanitização');
  });

  it('R13: saem por zIndex crescente', () => {
    const t = template();
    t.pages[0].frames.unshift({ ...fundo(t), id: 'faixa', zIndex: 5 });
    expect(prepareShapeDrawings(t, 'page-capa').map((d) => d.frameId)).toEqual([
      'frame-fundo-capa',
      'faixa',
    ]);
  });

  it('R14: forma invisível não sai, e página inexistente lança', () => {
    const t = template();
    fundo(t).visible = false;
    expect(prepareShapeDrawings(t, 'page-capa')).toEqual([]);
    expect(() => prepareShapeDrawings(t, 'nao-existe')).toThrow('nao-existe');
  });
});
```

## Edição 3a — `src/canvas/CanvasEngine.ts` · import do tipo

**Âncora:**

```
import type { ImageFrameDrawing } from './FrameImage';
```

**Substituir por:**

```
import type { ImageFrameDrawing } from './FrameImage';
import type { ShapeFrameDrawing } from './FrameShape';
```

## Edição 3b — `src/canvas/CanvasEngine.ts` · campo

**Âncora:**

```
  private imageObjects: FabricObject[] = [];
```

**Substituir por:**

```
  private imageObjects: FabricObject[] = [];
  private shapeObjects: FabricObject[] = [];
```

## Edição 3c — `src/canvas/CanvasEngine.ts` · `showPage` limpa as formas também

**Âncora:**

```
    // Página nova = desenhos de texto e de imagem velhos não valem; quem chama manda os novos.
    this.clearText();
    this.clearImages();
```

**Substituir por:**

```
    // Página nova = desenhos de texto, imagem e forma velhos não valem; quem chama manda os novos.
    this.clearText();
    this.clearImages();
    this.clearShapes();
```

## Edição 3d — `src/canvas/CanvasEngine.ts` · `setShapeDrawings`

**Âncora** (as duas primeiras linhas do JSDoc de `setImageDrawings`):

```
  /**
   * Substitui os desenhos de imagem da página (DEC-019). Cada imagem é recortada pelo
```

**Substituir por:**

```
  /**
   * Substitui os desenhos de forma da página (DEC-020). Contornos prontos, já recuados para
   * o traço ficar por dentro do frame; polígono e SVG, ainda não desenhados, chegam como
   * erro e viram o retângulo vermelho tracejado.
   */
  setShapeDrawings(drawings: readonly ShapeFrameDrawing[]): void {
    this.assertAlive();
    this.clearShapes();

    for (const drawing of drawings) {
      let object: FabricObject;
      if (drawing.kind === 'shape') {
        const { stroke } = drawing;
        // Sem left/top: o Path se posiciona pelas próprias coordenadas (Fabric 6, DEC-018).
        object = new Path(drawing.path, {
          fill: drawing.fill,
          stroke: stroke === null ? null : stroke.color,
          strokeWidth: stroke === null ? 0 : stroke.width,
          strokeDashArray: stroke === null ? null : stroke.dash,
          strokeLineCap: stroke === null ? 'butt' : stroke.cap,
          selectable: false,
          evented: false,
        });
      } else {
        object = frameErrorRect(drawing.frame);
      }
      this.frameZ.set(object, drawing.zIndex);
      this.shapeObjects.push(object);
    }

    this.relayer();
  }

  /**
   * Substitui os desenhos de imagem da página (DEC-019). Cada imagem é recortada pelo
```

## Edição 3e — `src/canvas/CanvasEngine.ts` · `clearShapes`

**Âncora:**

```
  /** Remove só os objetos que `setImageDrawings` criou. */
  private clearImages(): void {
    for (const object of this.imageObjects) this.canvas.remove(object);
    this.imageObjects = [];
  }
```

**Substituir por:**

```
  /** Remove só os objetos que `setImageDrawings` criou. */
  private clearImages(): void {
    for (const object of this.imageObjects) this.canvas.remove(object);
    this.imageObjects = [];
  }

  /** Remove só os objetos que `setShapeDrawings` criou. */
  private clearShapes(): void {
    for (const object of this.shapeObjects) this.canvas.remove(object);
    this.shapeObjects = [];
  }
```

## Edição 3f — `src/canvas/CanvasEngine.ts` · `relayer` empilha as formas

**Âncora:**

```
  /**
   * Empilha os objetos de frame (imagem e texto) pelo `zIndex`, acima da página. Empate:
   * imagem embaixo do texto (foto sob a legenda); dentro de cada tipo, a ordem recebida.
   * Texto e imagem chegam em momentos diferentes (promessas separadas), por isso a ordem é
   * refeita a cada chegada.
   */
  private relayer(): void {
    const objects = [...this.imageObjects, ...this.textObjects];
```

**Substituir por:**

```
  /**
   * Empilha os objetos de frame (forma, imagem e texto) pelo `zIndex`, acima da página.
   * Empate: forma embaixo da imagem, imagem embaixo do texto (fundo, foto, legenda); dentro
   * de cada tipo, a ordem recebida. Os três chegam em momentos diferentes (texto e imagem
   * por promessas separadas), por isso a ordem é refeita a cada chegada.
   */
  private relayer(): void {
    const objects = [...this.shapeObjects, ...this.imageObjects, ...this.textObjects];
```

## Edição 4a — `src/ui/CanvasView.tsx` · import

**Âncora:**

```
import { decodeImageInBrowser, prepareImageDrawings } from '../canvas/FrameImage';
```

**Substituir por:**

```
import { decodeImageInBrowser, prepareImageDrawings } from '../canvas/FrameImage';
import { prepareShapeDrawings } from '../canvas/FrameShape';
```

## Edição 4b — `src/ui/CanvasView.tsx` · pintar as formas

**Âncora:**

```
    engine.showPage(template.document);
```

**Substituir por:**

```
    engine.showPage(template.document);
    // Formas não leem arquivo nem fonte: o desenho sai na hora, sem promessa.
    try {
      engine.setShapeDrawings(prepareShapeDrawings(template, pageId));
    } catch (error) {
      console.error('Falha ao preparar as formas da página:', error);
    }
```

## Edição 5 — `src/App.tsx` · substituir o arquivo inteiro

**Criar arquivo novo** (substitui o conteúdo atual inteiro):

```tsx
import { UrlProjectFiles } from './project/ProjectFiles';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Pasta de projeto do exemplo, servida pelo Vite a partir de `public/exemplo/` (DEC-019).
 * No escopo do módulo: a mesma instância a cada renderização (é dependência de efeito).
 */
const exampleFiles = new UrlProjectFiles('/exemplo/');

/**
 * Página mostrada: `?page=<id>` na URL (ex.: `?page=page-capa`), ou a de produto. Atalho de
 * desenvolvimento para conferir cada página do exemplo até existir a UI do editor.
 */
const pageId = new URLSearchParams(window.location.search).get('page') ?? 'page-produto';

/**
 * Host de desenvolvimento: mostra uma página do exemplo no canvas, ocupando a janela. Some
 * quando existir a UI do editor.
 */
export default function App() {
  return <CanvasView template={catalogoSimplesExample} pageId={pageId} files={exampleFiles} />;
}
```

## Edição 6a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-17, wo0013):** `FrameImage.ts` conferido na tela pelo chat; o item sai de «Em
Progresso» e o próximo do backlog é `FrameShape.ts`. A nota anterior (wo0012) saiu — o que ela registrava está em
DEC-019, no CHANGELOG e no log de 2026-11-17.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-18, wo0014):** formas no canvas (DEC-020) — `FrameShape.ts` feito, conferência de
tela pelo chat em «Em Progresso». A nota anterior (wo0013) saiu — o que ela registrava está no log de 2026-11-17.
```

## Edição 6b — `meta/STATUS.md` · versão

**Âncora:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 7 de 15 itens prontos)
```

**Substituir por:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 8 de 15 itens prontos)
```

## Edição 6c — `meta/STATUS.md` · Funcionando (forma)

**Âncora** (o COMEÇO da linha da imagem — troque só este trecho; o resto da linha, de ` — os frames de imagem da página` em diante, fica como está):

```
- **Imagem aparece no canvas** *(wo0012, DEC-019; conferido pelo chat no navegador embutido em 2026-11-17)*
```

**Substituir por:**

```
- **Forma aparece no canvas** *(wo0014, DEC-020; conferência de tela pendente — ver «Em Progresso»)* — os frames de forma da página viram contorno SVG calculado em `canvas/FrameShape.ts` (puro, testado) e pintado como `Path` (`CanvasEngine.setShapeDrawings`): `rect` com cantos arredondados, `ellipse` e `line` (horizontal, no meio do frame); preenchimento sólido ou nenhum; traço contínuo, tracejado ou pontilhado, por DENTRO do frame. Polígono (sem pontos no formato) e SVG customizado (sem sanitização) saem como retângulo vermelho. Forma, imagem e texto empilham pelo `zIndex` (empate: forma < imagem < texto). `?page=page-capa` na URL mostra a capa. Rotação ainda não é desenhada
- **Imagem aparece no canvas** *(wo0012, DEC-019; conferido pelo chat no navegador embutido em 2026-11-17)*
```

## Edição 6d — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
*Nada em progresso — próximo item do backlog é `FrameShape.ts`.*
```

**Substituir por:**

```
- **Conferência de tela do `FrameShape.ts`** — o chat confere no navegador embutido com o `npm run dev` do dono rodando (`?page=page-capa`: fundo azul sob o título branco; e retângulo, elipse, linha e traços desenhados num template montado na página). Depois dela, o próximo item do backlog é `SelectionManager.ts`.
```

## Edição 6e — `meta/STATUS.md` · Backlog

**Âncora:**

```
- [ ] `FrameShape.ts` — retângulo, elipse, linha básicos ← **próximo**
```

**Substituir por:**

```
- [x] `FrameShape.ts` — retângulo, elipse, linha básicos (wo0014, DEC-020; polígono e SVG customizado ainda não)
```

## Edição 6f — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**2026-11-17** — conferência de tela do FIX-002 feita pelo chat no navegador embutido: achou a regressão da wo0009
(zoom trocado com a página aberta), corrigida na wo0010 e conferida de novo — FIX-002 fechado (wo0011). Detalhe em
`logs/2026-11-17.md`.
Depois: análise de como o navegador lê imagem por caminho, decidida pelo dono (DEC-019), e `FrameImage.ts` (wo0012).
**Onde parou:** `FrameImage.ts` conferido na tela pelo chat (wo0013); o próximo item do backlog é `FrameShape.ts`.

---

*Próximo passo: `FrameShape.ts` (retângulo, elipse, linha) — WO a escrever pelo chat.*
```

**Substituir por:**

```
**2026-11-18** — `FrameShape.ts` (wo0014, DEC-020): retângulo, elipse e linha com o traço por dentro do frame. Detalhe
em `logs/2026-11-18.md`. Antes, em 2026-11-17: FIX-002 fechado, DEC-019 e `FrameImage.ts` conferido (`logs/2026-11-17.md`).
**Onde parou:** wo0014 aplicada; falta a conferência de tela do `FrameShape.ts` pelo chat.

---

*Próximo passo: conferência de tela do `FrameShape.ts` (chat, navegador embutido); depois, `SelectionManager.ts` — WO a escrever pelo chat.*
```

## Edição 7 — `meta/ROADMAP.md` · F1

**Âncora:**

```
- [ ] `FrameShape.ts` — retângulo, elipse, linha
```

**Substituir por:**

```
- [x] `FrameShape.ts` — retângulo, elipse, linha (traço por dentro do frame: wo0014, DEC-020; polígono e SVG ainda não)
```

## Edição 8 — `meta/CHANGELOG.md` · Adicionado

**Âncora:**

```
- Imagem no canvas — arquivos do projeto lidos por caminho relativo ao `.editx` (`project/ProjectFiles.ts`, `project/ProjectPath.ts`), posicionamento pelos 4 `fit` e o `align` (`canvas/ImageLayout.ts`) e desenho recortado pelo frame (`canvas/FrameImage.ts`, `CanvasEngine.setImageDrawings`); o validador passa a recusar caminho com `..` que sai da pasta do projeto; o exemplo ganha a pasta `public/exemplo/`. Ver DEC-019
```

**Substituir por:**

```
- Imagem no canvas — arquivos do projeto lidos por caminho relativo ao `.editx` (`project/ProjectFiles.ts`, `project/ProjectPath.ts`), posicionamento pelos 4 `fit` e o `align` (`canvas/ImageLayout.ts`) e desenho recortado pelo frame (`canvas/FrameImage.ts`, `CanvasEngine.setImageDrawings`); o validador passa a recusar caminho com `..` que sai da pasta do projeto; o exemplo ganha a pasta `public/exemplo/`. Ver DEC-019
- Forma no canvas — retângulo (com cantos arredondados), elipse e linha, preenchimento sólido ou nenhum, traço contínuo, tracejado ou pontilhado por dentro do frame (`canvas/FrameShape.ts`, `CanvasEngine.setShapeDrawings`); forma, imagem e texto empilhados pelo `zIndex`; `?page=` na URL do host de desenvolvimento. Ver DEC-020
```

## Edição 9 — `meta/DECISIONS.md` · DEC-020

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
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

## Template para novo ADR (copie e preencha)
```

## Edição 10 — `meta/IDEAS.md` · Adiadas (polígono)

**Âncora:**

```
  se mostrar lento no uso real.
```

**Substituir por:**

```
  se mostrar lento no uso real.
- **Polígono com pontos** — `shape: 'polygon'` existe no formato, mas sem os pontos (DEC-020); na F1 sai como
  retângulo vermelho de erro. **Volta quando** um template real precisar de selo ou estrela — aí acrescentar
  `points` (relativos ao frame, de 0 a 1) ao `ShapeFrame` e ao validador, com o exemplo usando o campo.
```

## Edição 11 — `logs/2026-11-18.md` · seção do Code

**Âncora** (última linha do arquivo):

```
- Polígono precisa de pontos no formato (`points` relativos ao frame) — adiada no IDEAS pela wo0014.
```

**Substituir por:** a mesma linha, uma linha em branco, e uma seção `## Code (execução) — wo0014` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`.

---

## Fora de escopo

- Polígono com pontos, SVG customizado e a sanitização dele.
- Rotação; seleção; mudar o exemplo `.editx` (a capa continua com UMA forma).
- Mexer em `FrameText.ts`, `FrameImage.ts`, `TextDrawing.ts`, no validador ou no formato.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **Nenhum teste importa `fabric`** (DEC-016) — `FrameShape.ts` não importa `fabric`.
- **Não passe `left`/`top` ao `Path` da forma** (DEC-018): ele se posiciona pelas coordenadas do contorno.
- **Edição 6c troca o COMEÇO de uma linha longa** — o resto da linha da imagem fica intacto.
- **Mantenha intactos** a limpeza do FIX-001 (`element.remove()`), os dois `ResizeObserver` (FIX-002) e as promessas de texto e imagem.
- **Não suba o `npm run dev` para «conferir»** — o dono deixa o dele rodando e o chat confere. Se subir, feche antes de commitar e diga.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/IDEAS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M src/App.tsx`, `M src/canvas/CanvasEngine.ts`, `M src/ui/CanvasView.tsx`, `?? logs/2026-11-18.md`, `?? meta/workorders/261118-wo0014-frame-de-forma.md`, `?? src/canvas/FrameShape.test.ts`, `?? src/canvas/FrameShape.ts` (13 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 151 testes** (137 + R1–R14). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida:** em `shapePath`, troque temporariamente `const inset = Math.min(strokeWidth / 2, rect.width / 2, rect.height / 2);` por `const inset = 0;` e rode `npm test` — esperado **falharem R2, R3, R5, R7 e R9** (5 testes). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `FrameShape.test.ts` → `shapePath` → o recuo do traço. **NÃO responde:** «presta?» na tela — se o Fabric pinta o traço por dentro e na ordem certa é a conferência de tela do chat.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "from 'fabric'" src/canvas/FrameShape.ts` = 0
      - `grep -c "this.relayer();" src/canvas/CanvasEngine.ts` = 3
      - `grep -c "this.clearShapes();" src/canvas/CanvasEngine.ts` = 2
      - `grep -c "element.remove();" src/ui/CanvasView.tsx` = 1 (FIX-001 intacto)
      - `grep -c "new ResizeObserver(onResize)" src/ui/CanvasView.tsx` = 2 (FIX-002 intacto)
      - `grep -c "^## DEC-020" meta/DECISIONS.md` = 1
      - `grep -c "^- \[x\] \`FrameShape.ts\`" meta/STATUS.md meta/ROADMAP.md` = 1 e 1
      - `grep -c "^- \*\*Polígono com pontos\*\*" meta/IDEAS.md` = 1
      - `grep -c "^## Code (execução) — wo0014" logs/2026-11-18.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0014.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Inclua as saídas cruas acima, `wc -l` de `FrameShape.ts`/`FrameShape.test.ts`/`CanvasEngine.ts`/`CanvasView.tsx`, e qualquer decisão sua. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-18.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/IDEAS.md meta/ROADMAP.md meta/STATUS.md meta/workorders/261118-wo0014-frame-de-forma.md src/App.tsx src/canvas/CanvasEngine.ts src/canvas/FrameShape.ts src/canvas/FrameShape.test.ts src/ui/CanvasView.tsx
```

```
git commit -m "feat(canvas): desenha formas com o traco por dentro do frame" -m "FrameShape calcula o contorno SVG de retangulo, elipse e linha, recuado meia espessura para o traco ficar dentro do frame; CanvasEngine pinta como Path e empilha forma, imagem e texto por zIndex. Poligono e SVG customizado saem como erro. ?page= na URL do host. DEC-020 (wo0014)."
```

```
git push
```
