# WO 0012 — Imagens no canvas: caminhos do projeto, fonte de arquivos e `FrameImage.ts` (DEC-019)

> **Tipo:** mista — CÓDIGO (dois módulos puros novos + testes, fonte de arquivos + teste, cola assíncrona + teste, adaptador do Fabric, host React, validador) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — primeira vez que bytes de arquivo do projeto viram desenho; mexe no validador.
> **Pré-requisito:** escrita sobre `e3da928` (`docs: fecha o FIX-002 apos conferencia de tela da wo0010`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 105 testes verdes (relatório da wo0010; a wo0011 foi só de doc).
> **Base:** `meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md`, decidida pelo dono em 2026-11-17 (as três recomendações aceitas: Chrome/Edge com a pasta do projeto e Firefox/Safari só leitura; projeto = pasta; caminhos relativos ao `.editx` e `..` recusado). Decisão: DEC-019 (Edição 13). Esta WO entrega o item 5 da recomendação: o `FrameImage.ts` sobre o contrato `ProjectFiles`, com a fonte por URL servindo o exemplo; as fontes da pasta (Chrome/Edge e Firefox/Safari) entram com a UI de abrir projeto.
> **Depende de:** wo0011 (aplicada: `e3da928`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `bc7632336bbe64daf877b16a91a38a09c6ff07f3  meta/CONTEXT.md`
> - `f9702f7de12873d9b47a45b27db4c8e3326b7372  meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md` (novo, `??`)
> - `70e8f4f3509427e9ce2bc7d9a6a88f55664dcc3f  public/exemplo/imagens/_placeholder.png` (novo, `??`; PNG 1600×900 — o hash é o do arquivo NO DISCO: a gravação recomprimiu o PNG, pixels conferidos idênticos ao original)
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório. Arquivo novo que já existe: **PARE e reporte**.
> **Âncoras lidas em** (pelo chat, 2026-11-17, no disco, neste turno, sobre `e3da928`): `src/types/frame.types.ts` — o JSDoc de `fallback` (4 linhas); `src/template/ValidationRules.ts` — `import type { ValidationError, ValidationErrorCode } from './TemplateValidator';` e a regra `relativePath` inteira com o comentário; `src/template/TemplateSerializer.test.ts` — o `it('T16: fallback com caminho absoluto de Unix é invalid-value'` inteiro; `src/canvas/CanvasEngine.ts` — as linhas de import do `fabric` e de `TextFrameDrawing`, `export class CanvasEngine {`, `  private textObjects: FabricObject[] = [];`, as duas linhas `// Página nova = …` + `this.clearText();` do `showPage`, o método `setTextDrawings` inteiro e o `clearText` inteiro; `src/ui/CanvasView.tsx` — os imports, a interface `CanvasViewProps`, a assinatura da função, o trecho do `engine.showPage(template.document);` ao `);` do `prepareTextDrawings`, e `  }, [template, pageId]);`; `src/App.tsx` inteiro (substituído); `meta/STATUS.md` — nota de revisão (3 linhas), `**v0.0.0** …`, a linha `- **Texto aparece no canvas** …`, `*Nada em progresso — …*`, as linhas de backlog `FrameImage.ts` e `UI mínima`, «Última conversa» e rodapé; `meta/ROADMAP.md` — as linhas `FrameImage.ts` e `UI mínima` da F1; `meta/CHANGELOG.md` — a linha «Texto no canvas» em Adicionado e `- \`FrameImage.ts\` — frame de imagem com fit modes` em Planejado; `meta/DECISIONS.md` — `## Template para novo ADR (copie e preencha)`; `logs/2026-11-17.md` — a última linha.
> **Medido pelo chat** (2026-11-17, no código instalado): **fabric 6.9.1** — `FabricImage` exportado (`export { … FabricImage … }`); construtor `new FabricImage(element: ImageSource, options)` com `ImageSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement`; `remove(...objetos)` ignora objeto que não está no canvas (`indexOf === -1` → pula). **Repositório:** nenhuma imagem versionada antes desta WO; o exemplo só tem frame de imagem `role: 'data'` (`frame-foto-produto`, `fallback: './imagens/_placeholder.png'`, `fit: 'contain'`, `borderRadius: 4`); prefixos de teste em uso: D, F, G, L, P, S, T — os novos usam C, U, I e M.
> **Simulado pelo chat:** todas as edições aplicadas numa cópia do repositório a partir do texto DESTA WO; `tsc -p tsconfig.app.json --noEmit`, `eslint` e `prettier --check` nos arquivos tocados, e os testes NOVOS (C, U, I, M, T28–T30) rodados com uma réplica mínima do `vitest` sobre o JS compilado — resultado no relatório do chat. A suíte completa é do seu shell.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md` e o log (Edições 10–14). `meta/CONTEXT.md`, a análise e o PNG são do chat e já estão gravados — **só versione**. A seção do chat no log vai DENTRO da Edição 14 (o arquivo já tem seções do Code).

---

## 1. Por que

O `.editx` guarda imagens por caminho relativo a ele (DEC-002), e no navegador abrir um arquivo não dá acesso à pasta dele (análise de 2026-11-17). Esta WO cria a porta única por onde o app lê arquivos do projeto — `ProjectFiles.read(caminho) → Blob | null` — e as regras de caminho que todo leitor usa (`normalizeProjectPath`: `./` some, `\` vira `/`, `..` que sai da pasta é recusado, também pelo validador). Sobre ela, o `FrameImage.ts` lê, decodifica e posiciona cada imagem com os quatro `fit` e o `align`, recortada pelo frame com o raio dos cantos; o `CanvasEngine` pinta imagem e texto na ordem do `zIndex`. O exemplo passa a ter uma pasta de projeto em `public/exemplo/`, servida pelo Vite, e o frame de foto da página de produto mostra o `fallback` (a imagem de exemplo).

**Regras de desenho** (decididas aqui, registradas no DEC-019): frame de dados ainda não tem valor de CSV e usa só o `fallback`; frame estático tenta `src` e depois `fallback`. Sem caminho a tentar (dados sem `fallback`) → **área reservada** (retângulo cinza tracejado). Caminho(s) tentado(s) e nenhum legível → **erro** (o retângulo vermelho tracejado do texto). Vertical da imagem é sempre centralizado (o formato só tem `align` horizontal). `borderRadius` está em mm no formato, qualquer que seja a unidade do documento. Empate de `zIndex`: imagem embaixo do texto.

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos três arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  105 passed (105)` (do relatório da wo0010 — número diferente: relate o cru e siga).
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `M meta/CONTEXT.md`, `?? meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md`, `?? meta/workorders/261117-wo0012-frame-de-imagem.md`, `?? public/exemplo/imagens/_placeholder.png`.

## Edição 1 — `src/project/ProjectPath.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
/**
 * ProjectPath.ts
 *
 * Caminhos de arquivo DENTRO da pasta do projeto, PUROS (sem DOM): o `.editx` guarda
 * caminhos relativos a ele (DEC-002), e o navegador só lê dentro da pasta que o usuário
 * escolheu (DEC-019). Aqui todo caminho vira uma forma única, ou é recusado.
 */

/**
 * Forma única de um caminho relativo à pasta do projeto: `\` vira `/`, `.` e barras
 * repetidas somem, `..` volta uma pasta. Ex.: `./imagens\x.png` → `imagens/x.png`.
 *
 * @param path - caminho como veio do `.editx` ou do CSV
 * @returns o caminho normalizado (`''` = a própria pasta do projeto), ou `null` se ele é
 *   absoluto (`/x`, `C:\x`) ou sai da pasta do projeto (`../x`, `a/../../x`)
 */
export function normalizeProjectPath(path: string): string | null {
  const unified = path.replace(/\\/g, '/');
  if (unified.startsWith('/') || /^[A-Za-z]:/.test(unified)) return null;
  const parts: string[] = [];
  for (const segment of unified.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      // Um handle de pasta não sobe para a pasta-mãe: sair da raiz é recusado (DEC-019).
      if (parts.length === 0) return null;
      parts.pop();
    } else {
      parts.push(segment);
    }
  }
  return parts.join('/');
}
```

## Edição 2 — `src/project/ProjectFiles.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
/**
 * ProjectFiles.ts
 *
 * Contrato «bytes por caminho» para os arquivos do PROJETO — a pasta do `.editx` (DEC-019).
 * Quem desenha pede um caminho relativo ao `.editx` e recebe um `Blob`, sem saber se ele
 * veio de uma pasta escolhida pelo usuário, de um servidor ou, na F5, do disco via Tauri.
 */

import { normalizeProjectPath } from './ProjectPath';

/** Leitor dos arquivos de um projeto. */
export interface ProjectFiles {
  /**
   * Bytes do arquivo no caminho relativo ao `.editx`.
   *
   * @returns o arquivo, ou `null` se ele não existe ou o caminho é inválido (sai da pasta
   *   do projeto, ou aponta para a própria pasta)
   * @throws Error (promessa rejeitada) em falha de leitura que não é «não existe»
   */
  read(path: string): Promise<Blob | null>;
}

/** O `fetch` mínimo que o `UrlProjectFiles` usa — injetável para teste. */
export type FetchLike = (url: string) => Promise<Response>;

/**
 * Projeto servido por URL: `read('imagens/x.png')` busca `<base>imagens/x.png`. Serve o
 * exemplo de `public/exemplo/` no `npm run dev` — NÃO é como o usuário abre um projeto
 * (DEC-019: ele escolhe a pasta).
 */
export class UrlProjectFiles implements ProjectFiles {
  private readonly base: string;
  private readonly fetchFn: FetchLike;

  /**
   * @param baseUrl - URL da pasta do projeto (ex.: `/exemplo/`); a barra final é acrescentada se faltar
   * @param fetchFn - padrão: o `fetch` global
   */
  constructor(baseUrl: string, fetchFn: FetchLike = (url) => fetch(url)) {
    this.base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.fetchFn = fetchFn;
  }

  async read(path: string): Promise<Blob | null> {
    const normalized = normalizeProjectPath(path);
    if (normalized === null || normalized === '') return null;
    // Cada segmento codificado: nome com espaço ou acento vira URL válida.
    const url = this.base + normalized.split('/').map(encodeURIComponent).join('/');
    const response = await this.fetchFn(url);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Falha ao ler ${url}: HTTP ${response.status}.`);
    // Servidor de SPA (o do Vite) responde 200 com o index.html para arquivo que não existe.
    const type = response.headers.get('content-type') ?? '';
    if (type.startsWith('text/html')) return null;
    return response.blob();
  }
}
```

## Edição 3 — `src/canvas/ImageLayout.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
/**
 * ImageLayout.ts
 *
 * Onde a imagem cai dentro do frame, PURO (sem Fabric, sem DOM): os quatro `fit` e o
 * `align` do `ImageFrame` (DEC-019). O que passa da borda do frame é recortado por quem
 * desenha. Vertical é sempre centralizado — o formato só tem alinhamento horizontal.
 */

import type { DrawRect } from '../text/TextDrawing';
import type { ImageFit, ImageHorizontalAlign } from '../types/frame.types';

/**
 * Retângulo, no mundo do canvas, em que a imagem INTEIRA é desenhada.
 * - `fill`: ocupa o frame (deforma se a proporção difere);
 * - `contain`: o maior tamanho que cabe inteiro, sem deformar;
 * - `cover`: o menor tamanho que cobre o frame, sem deformar (o excesso é recortado);
 * - `none`: tamanho natural (1 px da imagem = 1 px CSS do mundo).
 * Sobra ou excesso na horizontal segue `align`; na vertical, centraliza. Imagem sem
 * tamanho (0 px) ocupa o frame.
 *
 * @param frame - retângulo do frame no mundo
 * @param imageWidth - largura natural da imagem, em px
 * @param imageHeight - altura natural da imagem, em px
 * @param fit - modo de encaixe do frame
 * @param align - alinhamento horizontal do frame
 */
export function placeImage(
  frame: DrawRect,
  imageWidth: number,
  imageHeight: number,
  fit: ImageFit,
  align: ImageHorizontalAlign,
): DrawRect {
  if (fit === 'fill' || imageWidth <= 0 || imageHeight <= 0) return { ...frame };
  let scale = 1;
  if (fit === 'contain') scale = Math.min(frame.width / imageWidth, frame.height / imageHeight);
  else if (fit === 'cover') scale = Math.max(frame.width / imageWidth, frame.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  // Sobra (positiva) ou excesso (negativo) na horizontal: o align decide onde fica.
  const slack = frame.width - width;
  const offset = align === 'left' ? 0 : align === 'right' ? slack : slack / 2;
  return { left: frame.left + offset, top: frame.top + (frame.height - height) / 2, width, height };
}
```

## Edição 4 — `src/canvas/FrameImage.ts` · criar arquivo novo (cola assíncrona; NÃO importa `fabric`)

**Criar arquivo novo:**

```ts
/**
 * FrameImage.ts
 *
 * Cola assíncrona entre o template e o desenho das imagens: para cada frame de imagem
 * visível da página, lê os bytes pelo `ProjectFiles`, decodifica e calcula onde a imagem
 * cai (DEC-019). Não importa o Fabric e só toca no DOM em `decodeImageInBrowser` — o
 * decodificador é injetado, então os testes rodam em Node. Quem pinta é o `CanvasEngine.ts`.
 */

import type { ProjectFiles } from '../project/ProjectFiles';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { DrawRect } from '../text/TextDrawing';
import type { ImageFrame } from '../types/frame.types';
import { placeImage } from './ImageLayout';
import { toPx } from './PageGeometry';

/** Imagem já decodificada: tamanho natural em px e o objeto que quem pinta entende. */
export interface DecodedImage<T> {
  width: number;
  height: number;
  source: T;
}

/** Decodifica os bytes de uma imagem; rejeita se não for uma imagem legível. */
export type ImageDecoder<T> = (blob: Blob) => Promise<DecodedImage<T>>;

export interface ImageDrawing<T> {
  kind: 'image';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  /** Caminho desenhado, como está no `.editx` — o `src`, ou o `fallback` se o `src` falhou. */
  path: string;
  image: DecodedImage<T>;
  /** Onde a imagem inteira cai (pode passar do frame: o frame recorta). */
  place: DrawRect;
  /** Raio dos cantos do recorte, em px CSS do mundo. */
  radius: number;
}

/** Frame de dados sem nada a mostrar (sem CSV ainda e sem `fallback`): área reservada. */
export interface ImagePlaceholder {
  kind: 'placeholder';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  radius: number;
}

export interface ImageDrawingError {
  kind: 'error';
  frameId: string;
  zIndex: number;
  frame: DrawRect;
  message: string;
}

export type ImageFrameDrawing<T> = ImageDrawing<T> | ImagePlaceholder | ImageDrawingError;

/**
 * Desenhos de todos os frames de imagem visíveis da página `pageId`, por `zIndex`
 * crescente (empate mantém a ordem dos frames). Frame estático tenta o `src` e depois o
 * `fallback`; frame de dados ainda não tem valor de CSV e tenta só o `fallback`. Sem
 * caminho a tentar → `placeholder`; caminho(s) tentado(s) e nenhum legível → `error`.
 * Um frame que falha não derruba os outros.
 *
 * @throws Error (promessa rejeitada) se a página não existe.
 */
export async function prepareImageDrawings<T>(
  template: EditxTemplate,
  pageId: string,
  files: ProjectFiles,
  decode: ImageDecoder<T>,
): Promise<ImageFrameDrawing<T>[]> {
  const page = template.pages.find((candidate) => candidate.id === pageId);
  if (page === undefined) {
    throw new Error(`A página "${pageId}" não existe no template.`);
  }

  const frames = page.frames.filter(
    (frame): frame is ImageFrame => frame.type === 'image' && frame.visible,
  );

  const drawings = await Promise.all(
    frames.map(async (frame): Promise<ImageFrameDrawing<T>> => {
      if (frame.transform.rotation !== 0) {
        console.warn(
          `Frame "${frame.id}": rotação ainda não é desenhada na F1; desenhado sem girar.`,
        );
      }
      const rect = frameRect(frame, template.document);
      // `borderRadius` é em mm no formato, qualquer que seja a unidade do documento.
      const radius = toPx(frame.borderRadius, 'mm');
      const candidates = [frame.role === 'static' ? frame.src : undefined, frame.fallback].filter(
        (path): path is string => path !== undefined,
      );
      if (candidates.length === 0) {
        return {
          kind: 'placeholder',
          frameId: frame.id,
          zIndex: frame.zIndex,
          frame: rect,
          radius,
        };
      }

      const failures: string[] = [];
      for (const path of candidates) {
        try {
          const blob = await files.read(path);
          if (blob === null) {
            failures.push(`${path}: não encontrado`);
            continue;
          }
          const image = await decode(blob);
          const place = placeImage(rect, image.width, image.height, frame.fit, frame.align);
          return {
            kind: 'image',
            frameId: frame.id,
            zIndex: frame.zIndex,
            frame: rect,
            path,
            image,
            place,
            radius,
          };
        } catch (error) {
          failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const message = `Nenhuma imagem legível — ${failures.join('; ')}`;
      console.error(`Falha ao desenhar a imagem do frame "${frame.id}":`, message);
      return { kind: 'error', frameId: frame.id, zIndex: frame.zIndex, frame: rect, message };
    }),
  );

  // Array.prototype.sort é estável: empate de zIndex mantém a ordem da página.
  return drawings.sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Decodificador do navegador: `Blob` → `<img>` já decodificado. Rejeita se o navegador
 * não reconhece a imagem.
 */
export async function decodeImageInBrowser(blob: Blob): Promise<DecodedImage<HTMLImageElement>> {
  const url = URL.createObjectURL(blob);
  const element = new Image();
  element.src = url;
  try {
    await element.decode();
  } finally {
    // A imagem já decodificada continua desenhável sem a URL; liberar evita reter o Blob.
    URL.revokeObjectURL(url);
  }
  return { width: element.naturalWidth, height: element.naturalHeight, source: element };
}
```

## Edição 5a — `src/canvas/CanvasEngine.ts` · imports

**Âncora:**

```
import { Canvas, Path, Rect } from 'fabric';
```

**Substituir por:**

```
import { Canvas, FabricImage, Path, Rect } from 'fabric';
```

## Edição 5b — `src/canvas/CanvasEngine.ts` · import de tipos do desenho

**Âncora:**

```
import type { TextFrameDrawing } from '../text/TextDrawing';
```

**Substituir por:**

```
import type { DrawRect, TextFrameDrawing } from '../text/TextDrawing';
import type { ImageFrameDrawing } from './FrameImage';
```

## Edição 5c — `src/canvas/CanvasEngine.ts` · ajudantes de módulo

**Âncora:**

```
export class CanvasEngine {
```

**Substituir por:**

```
/** Opções comuns aos objetos de frame: canto superior esquerdo como origem; nada interativo ainda. */
const FRAME_OBJECT = {
  originX: 'left',
  originY: 'top',
  selectable: false,
  evented: false,
} as const;

/** Recorte no mundo (`absolutePositioned`: não acompanha o objeto recortado). */
function clipRect(rect: DrawRect, radius: number): Rect {
  return new Rect({
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    rx: radius,
    ry: radius,
    originX: 'left',
    originY: 'top',
    absolutePositioned: true,
  });
}

/** Frame que não pôde ser desenhado: retângulo vermelho tracejado no lugar dele. */
function frameErrorRect(rect: DrawRect): Rect {
  return new Rect({
    ...FRAME_OBJECT,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    fill: 'rgba(217, 48, 37, 0.08)',
    stroke: '#D93025',
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    strokeUniform: true,
  });
}

export class CanvasEngine {
```

## Edição 5d — `src/canvas/CanvasEngine.ts` · campos

**Âncora:**

```
  private textObjects: FabricObject[] = [];
```

**Substituir por:**

```
  private textObjects: FabricObject[] = [];
  private imageObjects: FabricObject[] = [];
  /** `zIndex` do frame de cada objeto de texto/imagem — a ordem de empilhamento (`relayer`). */
  private readonly frameZ = new WeakMap<FabricObject, number>();
```

## Edição 5e — `src/canvas/CanvasEngine.ts` · `showPage` limpa as imagens também

**Âncora:**

```
    // Página nova = desenhos de texto velhos não valem; quem chama manda os novos.
    this.clearText();
```

**Substituir por:**

```
    // Página nova = desenhos de texto e de imagem velhos não valem; quem chama manda os novos.
    this.clearText();
    this.clearImages();
```

## Edição 5f — `src/canvas/CanvasEngine.ts` · `setTextDrawings` com `zIndex` e `setImageDrawings`

**Âncora** (o método inteiro):

```
  /** Substitui os desenhos de texto da página. Contornos prontos, em coordenadas do mundo. */
  setTextDrawings(drawings: readonly TextFrameDrawing[]): void {
    this.assertAlive();
    this.clearText();

    const common = {
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    } as const;

    for (const drawing of drawings) {
      if (drawing.kind === 'text') {
        for (const data of drawing.paths) {
          // Sem left/top: o Path se posiciona pelas próprias coordenadas (Fabric 6, DEC-018).
          const path = new Path(data, { fill: drawing.fill, selectable: false, evented: false });
          if (drawing.clip !== null) {
            path.clipPath = new Rect({
              left: drawing.clip.left,
              top: drawing.clip.top,
              width: drawing.clip.width,
              height: drawing.clip.height,
              originX: 'left',
              originY: 'top',
              absolutePositioned: true,
            });
          }
          this.textObjects.push(path);
        }
      } else {
        this.textObjects.push(
          new Rect({
            ...common,
            left: drawing.frame.left,
            top: drawing.frame.top,
            width: drawing.frame.width,
            height: drawing.frame.height,
            fill: 'rgba(217, 48, 37, 0.08)',
            stroke: '#D93025',
            strokeWidth: 1,
            strokeDashArray: [4, 4],
            strokeUniform: true,
          }),
        );
      }
    }

    this.canvas.add(...this.textObjects);
    this.canvas.requestRenderAll();
  }
```

**Substituir por:**

```
  /** Substitui os desenhos de texto da página. Contornos prontos, em coordenadas do mundo. */
  setTextDrawings(drawings: readonly TextFrameDrawing[]): void {
    this.assertAlive();
    this.clearText();

    for (const drawing of drawings) {
      if (drawing.kind === 'text') {
        for (const data of drawing.paths) {
          // Sem left/top: o Path se posiciona pelas próprias coordenadas (Fabric 6, DEC-018).
          const path = new Path(data, { fill: drawing.fill, selectable: false, evented: false });
          if (drawing.clip !== null) path.clipPath = clipRect(drawing.clip, 0);
          this.frameZ.set(path, drawing.zIndex);
          this.textObjects.push(path);
        }
      } else {
        const rect = frameErrorRect(drawing.frame);
        this.frameZ.set(rect, drawing.zIndex);
        this.textObjects.push(rect);
      }
    }

    this.relayer();
  }

  /**
   * Substitui os desenhos de imagem da página (DEC-019). Cada imagem é recortada pelo
   * frame, com o raio dos cantos; área reservada vira retângulo cinza tracejado, e erro,
   * o vermelho tracejado do texto.
   */
  setImageDrawings(drawings: readonly ImageFrameDrawing<HTMLImageElement>[]): void {
    this.assertAlive();
    this.clearImages();

    for (const drawing of drawings) {
      let object: FabricObject;
      if (drawing.kind === 'image') {
        const { image, place } = drawing;
        object = new FabricImage(image.source, {
          ...FRAME_OBJECT,
          left: place.left,
          top: place.top,
          scaleX: place.width / image.width,
          scaleY: place.height / image.height,
        });
        object.clipPath = clipRect(drawing.frame, drawing.radius);
      } else if (drawing.kind === 'placeholder') {
        object = new Rect({
          ...FRAME_OBJECT,
          left: drawing.frame.left,
          top: drawing.frame.top,
          width: drawing.frame.width,
          height: drawing.frame.height,
          rx: drawing.radius,
          ry: drawing.radius,
          fill: '#F1F3F4',
          stroke: '#9AA0A6',
          strokeWidth: 1,
          strokeDashArray: [4, 4],
          strokeUniform: true,
        });
      } else {
        object = frameErrorRect(drawing.frame);
      }
      this.frameZ.set(object, drawing.zIndex);
      this.imageObjects.push(object);
    }

    this.relayer();
  }
```

## Edição 5g — `src/canvas/CanvasEngine.ts` · `clearImages` e `relayer`

**Âncora:**

```
  /** Remove só os objetos que `setTextDrawings` criou. */
  private clearText(): void {
    for (const object of this.textObjects) this.canvas.remove(object);
    this.textObjects = [];
  }
```

**Substituir por:**

```
  /** Remove só os objetos que `setTextDrawings` criou. */
  private clearText(): void {
    for (const object of this.textObjects) this.canvas.remove(object);
    this.textObjects = [];
  }

  /** Remove só os objetos que `setImageDrawings` criou. */
  private clearImages(): void {
    for (const object of this.imageObjects) this.canvas.remove(object);
    this.imageObjects = [];
  }

  /**
   * Empilha os objetos de frame (imagem e texto) pelo `zIndex`, acima da página. Empate:
   * imagem embaixo do texto (foto sob a legenda); dentro de cada tipo, a ordem recebida.
   * Texto e imagem chegam em momentos diferentes (promessas separadas), por isso a ordem é
   * refeita a cada chegada.
   */
  private relayer(): void {
    const objects = [...this.imageObjects, ...this.textObjects];
    this.canvas.remove(...objects);
    objects.sort((a, b) => (this.frameZ.get(a) ?? 0) - (this.frameZ.get(b) ?? 0));
    this.canvas.add(...objects);
    this.canvas.requestRenderAll();
  }
```

## Edição 6a — `src/ui/CanvasView.tsx` · imports

**Âncora:**

```
import { prepareTextDrawings } from '../canvas/FrameText';
```

**Substituir por:**

```
import { decodeImageInBrowser, prepareImageDrawings } from '../canvas/FrameImage';
import { prepareTextDrawings } from '../canvas/FrameText';
import type { ProjectFiles } from '../project/ProjectFiles';
```

## Edição 6b — `src/ui/CanvasView.tsx` · prop `files`

**Âncora:**

```
  /** Id da página a mostrar. */
  pageId: string;
}
```

**Substituir por:**

```
  /** Id da página a mostrar. */
  pageId: string;
  /** Arquivos do projeto (imagens), lidos por caminho relativo ao `.editx` (DEC-019). */
  files: ProjectFiles;
}
```

## Edição 6c — `src/ui/CanvasView.tsx` · assinatura

**Âncora:**

```
export function CanvasView({ template, pageId }: CanvasViewProps): JSX.Element {
```

**Substituir por:**

```
export function CanvasView({ template, pageId, files }: CanvasViewProps): JSX.Element {
```

## Edição 6d — `src/ui/CanvasView.tsx` · preparar e pintar as imagens

**Âncora:**

```
    engine.showPage(template.document);
    prepareTextDrawings(template, pageId, fonts).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setTextDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar o texto da página:', error),
    );
```

**Substituir por:**

```
    engine.showPage(template.document);
    prepareTextDrawings(template, pageId, fonts).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setTextDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar o texto da página:', error),
    );
    prepareImageDrawings(template, pageId, files, decodeImageInBrowser).then(
      (drawings) => {
        if (!cancelado && !engine.disposed) engine.setImageDrawings(drawings);
      },
      (error: unknown) => console.error('Falha ao preparar as imagens da página:', error),
    );
```

## Edição 6e — `src/ui/CanvasView.tsx` · dependências do efeito

**Âncora:**

```
  }, [template, pageId]);
```

**Substituir por:**

```
  }, [template, pageId, files]);
```

## Edição 7 — `src/App.tsx` · substituir o arquivo inteiro

**Criar arquivo novo** (substitui o conteúdo atual inteiro):

```tsx
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
```

## Edição 8a — `src/types/frame.types.ts` · JSDoc de `fallback`

**Âncora:**

```
  /**
   * Caminho relativo (à pasta de imagens do `.editx`) usado quando a
   * imagem não é encontrada — evita que o lote quebre por uma linha de
   * CSV com nome de arquivo inválido ou ausente.
   */
```

**Substituir por:**

```
  /**
   * Caminho relativo ao arquivo `.editx` (como `src`; NÃO à `imageBasePath`)
   * usado quando a imagem não é encontrada — evita que o lote quebre por uma
   * linha de CSV com nome de arquivo inválido ou ausente. Ver DEC-019.
   */
```

## Edição 8b — `src/template/ValidationRules.ts` · import

**Âncora:**

```
import type { ValidationError, ValidationErrorCode } from './TemplateValidator';
```

**Substituir por:**

```
import { normalizeProjectPath } from '../project/ProjectPath';
import type { ValidationError, ValidationErrorCode } from './TemplateValidator';
```

## Edição 8c — `src/template/ValidationRules.ts` · `relativePath` recusa `..` que sai da pasta

**Âncora:**

```
/** DEC-002: caminhos de imagem são relativos ao `.editx`, nunca absolutos (`/x`, `\x`, `C:`). */
export const relativePath: Check = (v, p, c) => {
  if (typeof v !== 'string') typeError(c, p, 'um texto', v);
  else if (/^[/\\]/.test(v) || /^[A-Za-z]:/.test(v)) {
    fail(c, p, 'invalid-value', `${p}: o caminho deve ser relativo ao arquivo, não absoluto.`);
  }
};
```

**Substituir por:**

```
/**
 * DEC-002: caminhos de imagem são relativos ao `.editx`, nunca absolutos (`/x`, `\x`, `C:`).
 * DEC-019: e não saem da pasta do projeto (`../x`) — o navegador só lê dentro dela.
 */
export const relativePath: Check = (v, p, c) => {
  if (typeof v !== 'string') typeError(c, p, 'um texto', v);
  else if (/^[/\\]/.test(v) || /^[A-Za-z]:/.test(v)) {
    fail(c, p, 'invalid-value', `${p}: o caminho deve ser relativo ao arquivo, não absoluto.`);
  } else if (normalizeProjectPath(v) === null) {
    fail(c, p, 'invalid-value', `${p}: o caminho não pode sair da pasta do projeto (\`..\`).`);
  }
};
```

## Edição 9a — `src/template/TemplateSerializer.test.ts` · testes T28–T30

**Âncora:**

```
  it('T16: fallback com caminho absoluto de Unix é invalid-value', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 2).fallback = '/x.png';
    expectError(t, '$.pages[1].frames[2].fallback', 'invalid-value');
  });
```

**Substituir por:**

```
  it('T16: fallback com caminho absoluto de Unix é invalid-value', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 2).fallback = '/x.png';
    expectError(t, '$.pages[1].frames[2].fallback', 'invalid-value');
  });

  it('T28: fallback que sai da pasta do projeto é invalid-value', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 2).fallback = '../fora/x.png';
    expectError(t, '$.pages[1].frames[2].fallback', 'invalid-value');
  });

  it('T29: imageBasePath que sai da pasta do projeto é invalid-value', () => {
    const t = fresh();
    at(t, 'csvMapping').imageBasePath = './imagens/../../fotos';
    expectError(t, '$.csvMapping.imageBasePath', 'invalid-value');
  });

  it('T30: ".." que volta para dentro da pasta é válido', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 2).fallback = './imagens/../logo.png';
    at(t, 'csvMapping').imageBasePath = '.';
    expect(validateTemplate(t).ok).toBe(true);
  });
```

## Edição 9b — testes · quatro arquivos novos

**`src/project/ProjectPath.test.ts`** — criar:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeProjectPath } from './ProjectPath';

describe('normalizeProjectPath', () => {
  it('C1: "./" no início some', () => {
    expect(normalizeProjectPath('./imagens/x.png')).toBe('imagens/x.png');
  });

  it('C2: barra invertida vira barra', () => {
    expect(normalizeProjectPath('imagens\\sub\\x.png')).toBe('imagens/sub/x.png');
  });

  it('C3: barras repetidas e "." somem', () => {
    expect(normalizeProjectPath('imagens//./x.png')).toBe('imagens/x.png');
  });

  it('C4: ".." que fica dentro da pasta volta uma pasta', () => {
    expect(normalizeProjectPath('imagens/../logo.png')).toBe('logo.png');
  });

  it('C5: ".." que sai da pasta do projeto é recusado', () => {
    expect(normalizeProjectPath('../x.png')).toBeNull();
    expect(normalizeProjectPath('a/../../x.png')).toBeNull();
  });

  it('C6: caminho absoluto é recusado', () => {
    expect(normalizeProjectPath('/x.png')).toBeNull();
    expect(normalizeProjectPath('C:\\imagens\\x.png')).toBeNull();
    expect(normalizeProjectPath('c:x.png')).toBeNull();
  });

  it('C7: a própria pasta do projeto vira ""', () => {
    expect(normalizeProjectPath('.')).toBe('');
    expect(normalizeProjectPath('./')).toBe('');
    expect(normalizeProjectPath('')).toBe('');
  });
});
```

**`src/project/ProjectFiles.test.ts`** — criar:

```ts
import { describe, expect, it } from 'vitest';
import { UrlProjectFiles } from './ProjectFiles';

/** fetch falso: guarda os URLs pedidos e responde com o que a função devolver. */
function fakeFetch(respond: (url: string) => Response) {
  const urls: string[] = [];
  const fetchFn = (url: string) => {
    urls.push(url);
    return Promise.resolve(respond(url));
  };
  return { urls, fetchFn };
}

const png = () =>
  new Response(new Blob(['png'], { type: 'image/png' }), {
    status: 200,
    headers: { 'content-type': 'image/png' },
  });

describe('UrlProjectFiles', () => {
  it('U1: lê pelo caminho normalizado debaixo da base', async () => {
    const { urls, fetchFn } = fakeFetch(png);
    const blob = await new UrlProjectFiles('/exemplo', fetchFn).read('./imagens\\x.png');
    expect(urls).toEqual(['/exemplo/imagens/x.png']);
    expect(await blob?.text()).toBe('png');
  });

  it('U2: 404 é «não existe» (null)', async () => {
    const { fetchFn } = fakeFetch(() => new Response('', { status: 404 }));
    expect(await new UrlProjectFiles('/exemplo/', fetchFn).read('imagens/x.png')).toBeNull();
  });

  it('U3: outra falha HTTP rejeita com o status', async () => {
    const { fetchFn } = fakeFetch(() => new Response('', { status: 500 }));
    await expect(new UrlProjectFiles('/exemplo/', fetchFn).read('imagens/x.png')).rejects.toThrow(
      'HTTP 500',
    );
  });

  it('U4: index.html de servidor de SPA é «não existe»', async () => {
    const { fetchFn } = fakeFetch(
      () =>
        new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } }),
    );
    expect(await new UrlProjectFiles('/exemplo/', fetchFn).read('imagens/x.png')).toBeNull();
  });

  it('U5: caminho que sai da pasta nem chega ao fetch', async () => {
    const { urls, fetchFn } = fakeFetch(png);
    const files = new UrlProjectFiles('/exemplo/', fetchFn);
    expect(await files.read('../segredo.png')).toBeNull();
    expect(await files.read('.')).toBeNull();
    expect(urls).toEqual([]);
  });

  it('U6: nome com espaço e acento é codificado por segmento', async () => {
    const { urls, fetchFn } = fakeFetch(png);
    await new UrlProjectFiles('/exemplo/', fetchFn).read('imagens/pão de queijo.png');
    expect(urls).toEqual(['/exemplo/imagens/p%C3%A3o%20de%20queijo.png']);
  });
});
```

**`src/canvas/ImageLayout.test.ts`** — criar:

```ts
import { describe, expect, it } from 'vitest';
import { placeImage } from './ImageLayout';

const frame = { left: 10, top: 20, width: 200, height: 100 };

describe('placeImage', () => {
  it('I1: fill ocupa o frame, mesmo deformando', () => {
    expect(placeImage(frame, 50, 400, 'fill', 'left')).toEqual(frame);
  });

  it('I2: contain com imagem larga encosta nas laterais e centraliza na vertical', () => {
    expect(placeImage(frame, 400, 100, 'contain', 'center')).toEqual({
      left: 10,
      top: 45,
      width: 200,
      height: 50,
    });
  });

  it('I3: contain com imagem alta segue o align na horizontal', () => {
    // 100×200 cabe em 50×100: sobram 150 px na horizontal.
    expect(placeImage(frame, 100, 200, 'contain', 'left').left).toBe(10);
    expect(placeImage(frame, 100, 200, 'contain', 'center').left).toBe(85);
    expect(placeImage(frame, 100, 200, 'contain', 'right').left).toBe(160);
  });

  it('I4: cover com imagem quadrada cobre o frame e passa em cima e embaixo', () => {
    expect(placeImage(frame, 100, 100, 'cover', 'center')).toEqual({
      left: 10,
      top: -30,
      width: 200,
      height: 200,
    });
  });

  it('I5: cover com imagem larga: o excesso horizontal segue o align', () => {
    // 400×100 já cobre 200×100 na escala 1: passam 200 px na horizontal.
    expect(placeImage(frame, 400, 100, 'cover', 'left').left).toBe(10);
    expect(placeImage(frame, 400, 100, 'cover', 'center').left).toBe(-90);
    expect(placeImage(frame, 400, 100, 'cover', 'right').left).toBe(-190);
  });

  it('I6: none usa o tamanho natural, centralizado', () => {
    expect(placeImage(frame, 50, 20, 'none', 'center')).toEqual({
      left: 85,
      top: 60,
      width: 50,
      height: 20,
    });
  });

  it('I7: imagem sem tamanho ocupa o frame', () => {
    expect(placeImage(frame, 0, 100, 'contain', 'center')).toEqual(frame);
  });
});
```

**`src/canvas/FrameImage.test.ts`** — criar:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeProjectPath } from '../project/ProjectPath';
import type { ProjectFiles } from '../project/ProjectFiles';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import type { EditxTemplate } from '../template/TemplateSchema';
import { frameRect } from '../text/TextDrawing';
import type { ImageFrame } from '../types/frame.types';
import { prepareImageDrawings } from './FrameImage';
import type { DecodedImage } from './FrameImage';
import { toPx } from './PageGeometry';

const template = (): EditxTemplate => structuredClone(catalogoSimplesExample);

/** Projeto falso: caminho normalizado → conteúdo; o conteúdo «LxA» decodifica nesse tamanho. */
function fakeFiles(entries: Record<string, string>): ProjectFiles {
  return {
    read: (path) => {
      const key = normalizeProjectPath(path);
      const content = key === null ? undefined : entries[key];
      return Promise.resolve(content === undefined ? null : new Blob([content]));
    },
  };
}

/** Decodificador falso: «1600x900» → 1600×900; qualquer outra coisa rejeita. */
async function fakeDecode(blob: Blob): Promise<DecodedImage<string>> {
  const text = await blob.text();
  const match = /^(\d+)x(\d+)$/.exec(text);
  if (match === null) throw new Error(`não é imagem: ${text}`);
  return { width: Number(match[1]), height: Number(match[2]), source: text };
}

/** O frame de foto da página de produto do exemplo (dados, fallback, contain, raio 4 mm). */
function photo(t: EditxTemplate): ImageFrame {
  const frame = t.pages[1].frames[2];
  if (frame.type !== 'image') throw new Error('o exemplo mudou: frames[2] do produto não é imagem');
  return frame;
}

/** Troca o frame de foto por um estático com estes caminhos. */
function makeStatic(t: EditxTemplate, src: string, fallback?: string): void {
  const f = photo(t);
  const frame: ImageFrame = {
    id: f.id,
    type: 'image',
    role: 'static',
    src,
    fallback,
    transform: f.transform,
    fit: f.fit,
    align: f.align,
    borderRadius: f.borderRadius,
    zIndex: f.zIndex,
    lock: f.lock,
    visible: f.visible,
  };
  t.pages[1].frames[2] = frame;
}

const sample = { 'imagens/_placeholder.png': '1600x900', 'imagens/foto.png': '800x800' };

describe('prepareImageDrawings', () => {
  it('M1: frame de dados desenha o fallback, com contain e o raio em px', async () => {
    const t = template();
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    if (drawing.kind !== 'image') throw new Error(`esperava imagem, veio ${drawing.kind}`);
    const rect = frameRect(photo(t), t.document);
    expect(drawing.path).toBe('./imagens/_placeholder.png');
    expect(drawing.frame).toEqual(rect);
    // 1600×900 (1,78) é mais larga que o frame 190×120 mm (1,58): encosta nas laterais.
    expect(drawing.place.left).toBeCloseTo(rect.left, 6);
    expect(drawing.place.width).toBeCloseTo(rect.width, 6);
    expect(drawing.place.height).toBeCloseTo((rect.width * 900) / 1600, 6);
    expect(drawing.radius).toBeCloseTo(toPx(4, 'mm'), 6);
  });

  it('M2: frame de dados sem fallback vira área reservada', async () => {
    const t = template();
    photo(t).fallback = undefined;
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    expect(drawing.kind).toBe('placeholder');
  });

  it('M3: fallback que não existe vira erro com o caminho', async () => {
    const t = template();
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles({}), fakeDecode);
    if (drawing.kind !== 'error') throw new Error(`esperava erro, veio ${drawing.kind}`);
    expect(drawing.message).toContain('./imagens/_placeholder.png: não encontrado');
  });

  it('M4: frame estático desenha o src', async () => {
    const t = template();
    makeStatic(t, './imagens/foto.png', './imagens/_placeholder.png');
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    if (drawing.kind !== 'image') throw new Error(`esperava imagem, veio ${drawing.kind}`);
    expect(drawing.path).toBe('./imagens/foto.png');
    expect(drawing.image.width).toBe(800);
  });

  it('M5: src que não existe cai no fallback', async () => {
    const t = template();
    makeStatic(t, './imagens/sumiu.png', './imagens/_placeholder.png');
    const [drawing] = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    if (drawing.kind !== 'image') throw new Error(`esperava imagem, veio ${drawing.kind}`);
    expect(drawing.path).toBe('./imagens/_placeholder.png');
  });

  it('M6: src que não decodifica e sem fallback vira erro com o motivo', async () => {
    const t = template();
    makeStatic(t, './imagens/quebrada.png');
    const files = fakeFiles({ 'imagens/quebrada.png': 'lixo' });
    const [drawing] = await prepareImageDrawings(t, 'page-produto', files, fakeDecode);
    if (drawing.kind !== 'error') throw new Error(`esperava erro, veio ${drawing.kind}`);
    expect(drawing.message).toContain('não é imagem: lixo');
  });

  it('M7: frame invisível não é desenhado', async () => {
    const t = template();
    photo(t).visible = false;
    expect(await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode)).toEqual(
      [],
    );
  });

  it('M8: página inexistente rejeita', async () => {
    await expect(
      prepareImageDrawings(template(), 'nao-existe', fakeFiles(sample), fakeDecode),
    ).rejects.toThrow('nao-existe');
  });

  it('M9: saem por zIndex crescente', async () => {
    const t = template();
    const front = photo(t);
    t.pages[1].frames.unshift({ ...front, id: 'foto-fundo', zIndex: 1 });
    const drawings = await prepareImageDrawings(t, 'page-produto', fakeFiles(sample), fakeDecode);
    expect(drawings.map((d) => d.frameId)).toEqual(['foto-fundo', 'frame-foto-produto']);
  });
});
```

## Edição 10a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-17, wo0011):** FIX-002 conferido na tela pelo chat depois da wo0010 e fechado; o
item sai de «Em Progresso» e a nitidez entra no item do canvas em «Funcionando». A nota anterior (wo0010) saiu — o
que ela registrava está em FIX-002 e no log de 2026-11-17.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-17, wo0012):** imagens no canvas (DEC-019) — `FrameImage.ts` feito, conferência de
tela pelo chat em «Em Progresso»; backlog ganha «Abrir projeto = pasta»; corrigida a linha do texto, que ainda chamava
a nitidez de bug aberto. A nota anterior (wo0011) saiu — o que ela registrava está em FIX-002 e no log de 2026-11-17.
```

## Edição 10b — `meta/STATUS.md` · versão

**Âncora:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 6 de 14 itens prontos)
```

**Substituir por:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 7 de 15 itens prontos)
```

## Edição 10c — `meta/STATUS.md` · Funcionando (texto sem a frase velha + imagem)

**Âncora** (o COMEÇO da linha do texto, até o primeiro `—` inclusive — troque só este trecho; o resto da linha, de `os frames de texto da página` em diante, fica como está):

```
- **Texto aparece no canvas** *(conferido pelo dono na tela em 2026-11-15; nitidez fora do zoom 100% é bug aberto — ver «Quebrado»)* —
```

**Substituir por:**

```
- **Imagem aparece no canvas** *(wo0012, DEC-019; conferência de tela pendente — ver «Em Progresso»)* — os frames de imagem da página são lidos por caminho relativo ao `.editx` pelo contrato `ProjectFiles` (`project/ProjectFiles.ts`; no `npm run dev`, `UrlProjectFiles` serve a pasta do exemplo em `public/exemplo/`), decodificados e posicionados pelos 4 `fit` e o `align` (`canvas/ImageLayout.ts`, puro), recortados pelo frame com o raio dos cantos (`CanvasEngine.setImageDrawings`); estático tenta `src` e depois `fallback`, dados usa o `fallback`; sem caminho → área reservada cinza; nada legível → retângulo vermelho. Caminhos passam por `normalizeProjectPath` (`project/ProjectPath.ts`) e o validador recusa `..` que sai da pasta. Rotação ainda não é desenhada
- **Texto aparece no canvas** *(conferido pelo dono na tela em 2026-11-15; nítido em qualquer zoom desde o FIX-002)* —
```

## Edição 10d — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
*Nada em progresso — próximo item do backlog é `FrameImage.ts`.*
```

**Substituir por:**

```
- **Conferência de tela do `FrameImage.ts`** — o chat confere no navegador embutido com o `npm run dev` do dono rodando (a imagem de exemplo no frame de foto, `contain`, raio dos cantos, ordem sob o texto). Depois dela, o próximo item do backlog é `FrameShape.ts`.
```

## Edição 10e — `meta/STATUS.md` · Backlog

**Âncora:**

```
- [ ] `FrameImage.ts` — frame de imagem com fit modes ← **próximo**
```

**Substituir por:**

```
- [x] `FrameImage.ts` — frame de imagem com fit modes (wo0012, DEC-019; leitura por `ProjectFiles`, exemplo servido de `public/exemplo/`)
```

## Edição 10f — `meta/STATUS.md` · Backlog (abrir projeto)

**Âncora:**

```
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada)
```

**Substituir por:**

```
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList (sem estilização avançada)
- [ ] Abrir projeto = pasta — `ProjectFiles` por `showDirectoryPicker` no Chrome/Edge (handle no IndexedDB, grava o `.editx`) e por `<input webkitdirectory>` no Firefox/Safari (só leitura); junto da UI mínima — DEC-019
```

## Edição 10g — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**Onde parou:** canvas nítido em qualquer zoom; o próximo item do backlog é `FrameImage.ts`.

---

*Próximo passo: `FrameImage.ts` (frame de imagem com fit modes) — como o navegador lê a imagem por caminho relativo (DEC-002) ainda não está decidido; provável análise antes da WO, pelo chat.*
```

**Substituir por:**

```
Depois: análise de como o navegador lê imagem por caminho, decidida pelo dono (DEC-019), e `FrameImage.ts` (wo0012).
**Onde parou:** wo0012 aplicada; falta a conferência de tela do `FrameImage.ts` pelo chat.

---

*Próximo passo: conferência de tela do `FrameImage.ts` (chat, navegador embutido); depois, `FrameShape.ts` — WO a escrever pelo chat.*
```

## Edição 11 — `meta/ROADMAP.md` · F1

**Âncora:**

```
- [ ] `FrameImage.ts` — fit modes
```

**Substituir por:**

```
- [x] `FrameImage.ts` — fit modes (leitura por `ProjectFiles`, caminhos do projeto: wo0012, DEC-019)
```

**E, na mesma F1, âncora:**

```
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList
```

**Substituir por:**

```
- [ ] UI mínima: Toolbar + PropertiesPanel + LayersList
- [ ] Abrir projeto = pasta (Chrome/Edge com a pasta do projeto; Firefox/Safari só leitura — DEC-019)
```

## Edição 12 — `meta/CHANGELOG.md` · Adicionado e Planejado

**Âncora:**

```
- Texto no canvas — fontes Montserrat embarcadas (`public/fonts/`, `text/FontRegistry.ts`), motor de layout com os 4 modos de overflow (`text/TextLayout.ts`) e desenho como contorno das letras (`text/TextDrawing.ts`, `canvas/FrameText.ts`). Ver DEC-017 e DEC-018
```

**Substituir por:**

```
- Texto no canvas — fontes Montserrat embarcadas (`public/fonts/`, `text/FontRegistry.ts`), motor de layout com os 4 modos de overflow (`text/TextLayout.ts`) e desenho como contorno das letras (`text/TextDrawing.ts`, `canvas/FrameText.ts`). Ver DEC-017 e DEC-018
- Imagem no canvas — arquivos do projeto lidos por caminho relativo ao `.editx` (`project/ProjectFiles.ts`, `project/ProjectPath.ts`), posicionamento pelos 4 `fit` e o `align` (`canvas/ImageLayout.ts`) e desenho recortado pelo frame (`canvas/FrameImage.ts`, `CanvasEngine.setImageDrawings`); o validador passa a recusar caminho com `..` que sai da pasta do projeto; o exemplo ganha a pasta `public/exemplo/`. Ver DEC-019
```

**E, em «Planejado para v0.1.0», âncora:**

```
- `FrameImage.ts` — frame de imagem com fit modes
```

**Remover a linha inteira.** («Já aplicada» = a linha não existe mais.)

## Edição 13 — `meta/DECISIONS.md` · DEC-019

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-019 — Projeto = pasta; arquivos do projeto lidos por um contrato único (`ProjectFiles`)

**Data:** 2026-11-17
**Status:** aceita
**Autor:** dono (escolha das opções) + chat (análise)

### Contexto
O DEC-002 guarda imagens por caminho relativo ao `.editx`, mas no navegador abrir um arquivo não dá acesso à pasta
dele. `showDirectoryPicker` só existe no Chrome/Edge (Firefox: posição negativa; Safari: se opõe); `<input
webkitdirectory>` existe em todos, só leitura e sem persistência. Análise: `meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md`.

### Decisão
- **Projeto = pasta:** o usuário abre a pasta que contém o `.editx` e as imagens.
- **Um contrato só** para ler arquivos do projeto: `ProjectFiles.read(caminho) → Blob | null` (`src/project/ProjectFiles.ts`).
  Implementações: pasta por `showDirectoryPicker` no Chrome/Edge (handle no IndexedDB, grava o `.editx`); pasta por
  `webkitdirectory` no Firefox/Safari (só leitura); `UrlProjectFiles` só para o exemplo em desenvolvimento
  (`public/exemplo/`); Tauri na F5. As duas da pasta entram com a UI de abrir projeto.
- **Caminhos:** `src` e `fallback` relativos ao `.editx`; valor da coluna de imagem do CSV relativo a `imageBasePath`.
  Todo caminho passa por `normalizeProjectPath`; `..` que sai da pasta do projeto é recusado, também pelo validador.
- **Desenho** (wo0012): estático tenta `src` e depois `fallback`; dados (sem CSV ainda) tenta o `fallback`; sem
  caminho → área reservada; nada legível → erro. Vertical sempre centralizado; `borderRadius` em mm; empate de
  `zIndex` põe a imagem embaixo do texto.

### Alternativas consideradas
- **Copiar as imagens para o armazenamento do navegador (OPFS/IndexedDB)** — a pasta deixaria de ser a fonte de
  verdade; cópias divergem em silêncio.
- **Base64 sempre** — já recusado no DEC-002.
- **Esperar o Tauri (F5)** — travaria a F3 inteira.
- **Só Chrome/Edge na F1** — mais barato, mas o editor não abriria no Firefox/Safari; o dono escolheu manter os dois.

### Consequências
- **Positivas:** quem desenha não sabe de onde vêm os bytes; o Tauri entra pela mesma porta; caminho inválido é pego
  ao abrir o arquivo, não no meio de um lote.
- **Negativas:** duas implementações de navegador para manter; no Firefox/Safari salvar = baixar um `.editx` novo e
  a pasta é escolhida de novo a cada sessão.
- **Riscos:** caixa de nome de arquivo trocada (`Coca.JPG` × `coca.jpg`) — o `ImageResolver.ts` procura sem diferenciar
  caixa; permissão de pasta negada ou esquecida; pasta enorme no `webkitdirectory` (não medido). Armadilhas no CONTEXT.

---

## Template para novo ADR (copie e preencha)
```

## Edição 14 — `logs/2026-11-17.md` · seção do chat (análise e wo0012) e seção do Code

**Âncora** (última linha do arquivo):

```
- `FrameImage.ts` (provável análise antes da WO, pelo chat).
```

**Substituir por:**

```
- `FrameImage.ts` (provável análise antes da WO, pelo chat).

## Chat (planejamento) — análise das imagens e wo0012

### ✅ Feito
- Relatório da wo0011 lido (`e3da928` empurrado) e arquivado.
- Análise `meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md`: no navegador abrir um arquivo não dá acesso
  à pasta dele; `showDirectoryPicker` só no Chrome/Edge (Firefox negativo, Safari se opõe); `webkitdirectory` em todos,
  só leitura; persistência de pasta por handle no IndexedDB desde o Chrome 122 [pesquisado na web]. Achados no
  repositório: o validador aceitava `..`; o JSDoc de `fallback` contradizia o DEC-002 e o exemplo; nenhuma imagem
  versionada (nem o `placeholder.png` citado no CONTEXT).
- Dono aceitou as três recomendações → DEC-019 (pela wo0012).
- Imagem de exemplo `public/exemplo/imagens/_placeholder.png` (1600×900, gerada pelo chat). A gravação no disco
  recomprimiu o PNG (8.812 → 14.582 bytes); pixels conferidos idênticos [medido: diferença de imagem vazia].
- CONTEXT (estrutura, arquitetura, três armadilhas) e status da análise gravados; wo0012 escrita e simulada numa cópia.

### ⚖️ Decisões tomadas
- DEC-019 — projeto = pasta; `ProjectFiles`; caminhos relativos ao `.editx`, `..` recusado.

### ➡️ Próximos passos
- Conferência de tela do `FrameImage.ts` (chat, navegador embutido); depois `FrameShape.ts`.
```

E depois dela, uma linha em branco e uma seção `## Code (execução) — wo0012` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`.

---

## Fora de escopo

- As implementações de `ProjectFiles` por pasta (`showDirectoryPicker`, `webkitdirectory`) e a UI de abrir projeto.
- `ImageResolver.ts` (CSV), `imageBasePath` em uso, «Empacotar tudo» (base64).
- Rotação; `FrameShape.ts`; texto sobre a área reservada.
- Mexer em `TextDrawing.ts`, `FrameText.ts`, `TextLayout.ts` ou no exemplo `.editx`.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **O PNG é binário:** `git add` normal; não abra nem «normalize» fim de linha nele. Se o Git avisar LF/CRLF sobre ele, PARE e reporte (seria um `.gitattributes` tratando PNG como texto).
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** tipos só via `import type` (como está no texto).
- **Nenhum teste importa `fabric`** (DEC-016) — `FrameImage.ts`, `ImageLayout.ts` e `project/*` não importam `fabric`.
- **Edição 12, segunda parte, é REMOÇÃO** — a linha em «Planejado» sai inteira; não deixe linha em branco a mais.
- **Mantenha intacta** a limpeza do FIX-001 (`element.remove()`), o `<canvas>` por montagem e os dois `ResizeObserver` (FIX-002).
- **Não suba o `npm run dev` para «conferir»** — o dono deixa o dele rodando e o chat confere. Se subir, feche antes de commitar e diga.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `M logs/2026-11-17.md`, `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M src/App.tsx`, `M src/canvas/CanvasEngine.ts`, `M src/template/TemplateSerializer.test.ts`, `M src/template/ValidationRules.ts`, `M src/types/frame.types.ts`, `M src/ui/CanvasView.tsx`, `?? meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md`, `?? meta/workorders/261117-wo0012-frame-de-imagem.md`, `?? public/exemplo/imagens/_placeholder.png`, `?? src/canvas/FrameImage.test.ts`, `?? src/canvas/FrameImage.ts`, `?? src/canvas/ImageLayout.test.ts`, `?? src/canvas/ImageLayout.ts`, `?? src/project/ProjectFiles.test.ts`, `?? src/project/ProjectFiles.ts`, `?? src/project/ProjectPath.test.ts`, `?? src/project/ProjectPath.ts` (23 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 137 testes** (105 + C1–C7 + U1–U6 + I1–I7 + M1–M9 + T28–T30). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida:** em `normalizeProjectPath`, troque temporariamente `if (parts.length === 0) return null;` por `if (parts.length === 0) continue;` e rode `npm test` — esperado **falharem C5, U5 e T28 e T29** (4 testes). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `ProjectPath.test.ts`/`ProjectFiles.test.ts`/`TemplateSerializer.test.ts` → `normalizeProjectPath` → o ramo do `..` na raiz. **NÃO responde:** «presta?» na tela — se a imagem aparece no canvas, recortada e na ordem certa, é a conferência de tela do chat.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -rln "from 'fabric'" src/project src/canvas/FrameImage.ts src/canvas/ImageLayout.ts | wc -l` = 0
      - `grep -c "new FabricImage(" src/canvas/CanvasEngine.ts` = 1
      - `grep -c "this.relayer();" src/canvas/CanvasEngine.ts` = 2
      - `grep -c "element.remove();" src/ui/CanvasView.tsx` = 1 (FIX-001 intacto)
      - `grep -c "new ResizeObserver(onResize)" src/ui/CanvasView.tsx` = 2 (FIX-002 intacto)
      - `grep -c "^## DEC-019" meta/DECISIONS.md` = 1
      - `grep -c "^- \[x\] \`FrameImage.ts\`" meta/STATUS.md meta/ROADMAP.md` = 1 e 1
      - `grep -c "^- \`FrameImage.ts\` — frame de imagem com fit modes" meta/CHANGELOG.md` = 0
      - `grep -c "nitidez fora do zoom 100% é bug aberto" meta/STATUS.md` = 0
      - `grep -c "^## Code (execução) — wo0012" logs/2026-11-17.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0012.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Inclua as saídas cruas acima, `wc -l` dos arquivos novos e de `CanvasEngine.ts`/`CanvasView.tsx`, e qualquer decisão sua. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-17.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/ROADMAP.md meta/STATUS.md meta/analises/261117-ANALISE-leitura-de-imagens-por-caminho.md meta/workorders/261117-wo0012-frame-de-imagem.md public/exemplo/imagens/_placeholder.png src/App.tsx src/canvas/CanvasEngine.ts src/canvas/FrameImage.ts src/canvas/FrameImage.test.ts src/canvas/ImageLayout.ts src/canvas/ImageLayout.test.ts src/project/ProjectFiles.ts src/project/ProjectFiles.test.ts src/project/ProjectPath.ts src/project/ProjectPath.test.ts src/template/TemplateSerializer.test.ts src/template/ValidationRules.ts src/types/frame.types.ts src/ui/CanvasView.tsx
```

```
git commit -m "feat(canvas): desenha imagens lidas da pasta do projeto" -m "ProjectFiles le arquivos do projeto por caminho relativo ao .editx; normalizeProjectPath recusa caminho que sai da pasta, tambem no validador; ImageLayout posiciona pelos 4 fit e o align; FrameImage le, decodifica e entrega ao CanvasEngine, que recorta pelo frame e empilha por zIndex. Exemplo servido de public/exemplo. DEC-019 (wo0012)."
```

```
git push
```
