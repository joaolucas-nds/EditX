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
