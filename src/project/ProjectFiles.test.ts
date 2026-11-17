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
