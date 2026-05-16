// ========================================
// DataInsight SST Suite — DASHBOARD EXECUTIVO
// ========================================

const API_BASE = "https://datainsight-sst-suite.onrender.com";

const ENDPOINT_NR17  = "/nr17/records";
const ENDPOINT_LTCAT = "/ltcat/records";

let chartInstances = [];

// ---------- Auth ----------
function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("authToken");
  const base = { ...extra };

  if (token) {
    base["Authorization"] = `Bearer ${token}`;
  }

  return base;
}

function checkUnauthorized(status) {
  if (status === 401) {
    alert("Sessão expirada ou não autorizada. Faça login novamente.");
    localStorage.removeItem("authToken");
    window.location.href = "index.html";
    return true;
  }

  return false;
}

// ---------- API ----------
async function handleResponse(res, method, path) {
  if (!res.ok) {
    if (checkUnauthorized(res.status)) {
      throw new Error(`HTTP 401 ${method} ${path}`);
    }

    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${method} ${path} → ${text}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return handleResponse(res, "GET", path);
}

function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// ---------- ASO ----------
async function fetchASORecords() {
  const candidates = [
    "/aso/records",
    "/aso/records/",
    "/api/aso/records",
    "/pcmso/records",
    "/pcmsos/records",
  ];

  for (const path of candidates) {
    try {
      const data = await apiGet(path);
      const list = asList(data);

      if (list.length > 0) {
        console.log("ASO carregado pela rota:", path);
        return list;
      }
    } catch (err) {
      console.warn("Falha rota ASO:", path, err);
    }
  }

  return [];
}

// ---------- UI ----------
function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tab-panel");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      buttons.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");

      const panel = document.querySelector(`#tab-${target}`);
      if (panel) panel.classList.add("active");
    });
  });
}

function destroyCharts() {
  chartInstances.forEach((chart) => chart.destroy());
  chartInstances = [];
}

function createChart(ctx, config) {
  if (!ctx) return null;

  const chart = new Chart(ctx, config);
  chartInstances.push(chart);

  return chart;
}

function animateNumber(selector, finalValue) {
  const el = document.querySelector(selector);
  if (!el) return;

  const value = Number(finalValue) || 0;
  let current = 0;
  const step = Math.max(1, Math.ceil(value / 25));

  const timer = setInterval(() => {
    current += step;

    if (current >= value) {
      current = value;
      clearInterval(timer);
    }

    el.textContent = current;
  }, 22);
}

// ---------- LOAD ----------
async function loadKPIsAndCharts() {
  try {
    destroyCharts();

    const [asos, nr17Raw, ltcatRaw] = await Promise.all([
      fetchASORecords(),
      apiGet(ENDPOINT_NR17).catch(() => []),
      apiGet(ENDPOINT_LTCAT).catch(() => []),
    ]);

    const listaASO = asList(asos);
    const listaNR17 = asList(nr17Raw);
    const listaLTCAT = asList(ltcatRaw);

    const riscoMedio = calcularRiscoMedio(listaNR17);

    animateNumber("#kpi-total-asos", listaASO.length);
    animateNumber("#kpi-total-nr17", listaNR17.length);
    animateNumber("#kpi-total-ltcat", listaLTCAT.length);

    const riscoEl = document.querySelector("#kpi-risco-medio-nr17");
    if (riscoEl) riscoEl.textContent = riscoMedio;

    buildChartDistribuicaoModulos(listaASO, listaNR17, listaLTCAT);
    buildChartPerfilRiscoNR17(listaNR17);
    buildChartAgentesTopLTCAT(listaLTCAT);
    buildUltimasAtividades(listaASO, listaNR17, listaLTCAT);

    buildPCMSOCharts(listaASO);
    buildLTCACharts(listaLTCAT);
    buildNR17TabCharts(listaNR17);

    await loadPGRCharts();

  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
  }
}

function calcularRiscoMedio(listaNR17) {
  if (!listaNR17.length) return "—";

  const soma = listaNR17.reduce(
    (acc, item) => acc + (Number(item.score) || 0),
    0
  );

  return (soma / listaNR17.length).toFixed(1);
}

// ---------- CHARTS GERAL ----------
function buildChartDistribuicaoModulos(asos, nr17, ltcat) {
  const ctx = document.getElementById("chart-distribuicao-modulos");

  createChart(ctx, {
    type: "bar",
    data: {
      labels: ["PCMSO / ASO", "NR-17", "LTCAT"],
      datasets: [{
        label: "Registros",
        data: [asos.length, nr17.length, ltcat.length],
        borderRadius: 12,
      }],
    },
    options: chartOptionsBar()
  });
}

function buildChartPerfilRiscoNR17(nr17) {
  const ctx = document.getElementById("chart-perfil-risco-nr17");

  let baixo = 0;
  let medio = 0;
  let alto = 0;

  nr17.forEach((item) => {
    const s = Number(item.score) || 0;

    if (s <= 6) baixo++;
    else if (s <= 12) medio++;
    else alto++;
  });

  createChart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Baixo", "Médio", "Alto"],
      datasets: [{
        data: [baixo, medio, alto],
        borderWidth: 2,
      }],
    },
    options: chartOptionsDoughnut()
  });
}

function buildChartAgentesTopLTCAT(ltcat) {
  const ctx = document.getElementById("chart-agentes-top");

  const cont = {};

  ltcat.forEach((reg) => {
    const agente = reg.agente || "Não informado";
    cont[agente] = (cont[agente] || 0) + 1;
  });

  const entries = Object.entries(cont)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  createChart(ctx, {
    type: "bar",
    data: {
      labels: entries.map((e) => e[0]),
      datasets: [{
        label: "Ocorrências",
        data: entries.map((e) => e[1]),
        borderRadius: 12,
      }],
    },
    options: chartOptionsBar()
  });
}

// ---------- ATIVIDADES ----------
function buildUltimasAtividades(asos, nr17, ltcat) {
  const container = document.getElementById("lista-ultimas-atividades");
  if (!container) return;

  const eventos = [];

  asos.forEach((a) => {
    eventos.push({
      tipo: "ASO",
      icon: "⚕️",
      data: a.data_exame || a.created_at || null,
      desc: `Exame ocupacional — ${a.nome || "Trabalhador"}`,
    });
  });

  nr17.forEach((n) => {
    eventos.push({
      tipo: "NR-17",
      icon: "🪑",
      data: n.data_avaliacao || n.created_at || null,
      desc: `${n.funcao || "Posto"} / ${n.setor || "Setor"}`,
    });
  });

  ltcat.forEach((l) => {
    eventos.push({
      tipo: "LTCAT",
      icon: "📄",
      data: l.data_avaliacao || null,
      desc: `${l.agente || "Agente"} — ${l.setor || "Setor"}`,
    });
  });

  eventos.sort((a, b) => {
    const da = a.data ? new Date(a.data) : 0;
    const db = b.data ? new Date(b.data) : 0;
    return db - da;
  });

  const ultimos = eventos.slice(0, 8);

  if (!ultimos.length) {
    container.innerHTML = `
      <div class="activity-empty">
        Nenhuma atividade registrada ainda.
      </div>
    `;
    return;
  }

  container.innerHTML = ultimos.map((ev) => {
    const d = ev.data
      ? new Date(ev.data).toLocaleDateString("pt-BR")
      : "—";

    return `
      <div class="activity-item premium">
        <div class="activity-icon">${ev.icon}</div>

        <div class="activity-content">
          <div class="activity-title">${ev.tipo}</div>
          <div class="activity-desc">${ev.desc}</div>
        </div>

        <div class="activity-date">${d}</div>
      </div>
    `;
  }).join("");
}

// ---------- PCMSO ----------
function buildPCMSOCharts(asos) {
  const ctxMensal = document.getElementById("chart-pcmsos-mensal");
  const ctxStatus = document.getElementById("chart-pcmsos-status");

  const porMes = {};
  const porStatus = {};

  asos.forEach((a) => {
    const data = a.data_exame || a.created_at;
    const status = a.resultado || "Sem informação";

    if (data) {
      const d = new Date(data);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      porMes[chave] = (porMes[chave] || 0) + 1;
    }

    porStatus[status] = (porStatus[status] || 0) + 1;
  });

  createChart(ctxMensal, {
    type: "line",
    data: {
      labels: Object.keys(porMes).sort(),
      datasets: [{
        label: "Exames",
        data: Object.keys(porMes).sort().map((k) => porMes[k]),
        tension: 0.35,
        fill: true,
      }],
    },
    options: chartOptionsLine()
  });

  createChart(ctxStatus, {
    type: "doughnut",
    data: {
      labels: Object.keys(porStatus),
      datasets: [{
        data: Object.keys(porStatus).map((k) => porStatus[k]),
      }],
    },
    options: chartOptionsDoughnut()
  });
}

// ---------- LTCAT ----------
function buildLTCACharts(ltcat) {
  const ctxSetor = document.getElementById("chart-ltcat-setor");
  const ctxEnq = document.getElementById("chart-ltcat-enquadramento");

  const porSetor = {};
  const porEnq = {};

  ltcat.forEach((l) => {
    const setor = l.setor || "Não informado";
    const enq = l.enquadramento || "Sem enquadramento";

    porSetor[setor] = (porSetor[setor] || 0) + 1;
    porEnq[enq] = (porEnq[enq] || 0) + 1;
  });

  createChart(ctxSetor, {
    type: "bar",
    data: {
      labels: Object.keys(porSetor),
      datasets: [{
        label: "Agentes",
        data: Object.keys(porSetor).map((k) => porSetor[k]),
        borderRadius: 12,
      }],
    },
    options: chartOptionsBar()
  });

  createChart(ctxEnq, {
    type: "pie",
    data: {
      labels: Object.keys(porEnq),
      datasets: [{
        data: Object.keys(porEnq).map((k) => porEnq[k]),
      }],
    },
    options: chartOptionsDoughnut()
  });
}

// ---------- NR17 ----------
function buildNR17TabCharts(nr17) {
  const ctxRisco = document.getElementById("chart-nr17-risco");
  const ctxSetores = document.getElementById("chart-nr17-setores");

  let baixo = 0;
  let medio = 0;
  let alto = 0;

  nr17.forEach((item) => {
    const s = Number(item.score) || 0;

    if (s <= 6) baixo++;
    else if (s <= 12) medio++;
    else alto++;
  });

  createChart(ctxRisco, {
    type: "bar",
    data: {
      labels: ["Baixo", "Médio", "Alto"],
      datasets: [{
        label: "Avaliações",
        data: [baixo, medio, alto],
        borderRadius: 12,
      }],
    },
    options: chartOptionsBar()
  });

  const grupos = {};

  nr17.forEach((item) => {
    const setor = item.setor || "Não informado";
    const score = Number(item.score) || 0;

    if (!grupos[setor]) {
      grupos[setor] = { soma: 0, qtd: 0 };
    }

    grupos[setor].soma += score;
    grupos[setor].qtd += 1;
  });

  const labels = Object.keys(grupos);
  const data = labels.map((setor) => grupos[setor].soma / grupos[setor].qtd);

  createChart(ctxSetores, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Score médio",
        data,
        borderRadius: 12,
      }],
    },
    options: chartOptionsBar()
  });
}

// ---------- PGR ----------
async function carregarArvorePGR() {
  const companies = await apiGet("/pgr/companies").catch(() => []);

  const allSectors = [];
  const allHazards = [];
  const allRisks = [];
  const allActions = [];

  for (const c of companies || []) {
    const sectors = await apiGet(`/pgr/sectors/by-company/${c.id}`).catch(() => []);
    sectors.forEach((s) => allSectors.push({ ...s, company_id: c.id }));

    for (const s of sectors || []) {
      const hazards = await apiGet(`/pgr/hazards/by-sector/${s.id}`).catch(() => []);
      hazards.forEach((h) => allHazards.push({ ...h, sector_id: s.id }));

      for (const h of hazards || []) {
        const risks = await apiGet(`/pgr/risks/by-hazard/${h.id}`).catch(() => []);
        risks.forEach((r) => allRisks.push({ ...r, hazard_id: h.id }));

        for (const r of risks || []) {
          const actions = await apiGet(`/pgr/actions/by-risk/${r.id}`).catch(() => []);
          actions.forEach((a) => allActions.push({ ...a, risk_id: r.id }));
        }
      }
    }
  }

  return {
    companies,
    sectors: allSectors,
    hazards: allHazards,
    risks: allRisks,
    actions: allActions,
  };
}

function classificarPerigo(hazard) {
  const texto = `${hazard.nome || ""} ${hazard.agente || ""} ${hazard.fonte || ""} ${hazard.descricao || ""}`.toLowerCase();

  if (texto.includes("ruído") || texto.includes("calor") || texto.includes("frio") || texto.includes("vibração")) return "Físicos";
  if (texto.includes("poeira") || texto.includes("solvente") || texto.includes("ácido") || texto.includes("gás")) return "Químicos";
  if (texto.includes("vírus") || texto.includes("bactéria") || texto.includes("fungo")) return "Biológicos";
  if (texto.includes("postura") || texto.includes("ergon") || texto.includes("repetitiv") || texto.includes("carga")) return "Ergonômicos";
  if (texto.includes("máquina") || texto.includes("queda") || texto.includes("impacto")) return "Mecânicos";

  return "Outros";
}

function montarChartPGRCategorias(hazards) {
  const ctx = document.getElementById("chart-pgr-categorias");

  const cont = {
    Físicos: 0,
    Químicos: 0,
    Biológicos: 0,
    Ergonômicos: 0,
    Mecânicos: 0,
    Outros: 0,
  };

  (hazards || []).forEach((h) => {
    const cat = classificarPerigo(h);
    cont[cat] = (cont[cat] || 0) + 1;
  });

  createChart(ctx, {
    type: "radar",
    data: {
      labels: Object.keys(cont),
      datasets: [{
        label: "Perigos",
        data: Object.keys(cont).map((k) => cont[k]),
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  });
}

function montarChartPGRAcoes(actions) {
  const ctx = document.getElementById("chart-pgr-acoes");

  const cont = {
    Pendente: 0,
    "Em andamento": 0,
    Concluído: 0,
  };

  (actions || []).forEach((a) => {
    const s = (a.status || "").toLowerCase();

    if (s.includes("andamento")) cont["Em andamento"]++;
    else if (s.includes("concl")) cont["Concluído"]++;
    else cont["Pendente"]++;
  });

  createChart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(cont),
      datasets: [{
        label: "Ações",
        data: Object.keys(cont).map((k) => cont[k]),
        borderRadius: 12,
      }],
    },
    options: chartOptionsBar()
  });
}

async function loadPGRCharts() {
  try {
    const pgr = await carregarArvorePGR();

    montarChartPGRCategorias(pgr.hazards);
    montarChartPGRAcoes(pgr.actions);

  } catch (err) {
    console.error("Erro ao carregar PGR:", err);
  }
}

// ---------- OPTIONS ----------
function chartOptionsBar() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148,163,184,0.25)" },
        ticks: {
          precision: 0,
          color: "#64748b",
        },
      },
    },
  };
}

function chartOptionsLine() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(148,163,184,0.25)" },
        ticks: {
          precision: 0,
          color: "#64748b",
        },
      },
    },
  };
}

function chartOptionsDoughnut() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: "#64748b",
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        padding: 12,
      },
    },
  };
}

// ---------- START ----------
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  await loadKPIsAndCharts();
});
