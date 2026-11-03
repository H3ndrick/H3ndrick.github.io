/* Jogo "Anote como eu": o visitante desenha uma caixa e recebe o IoU com a caixa de referência.
   A métrica vem de iou() em js/iou.js. Este arquivo cuida só da interface e das rodadas. */
(() => {
  const $ = (s) => document.querySelector(s);
  const frame = $('#game-frame');
  if (!frame) return;

  const IMG_W = 1440, IMG_H = 900;      // todas as imagens do jogo têm 1440×900
  const THRESHOLD = 0.5;                // limiar clássico (PASCAL VOC) para contar como acerto

  // Caixas de referência em % da imagem.
  const ROUNDS = [
    { img: 'img/completai-2-foto.webp', alvo: 'o ketchup', origem: 'CompletAI',
      ref: { l: 32.6, t: 37.4, w: 11.4, h: 36.8 } },
    { img: 'img/completai-2-foto.webp', alvo: 'a maionese', origem: 'CompletAI',
      ref: { l: 44.8, t: 46.4, w: 8.7, h: 27.8 } },
    { img: 'img/cinebrasil-perfil.webp', alvo: 'a foto de perfil', origem: 'CineBrasil',
      ref: { l: 18.9, t: 12.9, w: 12.3, h: 20 } },
    { img: 'img/agroguard-6-desktop-mapa.webp', alvo: 'o foco de calor mais intenso', origem: 'AgroGuard',
      ref: { l: 33.6, t: 55.6, w: 5.6, h: 6.4 } },
    { img: 'img/cinebrasil-filmes.webp', alvo: 'o primeiro pôster da grade', origem: 'CineBrasil',
      ref: { l: 13.06, t: 8.89, w: 13.89, h: 33.33 } },
  ];

  const img = $('#game-img');
  const layer = $('#game-layer');
  const msg = $('#game-msg');
  const roundEl = $('#game-round');
  const targetEl = $('#game-target');
  const scoreEl = $('#game-score');
  const btnConfirm = $('#game-confirm');
  const btnRetry = $('#game-retry');
  const btnNext = $('#game-next');
  const endEl = $('#game-end');

  let idx = 0, results = [], userBox = null, start = null, drawing = null, locked = false;

  const fmt = (v) => v.toFixed(2).replace('.', ',');
  const toPx = (r) => ({ x1: r.l / 100 * IMG_W, y1: r.t / 100 * IMG_H, x2: (r.l + r.w) / 100 * IMG_W, y2: (r.t + r.h) / 100 * IMG_H });

  function makeBox(cls, label, r) {
    const el = document.createElement('div');
    el.className = 'gbox ' + cls;
    if (label) { const s = document.createElement('span'); s.textContent = label; el.appendChild(s); }
    place(el, r);
    layer.appendChild(el);
    return el;
  }
  function place(el, r) {
    Object.assign(el.style, { left: r.l + '%', top: r.t + '%', width: r.w + '%', height: r.h + '%' });
  }
  function setButtons({ confirm = false, retry = false, next = false }) {
    btnConfirm.hidden = !confirm; btnConfirm.disabled = !confirm;
    btnRetry.hidden = !retry;
    btnNext.hidden = !next;
  }
  function updateScore() {
    if (!results.length) { scoreEl.textContent = 'média —'; return; }
    const avg = results.reduce((s, r) => s + r.v, 0) / results.length;
    scoreEl.textContent = `média ${fmt(avg)}`;
  }

  function loadRound(i) {
    idx = i; userBox = null; locked = false;
    const r = ROUNDS[i];
    layer.innerHTML = '';
    endEl.hidden = true;
    img.src = r.img;
    img.alt = `Imagem do ${r.origem} para anotar: marque ${r.alvo}`;
    roundEl.textContent = `rodada ${i + 1}/${ROUNDS.length}`;
    targetEl.textContent = r.alvo;
    msg.textContent = `Arraste para desenhar uma caixa em volta de ${r.alvo}.`;
    setButtons({});
    updateScore();
  }

  // ----- desenho -----
  const local = (e) => {
    const b = frame.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (e.clientX - b.left) / b.width * 100)),
      y: Math.max(0, Math.min(100, (e.clientY - b.top) / b.height * 100)),
    };
  };
  const rectFrom = (a, b) => ({ l: Math.min(a.x, b.x), t: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

  frame.addEventListener('pointerdown', (e) => {
    if (locked || e.button !== 0 || !endEl.hidden) return;
    frame.setPointerCapture(e.pointerId);
    layer.innerHTML = '';
    start = local(e);
    drawing = makeBox('gbox--user', 'sua caixa', rectFrom(start, start));
  });
  frame.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    place(drawing, rectFrom(start, local(e)));
  });
  const finish = (e) => {
    if (!drawing) return;
    const r = rectFrom(start, local(e));
    if (r.w < 0.8 || r.h < 0.8) {               // foi só um clique
      drawing.remove(); userBox = null;
      setButtons({});
    } else {
      place(drawing, r); userBox = r;
      msg.textContent = 'Confirme a caixa ou desenhe outra.';
      setButtons({ confirm: true, retry: true });
    }
    drawing = null; start = null;
  };
  frame.addEventListener('pointerup', finish);
  frame.addEventListener('pointercancel', finish);

  // ----- avaliação -----
  btnRetry.addEventListener('click', () => {
    layer.innerHTML = ''; userBox = null;
    msg.textContent = `Arraste para desenhar uma caixa em volta de ${ROUNDS[idx].alvo}.`;
    setButtons({});
  });

  btnConfirm.addEventListener('click', () => {
    if (!userBox) return;
    const r = ROUNDS[idx];
    let v;
    try {
      v = iou(toPx(userBox), toPx(r.ref));
    } catch (err) {
      msg.textContent = 'A função iou() ainda não foi implementada (js/iou.js).';
      return;
    }
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      msg.textContent = `iou() retornou um valor inválido (${v}). Rode os testes: node --test tests/`;
      return;
    }
    locked = true;
    makeBox('gbox--ref', 'referência', r.ref);
    results.push({ alvo: r.alvo, v });
    updateScore();

    let verdict;
    if (v >= 0.75) verdict = 'ótima anotação.';
    else if (v >= THRESHOLD) verdict = `aceita (IoU ≥ ${fmt(THRESHOLD)}, o limiar clássico do PASCAL VOC).`;
    else verdict = `abaixo de ${fmt(THRESHOLD)}: para um detector, seria um falso positivo.`;
    msg.textContent = `IoU ${fmt(v)} — ${verdict}`;
    setButtons({ next: true });
    btnNext.textContent = idx + 1 < ROUNDS.length ? 'próxima →' : 'ver resultado →';
    btnNext.focus();
  });

  btnNext.addEventListener('click', () => {
    if (idx + 1 < ROUNDS.length) loadRound(idx + 1);
    else showEnd();
  });

  function showEnd() {
    const hits = results.filter((r) => r.v >= THRESHOLD).length;
    const avg = results.reduce((s, r) => s + r.v, 0) / results.length;
    endEl.innerHTML = '';
    const h = document.createElement('p');
    h.className = 'game__end-title';
    h.textContent = `${hits}/${results.length} acertos · IoU médio ${fmt(avg)}`;
    const list = document.createElement('ol');
    list.className = 'game__end-list mono';
    results.forEach((r) => {
      const li = document.createElement('li');
      li.innerHTML = `<span></span><b></b>`;
      li.firstChild.textContent = r.alvo;
      li.lastChild.textContent = fmt(r.v);
      if (r.v < THRESHOLD) li.classList.add('miss');
      list.appendChild(li);
    });
    const again = document.createElement('button');
    again.type = 'button'; again.className = 'tool'; again.textContent = 'jogar de novo';
    again.addEventListener('click', () => { results = []; loadRound(0); });
    endEl.append(h, list, again);
    endEl.hidden = false;
    layer.innerHTML = '';
    msg.textContent = hits === results.length
      ? 'Todas acima do limiar: você daria um bom anotador.'
      : 'Anotar bem é mais difícil do que parece: caixas frouxas ou apertadas demais derrubam o IoU.';
    setButtons({});
    again.focus();
  }

  loadRound(0);
})();
