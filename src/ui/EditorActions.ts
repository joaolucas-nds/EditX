/**
 * EditorActions.ts
 *
 * As ações do editor sobre a seleção que não são um gesto no canvas (DEC-024): selecionar tudo,
 * alinhar, distribuir e empurrar com as setas. Cada ação lê a seleção e as caixas DESENHADAS dos
 * frames (o canvas as fornece; sem canvas, usa as do `transform`), calcula com o
 * `SelectionLayout.ts` e grava o resultado numa entrada de desfazer (`setFrameTransforms`).
 * Sem React e sem Fabric: testável em Node. Alinhar e distribuir não têm atalho até a Toolbar;
 * no `npm run dev` ficam em `__editx.actions`.
 */

import {
  findFrame,
  sameTransform,
  selectableFrames,
  transformFromHandle,
} from '../canvas/SelectionGeometry';
import {
  alignRects,
  distributeRects,
  nudgeStepPx,
  trimRect,
  unionRect,
} from '../canvas/SelectionLayout';
import type { AlignEdge, DistributeAxis } from '../canvas/SelectionLayout';
import type { EditorStores } from '../store/documentStore';
import type { DrawRect } from '../text/TextDrawing';
import type { Transform } from '../types/frame.types';

/** As caixas desenhadas destes frames (px CSS do mundo); frame sem caixa conhecida fica de fora. */
export type FrameBoxes = (frameIds: readonly string[]) => ReadonlyMap<string, DrawRect>;

export interface EditorActions {
  /** Seleciona os frames destravados e visíveis da página mostrada (Ctrl+A). */
  selectAll(): void;
  /**
   * Alinha a seleção (DEC-024): dois ou mais frames, à caixa da seleção; um sozinho, à área de
   * corte da página. @returns `false` se nada mudou.
   */
  align(edge: AlignEdge): boolean;
  /** Distribui a seleção (três ou mais) igualando os espaços. @returns `false` se nada mudou. */
  distribute(axis: DistributeAxis): boolean;
  /**
   * Empurra a seleção um passo (`dx`, `dy` em -1, 0 ou 1; `big` = Shift: 10 mm). Toques seguidos
   * na mesma seleção viram uma entrada de desfazer. @returns `false` se não havia o que empurrar.
   */
  nudge(dx: number, dy: number, big: boolean): boolean;
}

/**
 * Cria as ações do editor sobre estes stores.
 *
 * @param stores - os stores do editor aberto
 * @param boxes - devolve quem fornece as caixas desenhadas agora (o canvas), ou `null` sem canvas
 */
export function createEditorActions(
  stores: EditorStores,
  boxes: () => FrameBoxes | null,
): EditorActions {
  /** A seleção válida (só frames selecionáveis da página) com a caixa de partida de cada um. */
  const selection = (): { ids: string[]; rects: DrawRect[] } => {
    const { template, pageId } = stores.document.getState();
    const selectable = new Map(selectableFrames(template, pageId).map((f) => [f.frameId, f.rect]));
    const ids = stores.selection.getState().selectedIds.filter((id) => selectable.has(id));
    const drawn = boxes()?.(ids);
    return { ids, rects: ids.map((id) => drawn?.get(id) ?? (selectable.get(id) as DrawRect)) };
  };

  /** Grava as caixas novas como `transform`, numa entrada; `false` se nenhuma mudou. */
  const apply = (
    ids: readonly string[],
    from: readonly DrawRect[],
    to: readonly DrawRect[],
    label: string,
    mergeKey?: string,
  ): boolean => {
    const { template } = stores.document.getState();
    const changes: Record<string, Transform> = {};
    ids.forEach((id, index) => {
      const frame = findFrame(template, id);
      if (frame === undefined) return;
      const next = transformFromHandle(
        frame.transform,
        from[index],
        to[index],
        template.document.unit,
      );
      if (!sameTransform(next, frame.transform)) changes[id] = next;
    });
    if (Object.keys(changes).length === 0) return false;
    stores.document.getState().setFrameTransforms(changes, { label, mergeKey });
    return true;
  };

  return {
    selectAll: () => {
      const { template, pageId } = stores.document.getState();
      stores.selection.getState().select(selectableFrames(template, pageId).map((f) => f.frameId));
    },
    align: (edge) => {
      const { ids, rects } = selection();
      if (ids.length === 0) return false;
      const bounds =
        ids.length >= 2 ? unionRect(rects) : trimRect(stores.document.getState().template.document);
      return apply(ids, rects, alignRects(rects, edge, bounds), `alinhar ${edge} (${ids.length})`);
    },
    distribute: (axis) => {
      const { ids, rects } = selection();
      if (ids.length < 3) return false;
      return apply(ids, rects, distributeRects(rects, axis), `distribuir ${axis} (${ids.length})`);
    },
    nudge: (dx, dy, big) => {
      const { ids, rects } = selection();
      if (ids.length === 0 || (dx === 0 && dy === 0)) return false;
      const step = nudgeStepPx(stores.document.getState().template.document.unit, big);
      const moved = rects.map((r) => ({ ...r, left: r.left + dx * step, top: r.top + dy * step }));
      // Mesma chave = mesma seleção: os toques seguidos juntam numa entrada (DEC-024).
      const key = `empurrar ${[...ids].sort().join(',')}`;
      return apply(ids, rects, moved, key, key);
    },
  };
}
