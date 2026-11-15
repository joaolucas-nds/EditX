import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Host de desenvolvimento: mostra a página de PRODUTO do exemplo no canvas, ocupando a
 * janela. A capa ainda não serve para conferir: o título dela é branco sobre a forma de
 * fundo, e formas ainda não são desenhadas. Some quando existir a UI do editor.
 */
export default function App() {
  return <CanvasView template={catalogoSimplesExample} pageId="page-produto" />;
}
