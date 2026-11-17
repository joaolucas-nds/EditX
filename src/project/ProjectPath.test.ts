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
