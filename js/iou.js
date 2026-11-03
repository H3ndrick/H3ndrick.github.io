/**
 * IoU (Intersection over Union) entre duas caixas delimitadoras.
 *
 * Cada caixa é um objeto { x1, y1, x2, y2 } em pixels, com x1 < x2 e y1 < y2
 * (origem no canto superior esquerdo; (x1, y1) é o canto superior esquerdo da caixa).
 *
 * Deve retornar um número entre 0 e 1:
 *   1 → caixas idênticas
 *   0 → caixas que não se sobrepõem (inclusive as que só encostam pela borda)
 *   se a união tiver área 0, retorne 0 (nunca NaN)
 *
 * Usada pelo jogo "Anote como eu" (js/game.js) e, no futuro, pelo NMS do detector.
 *
 * Testes: na raiz do projeto, rode  node --test tests/iou.test.mjs
 */
function iou(a, b) {
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);

  // interseção
  const maiorX1 = Math.max(a.x1, b.x1);
  const menorX2 = Math.min(a.x2, b.x2);

  const maiorY1 = Math.max(a.y1, b.y1);
  const menorY2 = Math.min(a.y2, b.y2);

  const areaIntersecao = Math.max(0, menorX2 - maiorX1) * Math.max(0, menorY2 - maiorY1);

  // união
  const uniao = areaA - areaIntersecao + areaB;

  if (uniao <= 0){
    return 0;
  }

  return areaIntersecao / uniao;
}

// Permite importar a função nos testes (Node); no navegador, `iou` fica global.
if (typeof module !== 'undefined') module.exports = { iou };
