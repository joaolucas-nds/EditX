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
