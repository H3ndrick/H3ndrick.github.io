(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tema ---------- */
  const themeBtn = $('#theme-toggle');
  const themeLabel = $('#theme-label');
  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  /* ---------- ROI: desenhar caixas com tamanho mínimo ---------- */
  const frame = $('#cam-frame');
  const layer = $('#cam-layer');
  const cross = $('#cam-cross');
  const MIN = 48;                       // tamanho mínimo, em px de tela
  $('#cam-min').textContent = MIN + 'px';
  let count = 0, start = null, box = null;

  const local = (e) => {
    const r = frame.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(r.width, e.clientX - r.left)),
      y: Math.max(0, Math.min(r.height, e.clientY - r.top)),
    };
  };
  const place = (el, a, b) => {
    const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    const w = Math.abs(a.x - b.x), h = Math.abs(a.y - b.y);
    Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    return { w: Math.round(w), h: Math.round(h) };
  };
  const makeRoi = (labelText) => {
    const el = document.createElement('div');
    el.className = 'roi';
    const tag = document.createElement('span');
    tag.textContent = labelText;
    el.appendChild(tag);
    layer.appendChild(el);
    return el;
  };

  frame.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    frame.setPointerCapture(e.pointerId);
    start = local(e);
    box = makeRoi('');
    box.classList.add('drawing');
    place(box, start, start);
  });
  frame.addEventListener('pointermove', (e) => {
    const p = local(e);
    cross.textContent = `x ${Math.round(p.x)}  y ${Math.round(p.y)}`;
    if (!box) return;
    const { w, h } = place(box, start, p);
    const ok = w >= MIN && h >= MIN;
    box.classList.toggle('bad', !ok);
    box.firstChild.textContent = `${w}×${h}${ok ? '' : ' < mín'}`;
  });
  const finish = (e) => {
    if (!box) return;
    const { w, h } = place(box, start, local(e));
    box.classList.remove('drawing');
    if (w < 6 || h < 6) { box.remove(); }
    else if (w < MIN || h < MIN) {
      box.firstChild.textContent = `rejeitada · ${w}×${h}`;
      box.classList.add('bad', 'fade');
      const dead = box;
      setTimeout(() => dead.remove(), 1300);
    } else {
      count += 1;
      box.firstChild.textContent = `roi_${pad(count)} · ${w}×${h}`;
    }
    box = null; start = null;
  };
  frame.addEventListener('pointerup', finish);
  frame.addEventListener('pointercancel', finish);
  frame.addEventListener('pointerleave', () => { if (!box) cross.textContent = ''; });
  $('#cam-clear').addEventListener('click', () => { layer.innerHTML = ''; count = 0; });

  // ROI de exemplo, em porcentagem para acompanhar o redimensionamento
  const demo = makeRoi('roi_00 · exemplo');
  Object.assign(demo.style, { left: '60%', top: '50%', width: '18%', height: '19%' });

  /* ---------- modo detecção ---------- */
  const detBtn = $('#detect-toggle');
  const detLayer = $('#det-layer');
  const hud = $('#det-hud');
  const palette = ['var(--mark)', '#2f7d6d', '#3b5bdb', '#b5179e', '#c08a00'];
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
