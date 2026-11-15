/**
 * FrameText.ts
 *
 * Cola assíncrona entre o template e o desenho do texto: para cada frame de texto
 * visível da página, resolve o estilo, carrega a fonte e gera o desenho (DEC-018).
 * Não importa o Fabric — quem pinta é o `CanvasEngine.ts`.
 */

import { resolveStyle } from '../template/StyleRegistry';
import type { EditxTemplate } from '../template/TemplateSchema';
import type { FontRegistry } from '../text/FontRegistry';
import { drawTextFrame, frameRect } from '../text/TextDrawing';
import type { TextFrameDrawing } from '../text/TextDrawing';
import type { TextFrame } from '../types/frame.types';

/**
 * Desenhos de todos os frames de texto visíveis da página `pageId`, por `zIndex`
 * crescente (empate mantém a ordem dos frames). Frame com erro (estilo ou fonte)
 * vira um desenho `error` e não derruba os outros.
 *
 * @throws Error (promessa rejeitada) se a página não existe.
 */
export async function prepareTextDrawings(
  template: EditxTemplate,
  pageId: string,
  fonts: FontRegistry,
): Promise<TextFrameDrawing[]> {
  const page = template.pages.find((candidate) => candidate.id === pageId);
  if (page === undefined) {
    throw new Error(`A página "${pageId}" não existe no template.`);
  }

  const frames = page.frames.filter(
    (frame): frame is TextFrame => frame.type === 'text' && frame.visible,
  );

  const drawings = await Promise.all(
    frames.map(async (frame): Promise<TextFrameDrawing> => {
      if (frame.transform.rotation !== 0) {
        console.warn(
          `Frame "${frame.id}": rotação ainda não é desenhada na F1; desenhado sem girar.`,
        );
      }
      try {
        const style = resolveStyle(template.textStyles, frame.textStyle);
        const font = await fonts.load(style.fontFamily, style.fontWeight);
        return drawTextFrame(frame, template.document, template.textStyles, font);
      } catch (error) {
        console.error(`Falha ao desenhar o texto do frame "${frame.id}":`, error);
        return {
          kind: 'error',
          frameId: frame.id,
          zIndex: frame.zIndex,
          frame: frameRect(frame, template.document),
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  // Array.prototype.sort é estável: empate de zIndex mantém a ordem da página.
  return drawings.sort((a, b) => a.zIndex - b.zIndex);
}
