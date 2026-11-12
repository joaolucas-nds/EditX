/**
 * CanvasEngine.ts
 *
 * Adaptador FINO do Fabric 6 (DEC-016): monta o canvas num elemento, desenha a
 * página (área de corte + guia de sangria), enquadra com zoom para caber e
 * libera tudo ao descartar. Toda conta mora em `PageGeometry.ts`; aqui só se
 * repassam valores ao Fabric. Eventos de objeto entram com `SelectionManager.ts`.
 */

import { Canvas, Rect } from 'fabric';
import type { FabricObject } from 'fabric';
import type { DocumentSettings } from '../template/TemplateSchema';
import { centeredOffset, fitZoom, pageBox } from './PageGeometry';
import type { PageBox } from './PageGeometry';

export interface CanvasEngineOptions {
  /** Margem em px CSS ao redor da página no enquadramento. Padrão: 32. */
  fitMargin?: number;
}

export class CanvasEngine {
  private readonly canvas: Canvas;
  private readonly fitMargin: number;
  private pageObjects: FabricObject[] = [];
  private box: PageBox | null = null;
  private disposal: Promise<void> | null = null;

  constructor(element: HTMLCanvasElement, options: CanvasEngineOptions = {}) {
    this.fitMargin = options.fitMargin ?? 32;
    this.canvas = new Canvas(element, {
      selection: false,
      backgroundColor: '#E5E5E5',
      renderOnAddRemove: false,
      enableRetinaScaling: true,
    });
  }

  /** Desenha a página destas configurações (substitui a anterior) e reenquadra. */
  showPage(document: DocumentSettings): void {
    this.assertAlive();
    for (const object of this.pageObjects) this.canvas.remove(object);
    this.pageObjects = [];

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

  /** Ajusta o tamanho do canvas ao contêiner e reenquadra a página. */
  resize(width: number, height: number): void {
    this.assertAlive();
    this.canvas.setDimensions({ width, height });
    this.reframe();
    this.canvas.requestRenderAll();
  }

  getZoom(): number {
    this.assertAlive();
    return this.canvas.getZoom();
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
    const zoom = fitZoom(width, height, this.box, this.fitMargin);
    const { x, y } = centeredOffset(width, height, this.box, zoom);
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, x, y]);
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('CanvasEngine já foi liberado.');
  }
}
