/* Diagrama de flujo del árbol (SVG) con el estado de la prueba en curso. */

const BAND_Y = { 1: [20, 290], 2: [290, 420], 3: [420, 700], 4: [700, 1190], 5: [1190, 1260], 6: [1260, 1410], 7: [1410, 1560], 8: [1560, 1700], 9: [1700, 1780] };
const COL = { A: 72, B: 212, C: 350, D: 488, E: 632 };
const BOX = { w: 122, h: 40 };
const POS = {
  N0: ["C", 55], N1: ["C", 120], N1a: ["D", 120], N1b: ["E", 120], N1c: ["E", 185], N1d: ["E", 250],
  E1: ["A", 125], E2: ["A", 195], H1: ["A", 265],
  AR1: ["A", 400], AR2: ["A", 465], AR3: ["A", 530],
  X1: ["A", 650],
  N2: ["C", 340], R0: ["E", 335], R0a: ["E", 392],
  N3: ["C", 455], T1: ["B", 535], N3a: ["C", 535], M1: ["D", 535], F1: ["E", 475], HM1: ["E", 537], I1: ["E", 600], I1a: ["E", 665],
  N4: ["C", 735], N5: ["C", 800], N5a: ["D", 800], R1: ["D", 870], N6: ["C", 870], N6a: ["C", 940], N7: ["C", 1010], N8: ["C", 1080], N8a: ["C", 1150],
  P1: ["C", 1225],
  N9: ["C", 1300], N9a: ["D", 1300], N10: ["C", 1370], R2: ["D", 1370],
  H2: ["C", 1445], H3: ["D", 1445], HD: ["C", 1515], HG: ["D", 1515],
  N11: ["C", 1595], N11a: ["C", 1665],
  S1: ["C", 1740], FIN: ["E", 1740],
};
const SHORT = {
  N0: "Bienvenida", N1: "Seguridad", N1a: "Modo silencioso", E1: "Alerta inminente", E2: "Ubicación", H1: "Agente prioridad 1",
  AR1: "Consentimiento", AR2: "Datos desaparecida", AR3: "Llamada tripartita", X1: "Burla o acoso",
  N2: "Autorización", R0: "Registro orientación", R0a: "Info. solicitada", N3: "Quién escribe", N3a: "Nombre y documento",
  T1: "Tercero", M1: "Menor de edad", F1: "Familiar feminicidio", HM1: "Hombres", I1: "Institucional",
  N4: "Municipio", N5: "Tipo de violencia", N5a: "Sexual < 72 h", R1: "Salud urgente", N6: "Quién agrede",
  N6a: "Fuerza pública", N7: "Convivencia", N8: "Recurrencia", N8a: "Denuncias previas", P1: "Pretamizaje A1–A7",
  N9: "Enfoque diferencial", N9a: "Jurisdicción", N10: "Qué necesita", R2: "Rutas", H2: "Profesional", H3: "Contacto agendado",
  N11: "Cierre", S1: "Seguimiento", FIN: "Fin",
  N1b: "Datos por escrito", N1c: "Registro preliminar", N1d: "¿En peligro? sí/no", I1a: "Datos funcionario",
  HD: "¿Agente disponible?", HG: "Caso en cola", N11a: "¿Algo más?",
};
const W = 720, H = 1795;

const EDGES = (() => {
  const set = new Set(), out = [];
  const add = (a, b, kind) => { const k = a + ">" + b; if (!set.has(k) && POS[a] && POS[b]) { set.add(k); out.push({ a, b, kind }); } };
  for (const [id, n] of Object.entries(NODES)) (n.opts || []).forEach(o => o.to && add(id, o.to));
  [["E1", "E2"], ["E1", "AR1"], ["N5", "N5a"], ["N5", "N6"], ["N7", "N8"], ["N8a", "P1"], ["P1", "H1"], ["P1", "H2"], ["P1", "N9"], ["N9", "N9a"], ["N9", "N10"]]
    .forEach(([a, b]) => add(a, b));
  return out;
})();

function xy(id) { const [c, y] = POS[id]; return { x: COL[c], y }; }

function isLong(a, b) {
  const p = xy(a), q = xy(b);
  if (q.y > p.y) return q.y - p.y > 230 || (Math.abs(p.x - q.x) > 300 && q.y - p.y > 120);
  return p.y - q.y > 90;
}

function edgePath(a, b) {
  const p = xy(a), q = xy(b), hw = BOX.w / 2, hh = BOX.h / 2;
  if (a === "S1" && b === "E1") return `M ${p.x - hw} ${p.y} H 10 V ${q.y} H ${q.x - hw - 2}`;
  if (Math.abs(p.y - q.y) < 30) {
    const s = q.x > p.x ? 1 : -1;
    return `M ${p.x + s * hw} ${p.y} L ${q.x - s * (hw + 2)} ${q.y}`;
  }
  if (q.y > p.y) {
    const y1 = p.y + hh, y2 = q.y - hh - 2, my = (y1 + y2) / 2;
    if (Math.abs(p.x - q.x) < 2) return `M ${p.x} ${y1} L ${q.x} ${y2}`;
    return `M ${p.x} ${y1} C ${p.x} ${my}, ${q.x} ${my}, ${q.x} ${y2}`;
  }
  const s = q.x < p.x || (Math.abs(p.x - q.x) < 10 && POS[a][0] === "E") ? -1 : 1;
  const x1 = p.x + s * hw, x2 = q.x - s * (hw + 2);
  const bulge = Math.abs(p.x - q.x) < 10 ? s * 60 : 0;
  return `M ${x1} ${p.y} C ${x1 + s * 40 + bulge} ${p.y}, ${x2 - s * 40 + bulge} ${q.y}, ${x2} ${q.y}`;
}

/* Números de paso sobre cada nodo: verde = cumple, rojo = no cumple, amarillo = en ejecución */
function badges(id, opts) {
  const list = [...((opts.stepsByNode || {})[id] || []).map(b => ({ ...b, cls: b.ok ? "ok" : "ko" }))];
  if (opts.current === id && opts.currentStep) list.push({ n: opts.currentStep, cls: "cur" });
  if (!list.length) return "";
  const shown = list.length > 3 ? [list[0], { n: "…", cls: "more" }, ...list.slice(-2)] : list;
  return shown.map((b, i) => {
    const cx = BOX.w - 2 - (shown.length - 1 - i) * 21, r = 10;
    return `<g class="bdg ${b.cls}"><circle cx="${cx}" cy="0" r="${r}"/><text x="${cx}" y="3.8" text-anchor="middle">${b.n}</text>${b.ans ? `<title>Paso ${b.n}: ${esc(b.ans)} → ${b.to}</title>` : ""}</g>`;
  }).join("");
}

/* opts: { current, visited: {id:"ok"|"ko"}, travelled: Set("a>b"), route: Set(ids) } */
function flowSVG(opts = {}) {
  const visited = opts.visited || {}, trav = opts.travelled || new Set(), route = opts.route || new Set();
  const out = opts.current ? new Set(EDGES.filter(e => e.a === opts.current).map(e => e.b)) : new Set();
  let s = `<svg class="flow" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagrama de flujo del árbol de decisión">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#cdbfd4"/></marker>
    <marker id="ar-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#5a2466"/></marker>
    <marker id="ar-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2e9e62"/></marker>
    <marker id="ar-cy" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#e0a800"/></marker>
  </defs>`;
  STAGES.forEach((st, i) => {
    const [y0, y1] = BAND_Y[st.n];
    s += `<rect x="146" y="${y0}" width="${W - 150}" height="${y1 - y0}" fill="${i % 2 ? "#fbf8fc" : "#f4eef7"}"/>
      <text x="154" y="${y0 + 16}" class="band">${st.n}. ${st.label.toUpperCase()}</text>`;
  });
  s += `<rect x="4" y="20" width="136" height="${H - 35}" rx="14" fill="#fdf0ef" stroke="#f3c9c5"/>
    <text x="72" y="44" text-anchor="middle" class="lane">RUTA CRÍTICA</text>
    <text x="72" y="95" text-anchor="middle" class="sub">Alerta inminente</text>
    <text x="72" y="370" text-anchor="middle" class="sub">Alerta Rosa</text>
    <text x="72" y="620" text-anchor="middle" class="sub">Burla o acoso</text>
    <text x="72" y="720" text-anchor="middle" class="sub">Reglas globales</text>
    ${GLOBAL_RULES.map((r, i) => `<text x="72" y="${742 + i * 18}" text-anchor="middle" class="rulep">${r.label.replace(" (con riesgo)", "").replace(" (sin riesgo)", "")} → ${r.to}</text>`).join("")}`;

  // Conexiones largas: se muestran como etiqueta "→ destino" junto al nodo; si ya se recorrieron, se dibujan completas en verde.
  const stubs = {};
  let top = "";
  EDGES.forEach(e => {
    const k = e.a + ">" + e.b, isTrav = trav.has(k), isOut = e.a === opts.current, cyc = e.a === "S1" && e.b === "E1";
    const cls = isTrav ? "e ok" : isOut ? "e on" : cyc ? "e cy" : "e";
    const mk = isTrav ? "ar-ok" : isOut ? "ar-on" : cyc ? "ar-cy" : "ar";
    const path = `<path d="${edgePath(e.a, e.b)}" class="${cls}${e.kind ? " dash" : ""}" marker-end="url(#${mk})"/>`;
    if (cyc || !isLong(e.a, e.b)) { if (isTrav || isOut) top += path; else s += path; return; }
    if (isTrav) top += path;
    (stubs[e.a] = stubs[e.a] || []).push({ b: e.b, on: isOut, ok: isTrav });
  });
  s += top;
  Object.entries(stubs).forEach(([a, list]) => {
    const p = xy(a);
    list.forEach((t, i) => {
      const lx = p.x - BOX.w / 2 + 6 + i * 40;
      s += `<g class="stub ${t.on ? "on" : ""} ${t.ok ? "ok" : ""}"><rect x="${lx}" y="${p.y + BOX.h / 2 + 3}" width="36" height="15" rx="7"/><text x="${lx + 18}" y="${p.y + BOX.h / 2 + 14}" text-anchor="middle">→${t.b}</text></g>`;
    });
  });
  s += `<text x="16" y="${xy("S1").y - 8}" class="cyl">↺ si el riesgo aumenta, vuelve a E1</text>`;

  Object.keys(POS).forEach(id => {
    const { x, y } = xy(id), n = NODES[id];
    const st = id === opts.current ? "cur" : visited[id] === "ko" ? "ko" : visited[id] === "ok" ? "ok" : out.has(id) ? "next" : "";
    const tipo = n ? n.tipo.split(" ")[0].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() : "fin";
    s += `<g class="nd ${st} ${route.has(id) ? "route" : ""} t-${tipo}" data-node="${id}" transform="translate(${x - BOX.w / 2},${y - BOX.h / 2})" tabindex="0">
      <title>${id} · ${n ? n.nombre : "Fin del recorrido"}</title>
      <rect width="${BOX.w}" height="${BOX.h}" rx="9"/>
      <rect class="strip" width="5" height="${BOX.h}" rx="2"/>
      <text x="13" y="16" class="id">${id}</text>
      <text x="13" y="31" class="nm">${SHORT[id]}</text>
      ${n && n.v06 ? `<g class="v06"><rect x="44" y="-6" width="42" height="12" rx="6"/><text x="65" y="3" text-anchor="middle">NUEVO v0.6</text></g>` : ""}
      ${badges(id, opts)}
    </g>`;
  });
  if (opts.firstNode && POS[opts.firstNode]) {
    const f = xy(opts.firstNode);
    s += `<g class="start-mk"><rect x="${f.x - BOX.w / 2 - 2}" y="${f.y - BOX.h / 2 - 22}" width="52" height="16" rx="8"/><text x="${f.x - BOX.w / 2 + 24}" y="${f.y - BOX.h / 2 - 10.5}" text-anchor="middle">▶ INICIO</text></g>`;
  }
  return s + "</svg>";
}

function runVisual(run) {
  const visited = {}, travelled = new Set(), stepsByNode = {};
  run.steps.forEach((s, i) => {
    visited[s.nodeId] = visited[s.nodeId] === "ko" || s.verdict === "No cumple" ? "ko" : "ok";
    travelled.add(s.nodeId + ">" + s.nextUsed);
    (stepsByNode[s.nodeId] = stepsByNode[s.nodeId] || []).push({ n: i + 1, ok: s.verdict === "Cumple", ans: answerText(s), to: s.nextUsed });
  });
  return { visited, travelled, stepsByNode };
}

function scrollFlowTo(id) {
  const box = document.querySelector(".flow-wrap"), svg = box && box.querySelector("svg");
  if (!svg || !POS[id]) return;
  const k = svg.clientWidth / W;
  box.scrollTop = Math.max(0, xy(id).y * k - box.clientHeight / 2);
}

/* Panel derecho de la gestión: diagrama de flujo o ruta paso a paso */
function sidePanel(run, opts = {}) {
  const mode = localStorage.getItem("salvia-panel") || "diagrama";
  const st = runStats(run);
  const c = CASES.find(x => x.id === run.caseId);
  const vis = runVisual(run);
  const route = new Set(caseRouteList(c));
  const tabs = `<div class="ptabs">
      <button class="ptab ${mode === "diagrama" ? "on" : ""}" data-panel="diagrama">Diagrama de flujo</button>
      <button class="ptab ${mode === "ruta" ? "on" : ""}" data-panel="ruta">Ruta paso a paso</button>
    </div>`;
  if (mode === "ruta") return `<div class="sidepanel">${tabs}${routeTimeline(run, opts)}</div>`;
  const trail = run.steps.map((s, i) => `<span class="pc ${s.verdict === "Cumple" ? "ok" : "ko"}"><small>${i + 1}</small>${s.nodeId}</span>`).join("<i>›</i>");
  return `<div class="sidepanel">${tabs}
    <section class="card mapcard">
      <div class="map-head">
        <h3>Diagrama de flujo · paso a paso</h3>
        <div class="route-k"><span class="ok">${st.ok} ✓</span><span class="ko">${st.ko} ✗</span><span>${st.shots} 📎</span></div>
      </div>
      <div class="trail plan-chips">${trail}${opts.finished ? "" : `${trail ? "<i>›</i>" : ""}<span class="pc cur"><small>${run.steps.length + 1}</small>${run.current}</span>`}${opts.finished ? `<i>›</i><span class="pc">FIN</span>` : ""}</div>
      <div class="legend">
        <span><b class="lgb">1</b>Número de paso</span><span><i class="lg cur"></i>En ejecución</span><span><i class="lg next"></i>Siguientes posibles</span>
        <span><i class="lg ok"></i>Cumple</span><span><i class="lg ko"></i>No cumple</span>${route.size ? `<span><i class="lg route"></i>Ruta del caso</span>` : ""}
      </div>
      <div class="flow-wrap">${flowSVG({ current: opts.finished ? null : run.current, currentStep: run.steps.length + 1, firstNode: run.steps[0]?.nodeId || run.current, ...vis, route })}</div>
    </section></div>`;
}
