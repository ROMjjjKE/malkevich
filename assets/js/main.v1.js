
(function () {
  'use strict';
  var WA = 'https://wa.me/375296151911';
  var FMT = {
    '120x60': { a: 1200, b: 600, notch: 12 },
    '60x60': { a: 600, b: 600, notch: 10 },
    '60x30': { a: 600, b: 300, notch: 8 },
    '30x30': { a: 300, b: 300, notch: 8 },
    '20x20': { a: 200, b: 200, notch: 6 },
    '10x10': { a: 100, b: 100, notch: 4 }
  };
  var LAY = { straight: 0.10, offset: 0.12, diag: 0.15 };
  var LAYN = { straight: 'прямая', offset: 'со смещением', diag: 'по диагонали' };
  var FMTN = { '120x60': '120 × 60', '60x60': '60 × 60', '60x30': '60 × 30', '30x30': '30 × 30', '20x20': '20 × 20', '10x10': 'мозаика 10 × 10' };

  function initDrawer() {
    var d = document.getElementById('drawer');
    var b = document.querySelector('.header .burger');
    if (!d || !b) return;
    var last = null;
    function open() {
      last = document.activeElement;
      d.hidden = false; d.setAttribute('data-open', '');
      b.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      var f = d.querySelector('a, button'); if (f) f.focus({ preventScroll: true });
    }
    function close() {
      d.hidden = true; d.removeAttribute('data-open');
      b.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      if (last) last.focus({ preventScroll: true });
    }
    b.addEventListener('click', function () { d.hidden ? open() : close(); });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.closest('a') || !e.target.closest('.drawer__in')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !d.hidden) close();
      if (e.key === 'Tab' && !d.hidden) {
        var it = d.querySelectorAll('a, button, input');
        if (!it.length) return;
        var f = it[0], l = it[it.length - 1];
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024 && !d.hidden) close(); });
  }

  function m(v, d) { return (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toString().replace('.', ','); }

  function initTile() {
    var svg = document.getElementById('tSvg');
    if (!svg) return;
    var st = { fmt: '60x60', lay: 'straight', area: 18, joint: 3 };
    var o = {
      name: document.getElementById('tName'), joint: document.getElementById('tJoint'),
      waste: document.getElementById('tWaste'), count: document.getElementById('tCount'),
      spec: document.getElementById('tSpec'), f: document.getElementById('tFormula'),
      go: document.getElementById('tGo'), areaV: document.getElementById('tAreaV'), jointV: document.getElementById('tJointV')
    };

    function draw() {
      var W = 520, H = 300;
      var f = FMT[st.fmt];
      // масштаб: приводим длинную сторону к ~110 px
      var maxSide = Math.max(f.a, f.b);
      var k = 110 / maxSide;
      var tw = f.a * k, th = f.b * k;
      var jw = Math.max(1.5, st.joint * 0.7);
      var p = [];
      p.push('<rect width="' + W + '" height="' + H + '" fill="#FAF9F5"/>');
      var gap = 12, offX = 20, offY = 18;
      var i, j, x, y;
      if (st.lay === 'diag') {
        p.push('<g transform="rotate(-18 260 150)">');
        for (j = -2; j < 8; j++) {
          for (i = -2; i < 8; i++) {
            p.push(tileRect(offX + i * (tw + jw), offY + j * (th + jw), tw, th));
          }
        }
        p.push('</g>');
        p.push('<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" fill="none" stroke="#16211E" stroke-width="2"/>');
      } else if (st.lay === 'offset') {
        var row = 0;
        for (y = offY - th; y < H; y += th + jw) {
          var shift = (row % 2) ? (tw + jw) / 2 : 0;
          for (x = offX - tw + shift; x < W; x += tw + jw) {
            p.push(tileRect(x, y, tw, th));
          }
          row++;
        }
        p.push('<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" fill="none" stroke="#16211E" stroke-width="2"/>');
      } else {
        for (y = offY; y < H - 4; y += th + jw) {
          for (x = offX; x < W - 4; x += tw + jw) {
            p.push(tileRect(x, y, tw, th));
          }
        }
        p.push('<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" fill="none" stroke="#16211E" stroke-width="2"/>');
      }
      p.push('<text x="16" y="' + (H - 12) + '" font-family="Space Mono, monospace" font-size="9" letter-spacing="1.4" fill="#5C6660">' + (FMTN[st.fmt]).toUpperCase() + ' · ШОВ ' + st.joint + ' ММ · ' + (LAYN[st.lay]).toUpperCase() + '</text>');
      svg.innerHTML = p.join('');
    }
    function tileRect(x, y, w, h) {
      return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#E9EFEA" stroke="#1E5C4A" stroke-width="1"/>';
    }

    function calc() {
      var f = FMT[st.fmt];
      var waste = LAY[st.lay];
      var tileArea = (f.a / 1000) * (f.b / 1000);
      var areaW = st.area * (1 + waste);
      var count = Math.ceil(areaW / tileArea);
      // клей: практический расход ≈ 0,6 × высота зуба гребёнки (кг/м²)
      var glueRate = 0.6 * f.notch;
      var glue = st.area * glueRate;
      // затирка: (a+b)/(a·b) · глубина шва · 1,6 г/см³
      var depth = Math.min(10, 4 + f.notch * 0.5);
      var groutRate = ((f.a + f.b) / (f.a * f.b)) * st.joint * depth * 1.6;
      var grout = st.area * groutRate;
      var spacers = count * 2;
      var packs = Math.ceil(spacers / 100);
      o.name.textContent = FMTN[st.fmt];
      o.joint.textContent = st.joint + ' мм';
      o.waste.textContent = Math.round(waste * 100) + '%';
      o.areaV.textContent = st.area + ' м²';
      o.jointV.textContent = st.joint + ' мм';
      o.count.textContent = count.toLocaleString('ru-RU') + ' шт.';
      o.spec.innerHTML = [
        ['Формат', FMTN[st.fmt] + ' мм'],
        ['Раскладка', LAYN[st.lay]],
        ['Площадь укладки', st.area + ' м²'],
        ['Запас на подрезку', Math.round(waste * 100) + '%'],
        ['Площадь с запасом', m(areaW, 1) + ' м²'],
        ['Площадь одной плитки', m(tileArea * 10000, 0) + ' см²'],
        ['Клей', m(glue, 1) + ' кг (≈ ' + m(glueRate, 1) + ' кг/м²)'],
        ['Клей в мешках', Math.ceil(glue / 25) + ' × 25 кг'],
        ['Затирка', m(grout, 1) + ' кг (шов ' + st.joint + ' мм)'],
        ['Крестики / СВП', packs + ' уп. по 100'],
        ['Гребёнка', f.notch + ' мм']
      ].map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('');
      o.f.textContent = 'Плиток = ' + st.area + ' × ' + m(1 + waste, 2) + ' / ' + m(tileArea, 3) + ' = ' + count + ' шт · клей ≈ 0,6 × ' + f.notch + ' = ' + m(glueRate, 1) + ' кг/м² · затирка ≈ (' + f.a + '+' + f.b + ')/(' + f.a + '×' + f.b + ') × ' + st.joint + ' × ' + m(depth, 1) + ' × 1,6 = ' + m(groutRate, 3) + ' кг/м²';
      o.go.href = WA + '?text=' + encodeURIComponent(
        'Заявка с сайта: укладка плитки.\nФормат: ' + FMTN[st.fmt] + ' мм\nРаскладка: ' + LAYN[st.lay] +
        '\nПлощадь: ' + st.area + ' м²\nШов: ' + st.joint + ' мм' +
        '\nПлитки с запасом: ' + count + ' шт.\nКлей: ' + m(glue, 1) + ' кг' +
        '\nЗатирка: ' + m(grout, 1) + ' кг' +
        '\n\nПодскажите стоимость работы и когда можно посмотреть объект.');
    }

    ['tFmt', 'tLay'].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('button'); if (!btn || !box.contains(btn)) return;
        if (id === 'tFmt') st.fmt = btn.getAttribute('data-v'); else st.lay = btn.getAttribute('data-v');
        [].forEach.call(box.children, function (c) { c.setAttribute('aria-pressed', c === btn ? 'true' : 'false'); });
        draw(); calc();
      });
    });
    var ar = document.getElementById('tArea');
    if (ar) ar.addEventListener('input', function () { st.area = parseInt(ar.value, 10); calc(); });
    var jr = document.getElementById('tJointR');
    if (jr) jr.addEventListener('input', function () { st.joint = parseInt(jr.value, 10); draw(); calc(); });
    draw(); calc();
  }

  function initLead() {
    var f = document.getElementById('lead');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = document.getElementById('lName'), t = document.getElementById('lTel');
      var area = document.getElementById('lArea'), city = document.getElementById('lCity'), task = document.getElementById('lTask');
      var bad = false;
      [n, t].forEach(function (el) {
        if (!el.value.trim()) { el.style.borderColor = '#1E5C4A'; bad = true; } else { el.style.borderColor = ''; }
      });
      if (bad) return;
      var msg = 'Заявка с сайта: плитка и ремонт.\nИмя: ' + n.value.trim() + '\nТелефон: ' + t.value.trim() +
        (area && area.value.trim() ? '\nПлощадь: ' + area.value.trim() + ' м²' : '') +
        (city && city.value.trim() ? '\nАдрес: ' + city.value.trim() : '') +
        (task && task.value.trim() ? '\nЗадача: ' + task.value.trim() : '') +
        '\n\nФото помещения прикреплю следом.';
      window.open(WA + '?text=' + encodeURIComponent(msg), '_blank');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDrawer(); initTile(); initLead();
    var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
  });
})();
