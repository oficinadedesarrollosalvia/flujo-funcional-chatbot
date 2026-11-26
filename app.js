/* App de pruebas del chatbot SALVIA
   Recorre el árbol de decisión nodo por nodo. En cada paso el tester registra
   la opción usada en el chatbot real, si el bot cumple o no y los pantallazos. */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "";
const CANALES = ["WhatsApp", "Chat web", "App móvil"];
const FLAG_LABELS = {
  modoSilencioso: "Modo silencioso", psicosocial: "Equipo psicosocial", sinDatos: "Sin autorización de datos",
  tercero: "Modo tercero", prioridad1: "Prioridad 1 (VS 72 h)", incumplio: "Incumplió medidas",
  medidasEmergencia: "Medidas de emergencia",
};

let VIEW = ["ejecutar", "validacion", "historial", "cobertura"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "ejecutar";
let RUN = null;        // ejecución en curso
let ALL_RUNS = [];     // todas las pruebas guardadas (para comentarios por nodo)
let DRAFT = null;      // paso en edición

/* ------------------------------------------------------------------ util */
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add("hidden"), 2600);
}
function modal(html) { $("#modal-body").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); }
function showImage(src) { modal(`<img class="full" src="${src}" alt="Pantallazo">`); }
/* En la versión web (dentro del visor de claude.ai) no hay descargas ni diálogos del navegador: se usan diálogos propios */
const EMBEDDED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
function ask(msg) {
  return new Promise(res => {
    const d = document.createElement("div");
    d.className = "modal"; d.style.zIndex = 80;
    d.innerHTML = `<div class="modal-box" style="max-width:460px"><p style="margin:0 0 18px;font-size:16px"></p>
      <div class="row"><span class="spacer"></span><button class="btn" data-a="0">Cancelar</button><button class="btn primary" data-a="1">Aceptar</button></div></div>`;
    d.querySelector("p").textContent = msg;
    d.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { d.remove(); res(b.dataset.a === "1"); });
    document.body.appendChild(d); d.querySelector('[data-a="1"]').focus();
  });
}
function download(name, content, type) {
  if (EMBEDDED && typeof content === "string") {
    const isHtml = (type || "").includes("html");
    modal(`<h2 style="margin-top:0">${name.replace(/[<>&]/g, "")}</h2>
      <p class="muted">En la versión web las descargas están bloqueadas. ${isHtml ? "Aquí está el informe; use «Copiar HTML» y guárdelo como archivo .html, o abra la app local para descargarlo." : "Copie el contenido y guárdelo como archivo, o abra la app local para descargarlo."}</p>
      <div class="row" style="margin-bottom:10px"><span class="spacer"></span><button class="btn primary" id="dl-copy">Copiar ${isHtml ? "HTML" : "contenido"}</button></div>
      ${isHtml ? `<iframe id="dl-frame" style="width:min(1000px,90vw);height:65vh;border:1px solid #ddd;border-radius:10px"></iframe>` : `<textarea id="dl-text" readonly style="width:min(1000px,90vw);height:55vh;font:12px monospace"></textarea>`}`);
    if (isHtml) $("#dl-frame").srcdoc = content; else $("#dl-text").value = content;
    $("#dl-copy").onclick = async () => { try { await navigator.clipboard.writeText(content); toast("Copiado"); } catch (e) { toast("No se pudo copiar"); } };
    return;
  }
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function nodeLabel(id) { return id === "FIN" ? "FIN" : `${id} · ${NODES[id]?.nombre ?? ""}`; }

/* Reduce el pantallazo a máx. 1600 px y JPEG para que el almacenamiento no crezca demasiado */
function compressImage(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        res({ name: file.name || "pantallazo.png", data: c.toDataURL("image/jpeg", 0.85), at: new Date().toISOString() });
      };
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ lógica de ruta */
function expectedNext(nodeId, d, run) {
  const node = NODES[nodeId];
  if (d.rule) return GLOBAL_RULES.find(r => r.id === d.rule).to;
  let to = null;
  if (node.questions) {
    if (!node.qs.every(q => d.answers[q.id])) return null;
    to = nodeId === "P1" ? ["H1", "H2", "N9"][prioridadP1(d.answers) - 1] : node.route(d.answers, { ...run });
  } else if (node.multi) {
    if (!d.selected.length) return null;
    to = node.route(d.selected, run);
  } else {
    const o = node.opts.find(o => o.label === d.selected[0]);
    if (!o) return null;
    to = o.to;
  }
  if (node.redirect) to = node.redirect(run) || to;
  return to;
}

function answerText(step) {
  if (step.rule) return "Regla global: " + GLOBAL_RULES.find(r => r.id === step.rule).label;
  if (step.answers && Object.keys(step.answers).length)
    return Object.entries(step.answers).map(([k, v]) => `${k}: ${v}`).join(" · ");
  return step.selected.join(", ");
}

function newDraft(nodeId) {
  const d = { nodeId, selected: [], answers: {}, rule: null, verdict: null, note: "", realNode: "", followReal: true, shots: [] };
  if (nodeId === "P1" && RUN.flags.incumplio) d.answers.A5 = "Sí";
  return d;
}

function runStats(run) {
  const ok = run.steps.filter(s => s.verdict === "Cumple").length;
  const ko = run.steps.filter(s => s.verdict === "No cumple").length;
  const shots = run.steps.reduce((n, s) => n + s.shots.length, 0) + (run.finalShots?.length || 0);
  return { ok, ko, shots, total: run.steps.length };
}

/* ------------------------------------------------------------------ vistas */
async function render() {
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === VIEW));
  const app = $("#app");
  if (VIEW === "ejecutar") { try { ALL_RUNS = await DB.all(); } catch { ALL_RUNS = []; } }
  if (VIEW === "ejecutar") app.innerHTML = RUN ? (RUN.current === "FIN" ? viewFinish() : viewRun()) : viewSetup();
  if (VIEW === "validacion") app.innerHTML = await viewValidacion();
  if (VIEW === "historial") app.innerHTML = await viewHistory();
  if (VIEW === "cobertura") app.innerHTML = await viewCoverage();
  bindView();
  $$("[data-zoom]").forEach(i => i.onclick = () => showImage(i.src));
  bindPanel();
  if (VIEW === "validacion") bindValidacion();
  if (VIEW === "ejecutar") { scrollTimeline(); if (RUN) scrollFlowTo(RUN.current === "FIN" ? (RUN.steps.at(-1)?.nodeId || "N0") : RUN.current); }
}

function bindPanel() {
  $$("[data-panel]").forEach(b => b.onclick = () => { saveDraftFields(); localStorage.setItem("salvia-panel", b.dataset.panel); render(); });
  $$(".flow .nd").forEach(g => {
    const open = () => {
      const id = g.dataset.node, n = NODES[id];
      if (!n) return;
      const steps = RUN ? RUN.steps.map((s, i) => ({ ...s, i })).filter(s => s.nodeId === id) : [];
      const dest = n.opts && !n.multi ? n.opts.map(o => `<li>${esc(o.label)} <b>→ ${o.to}</b></li>`).join("") : `<li>${esc(n.rutaTexto || "")}</li>`;
      modal(`<div class="step" style="max-width:640px">
        <div class="node-head"><span class="node-id">${id}</span><div><div class="node-name">${esc(n.nombre)}</div><div class="muted small">${esc(n.tipo)} · ${esc(stageName(id))}</div></div></div>
        <div class="bubble"><span class="bubble-lbl">El bot debe decir</span>${esc(n.msg)}</div>
        <dl class="meta"><dt>Regla</dt><dd>${esc(n.regla)}</dd><dt>Dato a guardar</dt><dd>${esc(n.datos)}</dd></dl>
        <div class="section-title">Opciones y destinos</div><ul class="optlist">${dest}</ul>
        ${steps.length ? `<div class="section-title">En esta prueba</div>${steps.map(s => `<p><span class="pill ${s.verdict === "Cumple" ? "Pasa" : "Falla"}">${s.verdict}</span> Paso ${s.i + 1}: ${esc(answerText(s))} → ${s.nextUsed}${s.note ? `<br><span class="muted small">${esc(s.note)}</span>` : ""}</p>${s.shots.map(sh => `<img src="${sh.data}" style="height:90px;border-radius:6px;margin:2px">`).join("")}`).join("")}` : ""}
      </div>`);
    };
    g.onclick = open; g.onkeydown = (e) => { if (e.key === "Enter") open(); };
  });
}

/* --- configurar prueba */
function viewSetup() {
  const last = JSON.parse(localStorage.getItem("salvia-tester") || "{}");
  const mods = [...new Set(CASES.map(c => c.modulo))];
  const caseOpts = mods.map(m => `<optgroup label="${esc(m)}">${CASES.filter(c => c.modulo === m).map(c => `<option value="${c.id}">${c.id} · ${esc(c.pasos.slice(0, 80))}</option>`).join("")}</optgroup>`).join("");
  const nodeOpts = NODE_ORDER.map(id => `<option value="${id}" ${id === "N0" ? "selected" : ""}>${esc(nodeLabel(id))}</option>`).join("");
  return `
  ${cycleBar(null, [])}
  <div class="run-grid">
    <section class="card stack">
      <div>
        <h2>Nueva prueba</h2>
        <p class="muted">Recorra el árbol al mismo tiempo que conversa con el chatbot real. En cada nodo registre la respuesta, si el bot <b>cumple</b> o <b>no cumple</b> y el pantallazo.</p>
      </div>
      <form id="setup" class="form">
        <label class="f full">Caso del plan de pruebas
          <select name="caseId"><option value="">— Recorrido libre (sin caso) —</option>${caseOpts}</select>
        </label>
        <div class="full" id="case-preview"></div>
        <label class="f">Tester <input name="tester" required value="${esc(last.tester || "")}" placeholder="Nombre de quien prueba"></label>
        <label class="f">Canal
          <select name="canal">${CANALES.map(c => `<option ${c === last.canal ? "selected" : ""}>${c}</option>`).join("")}</select>
        </label>
        <label class="f">Versión del bot <input name="version" value="${esc(last.version || "")}" placeholder="p. ej. build 2026-11-25"></label>
        <label class="f">Ambiente
          <select name="ambiente">${["Pruebas (staging)", "Preproducción", "Producción"].map(a => `<option ${a === last.ambiente ? "selected" : ""}>${a}</option>`).join("")}</select>
        </label>
        <label class="f">Iniciar en el nodo <select name="start">${nodeOpts}</select></label>
        <label class="f">Hora simulada (si aplica) <input name="hora" type="time"></label>
        <div class="full"><button class="btn primary big" type="submit">Iniciar recorrido →</button></div>
      </form>
    </section>
    <div class="sidepanel" id="setup-side">${setupSide(null)}</div>
  </div>`;
}

function setupSide(c) {
  const plan = caseRouteList(c);
  const first = plan[0] || "N0";
  return `<section class="card mapcard setup-map">
      <div class="map-head">
        <h3>Ciclo del árbol</h3>
        <div class="legend">
          <span><i class="lg cur"></i>Nodo actual</span><span><i class="lg next"></i>Siguientes posibles</span>
          <span><i class="lg ok"></i>Cumple</span><span><i class="lg ko"></i>No cumple</span><span><i class="lg route"></i>Ruta del caso</span>
        </div>
      </div>
      <details class="how-d"><summary>Cómo se diligencia</summary>
        <ol class="how">
          <li><b>Escoja el caso</b> del plan o haga un recorrido libre.</li>
          <li><b>Converse con el chatbot real</b> y, en cada paso, marque la respuesta que usó.</li>
          <li><b>Marque si cumple o no</b>: el mensaje, las opciones y el destino coinciden con el árbol.</li>
          <li><b>Adjunte el pantallazo</b> y continúe. El diagrama numera cada paso.</li>
          <li>Al final, <b>guarde el resultado</b> y descargue el informe con las evidencias.</li>
        </ol>
      </details>
      ${c ? `<div class="trail plan-chips"><span class="muted small" style="margin-right:6px">Ruta esperada ${c.id}:</span>${plan.map((id, i) => `${i ? "<i>›</i>" : ""}<span class="pc">${id}</span>`).join("")}</div>` : ""}
      <div class="flow-wrap">${flowSVG({ current: first, route: new Set(plan) })}</div>
    </section>`;
}

function caseBox(c) {
  if (!c) return "";
  return `<div class="case-box">
    <div class="row"><b>${c.id}</b><span class="muted">${esc(c.modulo)}</span><span class="peso ${c.prioridad === "Crítica" ? "Crítica" : "Moderada"}">${c.prioridad}</span>${c.cp ? `<span class="muted">${c.cp}</span>` : ""}${c.hz ? `<span class="muted">${c.hz}</span>` : ""}</div>
    <p><b>Ruta:</b> ${esc(c.ruta)}</p>
    ${c.precondicion && c.precondicion !== "—" ? `<p><b>Precondición:</b> ${esc(c.precondicion)}</p>` : ""}
    <p><b>Pasos:</b> ${esc(c.pasos)}</p>
    <p><b>Esperado:</b> ${esc(c.esperado)}</p>
    <p class="muted"><b>Datos:</b> ${esc(c.datos)} · <b>Canal:</b> ${esc(c.canal)}</p>
  </div>`;
}

function statusBar() {
  const st = runStats(RUN), c = CASES.find(x => x.id === RUN.caseId);
  const flags = Object.keys(RUN.flags).filter(f => f !== "prioridad1");
  return `<div class="statusbar">
    <div class="sb-case"><span class="muted">Caso</span><b>${c ? c.id : "Libre"}</b>${c ? `<button class="link" id="toggle-case">ver detalle</button>` : ""}</div>
    <div><span class="muted">Tester</span><b>${esc(RUN.tester || "—")}</b></div>
    <div><span class="muted">Canal</span><b>${esc(RUN.canal)}</b></div>
    <div class="sb-k ok"><b>${st.ok}</b><span>cumple</span></div>
    <div class="sb-k ko"><b>${st.ko}</b><span>no cumple</span></div>
    <div class="sb-k"><b>${st.shots}</b><span>pantallazos</span></div>
    <button class="btn small newrun" id="new-run">+ Nueva prueba</button>
    <div class="flags">${flags.map(f => `<span class="flag">${FLAG_LABELS[f] || f}</span>`).join("")}${RUN.prioridad ? `<span class="flag p${RUN.prioridad}">Prioridad ${RUN.prioridad}</span>` : ""}</div>
  </div>
  <div id="case-detail" class="${RUN._showCase ? "" : "hidden"}">${caseBox(c)}</div>`;
}

/* --- recorrido */
function viewRun() {
  const node = NODES[RUN.current];
  const d = DRAFT;
  const exp = expectedNext(RUN.current, d, RUN);
  const c = CASES.find(x => x.id === RUN.caseId);

  let answerHtml = "";
  if (node.questions) {
    answerHtml = node.qs.map(q => `
      <div class="q">
        <div class="q-text">${q.id.length <= 2 ? `<b>${q.id}.</b> ` : ""}${esc(q.text)}${q.peso ? `<span class="peso ${q.peso}">${q.peso}</span>` : ""}
          ${RUN.current === "P1" && q.id === "A5" && RUN.flags.incumplio ? `<span class="muted"> · precargada desde N8a</span>` : ""}</div>
        <div class="opts">${q.answers.map(a => `<button class="opt ${d.answers[q.id] === a ? "sel" : ""}" data-q="${q.id}" data-a="${esc(a)}">${esc(a)}</button>`).join("")}</div>
      </div>`).join("");
    if (RUN.current === "P1" && node.qs.every(q => d.answers[q.id])) {
      const npnd = Object.values(d.answers).filter(v => v === "Prefiero no decir").length;
      answerHtml += `<div class="note-calc">Prioridad calculada: <b>${prioridadP1(d.answers)}</b>${npnd ? ` · ${npnd} «Prefiero no decir» (regla no definida en el árbol)` : ""}</div>`;
    }
  } else {
    answerHtml = `<div class="opts">${node.opts.map(o => {
      const sel = d.selected.includes(o.label);
      return `<button class="opt ${sel ? "sel" : ""}" data-opt="${esc(o.label)}">${node.multi ? `<i class="chk">${sel ? "✓" : ""}</i>` : ""}${esc(o.label)}${node.multi ? "" : `<small>→ ${o.to}</small>`}</button>`;
    }).join("")}</div>
    ${node.multi ? `<p class="muted small">Puede elegir varias · ${esc(node.rutaTexto)}</p>` : ""}`;
  }
  const realOpts = ["", ...NODE_ORDER, "FIN"].map(id => `<option value="${id}" ${d.realNode === id ? "selected" : ""}>${id ? esc(nodeLabel(id)) : "— Igual al esperado —"}</option>`).join("");

  return `
  ${cycleBar(RUN.current, RUN.steps)}
  ${statusBar()}
  <div class="run-grid">
    <section class="card step">
      <div class="node-head">
        <span class="node-id">${RUN.current}</span>
        <div><div class="node-name">${esc(node.nombre)}</div><div class="muted small">${esc(node.tipo)} · paso ${RUN.steps.length + 1}</div></div>
      </div>
      <div class="bubble"><span class="bubble-lbl">El bot debe decir</span>${esc(node.msg)}</div>
      <details class="meta-d"><summary>Regla y dato a verificar</summary>
        <dl class="meta"><dt>Regla</dt><dd>${esc(node.regla)}</dd><dt>Dato a guardar</dt><dd>${esc(node.datos)}</dd></dl>
      </details>

      <div class="stepblock">
        <div class="section-title"><span>1</span>¿Qué respondió en el chatbot?</div>
        ${answerHtml}
        <details class="rules-d" ${d.rule ? "open" : ""}><summary>Usar una regla global (SALIR, riesgo, desaparición…)</summary>
          <div class="rules">${GLOBAL_RULES.map(r => `<button class="rule ${d.rule === r.id ? "sel" : ""}" data-rule="${r.id}" title="${esc(r.desc)}">${esc(r.label)} <small>→ ${r.to}</small></button>`).join("")}</div>
        </details>
        <div class="expected ${exp ? "" : "pending"}"><span>Según el árbol, el bot debe ir a</span><b>${exp ? esc(nodeLabel(exp)) : "—"}</b></div>
      </div>

      <div class="stepblock">
        <div class="section-title"><span>2</span>¿El bot cumple?</div>
        <div class="verdict">
          <button class="vbtn ok ${d.verdict === "Cumple" ? "sel" : ""}" data-v="Cumple">✓ Cumple</button>
          <button class="vbtn ko ${d.verdict === "No cumple" ? "sel" : ""}" data-v="No cumple">✗ No cumple</button>
        </div>
        ${d.verdict === "No cumple" ? `
          <div class="form" style="margin-top:10px">
            <label class="f full">¿A qué nodo fue realmente el bot? <select id="realNode">${realOpts}</select></label>
            <label class="chkline full"><input type="checkbox" id="followReal" ${d.followReal ? "checked" : ""}> Continuar la prueba desde ese nodo</label>
          </div>` : ""}
      </div>

      <div class="stepblock">
        <div class="section-title"><span>3</span>Evidencia</div>
        <div class="evid" id="dropzone">
          <button class="btn primary" id="btn-attach">📎 Adjuntar pantallazo</button>
          <input type="file" id="file" accept="image/*" multiple hidden>
          <div class="muted small">o pegue con Ctrl + V / arrastre la imagen aquí</div>
          ${d.shots.length ? `<div class="thumbs">${d.shots.map((s, i) => `<div class="thumb"><img src="${s.data}" data-full="${i}" alt="Pantallazo ${i + 1}"><button data-del="${i}" title="Quitar">×</button></div>`).join("")}</div>` : ""}
        </div>
        <div class="note-row"><button class="btn small" id="gen-note" type="button">✎ Generar comentario</button><span class="muted small">Redacta la observación según la respuesta, el resultado y el destino; puede editarla.</span></div>
        <textarea id="note" placeholder="Observaciones: qué se vio, diferencias con el árbol, textos incorrectos…">${esc(d.note)}</textarea>
      </div>

      <div class="stepblock">
        <details class="node-hist" open><summary>Pruebas y comentarios de ${RUN.current} en el flujo</summary>${nodeHistory(RUN.current)}</details>
      </div>

      <div class="actions">
        <button class="btn ghost" id="btn-undo" ${RUN.steps.length ? "" : "disabled"}>↶ Deshacer</button>
        <button class="btn ghost danger" id="btn-end">Terminar aquí</button>
        <span class="spacer"></span>
        <button class="btn primary big" id="btn-next">Guardar y continuar →</button>
      </div>
    </section>
    ${sidePanel(RUN, { draft: d, expected: exp })}
  </div>`;
}

/* Pruebas, comentarios, recorridos, defectos y hallazgos que tocan un nodo */
function nodeHistory(id) {
  const prev = [];
  ALL_RUNS.forEach(r => r.steps.forEach((s, i) => { if (s.nodeId === id && !(RUN && r.id === RUN.id && i >= RUN.steps.length)) prev.push({ ...s, run: r, n: i + 1 }); }));
  const recs = (typeof VAL !== "undefined" ? VAL.recorridos : []).filter(r => r.obtenido.split(" > ").includes(id));
  const defs = (typeof VAL !== "undefined" ? VAL.defectos : []).filter(d => d.nodo.split(/[ ,→]+/).includes(id));
  const hzs = (typeof VAL !== "undefined" ? VAL.hallazgos : []).filter(h => (h.nodo.match(/\b[A-Z]+\d+[a-z]?\b/g) || []).includes(id));
  const blk = (t, n, body) => `<div class="nh-blk"><div class="nh-t">${t} <span class="muted small">(${n})</span></div>${body}</div>`;
  let html = "";
  html += blk("Pruebas anteriores en el bot", prev.length, prev.length ? prev.slice(-6).reverse().map(s => `<div class="nh-item">
      <span class="pill ${s.verdict === "Cumple" ? "Pasa" : "Falla"}">${s.verdict}</span>
      <b>${esc(s.run.caseId || "libre")}</b> <span class="muted small">${esc(s.run.canal)} · ${fmtDate(s.at || s.run.start)}</span>
      <div class="small">${esc(answerText(s))} → ${s.realNode && s.realNode !== s.expected ? `${s.realNode} (esperado ${s.expected})` : esc(s.nextUsed || "")}</div>
      ${s.note ? `<div class="nh-note">«${esc(s.note)}»</div>` : ""}
      ${(s.shots || []).length ? `<div class="tl-shots">${s.shots.map(x => `<img src="${x.data}" data-zoom alt="Pantallazo">`).join("")}</div>` : ""}
    </div>`).join("") : `<p class="muted small">Este nodo aún no se ha probado en el bot.</p>`);
  html += blk("Recorridos de verificación del proceso", recs.length, recs.length ? `<div class="nh-recs">${recs.map(r => `<span class="pc ${r.ok ? "ok" : "ko"}" title="${esc(r.obtenido)}">${r.id} · ${esc(r.nombre)}</span>`).join("")}</div>` : `<p class="muted small">Ningún recorrido pasa por este nodo.</p>`);
  if (defs.length) html += blk("Defectos abiertos", defs.length, defs.map(d => `<div class="nh-item"><span class="peso ${["Crítica", "Alta"].includes(d.sev) ? "Crítica" : "Moderada"}">${d.sev}</span> <b>${d.id}</b> <span class="small">${esc(d.desc)}</span></div>`).join(""));
  if (hzs.length) html += blk("Hallazgos del árbol", hzs.length, hzs.map(h => `<div class="nh-item"><b>${h.id}</b> <span class="small">${esc(h.hallazgo)}</span></div>`).join(""));
  return html;
}

function generateNote() {
  const node = NODES[RUN.current], d = DRAFT;
  const exp = expectedNext(RUN.current, d, RUN);
  const ans = d.rule ? `la regla global «${GLOBAL_RULES.find(r => r.id === d.rule).label}»` : `«${answerText(d)}»`;
  const dest = exp ? `${exp}${NODES[exp] ? ` (${NODES[exp].nombre})` : ""}` : "el siguiente nodo";
  if (!exp) return "Pendiente: marque la respuesta usada en el chatbot para generar el comentario.";
  if (d.verdict === "Cumple") return `El bot mostró el mensaje de ${RUN.current} (${node.nombre}) y, con ${ans}, pasó a ${dest}, como indica el proceso v0.6. El dato «${node.datos}» debe quedar guardado.`;
  if (d.verdict === "No cumple") {
    const real = d.realNode ? `y fue a ${d.realNode}${NODES[d.realNode] ? ` (${NODES[d.realNode].nombre})` : ""}` : "y no avanzó (sin respuesta o con un mensaje distinto)";
    return `No cumple: con ${ans} el bot debía ir a ${dest} ${real}. Revisar el mensaje y la regla de ${RUN.current}: «${node.regla}».`;
  }
  return `Con ${ans} el destino esperado es ${dest}. Falta marcar si el bot cumple.`;
}

/* --- cierre */
function viewFinish() {
  const st = runStats(RUN);
  const auto = st.ko ? "Falla" : "Pasa";
  if (!RUN.result) RUN.result = auto;
  const c = CASES.find(x => x.id === RUN.caseId);
  return `
  ${cycleBar("FIN", RUN.steps)}
  ${statusBar()}
  <div class="run-grid">
    <section class="card step stack">
      <div class="done-head ${auto}"><div class="big-ico">${auto === "Pasa" ? "✓" : "✗"}</div>
        <div><h2>Fin del recorrido</h2><p class="muted">${st.total} pasos · ${st.ok} cumplen · ${st.ko} no cumplen</p></div></div>
      ${caseBox(c)}
      <div class="form">
        <label class="f">Resultado del caso
          <select id="result">${["Pasa", "Falla", "Bloqueado"].map(r => `<option ${RUN.result === r ? "selected" : ""}>${r}</option>`).join("")}</select>
          <span class="muted small">Sugerido según los pasos: ${auto}</span>
        </label>
        <label class="f">ID de defecto (si falla) <input id="defect" value="${esc(RUN.defect || "")}" placeholder="DEF-001"></label>
        <label class="f full">Conclusión <textarea id="final-note">${esc(RUN.finalNote || "")}</textarea></label>
      </div>
      <div class="evid" id="dropzone">
        <button class="btn primary" id="btn-attach">📎 Adjuntar pantallazo final</button>
        <input type="file" id="file" accept="image/*" multiple hidden>
        ${(RUN.finalShots || []).length ? `<div class="thumbs">${RUN.finalShots.map((s, i) => `<div class="thumb"><img src="${s.data}" data-full="${i}"><button data-del="${i}">×</button></div>`).join("")}</div>` : ""}
      </div>
      <div class="actions">
        <button class="btn ghost" id="btn-undo">↶ Volver al último paso</button>
        <span class="spacer"></span>
        <button class="btn primary big" id="btn-save">Guardar prueba</button>
      </div>
    </section>
    ${sidePanel(RUN, { finished: true })}
  </div>`;
}

async function startAt(id) {
  if (RUN && !await ask("Hay una prueba en curso. Quedará guardada «en curso» en el Historial. ¿Iniciar una nueva desde " + id + "?")) return;
  const last = JSON.parse(localStorage.getItem("salvia-tester") || "{}");
  startRun({ caseId: "", tester: last.tester || "", canal: last.canal || CANALES[0], version: last.version || "", ambiente: last.ambiente || "", hora: "", start: id });
}

/* --- historial */
async function viewHistory() {
  const runs = (await DB.all()).sort((a, b) => b.start.localeCompare(a.start));
  if (!runs.length) return `<div class="card empty"><img src="logo-flor.png" alt=""><p>Aún no hay pruebas guardadas.</p></div>`;
  return `
  <section class="card">
    <div class="row" style="margin-bottom:12px">
      <h2 style="margin:0">Historial de pruebas</h2><span class="spacer"></span>
      <button class="btn small" id="exp-csv">Exportar CSV</button>
      <button class="btn small" id="exp-json">Respaldo (JSON)</button>
      <label class="btn small">Importar respaldo<input type="file" id="imp-json" accept=".json" hidden></label>
      <button class="btn small danger" id="clear-all">Limpiar todo</button>
    </div>
    <table>
      <thead><tr><th>Fecha</th><th>Caso</th><th>Tester</th><th>Canal</th><th>Pasos</th><th>✓ / ✗</th><th>📎</th><th>Resultado</th><th></th></tr></thead>
      <tbody>
        ${runs.map(r => { const s = runStats(r); return `<tr>
          <td>${fmtDate(r.start)}</td>
          <td>${r.caseId || "<span class='muted'>libre</span>"}</td>
          <td>${esc(r.tester)}</td><td>${esc(r.canal)}</td>
          <td>${r.steps.map(x => x.nodeId).join(" › ")}</td>
          <td>${s.ok} / ${s.ko}</td><td>${s.shots}</td>
          <td>${r.status === "en curso" ? `<span class="pill curso">En curso</span>` : `<span class="pill ${r.result}">${r.result}</span>`}</td>
          <td class="row">
            ${r.status === "en curso" ? `<button class="btn small" data-resume="${r.id}">Reanudar</button>` : ""}
            <button class="btn small" data-detail="${r.id}">Ver</button>
            <button class="btn small" data-report="${r.id}">Informe</button>
            <button class="btn small danger" data-delete="${r.id}">Eliminar</button>
          </td></tr>`; }).join("")}
      </tbody>
    </table>
  </section>`;
}

/* --- cobertura */
async function viewCoverage() {
  const runs = await DB.all();
  const visits = {};
  NODE_ORDER.forEach(id => visits[id] = { n: 0, ko: 0 });
  runs.forEach(r => r.steps.forEach(s => { visits[s.nodeId].n++; if (s.verdict === "No cumple") visits[s.nodeId].ko++; }));
  const covered = NODE_ORDER.filter(id => visits[id].n).length;
  const byCase = {};
  runs.filter(r => r.caseId && r.status !== "en curso").sort((a, b) => a.start.localeCompare(b.start)).forEach(r => byCase[r.caseId] = r.result);
  const ejec = Object.keys(byCase).length, pasa = Object.values(byCase).filter(v => v === "Pasa").length;
  const crit = CASES.filter(c => c.prioridad === "Crítica");
  const critPasa = crit.filter(c => byCase[c.id] === "Pasa").length;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const mods = [...new Set(CASES.map(c => c.modulo))];
  return `
  <div class="stack">
    <section class="card">
      <h2>Cobertura</h2>
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi"><b>${covered}/${NODE_ORDER.length}</b><span>Nodos recorridos</span></div>
        <div class="kpi"><b>${ejec}/${CASES.length}</b><span>Casos ejecutados</span></div>
        <div class="kpi"><b>${pct(pasa, ejec)}%</b><span>Casos que pasan</span></div>
        <div class="kpi"><b>${critPasa}/${crit.length}</b><span>Críticos en «Pasa»</span></div>
      </div>
      <div class="bar"><div style="width:${pct(covered, NODE_ORDER.length)}%"></div></div>
    </section>
    <section class="card">
      <h3>Nodos del árbol</h3>
      <p class="muted">Verde: recorrido y cumple · Rojo: al menos un «No cumple» · Blanco: sin recorrer.</p>
      <div class="nodegrid">${NODE_ORDER.map(id => { const v = visits[id]; return `<div class="nodechip ${v.ko ? "ko" : v.n ? "ok" : ""}"><b>${id}</b>${esc(NODES[id].nombre)}<div class="muted">${v.n} visitas${v.ko ? ` · ${v.ko} ✗` : ""}</div></div>`; }).join("")}</div>
    </section>
    <section class="card">
      <h3>Casos por módulo</h3>
      <table><thead><tr><th>Módulo</th><th>Casos</th><th>Ejecutados</th><th>Pasa</th><th>Falla</th><th>Bloqueado</th><th style="width:30%">Avance</th></tr></thead><tbody>
      ${mods.map(m => { const cs = CASES.filter(c => c.modulo === m); const e = cs.filter(c => byCase[c.id]);
        const n = (r) => cs.filter(c => byCase[c.id] === r).length;
        return `<tr><td>${esc(m)}</td><td>${cs.length}</td><td>${e.length}</td><td>${n("Pasa")}</td><td>${n("Falla")}</td><td>${n("Bloqueado")}</td><td><div class="bar"><div style="width:${pct(e.length, cs.length)}%"></div></div></td></tr>`; }).join("")}
      </tbody></table>
    </section>
  </div>`;
}

/* ------------------------------------------------------------------ eventos */
async function addShots(files) {
  const imgs = [...files].filter(f => f.type.startsWith("image/"));
  if (!imgs.length) return;
  const target = RUN.current === "FIN" ? (RUN.finalShots = RUN.finalShots || []) : DRAFT.shots;
  for (const f of imgs) target.push(await compressImage(f));
  if (RUN.current !== "FIN") saveDraftFields();
  await persist();
  render();
  toast(imgs.length === 1 ? "Pantallazo adjuntado" : `${imgs.length} pantallazos adjuntados`);
}

function saveDraftFields() {
  if (!DRAFT) return;
  const n = $("#note"); if (n) DRAFT.note = n.value;
  const rn = $("#realNode"); if (rn) DRAFT.realNode = rn.value;
  const fr = $("#followReal"); if (fr) DRAFT.followReal = fr.checked;
}

async function persist() {
  if (!RUN) return;
  RUN.draft = DRAFT;
  await DB.put(RUN);
}

async function startRun(meta) {
  RUN = { id: uid(), ...meta, treeVersion: TREE_VERSION, start: new Date().toISOString(), steps: [], current: meta.start, flags: {}, prioridad: null, status: "en curso" };
  DRAFT = newDraft(RUN.current);
  await persist();
  VIEW = "ejecutar";
  render();
}

function bindView() {
  // configurar
  const setup = $("#setup");
  if (setup) {
    const sel = setup.caseId;
    const showCase = () => {
      const c = CASES.find(c => c.id === sel.value);
      $("#case-preview").innerHTML = caseBox(c);
      $("#setup-side").innerHTML = setupSide(c);
      bindPanel(); scrollFlowTo(caseRouteList(c)[0] || "N0");
    };
    sel.onchange = () => {
      showCase();
      const c = CASES.find(x => x.id === sel.value);
      const first = c && c.ruta.split(/[ >/]+/).find(t => NODES[t]);
      if (first) setup.start.value = first;
    };
    setup.onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(setup));
      localStorage.setItem("salvia-tester", JSON.stringify({ tester: f.tester, canal: f.canal, version: f.version, ambiente: f.ambiente }));
      startRun({ caseId: f.caseId, tester: f.tester, canal: f.canal, version: f.version, ambiente: f.ambiente, hora: f.hora, start: f.start });
    };
  }

  // recorrido
  if (RUN && VIEW === "ejecutar") {
    $$("[data-opt]").forEach(b => b.onclick = () => {
      saveDraftFields();
      const node = NODES[RUN.current], v = b.dataset.opt;
      DRAFT.rule = null;
      if (node.multi) {
        DRAFT.selected = DRAFT.selected.includes(v) ? DRAFT.selected.filter(x => x !== v) : [...DRAFT.selected, v];
        if (v === "Omitir" || v === "No") DRAFT.selected = DRAFT.selected.includes(v) ? [v] : DRAFT.selected;
        else DRAFT.selected = DRAFT.selected.filter(x => x !== "Omitir" && !(RUN.current === "N8a" && x === "No"));
      } else DRAFT.selected = [v];
      render();
    });
    $$("[data-q]").forEach(b => b.onclick = () => { saveDraftFields(); DRAFT.rule = null; DRAFT.answers[b.dataset.q] = b.dataset.a; render(); });
    $$("[data-rule]").forEach(b => b.onclick = () => { saveDraftFields(); DRAFT.rule = DRAFT.rule === b.dataset.rule ? null : b.dataset.rule; render(); });
    $$("[data-v]").forEach(b => b.onclick = () => { saveDraftFields(); DRAFT.verdict = b.dataset.v; render(); });

    const file = $("#file");
    if (file) {
      $("#btn-attach").onclick = () => file.click();
      file.onchange = () => addShots(file.files);
      const dz = $("#dropzone");
      dz.ondragover = (e) => { e.preventDefault(); dz.classList.add("drag"); };
      dz.ondragleave = () => dz.classList.remove("drag");
      dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove("drag"); addShots(e.dataTransfer.files); };
      $$("[data-full]").forEach(i => i.onclick = () => showImage(i.src));
      $$("[data-del]").forEach(b => b.onclick = async () => {
        const arr = RUN.current === "FIN" ? RUN.finalShots : DRAFT.shots;
        saveDraftFields(); arr.splice(+b.dataset.del, 1); await persist(); render();
      });
    }

    const next = $("#btn-next");
    if (next) next.onclick = async () => {
      saveDraftFields();
      const exp = expectedNext(RUN.current, DRAFT, RUN);
      if (!exp) return toast("Elija la respuesta usada en el chatbot (o una regla global).");
      if (!DRAFT.verdict) return toast("Marque si el bot cumple o no cumple.");
      if (DRAFT.verdict === "No cumple" && !DRAFT.shots.length && !await ask("Marcó «No cumple» sin pantallazo. ¿Continuar sin evidencia?")) return;
      const node = NODES[RUN.current];
      // banderas y prioridad
      const prevFlags = { ...RUN.flags }, prevPrio = RUN.prioridad;
      if (!DRAFT.rule) {
        (node.opts || []).filter(o => o.flag && DRAFT.selected.includes(o.label)).forEach(o => RUN.flags[o.flag] = true);
        if (RUN.flags.prioridad1) RUN.prioridad = 1;
        if (RUN.current === "P1") RUN.prioridad = Math.min(RUN.prioridad || 3, prioridadP1(DRAFT.answers));
      }
      const useReal = DRAFT.verdict === "No cumple" && DRAFT.realNode && DRAFT.followReal;
      const nextUsed = useReal ? DRAFT.realNode : exp;
      RUN.steps.push({ ...DRAFT, expected: exp, nextUsed, at: new Date().toISOString(), prevFlags, prevPrio });
      RUN.current = nextUsed;
      DRAFT = nextUsed === "FIN" ? null : newDraft(nextUsed);
      await persist();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const undo = $("#btn-undo");
    if (undo) undo.onclick = async () => {
      const last = RUN.steps.pop(); if (!last) return;
      RUN.flags = last.prevFlags; RUN.prioridad = last.prevPrio;
      RUN.current = last.nodeId; RUN.result = null;
      DRAFT = { ...last }; delete DRAFT.expected; delete DRAFT.nextUsed; delete DRAFT.prevFlags; delete DRAFT.prevPrio;
      await persist(); render();
    };

    const end = $("#btn-end");
    if (end) end.onclick = async () => {
      if (!await ask("¿Terminar el recorrido en este nodo? El paso actual no se guarda.")) return;
      RUN.endedAt = RUN.current; RUN.current = "FIN"; DRAFT = null; await persist(); render();
    };

    const save = $("#btn-save");
    if (save) save.onclick = async () => {
      RUN.result = $("#result").value; RUN.defect = $("#defect").value; RUN.finalNote = $("#final-note").value;
      RUN.status = "finalizada"; RUN.end = new Date().toISOString(); RUN.draft = null;
      await DB.put(RUN);
      const id = RUN.id; RUN = null; DRAFT = null;
      toast("Prueba guardada");
      VIEW = "historial"; await render();
      if (await ask("¿Descargar el informe de esta prueba con los pantallazos?")) report(id);
    };
    ["#result", "#defect", "#final-note"].forEach(s => { const el = $(s); if (el) el.onchange = () => { RUN.result = $("#result").value; RUN.defect = $("#defect").value; RUN.finalNote = $("#final-note").value; persist(); }; });
  }

  // historial
  $$("[data-resume]").forEach(b => b.onclick = async () => { RUN = await DB.get(b.dataset.resume); DRAFT = RUN.draft || (RUN.current !== "FIN" ? newDraft(RUN.current) : null); VIEW = "ejecutar"; render(); });
  $$("[data-detail]").forEach(b => b.onclick = async () => detail(await DB.get(b.dataset.detail)));
  $$("[data-report]").forEach(b => b.onclick = () => report(b.dataset.report));
  $$("[data-delete]").forEach(b => b.onclick = async () => {
    if (!await ask("¿Eliminar esta prueba y sus pantallazos? No se puede deshacer.")) return;
    await DB.del(b.dataset.delete); if (RUN && RUN.id === b.dataset.delete) { RUN = null; DRAFT = null; } render();
  });
  const ej = $("#exp-json"); if (ej) ej.onclick = async () => download(`salvia_pruebas_respaldo_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(await DB.all()), "application/json");
  const ca = $("#clear-all"); if (ca) ca.onclick = async () => {
    if (!await ask("¿Borrar TODAS las pruebas y pantallazos guardados en este navegador? Descargue antes un respaldo si lo necesita.")) return;
    await clearAll(); toast("Sistema limpio"); VIEW = "ejecutar"; render();
  };
  const ec = $("#exp-csv"); if (ec) ec.onclick = exportCSV;
  const ij = $("#imp-json"); if (ij) ij.onchange = async () => {
    try {
      const data = JSON.parse(await ij.files[0].text());
      for (const r of data) await DB.put(r);
      toast(`${data.length} pruebas importadas`); render();
    } catch { toast("El archivo no es un respaldo válido."); }
  };

  // árbol
  $$("[data-startat]").forEach(b => b.onclick = () => startAt(b.dataset.startat));
  const gn = $("#gen-note"); if (gn) gn.onclick = () => {
    saveDraftFields();
    const t = generateNote();
    DRAFT.note = DRAFT.note && !DRAFT.note.startsWith("Pendiente") ? DRAFT.note + "\n" + t : t;
    $("#note").value = DRAFT.note; persist();
  };
  const nr = $("#new-run"); if (nr) nr.onclick = async () => {
    saveDraftFields(); await persist();
    RUN = null; DRAFT = null; VIEW = "ejecutar"; render();
    toast("La prueba anterior quedó guardada «en curso» en el Historial");
  };
  const tc = $("#toggle-case"); if (tc) tc.onclick = () => { RUN._showCase = !RUN._showCase; $("#case-detail").classList.toggle("hidden"); };
}

/* ------------------------------------------------------------------ detalle, informe, CSV */
function stepsTable(r, forReport) {
  return `<table><thead><tr><th>#</th><th>Nodo</th><th>Respuesta</th><th>Esperado</th><th>Real</th><th>Resultado</th><th>Observaciones</th><th>Pantallazos</th></tr></thead><tbody>
  ${r.steps.map((s, i) => `<tr>
    <td>${i + 1}</td><td><b>${s.nodeId}</b><br><span class="muted">${esc(NODES[s.nodeId]?.nombre)}</span></td>
    <td>${esc(answerText(s))}</td><td>${s.expected}</td><td>${s.realNode || s.expected}</td>
    <td><span class="pill ${s.verdict === "Cumple" ? "Pasa" : "Falla"}">${s.verdict}</span></td>
    <td>${esc(s.note)}</td>
    <td>${s.shots.map(sh => forReport ? `<img src="${sh.data}" class="shot">` : `<img src="${sh.data}" class="mini" data-zoom style="height:60px;border-radius:6px;cursor:zoom-in;margin:2px">`).join("")}</td>
  </tr>`).join("")}</tbody></table>`;
}

function runHeader(r) {
  const s = runStats(r); const c = CASES.find(x => x.id === r.caseId);
  return `<p><b>Caso:</b> ${c ? `${c.id} – ${esc(c.pasos)}` : "Recorrido libre"}<br>
  ${c ? `<b>Resultado esperado del caso:</b> ${esc(c.esperado)}<br>` : ""}
  <b>Tester:</b> ${esc(r.tester)} · <b>Canal:</b> ${esc(r.canal)} · <b>Versión bot:</b> ${esc(r.version || "—")} · <b>Ambiente:</b> ${esc(r.ambiente || "—")}${r.hora ? ` · <b>Hora simulada:</b> ${r.hora}` : ""}<br>
  <b>Inicio:</b> ${fmtDate(r.start)} · <b>Fin:</b> ${fmtDate(r.end)} · <b>Árbol:</b> ${r.treeVersion}<br>
  <b>Pasos:</b> ${s.total} · <b>Cumple:</b> ${s.ok} · <b>No cumple:</b> ${s.ko} · <b>Resultado:</b> ${r.result || "En curso"}${r.defect ? ` · <b>Defecto:</b> ${esc(r.defect)}` : ""}${r.endedAt ? ` · <b>Terminado manualmente en:</b> ${r.endedAt}` : ""}</p>
  ${r.finalNote ? `<p><b>Conclusión:</b> ${esc(r.finalNote)}</p>` : ""}`;
}

function detail(r) {
  modal(`<h2>Detalle de la prueba</h2>${runHeader(r)}${stepsTable(r, false)}
    ${(r.finalShots || []).length ? `<h3>Pantallazos finales</h3>${r.finalShots.map(s => `<img src="${s.data}" data-zoom style="height:90px;margin:4px;border-radius:6px;cursor:zoom-in">`).join("")}` : ""}
    <div class="row" style="margin-top:14px"><span class="spacer"></span><button class="btn primary" id="detail-report">Descargar informe</button></div>`);
  $$("[data-zoom]").forEach(i => i.onclick = () => showImage(i.src));
  $("#detail-report").onclick = () => report(r.id);
}

async function report(id) {
  const r = await DB.get(id);
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe de prueba ${r.caseId || ""} – SALVIA</title>
  <style>
    body{font-family:Arial,sans-serif;color:#23182a;margin:28px;font-size:13px}
    header{display:flex;align-items:center;gap:18px;border-bottom:4px solid #c7a4d1;padding-bottom:10px;margin-bottom:16px}
    header img{height:64px} h1{color:#3e0b47;font-size:20px;margin:0} h2,h3{color:#3e0b47}
    table{width:100%;border-collapse:collapse} th{background:#3e0b47;color:#fff;text-align:left;padding:6px;font-size:12px}
    td{border-bottom:1px solid #e2d7e6;padding:6px;vertical-align:top} .muted{color:#6d6472}
    .pill{padding:2px 8px;border-radius:999px;font-weight:bold;font-size:11px}.Pasa{background:#e3f4ea;color:#1f7a4a}.Falla{background:#fbe5e3;color:#b3261e}
    img.shot{max-width:320px;max-height:420px;display:block;margin:4px 0;border:1px solid #ddd}
    tr{page-break-inside:avoid}
  </style></head><body>
  <header><img src="${LOGO_DATA_URL}" alt="SALVIA"><div><h1>Informe de prueba del chatbot</h1><div class="muted">Generado ${fmtDate(new Date().toISOString())}</div></div></header>
  ${runHeader(r)}
  <h3>Recorrido</h3>${stepsTable(r, true)}
  ${(r.finalShots || []).length ? `<h3>Pantallazos finales</h3>${r.finalShots.map(s => `<img class="shot" src="${s.data}">`).join("")}` : ""}
  </body></html>`;
  download(`Informe_prueba_${r.caseId || "libre"}_${r.start.slice(0, 10)}.html`, html, "text/html");
}

async function exportCSV() {
  const runs = await DB.all();
  const head = ["id_prueba", "caso", "tester", "canal", "version_bot", "ambiente", "inicio", "resultado_caso", "defecto", "paso", "nodo", "respuesta", "destino_esperado", "destino_real", "resultado_paso", "observaciones", "num_pantallazos"];
  const rows = [head];
  runs.forEach(r => r.steps.forEach((s, i) => rows.push([r.id, r.caseId, r.tester, r.canal, r.version, r.ambiente, r.start, r.result || "En curso", r.defect, i + 1, s.nodeId, answerText(s), s.expected, s.realNode || s.expected, s.verdict, s.note, s.shots.length])));
  const csv = "﻿" + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  download(`salvia_pruebas_${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
}

/* ------------------------------------------------------------------ inicio */
document.addEventListener("paste", (e) => {
  if (VIEW !== "ejecutar" || !RUN || !$("#file")) return;
  const files = [...(e.clipboardData?.items || [])].filter(i => i.type.startsWith("image/")).map(i => i.getAsFile());
  if (files.length) { e.preventDefault(); addShots(files); }
});
$$(".tab").forEach(t => t.onclick = () => { saveDraftFields(); if (RUN) persist(); VIEW = t.dataset.view; render(); });
$(".modal-close").onclick = closeModal;
$("#modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

/* Limpieza única al instalar esta versión: deja el sistema vacío para diligenciar de nuevo */
const APP_RESET = "salvia-reset-2026-11-25b";
async function clearAll() {
  await DB.close();
  await new Promise(res => { const r = indexedDB.deleteDatabase("salvia-pruebas-chatbot"); r.onsuccess = r.onerror = r.onblocked = () => res(); });
  localStorage.removeItem("salvia-tester");
  RUN = null; DRAFT = null;
}

render();
(async () => {
  if (!localStorage.getItem(APP_RESET)) { await clearAll(); localStorage.setItem(APP_RESET, "1"); }
  // Carga las pruebas registradas que vienen con la app (evidencias), sin duplicarlas
  for (const r of (typeof SEED_RUNS !== "undefined" ? SEED_RUNS : [])) { if (!(await DB.get(r.id))) await DB.put(r); }
  // Reanuda automáticamente la última prueba en curso
  const open = (await DB.all()).filter(r => r.status === "en curso").sort((a, b) => b.start.localeCompare(a.start))[0];
  if (open) { RUN = open; DRAFT = open.draft || (open.current !== "FIN" ? newDraft(open.current) : null); }
  render();
})();

/* Celular: cada celda guarda el nombre de su columna para mostrar las tablas como tarjetas */
(() => {
  const label = () => {
    for (const t of document.querySelectorAll("table")) {
      const head = t.tHead && t.tHead.rows[0]; if (!head) continue;
      const names = []; for (const c of head.cells) { for (let k = 0; k < (c.colSpan || 1); k++) names.push(c.textContent.trim()); }
      for (const tb of t.tBodies) for (const r of tb.rows) { let i = 0; for (const c of r.cells) { if (!c.hasAttribute("data-l")) c.setAttribute("data-l", names[i] || ""); i += c.colSpan || 1; } }
    }
  };
  const mo = new MutationObserver(() => { mo.disconnect(); label(); mo.observe(document.body, { childList: true, subtree: true }); });
  label(); mo.observe(document.body, { childList: true, subtree: true });
})();
