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
