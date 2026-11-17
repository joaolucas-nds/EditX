import { UrlProjectFiles } from './project/ProjectFiles';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Pasta de projeto do exemplo, servida pelo Vite a partir de `public/exemplo/` (DEC-019).
 * No escopo do módulo: a mesma instância a cada renderização (é dependência de efeito).
 */
const exampleFiles = new UrlProjectFiles('/exemplo/');

/**
 * Host de desenvolvimento: mostra a página de PRODUTO do exemplo no canvas, ocupando a
 * janela. A capa ainda não serve para conferir: o título dela é branco sobre a forma de
 * fundo, e formas ainda não são desenhadas. Some quando existir a UI do editor.
 */
export default function App() {
  return (
    <CanvasView template={catalogoSimplesExample} pageId="page-produto" files={exampleFiles} />
  );
}
