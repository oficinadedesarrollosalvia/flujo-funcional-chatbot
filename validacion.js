/* Pestaña «Validación del bot»: estado general, criterios de salida, evidencias, defectos,
   comparación con el v0.6, hallazgos, justificación y recomendaciones.
   Las cifras de pruebas se calculan en vivo con lo registrado en la app. */

const HZ_KEY = "salvia-hz-estado", DEF_KEY = "salvia-def-estado";
const loadMap = (k) => { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch { return {}; } };
const saveMap = (k, m) => { try { localStorage.setItem(k, JSON.stringify(m)); } catch {} };
let VAL_FILTER = "Todos";

function hzList() {
  const m = loadMap(HZ_KEY);
  return VAL.hallazgos.map(h => ({ ...h, estado: m[h.id] || h.estado }));
}

function valStats(runs) {
  const steps = runs.flatMap(r => r.steps.map((s, i) => ({ ...s, run: r, n: i + 1 })));
  const nodes = new Set(steps.map(s => s.nodeId));
  const byCase = {};
  runs.filter(r => r.caseId && r.status !== "en curso").sort((a, b) => a.start.localeCompare(b.start)).forEach(r => byCase[r.caseId] = r.result);
  const crit = CASES.filter(c => c.prioridad === "Crítica");
  const critPasa = crit.filter(c => byCase[c.id] === "Pasa").length;
  const ejec = Object.keys(byCase).length, pasa = Object.values(byCase).filter(v => v === "Pasa").length;
  const autoDef = steps.filter(s => s.verdict === "No cumple");
  const defMap = loadMap(DEF_KEY);
  const defAbiertos = VAL.defectos.filter(d => (defMap[d.id] || d.estado) !== "Cerrado").length;
  const hz = hzList();
  const hzAbiertosCA = hz.filter(h => ["Crítica", "Alta"].includes(h.sev) && h.estado === "Abierto").length;
  return {
    pruebas: runs.length, pasos: steps.length, ok: steps.filter(s => s.verdict === "Cumple").length, ko: autoDef.length,
    nodos: nodes.size, totalNodos: Object.keys(NODES).length, ejec, pasa, critPasa, crit: crit.length,
    defAbiertos, hzAbiertosCA, hzResueltos: hz.filter(h => h.estado === "Resuelto").length, autoDef,
  };
}

function valCriteria(st) {
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  return [
    ["Casos críticos en «Pasa»", `${st.critPasa} de ${st.crit} (${pct(st.critPasa, st.crit)} %)`, "100 %", st.crit && st.critPasa === st.crit],
    ["Defectos abiertos", `${st.defAbiertos}`, "0 críticos o altos", st.defAbiertos === 0],
    ["Casos ejecutados que pasan", `${st.pasa} de ${st.ejec} (${pct(st.pasa, st.ejec)} %)`, "≥ 95 %", st.ejec > 0 && st.pasa / st.ejec >= 0.95],
    ["Nodos del proceso probados", `${st.nodos} de ${st.totalNodos} (${pct(st.nodos, st.totalNodos)} %)`, "100 %", st.nodos === st.totalNodos],
    ["Hallazgos críticos o altos abiertos", `${st.hzAbiertosCA}`, "0", st.hzAbiertosCA === 0],
    ["Validación psicosocial y jurídica", "Pendiente", "Firmada", false],
  ];
}

function valSections(runs, mode) {
  const app = mode === "app";
  const st = valStats(runs);
  const crit = valCriteria(st);
  const cumplidos = crit.filter(c => c[3]).length;
  const defMap = loadMap(DEF_KEY);
  const hz = hzList();
  const shown = VAL_FILTER === "Todos" || !app ? hz : hz.filter(h => VAL_FILTER === "Abiertos" ? !["Resuelto", "Aceptado"].includes(h.estado) : h.estado === VAL_FILTER);
  const selEstado = (id, cur, opts, attr) => app
    ? `<select class="vsel" ${attr}="${id}">${opts.map(o => `<option ${o === cur ? "selected" : ""}>${o}</option>`).join("")}</select>`
    : `<span class="pill ${cur === "Resuelto" || cur === "Cerrado" ? "Pasa" : cur === "Parcial" ? "curso" : "Falla"}">${cur}</span>`;

  const evid = runs.length ? runs.sort((a, b) => a.start.localeCompare(b.start)).map(r => {
    const c = CASES.find(x => x.id === r.caseId);
    const rows = r.steps.map((s, i) => ({ ...s, n: i + 1 }));
    if (r.draft && r.status === "en curso") rows.push({ ...r.draft, n: r.steps.length + 1, borrador: true });
    return `<div class="vrun">
      <div class="vrun-head"><b>${r.caseId || "Recorrido libre"}</b>${c ? ` · ${esc(c.pasos)}` : ""}
        <span class="muted small">${esc(r.canal)} · ${esc(r.tester || "")} · ${fmtDate(r.start)} · ${r.status === "en curso" ? "en curso" : "resultado: " + esc(r.result || "")}</span></div>
      <table><thead><tr><th>Paso</th><th>Nodo</th><th>Respuesta</th><th>Resultado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>
      ${rows.map(s => `<tr><td>${s.n}</td><td><b>${s.nodeId}</b><br><span class="muted small">${esc(NODES[s.nodeId]?.nombre || "")}</span></td>
        <td>${esc(answerText(s))}</td>
        <td>${s.borrador ? `<span class="pill curso">En curso</span>` : `<span class="pill ${s.verdict === "Cumple" ? "Pasa" : "Falla"}">${s.verdict}</span>`}</td>
        <td>${esc(s.note || "")}</td>
        <td>${(s.shots || []).map(sh => `<img class="vshot" src="${sh.data}" data-zoom alt="Pantallazo paso ${s.n}">`).join("")}</td></tr>`).join("")}
      </tbody></table></div>`;
  }).join("") : `<p class="muted">Aún no hay pruebas registradas.</p>`;

  const defRows = VAL.defectos.map(d => `<tr><td><b>${d.id}</b></td><td>${d.caso}</td><td>${d.nodo}</td><td><span class="peso ${d.sev === "Alta" || d.sev === "Crítica" ? "Crítica" : "Moderada"}">${d.sev}</span></td><td>${esc(d.desc)}<br><span class="muted small">${esc(d.evid)}</span></td><td>${selEstado(d.id, defMap[d.id] || d.estado, ["Abierto", "En corrección", "Para re-probar", "Cerrado"], "data-def")}</td></tr>`).join("")
    + st.autoDef.map(s => `<tr><td><b>Paso ${s.n}</b></td><td>${s.run.caseId || "libre"}</td><td>${s.nodeId}</td><td>—</td><td>${esc(s.note || "Marcado «No cumple» en la prueba")}${s.realNode ? `<br><span class="muted small">Debía ir a ${s.expected} y fue a ${s.realNode}</span>` : ""}</td><td><span class="pill Falla">Registrado en prueba</span></td></tr>`).join("");

  const sec = (id, title, body, lead = "") => `<section class="card vsec" id="v-${id}"><h2>${title}</h2>${lead ? `<p class="vlead">${lead}</p>` : ""}${body}</section>`;

  return [
    sec("estado", "Estado de la validación", `
      <div class="verdict-box ${cumplidos === crit.length ? "ok" : "ko"}">
        <div class="vb-ico">${cumplidos === crit.length ? "✓" : "!"}</div>
        <div><b>${cumplidos === crit.length ? "El bot cumple los criterios de salida" : "El bot todavía no está listo para producción"}</b>
        <div class="muted small">Cumple ${cumplidos} de ${crit.length} criterios de salida del plan de pruebas · ${VAL.fecha}</div></div>
      </div>
      <div class="kpis vk">
        <div class="kpi"><b>${VAL.recorridos.filter(r => r.ok).length}/${VAL.recorridos.length}</b><span>recorridos del proceso OK</span></div>
        <div class="kpi"><b>${st.pruebas}</b><span>pruebas en el bot real</span></div>
        <div class="kpi"><b>${st.ok} / ${st.ko}</b><span>pasos cumple / no cumple</span></div>
        <div class="kpi"><b>${st.nodos}/${st.totalNodos}</b><span>nodos probados</span></div>
        <div class="kpi"><b>${st.ejec}/${CASES.length}</b><span>casos cerrados</span></div>
        <div class="kpi"><b>${st.defAbiertos}</b><span>defectos abiertos</span></div>
        <div class="kpi"><b>${st.hzAbiertosCA}</b><span>hallazgos crít./altos abiertos</span></div>
      </div>
      <h3 style="margin-top:6px">Pruebas por canal</h3>
      <table><thead><tr><th>Canal</th><th>Pruebas</th><th>Pasos</th><th>Cumple</th><th>No cumple</th><th>Nodos probados</th><th>Casos</th></tr></thead><tbody>
      ${[...new Set(runs.map(r => r.canal))].sort().map(cn => { const rs = runs.filter(r => r.canal === cn); const ss = rs.flatMap(r => r.steps);
        return `<tr><td><b>${esc(cn)}</b></td><td>${rs.length}</td><td>${ss.length}</td><td>${ss.filter(x => x.verdict === "Cumple").length}</td><td>${ss.filter(x => x.verdict === "No cumple").length}</td><td>${new Set(ss.map(x => x.nodeId)).size} de ${Object.keys(NODES).length}</td><td>${[...new Set(rs.map(r => r.caseId).filter(Boolean))].join(", ")}</td></tr>`; }).join("")}
      </tbody></table>
      <p class="vlead" style="margin-top:12px"><b>Recomendación:</b> ${esc(VAL.recomendacion)}</p>`),
    sec("realizadas", "Validaciones realizadas", `<table><thead><tr><th>Fecha</th><th>Validación</th><th>Resultado</th><th>Estado</th></tr></thead><tbody>
      ${VAL.validaciones.map(v => `<tr><td>${v[0]}</td><td><b>${esc(v[1])}</b></td><td>${esc(v[2])}</td><td><span class="pill ${v[3] === "Falla" ? "Falla" : v[3] === "Cumple" || v[3] === "Completada" || v[3] === "Analizado" || v[3] === "Sin cambios" ? "Pasa" : "curso"}">${v[3]}</span></td></tr>`).join("")}</tbody></table>`,
      "Todo lo revisado sobre el bot y su flujo, en orden de fecha."),
    sec("recorridos", "Recorridos de verificación del proceso v0.6", `<table><thead><tr><th>ID</th><th>Recorrido</th><th>Ruta esperada</th><th>Resultado</th></tr></thead><tbody>
      ${VAL.recorridos.map(r => `<tr><td><b>${r.id}</b></td><td>${esc(r.nombre)}</td><td class="vroute">${esc(r.esperado)}${r.ok ? "" : `<br><span class="muted small">${esc(r.error)}</span>`}</td><td><span class="pill ${r.ok ? "Pasa" : "Falla"}">${r.ok ? "Cumple" : "Falla"}</span></td></tr>`).join("")}</tbody></table>`,
      `${VAL.recorridos.filter(r => r.ok).length} de ${VAL.recorridos.length} rutas llegan al destino esperado (${VAL.recorridosFecha}). Se ejecutaron con la lógica de esta app para verificar el proceso v0.6; no reemplazan las pruebas en el bot real, que se registran en «Ejecutar prueba».`),
    sec("criterios", "Criterios de salida", `<table><thead><tr><th>Criterio</th><th>Valor actual</th><th>Meta</th><th>Cumple</th></tr></thead><tbody>
      ${crit.map(c => `<tr><td>${c[0]}</td><td>${c[1]}</td><td>${c[2]}</td><td><span class="pill ${c[3] ? "Pasa" : "Falla"}">${c[3] ? "Sí" : "No"}</span></td></tr>`).join("")}</tbody></table>`,
      "Se calculan en vivo con las pruebas guardadas en esta app."),
    sec("evidencias", "Evidencias de las pruebas", evid, "Cada paso con su resultado, la observación de la tester y los pantallazos. Haga clic en un pantallazo para verlo completo."),
    sec("defectos", "Defectos encontrados", `<table><thead><tr><th>ID</th><th>Caso</th><th>Nodo</th><th>Severidad</th><th>Descripción</th><th>Estado</th></tr></thead><tbody>${defRows}</tbody></table>`,
      "Incluye los defectos identificados en la revisión y cada paso marcado «No cumple» en la app."),
    sec("comparacion", "Probado frente a sugerido (v0.6)", `<table><thead><tr><th>Punto</th><th>Árbol v0.3 (base de la prueba)</th><th>Bot real (evidencia)</th><th>Flujo v0.6 (sugerido)</th><th>Qué dejar</th></tr></thead><tbody>
      ${VAL.comparacion.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join("")}</tbody></table>`,
      "En 9 de los 11 puntos conviene dejar lo del v0.6; en uno se deja lo que ya hace el bot y en otro hay que completar el v0.6."),
    sec("hallazgos", "Hallazgos de la revisión del árbol", `
      ${app ? `<div class="vfilter">${["Todos", "Abiertos", "Parcial", "Resuelto"].map(f => `<button class="ptab ${VAL_FILTER === f ? "on" : ""}" data-vfilter="${f}">${f}</button>`).join("")}</div>` : ""}
      <table><thead><tr><th>ID</th><th>Nodo / regla</th><th>Severidad</th><th>Hallazgo</th><th>Recomendación</th><th>Estado</th></tr></thead><tbody>
      ${shown.map(h => `<tr><td><b>${h.id}</b></td><td>${esc(h.nodo)}</td><td><span class="peso ${["Crítica", "Alta"].includes(h.sev) ? "Crítica" : "Moderada"}">${h.sev}</span></td><td>${esc(h.hallazgo)}</td><td>${esc(h.reco)}${h.nota ? `<br><span class="muted small">${esc(h.nota)}</span>` : ""}</td><td>${selEstado(h.id, h.estado, ["Abierto", "Parcial", "Resuelto", "Aceptado"], "data-hz")}</td></tr>`).join("")}</tbody></table>`,
      `${st.hzResueltos} resueltos de ${VAL.hallazgos.length}. ${app ? "Cambie el estado cuando el equipo resuelva o acepte un hallazgo; queda guardado en este navegador." : ""}`),
    sec("justificacion", "Por qué incorporar el v0.6 al proceso", `<div class="vjust">${VAL.justificacion.map(j => `<div><b>${esc(j[0])}</b><p>${esc(j[1])}</p></div>`).join("")}</div>`,
      "El v0.6 convierte en reglas explícitas lo que el árbol v0.3 dejaba a criterio del bot o de la agente: eso permite proteger a la persona, auditar el servicio y probarlo."),
    sec("recomendaciones", "Recomendaciones y próximos pasos", `<ol class="vreco">${VAL.recomendaciones.map(r => `<li>${esc(r)}</li>`).join("")}</ol>`),
  ].join("");
}

async function viewValidacion() {
  const runs = await DB.all();
  const nav = [["estado", "Estado"], ["realizadas", "Validaciones realizadas"], ["recorridos", "Recorridos del proceso"], ["criterios", "Criterios de salida"], ["evidencias", "Evidencias"], ["defectos", "Defectos"], ["comparacion", "Probado vs v0.6"], ["hallazgos", "Hallazgos"], ["justificacion", "Justificación"], ["recomendaciones", "Recomendaciones"]];
  return `<div class="vgrid">
    <aside class="card vnav">
      <h3>Validación del bot</h3>
      ${nav.map(n => `<a href="#v-${n[0]}" data-vnav="${n[0]}">${n[1]}</a>`).join("")}
      <button class="btn primary small" id="val-report">Descargar informe</button>
    </aside>
    <div class="vmain">${valSections(runs, "app")}</div>
  </div>`;
}

function bindValidacion() {
  $$("[data-vnav]").forEach(a => a.onclick = (e) => { e.preventDefault(); const el = document.getElementById("v-" + a.dataset.vnav); if (el) window.scrollTo({ top: el.offsetTop - 130, behavior: "smooth" }); });
  $$("[data-hz]").forEach(s => s.onchange = () => { const m = loadMap(HZ_KEY); m[s.dataset.hz] = s.value; saveMap(HZ_KEY, m); render(); toast("Estado del hallazgo actualizado"); });
  $$("[data-def]").forEach(s => s.onchange = () => { const m = loadMap(DEF_KEY); m[s.dataset.def] = s.value; saveMap(DEF_KEY, m); render(); toast("Estado del defecto actualizado"); });
  $$("[data-vfilter]").forEach(b => b.onclick = () => { VAL_FILTER = b.dataset.vfilter; const y = window.scrollY; render().then(() => window.scrollTo(0, y)); });
  const rep = $("#val-report"); if (rep) rep.onclick = async () => {
    const runs = await DB.all();
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Validación del chatbot SALVIA</title><style>
      body{font-family:Arial,sans-serif;color:#23182a;margin:28px;font-size:13px;line-height:1.4}
      header{display:flex;align-items:center;gap:18px;border-bottom:4px solid #c7a4d1;padding-bottom:10px;margin-bottom:16px}
      header img{height:70px} h1{color:#3e0b47;font-size:22px;margin:0} h2{color:#3e0b47;font-size:17px;margin:22px 0 6px}
      table{width:100%;border-collapse:collapse;margin:6px 0} th{background:#3e0b47;color:#fff;text-align:left;padding:6px;font-size:11px}
      td{border-bottom:1px solid #e2d7e6;padding:6px;vertical-align:top} .muted{color:#6d6472}.small{font-size:11px}
      .pill,.peso{padding:2px 8px;border-radius:999px;font-weight:bold;font-size:11px}.Pasa{background:#e4f5eb;color:#1f7a4a}.Falla,.Crítica{background:#fde8e6;color:#b3261e}.curso,.Moderada{background:#fff4c7;color:#7a5a00}
      .vshot{max-width:260px;max-height:360px;display:block;margin:4px 0;border:1px solid #ddd}
      .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;text-align:center}.kpi{background:#f8f4fa;border-radius:8px;padding:8px}.kpi b{display:block;font-size:18px;color:#3e0b47}.kpi span{font-size:10px;color:#6d6472}
      .verdict-box{display:flex;gap:12px;align-items:center;padding:10px 14px;border-radius:10px;background:#fde8e6;margin-bottom:10px}.verdict-box.ok{background:#e4f5eb}.vb-ico{font-size:22px;font-weight:bold}
      .vjust div{margin:8px 0}.vjust p{margin:2px 0} tr{page-break-inside:avoid} .vrun-head{margin:10px 0 4px}
    </style></head><body>
    <header><img src="${LOGO_DATA_URL}" alt="SALVIA"><div><h1>Validación del chatbot SALVIA</h1><div class="muted">Proceso v0.6 · generado ${fmtDate(new Date().toISOString())}</div></div></header>
    ${valSections(runs, "report")}</body></html>`;
    download(`Validacion_chatbot_SALVIA_${new Date().toISOString().slice(0, 10)}.html`, html, "text/html");
  };
}
