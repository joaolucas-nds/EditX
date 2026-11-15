import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';
import { prepareTextDrawings } from '../canvas/FrameText';
import type { EditxTemplate } from '../template/TemplateSchema';
import { FontRegistry } from '../text/FontRegistry';

export interface CanvasViewProps {
  /** Template cujo documento e página serão mostrados. */
  template: EditxTemplate;
  /** Id da página a mostrar. */
  pageId: string;
}

/** No escopo do módulo: o cache das fontes dura entre montagens (StrictMode, troca de página). */
const fonts = new FontRegistry();

/**
 * Contêiner do canvas: ocupa 100% do pai e reenquadra a página ao redimensionar.
 * O `<canvas>` é criado a cada montagem (não vem do JSX): o Fabric 6 recusa
 * reaproveitar elemento com `data-fabric`, e o StrictMode monta duas vezes (DEC-016).
 */
export function CanvasView({ template, pageId }: CanvasViewProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  // Sempre o template mais recente, para o efeito de montagem desenhar já na criação.
  const templateRef = useRef(template);
  templateRef.current = template;

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const element = document.createElement('canvas');
    host.appendChild(element);

    const engine = new CanvasEngine(element);
    engineRef.current = engine;
    engine.resize(host.clientWidth, host.clientHeight);
    engine.showPage(templateRef.current.document);

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (!engine.disposed) engine.resize(width, height);
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      engineRef.current = null;
      engine
        .dispose()
        .catch((error: unknown) => console.error('Falha ao liberar o CanvasEngine:', error))
        .finally(() => {
          // O dispose() do Fabric já devolveu ESTE <canvas> ao lugar do div.canvas-container
          // (cleanupDOM é síncrono); aqui só ele sai. Não remova por diferença de filhos: no
          // StrictMode a montagem seguinte já inseriu o canvas dela no mesmo <div> (FIX-001).
          element.remove();
        });
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (engine === null) return;
    // Limpeza do efeito = o resultado assíncrono abaixo não vale mais (outro template/página
    // ou desmontagem): a bandeira evita desenhar texto velho ou num engine já liberado.
    let cancelado = false;

    engine.showPage(template.document);
    prepareTextDrawings(template, pageId, fonts).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setTextDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar o texto da página:', error),
    );

    return () => {
      cancelado = true;
    };
  }, [template, pageId]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
}
