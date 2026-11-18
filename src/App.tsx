import { useStore } from 'zustand';
import { UrlProjectFiles } from './project/ProjectFiles';
import { createEditorStores } from './store/documentStore';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

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

// Só no `npm run dev`: o console alcança os stores (ex.: `__editx.document.getState().undo()`).
if (import.meta.env.DEV) (window as unknown as { __editx?: typeof stores }).__editx = stores;

/**
 * Host de desenvolvimento: mostra a página ativa do documento no canvas, ocupando a janela.
 * Some quando existir a UI do editor.
 */
export default function App() {
  const template = useStore(stores.document, (state) => state.template);
  const pageId = useStore(stores.document, (state) => state.pageId);
  return <CanvasView template={template} pageId={pageId} files={exampleFiles} />;
}
