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
