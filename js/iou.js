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
 * Testes: na raiz do projeto, rode  node --test tests/
 */
function iou(a, b) {
  // TODO(hendrick): implementar.
  throw new Error('iou() ainda não implementada');
}

// Permite importar a função nos testes (Node); no navegador, `iou` fica global.
if (typeof module !== 'undefined') module.exports = { iou };
