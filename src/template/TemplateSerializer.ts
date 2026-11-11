/**
 * TemplateSerializer.ts
 *
 * Salvar e abrir arquivos `.editx` como `string` — ver DEC-013. Não toca em
 * disco (File System Access API / Tauri são de outra camada): recebe e
 * devolve texto. Toda a validação mora em `TemplateValidator.ts`; quem
 * precisa de `ValidationError` ou `ValidationResult` importa de lá.
 */

import type { EditxTemplate } from './TemplateSchema';
import type { ValidationError, ValidationResult } from './TemplateValidator';
import { validateTemplate } from './TemplateValidator';

/** Lançado por `serializeTemplate` quando o template não passa na validação. */
export class TemplateValidationError extends Error {
  readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super(
      `O template é inválido (${errors.length} ${errors.length === 1 ? 'erro' : 'erros'} de validação).`,
    );
    this.name = 'TemplateValidationError';
    this.errors = errors;
  }
}

/**
 * Converte um template em texto `.editx` (JSON indentado com 2 espaços e
 * quebra de linha final). Nunca grava arquivo inválido.
 *
 * Não altera `updatedAt` nem qualquer outro campo: carimbar a hora é de quem
 * salva, porque só ele sabe se houve mudança real.
 *
 * @param template Template a salvar. Não é modificado.
 * @returns O conteúdo do arquivo `.editx`.
 * @throws {TemplateValidationError} Se o template não passa em `validateTemplate`.
 */
export function serializeTemplate(template: EditxTemplate): string {
  const result = validateTemplate(template);
  if (!result.ok) throw new TemplateValidationError(result.errors);
  return JSON.stringify(template, null, 2) + '\n';
}

/**
 * Lê o texto de um arquivo `.editx`. Aceita BOM UTF-8 no início (editores do
 * Windows o gravam) e nunca lança: JSON quebrado vira um único erro `invalid-json`.
 *
 * @param json Conteúdo bruto do arquivo.
 * @returns O resultado de `validateTemplate` sobre o JSON lido.
 */
export function parseTemplate(json: string): ValidationResult {
  const text = json.charCodeAt(0) === 0xfeff ? json.slice(1) : json;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : '';
    return {
      ok: false,
      errors: [
        { path: '$', code: 'invalid-json', message: `O arquivo não é um JSON válido.${detail}` },
      ],
    };
  }
  return validateTemplate(parsed);
}
