/**
 * FrameImage.ts
 *
 * Cola assíncrona entre o template e o desenho das imagens: para cada frame de imagem
 * visível da página, lê os bytes pelo `ProjectFiles`, decodifica e calcula onde a imagem
 * cai (DEC-019). Não importa o Fabric e só toca no DOM em `decodeImageInBrowser` — o
 * decodificador é injetado, então os testes rodam em Node. Quem pinta é o `CanvasEngine.ts`.
 */

import type { ProjectFiles } from '../project/ProjectFiles';
import { normalizeProjectPath } from '../project/ProjectPath';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { DrawRect } from '../text/TextDrawing';
import type { ImageFrame } from '../types/frame.types';
import { placeImage } from './ImageLayout';
import { toPx } from './PageGeometry';

/** Imagem já decodificada: tamanho natural em px e o objeto que quem pinta entende. */
export interface DecodedImage<T> {
  width: number;
  height: number;
  source: T;
}

/** Decodifica os bytes de uma imagem; rejeita se não for uma imagem legível. */
export type ImageDecoder<T> = (blob: Blob) => Promise<DecodedImage<T>>;

export interface ImageDrawing<T> {
  kind: 'image';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  /** Caminho desenhado, como está no `.editx` — o `src`, ou o `fallback` se o `src` falhou. */
  path: string;
  image: DecodedImage<T>;
  /** Onde a imagem inteira cai (pode passar do frame: o frame recorta). */
  place: DrawRect;
  /** Raio dos cantos do recorte, em px CSS do mundo. */
  radius: number;
}

/** Frame de dados sem nada a mostrar (sem CSV ainda e sem `fallback`): área reservada. */
export interface ImagePlaceholder {
  kind: 'placeholder';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  radius: number;
}

export interface ImageDrawingError {
  kind: 'error';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  message: string;
}

export type ImageFrameDrawing<T> = ImageDrawing<T> | ImagePlaceholder | ImageDrawingError;

/**
 * Imagens já decodificadas, pelo caminho normalizado (DEC-023). Guarda a PROMESSA: dois frames
 * com o mesmo caminho leem o arquivo uma vez só. `null` = arquivo não encontrado. Falha e
 * arquivo não encontrado não ficam guardados — o arquivo consertado é tentado de novo.
 */
export type ImageCache<T> = Map<string, Promise<DecodedImage<T> | null>>;

/** Lê e decodifica `path`, passando pelo cache quando há um; `null` se o arquivo não existe. */
async function loadImage<T>(
  path: string,
  files: ProjectFiles,
  decode: ImageDecoder<T>,
  cache: ImageCache<T> | undefined,
): Promise<DecodedImage<T> | null> {
  const key = normalizeProjectPath(path) ?? path;
  const cached = cache?.get(key);
  if (cached !== undefined) return cached;
  const loading = files.read(path).then((blob) => (blob === null ? null : decode(blob)));
  cache?.set(key, loading);
  try {
    const image = await loading;
    if (image === null) cache?.delete(key);
    return image;
  } catch (error) {
    cache?.delete(key);
    throw error;
  }
}

/**
 * Desenhos de todos os frames de imagem visíveis da página `pageId`, por `zIndex`
 * crescente (empate mantém a ordem dos frames). Frame estático tenta o `src` e depois o
 * `fallback`; frame de dados ainda não tem valor de CSV e tenta só o `fallback`. Sem
 * caminho a tentar → `placeholder`; caminho(s) tentado(s) e nenhum legível → `error`.
 * Um frame que falha não derruba os outros.
 *
 * @param cache - imagens já decodificadas (DEC-023); sem ele, toda chamada lê e decodifica
 * @throws Error (promessa rejeitada) se a página não existe.
 */
export async function prepareImageDrawings<T>(
  template: EditxTemplate,
  pageId: string,
  files: ProjectFiles,
  decode: ImageDecoder<T>,
  cache?: ImageCache<T>,
): Promise<ImageFrameDrawing<T>[]> {
  const page = template.pages.find((candidate) => candidate.id === pageId);
  if (page === undefined) {
    throw new Error(`A página "${pageId}" não existe no template.`);
  }

  const frames = page.frames.filter(
    (frame): frame is ImageFrame => frame.type === 'image' && frame.visible,
  );

  const drawings = await Promise.all(
    frames.map(async (frame): Promise<ImageFrameDrawing<T>> => {
      if (frame.transform.rotation !== 0) {
        console.warn(
          `Frame "${frame.id}": rotação ainda não é desenhada na F1; desenhado sem girar.`,
        );
      }
      const rect = frameRect(frame, template.document);
      // `borderRadius` é em mm no formato, qualquer que seja a unidade do documento.
      const radius = toPx(frame.borderRadius, 'mm');
      const candidates = [frame.role === 'static' ? frame.src : undefined, frame.fallback].filter(
        (path): path is string => path !== undefined,
      );
      if (candidates.length === 0) {
        return {
          kind: 'placeholder',
          frameId: frame.id,
          zIndex: frame.zIndex,
          frame: rect,
          radius,
        };
      }

      const failures: string[] = [];
      for (const path of candidates) {
        try {
          const image = await loadImage(path, files, decode, cache);
          if (image === null) {
            failures.push(`${path}: não encontrado`);
            continue;
          }
          const place = placeImage(rect, image.width, image.height, frame.fit, frame.align);
          return {
            kind: 'image',
            frameId: frame.id,
            zIndex: frame.zIndex,
            frame: rect,
            path,
            image,
            place,
            radius,
          };
        } catch (error) {
          failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const message = `Nenhuma imagem legível — ${failures.join('; ')}`;
      console.error(`Falha ao desenhar a imagem do frame "${frame.id}":`, message);
      return { kind: 'error', frameId: frame.id, zIndex: frame.zIndex, frame: rect, message };
    }),
  );

  // Array.prototype.sort é estável: empate de zIndex mantém a ordem da página.
  return drawings.sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Decodificador do navegador: `Blob` → `<img>` já decodificado. Rejeita se o navegador
 * não reconhece a imagem.
 */
export async function decodeImageInBrowser(blob: Blob): Promise<DecodedImage<HTMLImageElement>> {
  const url = URL.createObjectURL(blob);
  const element = new Image();
  element.src = url;
  try {
    await element.decode();
  } finally {
    // A imagem já decodificada continua desenhável sem a URL; liberar evita reter o Blob.
    URL.revokeObjectURL(url);
  }
  return { width: element.naturalWidth, height: element.naturalHeight, source: element };
}
