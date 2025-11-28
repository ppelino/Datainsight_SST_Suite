// ===============================
// Configuração API
// ===============================
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// Se ainda não existir endpoint de dashboard na API,
// deixe USE_FAKE_DATA = true para ver tudo funcionando visualmente.
const USE_FAKE_DATA = true;

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
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  carregarDashboardGeral();
  carregarDashboardNR17();
  carregarDashboardPCMSO();
  carregarDashboardPGR();
  carregarDashboardLTCAT();
});

// ===============================
// Tabs
// ===============================
function initTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const panels = document.querySelectorAll(".tab-panel");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      panels.forEach(p => {
        if (p.id === `tab-${tab}`) {
          p.classList.add("active");
        } else {
          p.classList.remove("active");
        }
      });
    });
  });
}

// ===============================
// Funções de carregamento — Geral
// ===============================
async function carregarDashboardGeral() {
  try {
    const data = await fetchDashboardGeral();

    // KPIs
    document.getElementById("kpi-total-asos").textContent = data.total_asos ?? 0;
    document.getElementById("kpi-total-nr17").textContent = data.total_nr17 ?? 0;
    document.getElementById("kpi-total-ltcat").textContent = data.total_ltcat ?? 0;
    document.getElementById("kpi-risco-medio-nr17").textContent =
      data.risco_medio_nr17 != null ? data.risco_medio_nr17.toFixed(1) : "—";

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
              data: [dist.aso || 0, dist.nr17 || 0, dist.ltcat || 0]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, precision: 0 }
          }
        }
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
              data: [perfil.baixo || 0, perfil.medio || 0, perfil.alto || 0]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "top"
            }
          },
          cutout: "60%"
        }
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
          labels: agentes.map(a => a.nome),
          datasets: [
            {
              label: "Ocorrências",
              data: agentes.map(a => a.ocorrencias)
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, precision: 0 }
          }
        }
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
        atividades.forEach(item => {
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
    // DADOS FAKE — SÓ PARA VOCÊ VER O VISUAL
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
        { nome: "Iluminação", ocorrencias: 3 }
      ],
      ultimas_atividades: [
        {
          modulo: "NR-17",
          data: "2025-11-27",
          descricao: "Avaliação de posto de trabalho — caldeiraria / soldador. Risco Médio (score 8)."
        },
        {
          modulo: "LTCAT",
          data: "2025-11-26",
          descricao: "Inclusão de agente: ruído — Enq. Especial 20 anos."
        },
        {
          modulo: "PCMSO / ASO",
          data: "2025-11-25",
          descricao: "ASO periódico registrado — colaborador João da Silva."
        }
      ]
    };
  }

  const res = await fetch(`${API_BASE}/api/dashboard/geral`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (checkUnauthorized(res.status)) return;
    throw new Error(`Erro ao buscar /api/dashboard/geral: ${res.status}`);
  }

  return res.json();
}

// ===============================
// NR-17
// ===============================
async function carregarDashboardNR17() {
  try {
    const data = await fetchDashboardNR17();

    const perfil = data.perfil_risco_nr17 || { baixo: 0, medio: 0, alto: 0 };
    const ctxRisco = document.getElementById("chart-nr17-risco");
    if (ctxRisco) {
      if (chartNr17Risco) chartNr17Risco.destroy();
      chartNr17Risco = new Chart(ctxRisco, {
        type: "doughnut",
        data: {
          labels: ["Baixo", "Médio", "Alto"],
          datasets: [
            {
              data: [perfil.baixo || 0, perfil.medio || 0, perfil.alto || 0]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "top" } },
          cutout: "60%"
        }
      });
    }

    const setores = data.scores_por_setor || [];
    const ctxSetores = document.getElementById("chart-nr17-setores");
    if (ctxSetores) {
      if (chartNr17Setores) chartNr17Setores.destroy();
      chartNr17Setores = new Chart(ctxSetores, {
        type: "bar",
        data: {
          labels: setores.map(s => s.nome),
          datasets: [
            {
              label: "Score médio",
              data: setores.map(s => s.score_medio)
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, max: 10 }
          }
        }
      });
    }
  } catch (err) {
    console.error("Erro ao carregar dashboard NR-17:", err);
  }
}

async function fetchDashboardNR17() {
  if (USE_FAKE_DATA) {
    return {
      perfil_risco_nr17: { baixo: 4, medio: 3, alto: 1 },
      scores_por_setor: [
        { nome: "Caldeiraria", score_medio: 8.5 },
        { nome: "Solda", score_medio: 7.8 },
        { nome: "Escritório", score_medio: 3.2 }
      ]
    };
  }

  const res = await fetch(`${API_BASE}/api/dashboard/nr17`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (checkUnauthorized(res.status)) return;
    throw new Error(`Erro ao buscar /api/dashboard/nr17: ${res.status}`);
  }

  return res.json();
}

// ===============================
// PCMSO / ASO
// ===============================
async function carregarDashboardPCMSO() {
  try {
    const data = await fetchDashboardPCMSO();

    const mensal = data.exames_por_mes || [];
    const ctxMensal = document.getElementById("chart-pcmsos-mensal");
    if (ctxMensal) {
      if (chartPcmsosMensal) chartPcmsosMensal.destroy();
      chartPcmsosMensal = new Chart(ctxMensal, {
        type: "line",
        data: {
          labels: mensal.map(m => m.mes),
          datasets: [
            {
              label: "Quantidade de ASOs",
              data: mensal.map(m => m.total),
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    const status = data.status_asos || { validos: 0, vencidos: 0, a_vencer: 0 };
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
                status.a_vencer || 0
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
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
        { mes: "Jan", total: 5 },
        { mes: "Fev", total: 8 },
        { mes: "Mar", total: 4 },
        { mes: "Abr", total: 10 }
      ],
      status_asos: { validos: 18, vencidos: 2, a_vencer: 3 }
    };
  }

  const res = await fetch(`${API_BASE}/api/dashboard/pcmsos`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (checkUnauthorized(res.status)) return;
    throw new Error(`Erro ao buscar /api/dashboard/pcmsos: ${res.status}`);
  }

  return res.json();
}

// ===============================
// PGR / NR-01
// ===============================
async function carregarDashboardPGR() {
  try {
    const data = await fetchDashboardPGR();

    const categorias = data.perigos_por_categoria || [];
    const ctxCategorias = document.getElementById("chart-pgr-categorias");
    if (ctxCategorias) {
      if (chartPgrCategorias) chartPgrCategorias.destroy();
      chartPgrCategorias = new Chart(ctxCategorias, {
        type: "bar",
        data: {
          labels: categorias.map(c => c.categoria),
          datasets: [
            {
              label: "Perigos",
              data: categorias.map(c => c.total)
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    const acoes = data.status_acoes || {
      planejadas: 0,
      em_andamento: 0,
      concluidas: 0
    };
    const ctxAcoes = document.getElementById("chart-pgr-acoes");
    if (ctxAcoes) {
      if (chartPgrAcoes) chartPgrAcoes.destroy();
      chartPgrAcoes = new Chart(ctxAcoes, {
        type: "bar",
        data: {
          labels: ["Planejadas", "Em andamento", "Concluídas"],
          datasets: [
            {
              label: "Ações",
              data: [
                acoes.planejadas || 0,
                acoes.em_andamento || 0,
                acoes.concluidas || 0
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  } catch (err) {
    console.error("Erro ao carregar dashboard PGR:", err);
  }
}

async function fetchDashboardPGR() {
  if (USE_FAKE_DATA) {
    return {
      perigos_por_categoria: [
        { categoria: "Físicos", total: 6 },
        { categoria: "Químicos", total: 4 },
        { categoria: "Biológicos", total: 2 },
        { categoria: "Ergonômicos", total: 5 },
        { categoria: "Mecânicos", total: 3 }
      ],
      status_acoes: { planejadas: 4, em_andamento: 3, concluidas: 6 }
    };
  }

  const res = await fetch(`${API_BASE}/api/dashboard/pgr`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (checkUnauthorized(res.status)) return;
    throw new Error(`Erro ao buscar /api/dashboard/pgr: ${res.status}`);
  }

  return res.json();
}

// ===============================
// LTCAT
// ===============================
async function carregarDashboardLTCAT() {
  try {
    const data = await fetchDashboardLTCAT();

    const setores = data.agentes_por_setor || [];
    const ctxSetor = document.getElementById("chart-ltcat-setor");
    if (ctxSetor) {
      if (chartLtcatSetor) chartLtcatSetor.destroy();
      chartLtcatSetor = new Chart(ctxSetor, {
        type: "bar",
        data: {
          labels: setores.map(s => s.setor),
          datasets: [
            {
              label: "Agentes",
              data: setores.map(s => s.total)
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    const enquadramento = data.enquadramento_por_codigo || [];
    const ctxEnq = document.getElementById("chart-ltcat-enquadramento");
    if (ctxEnq) {
      if (chartLtcatEnquadramento) chartLtcatEnquadramento.destroy();
      chartLtcatEnquadramento = new Chart(ctxEnq, {
        type: "bar",
        data: {
          labels: enquadramento.map(e => e.codigo),
          datasets: [
            {
              label: "Registros",
              data: enquadramento.map(e => e.total)
            }
          ]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  } catch (err) {
    console.error("Erro ao carregar dashboard LTCAT:", err);
  }
}

async function fetchDashboardLTCAT() {
  if (USE_FAKE_DATA) {
    return {
      agentes_por_setor: [
        { setor: "Caldeiraria", total: 5 },
        { setor: "Solda", total: 4 },
        { setor: "Escritório", total: 1 }
      ],
      enquadramento_por_codigo: [
        { codigo: "20 anos", total: 4 },
        { codigo: "25 anos", total: 3 },
        { codigo: "Não enquadra", total: 5 }
      ]
    };
  }

  const res = await fetch(`${API_BASE}/api/dashboard/ltcat`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (checkUnauthorized(res.status)) return;
    throw new Error(`Erro ao buscar /api/dashboard/ltcat: ${res.status}`);
  }

  return res.json();
}
