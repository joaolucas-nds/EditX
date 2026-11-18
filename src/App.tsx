import { UrlProjectFiles } from './project/ProjectFiles';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Pasta de projeto do exemplo, servida pelo Vite a partir de `public/exemplo/` (DEC-019).
 * No escopo do módulo: a mesma instância a cada renderização (é dependência de efeito).
 */
const exampleFiles = new UrlProjectFiles('/exemplo/');

/**
 * Página mostrada: `?page=<id>` na URL (ex.: `?page=page-capa`), ou a de produto. Atalho de
 * desenvolvimento para conferir cada página do exemplo até existir a UI do editor.
 */
const pageId = new URLSearchParams(window.location.search).get('page') ?? 'page-produto';

/**
 * Host de desenvolvimento: mostra uma página do exemplo no canvas, ocupando a janela. Some
 * quando existir a UI do editor.
 */
export default function App() {
  return <CanvasView template={catalogoSimplesExample} pageId={pageId} files={exampleFiles} />;
}
