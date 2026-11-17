import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';
import { canvasSize } from '../canvas/PageGeometry';
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
    // Primeiro enquadramento com a melhor estimativa; o ResizeObserver dispara logo em
    // seguida com a medida exata em px do dispositivo e corrige (FIX-002).
    const rect = host.getBoundingClientRect();
    engine.resize(canvasSize(rect.width, rect.height, window.devicePixelRatio));
    engine.showPage(templateRef.current.document);

    // Um callback para os dois observadores: a entrada traz as medidas CSS e em px do
    // dispositivo qualquer que seja a caixa observada.
    const onResize = (entries: ResizeObserverEntry[]): void => {
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
    };
    // DOIS observadores, porque cada um só dispara quando a SUA caixa muda (FIX-002):
    // - caixa de conteúdo: muda com o zoom do navegador (a janela mantém os px físicos);
    // - caixa em px do dispositivo: muda quando só o DPR muda (outro monitor).
    const observer = new ResizeObserver(onResize);
    observer.observe(host);
    const deviceObserver = new ResizeObserver(onResize);
    try {
      deviceObserver.observe(host, { box: 'device-pixel-content-box' });
    } catch {
      // Navegador sem a caixa (Safari): fica só o observador da caixa de conteúdo.
    }

    return () => {
      observer.disconnect();
      deviceObserver.disconnect();
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
