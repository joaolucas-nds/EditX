import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Host de desenvolvimento: mostra a página do exemplo no canvas, ocupando a
 * janela. Some quando existir a UI do editor (Toolbar/PropertiesPanel/LayersList).
 */
export default function App() {
  return <CanvasView settings={catalogoSimplesExample.document} />;
}
