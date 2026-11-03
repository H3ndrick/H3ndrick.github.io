// Testes da função iou() — rode na raiz do projeto com:  node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import mod from '../js/iou.js';

const { iou } = mod;
const box = (x1, y1, x2, y2) => ({ x1, y1, x2, y2 });
const near = (got, want, eps = 1e-9) =>
  assert.ok(Math.abs(got - want) < eps, `esperado ${want}, recebido ${got}`);

test('caixas idênticas → 1', () => {
  near(iou(box(10, 10, 50, 40), box(10, 10, 50, 40)), 1);
});

test('caixas separadas → 0', () => {
  near(iou(box(0, 0, 10, 10), box(20, 20, 30, 30)), 0);
});

test('separadas só em um eixo → 0', () => {
  // sobrepõem em x, mas não em y
  near(iou(box(0, 0, 10, 10), box(5, 20, 15, 30)), 0);
});

test('encostando pela borda → 0', () => {
  near(iou(box(0, 0, 10, 10), box(10, 0, 20, 10)), 0);
});

test('deslocada pela metade → 1/3', () => {
  // interseção 2, união 6
  near(iou(box(0, 0, 2, 2), box(1, 0, 3, 2)), 1 / 3);
});

test('sobreposição só no canto → 1/7', () => {
  // interseção 1, união 7
  near(iou(box(0, 0, 2, 2), box(1, 1, 3, 3)), 1 / 7);
});

test('uma caixa dentro da outra → razão das áreas', () => {
  // interna 2×2 = 4, externa 4×4 = 16
  near(iou(box(0, 0, 4, 4), box(1, 1, 3, 3)), 4 / 16);
});

test('coordenadas decimais', () => {
  // interseção 0,25, união 1,75
  near(iou(box(0.5, 0.5, 1.5, 1.5), box(1, 1, 2, 2)), 1 / 7);
});

test('simétrica: iou(a, b) === iou(b, a)', () => {
  const a = box(3, 4, 20, 18);
  const b = box(10, 1, 25, 12);
  near(iou(a, b), iou(b, a));
});

test('caixa de área zero → 0, sem NaN', () => {
  near(iou(box(1, 1, 1, 1), box(0, 0, 2, 2)), 0);
  near(iou(box(5, 5, 5, 5), box(5, 5, 5, 5)), 0);
});

test('sempre um número entre 0 e 1 (1000 pares aleatórios)', () => {
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31) * 100;
  const randBox = () => {
    const x1 = rnd(), y1 = rnd();
    return box(x1, y1, x1 + rnd() + 0.01, y1 + rnd() + 0.01);
  };
  for (let i = 0; i < 1000; i++) {
    const v = iou(randBox(), randBox());
    assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, `valor fora de [0, 1]: ${v}`);
  }
});
