import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';
import type { DocumentSettings } from '../template/TemplateSchema';

export interface CanvasViewProps {
  /** Configurações da página a mostrar. */
  settings: DocumentSettings;
}

/**
 * Contêiner do canvas: ocupa 100% do pai e reenquadra a página ao redimensionar.
 * O `<canvas>` é criado a cada montagem (não vem do JSX): o Fabric 6 recusa
 * reaproveitar elemento com `data-fabric`, e o StrictMode monta duas vezes (DEC-016).
 */
export function CanvasView({ settings }: CanvasViewProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  // Sempre a configuração mais recente, para o efeito de montagem desenhar já na criação.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const before = new Set(Array.from(host.childNodes));
    const element = document.createElement('canvas');
    host.appendChild(element);

    const engine = new CanvasEngine(element);
    engineRef.current = engine;
    engine.resize(host.clientWidth, host.clientHeight);
    engine.showPage(settingsRef.current);

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
          // Remove só o que ESTA montagem inseriu (o Fabric embrulha o <canvas> num div.canvas-container).
          for (const node of Array.from(host.childNodes)) {
            if (!before.has(node)) host.removeChild(node);
          }
        });
    };
  }, []);

  useEffect(() => {
    engineRef.current?.showPage(settings);
  }, [settings]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
}
