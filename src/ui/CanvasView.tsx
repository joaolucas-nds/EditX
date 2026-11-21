import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import { CanvasEngine } from '../canvas/CanvasEngine';
import { canvasSize } from '../canvas/PageGeometry';
import { decodeImageInBrowser, prepareImageDrawings } from '../canvas/FrameImage';
import type { ImageCache } from '../canvas/FrameImage';
import { prepareShapeDrawings } from '../canvas/FrameShape';
import { prepareTextDrawings } from '../canvas/FrameText';
import {
  findFrame,
  sameTransform,
  selectableFrames,
  transformFromHandle,
} from '../canvas/SelectionGeometry';
import type { ProjectFiles } from '../project/ProjectFiles';
import type { EditxTemplate } from '../template/TemplateSchema';
import { FontRegistry } from '../text/FontRegistry';
import type { Transform } from '../types/frame.types';
import type { FrameBoxes } from './EditorActions';

export interface CanvasViewProps {
  /** Template cujo documento e página serão mostrados. */
  template: EditxTemplate;
  /** Id da página a mostrar. */
  pageId: string;
  /** Arquivos do projeto (imagens), lidos por caminho relativo ao `.editx` (DEC-019). */
  files: ProjectFiles;
  /** Ids dos frames selecionados (`selectionStore`); vários viram um grupo que só move (DEC-024). */
  selectedIds: readonly string[];
  /** Resultado de um gesto de seleção no canvas: os ids selecionados agora (vazio = nenhum). */
  onSelect: (ids: string[]) => void;
  /**
   * O usuário soltou um arraste que muda frames: o `transform` novo de cada um, já na unidade do
   * documento — uma entrada de desfazer para o gesto inteiro.
   */
  onFramesChange: (changes: Record<string, Transform>) => void;
  /** Recebe quem fornece as caixas desenhadas enquanto o canvas existe (`null` ao desmontar). */
  boxes?: { current: FrameBoxes | null };
}

/** No escopo do módulo: o cache das fontes dura entre montagens (StrictMode, troca de página). */
const fonts = new FontRegistry();

/**
 * Imagens já decodificadas, por pasta de projeto (DEC-023): sem isto cada mudança do documento
 * lê e decodifica de novo (30–50 ms por imagem, medido em 2026-11-18) e a imagem pisca a cada
 * arraste. Outra pasta de projeto = outro cache.
 */
const imageCaches = new WeakMap<ProjectFiles, ImageCache<HTMLImageElement>>();

function imageCacheFor(files: ProjectFiles): ImageCache<HTMLImageElement> {
  let cache = imageCaches.get(files);
  if (cache === undefined) {
    cache = new Map();
    imageCaches.set(files, cache);
  }
  return cache;
}

/**
 * Contêiner do canvas: ocupa 100% do pai e reenquadra a página ao redimensionar.
 * O `<canvas>` é criado a cada montagem (não vem do JSX): o Fabric 6 recusa
 * reaproveitar elemento com `data-fabric`, e o StrictMode monta duas vezes (DEC-016).
 */
export function CanvasView({
  template,
  pageId,
  files,
  selectedIds,
  onSelect,
  onFramesChange,
  boxes,
}: CanvasViewProps): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  // Sempre as props mais recentes: o efeito de montagem desenha já na criação, e os eventos do
  // canvas (criados uma vez) leem o template e as funções de agora.
  const latest = useRef({ template, onSelect, onFramesChange, boxes });
  latest.current = { template, onSelect, onFramesChange, boxes };

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;

    const element = document.createElement('canvas');
    host.appendChild(element);

    const engine = new CanvasEngine(element, {
      selection: {
        onSelect: (frameIds) => latest.current.onSelect(frameIds),
        onFramesChange: (list) => {
          const { template: current, onFramesChange: change } = latest.current;
          const changes: Record<string, Transform> = {};
          const unchanged: string[] = [];
          for (const { frameId, base, next } of list) {
            const frame = findFrame(current, frameId);
            if (frame === undefined) continue;
            const transform = transformFromHandle(
              frame.transform,
              base,
              next,
              current.document.unit,
            );
            if (sameTransform(transform, frame.transform)) unchanged.push(frameId);
            else changes[frameId] = transform;
          }
          // Arraste que, arredondado, não muda nada: o documento não muda e a página não vai ser
          // redesenhada — então as alças e o conteúdo voltam ao lugar aqui.
          if (Object.keys(changes).length === 0) engine.resetFrames(unchanged);
          else change(changes);
        },
      },
    });
    engineRef.current = engine;
    const boxRef = latest.current.boxes;
    if (boxRef !== undefined) boxRef.current = (frameIds) => engine.frameBoxes(frameIds);
    // Primeiro enquadramento com a melhor estimativa; o ResizeObserver dispara logo em
    // seguida com a medida exata em px do dispositivo e corrige (FIX-002).
    const rect = host.getBoundingClientRect();
    engine.resize(canvasSize(rect.width, rect.height, window.devicePixelRatio));
    engine.showPage(latest.current.template.document);

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
      if (boxRef !== undefined) boxRef.current = null;
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
    // Formas não leem arquivo nem fonte: o desenho sai na hora, sem promessa.
    try {
      engine.setShapeDrawings(prepareShapeDrawings(template, pageId));
    } catch (error) {
      console.error('Falha ao preparar as formas da página:', error);
    }
    // Alças na hora, pelo `transform`; a do texto que cresce se corrige quando o texto chega.
    try {
      engine.setFrames(selectableFrames(template, pageId));
    } catch (error) {
      console.error('Falha ao preparar as alças de seleção:', error);
    }
    prepareTextDrawings(template, pageId, fonts).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setTextDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar o texto da página:', error),
    );
    prepareImageDrawings(template, pageId, files, decodeImageInBrowser, imageCacheFor(files)).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setImageDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar as imagens da página:', error),
    );

    return () => {
      cancelado = true;
    };
  }, [template, pageId, files]);

  // Depois do efeito de desenho (mesma renderização, ordem de declaração): as alças já existem.
  // A lista vira texto para o efeito não rodar a cada array novo com os mesmos ids.
  const selectedKey = selectedIds.join('\n');
  useEffect(() => {
    engineRef.current?.setSelected(selectedKey === '' ? [] : selectedKey.split('\n'));
  }, [selectedKey, template, pageId]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />;
}
