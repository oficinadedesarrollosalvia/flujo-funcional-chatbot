/* Etapas del ciclo del árbol y ruta de ejecución paso a paso. */

const STAGES = [
  { n: 1, label: "Inicio y seguridad", nodes: ["N0", "N1", "N1a", "N1b", "N1c", "N1d"] },
  { n: 2, label: "Autorización", nodes: ["N2", "R0", "R0a"] },
  { n: 3, label: "Sujeto de atención", nodes: ["N3", "N3a", "T1", "M1", "F1", "HM1", "I1", "I1a"] },
  { n: 4, label: "Caracterización", nodes: ["N4", "N5", "N5a", "R1", "N6", "N6a", "N7", "N8", "N8a"] },
  { n: 5, label: "Pretamizaje", nodes: ["P1"] },
  { n: 6, label: "Enfoque y necesidad", nodes: ["N9", "N9a", "N10", "R2"] },
  { n: 7, label: "Atención humana", nodes: ["H2", "H3", "HD", "HG"] },
  { n: 8, label: "Cierre", nodes: ["N11", "N11a"] },
  { n: 9, label: "Seguimiento", nodes: ["S1"] },
];
const CRITICAL = { label: "Ruta crítica", nodes: ["E1", "E2", "H1", "AR1", "AR2", "AR3", "X1"] };

function stageOf(id) {
  if (CRITICAL.nodes.includes(id)) return "C";
  const s = STAGES.find(s => s.nodes.includes(id));
  return s ? s.n : null;
}
function stageName(id) {
  const s = stageOf(id);
  if (s === "C") return "Ruta crítica";
  if (!s) return "";
  return `${s}. ${STAGES[s - 1].label}`;
}

/* Barra del ciclo de etapas */
function cycleBar(currentId, steps = []) {
  const done = new Set(steps.map(s => stageOf(s.nodeId)));
  const cur = stageOf(currentId);
  const chips = STAGES.map(st => `<li class="${cur === st.n ? "cur" : done.has(st.n) ? "done" : ""}"><span>${done.has(st.n) && cur !== st.n ? "✓" : st.n}</span>${st.label}</li>`).join("");
  return `<div class="cycle">
    <ol>${chips}</ol>
    <div class="crit ${cur === "C" ? "cur" : done.has("C") ? "done" : ""}">⚠ Ruta crítica</div>
    <div class="loop" title="En seguimiento, si el riesgo aumenta, el ciclo vuelve a la Alerta Inminente (E1)">↺</div>
  </div>`;
}

/* Posibles siguientes nodos desde un nodo (según el árbol) */
function nextOptions(id) {
  const n = NODES[id];
  if (!n) return [];
  if (n.opts && !n.multi) return n.opts.map(o => ({ label: o.label, to: o.to }));
  if (n.rutaTexto) return n.rutaTexto.split(" · ").map(t => { const [label, to] = t.split(" → "); return { label: to ? label : "", to: (to || label).trim() }; });
  return [];
}

/* Nodos en la ruta descrita por un caso del plan, en orden */
function caseRouteList(c) {
  if (!c) return [];
  const seen = new Set();
  return c.ruta.split(/[ >/·,]+/).filter(t => (NODES[t] || t === "FIN") && !seen.has(t) && seen.add(t));
}

/*
  Ruta de ejecución: línea de tiempo con los pasos ya ejecutados, el paso actual y lo que sigue.
  run: ejecución; opts: { draft, expected, finished }
*/
function routeTimeline(run, opts = {}) {
  const c = CASES.find(x => x.id === run.caseId);
  const plan = caseRouteList(c);
  const visited = {};
  run.steps.forEach(s => visited[s.nodeId] = visited[s.nodeId] === "ko" || s.verdict === "No cumple" ? "ko" : "ok");
  const st = runStats(run);
  const pct = plan.length ? Math.round(plan.filter(id => visited[id]).length / plan.length * 100) : null;

  const planHtml = plan.length ? `
    <div class="plan">
      <div class="plan-head"><span>Ruta esperada del caso ${c.id}</span><b>${pct}%</b></div>
      <div class="bar"><div style="width:${pct}%"></div></div>
      <div class="plan-chips">${plan.map((id, i) => `${i ? `<i>›</i>` : ""}<span class="pc ${id === run.current && !opts.finished ? "cur" : visited[id] || ""}">${id}</span>`).join("")}</div>
    </div>` : "";

  const stepsHtml = run.steps.map((s, i) => {
    const n = NODES[s.nodeId], ok = s.verdict === "Cumple";
    const desvio = s.realNode && s.realNode !== s.expected;
    return `<li class="tl ${ok ? "ok" : "ko"}">
      <div class="tl-dot">${ok ? "✓" : "✗"}</div>
      <div class="tl-body">
        <div class="tl-top"><span class="tl-n">Paso ${i + 1}</span><b>${s.nodeId}</b> ${esc(n?.nombre || "")}<span class="tl-stage">${esc(stageName(s.nodeId))}</span><span class="tl-time">${new Date(s.at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</span></div>
        <div class="tl-ans">${esc(answerText(s))}</div>
        <div class="tl-go ${desvio ? "bad" : ""}">${desvio ? `Debía ir a <b>${s.expected}</b> y el bot fue a <b>${s.realNode}</b>` : `→ ${esc(nodeLabel(s.nextUsed))}`}</div>
        ${s.note ? `<div class="tl-note">${esc(s.note)}</div>` : ""}
        ${s.shots.length ? `<div class="tl-shots">${s.shots.map(sh => `<img src="${sh.data}" data-zoom alt="Pantallazo">`).join("")}</div>` : ""}
      </div>
    </li>`;
  }).join("");

  let curHtml = "";
  if (!opts.finished) {
    const n = NODES[run.current], d = opts.draft;
    const sel = d ? (d.rule ? "Regla global: " + GLOBAL_RULES.find(r => r.id === d.rule).label : d.selected.length ? d.selected.join(", ") : Object.keys(d.answers).length ? Object.entries(d.answers).map(([k, v]) => `${k}: ${v}`).join(" · ") : "") : "";
    const nexts = nextOptions(run.current);
    curHtml = `<li class="tl cur">
      <div class="tl-dot">${run.steps.length + 1}</div>
      <div class="tl-body">
        <div class="tl-top"><span class="tl-n">Paso ${run.steps.length + 1} · en ejecución</span><b>${run.current}</b> ${esc(n.nombre)}<span class="tl-stage">${esc(stageName(run.current))}</span></div>
        <div class="tl-ans">${sel ? esc(sel) : `<span class="muted">Esperando respuesta…</span>`}</div>
        ${opts.expected ? `<div class="tl-go">Siguiente según el árbol: <b>${esc(nodeLabel(opts.expected))}</b></div>` : ""}
      </div>
    </li>
    ${!opts.expected && nexts.length ? `<li class="tl next">
      <div class="tl-dot">…</div>
      <div class="tl-body"><div class="tl-top"><span class="tl-n">Posibles siguientes pasos</span></div>
        <div class="nexts">${nexts.map(o => `<span>${o.label ? esc(o.label) + " " : ""}<b>→ ${o.to}</b></span>`).join("")}</div></div>
    </li>` : ""}`;
  } else {
    curHtml = `<li class="tl end ${st.ko ? "ko" : "ok"}"><div class="tl-dot">■</div><div class="tl-body"><div class="tl-top"><b>Fin del recorrido</b>${run.endedAt ? `<span class="tl-stage">terminado manualmente en ${run.endedAt}</span>` : ""}</div></div></li>`;
  }

  return `<section class="card routecard">
    <div class="route-head">
      <div><h3>Ruta de ejecución</h3><div class="muted small">Paso a paso, en el orden en que se recorrió el árbol</div></div>
      <div class="route-k"><span class="ok">${st.ok} ✓</span><span class="ko">${st.ko} ✗</span><span>${st.shots} 📎</span></div>
    </div>
    ${planHtml}
    <ol class="timeline" id="timeline">
      <li class="tl start"><div class="tl-dot">▶</div><div class="tl-body"><div class="tl-top"><b>Inicio</b><span class="tl-time">${fmtDate(run.start)}</span></div><div class="muted small">${esc(run.canal)}${run.tester ? " · " + esc(run.tester) : ""}${run.ambiente ? " · " + esc(run.ambiente) : ""}</div></div></li>
      ${stepsHtml}
      ${curHtml}
    </ol>
  </section>`;
}

function scrollTimeline() {
  const cur = document.querySelector(".timeline .tl.cur, .timeline .tl.end");
  const box = document.querySelector(".timeline");
  if (cur && box) box.scrollTop = cur.offsetTop - box.clientHeight + cur.clientHeight + 40;
}
