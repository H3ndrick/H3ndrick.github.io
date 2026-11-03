(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tema ---------- */
  const themeBtn = $('#theme-toggle');
  const themeLabel = $('#theme-label');
  const isDark = () => root.dataset.theme === 'dark';
  const syncThemeLabel = () => { themeLabel.textContent = isDark() ? 'claro' : 'escuro'; };
  syncThemeLabel();
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeLabel();
  });

  /* ---------- relógio da câmera ---------- */
  const clock = $('#cam-clock');
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date();
    clock.textContent = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  tick(); setInterval(tick, 1000);

  /* ---------- câmera: detecções, falso alerta e ROI-OFF ----------
     Tudo em % do quadro, para acompanhar o redimensionamento.
     Uma ROI-OFF faz o "modelo" ignorar as detecções cujo centro cai dentro dela. */
  const frame = $('#cam-frame');
  const layer = $('#cam-layer');
  const cross = $('#cam-cross');
  const alerts = document.createElement('p');
  alerts.className = 'cam__alerts mono';
  frame.appendChild(alerts);

  const DETECTIONS = [
    { kind: 'ok',  label: 'pessoa 0.93', l: 27,   t: 51.5, w: 5.5,  h: 17 },
    { kind: 'ok',  label: 'carro 0.95',  l: 61.5, t: 52,   w: 12.5, h: 13 },
    { kind: 'bad', label: 'pessoa 0.58', l: 11,   t: 70.5, w: 15.5, h: 12.5 },
  ];
  // menor área que cobre o falso alerta (o que a ferramenta sugeriria)
  const SUGGESTION = { l: 10.5, t: 70, w: 16.5, h: 13.5 };

  let offCount = 0, start = null, box = null;
  const area = (r) => (r.w * r.h / 100).toFixed(1);

  const makeBox = (cls, label, r) => {
    const el = document.createElement('div');
    el.className = 'bx ' + cls;
    const tag = document.createElement('span');
    tag.textContent = label;
    el.appendChild(tag);
    setRect(el, r);
    layer.appendChild(el);
    return el;
  };
  function setRect(el, r) {
    Object.assign(el.style, { left: r.l + '%', top: r.t + '%', width: r.w + '%', height: r.h + '%' });
    el._r = r;
  }

  const applyRoiOff = () => {
    const offs = $$('.bx--off:not(.bx--suggest)', layer).map((o) => o._r);
    $$('.bx--ok, .bx--bad', layer).forEach((d) => {
      const r = d._r, cx = r.l + r.w / 2, cy = r.t + r.h / 2;
      const hidden = offs.some((o) => cx >= o.l && cx <= o.l + o.w && cy >= o.t && cy <= o.t + o.h);
      d.classList.toggle('ignored', hidden);
    });
    const n = $$('.bx--bad:not(.ignored)', layer).length;
    alerts.innerHTML = `falsos alertas: <b>${n}</b>`;
    alerts.classList.toggle('clear', n === 0);
  };

  const buildScene = () => {
    layer.innerHTML = '';
    offCount = 0;
    DETECTIONS.forEach((d) => makeBox('bx--' + d.kind, d.label, d));
    const sug = makeBox('bx--off bx--suggest', `roi-off sugerida · ${area(SUGGESTION)}% do quadro`, SUGGESTION);
    const actions = document.createElement('div');
    actions.className = 'cam__actions';
    Object.assign(actions.style, { left: SUGGESTION.l + '%', top: `calc(${SUGGESTION.t + SUGGESTION.h}% + 5px)` });
    const approve = document.createElement('button');
    approve.type = 'button'; approve.textContent = 'aprovar';
    const discard = document.createElement('button');
    discard.type = 'button'; discard.textContent = 'descartar';
    const note = document.createElement('span');
    note.textContent = `roi-off sugerida · ${area(SUGGESTION)}%`;
    actions.append(note, approve, discard);
    layer.appendChild(actions);
    approve.addEventListener('click', () => {
      sug.classList.remove('bx--suggest');
      sug.firstChild.textContent = `roi-off aprovada · ${area(SUGGESTION)}%`;
      actions.remove();
      applyRoiOff();
    });
    discard.addEventListener('click', () => { sug.remove(); actions.remove(); });
    applyRoiOff();
  };
  buildScene();
  $('#cam-clear').addEventListener('click', buildScene);

  // desenhar ROI-OFFs à mão (sem tamanho mínimo)
  const local = (e) => {
    const r = frame.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)),
      y: Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)),
      px: r,
    };
  };
  const rectFrom = (a, b) => ({
    l: Math.min(a.x, b.x), t: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y),
  });

  frame.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    frame.setPointerCapture(e.pointerId);
    start = local(e);
    box = makeBox('bx--off drawing', '', rectFrom(start, start));
  });
  frame.addEventListener('pointermove', (e) => {
    const p = local(e);
    cross.textContent = `x ${Math.round(p.x / 100 * p.px.width)}  y ${Math.round(p.y / 100 * p.px.height)}`;
    if (!box) return;
    const r = rectFrom(start, p);
    setRect(box, r);
    box.firstChild.textContent = `${area(r)}% do quadro`;
  });
  const finish = (e) => {
    if (!box) return;
    const r = rectFrom(start, local(e));
    box.classList.remove('drawing');
    if (r.w < 1 || r.h < 1) {
      box.remove();             // foi só um clique
    } else {
      setRect(box, r);
      offCount += 1;
      box.firstChild.textContent = `roi-off_${pad(offCount)} · ${area(r)}%`;
      applyRoiOff();
    }
    box = null; start = null;
  };
  frame.addEventListener('pointerup', finish);
  frame.addEventListener('pointercancel', finish);
  frame.addEventListener('pointerleave', () => { if (!box) cross.textContent = ''; });

  /* ---------- modo detecção ---------- */
  const detBtn = $('#detect-toggle');
  const detLayer = $('#det-layer');
  const hud = $('#det-hud');
  const palette = ['var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)', 'var(--p5)'];
  const classColor = {};
  let detOn = false;

  // confiança "estável" por elemento: hash simples do texto
  const conf = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return (0.81 + (h % 180) / 1000).toFixed(2);
  };

  const drawDetections = () => {
    detLayer.innerHTML = '';
    detLayer.style.height = document.documentElement.scrollHeight + 'px';
    const targets = $$('[data-det]').filter((el) => el.offsetParent !== null);
    targets.forEach((el, i) => {
      const cls = el.dataset.det;
      if (!classColor[cls]) classColor[cls] = palette[Object.keys(classColor).length % palette.length];
      const r = el.getBoundingClientRect();
      const d = document.createElement('div');
      d.className = 'det';
      d.style.setProperty('--c', classColor[cls]);
      Object.assign(d.style, {
        left: r.left + window.scrollX - 6 + 'px',
        top: r.top + window.scrollY - 6 + 'px',
        width: r.width + 12 + 'px',
        height: r.height + 12 + 'px',
        animationDelay: reduceMotion ? '0s' : i * 40 + 'ms',
      });
      const tag = document.createElement('span');
      tag.textContent = `${cls} ${conf(el.textContent + cls)}`;
      d.appendChild(tag);
      detLayer.appendChild(d);
    });
    const classes = new Set(targets.map((t) => t.dataset.det)).size;
    hud.textContent = `${targets.length} objetos · ${classes} classes · D para desligar`;
  };

  const setDetect = (on) => {
    detOn = on;
    detBtn.setAttribute('aria-pressed', String(on));
    hud.classList.toggle('on', on);
    if (on) drawDetections(); else detLayer.innerHTML = '';
  };
  detBtn.addEventListener('click', () => setDetect(!detOn));
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) setDetect(!detOn);
    if (e.key === 'Escape' && detOn) setDetect(false);
  });
  let raf;
  window.addEventListener('resize', () => {
    if (!detOn) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(drawDetections);
  });
  if (document.fonts) document.fonts.ready.then(() => detOn && drawDetections());

  /* ---------- entrada das seções ---------- */
  const blocks = $$('.block');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('seen');
          io.unobserve(en.target);
          if (detOn) setTimeout(drawDetections, 750);
        }
      });
    }, { threshold: 0.08 });
    blocks.forEach((b) => io.observe(b));

    // link ativo no menu
    const links = $$('.top__nav a');
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.hash === '#' + en.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach((a) => { const s = $(a.hash); if (s) spy.observe(s); });
  } else {
    blocks.forEach((b) => b.classList.add('seen'));
  }

  /* ---------- copiar e-mail ---------- */
  const copyBtn = $('#copy-email');
  const status = $('#copy-status');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      status.textContent = 'copiado.';
      setTimeout(() => { status.textContent = ''; }, 2200);
    } catch (e) {
      window.location.href = 'mailto:' + copyBtn.dataset.email;
    }
  });

  $('#year').textContent = new Date().getFullYear();
})();
