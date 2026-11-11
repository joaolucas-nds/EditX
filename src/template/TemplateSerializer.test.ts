import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from './__examples__/catalogo-simples.example';
import type { EditxTemplate } from './TemplateSchema';
import { parseTemplate, serializeTemplate, TemplateValidationError } from './TemplateSerializer';
import type { ValidationErrorCode } from './TemplateValidator';
import { validateTemplate } from './TemplateValidator';

type Loose = Record<string, unknown>;

/** Cópia mutável do exemplo — o export é compartilhado, mutar o original vaza entre testes. */
const fresh = (): Loose => structuredClone(catalogoSimplesExample) as unknown as Loose;

/** Desce por chaves/índices até um nó do documento. */
function at(root: unknown, ...keys: (string | number)[]): Loose {
  let node = root;
  for (const key of keys) node = (node as Record<string | number, unknown>)[key];
  return node as Loose;
}

const errorsOf = (value: unknown) => {
  const result = validateTemplate(value);
  return result.ok ? [] : result.errors;
};

/** Afirma que existe um erro com ESTE caminho e ESTE código. */
function expectError(value: unknown, path: string, code: ValidationErrorCode): void {
  expect(errorsOf(value)).toContainEqual(expect.objectContaining({ path, code }));
}

const asTemplate = (value: unknown) => value as EditxTemplate;

describe('validateTemplate / serializeTemplate / parseTemplate', () => {
  it('T1: o exemplo do schema é válido', () => {
    expect(validateTemplate(catalogoSimplesExample).ok).toBe(true);
  });

  it('T2: ida e volta preserva o template e a serialização é estável', () => {
    const first = serializeTemplate(catalogoSimplesExample);
    const parsed = parseTemplate(first);
    if (!parsed.ok) throw new Error('parseTemplate deveria aceitar a própria saída');
    expect(parsed.template).toEqual(catalogoSimplesExample);
    expect(serializeTemplate(parsed.template)).toBe(first);
  });

  it('T3: o formato é JSON com 2 espaços e quebra de linha final', () => {
    expect(serializeTemplate(catalogoSimplesExample)).toBe(
      JSON.stringify(catalogoSimplesExample, null, 2) + '\n',
    );
  });

  it('T4: JSON quebrado vira um único erro invalid-json', () => {
    const result = parseTemplate('{');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ code: 'invalid-json', path: '$' });
  });

  it('T5: versão de schema desconhecida devolve só unsupported-version', () => {
    const t = fresh();
    t.version = '9.0.0';
    const errors = errorsOf(t);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ code: 'unsupported-version', path: '$.version' });
  });

  it('T6: campo obrigatório ausente é missing-field', () => {
    const t = fresh();
    delete t.name;
    expectError(t, '$.name', 'missing-field');
  });

  it('T7: tipo primitivo errado é invalid-type', () => {
    const t = fresh();
    at(t, 'document').dpi = '300';
    expectError(t, '$.document.dpi', 'invalid-type');
  });

  it('T8: fixed-shrink sem minFontSize é missing-field', () => {
    const t = fresh();
    delete at(t, 'pages', 1, 'frames', 1, 'overflow').minFontSize;
    expectError(t, '$.pages[1].frames[1].overflow.minFontSize', 'missing-field');
  });

  it('T9: textStyle que não existe é unknown-reference', () => {
    const t = fresh();
    at(t, 'pages', 0, 'frames', 0).textStyle = 'inexistente';
    expectError(t, '$.pages[0].frames[0].textStyle', 'unknown-reference');
  });

  it('T10: ciclo em basedOn é invalid-value', () => {
    const t = fresh();
    at(t, 'textStyles', 'titulo-produto').basedOn = 'preco-destaque';
    expect(errorsOf(t)).toContainEqual(
      expect.objectContaining({
        code: 'invalid-value',
        path: expect.stringMatching(
          /^\$\.textStyles\["(titulo-produto|preco-destaque)"\]\.basedOn$/,
        ),
      }),
    );
  });

  it('T11: id de frame repetido no documento é duplicate-id na segunda ocorrência', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 1).id = 'frame-nome-produto';
    expectError(t, '$.pages[1].frames[1].id', 'duplicate-id');
  });

  it('T12: csvColumn num frame static é unknown-field', () => {
    const t = fresh();
    at(t, 'pages', 0, 'frames', 0).csvColumn = 'x';
    expectError(t, '$.pages[0].frames[0].csvColumn', 'unknown-field');
  });

  it('T13: cor sem # é invalid-value', () => {
    const t = fresh();
    at(t, 'palette', 'brand', 0).hex = 'E63946';
    expectError(t, '$.palette.brand[0].hex', 'invalid-value');
  });

  it('T14: coleta todos os erros, não só o primeiro', () => {
    const t = fresh();
    delete t.name;
    at(t, 'document').dpi = '300';
    const errors = errorsOf(t);
    expect(errors).toContainEqual(
      expect.objectContaining({ path: '$.name', code: 'missing-field' }),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ path: '$.document.dpi', code: 'invalid-type' }),
    );
  });

  it('T15: shape custom-svg sem customSvg é missing-field', () => {
    const t = fresh();
    at(t, 'pages', 0, 'frames', 1).shape = 'custom-svg';
    expectError(t, '$.pages[0].frames[1].customSvg', 'missing-field');
  });

  it('T16: fallback com caminho absoluto de Windows é invalid-value', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 2).fallback = 'C:\\imagens\\x.png';
    expectError(t, '$.pages[1].frames[2].fallback', 'invalid-value');
  });

  it('T16: fallback com caminho absoluto de Unix é invalid-value', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 2).fallback = '/x.png';
    expectError(t, '$.pages[1].frames[2].fallback', 'invalid-value');
  });

  it('T17: serializeTemplate de template inválido lança TemplateValidationError', () => {
    const t = fresh();
    delete t.name;
    let thrown: unknown;
    try {
      serializeTemplate(asTemplate(t));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(TemplateValidationError);
    expect((thrown as TemplateValidationError).errors.length).toBeGreaterThanOrEqual(1);
  });

  it('T18: raiz que não é objeto é invalid-type em $', () => {
    for (const json of ['42', '[]', 'null']) {
      const result = parseTemplate(json);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual(
          expect.objectContaining({ path: '$', code: 'invalid-type' }),
        );
      }
    }
  });

  it('T19: BOM UTF-8 no início é aceito', () => {
    expect(parseTemplate('\uFEFF' + serializeTemplate(catalogoSimplesExample)).ok).toBe(true);
  });

  // ---- casos extras

  it('extra: content num frame role data é unknown-field', () => {
    const t = fresh();
    at(t, 'pages', 1, 'frames', 0).content = 'x';
    expectError(t, '$.pages[1].frames[0].content', 'unknown-field');
  });

  it('extra: type de frame inválido gera um erro só, sem cascata', () => {
    const t = fresh();
    at(t, 'pages', 0, 'frames', 0).type = 'video';
    const inFrame = errorsOf(t).filter((e) => e.path.startsWith('$.pages[0].frames[0]'));
    expect(inFrame).toHaveLength(1);
    expect(inFrame[0]).toMatchObject({ path: '$.pages[0].frames[0].type', code: 'invalid-value' });
  });

  it('extra: version ausente devolve só missing-field', () => {
    const t = fresh();
    delete t.version;
    expect(errorsOf(t)).toEqual([
      expect.objectContaining({ path: '$.version', code: 'missing-field' }),
    ]);
  });

  it('extra: basedOn apontando para si mesmo é ciclo', () => {
    const t = fresh();
    at(t, 'textStyles', 'titulo-capa').basedOn = 'titulo-capa';
    expectError(t, '$.textStyles["titulo-capa"].basedOn', 'invalid-value');
  });

  it('extra: data com mês inexistente é invalid-value', () => {
    const t = fresh();
    t.createdAt = '2026-13-45T00:00:00Z';
    expectError(t, '$.createdAt', 'invalid-value');
  });

  it('extra: pages vazio é invalid-value', () => {
    const t = fresh();
    t.pages = [];
    expectError(t, '$.pages', 'invalid-value');
  });

  it('extra: chave desconhecida na raiz é unknown-field', () => {
    const t = fresh();
    t.isDatapage = true;
    expectError(t, '$.isDatapage', 'unknown-field');
  });

  it('extra: sucesso devolve a mesma referência e serialize não muta a entrada', () => {
    const t = fresh();
    const before = JSON.stringify(t);
    const result = validateTemplate(t);
    expect(result.ok && result.template).toBe(t);
    serializeTemplate(asTemplate(t));
    expect(JSON.stringify(t)).toBe(before);
  });
});
