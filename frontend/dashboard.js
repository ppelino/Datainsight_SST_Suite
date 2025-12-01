// ===============================
// Configuração API
// ===============================
const API_BASE = "https://datainsight-sst-suite.onrender.com/api";
const USE_FAKE_DATA = false;

// Helper para enviar o token de autenticação em todas as requisições
function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("authToken");
  const base = { ...extra };
  if (token) {
    base["Authorization"] = `Bearer ${token}`;
  }
  return base;
}

// Se der 401, derruba para o login
function checkUnauthorized(status) {
  if (status === 401) {
    alert("Sessão expirada ou não autorizada. Faça login novamente.");
    localStorage.removeItem("authToken");
    window.location.href = "index.html";
    return true;
  }
  return false;
}

// Charts (guardamos para poder atualizar depois se quiser filtros)
let chartDistribuicaoModulos;
let chartPerfilRiscoGeral;
let chartAgentesTop;

// NR-17
let chartNr17Risco;
let chartNr17Setores;

// PCMSO
let chartPcmsosMensal;
let chartPcmsosStatus;

// PGR
let chartPgrCategorias;
let chartPgrAcoes;

// LTCAT
let chartLtcatSetor;
let chartLtcatEnquadramento;

// ===============================
// Controle das tabs
// ===============================
function setActiveTab(tab) {
  const buttons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tab-panel");

  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  panels.forEach((p) => {
    p.classList.toggle("active", p.id === `tab-${tab}`);
  });
}

function setActiveTabFromHash() {
  const hash = window.location.hash.replace("#", "");
  const validTabs = ["geral", "nr17", "pcmsos", "pgr", "ltcat"];
  const tab = validTabs.includes(hash) ? hash : "geral";
  setActiveTab(tab);
}

function initTabs() {
  const buttons = document.querySelectorAll(".tab-button");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      history.replaceState(null, "", `#${tab}`);
      setActiveTab(tab);
    });
  });

  setActiveTabFromHash();
}

window.addEventListener("hashchange", setActiveTabFromHash);

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  initTabs();

  // Geral sempre
  carregarDashboardGeral();

  // PCMSO / ASO
  carregarDashboardPCMSO();
});

// ===============================
// Funções de carregamento — Geral
// ===============================
async function carregarDashboardGeral() {
  try {
    const data = await fetchDashboardGeral();

    // KPIs
    document.getElementById("kpi-total-asos").textContent =
      data.total_asos ?? 0;
    document.getElementById("kpi-total-nr17").textContent =
      data.total_nr17 ?? 0;
    document.getElementById("kpi-total-ltcat").textContent =
      data.total_ltcat ?? 0;
    document.getElementById("kpi-risco-medio-nr17").textContent =
      data.risco_medio_nr17 != null
        ? data.risco_medio_nr17.toFixed(1)
        : "—";

    // Gráfico: distribuição por módulo
    const dist = data.distribuicao_modulos || { aso: 0, nr17: 0, ltcat: 0 };
    const ctxDist = document.getElementById("chart-distribuicao-modulos");
    if (ctxDist) {
      if (chartDistribuicaoModulos) chartDistribuicaoModulos.destroy();
      chartDistribuicaoModulos = new Chart(ctxDist, {
        type: "bar",
        data: {
          labels: ["ASO", "NR-17", "LTCAT"],
          datasets: [
            {
              label: "Quantidade de registros",
              data: [dist.aso || 0, dist.nr17 || 0, dist.ltcat || 0],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, precision: 0 },
          },
        },
      });
    }

    // Gráfico: perfil de risco NR-17
    const perfil = data.perfil_risco_nr17 || { baixo: 0, medio: 0, alto: 0 };
    const ctxPerfil = document.getElementById("chart-perfil-risco-nr17");
    if (ctxPerfil) {
      if (chartPerfilRiscoGeral) chartPerfilRiscoGeral.destroy();
      chartPerfilRiscoGeral = new Chart(ctxPerfil, {
        type: "doughnut",
        data: {
          labels: ["Baixo", "Médio", "Alto"],
          datasets: [
            {
              data: [perfil.baixo || 0, perfil.medio || 0, perfil.alto || 0],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "top" } },
          cutout: "60%",
        },
      });
    }

    // Gráfico: agentes nocivos top 5
    const agentes = data.agentes_top5 || [];
    const ctxAgentes = document.getElementById("chart-agentes-top");
    if (ctxAgentes) {
      if (chartAgentesTop) chartAgentesTop.destroy();
      chartAgentesTop = new Chart(ctxAgentes, {
        type: "bar",
        data: {
          labels: agentes.map((a) => a.nome),
          datasets: [
            {
              label: "Ocorrências",
              data: agentes.map((a) => a.ocorrencias),
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, precision: 0 } },
        },
      });
    }

    // Últimas atividades
    const lista = document.getElementById("lista-ultimas-atividades");
    if (lista) {
      lista.innerHTML = "";
      const atividades = data.ultimas_atividades || [];
      if (!atividades.length) {
        lista.innerHTML = "<p>Nenhuma atividade recente.</p>";
      } else {
        atividades.forEach((item) => {
          const div = document.createElement("div");
          div.className = "activity-item";
          div.innerHTML = `
            <div class="activity-header">
              <strong>${item.modulo || "Módulo"}</strong>
              <span class="activity-date">${item.data || ""}</span>
            </div>
            <div class="activity-body">
              ${item.descricao || ""}
            </div>
          `;
          lista.appendChild(div);
        });
      }
    }
  } catch (err) {
    console.error("Erro ao carregar dashboard geral:", err);
  }
}

async function fetchDashboardGeral() {
  if (USE_FAKE_DATA) {
    return {
      total_asos: 12,
      total_nr17: 8,
      total_ltcat: 5,
      risco_medio_nr17: 8.0,
      distribuicao_modulos: { aso: 12, nr17: 8, ltcat: 5 },
      perfil_risco_nr17: { baixo: 4, medio: 3, alto: 1 },
      agentes_top5: [
        { nome: "Ruído", ocorrencias: 10 },
        { nome: "Calor", ocorrencias: 7 },
        { nome: "Agente químico X", ocorrencias: 5 },
        { nome: "Vibração", ocorrencias: 4 },
        { nome: "Iluminação", ocorrencias: 3 },
      ],
      ultimas_atividades: [],
    };
  }

  const res = await fetch(`${API_BASE}/dashboard/geral`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (checkUnauthorized(res.status)) return;
    throw new Error(`Erro ao buscar /dashboard/geral: ${res.status}`);
  }

  return res.json();
}

// ===============================
// PCMSO / ASO
// ===============================
async function carregarDashboardPCMSO() {
  try {
    const data = await fetchDashboardPCMSO();
    console.log("PCMSO dashboard data:", data);

    const mensal = data.exames_por_mes || [];
    const ctxMensal = document.getElementById("chart-pcmsos-mensal");
    if (ctxMensal) {
      if (chartPcmsosMensal) chartPcmsosMensal.destroy();
      chartPcmsosMensal = new Chart(ctxMensal, {
        type: "line",
        data: {
          labels: mensal.map((m) => m.mes),
          datasets: [
            {
              label: "Quantidade de ASOs",
              data: mensal.map((m) => m.total),
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    const status = data.status_asos || {
      validos: 0,
      vencidos: 0,
      a_vencer: 0,
    };
    const ctxStatus = document.getElementById("chart-pcmsos-status");
    if (ctxStatus) {
      if (chartPcmsosStatus) chartPcmsosStatus.destroy();
      chartPcmsosStatus = new Chart(ctxStatus, {
        type: "bar",
        data: {
          labels: ["Válidos", "Vencidos", "A vencer (30d)"],
          datasets: [
            {
              label: "Quantidade",
              data: [
                status.validos || 0,
                status.vencidos || 0,
                status.a_vencer || 0,
              ],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      });
    }
  } catch (err) {
    console.error("Erro ao carregar dashboard PCMSO:", err);
  }
}

async function fetchDashboardPCMSO() {
  if (USE_FAKE_DATA) {
    return {
      exames_por_mes: [
        { mes: "01/2025", total: 5 },
        { mes: "02/2025", total: 8 },
        { mes: "03/2025", total: 4 },
        { mes: "04/2025", total: 10 },
      ],
      status_asos: { validos: 18, vencidos: 2, a_vencer: 3 },
    };
  }

  const res = await fetch(`${API_BASE}/aso/dashboard/pcmsos`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    if (checkUnauthorized(res.status)) return;
    throw new Error(`Erro ao buscar /dashboard/pcmsos: ${res.status}`);
  }

  return res.json();
}
