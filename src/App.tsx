import { useStore } from 'zustand';
import { UrlProjectFiles } from './project/ProjectFiles';
import { createEditorStores } from './store/documentStore';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import type { Transform } from './types/frame.types';
import { CanvasView } from './ui/CanvasView';
import { createEditorActions } from './ui/EditorActions';
import type { FrameBoxes } from './ui/EditorActions';
import { useEditorShortcuts } from './ui/EditorShortcuts';

/**
 * Pasta de projeto do exemplo, servida pelo Vite a partir de `public/exemplo/` (DEC-019).
 * No escopo do módulo: a mesma instância a cada renderização (é dependência de efeito).
 */
const exampleFiles = new UrlProjectFiles('/exemplo/');

/**
 * O editor aberto com o exemplo (DEC-021). Página inicial: `?page=<id>` na URL (ex.:
 * `?page=page-capa`), ou a de produto — atalho de desenvolvimento até existir a UI.
 */
const stores = createEditorStores(catalogoSimplesExample, {
  pageId: new URLSearchParams(window.location.search).get('page') ?? 'page-produto',
});

/** Quem fornece as caixas desenhadas: o `CanvasView` preenche enquanto o canvas existe. */
const canvasBoxes: { current: FrameBoxes | null } = { current: null };

/** Selecionar tudo, alinhar, distribuir e empurrar (DEC-024). No escopo do módulo: as mesmas sempre. */
const actions = createEditorActions(stores, () => canvasBoxes.current);

// Só no `npm run dev`: o console alcança os stores e as ações (ex.:
// `__editx.document.getState().undo()`, `__editx.actions.align('left')`).
if (import.meta.env.DEV) {
  (window as unknown as { __editx?: typeof stores & { actions: typeof actions } }).__editx = {
    ...stores,
    actions,
  };
}

/** O gesto no canvas troca a seleção (DEC-023, DEC-024). No escopo do módulo: a mesma função sempre. */
const selectFrames = (ids: string[]): void => stores.selection.getState().select(ids);

/** O arraste solto grava os `transform` novos — uma entrada de desfazer por gesto (DEC-021, DEC-024). */
const changeFrames = (changes: Record<string, Transform>): void =>
  stores.document.getState().setFrameTransforms(changes);

/**
 * Host de desenvolvimento: mostra a página ativa do documento no canvas, ocupando a janela,
 * com seleção (um ou vários frames), mover, redimensionar, setas e os atalhos de desfazer. Some
 * quando existir a UI do editor.
 */
export default function App() {
  const template = useStore(stores.document, (state) => state.template);
  const pageId = useStore(stores.document, (state) => state.pageId);
  const selectedIds = useStore(stores.selection, (state) => state.selectedIds);
  useEditorShortcuts(stores, actions);
  return (
    <CanvasView
      template={template}
      pageId={pageId}
      files={exampleFiles}
      selectedIds={selectedIds}
      onSelect={selectFrames}
      onFramesChange={changeFrames}
      boxes={canvasBoxes}
    />
  );
}
