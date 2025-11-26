// URL base da API no Render
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// ------------------------
// Helpers para chamadas API
// ------------------------
async function handleResponse(res, method, path) {
  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch (e) {
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
  const res = await fetch(`${API_BASE}${path}`);
  return handleResponse(res, "GET", path);
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse(res, "POST", path);
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse(res, "PUT", path);
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
  });
  return handleResponse(res, "DELETE", path);
}

// ------------------------
// Estado atual (seleções)
// ------------------------
let selectedCompanyId = null;
let selectedSectorId = null;
let selectedHazardId = null;
let selectedRiskId = null;

// ------------------------
// Utilidades de UI
// ------------------------
function showError(err, contextMsg) {
  console.error(contextMsg, err);
  alert(`${contextMsg}\n\n${err.message}`);
}

function clearSelectionsBelow(level) {
  // level: "company" | "sector" | "hazard" | "risk"
  if (level === "company") {
    selectedSectorId = null;
    selectedHazardId = null;
    selectedRiskId = null;
    document.querySelector("#current-sector-label").textContent =
      "Nenhum setor selecionado.";
    document.querySelector("#current-hazard-label").textContent =
      "Nenhum perigo selecionado.";
    document.querySelector("#current-risk-label").textContent =
      "Nenhum risco selecionado.";
    renderSectors([]);
    renderHazards([]);
    renderRisks([]);
    renderActions([]);
  } else if (level === "sector") {
    selectedHazardId = null;
    selectedRiskId = null;
    document.querySelector("#current-hazard-label").textContent =
      "Nenhum perigo selecionado.";
    document.querySelector("#current-risk-label").textContent =
      "Nenhum risco selecionado.";
    renderHazards([]);
    renderRisks([]);
    renderActions([]);
  } else if (level === "hazard") {
    selectedRiskId = null;
    document.querySelector("#current-risk-label").textContent =
      "Nenhum risco selecionado.";
    renderRisks([]);
    renderActions([]);
  } else if (level === "risk") {
    renderActions([]);
  }
}

// ------------------------
// EMPRESAS
// ------------------------
async function loadCompanies() {
  try {
    const companies = await apiGet("/pgr/companies");
    renderCompanies(companies);
  } catch (err) {
    showError(err, "Erro ao carregar empresas.");
  }
}

function renderCompanies(companies) {
  const tbody = document.querySelector("#companies-table tbody");
  tbody.innerHTML = "";

  companies.forEach((c) => {
    const tr = document.createElement("tr");
    tr.dataset.id = c.id;

    if (selectedCompanyId === c.id) {
      tr.classList.add("row-selected");
    }

    tr.innerHTML = `
      <td>${c.id}</td>
      <td>${c.name}</td>
      <td>${c.cnpj || "-"}</td>
      <td>${c.grau_risco ?? ""}</td>
      <td class="actions-cell">
        <button class="icon-btn view" title="Selecionar empresa">🔍</button>
        <button class="icon-btn edit" title="Editar empresa">✏️</button>
        <button class="icon-btn delete" title="Excluir empresa">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function selectCompany(id) {
  try {
    const company = await apiGet(`/pgr/companies/${id}`);
    selectedCompanyId = company.id;

    document.querySelector("#company-name").value = company.name || "";
    document.querySelector("#company-cnpj").value = company.cnpj || "";
    document.querySelector("#company-address").value = company.endereco || "";
    document.querySelector("#company-activity").value =
      company.atividade || "";
    document.querySelector("#company-risk").value =
      company.grau_risco != null ? company.grau_risco : "";

    document.querySelector(
      "#current-company-label"
    ).textContent = `Empresa selecionada: ${company.name} (ID ${company.id})`;

    const btnSave = document.querySelector("#btn-save-company");
    btnSave.textContent = "Atualizar empresa";

    clearSelectionsBelow("company");
    await loadSectorsForCompany(id);
    await loadCompanies();
  } catch (err) {
    showError(err, "Erro ao selecionar empresa.");
  }
}

function clearCompanyForm() {
  selectedCompanyId = null;
  document.querySelector("#company-name").value = "";
  document.querySelector("#company-cnpj").value = "";
  document.querySelector("#company-address").value = "";
  document.querySelector("#company-activity").value = "";
  document.querySelector("#company-risk").value = "";
  document.querySelector("#current-company-label").textContent =
    "Nenhuma empresa selecionada.";
  const btnSave = document.querySelector("#btn-save-company");
  btnSave.textContent = "Salvar empresa";
  clearSelectionsBelow("company");
}

async function handleSaveCompany(ev) {
  ev.preventDefault();

  const payload = {
    name: document.querySelector("#company-name").value.trim(),
    cnpj: document.querySelector("#company-cnpj").value.trim(),
    endereco: document.querySelector("#company-address").value.trim(),
    atividade: document.querySelector("#company-activity").value.trim(),
    grau_risco: document.querySelector("#company-risk").value
      ? Number(document.querySelector("#company-risk").value)
      : null,
  };

  try {
    if (!payload.name) {
      alert("Informe o nome da empresa.");
      return;
    }

    if (!selectedCompanyId) {
      await apiPost("/pgr/companies", payload);
    } else {
      await apiPut(`/pgr/companies/${selectedCompanyId}`, payload);
    }

    clearCompanyForm();
    await loadCompanies();
  } catch (err) {
    showError(err, "Erro ao salvar empresa.");
  }
}

// ------------------------
// SETORES
// ------------------------
async function loadSectorsForCompany(companyId) {
  if (!companyId) {
    renderSectors([]);
    return;
  }
  try {
    const sectors = await apiGet(`/pgr/sectors/by-company/${companyId}`);
    renderSectors(sectors);
  } catch (err) {
    showError(err, "Erro ao carregar setores.");
  }
}

function renderSectors(sectors) {
  const tbody = document.querySelector("#sectors-table tbody");
  tbody.innerHTML = "";

  sectors.forEach((s) => {
    const tr = document.createElement("tr");
    tr.dataset.id = s.id;
    if (selectedSectorId === s.id) {
      tr.classList.add("row-selected");
    }
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${s.nome}</td>
      <td>${s.descricao || "-"}</td>
      <td class="actions-cell">
        <button class="icon-btn view" title="Selecionar setor">🔍</button>
        <button class="icon-btn edit" title="Editar setor">✏️</button>
        <button class="icon-btn delete" title="Excluir setor">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function selectSector(id) {
  try {
    const sector = await apiGet(`/pgr/sectors/${id}`);
    selectedSectorId = sector.id;

    document.querySelector("#sector-name").value = sector.nome || "";
    document.querySelector("#sector-description").value =
      sector.descricao || "";

    document.querySelector(
      "#current-sector-label"
    ).textContent = `Setor selecionado: ${sector.nome} (ID ${sector.id})`;

    const btn = document.querySelector("#btn-save-sector");
    btn.textContent = "Atualizar setor";

    clearSelectionsBelow("sector");
    await loadHazardsForSector(id);
    await loadSectorsForCompany(selectedCompanyId);
  } catch (err) {
    showError(err, "Erro ao selecionar setor.");
  }
}

function clearSectorForm() {
  selectedSectorId = null;
  document.querySelector("#sector-name").value = "";
  document.querySelector("#sector-description").value = "";
  document.querySelector("#current-sector-label").textContent =
    "Nenhum setor selecionado.";
  const btn = document.querySelector("#btn-save-sector");
  btn.textContent = "Salvar setor";
  clearSelectionsBelow("sector");
}

async function handleSaveSector(ev) {
  ev.preventDefault();

  if (!selectedCompanyId) {
    alert("Selecione primeiro uma empresa (clicando na lupa).");
    return;
  }

  const payload = {
    company_id: selectedCompanyId,
    nome: document.querySelector("#sector-name").value.trim(),
    descricao: document
      .querySelector("#sector-description")
      .value.trim(),
  };

  if (!payload.nome) {
    alert("Informe o nome do setor.");
    return;
  }

  try {
    if (!selectedSectorId) {
      await apiPost("/pgr/sectors", payload);
    } else {
      await apiPut(`/pgr/sectors/${selectedSectorId}`, payload);
    }
    clearSectorForm();
    await loadSectorsForCompany(selectedCompanyId);
  } catch (err) {
    showError(err, "Erro ao salvar setor.");
  }
}

// ------------------------
// PERIGOS
// ------------------------
async function loadHazardsForSector(sectorId) {
  if (!sectorId) {
    renderHazards([]);
    return;
  }
  try {
    const hazards = await apiGet(`/pgr/hazards/by-sector/${sectorId}`);
    renderHazards(hazards);
  } catch (err) {
    showError(err, "Erro ao carregar perigos.");
  }
}

function renderHazards(hazards) {
  const tbody = document.querySelector("#hazards-table tbody");
  tbody.innerHTML = "";

  hazards.forEach((h) => {
    const tr = document.createElement("tr");
    tr.dataset.id = h.id;

    if (selectedHazardId === h.id) {
      tr.classList.add("row-selected");
    }

    tr.innerHTML = `
      <td>${h.id}</td>
      <td>${h.nome}</td>
      <td>${h.agente || "-"}</td>
      <td>${h.fonte || "-"}</td>
      <td class="actions-cell">
        <button class="icon-btn view" title="Selecionar perigo">🔍</button>
        <button class="icon-btn edit" title="Editar perigo">✏️</button>
        <button class="icon-btn delete" title="Excluir perigo">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function selectHazard(id) {
  try {
    const hazard = await apiGet(`/pgr/hazards/${id}`);
    selectedHazardId = hazard.id;

    document.querySelector("#hazard-name").value = hazard.nome || "";
    document.querySelector("#hazard-agent").value =
      hazard.agente || "";
    document.querySelector("#hazard-source").value =
      hazard.fonte || "";
    document.querySelector("#hazard-description").value =
      hazard.descricao || "";

    document.querySelector(
      "#current-hazard-label"
    ).textContent = `Perigo selecionado: ${hazard.nome} (ID ${hazard.id})`;

    const btn = document.querySelector("#btn-save-hazard");
    btn.textContent = "Atualizar perigo";

    clearSelectionsBelow("hazard");
    await loadRisksForHazard(id);
    await loadHazardsForSector(selectedSectorId);
  } catch (err) {
    showError(err, "Erro ao selecionar perigo.");
  }
}

function clearHazardForm() {
  selectedHazardId = null;
  document.querySelector("#hazard-name").value = "";
  document.querySelector("#hazard-agent").value = "";
  document.querySelector("#hazard-source").value = "";
  document.querySelector("#hazard-description").value = "";
  document.querySelector("#current-hazard-label").textContent =
    "Nenhum perigo selecionado.";
  const btn = document.querySelector("#btn-save-hazard");
  btn.textContent = "Salvar perigo";
  clearSelectionsBelow("hazard");
}

async function handleSaveHazard(ev) {
  ev.preventDefault();

  if (!selectedSectorId) {
    alert("Selecione primeiro um setor (clicando na lupa).");
    return;
  }

  const payload = {
    sector_id: selectedSectorId,
    nome: document.querySelector("#hazard-name").value.trim(),
    agente: document.querySelector("#hazard-agent").value.trim(),
    fonte: document.querySelector("#hazard-source").value.trim(),
    descricao: document
      .querySelector("#hazard-description")
      .value.trim(),
  };

  if (!payload.nome) {
    alert("Informe o nome do perigo.");
    return;
  }

  try {
    if (!selectedHazardId) {
      await apiPost("/pgr/hazards", payload);
    } else {
      await apiPut(`/pgr/hazards/${selectedHazardId}`, payload);
    }
    clearHazardForm();
    await loadHazardsForSector(selectedSectorId);
  } catch (err) {
    showError(err, "Erro ao salvar perigo.");
  }
}

// ------------------------
// RISCOS
// ------------------------
async function loadRisksForHazard(hazardId) {
  if (!hazardId) {
    renderRisks([]);
    return;
  }
  try {
    const risks = await apiGet(`/pgr/risks/by-hazard/${hazardId}`);
    renderRisks(risks);
  } catch (err) {
    showError(err, "Erro ao carregar riscos.");
  }
}

function calcRiskLevel(prob, sev) {
  if (!prob || !sev) return "";
  const score = prob * sev;
  if (score <= 4) return "Baixo";
  if (score <= 9) return "Médio";
  if (score <= 16) return "Alto";
  return "Crítico";
}

function renderRisks(risks) {
  const tbody = document.querySelector("#risks-table tbody");
  tbody.innerHTML = "";

  risks.forEach((r) => {
    const tr = document.createElement("tr");
    tr.dataset.id = r.id;

    if (selectedRiskId === r.id) {
      tr.classList.add("row-selected");
    }

    const level = calcRiskLevel(r.probabilidade, r.severidade);

    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${level}</td>
      <td>${r.probabilidade ?? ""}</td>
      <td>${r.severidade ?? ""}</td>
      <td>${r.medidas_existentes || "-"}</td>
      <td class="actions-cell">
        <button class="icon-btn view" title="Selecionar risco">🔍</button>
        <button class="icon-btn edit" title="Editar risco">✏️</button>
        <button class="icon-btn delete" title="Excluir risco">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function selectRisk(id) {
  try {
    const risk = await apiGet(`/pgr/risks/${id}`);
    selectedRiskId = risk.id;

    document.querySelector("#risk-probability").value =
      risk.probabilidade ?? "";
    document.querySelector("#risk-severity").value =
      risk.severidade ?? "";
    document.querySelector("#risk-measures").value =
      risk.medidas_existentes || "";

    document.querySelector(
      "#current-risk-label"
    ).textContent = `Risco selecionado (ID ${risk.id})`;

    const btn = document.querySelector("#btn-save-risk");
    btn.textContent = "Atualizar risco";

    clearSelectionsBelow("risk");
    await loadActionsForRisk(id);
    await loadRisksForHazard(selectedHazardId);
  } catch (err) {
    showError(err, "Erro ao selecionar risco.");
  }
}

function clearRiskForm() {
  selectedRiskId = null;
  document.querySelector("#risk-probability").value = "";
  document.querySelector("#risk-severity").value = "";
  document.querySelector("#risk-measures").value = "";
  document.querySelector("#current-risk-label").textContent =
    "Nenhum risco selecionado.";
  const btn = document.querySelector("#btn-save-risk");
  btn.textContent = "Salvar risco";
  clearSelectionsBelow("risk");
}

async function handleSaveRisk(ev) {
  ev.preventDefault();

  if (!selectedHazardId) {
    alert("Selecione primeiro um perigo (clicando na lupa).");
    return;
  }

  const prob = document.querySelector("#risk-probability").value;
  const sev = document.querySelector("#risk-severity").value;

  const payload = {
    hazard_id: selectedHazardId,
    probabilidade: prob ? Number(prob) : null,
    severidade: sev ? Number(sev) : null,
    medidas_existentes: document
      .querySelector("#risk-measures")
      .value.trim(),
  };

  try {
    if (!selectedRiskId) {
      await apiPost("/pgr/risks", payload);
    } else {
      await apiPut(`/pgr/risks/${selectedRiskId}`, payload);
    }
    clearRiskForm();
    await loadRisksForHazard(selectedHazardId);
  } catch (err) {
    showError(err, "Erro ao salvar risco.");
  }
}

// ------------------------
// AÇÕES DE CONTROLE
// ------------------------
async function loadActionsForRisk(riskId) {
  if (!riskId) {
    renderActions([]);
    return;
  }
  try {
    const actions = await apiGet(`/pgr/actions/by-risk/${riskId}`);
    renderActions(actions);
  } catch (err) {
    showError(err, "Erro ao carregar ações.");
  }
}

function renderActions(actions) {
  const tbody = document.querySelector("#actions-table tbody");
  tbody.innerHTML = "";

  actions.forEach((a) => {
    const tr = document.createElement("tr");
    tr.dataset.id = a.id;
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.recomendacao || "-"}</td>
      <td>${a.tipo || "-"}</td>
      <td>${a.prazo || "-"}</td>
      <td>${a.status || "-"}</td>
      <td class="actions-cell">
        <button class="icon-btn edit" title="Editar ação">✏️</button>
        <button class="icon-btn delete" title="Excluir ação">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function clearActionForm() {
  document.querySelector("#action-recommendation").value = "";
  document.querySelector("#action-type").value = "";
  document.querySelector("#action-deadline").value = "";
  document.querySelector("#action-responsible").value = "";
  document.querySelector("#action-status").value = "Pendente";
}

async function handleSaveAction(ev) {
  ev.preventDefault();

  if (!selectedRiskId) {
    alert("Selecione primeiro um risco (clicando na lupa).");
    return;
  }

  const payload = {
    risk_id: selectedRiskId,
    recomendacao: document
      .querySelector("#action-recommendation")
      .value.trim(),
    tipo: document.querySelector("#action-type").value.trim(),
    prazo: document.querySelector("#action-deadline").value || null,
    responsavel: document
      .querySelector("#action-responsible")
      .value.trim(),
    status: document.querySelector("#action-status").value,
  };

  if (!payload.recomendacao) {
    alert("Informe a recomendação da ação.");
    return;
  }

  try {
    // no router que você tem, Actions provavelmente só tem POST/DELETE,
    // então aqui vamos sempre criar nova ação
    await apiPost("/pgr/actions", payload);
    clearActionForm();
    await loadActionsForRisk(selectedRiskId);
  } catch (err) {
    showError(err, "Erro ao salvar ação.");
  }
}

// ------------------------
// LIGAR EVENTOS NAS TABELAS
// ------------------------
function attachTableHandlers() {
  // Empresas
  const companiesTable = document.querySelector("#companies-table");
  companiesTable.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = Number(tr.dataset.id);

    if (btn.classList.contains("view") || btn.classList.contains("edit")) {
      await selectCompany(id);
    } else if (btn.classList.contains("delete")) {
      if (confirm("Excluir empresa e tudo que estiver vinculado (setores, perigos, riscos, ações)?")) {
        try {
          await apiDelete(`/pgr/companies/${id}`);
          if (selectedCompanyId === id) {
            clearCompanyForm();
          }
          await loadCompanies();
        } catch (err) {
          showError(err, "Erro ao excluir empresa.");
        }
      }
    }
  });

  // Setores
  const sectorsTable = document.querySelector("#sectors-table");
  sectorsTable.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = Number(tr.dataset.id);

    if (btn.classList.contains("view") || btn.classList.contains("edit")) {
      await selectSector(id);
    } else if (btn.classList.contains("delete")) {
      if (confirm("Excluir setor e perigos/riscos/ações vinculados?")) {
        try {
          await apiDelete(`/pgr/sectors/${id}`);
          if (selectedSectorId === id) {
            clearSectorForm();
          }
          await loadSectorsForCompany(selectedCompanyId);
        } catch (err) {
          showError(err, "Erro ao excluir setor.");
        }
      }
    }
  });

  // Perigos
  const hazardsTable = document.querySelector("#hazards-table");
  hazardsTable.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = Number(tr.dataset.id);

    if (btn.classList.contains("view") || btn.classList.contains("edit")) {
      await selectHazard(id);
    } else if (btn.classList.contains("delete")) {
      if (confirm("Excluir perigo e riscos/ações vinculados?")) {
        try {
          await apiDelete(`/pgr/hazards/${id}`);
          if (selectedHazardId === id) {
            clearHazardForm();
          }
          await loadHazardsForSector(selectedSectorId);
        } catch (err) {
          showError(err, "Erro ao excluir perigo.");
        }
      }
    }
  });

  // Riscos
  const risksTable = document.querySelector("#risks-table");
  risksTable.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = Number(tr.dataset.id);

    if (btn.classList.contains("view") || btn.classList.contains("edit")) {
      await selectRisk(id);
    } else if (btn.classList.contains("delete")) {
      if (confirm("Excluir risco e ações vinculadas?")) {
        try {
          await apiDelete(`/pgr/risks/${id}`);
          if (selectedRiskId === id) {
            clearRiskForm();
          }
          await loadRisksForHazard(selectedHazardId);
        } catch (err) {
          showError(err, "Erro ao excluir risco.");
        }
      }
    }
  });

  // Ações
  const actionsTable = document.querySelector("#actions-table");
  actionsTable.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = Number(tr.dataset.id);

    if (btn.classList.contains("delete")) {
      if (confirm("Excluir ação de controle?")) {
        try {
          await apiDelete(`/pgr/actions/${id}`);
          await loadActionsForRisk(selectedRiskId);
        } catch (err) {
          showError(err, "Erro ao excluir ação.");
        }
      }
    } else if (btn.classList.contains("edit")) {
      alert(
        "Edição de ação ainda não implementada. Você pode excluir e cadastrar de novo."
      );
    }
  });
}

// ------------------------
// BOTÕES GERAIS (limpar, imprimir, PDF)
// ------------------------
function attachGeneralButtons() {
  const btnClear = document.querySelector("#btn-clear-all");
  if (btnClear) {
    btnClear.addEventListener("click", async () => {
      if (!confirm("Limpar todos os formulários e seleções da tela?")) return;
      clearCompanyForm();
      clearSectorForm();
      clearHazardForm();
      clearRiskForm();
      clearActionForm();
      await loadCompanies();
    });
  }

  const btnPrint = document.querySelector("#btn-print");
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  const btnPdf = document.querySelector("#btn-export-pdf");
  if (btnPdf) {
    btnPdf.addEventListener("click", () => {
      window.print(); // por enquanto, imprime (pode ser trocado por lib de PDF)
    });
  }
}

// ------------------------
// Inicialização
// ------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // liga botões de salvar
  document
    .querySelector("#btn-save-company")
    .addEventListener("click", handleSaveCompany);
  document
    .querySelector("#btn-save-sector")
    .addEventListener("click", handleSaveSector);
  document
    .querySelector("#btn-save-hazard")
    .addEventListener("click", handleSaveHazard);
  document
    .querySelector("#btn-save-risk")
    .addEventListener("click", handleSaveRisk);
  document
    .querySelector("#btn-save-action")
    .addEventListener("click", handleSaveAction);

  attachTableHandlers();
  attachGeneralButtons();

  await loadCompanies();
});

// ------------------------
// Estilos mínimos extras via JS (caso não existam no CSS)
// ------------------------
const styleExtra = document.createElement("style");
styleExtra.textContent = `
  /* Centralizar melhor o conteúdo e usar mais largura */
  .page .wrap {
    max-width: 1400px;
    margin: 0 auto;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.3fr);
    gap: 16px;
    align-items: flex-start;
  }

  .stack-vertical {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  @media (min-width: 900px) {
    .form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .table-wrapper {
    max-height: 260px;
    overflow: auto;
  }

  .actions-cell {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .icon-btn {
    border: none;
    background: #e9eff7;
    border-radius: 6px;
    padding: 3px 6px;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
    transition: background 0.15s, transform 0.05s;
  }

  .icon-btn:hover {
    background: #d3e2ff;
    transform: translateY(-1px);
  }

  .icon-btn.delete {
    background: #ffe1e1;
  }

  .icon-btn.delete:hover {
    background: #ffc4c4;
  }

  .row-selected {
    background: #e3f2ff !important;
  }
`;
document.head.appendChild(styleExtra);
