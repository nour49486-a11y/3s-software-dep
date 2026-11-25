/* 3S liquid background — the hero's particle sculpture as a fixed, full-page backdrop
   (used by newuser.html and edit.html).
   - one fixed canvas behind everything; the cursor "melts" the logo even when it is over the form
   - same engine as hero.js (GPU blit of the crisp logo + particles only where it is disturbed)
   - theme follows <html data-theme>; the loop sleeps when nothing moves or the tab is hidden */
(function () {
  if (!document.querySelector(".login-page, .person-form-page")) return;
  if (window.__loginBgInitialized) {
    window.__wakeLoginBg?.();
    return;
  }
  window.__loginBgInitialized = true;
  var LOGO_SRC = "";
  var rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = matchMedia("(pointer: coarse)").matches;
  var MAX_P = coarse ? 6000 : 11000; // particle budget

  var cv = document.createElement("canvas");
  cv.id = "bgCv";
  cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);
  var ctx = cv.getContext("2d");

  // 3S site colours: navy #103868, blue #276db6, cyan #58c8f0
  var RAMP = {
    light: ["#103868", "#276db6", "#9fdcf7", "#3b86cf", "#0b2a52"],
    dark: ["#276db6", "#58c8f0", "#eaf8ff", "#7ccdf3", "#276db6"],
  };
  var ACCENT = { light: [42, 169, 224], dark: [88, 200, 240] };

  var W = 0,
    H = 0,
    dpr = 1,
    N = 0,
    ds = 2,
    dsI = 2,
    nact = 0;
  var R = { x: 0, y: 0, w: 1, h: 1 };
  var RG = { x: 0, y: 0, w: 1, h: 1 }; // redraw region around the sculpture
  var off = null,
    disp = null;
  var hx, hy, ox, oy, vx, vy, sd, ck, ck2, act, keys, ord, sorted;
  var cnt = new Int32Array(8192),
    pos = new Int32Array(8192),
    used = new Int32Array(8192);
  var palS = [];
  var intro = 1,
    time = 0,
    running = false,
    visible = true,
    last = 0,
    first = true,
    touched = false;
  var lod = 1,
    ema = 16.7,
    qc = 0; // auto quality
  var m = {
    x: -1e4,
    y: -1e4,
    tx: -1e4,
    ty: -1e4,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    pres: 0,
    pt: 0,
    burst: 0,
  };
  var trail = [],
    lastTx = -1e4,
    lastTy = -1e4,
    tick = 0;
  var logo = new Image();
  var logoOK = false;

  // one soft round "eraser" reused for every cursor hole
  var sprite = (function () {
    var s = document.createElement("canvas");
    s.width = s.height = 96;
    var c = s.getContext("2d");
    var g = c.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.6, "rgba(0,0,0,.85)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 96, 96);
    return s;
  })();

  function theme() {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  }
  function hexRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function gradAt(stops, t) {
    t = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    var i = Math.min(stops.length - 2, Math.floor(t)),
      f = t - i;
    var a = stops[i],
      b = stops[i + 1];
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
  }
  // 12-bit colour key -> css colour (cached)
  function colStr(k) {
    return (
      palS[k] ||
      (palS[k] =
        "rgb(" +
        (((k >> 8) & 15) * 16 + 8) +
        "," +
        (((k >> 4) & 15) * 16 + 8) +
        "," +
        ((k & 15) * 16 + 8) +
        ")")
    );
  }

  function paintSculpture(w, h, th) {
    var o = off.getContext("2d", { willReadFrequently: true });
    var hex = RAMP[th],
      stops = hex.map(hexRgb),
      acc = ACCENT[th];
    o.clearRect(0, 0, w, h);

    if (logoOK) {
      // two-tone mask: grey body (re-lit with the blue metal ramp) + accent parallelogram
      o.drawImage(logo, 0, 0, w, h);
      var im = o.getImageData(0, 0, w, h),
        p = im.data;
      // 256-step colour lookup table: no per-pixel array allocation (was the slowest part of the first paint)
      var lut = new Uint8ClampedArray(256 * 3);
      for (var q = 0; q < 256; q++) {
        var gc = gradAt(stops, q / 255);
        lut[q * 3] = gc[0];
        lut[q * 3 + 1] = gc[1];
        lut[q * 3 + 2] = gc[2];
      }
      var iw = 1 / w,
        ih = 1 / h;
      for (var y = 0; y < h; y++) {
        var ry = y * ih;
        for (var x = 0; x < w; x++) {
          var i = (y * w + x) * 4;
          if (p[i + 3] === 0) continue;
          if (p[i] - p[i + 2] > 60) {
            p[i] = acc[0];
            p[i + 1] = acc[1];
            p[i + 2] = acc[2];
          } else {
            var gi = ((x * iw + ry) * 127.5) | 0;
            if (gi > 255) gi = 255;
            var g3 = gi * 3;
            p[i] = lut[g3];
            p[i + 1] = lut[g3 + 1];
            p[i + 2] = lut[g3 + 2];
          }
        }
      }
      o.putImageData(im, 0, 0);
    } else {
      var fs = h * 1.02,
        fam = '"Geist","Helvetica Neue",Arial,sans-serif';
      o.font = "800 " + fs + "px " + fam;
      o.textAlign = "center";
      var mt = o.measureText("3S");
      fs *= Math.min(1, (w * 0.97) / mt.width);
      o.font = "800 " + fs + "px " + fam;
      mt = o.measureText("3S");
      var ty =
        h / 2 + (mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2;
      var g = o.createLinearGradient(0, 0, w, h);
      hex.forEach(function (c, i) {
        g.addColorStop(i / (hex.length - 1), c);
      });
      o.fillStyle = g;
      o.fillText("3S", w / 2, ty);
    }

    // filament stripes + soft highlight, clipped to the artwork
    o.globalCompositeOperation = "source-atop";
    o.lineWidth = Math.max(1, dpr * 1.1);
    o.strokeStyle = th === "light" ? "rgba(0,0,20,.16)" : "rgba(0,10,40,.24)";
    for (var k = -h; k < w + h; k += 5 * dpr) {
      o.beginPath();
      o.moveTo(k, 0);
      o.lineTo(k + h * 0.6, h);
      o.stroke();
    }
    var hg = o.createRadialGradient(
      w * 0.32,
      h * 0.28,
      0,
      w * 0.32,
      h * 0.28,
      w * 0.5,
    );
    hg.addColorStop(0, "rgba(255,255,255,.45)");
    hg.addColorStop(1, "rgba(255,255,255,0)");
    o.fillStyle = hg;
    o.fillRect(0, 0, w, h);
    o.globalCompositeOperation = "source-over";
  }

  function radius() {
    return Math.max(90, (Math.min(W, 1440) / 1440) * 210);
  }

  function build() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);

    // big, centred sculpture behind the form
    var asp = logoOK ? logo.naturalWidth / logo.naturalHeight : 1.5;
    var rw = Math.min(W * (W < 640 ? 0.96 : 0.86), H * 0.86 * asp, 1100),
      rh = rw / asp;
    R = { x: W / 2 - rw / 2, y: H / 2 - rh / 2, w: rw, h: rh };

    // only this area is cleared/redrawn each frame (sculpture + room for flying particles)
    var M = Math.round(radius() * 1.2 + 80);
    var rx0 = Math.max(0, R.x - M),
      ry0 = Math.max(0, R.y - M),
      rx1 = Math.min(W, R.x + R.w + M),
      ry1 = Math.min(H, R.y + R.h + M);
    RG = {
      x: Math.floor(rx0),
      y: Math.floor(ry0),
      w: Math.ceil(rx1 - rx0),
      h: Math.ceil(ry1 - ry0),
    };

    off = document.createElement("canvas");
    off.width = Math.round(rw * dpr);
    off.height = Math.round(rh * dpr);
    var w = off.width,
      h = off.height;
    paintSculpture(w, h, theme());

    // sample particles from the painted sculpture
    var id = off
        .getContext("2d", { willReadFrequently: true })
        .getImageData(0, 0, w, h).data,
      count = 0,
      i;
    for (i = 3; i < id.length; i += 4) if (id[i] > 128) count++;
    var step = Math.max(1, Math.sqrt(count / (W < 640 ? MAX_P * 0.6 : MAX_P))),
      px = [],
      py = [],
      pk = [],
      pk2 = [];
    for (var yy = 0; yy < h; yy += step) {
      for (var xx = 0; xx < w; xx += step) {
        var sx = Math.min(w - 1, Math.floor(xx + Math.random() * step * 0.8)),
          sy = Math.min(h - 1, Math.floor(yy + Math.random() * step * 0.8));
        i = (sy * w + sx) * 4;
        if (id[i + 3] < 128) continue;
        var r4 = id[i] >> 4,
          g4 = id[i + 1] >> 4,
          b4 = id[i + 2] >> 4;
        px.push(sx / dpr);
        py.push(sy / dpr);
        pk.push((r4 << 8) | (g4 << 4) | b4);
        pk2.push(
          (Math.min(15, r4 + 1) << 8) |
            (Math.min(15, g4 + 1) << 4) |
            Math.min(15, b4 + 1),
        ); // brighter, for streaks
      }
    }
    // GPU-friendly copy that is only ever drawn, never read back
    disp = document.createElement("canvas");
    disp.width = w;
    disp.height = h;
    disp.getContext("2d").drawImage(off, 0, 0);
    off = null;

    N = px.length;
    ds = Math.max(1.2, (step / dpr) * 1.45);
    hx = new Float32Array(px);
    hy = new Float32Array(py);
    ck = new Uint16Array(pk);
    ck2 = new Uint16Array(pk2);
    ox = new Float32Array(N);
    oy = new Float32Array(N);
    vx = new Float32Array(N);
    vy = new Float32Array(N);
    sd = new Float32Array(N);
    act = new Int32Array(N);
    keys = new Uint16Array(N);
    ord = new Int32Array(N);
    sorted = new Int32Array(N);
    for (i = 0; i < N; i++) {
      sd[i] = Math.random();
      if (first && !rm) {
        ox[i] = (Math.random() - 0.5) * R.w * 0.45;
        oy[i] = (Math.random() - 0.5) * R.h * 0.8;
      }
    }
    if (first && !rm) intro = 0;
    first = false;
    trail = [];
    nact = 0;
    wake();
  }

  function step(dt) {
    var r = radius(),
      r2 = r * r,
      cut = r2 * 3,
      ir2 = 1 / r2,
      mx = m.x - R.x,
      my = m.y - R.y,
      pres = Math.max(m.pres, m.burst),
      str = (1 + m.burst * 1.5) * (rm ? 0.5 : 1);
    var inIntro = intro < 1,
      damp = Math.pow(inIntro ? 0.9 : 0.94, dt), // stronger damping + spring during the intro = fast, clean assembly
      ik = inIntro ? 2.4 : 1,
      na = 0;
    var st = inIntro ? 1 : lod,
      mvx = m.vx * 0.05,
      mvy = m.vy * 0.05;
    var t1 = time,
      t2 = time * 0.8,
      t3 = time * 2;
    for (var i = 0; i < N; i += st) {
      var oxi = ox[i],
        oyi = oy[i],
        vxi = vx[i],
        vyi = vy[i];
      var X = hx[i] + oxi,
        Y = hy[i] + oyi,
        dx = X - mx,
        dy = Y - my,
        d2 = dx * dx + dy * dy;
      var near = pres > 0.001 && d2 < cut;
      // at rest and out of reach: nothing to do
      if (!near && !inIntro && oxi === 0 && oyi === 0 && vxi === 0 && vyi === 0)
        continue;
      var ax = 0,
        ay = 0;
      if (near) {
        var q = d2 * ir2,
          f = pres / (1 + q + 0.5 * q * q + 0.1667 * q * q * q), // cheap exp(-q)
          inv = 1 / Math.sqrt(d2 + 1),
          nx = dx * inv,
          ny = dy * inv,
          l = 0.45 + sd[i] * 1.1;
        ax = (nx * 1.1 * str - ny * 1.3) * f * l + mvx * f;
        ay = (ny * 1.1 * str + nx * 1.3) * f * l + mvy * f;
        ax += Math.sin(Y * 0.03 + t1) * f * 0.7;
        ay += Math.cos(X * 0.03 - t2) * f * 0.7;
      }
      var k = (0.012 + 0.02 * sd[i]) * ik;
      ax -= oxi * k;
      ay -= oyi * k;
      if (inIntro) {
        ax += Math.sin(Y * 0.02 + t3) * 0.05 * (1 - intro);
        ay += Math.cos(X * 0.02 + t3) * 0.05 * (1 - intro);
      }
      vxi = (vxi + ax * dt) * damp;
      vyi = (vyi + ay * dt) * damp;
      oxi += vxi * dt;
      oyi += vyi * dt;
      if (
        Math.abs(oxi) + Math.abs(oyi) < 0.15 &&
        Math.abs(vxi) + Math.abs(vyi) < 0.05
      ) {
        oxi = oyi = vxi = vyi = 0;
        if (inIntro) act[na++] = i;
      } else act[na++] = i;
      ox[i] = oxi;
      oy[i] = oyi;
      vx[i] = vxi;
      vy[i] = vyi;
    }
    nact = na;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(RG.x, RG.y, RG.w, RG.h);
    if (!disp) return;
    var ia = 1;
    if (intro < 1) {
      ia = Math.max(0, Math.min(1, (intro - 0.45) / 0.5));
      ia = ia * ia * (3 - 2 * ia); // smoothstep cross-fade particles -> crisp logo
    }
    if (ia > 0) {
      ctx.globalAlpha = ia;
      ctx.drawImage(disp, R.x, R.y, R.w, R.h);
      // the cursor "melts" the crisp image; particles take over inside the hole
      if (trail.length) {
        ctx.globalCompositeOperation = "destination-out";
        var rr = radius() * 0.8;
        for (var t = 0; t < trail.length; t++) {
          var p = trail[t],
            rad = rr * (0.6 + 0.4 * p.l);
          ctx.globalAlpha = p.p * Math.min(1, p.l * 1.5) * 0.95;
          ctx.drawImage(sprite, p.x - rad, p.y - rad, rad * 2, rad * 2);
        }
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
    }
    if (intro < 1 && ia > 0.98) return;

    // bucket the moving particles by colour: one fillStyle per colour, not per particle
    var nk = 0,
      nu = 0,
      i,
      k2,
      key,
      X,
      Y;
    var gx0 = RG.x - R.x,
      gy0 = RG.y - R.y,
      gx1 = gx0 + RG.w,
      gy1 = gy0 + RG.h;
    for (var k = 0; k < nact; k++) {
      i = act[k];
      var oxi = ox[i],
        oyi = oy[i];
      if (intro >= 1 && Math.abs(oxi) + Math.abs(oyi) < 0.35) continue;
      X = hx[i] + oxi;
      Y = hy[i] + oyi;
      if (X < gx0 || X > gx1 || Y < gy0 || Y > gy1) continue; // outside the redraw region
      key = Math.abs(vx[i]) + Math.abs(vy[i]) < 2 ? ck[i] : 4096 + ck2[i];
      if (cnt[key] === 0) used[nu++] = key;
      cnt[key]++;
      keys[nk] = key;
      ord[nk++] = i;
    }
    var run = 0;
    for (k2 = 0; k2 < nu; k2++) {
      key = used[k2];
      pos[key] = run;
      run += cnt[key];
    }
    for (k2 = 0; k2 < nk; k2++) sorted[pos[keys[k2]]++] = ord[k2];

    dsI = Math.max(1, Math.round(ds * Math.sqrt(lod))); // bigger dots when auto-quality thinned them out
    var half = dsI / 2,
      ox0 = R.x - half,
      oy0 = R.y - half,
      j = 0;
    ctx.lineCap = "round";
    ctx.lineWidth = dsI;
    for (k2 = 0; k2 < nu; k2++) {
      key = used[k2];
      var end = j + cnt[key];
      if (key < 4096) {
        ctx.fillStyle = colStr(key);
        for (; j < end; j++) {
          i = sorted[j];
          ctx.fillRect(
            (ox0 + hx[i] + ox[i]) | 0,
            (oy0 + hy[i] + oy[i]) | 0,
            dsI,
            dsI,
          );
        }
      } else {
        ctx.strokeStyle = colStr(key - 4096);
        ctx.beginPath();
        for (; j < end; j++) {
          i = sorted[j];
          X = R.x + hx[i] + ox[i];
          Y = R.y + hy[i] + oy[i];
          var s = Math.min(1.1, 14 / (Math.abs(vx[i]) + Math.abs(vy[i])));
          ctx.moveTo(X, Y);
          ctx.lineTo(X - vx[i] * s, Y - vy[i] * s);
        }
        ctx.stroke();
      }
      cnt[key] = 0;
    }
  }

  // end of intro: snap the (already invisible) tiny leftovers so the loop can go idle
  function settle() {
    for (var i = 0; i < N; i++) {
      if (Math.abs(ox[i]) + Math.abs(oy[i]) < 6) {
        ox[i] = oy[i] = vx[i] = vy[i] = 0;
      }
    }
    nact = 0;
  }

  function frame(now) {
    if (!document.querySelector(".login-page, .person-form-page")) { running = false; return; }
    if (!running) return;
    if (!visible) {
      running = false;
      return;
    }
    var raw = now - last;
    var dt = Math.min(2, Math.max(0.25, raw / 16.667));
    last = now;
    m.x += (m.tx - m.x) * (1 - Math.pow(0.78, dt));
    m.y += (m.ty - m.y) * (1 - Math.pow(0.78, dt));
    m.vx += (Math.max(-40, Math.min(40, (m.x - m.px) / dt)) - m.vx) * 0.5;
    m.vy += (Math.max(-40, Math.min(40, (m.y - m.py) / dt)) - m.vy) * 0.5;
    m.px = m.x;
    m.py = m.y;
    m.pres +=
      (m.pt - m.pres) * (1 - Math.pow(1 - (m.pt > m.pres ? 0.1 : 0.035), dt));
    if (m.pres < 0.001 && !m.pt) m.pres = 0;
    m.burst = Math.max(0, m.burst - 0.1 * dt);
    var pr = Math.max(m.pres, m.burst);

    // fewer, spaced-out hole points (each one is a big blit)
    if (pr > 0.05 && m.x > -9000) {
      var ddx = m.x - lastTx,
        ddy = m.y - lastTy;
      if (ddx * ddx + ddy * ddy > 144 || tick++ % 4 === 0) {
        trail.push({ x: m.x, y: m.y, p: pr, l: 1 });
        lastTx = m.x;
        lastTy = m.y;
        if (trail.length > 18) trail.shift();
      }
    }
    for (var t = trail.length - 1; t >= 0; t--) {
      trail[t].l -= dt / 40;
      if (trail[t].l <= 0) trail.splice(t, 1);
    }
    if (intro < 1) {
      intro = Math.min(1, intro + dt / 72); // ~1.2s (was ~2.5s)
      if (intro >= 1) settle();
    }
    time += (dt / 60) * (1 + pr * 1.5);
    step(dt);
    draw();

    // auto quality: if frames take too long while interacting, simulate fewer (bigger) particles
    if (intro >= 1 && pr > 0.1 && raw < 120) {
      ema += (raw - ema) * 0.08;
      if (++qc >= 40) {
        qc = 0;
        if (ema > 26 && lod < 3) {
          lod++;
          ema = 16.7;
        }
      }
    }
    if (pr > 0 || trail.length || nact > 0 || intro < 1)
      requestAnimationFrame(frame);
    else running = false;
  }

  function wake() {
    if (!document.querySelector(".login-page, .person-form-page") || running || !visible) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  window.__wakeLoginBg = wake;

  // pointer handlers on window: the cursor reaches the sculpture even while over the form card
  function setXY(e) {
    m.tx = e.clientX;
    m.ty = e.clientY;
  }
  window.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType === "touch" && e.buttons === 0 && e.pressure === 0)
        return;
      setXY(e);
      if (m.x < -9000) {
        m.x = m.px = m.tx;
        m.y = m.py = m.ty;
      }
      m.pt = 1;
      wake();
    },
    { passive: true },
  );
  window.addEventListener(
    "pointerdown",
    function (e) {
      // no burst when pressing form controls
      if (
        e.target.closest &&
        e.target.closest("input,select,textarea,button,a,label,.modal")
      )
        return;
      setXY(e);
      m.x = m.px = m.tx;
      m.y = m.py = m.ty;
      m.pt = 1;
      m.burst = 1;
      wake();
    },
    { passive: true },
  );
  function release(e) {
    if (e.pointerType === "touch") {
      setTimeout(function () {
        m.pt = 0;
        wake();
      }, 260);
    } else if (e.type !== "pointerup") {
      m.pt = 0;
      wake();
    }
  }
  window.addEventListener("pointerup", release, { passive: true });
  window.addEventListener("pointercancel", release, { passive: true });
  document.documentElement.addEventListener("pointerleave", release, {
    passive: true,
  });

  // sleep while the tab is hidden
  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    if (visible) wake();
  });

  // repaint in the new colours if data-theme changes (e.g. from another script)
  var rbt;
  new MutationObserver(function () {
    if (!disp) return;
    clearTimeout(rbt);
    rbt = setTimeout(build, 60);
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // rebuild on real size changes (ignore small height jumps from mobile address bars)
  var rt,
    lw = 0,
    lh = 0;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (!disp) return;
      if (Math.abs(innerWidth - lw) > 1 || Math.abs(innerHeight - lh) > 150) {
        lw = innerWidth;
        lh = innerHeight;
        build();
      }
    }, 150);
  });

  function go() {
    lw = innerWidth;
    lh = innerHeight;
    build();
  }

  // use the logo mask when the canvas can read it (needs http(s), not file://); otherwise draw "3S" text
  logo.onload = function () {
    try {
      var c = document.createElement("canvas");
      c.width = c.height = 2;
      var x = c.getContext("2d");
      x.drawImage(logo, 0, 0, 2, 2);
      x.getImageData(0, 0, 1, 1);
      logoOK = true;
    } catch (e) {
      logoOK = false;
    }
    go();
  };
  logo.onerror = go;
  if (LOGO_SRC) logo.src = LOGO_SRC;
  else go();
})();



