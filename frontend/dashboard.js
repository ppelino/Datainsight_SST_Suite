// ========================================
// DataInsight SST Suite — DASHBOARD GERAL
// ========================================

// Base igual aos módulos (sem /api)
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// Endpoints da API
const ENDPOINT_ASOS  = "/aso/records";
const ENDPOINT_NR17  = "/nr17/records";
const ENDPOINT_LTCAT = "/ltcat/records";

// ---------- Helpers de auth ----------
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

// ---------- Helpers de requisição ----------
async function handleResponse(res, method, path) {
  if (!res.ok) {
    if (checkUnauthorized(res.status)) {
      throw new Error(`HTTP 401 ${method} ${path}`);
    }
    let text = "";
    try {
      text = await res.text();
    } catch {
      text = "";
    }
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

// Normaliza retorno (garante array)
function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// Tenta múltiplas rotas possíveis para listar ASOs
async function fetchASORecords() {
  const candidates = [
    "/aso/records",
    "/aso/records/",
    "/aso",
    "/asos/records",
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
      console.warn("Falha ao tentar rota ASO:", path, err);
    }
  }

  console.warn("Nenhuma rota de ASO retornou dados; usando lista vazia.");
  return [];
}

// ========================================
// CONTROLE DE ABAS
// ========================================
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

// ========================================
// CARREGAMENTO GERAL (KPIs + GRÁFICOS)
// ========================================
async function loadKPIsAndCharts() {
  try {
    // ASO tem lógica própria (tenta várias rotas)
    const [asos, rawNr17, rawLtcat] = await Promise.all([
      fetchASORecords(),
      apiGet(ENDPOINT_NR17).catch(() => []),
      apiGet(ENDPOINT_LTCAT).catch(() => []),
    ]);

    const nr17  = asList(rawNr17);
    const ltcat = asList(rawLtcat);

    // ---------- KPIs ----------
    const elASO   = document.querySelector("#kpi-total-asos");
    const elNR17  = document.querySelector("#kpi-total-nr17");
    const elLTCAT = document.querySelector("#kpi-total-ltcat");
    const elRisco = document.querySelector("#kpi-risco-medio-nr17");

    if (elASO)   elASO.textContent   = asos.length.toString();
    if (elNR17)  elNR17.textContent  = nr17.length.toString();
    if (elLTCAT) elLTCAT.textContent = ltcat.length.toString();

    let riscoMedio = "—";
    if (nr17.length > 0) {
      const soma = nr17.reduce(
        (acc, item) => acc + (Number(item.score) || 0),
        0
      );
      riscoMedio = (soma / nr17.length).toFixed(1);
    }
    if (elRisco) elRisco.textContent = riscoMedio;

    // ---------- Gráficos painel GERAL ----------
    buildChartDistribuicaoModulos(asos, nr17, ltcat);
    buildChartPerfilRiscoNR17(nr17);
    buildChartAgentesTopLTCAT(ltcat);
    buildUltimasAtividades(asos, nr17, ltcat);

    // ---------- PCMSO / ASO ----------
    buildPCMSOCharts(asos);

    // ---------- LTCAT ----------
    buildLTCACharts(ltcat);

    // ---------- NR-17 (aba específica) ----------
    buildNR17TabCharts(nr17);

    // ---------- PGR / NR-01 ----------
    await loadPGRCharts();
  } catch (err) {
    console.error("Erro ao carregar KPIs / gráficos gerais:", err);
  }
}

// ========================================
// GRÁFICOS – PAINEL GERAL
// ========================================
function buildChartDistribuicaoModulos(asos, nr17, ltcat) {
  const ctx = document.getElementById("chart-distribuicao-modulos");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["PCMSO / ASO", "NR-17", "LTCAT"],
      datasets: [
        {
          label: "Registros",
          data: [asos.length, nr17.length, ltcat.length],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function buildChartPerfilRiscoNR17(nr17) {
  const ctx = document.getElementById("chart-perfil-risco-nr17");
  if (!ctx) return;

  let baixo = 0;
  let medio = 0;
  let alto = 0;

  nr17.forEach((item) => {
    const s = Number(item.score) || 0;
    if (s <= 3) baixo++;
    else if (s <= 6) medio++;
    else alto++;
  });

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Baixo", "Médio", "Alto"],
      datasets: [
        {
          data: [baixo, medio, alto],
        },
      ],
    },
    options: { responsive: true },
  });
}

function buildChartAgentesTopLTCAT(ltcat) {
  const ctx = document.getElementById("chart-agentes-top");
  if (!ctx) return;

  const cont = {};
  ltcat.forEach((reg) => {
    const agente = reg.agente || "Não informado";
    cont[agente] = (cont[agente] || 0) + 1;
  });

  const entries = Object.entries(cont)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const labels = entries.map((e) => e[0]);
  const data = entries.map((e) => e[1]);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ data, label: "Ocorrências" }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function buildUltimasAtividades(asos, nr17, ltcat) {
  const container = document.getElementById("lista-ultimas-atividades");
  if (!container) return;

  const eventos = [];

  asos.forEach((a) => {
    eventos.push({
      tipo: "ASO",
      data: a.data_exame || a.created_at || null,
      desc: `Exame de ${a.nome || "Trabalhador"}`,
    });
  });

  nr17.forEach((n) => {
    eventos.push({
      tipo: "NR-17",
      data: n.data_avaliacao || n.created_at || null,
      desc: `Avaliação de ${n.funcao || "posto"} / ${n.setor || ""}`,
    });
  });

  ltcat.forEach((l) => {
    eventos.push({
      tipo: "LTCAT",
      data: l.data_avaliacao || null,
      desc: `Agente ${l.agente || ""} em ${l.setor || "Setor"}`,
    });
  });

  eventos.sort((a, b) => {
    const da = a.data ? new Date(a.data) : 0;
    const db = b.data ? new Date(b.data) : 0;
    return db - da;
  });

  const ultimos = eventos.slice(0, 7);

  if (!ultimos.length) {
    container.innerHTML = "<p>Sem atividades registradas ainda.</p>";
    return;
  }

  container.innerHTML = "";
  ultimos.forEach((ev) => {
    const d = ev.data ? new Date(ev.data).toLocaleDateString("pt-BR") : "—";
    const p = document.createElement("p");
    p.innerHTML = `<strong>[${ev.tipo}]</strong> ${ev.desc} <span style="color:#6b7280;">(${d})</span>`;
    container.appendChild(p);
  });
}

// ========================================
// GRÁFICOS – PCMSO / ASO
// ========================================
function buildPCMSOCharts(asos) {
  const ctxMensal = document.getElementById("chart-pcmsos-mensal");
  const ctxStatus = document.getElementById("chart-pcmsos-status");
  if (!ctxMensal && !ctxStatus) return;

  const porMes = {};
  const porStatus = {};

  asos.forEach((a) => {
    const data = a.data_exame || a.created_at;
    const status = a.resultado || "Sem informação";

    if (data) {
      const d = new Date(data);
      const chave = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      porMes[chave] = (porMes[chave] || 0) + 1;
    }

    porStatus[status] = (porStatus[status] || 0) + 1;
  });

  if (ctxMensal) {
    const labels = Object.keys(porMes).sort();
    const data = labels.map((k) => porMes[k]);

    new Chart(ctxMensal, {
      type: "line",
      data: {
        labels,
        datasets: [{ data, label: "Exames" }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  }

  if (ctxStatus) {
    const labels = Object.keys(porStatus);
    const data = labels.map((k) => porStatus[k]);

    new Chart(ctxStatus, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{ data }],
      },
      options: { responsive: true },
    });
  }
}

// ========================================
// GRÁFICOS – LTCAT
// ========================================
function buildLTCACharts(ltcat) {
  const ctxSetor = document.getElementById("chart-ltcat-setor");
  const ctxEnq   = document.getElementById("chart-ltcat-enquadramento");
  if (!ctxSetor && !ctxEnq) return;

  const porSetor = {};
  const porEnq   = {};

  ltcat.forEach((l) => {
    const setor = l.setor || "Não informado";
    const enq   = l.enquadramento || "Sem enquadramento";
    porSetor[setor] = (porSetor[setor] || 0) + 1;
    porEnq[enq]     = (porEnq[enq]   || 0) + 1;
  });

  if (ctxSetor) {
    const labels = Object.keys(porSetor);
    const data   = labels.map((k) => porSetor[k]);

    new Chart(ctxSetor, {
      type: "bar",
      data: {
        labels,
        datasets: [{ data, label: "Agentes" }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  }

  if (ctxEnq) {
    const labels = Object.keys(porEnq);
    const data   = labels.map((k) => porEnq[k]);

    new Chart(ctxEnq, {
      type: "pie",
      data: {
        labels,
        datasets: [{ data }],
      },
      options: { responsive: true },
    });
  }
}

// ========================================
// GRÁFICOS – ABA NR-17 ESPECÍFICA
// ========================================
function buildNR17TabCharts(nr17) {
  if (!nr17.length) return;

  // Distribuição por risco (Baixo / Médio / Alto)
  const ctxRisco = document.getElementById("chart-nr17-risco");
  if (ctxRisco) {
    let baixo = 0;
    let medio = 0;
    let alto  = 0;

    nr17.forEach((item) => {
      const s = Number(item.score) || 0;
      if (s <= 3) baixo++;
      else if (s <= 6) medio++;
      else alto++;
    });

    new Chart(ctxRisco, {
      type: "bar",
      data: {
        labels: ["Baixo", "Médio", "Alto"],
        datasets: [
          {
            label: "Avaliações",
            data: [baixo, medio, alto],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  }

  // Scores médios por setor / GHE
  const ctxSetores = document.getElementById("chart-nr17-setores");
  if (ctxSetores) {
    const grupos = {}; // { setor: { soma, qtd } }

    nr17.forEach((item) => {
      const setor = item.setor || "Não informado";
      const s     = Number(item.score) || 0;
      if (!grupos[setor]) {
        grupos[setor] = { soma: 0, qtd: 0 };
      }
      grupos[setor].soma += s;
      grupos[setor].qtd  += 1;
    });

    const labels = Object.keys(grupos);
    const data   = labels.map(
      (setor) => grupos[setor].soma / grupos[setor].qtd
    );

    new Chart(ctxSetores, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Score médio",
            data,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }
}

// ========================================
// PGR / NR-01 – ÁRVORE + GRÁFICOS
// ========================================
async function carregarArvorePGR() {
  const companies = await apiGet("/pgr/companies").catch(() => []);
  const allSectors = [];
  const allHazards = [];
  const allRisks   = [];
  const allActions = [];

  for (const c of companies || []) {
    const sectors = await apiGet(`/pgr/sectors/by-company/${c.id}`).catch(
      () => []
    );
    sectors.forEach((s) => allSectors.push({ ...s, company_id: c.id }));

    for (const s of sectors || []) {
      const hazards = await apiGet(`/pgr/hazards/by-sector/${s.id}`).catch(
        () => []
      );
      hazards.forEach((h) => allHazards.push({ ...h, sector_id: s.id }));

      for (const h of hazards || []) {
        const risks = await apiGet(`/pgr/risks/by-hazard/${h.id}`).catch(
          () => []
        );
        risks.forEach((r) => allRisks.push({ ...r, hazard_id: h.id }));

        for (const r of risks || []) {
          const actions = await apiGet(`/pgr/actions/by-risk/${r.id}`).catch(
            () => []
          );
          actions.forEach((a) =>
            allActions.push({ ...a, risk_id: r.id, hazard_id: h.id })
          );
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
  const texto =
    `${hazard.nome || ""} ${hazard.agente || ""} ${hazard.fonte || ""} ${
      hazard.descricao || ""
    }`.toLowerCase();

  if (
    texto.includes("ruído") ||
    texto.includes("calor") ||
    texto.includes("frio") ||
    texto.includes("vibração") ||
    texto.includes("iluminação") ||
    texto.includes("pressão")
  ) {
    return "Físicos";
  }
  if (
    texto.includes("poeira") ||
    texto.includes("solvente") ||
    texto.includes("ácido") ||
    texto.includes("fum") ||
    texto.includes("gás") ||
    texto.includes("vap")
  ) {
    return "Químicos";
  }
  if (
    texto.includes("vírus") ||
    texto.includes("bactéria") ||
    texto.includes("fungo") ||
    texto.includes("biológico")
  ) {
    return "Biológicos";
  }
  if (
    texto.includes("postura") ||
    texto.includes("ergonôm") ||
    texto.includes("repetitiv") ||
    texto.includes("peso") ||
    texto.includes("carga")
  ) {
    return "Ergonômicos";
  }
  if (
    texto.includes("máquina") ||
    texto.includes("equipamento") ||
    texto.includes("queda") ||
    texto.includes("atrito") ||
    texto.includes("impacto")
  ) {
    return "Mecânicos";
  }
  return "Outros";
}

function montarChartPGRCategorias(hazards) {
  const ctx = document.getElementById("chart-pgr-categorias");
  if (!ctx) return;

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

  const labels = Object.keys(cont);
  const data   = labels.map((k) => cont[k]);

  new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Perigos",
          data,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
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
  if (!ctx) return;

  const cont = { Pendente: 0, "Em andamento": 0, Concluído: 0 };

  (actions || []).forEach((a) => {
    const s = (a.status || "").toLowerCase();
    if (s.includes("andamento")) cont["Em andamento"]++;
    else if (s.includes("concl")) cont["Concluído"]++;
    else cont["Pendente"]++;
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Pendente", "Em andamento", "Concluído"],
      datasets: [
        {
          label: "Ações",
          data: [
            cont["Pendente"],
            cont["Em andamento"],
            cont["Concluído"],
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

async function loadPGRCharts() {
  try {
    const pgr = await carregarArvorePGR();
    montarChartPGRCategorias(pgr.hazards);
    montarChartPGRAcoes(pgr.actions);
  } catch (err) {
    console.error("Erro ao carregar dados do PGR:", err);
  }
}

// ========================================
// START
// ========================================
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  await loadKPIsAndCharts();
});
