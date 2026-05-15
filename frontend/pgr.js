// ======================================================
// DATainsight SST Suite
// PGR / NR-01 COMPLETO
// Multiempresa + Token + SaaS
// ======================================================

const API_BASE = "https://datainsight-sst-suite.onrender.com";

// ======================================================
// TOKEN / SESSÃO
// ======================================================

const token = localStorage.getItem("authToken");

if (!token) {
  window.location.href = "index.html";
}

// ======================================================
// DADOS DA SESSÃO
// ======================================================

const currentUserRole =
  localStorage.getItem("userRole") || "user";

const currentCompanyId =
  localStorage.getItem("companyId");

// ======================================================
// ESTADO
// ======================================================

let selectedCompanyId = null;
let selectedSectorId = null;
let selectedHazardId = null;
let selectedRiskId = null;

// ======================================================
// HELPERS API
// ======================================================

async function handleResponse(res, method, path) {

  if (!res.ok) {

    let text = "";

    try {
      text = await res.text();
    } catch (e) {
      text = "";
    }

    throw new Error(
      `HTTP ${res.status} ${method} ${path} → ${text}`
    );
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ======================================================
// GET
// ======================================================

async function apiGet(path) {

  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return handleResponse(res, "GET", path);
}

// ======================================================
// POST
// ======================================================

async function apiPost(path, body) {

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  return handleResponse(res, "POST", path);
}

// ======================================================
// PUT
// ======================================================

async function apiPut(path, body) {

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  return handleResponse(res, "PUT", path);
}

// ======================================================
// DELETE
// ======================================================

async function apiDelete(path) {

  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return handleResponse(res, "DELETE", path);
}

// ======================================================
// LOGOUT
// ======================================================

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ======================================================
// ALERTAS
// ======================================================

function showError(err, title = "Erro") {

  console.error(err);

  alert(`${title}\n\n${err.message}`);
}

// ======================================================
// CONTROLE ADMIN
// ======================================================

function hideAdminFeaturesIfNeeded() {

  if (currentUserRole === "admin") return;

  const companySection =
    document.querySelector(".company-admin-only");

  if (companySection) {
    companySection.style.display = "none";
  }
}

// ======================================================
// EMPRESAS
// ======================================================

async function loadCompanies() {

  try {

    const companies = await apiGet("/pgr/companies");

    renderCompanies(companies);

  } catch (err) {

    showError(err, "Erro ao carregar empresas.");
  }
}

function renderCompanies(companies) {

  const tbody =
    document.getElementById("companiesTable");

  if (!tbody) return;

  if (!companies.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          Nenhuma empresa cadastrada.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = companies.map(company => `

    <tr>

      <td>${company.id}</td>

      <td>${company.nome || "-"}</td>

      <td>${company.cnpj || "-"}</td>

      <td>${company.grau_risco || "-"}</td>

      <td>

        <button onclick="selectCompany(${company.id})">
          🔍
        </button>

        <button onclick="editCompany(${company.id})">
          ✏️
        </button>

        <button onclick="deleteCompany(${company.id})">
          🗑️
        </button>

      </td>

    </tr>

  `).join("");
}

// ======================================================
// SELECIONAR EMPRESA
// ======================================================

async function selectCompany(companyId) {

  selectedCompanyId = companyId;

  selectedSectorId = null;
  selectedHazardId = null;
  selectedRiskId = null;

  try {

    const sectors =
      await apiGet(`/pgr/sectors/by-company/${companyId}`);

    renderSectors(sectors);

  } catch (err) {

    showError(err, "Erro ao carregar setores.");
  }
}

// ======================================================
// SETORES
// ======================================================

function renderSectors(sectors) {

  const tbody =
    document.getElementById("sectorsTable");

  if (!tbody) return;

  if (!sectors.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          Nenhum setor cadastrado.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = sectors.map(sector => `

    <tr>

      <td>${sector.id}</td>

      <td>${sector.nome || "-"}</td>

      <td>${sector.descricao || "-"}</td>

      <td>

        <button onclick="selectSector(${sector.id})">
          🔍
        </button>

        <button onclick="deleteSector(${sector.id})">
          🗑️
        </button>

      </td>

    </tr>

  `).join("");
}

// ======================================================
// SELECIONAR SETOR
// ======================================================

async function selectSector(sectorId) {

  selectedSectorId = sectorId;

  try {

    const hazards =
      await apiGet(`/pgr/hazards/by-sector/${sectorId}`);

    renderHazards(hazards);

  } catch (err) {

    showError(err, "Erro ao carregar perigos.");
  }
}

// ======================================================
// PERIGOS
// ======================================================

function renderHazards(hazards) {

  const tbody =
    document.getElementById("hazardsTable");

  if (!tbody) return;

  if (!hazards.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          Nenhum perigo cadastrado.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = hazards.map(hazard => `

    <tr>

      <td>${hazard.id}</td>

      <td>${hazard.nome || "-"}</td>

      <td>${hazard.agente || "-"}</td>

      <td>${hazard.fonte || "-"}</td>

      <td>

        <button onclick="selectHazard(${hazard.id})">
          🔍
        </button>

        <button onclick="deleteHazard(${hazard.id})">
          🗑️
        </button>

      </td>

    </tr>

  `).join("");
}

// ======================================================
// SELECIONAR PERIGO
// ======================================================

async function selectHazard(hazardId) {

  selectedHazardId = hazardId;

  try {

    const risks =
      await apiGet(`/pgr/risks/by-hazard/${hazardId}`);

    renderRisks(risks);

  } catch (err) {

    showError(err, "Erro ao carregar riscos.");
  }
}

// ======================================================
// RISCOS
// ======================================================

function renderRisks(risks) {

  const tbody =
    document.getElementById("risksTable");

  if (!tbody) return;

  if (!risks.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          Nenhum risco cadastrado.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = risks.map(risk => `

    <tr>

      <td>${risk.id}</td>

      <td>${risk.nivel || "-"}</td>

      <td>${risk.probabilidade || "-"}</td>

      <td>${risk.severidade || "-"}</td>

      <td>${risk.medidas_existentes || "-"}</td>

      <td>

        <button onclick="selectRisk(${risk.id})">
          🔍
        </button>

        <button onclick="deleteRisk(${risk.id})">
          🗑️
        </button>

      </td>

    </tr>

  `).join("");
}

// ======================================================
// SELECIONAR RISCO
// ======================================================

async function selectRisk(riskId) {

  selectedRiskId = riskId;

  try {

    const actions =
      await apiGet(`/pgr/actions/by-risk/${riskId}`);

    renderActions(actions);

  } catch (err) {

    showError(err, "Erro ao carregar ações.");
  }
}

// ======================================================
// AÇÕES
// ======================================================

function renderActions(actions) {

  const tbody =
    document.getElementById("actionsTable");

  if (!tbody) return;

  if (!actions.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          Nenhuma ação cadastrada.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = actions.map(action => `

    <tr>

      <td>${action.id}</td>

      <td>${action.recomendacao || "-"}</td>

      <td>${action.tipo || "-"}</td>

      <td>${action.responsavel || "-"}</td>

      <td>${action.status || "-"}</td>

      <td>

        <button onclick="deleteAction(${action.id})">
          🗑️
        </button>

      </td>

    </tr>

  `).join("");
}

// ======================================================
// DELETES
// ======================================================

async function deleteCompany(id) {

  if (!confirm("Excluir empresa?")) return;

  try {

    await apiDelete(`/pgr/companies/${id}`);

    loadCompanies();

  } catch (err) {

    showError(err);
  }
}

async function deleteSector(id) {

  if (!confirm("Excluir setor?")) return;

  try {

    await apiDelete(`/pgr/sectors/${id}`);

    if (selectedCompanyId) {
      selectCompany(selectedCompanyId);
    }

  } catch (err) {

    showError(err);
  }
}

async function deleteHazard(id) {

  if (!confirm("Excluir perigo?")) return;

  try {

    await apiDelete(`/pgr/hazards/${id}`);

    if (selectedSectorId) {
      selectSector(selectedSectorId);
    }

  } catch (err) {

    showError(err);
  }
}

async function deleteRisk(id) {

  if (!confirm("Excluir risco?")) return;

  try {

    await apiDelete(`/pgr/risks/${id}`);

    if (selectedHazardId) {
      selectHazard(selectedHazardId);
    }

  } catch (err) {

    showError(err);
  }
}

async function deleteAction(id) {

  if (!confirm("Excluir ação?")) return;

  try {

    await apiDelete(`/pgr/actions/${id}`);

    if (selectedRiskId) {
      selectRisk(selectedRiskId);
    }

  } catch (err) {

    showError(err);
  }
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

hideAdminFeaturesIfNeeded();

loadCompanies();
