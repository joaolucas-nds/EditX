/**
 * CanvasEngine.ts
 *
 * Adaptador FINO do Fabric 6 (DEC-016): monta o canvas num elemento, desenha a
 * página (área de corte + guia de sangria), enquadra com zoom para caber e
 * libera tudo ao descartar. Toda conta mora em `PageGeometry.ts`; aqui só se
 * repassam valores ao Fabric. Eventos de objeto entram com `SelectionManager.ts`.
 */

import { Canvas, Path, Rect } from 'fabric';
import type { FabricObject } from 'fabric';
import type { DocumentSettings } from '../template/TemplateSchema';
import type { TextFrameDrawing } from '../text/TextDrawing';
import { centeredOffset, fitZoom, pageBox } from './PageGeometry';
import type { CanvasSize, PageBox } from './PageGeometry';

export interface CanvasEngineOptions {
  /** Margem em px CSS ao redor da página no enquadramento. Padrão: 32. */
  fitMargin?: number;
}

export class CanvasEngine {
  private readonly canvas: Canvas;
  private readonly fitMargin: number;
  private pageObjects: FabricObject[] = [];
  private textObjects: FabricObject[] = [];
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
    });
  }

  /** Desenha a página destas configurações (substitui a anterior) e reenquadra. */
  showPage(document: DocumentSettings): void {
    this.assertAlive();
    for (const object of this.pageObjects) this.canvas.remove(object);
    this.pageObjects = [];
    // Página nova = desenhos de texto velhos não valem; quem chama manda os novos.
    this.clearText();

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

    const common = {
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    } as const;

    for (const drawing of drawings) {
      if (drawing.kind === 'text') {
        for (const data of drawing.paths) {
          // Sem left/top: o Path se posiciona pelas próprias coordenadas (Fabric 6, DEC-018).
          const path = new Path(data, { fill: drawing.fill, selectable: false, evented: false });
          if (drawing.clip !== null) {
            path.clipPath = new Rect({
              left: drawing.clip.left,
              top: drawing.clip.top,
              width: drawing.clip.width,
              height: drawing.clip.height,
              originX: 'left',
              originY: 'top',
              absolutePositioned: true,
            });
          }
          this.textObjects.push(path);
        }
      } else {
        this.textObjects.push(
          new Rect({
            ...common,
            left: drawing.frame.left,
            top: drawing.frame.top,
            width: drawing.frame.width,
            height: drawing.frame.height,
            fill: 'rgba(217, 48, 37, 0.08)',
            stroke: '#D93025',
            strokeWidth: 1,
            strokeDashArray: [4, 4],
            strokeUniform: true,
          }),
        );
      }
    }

    this.canvas.add(...this.textObjects);
    this.canvas.requestRenderAll();
  }

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

  /** Remove só os objetos que `setTextDrawings` criou. */
  private clearText(): void {
    for (const object of this.textObjects) this.canvas.remove(object);
    this.textObjects = [];
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('CanvasEngine já foi liberado.');
  }
}
