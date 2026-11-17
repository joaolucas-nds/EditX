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
