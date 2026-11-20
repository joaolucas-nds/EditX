# WO 0022 — Extrai a conversão desenho → objeto do Fabric para `FrameObjects.ts` (e registra a DEC-024)

> **Tipo:** mista — CÓDIGO (só mover código, sem mudança de comportamento) + DOC (DEC-024, IDEAS, CHANGELOG, STATUS, log).
> **Config sugerida:** Sonnet · `/effort` médio — mover código com a rede inteira rodando.
> **Pré-requisito:** escrita sobre `c1ecd2a` (`docs: registra a conferencia de tela da selecao`), já em `origin/main`; árvore limpa exceto os arquivos do chat (lista abaixo) e esta WO. 190 testes verdes (relatório da wo0020).
> **Base:** IDEAS, «Adiadas» — o item «`CanvasEngine.ts` acima das ~300 linhas» tinha o gatilho «quando o engine ganhar a próxima responsabilidade (a multi-seleção)»; a análise `meta/analises/261119-ANALISE-multi-selecao-alinhamento.md`, decidida pelo dono em 2026-11-20 (as quatro recomendações), põe a extração ANTES da multi-seleção. Decisão: DEC-024 (Edição 3).
> **Depende de:** wo0021 (aplicada: `c1ecd2a`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar; diferente = PARE e reporte):
> - `e3e7a7f62e4b922e5e1c5fd563c4a9b8a57ab977  meta/CONTEXT.md`
> - `b3a6a99ab53b635965b7a5a81d76bacf3e1a2501  meta/analises/261119-ANALISE-multi-selecao-alinhamento.md` (novo, `??`)
> - `dd50b3c6d0b13c2c542dd59f16354724af1503f0  logs/2026-11-20.md` (novo, `??`; você acrescenta a sua seção nele no fim — o hash vale só ANTES disso)
> **Arquivo substituído inteiro** (Edição 2) — `sha1sum` de ANTES, medido pelo chat no disco sobre `c1ecd2a`: `54765ba294f62432c8acebf56aa02f17b1e9ec45  src/canvas/CanvasEngine.ts`.
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte** — nunca chute um lugar próximo.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo a forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório. Arquivo novo que já existe: **PARE**. Arquivo substituído cujo `sha1sum` não é o de antes nem o do texto novo: **PARE**.
> **Âncoras lidas em** (pelo chat, 2026-11-20, no disco, neste turno, sobre `c1ecd2a`; recortadas por script e conferidas como ocorrência única): `src/canvas/CanvasEngine.ts` inteiro (substituído); `meta/DECISIONS.md` — «## Template para novo ADR (copie e preencha)» (1); `meta/IDEAS.md` — a última linha do item «Contorno ao passar o mouse» + o item «`CanvasEngine.ts` acima das ~300 linhas» (3 linhas), e as 3 linhas do «*Nenhuma ainda — …*» de «Concluídas»; `meta/CHANGELOG.md` — «### Modificado» (1); `meta/STATUS.md` — o bloco de «**Onde parou:** wo0020 aplicada e conferida …» até o rodapé.
> **Simulado pelo chat:** as edições aplicadas numa cópia do repositório a partir do texto DESTA WO (duas passadas, a segunda pulando todas); `tsc -p tsconfig.app.json --noEmit`, ESLint no repositório e `prettier --check` nos dois arquivos de código. A suíte e o build são do seu shell.

> **Canal dos meta neste ciclo = CODE** para `DECISIONS.md`, `IDEAS.md`, `CHANGELOG.md`, `STATUS.md` e a sua seção no log (Edições 3–7). `meta/CONTEXT.md`, a análise e o `logs/2026-11-20.md` (seção do chat) são do chat e já estão gravados — **só versione** (e acrescente a sua seção no log).

---

## 1. Por que

O `CanvasEngine.ts` passou das ~300 linhas da regra do CONTEXT com a wo0020 (388), e a multi-seleção vai mexer nele de novo. A conversão de cada desenho em objeto do Fabric não depende do estado do engine: vai para `canvas/FrameObjects.ts`, e o engine fica com o ciclo de vida, as listas e o empilhamento. **Nada muda na tela** — se mudar, a extração está errada. Junto, a WO registra a decisão do dono sobre a multi-seleção (DEC-024), para ela não depender da próxima WO.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos três arquivos do chat e no `CanvasEngine.ts` (cabeçalho). Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  190 passed (190)`.
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = ` M meta/CONTEXT.md`, `?? logs/2026-11-20.md`, `?? meta/analises/261119-ANALISE-multi-selecao-alinhamento.md`, `?? meta/workorders/261120-wo0022-extrai-frame-objects.md` (4 entradas).

## Edição 1 — `src/canvas/FrameObjects.ts` · criar (desenho → objeto do Fabric)

Os cinco trechos vêm do `CanvasEngine.ts` de hoje sem mudança de código: `FRAME_OBJECT`, `clipRect` e `frameErrorRect` iguais; o corpo de cada laço de `setTextDrawings`, `setShapeDrawings` e `setImageDrawings` vira uma função (reindentado; o do texto passa a `map`).

**Criar arquivo novo** (se já existir: **PARE e reporte**):

````
/**
 * FrameObjects.ts
 *
 * Desenho pronto → objetos do Fabric: o que cada tipo de frame vira no canvas (DEC-018,
 * DEC-019, DEC-020). Só constrói; quem adiciona, empilha e remove é o `CanvasEngine.ts`.
 * Saiu do engine por tamanho (wo0022), sem mudança de comportamento.
 */

import { FabricImage, Path, Rect } from 'fabric';
import type { FabricObject } from 'fabric';
import type { DrawRect, TextFrameDrawing } from '../text/TextDrawing';
import type { ImageFrameDrawing } from './FrameImage';
import type { ShapeFrameDrawing } from './FrameShape';

/**
 * Opções comuns aos objetos de frame: canto superior esquerdo como origem; o conteúdo nunca é
 * interativo — quem recebe o clique é a alça do `SelectionManager`.
 */
const FRAME_OBJECT = {
  originX: 'left',
  originY: 'top',
  selectable: false,
  evented: false,
} as const;

/** Recorte no mundo (`absolutePositioned`: não acompanha o objeto recortado). */
function clipRect(rect: DrawRect, radius: number): Rect {
  return new Rect({
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    rx: radius,
    ry: radius,
    originX: 'left',
    originY: 'top',
    absolutePositioned: true,
  });
}

/** Frame que não pôde ser desenhado: retângulo vermelho tracejado no lugar dele. */
function frameErrorRect(rect: DrawRect): Rect {
  return new Rect({
    ...FRAME_OBJECT,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    fill: 'rgba(217, 48, 37, 0.08)',
    stroke: '#D93025',
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    strokeUniform: true,
  });
}

/** Os objetos de um frame de texto: um `Path` por linha (com o recorte, nos modos fixed-*), ou o erro. */
export function textFrameObjects(drawing: TextFrameDrawing): FabricObject[] {
  if (drawing.kind !== 'text') return [frameErrorRect(drawing.frame)];
  return drawing.paths.map((data) => {
    // Sem left/top: o Path se posiciona pelas próprias coordenadas (Fabric 6, DEC-018).
    const path = new Path(data, { fill: drawing.fill, selectable: false, evented: false });
    if (drawing.clip !== null) path.clipPath = clipRect(drawing.clip, 0);
    return path;
  });
}

/**
 * O objeto de um frame de forma (DEC-020): o contorno pronto, já recuado para o traço ficar por
 * dentro do frame; polígono e SVG, ainda não desenhados, chegam como erro e viram o retângulo
 * vermelho tracejado.
 */
export function shapeFrameObject(drawing: ShapeFrameDrawing): FabricObject {
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
  return object;
}

/**
 * O objeto de um frame de imagem (DEC-019): a imagem recortada pelo frame, com o raio dos
 * cantos; área reservada vira retângulo cinza tracejado, e erro, o vermelho tracejado do texto.
 */
export function imageFrameObject(drawing: ImageFrameDrawing<HTMLImageElement>): FabricObject {
  let object: FabricObject;
  if (drawing.kind === 'image') {
    const { image, place } = drawing;
    object = new FabricImage(image.source, {
      ...FRAME_OBJECT,
      left: place.left,
      top: place.top,
      scaleX: place.width / image.width,
      scaleY: place.height / image.height,
    });
    object.clipPath = clipRect(drawing.frame, drawing.radius);
  } else if (drawing.kind === 'placeholder') {
    object = new Rect({
      ...FRAME_OBJECT,
      left: drawing.frame.left,
      top: drawing.frame.top,
      width: drawing.frame.width,
      height: drawing.frame.height,
      rx: drawing.radius,
      ry: drawing.radius,
      fill: '#F1F3F4',
      stroke: '#9AA0A6',
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      strokeUniform: true,
    });
  } else {
    object = frameErrorRect(drawing.frame);
  }
  return object;
}
````

## Edição 2 — `src/canvas/CanvasEngine.ts` · substituir (usa o FrameObjects)

O que muda: o comentário do módulo (uma frase), os imports (`FabricImage`, `Path` e `DrawRect` saem; entram as três funções do `FrameObjects`), os três helpers saem, e os três laços chamam `textFrameObjects`/`shapeFrameObject`/`imageFrameObject`. Nada mais.

**Substituir o arquivo inteiro por** (o `sha1sum` dele antes da edição tem de ser `54765ba294f62432c8acebf56aa02f17b1e9ec45` — Edição 0; diferente = **PARE**):

````
/**
 * CanvasEngine.ts
 *
 * Adaptador FINO do Fabric 6 (DEC-016): monta o canvas num elemento, desenha a
 * página (área de corte + guia de sangria), enquadra com zoom para caber e
 * libera tudo ao descartar. Toda conta mora em `PageGeometry.ts`; aqui só se
 * repassam valores ao Fabric; o que cada desenho vira no Fabric é do `FrameObjects.ts`
 * (wo0022). As alças de seleção são do `SelectionManager.ts`, que vive aqui dentro (DEC-023).
 */

import { Canvas, Rect } from 'fabric';
import type { FabricObject } from 'fabric';
import type { DocumentSettings } from '../template/TemplateSchema';
import type { TextFrameDrawing } from '../text/TextDrawing';
import type { ImageFrameDrawing } from './FrameImage';
import type { ShapeFrameDrawing } from './FrameShape';
import { imageFrameObject, shapeFrameObject, textFrameObjects } from './FrameObjects';
import { centeredOffset, fitZoom, pageBox } from './PageGeometry';
import type { CanvasSize, PageBox } from './PageGeometry';
import type { SelectableFrame } from './SelectionGeometry';
import { SelectionManager } from './SelectionManager';
import type { SelectionCallbacks } from './SelectionManager';

export interface CanvasEngineOptions {
  /** Margem em px CSS ao redor da página no enquadramento. Padrão: 32. */
  fitMargin?: number;
  /** Para onde vão o clique num frame e o fim de um arraste (DEC-023). */
  selection?: SelectionCallbacks;
}

export class CanvasEngine {
  private readonly canvas: Canvas;
  private readonly fitMargin: number;
  private readonly selection: SelectionManager;
  private pageObjects: FabricObject[] = [];
  private textObjects: FabricObject[] = [];
  private imageObjects: FabricObject[] = [];
  private shapeObjects: FabricObject[] = [];
  /** `zIndex` do frame de cada objeto de texto/imagem — a ordem de empilhamento (`relayer`). */
  private readonly frameZ = new WeakMap<FabricObject, number>();
  /** Id do frame de cada objeto de conteúdo — o que a alça desloca ao mover. */
  private readonly frameOf = new WeakMap<FabricObject, string>();
  private box: PageBox | null = null;
  private disposal: Promise<void> | null = null;
  /** px do dispositivo por px CSS do último `resize` (FIX-002); 1 até o primeiro. */
  private pixelRatio = 1;

  constructor(element: HTMLCanvasElement, options: CanvasEngineOptions = {}) {
    this.fitMargin = options.fitMargin ?? 32;
    this.canvas = new Canvas(element, {
      selection: false,
      backgroundColor: '#E5E5E5',
      renderOnAddRemove: false,
      // DESLIGADO de propósito (FIX-002): o retina do Fabric 6 trunca `css × dpr` e ignora
      // DPR < 1, e o buffer fica de tamanho diferente da tela. Quem dá os px do dispositivo
      // é o `resize`, já medidos pelo navegador.
      enableRetinaScaling: false,
      // O clique acerta o frame de cima pela ordem das alças, mesmo com outro selecionado
      // (sem isto o Fabric dá preferência ao objeto ativo — DEC-023).
      preserveObjectStacking: true,
    });
    this.selection = new SelectionManager(
      this.canvas,
      (frameId) => this.contentOf(frameId),
      options.selection ?? {},
    );
  }

  /** Desenha a página destas configurações (substitui a anterior) e reenquadra. */
  showPage(document: DocumentSettings): void {
    this.assertAlive();
    for (const object of this.pageObjects) this.canvas.remove(object);
    this.pageObjects = [];
    // Página nova = desenhos de texto, imagem e forma velhos não valem; quem chama manda os novos.
    this.clearText();
    this.clearImages();
    this.clearShapes();

    const box = pageBox(document);
    this.box = box;

    const common = {
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    } as const;

    const trim = new Rect({
      ...common,
      left: box.bleed,
      top: box.bleed,
      width: box.trimWidth,
      height: box.trimHeight,
      fill: '#FFFFFF',
      strokeWidth: 0,
    });
    this.pageObjects.push(trim);

    if (box.bleed > 0) {
      this.pageObjects.push(
        new Rect({
          ...common,
          left: 0,
          top: 0,
          width: box.width,
          height: box.height,
          fill: 'transparent',
          stroke: '#D93025',
          strokeWidth: 1,
          strokeDashArray: [4, 4],
          strokeUniform: true,
        }),
      );
    }

    this.canvas.add(...this.pageObjects);
    this.reframe();
    this.canvas.requestRenderAll();
  }

  /** Substitui os desenhos de texto da página. Contornos prontos, em coordenadas do mundo. */
  setTextDrawings(drawings: readonly TextFrameDrawing[]): void {
    this.assertAlive();
    this.clearText();

    for (const drawing of drawings) {
      for (const object of textFrameObjects(drawing)) {
        this.frameZ.set(object, drawing.zIndex);
        this.frameOf.set(object, drawing.frameId);
        this.textObjects.push(object);
      }
      // A caixa do texto que cresce só se conhece agora (depois do grow e da âncora).
      this.selection.updateBase(drawing.frameId, drawing.frame);
    }

    this.relayer();
  }

  /**
   * Substitui os desenhos de forma da página (DEC-020). Contornos prontos, já recuados para
   * o traço ficar por dentro do frame; polígono e SVG, ainda não desenhados, chegam como
   * erro e viram o retângulo vermelho tracejado.
   */
  setShapeDrawings(drawings: readonly ShapeFrameDrawing[]): void {
    this.assertAlive();
    this.clearShapes();

    for (const drawing of drawings) {
      const object = shapeFrameObject(drawing);
      this.frameZ.set(object, drawing.zIndex);
      this.frameOf.set(object, drawing.frameId);
      this.shapeObjects.push(object);
    }

    this.relayer();
  }

  /**
   * Substitui os desenhos de imagem da página (DEC-019). Cada imagem é recortada pelo
   * frame, com o raio dos cantos; área reservada vira retângulo cinza tracejado, e erro,
   * o vermelho tracejado do texto.
   */
  setImageDrawings(drawings: readonly ImageFrameDrawing<HTMLImageElement>[]): void {
    this.assertAlive();
    this.clearImages();

    for (const drawing of drawings) {
      const object = imageFrameObject(drawing);
      this.frameZ.set(object, drawing.zIndex);
      this.frameOf.set(object, drawing.frameId);
      this.imageObjects.push(object);
    }

    this.relayer();
  }

  /**
   * Troca as alças de seleção pelas destes frames (`selectableFrames`, na ordem do desenho).
   * Alça de frame que continua é atualizada, não recriada — a seleção sobrevive ao redesenho.
   */
  setFrames(frames: readonly SelectableFrame[]): void {
    this.assertAlive();
    this.selection.setFrames(frames);
  }

  /** Mostra este frame como selecionado, ou nenhum (`null`). */
  setSelected(frameId: string | null): void {
    this.assertAlive();
    this.selection.setSelected(frameId);
  }

  /** Devolve a alça e o conteúdo do frame ao lugar do documento (arraste que não mudou nada). */
  resetFrame(frameId: string): void {
    this.assertAlive();
    this.selection.resetFrame(frameId);
  }

  /**
   * Ajusta o canvas ao contêiner e reenquadra a página. O buffer recebe px do DISPOSITIVO;
   * o estilo é `100%` do contêiner, então o tamanho na tela acompanha o contêiner mesmo se
   * um evento de resize faltar (FIX-002). Um pixel do buffer cai num pixel da tela em
   * qualquer zoom do navegador. As coordenadas do canvas são px do dispositivo; o zoom de
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
    // 100%, não px: px fixos ficam velhos quando o zoom do navegador muda sem evento, e o
    // CSSOM ainda arredonda a 6 algarismos (1163.625 → "1163.62px", medido).
    this.canvas.setDimensions({ width: '100%', height: '100%' }, { cssOnly: true });
    // Controles de seleção são desenhados em px do canvas, que aqui são px do dispositivo.
    this.selection.setPixelRatio(size.pixelRatio);
    this.reframe();
    this.canvas.requestRenderAll();
  }

  /** Zoom da página em px CSS por px do mundo (1 = tamanho físico), independente do DPR. */
  getZoom(): number {
    this.assertAlive();
    return this.canvas.getZoom() / this.pixelRatio;
  }

  get disposed(): boolean {
    return this.disposal !== null;
  }

  /** Libera o Fabric. Idempotente: chamadas repetidas devolvem a mesma promessa. */
  dispose(): Promise<void> {
    this.disposal ??= this.canvas.dispose().then(() => undefined);
    return this.disposal;
  }

  /** Zoom para caber + centralização; sem página mostrada, não há o que enquadrar. */
  private reframe(): void {
    if (this.box === null) return;
    const width = this.canvas.getWidth();
    const height = this.canvas.getHeight();
    // width/height são px do dispositivo; a margem é configurada em px CSS.
    const zoom = fitZoom(width, height, this.box, this.fitMargin * this.pixelRatio);
    const { x, y } = centeredOffset(width, height, this.box, zoom);
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, x, y]);
  }

  /** Os objetos de conteúdo (forma, imagem, texto) do frame `frameId`, agora. */
  private contentOf(frameId: string): FabricObject[] {
    return [...this.shapeObjects, ...this.imageObjects, ...this.textObjects].filter(
      (object) => this.frameOf.get(object) === frameId,
    );
  }

  /** Remove só os objetos que `setTextDrawings` criou. */
  private clearText(): void {
    for (const object of this.textObjects) this.canvas.remove(object);
    this.textObjects = [];
  }

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

  /**
   * Empilha os objetos de frame (forma, imagem e texto) pelo `zIndex`, acima da página.
   * Empate: forma embaixo da imagem, imagem embaixo do texto (fundo, foto, legenda); dentro
   * de cada tipo, a ordem recebida. Os três chegam em momentos diferentes (texto e imagem
   * por promessas separadas), por isso a ordem é refeita a cada chegada. As alças não entram
   * aqui: remover a alça ativa limparia a seleção (`SelectionManager.setFrames`).
   */
  private relayer(): void {
    const objects = [...this.shapeObjects, ...this.imageObjects, ...this.textObjects];
    this.canvas.remove(...objects);
    objects.sort((a, b) => (this.frameZ.get(a) ?? 0) - (this.frameZ.get(b) ?? 0));
    this.canvas.add(...objects);
    this.canvas.requestRenderAll();
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('CanvasEngine já foi liberado.');
  }
}
````

## Edição 3 — `meta/DECISIONS.md` · DEC-024

**Âncora:**

````
## Template para novo ADR (copie e preencha)
````

**Substituir por:**

````
## DEC-024 — Multi-seleção: Shift+clique e retângulo, grupo que só move, alinhar e distribuir sem atalho, setas em mm

**Data:** 2026-11-20
**Status:** aceita
**Autor:** dono (as quatro escolhas de comportamento) + chat (análise e desenho)

### Contexto
A DEC-023 adiou a multi-seleção, o alinhamento, a distribuição e as setas para a WO seguinte. Análise:
`meta/analises/261119-ANALISE-multi-selecao-alinhamento.md` — leitura do fonte do Fabric 6.9.1 e das ferramentas de
referência (Figma, Canva, Adobe Express).

### Decisão
- **Gesto (dono):** Shift+clique soma e tira da seleção; arrastar no vazio seleciona por retângulo (basta tocar o
  frame); Ctrl+A seleciona os frames destravados da página. O grupo só MOVE — sem alças de redimensionar.
- **Referência (dono):** com dois ou mais frames, alinhar à caixa da seleção; com um frame sozinho, à área de corte da
  página (sem a sangria). Distribuir pede três ou mais e iguala os ESPAÇOS, com os frames das pontas parados.
- **Acionar (dono):** alinhar e distribuir entram como ações do documento, testadas, SEM atalho; os botões vêm com a
  Toolbar (UI mínima). Até lá a conferência de tela é pelo console (`__editx`).
- **Setas (dono):** 1 mm, e 10 mm com Shift (em documento em px: 1 px e 10 px), para um frame ou o grupo; toques
  seguidos na mesma seleção viram UMA entrada de desfazer até a seleção mudar ou passar 1 s sem tecla.
- **Como (chat):** `ActiveSelection` do Fabric com `selection: true`; o store segue sendo a fonte — os ids saem de
  `getActiveObjects()` no `mouse:down` e no `mouse:up` (o fim do gesto), nunca dos eventos `selection:*`; antes de
  reposicionar as alças no redesenho, o grupo é desfeito e remontado pelos ids do store (dentro do grupo a posição é
  relativa a ele); ao mover o grupo, o conteúdo de todos anda junto e a caixa de cada um sai de `getCoords()`; uma ação
  `setFrameTransforms` grava o gesto inteiro numa entrada; as contas de alinhar, distribuir e empurrar ficam num módulo
  puro testado em Node. Antes, a extração do `FrameObjects.ts` (wo0022), só de mover código.

### Alternativas consideradas
- **Só Shift+clique** — o Fabric liga o retângulo junto (`selection: true`); desligá-lo é trabalho a mais.
- **Redimensionar em grupo** — escala texto que cresce e imagem com `fit`; outra frente.
- **Sempre à caixa da seleção** — perde o «centralizar na página» de um frame sozinho.
- **Distribuir pelos centros** — com tamanhos diferentes, os espaços ficam desiguais.
- **Atalhos do Figma já** (Alt+A/D/W/S/H/V) — conflitos não medidos: Alt+D vai à barra de endereço no Chrome e no
  Edge; Alt+Shift troca o idioma do teclado no Windows; Ctrl+Alt é o AltGr no ABNT.
- **Setas em px de tela** (Canva, Figma) — 1 px CSS = 0,26 mm e muda com o zoom; o documento é em mm.
- **Uma entrada de desfazer por toque** — segurar a seta 1 s gera ~30 toques; o histórico guarda 100.

### Consequências
- **Positivas:** juntar frames sem código próprio de gesto; alinhar e distribuir testados sem tela.
- **Negativas:** até a Toolbar, alinhar e distribuir só existem pelo console.
- **Riscos:** alça no lugar errado depois de soltar um grupo (coordenada relativa ao grupo); store e Fabric divergirem
  num Shift+clique que tira um frame; toques de seta juntados de mais — os três vão para a conferência de tela e os
  testes da WO da multi-seleção.

---

## Template para novo ADR (copie e preencha)
````

## Edição 4a — `meta/IDEAS.md` · Adiadas: o item da extração sai (feito)

**Âncora:**

````
  uso mostrarem que se clica no frame errado (frames sobrepostos, frame de texto sem fundo).
- **`CanvasEngine.ts` acima das ~300 linhas** do CONTEXT (passou com a wo0020). Candidato a sair: a conversão de
  desenho em objeto do Fabric (`setTextDrawings`, `setImageDrawings`, `setShapeDrawings`). **Volta quando** o
  engine ganhar a próxima responsabilidade (a multi-seleção).
````

**Substituir por:**

````
  uso mostrarem que se clica no frame errado (frames sobrepostos, frame de texto sem fundo).
````

## Edição 4b — `meta/IDEAS.md` · Concluídas: a extração

**Âncora:**

````
*Nenhuma ainda — o boilerplate e o schema existem, mas nenhuma funcionalidade de runtime. Uma ideia só migra para
cá quando o código correspondente estiver de fato funcionando, não quando apenas
especificado no schema ou decidido em DECISIONS.md.*
````

**Substituir por:**

````
*Uma ideia só migra para cá quando o código correspondente estiver de fato funcionando, não quando apenas
especificado no schema ou decidido em DECISIONS.md.*

- **`CanvasEngine.ts` acima das ~300 linhas** (adiada na wo0020) — **feita na wo0022:** a conversão de desenho em
  objeto do Fabric foi para `canvas/FrameObjects.ts`; o engine foi de 388 para 294 linhas, sem mudança de
  comportamento.
````

## Edição 5 — `meta/CHANGELOG.md` · Modificado (extração)

**Âncora:**

````
### Modificado
````

**Substituir por:**

````
### Modificado
- `canvas/FrameObjects.ts` — a conversão de desenho em objeto do Fabric (texto, imagem, forma, erro) saiu do `CanvasEngine.ts`, que volta a ficar abaixo das ~300 linhas; sem mudança de comportamento (wo0022).
````

## Edição 6 — `meta/STATUS.md` · Onde parou e rodapé

**Âncora:**

````
**Onde parou:** wo0020 aplicada e conferida pelo chat no navegador embutido (wo0021): seleção, mover com o conteúdo,
redimensionar só a caixa até soltar, texto que cresce só no eixo livre, fundo travado sem alça, atalhos de desfazer, e
nenhum quadro sem a foto ou o texto depois de soltar. Fica para o dono, opcional: os controles com zoom real do
navegador (DPR ≠ 1).

---

*Próximo passo: multi-seleção com alinhamento, distribuição e setas (DEC-023) — análise ou WO a escrever pelo chat.*
````

**Substituir por:**

````
**Onde parou:** wo0020 aplicada e conferida pelo chat (wo0021). Em 2026-11-20 o dono decidiu a multi-seleção
(DEC-024) e a wo0022 extraiu o `FrameObjects.ts` do `CanvasEngine.ts` (sem mudança de comportamento). Detalhe em
`logs/2026-11-20.md`.

---

*Próximo passo: conferência de tela rápida da wo0022 pelo chat; depois, a WO da multi-seleção (DEC-024).*
````

## Edição 7 — `logs/2026-11-20.md` · a sua seção

O arquivo é novo, do chat, com a seção dele. Acrescente NO FIM a sua, `## Code (execução) — wo0022`, no formato do `meta/LOG-TEMPLATE.md` (Feito, Entregas, Arquivos modificados, Onde parei), com o corpo escrito por você. Não mexa na seção do chat.

---

## Fora de escopo

- Qualquer mudança de comportamento, de nome de método público do `CanvasEngine` ou de outro arquivo de código.
- A multi-seleção (próxima WO, escrita pelo chat depois desta aplicada).

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **Edição 4a é uma remoção:** o texto novo é um pedaço da âncora. Antes de aplicar, confira que a âncora está lá; depois, que o item sumiu de «Adiadas» e aparece uma vez só, em «Concluídas».
- **Não suba o `npm run dev` para «conferir»** — o dono deixa o dele rodando e o chat confere a tela.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**: ` M meta/CHANGELOG.md`, ` M meta/CONTEXT.md`, ` M meta/DECISIONS.md`, ` M meta/IDEAS.md`, ` M meta/STATUS.md`, ` M src/canvas/CanvasEngine.ts`, `?? logs/2026-11-20.md`, `?? meta/analises/261119-ANALISE-multi-selecao-alinhamento.md`, `?? meta/workorders/261120-wo0022-extrai-frame-objects.md`, `?? src/canvas/FrameObjects.ts` (10 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. `npm test` — **exatamente 190 testes** (nenhum novo, nenhum a menos: a extração não muda lógica testada). Cru.
- [ ] `wc -l src/canvas/CanvasEngine.ts src/canvas/FrameObjects.ts` — esperado **294** e **128**.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -c "new Path(\|new FabricImage(" src/canvas/CanvasEngine.ts` = 0
      - `grep -c "^export function \(textFrameObjects\|shapeFrameObject\|imageFrameObject\)" src/canvas/FrameObjects.ts` = 3
      - `grep -c "from './FrameObjects';" src/canvas/CanvasEngine.ts` = 1 (o import)
      - `grep -c "^## DEC-024" meta/DECISIONS.md` = 1
      - `grep -c "^## Template para novo ADR" meta/DECISIONS.md` = 1
      - `grep -c "^- \*\*\`CanvasEngine.ts\` acima das ~300 linhas\*\*" meta/IDEAS.md` = 1 (só em «Concluídas»)
      - `grep -c "^\*Nenhuma ainda" meta/IDEAS.md` = 0
      - `grep -c "^- \`canvas/FrameObjects.ts\`" meta/CHANGELOG.md` = 1
      - `grep -c "^\*Próximo passo: conferência de tela rápida da wo0022" meta/STATUS.md` = 1
      - `grep -c "^## Code (execução) — wo0022" logs/2026-11-20.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] **Teste de tela:** NÃO é seu. O chat confere no navegador embutido que nada mudou (texto, imagem, forma, seleção).
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0022.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo, com as saídas cruas acima. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-20.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/IDEAS.md meta/STATUS.md meta/analises/261119-ANALISE-multi-selecao-alinhamento.md meta/workorders/261120-wo0022-extrai-frame-objects.md src/canvas/CanvasEngine.ts src/canvas/FrameObjects.ts
```

```
git commit -m "refactor(canvas): extrai a conversao desenho para objeto do Fabric" -m "FrameObjects.ts recebe o que cada desenho vira no Fabric; o CanvasEngine fica com ciclo de vida, listas e empilhamento (388 -> 294 linhas), sem mudanca de comportamento. Registra a DEC-024 (multi-selecao). (wo0022)"
```

```
git push
```
