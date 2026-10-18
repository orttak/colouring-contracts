/* Colouring Building Contract — community presentation.
   Plain JavaScript, no dependencies. All data shown here is illustrative. */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function svg(tag, attrs, parent, text) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function html(tag, attrs, parent, content) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") n.className = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    if (content != null) n.innerHTML = content;
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* Small deterministic random generator, so the illustrations are stable. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pickWeighted(r, table) {
    var total = 0, k;
    for (k in table) total += table[k];
    var x = r() * total;
    for (k in table) { x -= table[k]; if (x <= 0) return k; }
    return k;
  }

  /* Accessible tabs with arrow-key navigation. */
  function wireTabs(list, onSelect) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    return select;
  }

  /* ------------------------------------------------------------------ palettes */
  var USE = {
    residential: { label: "Residential", c: "#e8a33d" },
    commercial: { label: "Commercial", c: "#d4622f" },
    hospitality: { label: "Hospitality", c: "#e98aa6" },
    industrial: { label: "Industrial", c: "#7a5aa6" },
    public_services: { label: "Public services", c: "#3b6fb6" },
    education: { label: "Education", c: "#45a3a8" },
    health: { label: "Health", c: "#c2457a" },
    leisure: { label: "Leisure", c: "#6fae5a" },
    agriculture_forestry: { label: "Agriculture & forestry", c: "#a39235" },
    ancillary: { label: "Ancillary", c: "#b5aa97" },
    other: { label: "Other", c: "#8a857c" }
  };
  var NODATA = "#ddd5c6";
  var AGE_BINS = [
    { max: 1900, label: "before 1900", c: "#4b2f68" },
    { max: 1945, label: "1900–1944", c: "#6f4f9c" },
    { max: 1970, label: "1945–1969", c: "#9a78c2" },
    { max: 2000, label: "1970–1999", c: "#c2a6de" },
    { max: 9999, label: "2000 and later", c: "#e7dbf3" }
  ];
  var HEIGHT_BINS = [
    { max: 6, label: "under 6 m", c: "#d9eaf5" },
    { max: 12, label: "6–12 m", c: "#a3cde8" },
    { max: 20, label: "12–20 m", c: "#62a9d6" },
    { max: 35, label: "20–35 m", c: "#2b86bd" },
    { max: 999, label: "35 m and more", c: "#16507d" }
  ];
  var STOREY_BINS = [
    { max: 2, label: "1–2", c: "#d4ebdf" },
    { max: 4, label: "3–4", c: "#8fcbb0" },
    { max: 7, label: "5–7", c: "#3f9a7b" },
    { max: 99, label: "8 and more", c: "#1f604b" }
  ];
  var CONDITION = {
    functional: { label: "Functional", c: "#5c9a78" },
    underConstruction: { label: "Under construction", c: "#e0b32f" },
    declined: { label: "Declined", c: "#b07a4a" },
    ruin: { label: "Ruin", c: "#7e4636" }
  };
  function binColour(bins, v) {
    for (var i = 0; i < bins.length; i++) if (v < bins[i].max || i === bins.length - 1) return bins[i].c;
  }
  function binColourInclusive(bins, v) {
    for (var i = 0; i < bins.length; i++) if (v <= bins[i].max) return bins[i].c;
    return bins[bins.length - 1].c;
  }

  /* ================================================================== navigation */
  var sections = $$("main > section");
  var dotsNav = $("#dots");
  var dotLinks = sections.map(function (s) {
    var a = html("a", { href: "#" + s.id, "aria-label": s.dataset.label }, dotsNav);
    html("span", null, a).textContent = s.dataset.label;
    return a;
  });
  var topLinks = $$(".topnav a");
  var topbar = $(".topbar");
  var bar = $("#progress-bar");
  var current = 0;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    topbar.classList.toggle("scrolled", y > 8);

    var mid = window.innerHeight * 0.45;
    var idx = 0;
    sections.forEach(function (s, i) { if (s.getBoundingClientRect().top <= mid) idx = i; });
    current = idx;
    dotLinks.forEach(function (d, i) { d.classList.toggle("active", i === idx); });
    var id = sections[idx].id;
    topLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + id); });

    var underBar = null;
    sections.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 30 && r.bottom > 30) underBar = s; });
    var footer = $(".footer");
    var overFooter = footer.getBoundingClientRect().top <= 30;
    topbar.classList.toggle("on-dark", overFooter || !!(underBar && underBar.classList.contains("section-dark")));
    dotsNav.classList.toggle("on-dark", sections[idx].classList.contains("section-dark"));
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  function goTo(i) {
    i = Math.max(0, Math.min(sections.length - 1, i));
    sections[i].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    if (t && (t.closest('[role="tablist"]') || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
  });

  /* Reveal on scroll */
  var revealTargets = $$(".section-head, .source-cloud, .compare, .orbit-figure, .pillar, .stats, .explorer, .rule, .anchor, .rulebook, .step, .ai-card, .pkg, .readers, .why, .mock, .poss-card, .zone-card, .ledger-col, .questions li, .takeaway");
  if ("IntersectionObserver" in window && !reduceMotion) {
    revealTargets.forEach(function (n) { n.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealTargets.forEach(function (n) { io.observe(n); });
  }

  /* ================================================================== hero skyline */
  (function skyline() {
    var s = $("#skyline");
    if (!s) return;
    var G = 318;
    var B = [
      { x: 18, w: 60, m: 14, roof: "gable", use: "residential", year: 1895 },
      { x: 82, w: 44, m: 22, roof: "flat", use: "residential", year: 1928 },
      { x: 130, w: 70, m: 8, roof: "flat", use: "commercial", year: 2004 },
      { x: 204, w: 38, m: 31, roof: "spire", use: "public_services", year: 1872 },
      { x: 246, w: 78, m: 43, roof: "flat", use: "commercial", year: 1998 },
      { x: 328, w: 54, m: 17, roof: "gable", use: "residential", year: 1912 },
      { x: 386, w: 62, m: 12, roof: "flat", use: "education", year: 1974 },
      { x: 452, w: 30, m: 5, roof: "gable", use: "ancillary", year: 1951 },
      { x: 486, w: 66, m: 26, roof: "flat", use: "health", year: 1983 },
      { x: 556, w: 66, m: 18, roof: "shed", use: "hospitality", year: 2017 }
    ];
    var defs = svg("defs", null, s);
    var pat = svg("pattern", { id: "win", width: 12, height: 15, patternUnits: "userSpaceOnUse" }, defs);
    svg("rect", { x: 3, y: 4, width: 6, height: 8, rx: 1, fill: "rgba(255,255,255,.55)" }, pat);

    svg("rect", { x: 0, y: 0, width: 640, height: 360, fill: "#fbf8f2" }, s);
    for (var gy = 40; gy < G; gy += 40) svg("line", { x1: 0, x2: 640, y1: gy, y2: gy, stroke: "#eee6d8", "stroke-width": 1 }, s);

    var shapes = B.map(function (b) {
      var h = b.m * 6.2;
      var top = G - h;
      var g = svg("g", { class: "bldg" }, s);
      svg("title", null, g, "Hypothetical building · " + USE[b.use].label + " · completed " + b.year + " · " + b.m + " m");
      var body = svg("rect", { class: "bld", x: b.x, y: top, width: b.w, height: h }, g);
      var roof = null;
      if (b.roof === "gable") roof = svg("polygon", { class: "bld-roof", points: [b.x - 3, top, b.x + b.w / 2, top - b.w * 0.42, b.x + b.w + 3, top].join(" ") }, g);
      else if (b.roof === "spire") roof = svg("polygon", { class: "bld-roof", points: [b.x, top, b.x + b.w / 2, top - 58, b.x + b.w, top].join(" ") }, g);
      else if (b.roof === "shed") roof = svg("polygon", { class: "bld-roof", points: [b.x, top, b.x, top - 16, b.x + b.w, top].join(" ") }, g);
      else svg("rect", { x: b.x - 2, y: top - 4, width: b.w + 4, height: 4, fill: "rgba(28,26,23,.35)" }, g);
      svg("rect", { x: b.x + 4, y: top + 6, width: b.w - 8, height: h - 22, fill: "url(#win)", "pointer-events": "none" }, g);
      svg("rect", { x: b.x + b.w / 2 - 5, y: G - 14, width: 10, height: 14, fill: "rgba(28,26,23,.28)" }, g);
      return { b: b, body: body, roof: roof };
    });
    svg("line", { x1: 0, x2: 640, y1: G, y2: G, stroke: "#1c1a17", "stroke-width": 2 }, s);
    svg("rect", { x: 0, y: G + 1, width: 640, height: 41, fill: "#ece4d4" }, s);

    var frame = s.parentNode;
    var legend = html("div", { class: "mini-legend", "aria-live": "polite" }, frame);

    function legendHTML(items) {
      return items.map(function (it) { return '<span><i style="background:' + it.c + '"></i>' + esc(it.label) + "</span>"; }).join("");
    }
    function paint(mode) {
      shapes.forEach(function (o) {
        var b = o.b, c;
        if (mode === "use") c = USE[b.use].c;
        else if (mode === "age") c = binColour(AGE_BINS, b.year);
        else if (mode === "height") c = binColour(HEIGHT_BINS, b.m);
        else c = "#cfc6b6";
        o.body.style.fill = c;
        if (o.roof) o.roof.style.fill = mode === "none" ? "#b9af9d" : shade(c, -0.18);
      });
      var items;
      if (mode === "use") {
        var seen = {};
        items = B.filter(function (b) { if (seen[b.use]) return false; seen[b.use] = 1; return true; }).map(function (b) { return USE[b.use]; });
        legend.innerHTML = legendHTML(items.map(function (u) { return { c: u.c, label: u.label }; }));
      } else if (mode === "age") legend.innerHTML = legendHTML(AGE_BINS);
      else if (mode === "height") legend.innerHTML = legendHTML(HEIGHT_BINS);
      else legend.innerHTML = '<span class="raw">Same buildings, no shared meaning yet.</span>';
    }
    $$(".skyline-controls .pill").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".skyline-controls .pill").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        paint(btn.dataset.colour);
      });
    });
    paint("use");
  })();

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))); }
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }

  /* ================================================================== problem: one building, many descriptions */
  (function compare() {
    var fig = $("#building-figure");
    if (!fig) return;
    var SRC = { A: "#c2457a", B: "#3b6fb6", C: "#2f8a73" };
    var G = 380, X0 = 120, X1 = 260, ROOF = 140, CHIM = 102, FLOOR = 40;

    var defs = svg("defs", null, fig);
    var hatch = svg("pattern", { id: "hatch", width: 8, height: 8, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    svg("rect", { width: 8, height: 8, fill: "#e3dccf" }, hatch);
    svg("line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#c9bfae", "stroke-width": 3 }, hatch);
    ["A", "B", "C"].forEach(function (k) {
      var m = svg("marker", { id: "ar" + k, viewBox: "0 0 10 10", refX: 5, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
      svg("path", { d: "M0 1 L9 5 L0 9 z", fill: SRC[k] }, m);
    });

    // sky + ground
    svg("rect", { x: 0, y: 0, width: 380, height: 470, fill: "#fbf8f2" }, fig);
    svg("rect", { x: 0, y: G, width: 380, height: 90, fill: "#ece4d4" }, fig);
    svg("line", { x1: 0, x2: 380, y1: G, y2: G, stroke: "#1c1a17", "stroke-width": 2 }, fig);

    // building
    var base = svg("g", null, fig);
    svg("rect", { x: 222, y: CHIM, width: 14, height: ROOF - CHIM, fill: "#8d7f6b" }, base);
    svg("rect", { x: 219, y: CHIM - 4, width: 20, height: 5, fill: "#6f6352" }, base);
    var body = svg("rect", { x: X0, y: ROOF, width: X1 - X0, height: G - ROOF, fill: "#e6dccb", stroke: "#1c1a17", "stroke-width": 1.5 }, base);
    svg("rect", { x: X0 - 4, y: ROOF - 6, width: X1 - X0 + 8, height: 6, fill: "#1c1a17" }, base);
    for (var f = 1; f < 6; f++) {
      var fy = ROOF + f * FLOOR;
      svg("line", { x1: X0, x2: X1, y1: fy, y2: fy, stroke: "rgba(28,26,23,.18)" }, base);
    }
    for (f = 0; f < 5; f++) {
      for (var w = 0; w < 3; w++) {
        svg("rect", { x: X0 + 18 + w * 40, y: ROOF + f * FLOOR + 10, width: 24, height: 22, fill: "#fbf8f2", stroke: "rgba(28,26,23,.35)" }, base);
      }
    }
    // shopfront
    svg("rect", { x: X0 + 10, y: G - 32, width: 54, height: 32, fill: "#fbf8f2", stroke: "rgba(28,26,23,.4)" }, base);
    svg("rect", { x: X0 + 76, y: G - 32, width: 54, height: 32, fill: "#fbf8f2", stroke: "rgba(28,26,23,.4)" }, base);
    svg("path", { d: "M" + (X0 + 6) + " " + (G - 36) + " h62 l-6 10 h-50 z", fill: "#c2457a", opacity: 0.85 }, base);

    var layers = {};
    function layer(name) { layers[name] = svg("g", { class: "anno" }, fig); return layers[name]; }

    function dim(g, x, y1, y2, k, label, sub, side) {
      svg("line", { x1: x, x2: x, y1: y1 - 3, y2: y2 + 3, stroke: SRC[k], "stroke-width": 2, "marker-start": "url(#ar" + k + ")", "marker-end": "url(#ar" + k + ")" }, g);
      var tx = side === "left" ? x - 8 : x + 8;
      var anchor = side === "left" ? "end" : "start";
      var my = (y1 + y2) / 2;
      svg("text", { x: tx, y: my - 4, "text-anchor": anchor, "font-size": 15, "font-weight": 700, fill: SRC[k] }, g, label);
      svg("text", { x: tx, y: my + 13, "text-anchor": anchor, "font-size": 11, fill: "#45403a" }, g, sub);
      badge(g, side === "left" ? x - 8 - 10 : x + 18, my - 34, k);
    }
    function badge(g, cx, cy, k) {
      svg("circle", { cx: cx, cy: cy, r: 10, fill: SRC[k] }, g);
      svg("text", { x: cx, y: cy + 4, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#fff" }, g, k);
    }

    // height layer
    var h = layer("height");
    svg("line", { x1: 40, x2: 340, y1: ROOF, y2: ROOF, stroke: SRC.B, "stroke-dasharray": "4 4", opacity: 0.6 }, h);
    svg("line", { x1: 40, x2: 340, y1: CHIM - 4, y2: CHIM - 4, stroke: SRC.A, "stroke-dasharray": "4 4", opacity: 0.6 }, h);
    dim(h, 92, G, ROOF, "B", "18.9 m", "to roof edge", "left");
    dim(h, 276, G, CHIM - 4, "A", "21.3 m", "to highest point", "right");
    for (var s = 0; s < 6; s++) {
      svg("text", { x: X1 - 10, y: G - s * FLOOR - 8, "text-anchor": "end", "font-size": 11, "font-weight": 700, fill: SRC.C }, h, String(s + 1));
    }
    badge(h, X1 + 2, G + 20, "C");
    svg("text", { x: X1 + 16, y: G + 24, "font-size": 11, fill: "#45403a" }, h, "6 levels");
    svg("circle", { cx: X0, cy: G, r: 5, fill: "#1c1a17" }, h);
    svg("text", { x: X0 - 4, y: G + 24, "text-anchor": "end", "font-size": 11, fill: "#45403a" }, h, "lowest ground point");

    // year layer: timeline 1950–1972
    var y = layer("year");
    var T0 = 1950, T1 = 1972, tx0 = 30, tx1 = 350, ty = 430;
    function tx(yr) { return tx0 + (yr - T0) / (T1 - T0) * (tx1 - tx0); }
    svg("line", { x1: tx0, x2: tx1, y1: ty, y2: ty, stroke: "#1c1a17", "stroke-width": 1.5 }, y);
    for (var yr = 1950; yr <= 1970; yr += 5) {
      svg("line", { x1: tx(yr), x2: tx(yr), y1: ty - 4, y2: ty + 4, stroke: "#1c1a17" }, y);
      svg("text", { x: tx(yr), y: ty + 20, "text-anchor": "middle", "font-size": 10, fill: "#6f675b" }, y, String(yr));
    }
    svg("rect", { x: tx(1960), y: ty - 22, width: tx(1969.99) - tx(1960), height: 8, rx: 4, fill: SRC.C, opacity: 0.35 }, y);
    svg("text", { x: tx(1965), y: ty - 28, "text-anchor": "middle", "font-size": 10, fill: SRC.C, "font-weight": 700 }, y, "C: 1960s");
    svg("circle", { cx: tx(1958), cy: ty, r: 7, fill: "#fbf8f2", stroke: SRC.A, "stroke-width": 3 }, y);
    svg("text", { x: tx(1958), y: ty - 14, "text-anchor": "end", "font-size": 10, fill: SRC.A, "font-weight": 700 }, y, "A: 1958 start");
    svg("circle", { cx: tx(1961), cy: ty, r: 7, fill: SRC.B }, y);
    svg("text", { x: tx(1961) + 2, y: ty + 36, "text-anchor": "middle", "font-size": 10, fill: SRC.B, "font-weight": 700 }, y, "B: 1961 completed");
    // scaffolding hint
    for (var sx = X0 - 10; sx <= X1 + 10; sx += 25) svg("line", { x1: sx, x2: sx, y1: ROOF - 10, y2: G, stroke: "#9b5a36", "stroke-width": 1.2, opacity: 0.55 }, y);
    for (var sy = ROOF; sy < G; sy += 40) svg("line", { x1: X0 - 10, x2: X1 + 10, y1: sy, y2: sy, stroke: "#9b5a36", "stroke-width": 1.2, opacity: 0.55 }, y);

    // use layer
    var u = layer("use");
    svg("rect", { x: X0, y: ROOF, width: X1 - X0, height: 5 * FLOOR, fill: USE.residential.c, opacity: 0.55 }, u);
    svg("rect", { x: X0, y: G - FLOOR, width: X1 - X0, height: FLOOR, fill: USE.commercial.c, opacity: 0.6 }, u);
    // share bar
    svg("rect", { x: 300, y: ROOF, width: 26, height: (G - ROOF) * 0.78, fill: USE.residential.c }, u);
    svg("rect", { x: 300, y: ROOF + (G - ROOF) * 0.78, width: 26, height: (G - ROOF) * 0.22, fill: USE.commercial.c }, u);
    svg("text", { x: 313, y: ROOF - 10, "text-anchor": "middle", "font-size": 10, fill: "#45403a" }, u, "floor area");
    svg("text", { x: 313, y: ROOF + (G - ROOF) * 0.39, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#1c1a17" }, u, "78%");
    svg("text", { x: 313, y: G - 18, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#fff" }, u, "22%");
    badge(u, 342, ROOF + 10, "B");
    // POI pin
    var px = X0 + 37, py = G - 52;
    svg("path", { d: "M" + px + " " + (py + 14) + " c-9 -10 -12 -14 -12 -20 a12 12 0 1 1 24 0 c0 6 -3 10 -12 20 z", fill: SRC.C, stroke: "#fff", "stroke-width": 1.5 }, u);
    svg("circle", { cx: px, cy: py - 6, r: 4, fill: "#fff" }, u);
    svg("text", { x: 50, y: py - 30, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: SRC.C }, u, "café");
    svg("text", { x: 50, y: py - 17, "text-anchor": "middle", "font-size": 10, fill: "#45403a" }, u, "(a POI)");
    badge(u, X0 + 8, ROOF + 18, "A");

    // missing layer
    var m = layer("missing");
    svg("rect", { x: X0, y: ROOF, width: X1 - X0, height: G - ROOF, fill: "url(#hatch)", opacity: 0.92 }, m);
    svg("text", { x: (X0 + X1) / 2, y: 290, "text-anchor": "middle", "font-size": 96, "font-family": "Georgia, serif", fill: "#6f675b" }, m, "?");
    [["A", "0", 70, 200], ["B", "9999", 316, 230], ["C", "“ ”", 70, 300]].forEach(function (d) {
      badge(m, d[2] - 26, d[3] - 5, d[0]);
      var t = svg("text", { x: d[2], y: d[3], "text-anchor": "start", "font-size": 15, "font-family": "ui-monospace, monospace", "font-weight": 700, fill: SRC[d[0]] }, m, d[1]);
      t.setAttribute("text-decoration", "line-through");
    });
    svg("rect", { x: 140, y: 404, width: 100, height: 30, rx: 15, fill: "#1c1a17" }, m);
    svg("text", { x: 190, y: 424, "text-anchor": "middle", "font-size": 14, "font-family": "ui-monospace, monospace", fill: "#ffd98a" }, m, "null");

    var DATA = {
      height: {
        sources: [
          ["A", "3D city model", "height = 21.3", "measured to the highest point — chimney included"],
          ["B", "Building register", "height = 18.9", "measured to the roof edge"],
          ["C", "Community map", "levels = 6", "a storey count, not a height"]
        ],
        contract: [
          ["height_m", "18.9", "Always lowest ground point → highest roof edge. Drives the height map and 3D view."],
          ["height_highest_point_m", "21.3", "Kept as a card detail. Never replaces height_m."],
          ["storeys_above_ground", "6", "A storey count never becomes a height."]
        ],
        foot: "Three numbers, three meanings — now each one has its own place."
      },
      year: {
        sources: [
          ["A", "3D city model", "year = 1958", "the year construction began"],
          ["B", "Building register", "built = 1961", "the year it was completed"],
          ["C", "Community map", "start_date = 1960s", "a decade, not a year"]
        ],
        contract: [
          ["construction_year", "1961", "The completion year."],
          ["construction_start_year", "1958", "A separate attribute. The two are never copied into each other."],
          ["construction_year_earliest / _latest", "1960 / 1969", "When only a range is known, it stays a range — never a fake exact year."]
        ],
        foot: "“Year built” stops being ambiguous."
      },
      use: {
        sources: [
          ["A", "3D city model", "function = residential", "a single class for the whole building"],
          ["B", "Building register", "flats 78 % · shops 22 %", "floor-area shares"],
          ["C", "Community map", "amenity = cafe", "a café on the ground floor"]
        ],
        contract: [
          ["current_use", "residential", "The INSPIRE top-level use, decided by the largest floor-area share."],
          ["current_use_detail", "residential", "One of eleven Colouring classes under that parent."],
          ["use_is_mixed", "true", "Another use has 20 % or more of the floor area."]
        ],
        foot: "The café is a point of interest. On its own, it never changes what the building is."
      },
      missing: {
        sources: [
          ["A", "3D city model", "year = 0", "a placeholder for “unknown”"],
          ["B", "Building register", "year = 9999", "another placeholder"],
          ["C", "Community map", "year = “”", "an empty string"]
        ],
        contract: [
          ["construction_year", "null", "Unknown is null. 0, 9999, empty strings and placeholder years never stand in for “unknown”."]
        ],
        foot: "On the map, unknown gets a neutral “no data” shade — never a zero, never a fake class."
      }
    };

    var cards = $("#source-cards"), contract = $("#contract-card"), panel = $("#compare-panel");
    function show(q) {
      Object.keys(layers).forEach(function (k) { layers[k].classList.toggle("on", k === q); });
      body.setAttribute("fill", q === "missing" ? "#e3dccf" : "#e6dccb");
      var d = DATA[q];
      cards.innerHTML = d.sources.map(function (s) {
        return '<li class="source-card fade-swap"><p class="src-name"><b>Source ' + s[0] + "</b><span>" + esc(s[1]) + '</span><span class="src-badge" style="background:' + SRC[s[0]] + '">' + s[0] + '</span></p><p class="src-val">' + esc(s[2]) + '</p><p class="src-note">' + esc(s[3]) + "</p></li>";
      }).join("");
      contract.innerHTML = '<p class="cc-head"><span>Contract 0.1.0 · draft</span></p>' + d.contract.map(function (c) {
        return '<div class="cc-row fade-swap"><code>' + esc(c[0]) + '</code> <span class="cc-val">= ' + esc(c[1]) + "</span><p>" + esc(c[2]) + "</p></div>";
      }).join("") + '<p class="cc-foot fade-swap">' + esc(d.foot) + "</p>";
    }
    wireTabs($(".compare-tabs"), function (tab) {
      panel.setAttribute("aria-labelledby", tab.id);
      show(tab.dataset.q);
    });
    show("height");
  })();

  /* ================================================================== idea: shared core + local orbit */
  (function orbit() {
    var s = $("#orbit");
    if (!s) return;
    var C = 260;
    var ring = svg("circle", { cx: C, cy: C, r: 190, fill: "none", stroke: "#c4b69d", "stroke-width": 1.5, "stroke-dasharray": "3 7" }, s);
    if (!reduceMotion) {
      var an = svg("animate", { attributeName: "stroke-dashoffset", from: "0", to: "-100", dur: "12s", repeatCount: "indefinite" }, ring);
      void an;
    }
    var SATS = [
      { k: "de_", a: -90, c: "#d4622f", info: "<b>de_…</b> e.g. a national building-function code, kept exactly as the source defines it." },
      { k: "gb_", a: -18, c: "#7a5aa6", info: "<b>gb_…</b> e.g. a local heritage listing grade, with its own labels and legend." },
      { k: "osm_", a: 54, c: "#2f8a73", info: "<b>osm_…</b> e.g. community tags such as roof colour, declared as crowd-mapped detail." },
      { k: "overture_", a: 126, c: "#2b86bd", info: "<b>overture_…</b> e.g. source-specific identifiers or classes, kept with their provenance." },
      { k: "your_", a: 198, c: "#c2457a", info: "<b>your prefix</b> Whatever your place needs — described with labels, kind, filter and legend so any compatible map can show it." }
    ];
    var info = html("p", { class: "orbit-info", "aria-live": "polite" }, s.parentNode.insertBefore(document.createElement("div"), s.nextSibling));
    info.parentNode.className = "orbit-info-wrap";

    var linesG = svg("g", null, s);
    var core = svg("g", { class: "sat core", tabindex: 0, role: "button", "aria-label": "Shared core, Tier 1" }, s);
    svg("circle", { class: "sat-ring", cx: C, cy: C, r: 112, fill: "#1c1a17", stroke: "#1c1a17", "stroke-width": 1 }, core);
    // category colour arcs around the core
    var cats = ["#4f6d9a", "#d4622f", "#d9a521", "#7a5aa6", "#2f8a73", "#9b5a36", "#c2457a", "#2b86bd"];
    cats.forEach(function (c, i) {
      var a0 = (i / 8) * Math.PI * 2 - Math.PI / 2 + 0.03, a1 = ((i + 1) / 8) * Math.PI * 2 - Math.PI / 2 - 0.03, r = 122;
      svg("path", { d: "M" + (C + r * Math.cos(a0)) + " " + (C + r * Math.sin(a0)) + " A" + r + " " + r + " 0 0 1 " + (C + r * Math.cos(a1)) + " " + (C + r * Math.sin(a1)), stroke: c, "stroke-width": 8, fill: "none", "stroke-linecap": "round" }, core);
    });
    svg("text", { x: C, y: C - 34, "text-anchor": "middle", "font-size": 12, "letter-spacing": "2", fill: "#b9b2a6", "font-family": "ui-monospace, monospace" }, core, "TIER 1");
    svg("text", { x: C, y: C - 4, "text-anchor": "middle", "font-size": 27, fill: "#f4efe5", "font-family": "Palatino, P052, Georgia, serif" }, core, "Shared core");
    svg("text", { x: C, y: C + 22, "text-anchor": "middle", "font-size": 11.5, fill: "#ffd98a", "font-family": "ui-monospace, monospace" }, core, "height_m · current_use");
    svg("text", { x: C, y: C + 39, "text-anchor": "middle", "font-size": 11.5, fill: "#ffd98a", "font-family": "ui-monospace, monospace" }, core, "construction_year · …");
    svg("text", { x: C, y: C + 62, "text-anchor": "middle", "font-size": 10.5, fill: "#b9b2a6" }, core, "same meaning everywhere");

    var nodes = [{ g: core, info: "<b>Tier 1 — the shared core.</b> 64 attributes in eight categories with one meaning in every delivery: 3 required, 9 core, the rest optional." }];
    SATS.forEach(function (sat) {
      var a = sat.a * Math.PI / 180;
      var x = C + 190 * Math.cos(a), y = C + 190 * Math.sin(a);
      svg("line", { x1: C + 128 * Math.cos(a), y1: C + 128 * Math.sin(a), x2: C + 140 * Math.cos(a) + (x - C - 140 * Math.cos(a)) * 0.62, y2: C + 140 * Math.sin(a) + (y - C - 140 * Math.sin(a)) * 0.62, stroke: sat.c, "stroke-width": 1.5, "stroke-dasharray": "2 4" }, linesG);
      var g = svg("g", { class: "sat", tabindex: 0, role: "button", "aria-label": "Local attributes with prefix " + sat.k }, s);
      svg("circle", { class: "sat-ring", cx: x, cy: y, r: 50, fill: "#fbf8f2", stroke: sat.c, "stroke-width": 2, "stroke-dasharray": sat.k === "your_" ? "5 4" : "none" }, g);
      svg("text", { x: x, y: y - 2, "text-anchor": "middle", "font-size": sat.k.length > 5 ? 13 : 17, "font-weight": 700, fill: sat.c, "font-family": "ui-monospace, monospace" }, g, sat.k);
      svg("text", { x: x, y: y + 16, "text-anchor": "middle", "font-size": 10.5, fill: "#6f675b" }, g, sat.k === "your_" ? "+ your extras" : "Tier 2 · local");
      nodes.push({ g: g, info: sat.info });
    });

    function activate(n) {
      nodes.forEach(function (o) { o.g.classList.toggle("active", o === n); });
      info.innerHTML = n.info;
    }
    nodes.forEach(function (n) {
      n.g.addEventListener("click", function () { activate(n); });
      n.g.addEventListener("mouseenter", function () { activate(n); });
      n.g.addEventListener("focus", function () { activate(n); });
      n.g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(n); } });
    });
    activate(nodes[0]);
  })();

  /* ================================================================== contract explorer */
  (function explorer() {
    var tabsEl = $("#cat-tabs"), panel = $("#cat-panel");
    if (!tabsEl) return;
    var CATS = [
      { k: "identity", n: "Identity", count: 7, blurb: "Which building is this, and where is it? The only required attributes live here.",
        attrs: [
          ["building_id", "R", "A stable identifier within the producer’s namespace."],
          ["geometry", "R", "The 2D outline, with a declared reference: ground footprint or roofprint."],
          ["record_kind", "R", "A whole building or a building part."],
          ["parent_building_id", "X", "The building that a part belongs to."],
          ["is_underground", "X", "The building lies entirely below ground, e.g. an underground car park."],
          ["name", "X", "The building’s public name."]
        ], more: "Plus the source’s own identifier, with its namespace." },
      { k: "land_use", n: "Land Use", count: 6, blurb: "What the building is actually used for — as a whole, decided by floor-area share.",
        attrs: [
          ["current_use", "C", "Dominant actual use, one of five INSPIRE top-level values."],
          ["current_use_detail", "C", "Dominant actual use, one of eleven Colouring classes."],
          ["use_is_mixed", "C", "Another use has 20 % or more of the floor area."],
          ["intended_use", "X", "The officially intended function. Not the actual use."]
        ], tree: true, more: "Plus the most specific INSPIRE use code and the residential floor share." },
      { k: "size", n: "Size", count: 9, blurb: "How big is it? Every measurement has one fixed reference.",
        attrs: [
          ["height_m", "C", "Lowest ground point to the highest roof edge."],
          ["storeys_above_ground", "C", "All storeys above ground, attic storeys included."],
          ["footprint_area_m2", "C", "Ground footprint area — never computed from a roofprint."],
          ["height_highest_point_m", "X", "To the highest point, chimneys and antennas included. Card detail only."],
          ["floor_area_m2", "X", "Floor area under a declared convention. Different conventions are never compared."],
          ["geometry_lod", "X", "Level of detail of the source 3D model. Not a quality score."]
        ], more: "Plus storeys below ground, eaves height and gross volume." },
      { k: "age", n: "Age", count: 7, blurb: "When was it built, and what state is it in today?",
        attrs: [
          ["construction_year", "C", "The year construction was completed."],
          ["construction_start_year", "C", "The year construction began — a separate attribute."],
          ["construction_condition", "C", "Lifecycle state, from the six INSPIRE values."],
          ["construction_year_earliest / _latest", "X", "A plausible range when the exact year is unknown."],
          ["last_major_renovation_year", "X", "The year of the last major renovation."],
          ["demolition_year", "X", "The year of demolition, for deliveries that keep historic records."]
        ], chips: ["functional", "declined", "ruin", "demolished", "projected", "underConstruction"], chipsNote: "By default, maps hide demolished and projected records; people can show them." },
      { k: "typology", n: "Typology", count: 4, blurb: "What kind of structure is it?",
        attrs: [
          ["building_nature", "X", "For noticeable or non-building structures, from the INSPIRE list. A card detail, not a use class."],
          ["roof_shape", "X", "Dominant roof shape.", "code list to be defined"],
          ["building_attachment_type", "X", "Detached, semi-detached, end- or mid-terrace.", "code list to be defined"],
          ["roof_slope_deg", "X", "Representative pitch of the main roof surface."]
        ], chips: ["canopy", "tower", "silo", "storageTank", "windTurbine", "greenhouse", "church", "castle", "…"], chipsNote: "Examples of INSPIRE building-nature values." },
      { k: "construction", n: "Construction", count: 4, blurb: "What is it made of? One dominant value for the whole building.",
        attrs: [
          ["structural_material", "X", "Dominant load-bearing material. Not the facade.", "code list to be defined"],
          ["facade_material", "X", "Dominant visible material of the external walls.", "code list to be defined"],
          ["roof_covering_material", "X", "Dominant roof covering material.", "code list to be defined"],
          ["structural_system", "X", "Predominant load-bearing system.", "code list to be defined"]
        ], more: "Until a code list is agreed, such data can only travel as local Tier 2 attributes. A material derived from a building type is marked as inferred, not observed." },
      { k: "planning", n: "Planning", count: 11, draft: true, blurb: "Legal status, not measurements — with dates, legal force and how they were attached.",
        attrs: [
          ["heritage_designated", "X", "On a formal protected-building register. “No” only with complete register coverage."],
          ["in_heritage_area", "X", "Inside a heritage or conservation area. Not individual protection."],
          ["demolition_proposed", "X", "A documented, active demolition proposal. Not a permit."],
          ["planned_use_hilucs", "X", "Planned land use. Never the same as the building’s actual use."],
          ["planning_max_height_m", "X", "The legal maximum height, with its vertical reference."],
          ["planning_max_far", "X", "Legal maximum floor-area ratio — distinct from site coverage."]
        ], more: "Draft attributes, still to be reviewed one by one." },
      { k: "energy", n: "Energy", count: 16, draft: true, blurb: "Every energy value declares its basis, period, method, reference area and carriers.",
        attrs: [
          ["energy_certificate_class", "E", "A rating under a named scheme. Classes from different schemes are not comparable."],
          ["space_heating_useful_demand_kwh_a", "E", "Annual useful space-heating demand."],
          ["final_energy_demand_kwh_a", "E", "Annual modelled final energy demand."],
          ["final_energy_consumption_kwh_a", "E", "Annual metered consumption. Never substituted for demand."],
          ["main_heating_carrier", "E", "Predominant heating energy carrier — not the same as the system."],
          ["solar_pv_present", "E", "A PV installation is known to exist."]
        ], more: "Draft attributes, anchored on the CityGML Energy ADE." }
    ];

    var TREE = [
      ["residential", ["residential"]],
      ["agriculture", ["agriculture_forestry"]],
      ["industrial", ["industrial"]],
      ["commerceAndServices", ["commercial", "hospitality", "leisure", "public_services", "education", "health"]],
      ["ancillary", ["ancillary"]]
    ];

    CATS.forEach(function (c, i) {
      var b = html("button", { role: "tab", class: "cat-tab", id: "cat-" + c.k, "aria-controls": "cat-panel", "aria-selected": i === 0 ? "true" : "false", style: "--cat: var(--c-" + c.k + ")" }, tabsEl);
      b.tabIndex = i === 0 ? 0 : -1;
      b.dataset.k = c.k;
      b.innerHTML = '<span class="sw" style="background: var(--c-' + c.k + ')"></span>' + esc(c.n) + '<span class="cnt">' + c.count + "</span>";
    });

    function render(k) {
      var c = CATS.filter(function (x) { return x.k === k; })[0];
      var out = '<div class="cat-panel-head fade-swap"><h3>' + esc(c.n) + "</h3>" + (c.draft ? '<span class="draft-flag">Draft · not yet reviewed</span>' : "") + '<span class="col-label" style="margin:0">' + c.count + " attributes</span></div>";
      out += '<p class="cat-blurb fade-swap">' + esc(c.blurb) + "</p>";
      out += '<ul class="attr-list">' + c.attrs.map(function (a) {
        return '<li class="attr fade-swap"><div class="attr-top"><span class="lvl lvl-' + a[1] + '" title="Level">' + a[1] + "</span><code>" + esc(a[0]) + "</code>" + (a[3] ? '<span class="tbd">' + esc(a[3]) + "</span>" : "") + "</div><p>" + esc(a[2]) + "</p></li>";
      }).join("") + "</ul>";
      if (c.tree) {
        out += '<div class="tree fade-swap"><p class="tree-title">Two levels of use: INSPIRE parent → Colouring class</p><div class="tree-grid">' + TREE.map(function (t) {
          return '<div class="tree-col"><span class="tree-parent">' + t[0] + "</span>" + t[1].map(function (ch) {
            return '<span class="tree-child" style="--uc:' + USE[ch].c + '">' + ch + "</span>";
          }).join("") + "</div>";
        }).join("") + '</div><p class="tree-note">Plus <code>other</code> for a known use outside the list. There is no “mixed” and no “unknown” class: mixed use has its own flag, unknown is null.</p></div>';
      }
      if (c.chips) {
        out += '<div class="chips-inline fade-swap">' + c.chips.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + "</div>";
        if (c.chipsNote) out += '<p class="attr-more">' + esc(c.chipsNote) + "</p>";
      }
      if (c.more) out += '<p class="attr-more">' + esc(c.more) + "</p>";
      panel.innerHTML = out;
      panel.setAttribute("aria-labelledby", "cat-" + k);
    }
    wireTabs(tabsEl, function (tab) { render(tab.dataset.k); });
    render("identity");
  })();

  /* ================================================================== workflow */
  (function workflow() {
    var steps = $$(".flow .step"), rules = $$("#rulebook .rb-items li"), hint = $("#rb-hint");
    if (!steps.length) return;
    var NAMES = { 1: "Translate", 2: "Package & check", 3: "Share & use" };
    var active = null;
    function set(k) {
      active = k;
      steps.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.step === k ? "true" : "false"); });
      rules.forEach(function (li) {
        var used = !k || li.dataset.steps.split(" ").indexOf(k) > -1;
        li.classList.toggle("dim", !used);
        li.classList.toggle("lit", !!k && used);
      });
      hint.textContent = k ? "Step " + k + " · " + NAMES[k] + " uses the highlighted rules. Select it again to show all." : "Every step reads from it.";
    }
    steps.forEach(function (b) {
      b.addEventListener("click", function () { set(active === b.dataset.step ? null : b.dataset.step); });
    });
  })();

  /* ================================================================== readers */
  (function readers() {
    var panel = $("#reader-panel"), tree = $("#pkg-tree");
    if (!panel) return;
    var R = {
      people: {
        t: "Look at it",
        lead: "Open the map and colour buildings by use, age or height in a web browser, with no server to install.",
        pts: [
          "<b>PMTiles</b> is the map view: one file that a browser reads piece by piece as you zoom.",
          "Ready-made <b>styles</b> mean every theme looks right out of the box.",
          "The <b>README</b> explains, in plain language, what is inside, where it comes from and the licence.",
          "Missing data is drawn as neutral “no data”, never as zero."
        ],
        ex: '<p class="rp-ex-k">For example</p><p>A planner opens Place A in a compatible map and colours it by age, without writing any code.</p>'
      },
      software: {
        t: "Compute with it",
        lead: "Analyse the data directly with common tools such as DuckDB, GeoPandas, QGIS or GDAL. Nothing has to be imported into a database first.",
        pts: [
          "<b>GeoParquet</b> is the data of record: a compact table with one row per building.",
          "It can be queried over the web without downloading the whole file.",
          "<b>catalog.json</b> follows STAC, a common standard, so catalogue search tools can find the package.",
          "Same column names and codes everywhere: change <code>place-a</code> to <code>place-b</code> and the query still works."
        ],
        ex: '<p class="rp-ex-k">For example · a query</p><pre class="code"><code><span class="c">-- buildings before 1950, by use</span>\nSELECT current_use, count(*)\nFROM \'place-a/buildings/buildings.parquet\'\nWHERE construction_year &lt; 1950\nGROUP BY current_use;</code></pre>'
      },
      agents: {
        t: "Ask it questions",
        lead: "An AI agent is an AI assistant that can open files and run queries by itself. The package tells it what it needs to know to answer honestly.",
        pts: [
          "<b>AGENTS.md</b> tells it what the data is, how to query it and what to watch out for.",
          "The contract metadata tells it what every column means, how it was measured and how complete it is.",
          "So it can say “unknown” instead of guessing, and name its sources."
        ],
        ex: '<p class="rp-ex-k">For example · illustrative answer · hypothetical “Place C”</p>' +
          '<div class="chat"><p class="chat-q">What share of the buildings in Place C are homes?</p>' +
          '<p class="chat-a">Use is known for <b>62 %</b> of buildings (from an administrative record). Of those, <b>7 in 10</b> are residential. The other 38 % are <b>unknown</b>, so I am not counting them as non-residential. Construction year is not provided in this package, so I can’t split this by age.</p></div>' +
          '<p class="rp-guard"><b>Agent-ready is not agent-trusted.</b> An agent reads and answers; it does not change or publish data on its own. A sentence in AGENTS.md proves nothing: only the checks do.</p>'
      }
    };
    var items = $$("li[data-for]", tree);
    wireTabs($(".reader-tabs"), function (tab) { render(tab.dataset.r); })($('.reader-tab[aria-selected="true"]'), false);
    function render(k) {
      var d = R[k];
      items.forEach(function (li) { li.classList.toggle("on", li.dataset.for.split(" ").indexOf(k) > -1); });
      tree.dataset.r = k;
      panel.innerHTML = '<div class="fade-swap"><h3>' + esc(d.t) + '</h3><p class="rp-lead">' + esc(d.lead) + '</p><ul class="rp-pts">' +
        d.pts.map(function (p) { return "<li>" + p + "</li>"; }).join("") + '</ul><div class="rp-ex">' + d.ex + "</div></div>";
    }
  })();

  /* ================================================================== mock map */
  (function mockMap() {
    var mapSvg = $("#mock-map");
    if (!mapSvg) return;
    var W = 600, H = 400;

    var THEMES = [
      { k: "use", n: "Use", attr: "use" },
      { k: "height", n: "Height", attr: "height" },
      { k: "year", n: "Construction year", attr: "year" },
      { k: "storeys", n: "Storeys", attr: "storeys" },
      { k: "condition", n: "Condition", attr: "condition" }
    ];
    var PLACES = {
      a: {
        seed: 11, prefix: "A",
        provided: { use: 0.99, height: 1, year: 0.86, storeys: 0.95, condition: 1 },
        cats: [["identity", "available"], ["land_use", "available"], ["size", "available"], ["age", "available"], ["typology", "not_provided"], ["construction", "not_provided"], ["planning", "not_provided"], ["energy", "restricted"]],
        catNotes: { energy: "withheld · licence" }
      },
      b: {
        seed: 29, prefix: "B",
        provided: { use: 0.45, height: null, year: null, storeys: 0.25, condition: null },
        cats: [["identity", "available"], ["land_use", "available"], ["size", "available"], ["age", "not_provided"], ["typology", "not_provided"], ["construction", "not_provided"], ["planning", "not_provided"], ["energy", "not_provided"]],
        catNotes: { land_use: function (cov) { return "coverage " + cov("use") + " %"; }, size: function (cov) { return "storeys only · " + cov("storeys") + " %"; } }
      }
    };
    var CATNAME = { identity: "Identity", land_use: "Land Use", size: "Size", age: "Age", typology: "Typology", construction: "Construction", planning: "Planning", energy: "Energy" };
    var STATE_LABEL = { available: "available", not_provided: "not provided", restricted: "restricted", not_applicable: "not applicable" };

    function generate(place) {
      var r = rng(place.seed);
      var streetsX = [200, 405], streetsY = [128, 268], SW = 18;
      var xs = [0].concat(streetsX.map(function (x) { return [x - SW / 2, x + SW / 2]; }).reduce(function (a, b) { return a.concat(b); }, []), [W]);
      var ys = [0].concat(streetsY.map(function (y) { return [y - SW / 2, y + SW / 2]; }).reduce(function (a, b) { return a.concat(b); }, []), [H]);
      var blocks = [];
      for (var i = 0; i < xs.length; i += 2) for (var j = 0; j < ys.length; j += 2) blocks.push([xs[i], ys[j], xs[i + 1], ys[j + 1]]);
      var bld = [];
      var id = 100;
      blocks.forEach(function (bk, bi) {
        var pad = 7, x0 = bk[0] + pad, y0 = bk[1] + pad, x1 = bk[2] - pad, y1 = bk[3] - pad;
        var depthTop = 30 + r() * 14, depthBot = 30 + r() * 14;
        [["top", y0, depthTop], ["bottom", y1 - depthBot, depthBot]].forEach(function (row) {
          var x = x0;
          while (x < x1 - 14) {
            var w = 20 + r() * 30;
            if (x + w > x1) w = x1 - x;
            if (w >= 12 && r() > 0.08) {
              var d = row[2] * (0.75 + r() * 0.25);
              var y = row[0] === "top" ? row[1] : y1 - d;
              bld.push({ x: x, y: y, w: w - 2, h: d, big: false, id: id++ });
            }
            x += w;
          }
        });
        var midY0 = y0 + depthTop + 8, midY1 = y1 - depthBot - 8;
        if (midY1 - midY0 > 16 && r() > 0.3) {
          var mw = (x1 - x0) * (0.3 + r() * 0.35);
          var mx = x0 + r() * (x1 - x0 - mw);
          bld.push({ x: mx, y: midY0, w: mw, h: midY1 - midY0, big: true, id: id++ });
        }
      });
      bld.forEach(function (b) {
        var use = b.big ? pickWeighted(r, { education: 4, health: 2, public_services: 3, leisure: 2, commercial: 2, industrial: 2 })
          : pickWeighted(r, { residential: 60, commercial: 11, hospitality: 4, industrial: 3, public_services: 3, ancillary: 8, leisure: 2, other: 1 });
        var year = Math.round(r() < 0.15 ? 1860 + r() * 40 : 1900 + r() * 123);
        var height = use === "ancillary" ? 3 + r() * 2.5 : use === "commercial" && r() > 0.6 ? 18 + r() * 30 : 6 + r() * 20;
        if (b.big) height = 8 + r() * 14;
        var cond = pickWeighted(r, { functional: 90, underConstruction: 5, declined: 3, ruin: 1, projected: 1 });
        if (cond === "underConstruction" || cond === "projected") year = null;
        b.v = {
          use: use,
          height: Math.round(height * 10) / 10,
          year: year,
          storeys: Math.max(1, Math.round(height / 3.1)),
          condition: cond
        };
        b.idStr = place.prefix + "-" + String(b.id).padStart(5, "0");
        // per-record nulls according to coverage
        b.d = {};
        Object.keys(place.provided).forEach(function (k) {
          var p = place.provided[k];
          if (p == null) b.d[k] = undefined;
          else b.d[k] = r() < p ? b.v[k] : null;
          if (k === "year" && b.d[k] != null && b.v.year == null) b.d[k] = null;
        });
      });
      return bld;
    }

    var state = { place: "a", theme: "use", sel: null, data: {} };
    Object.keys(PLACES).forEach(function (k) { state.data[k] = generate(PLACES[k]); });

    var chipsEl = $("#theme-chips"), reasonEl = $("#theme-reason"), legendEl = $("#legend"), cardEl = $("#bcard"), catsEl = $("#cats-state");
    var mapWrap = mapSvg.parentNode;
    var overlay = html("div", { class: "map-overlay", hidden: "" }, mapWrap);
    var overlayText = html("span", null, overlay);

    function coverage(place, k) {
      var p = PLACES[place].provided[k];
      if (p == null) return null;
      var list = state.data[place].filter(function (b) { return b.v.condition !== "projected"; });
      var nn = list.filter(function (b) { return b.d[k] != null; }).length;
      return Math.round(nn / list.length * 100);
    }

    function colourFor(b, theme) {
      var v = b.d[theme];
      if (v == null) return NODATA;
      if (theme === "use") return USE[v].c;
      if (theme === "height") return binColour(HEIGHT_BINS, v);
      if (theme === "year") return binColour(AGE_BINS, v);
      if (theme === "storeys") return binColourInclusive(STOREY_BINS, v);
      if (theme === "condition") return CONDITION[v] ? CONDITION[v].c : NODATA;
    }

    function drawMap() {
      while (mapSvg.firstChild) mapSvg.removeChild(mapSvg.firstChild);
      var defs = svg("defs", null, mapSvg);
      var p = svg("pattern", { id: "nd", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
      svg("rect", { width: 6, height: 6, fill: NODATA }, p);
      svg("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "rgba(0,0,0,.10)", "stroke-width": 2 }, p);
      svg("rect", { width: W, height: H, fill: "#ece6da" }, mapSvg);
      [200, 405].forEach(function (x) { svg("rect", { x: x - 9, y: 0, width: 18, height: H, fill: "#fbf8f2" }, mapSvg); });
      [128, 268].forEach(function (y) { svg("rect", { x: 0, y: y - 9, width: W, height: 18, fill: "#fbf8f2" }, mapSvg); });
      svg("path", { d: "M0 360 C 120 340, 220 395, 330 372 S 520 330, 600 350 L600 400 L0 400 Z", fill: "#cfe0e6", opacity: 0.7 }, mapSvg);

      var list = state.data[state.place];
      list.forEach(function (b) {
        if (b.v.condition === "projected") return; // default filter hides projected records
        var r = svg("rect", { class: "fp", x: b.x.toFixed(1), y: b.y.toFixed(1), width: b.w.toFixed(1), height: b.h.toFixed(1), tabindex: 0, role: "button", "aria-label": "Building " + b.idStr }, mapSvg);
        b.node = r;
        r.addEventListener("click", function () { select(b); });
        r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(b); } });
      });
      paint();
    }

    function paint() {
      var list = state.data[state.place];
      var avail = PLACES[state.place].provided[state.theme] != null;
      mapSvg.classList.toggle("dimmed", !avail);
      list.forEach(function (b) {
        if (!b.node) return;
        var c = colourFor(b, state.theme);
        b.node.style.fill = avail ? (c === NODATA ? "url(#nd)" : c) : "";
        b.node.classList.toggle("selected", state.sel === b);
      });
      overlay.hidden = avail;
      if (!avail) overlayText.textContent = THEMES.filter(function (t) { return t.k === state.theme; })[0].n + " is not in this delivery. The theme stays visible but inactive — the map does not pretend.";
      renderLegend(avail);
    }

    function legendRows(items) {
      return items.map(function (it) {
        return '<div class="legend-row"><span class="legend-sw' + (it.nd ? " nd" : "") + '" style="' + (it.nd ? "" : "background:" + it.c) + '"></span>' + esc(it.label) + "</div>";
      }).join("");
    }
    function renderLegend(avail) {
      if (!avail) { legendEl.innerHTML = ""; return; }
      var t = state.theme, items;
      var list = state.data[state.place];
      if (t === "use") {
        var present = {};
        list.forEach(function (b) { if (b.d.use != null && b.v.condition !== "projected") present[b.d.use] = 1; });
        items = Object.keys(USE).filter(function (k) { return present[k]; }).map(function (k) { return { c: USE[k].c, label: USE[k].label }; });
      } else if (t === "height") items = HEIGHT_BINS;
      else if (t === "year") items = AGE_BINS;
      else if (t === "storeys") items = STOREY_BINS.map(function (s) { return { c: s.c, label: s.label + " storeys" }; });
      else items = Object.keys(CONDITION).map(function (k) { return { c: CONDITION[k].c, label: CONDITION[k].label }; });
      items = items.concat([{ nd: true, label: "No data" }]);
      var title = THEMES.filter(function (x) { return x.k === t; })[0].n;
      legendEl.innerHTML = '<div class="legend-title">' + esc(title) + '</div><div class="legend-items">' + legendRows(items) + "</div>";
    }

    function renderChips() {
      chipsEl.innerHTML = "";
      THEMES.forEach(function (t) {
        var cov = coverage(state.place, t.k);
        var b = html("button", { type: "button", class: "theme-chip" + (cov == null ? " unavailable" : ""), "aria-pressed": state.theme === t.k ? "true" : "false" }, chipsEl);
        b.innerHTML = esc(t.n) + '<span class="cov">' + (cov == null ? "—" : cov + "%") + "</span>";
        b.setAttribute("aria-label", t.n + (cov == null ? ", not provided" : ", coverage " + cov + " percent"));
        b.addEventListener("click", function () { state.theme = t.k; renderChips(); paint(); renderReason(); });
      });
      renderReason();
    }
    function renderReason() {
      var cov = coverage(state.place, state.theme);
      var t = THEMES.filter(function (x) { return x.k === state.theme; })[0];
      if (cov == null) reasonEl.innerHTML = "<b>not provided</b> · " + esc(t.n) + " has no column in this delivery, so the theme is shown as inactive with its reason.";
      else if (state.theme === "condition") reasonEl.innerHTML = "<b>available</b> · coverage " + cov + " %. Projected and demolished records are hidden by default.";
      else reasonEl.innerHTML = "<b>available</b> · coverage " + cov + " %" + (cov < 100 ? " — unknown buildings keep a neutral, hatched “no data” fill." : ".");
    }

    function fmt(b, k) {
      var p = PLACES[state.place].provided[k];
      if (p == null) return { cls: "np", t: "not in this delivery" };
      var v = b.d[k];
      if (v == null) return { cls: "nd", t: "no data" };
      if (k === "use") return { t: USE[v].label };
      if (k === "height") return { t: v.toFixed(1) + " m" };
      if (k === "condition") return { t: CONDITION[v] ? CONDITION[v].label : v };
      return { t: String(v) };
    }
    function renderCard() {
      var b = state.sel;
      if (!b) { cardEl.innerHTML = '<div class="bcard-empty">Select a building on the map to see its card.</div>'; return; }
      var rows = [["Use", "use"], ["Height", "height"], ["Completed", "year"], ["Storeys", "storeys"], ["Condition", "condition"]];
      cardEl.innerHTML = '<h4 class="fade-swap">Building <code>' + esc(b.idStr) + "</code></h4><dl>" + rows.map(function (r) {
        var f = fmt(b, r[1]);
        return "<dt>" + esc(r[0]) + '</dt><dd class="' + (f.cls || "") + '">' + esc(f.t) + "</dd>";
      }).join("") + '</dl><p class="bcard-note">“No data” = unknown for this building. “Not in this delivery” = no column at all. Values are generated.</p>';
    }
    function select(b) { state.sel = b; paint(); renderCard(); }

    function renderCats() {
      var P = PLACES[state.place];
      catsEl.innerHTML = P.cats.map(function (c) {
        var note = P.catNotes[c[0]];
        if (typeof note === "function") note = note(function (k) { return coverage(state.place, k); });
        var cls = c[1] === "available" && note ? "st-partial" : "st-" + c[1];
        return '<li><span class="sw" style="background: var(--c-' + c[0] + ')"></span>' + CATNAME[c[0]] + '<span class="st ' + cls + '">' + esc(note || STATE_LABEL[c[1]]) + "</span></li>";
      }).join("");
    }

    function setPlace(p) {
      state.place = p; state.sel = null;
      $$(".seg button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.place === p ? "true" : "false"); });
      drawMap(); renderChips(); renderCard(); renderCats();
    }
    $$(".seg button").forEach(function (b) { b.addEventListener("click", function () { setPlace(b.dataset.place); }); });
    setPlace("a");
  })();

  /* ================================================================== copy questions */
  (function copyQuestions() {
    var btn = $("#copy-questions"), status = $("#copy-status");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var text = "Colouring Building Contract — draft proposal: questions for the community\n\n" + $$("#questions li").map(function (li, i) {
        return (i + 1) + ". [" + $(".q-topic", li).textContent + "] " + $("h3", li).textContent + "\n   " + $("p:not(.q-topic)", li).textContent;
      }).join("\n\n") + "\n";
      function done(ok) { status.textContent = ok ? "Copied to clipboard." : "Copy failed — please select the text manually."; setTimeout(function () { status.textContent = ""; }, 3500); }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback(text)); });
      } else done(fallback(text));
    });
    function fallback(text) {
      var ta = html("textarea", { "aria-hidden": "true", style: "position:fixed;top:-1000px;opacity:0" }, document.body);
      ta.value = text; ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  })();

  onScroll();
})();
