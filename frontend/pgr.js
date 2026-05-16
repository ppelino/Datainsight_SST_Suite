const API_BASE = "https://datainsight-sst-suite.onrender.com";
const token = localStorage.getItem("authToken");

if (!token) {
  window.location.href = "index.html";
}

let selectedCompanyId = null;
let selectedSectorId = null;
let selectedHazardId = null;
let selectedRiskId = null;

async function handleResponse(res, method, path) {
  if (!res.ok) {
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
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res, "GET", path);
}

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

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res, "DELETE", path);
}

function showError(err, title = "Erro") {
  console.error(title, err);
  alert(`${title}\n\n${err.message}`);
}

function getTbody(tableId) {
  return document.querySelector(`#${tableId} tbody`);
}

function clearCompanyForm() {
  selectedCompanyId = null;
  document.querySelector("#company-name").value = "";
  document.querySelector("#company-cnpj").value = "";
  document.querySelector("#company-address").value = "";
  document.querySelector("#company-activity").value = "";
  document.querySelector("#company-risk").value = "";

  const btn = document.querySelector("#btn-save-company");
  if (btn) btn.textContent = "Salvar empresa";
}

async function loadCompanies() {
  try {
    const companies = await apiGet("/pgr/companies");
    renderCompanies(companies || []);
  } catch (err) {
    showError(err, "Erro ao carregar empresas.");
  }
}

function renderCompanies(companies) {
  const tbody = getTbody("companies-table");
  if (!tbody) return;

  if (!companies.length) {
    tbody.innerHTML = `<tr><td colspan="5">Nenhuma empresa cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = companies.map(company => `
    <tr>
      <td>${company.id}</td>
      <td>${company.name || "-"}</td>
      <td>${company.cnpj || "-"}</td>
      <td>${company.grau_risco ?? "-"}</td>
      <td class="actions-cell">
        <button class="icon-btn" onclick="selectCompany(${company.id})">🔍</button>
        <button class="icon-btn" onclick="selectCompany(${company.id})">✏️</button>
        <button class="icon-btn delete" onclick="deleteCompany(${company.id})">🗑️</button>
      </td>
    </tr>
  `).join("");
}

async function handleSaveCompany(event) {
  if (event) event.preventDefault();

  const payload = {
    name: document.querySelector("#company-name").value.trim(),
    cnpj: document.querySelector("#company-cnpj").value.trim(),
    endereco: document.querySelector("#company-address").value.trim(),
    atividade: document.querySelector("#company-activity").value.trim(),
    grau_risco: document.querySelector("#company-risk").value
      ? Number(document.querySelector("#company-risk").value)
      : null
  };

  if (!payload.name) {
    alert("Informe o nome da empresa.");
    return;
  }

  try {
    if (selectedCompanyId) {
      await apiPut(`/pgr/companies/${selectedCompanyId}`, payload);
      alert("Empresa atualizada com sucesso!");
    } else {
      await apiPost("/pgr/companies", payload);
      alert("Empresa salva com sucesso!");
    }

    clearCompanyForm();
    await loadCompanies();

  } catch (err) {
    showError(err, "Erro ao salvar empresa.");
  }
}

async function selectCompany(id) {
  try {
    const company = await apiGet(`/pgr/companies/${id}`);
    selectedCompanyId = company.id;

    document.querySelector("#company-name").value = company.name || "";
    document.querySelector("#company-cnpj").value = company.cnpj || "";
    document.querySelector("#company-address").value = company.endereco || "";
    document.querySelector("#company-activity").value = company.atividade || "";
    document.querySelector("#company-risk").value = company.grau_risco ?? "";

    document.querySelector("#current-company-label").textContent =
      `Empresa selecionada: ${company.name}`;

    document.querySelector("#btn-save-company").textContent = "Atualizar empresa";

    await loadSectors(id);

  } catch (err) {
    showError(err, "Erro ao selecionar empresa.");
  }
}

async function deleteCompany(id) {
  if (!confirm("Excluir empresa?")) return;

  try {
    await apiDelete(`/pgr/companies/${id}`);
    clearCompanyForm();
    await loadCompanies();
  } catch (err) {
    showError(err, "Erro ao excluir empresa.");
  }
}

async function loadSectors(companyId) {
  const tbody = getTbody("sectors-table");
  if (!tbody) return;

  try {
    const sectors = await apiGet(`/pgr/sectors/by-company/${companyId}`);

    if (!sectors.length) {
      tbody.innerHTML = `<tr><td colspan="4">Nenhum setor cadastrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = sectors.map(sector => `
      <tr>
        <td>${sector.id}</td>
        <td>${sector.nome || "-"}</td>
        <td>${sector.descricao || "-"}</td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="selectSector(${sector.id})">🔍</button>
          <button class="icon-btn delete" onclick="deleteSector(${sector.id})">🗑️</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    showError(err, "Erro ao carregar setores.");
  }
}

async function handleSaveSector(event) {
  if (event) event.preventDefault();

  if (!selectedCompanyId) {
    alert("Selecione primeiro uma empresa.");
    return;
  }

  const payload = {
    company_id: selectedCompanyId,
    nome: document.querySelector("#sector-name").value.trim(),
    descricao: document.querySelector("#sector-description").value.trim()
  };

  if (!payload.nome) {
    alert("Informe o nome do setor.");
    return;
  }

  try {
    await apiPost("/pgr/sectors", payload);
    document.querySelector("#sector-name").value = "";
    document.querySelector("#sector-description").value = "";
    await loadSectors(selectedCompanyId);
  } catch (err) {
    showError(err, "Erro ao salvar setor.");
  }
}

async function selectSector(id) {
  selectedSectorId = id;
  document.querySelector("#current-sector-label").textContent = `Setor selecionado: ID ${id}`;
  await loadHazards(id);
}

async function deleteSector(id) {
  if (!confirm("Excluir setor?")) return;

  try {
    await apiDelete(`/pgr/sectors/${id}`);
    if (selectedCompanyId) await loadSectors(selectedCompanyId);
  } catch (err) {
    showError(err, "Erro ao excluir setor.");
  }
}

async function loadHazards(sectorId) {
  const tbody = getTbody("hazards-table");
  if (!tbody) return;

  try {
    const hazards = await apiGet(`/pgr/hazards/by-sector/${sectorId}`);

    if (!hazards.length) {
      tbody.innerHTML = `<tr><td colspan="5">Nenhum perigo cadastrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = hazards.map(hazard => `
      <tr>
        <td>${hazard.id}</td>
        <td>${hazard.nome || "-"}</td>
        <td>${hazard.agente || "-"}</td>
        <td>${hazard.fonte || "-"}</td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="selectHazard(${hazard.id})">🔍</button>
          <button class="icon-btn delete" onclick="deleteHazard(${hazard.id})">🗑️</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    showError(err, "Erro ao carregar perigos.");
  }
}

async function handleSaveHazard(event) {
  if (event) event.preventDefault();

  if (!selectedSectorId) {
    alert("Selecione primeiro um setor.");
    return;
  }

  const payload = {
    sector_id: selectedSectorId,
    nome: document.querySelector("#hazard-name").value.trim(),
    agente: document.querySelector("#hazard-agent").value.trim(),
    fonte: document.querySelector("#hazard-source").value.trim(),
    descricao: document.querySelector("#hazard-description").value.trim()
  };

  if (!payload.nome) {
    alert("Informe o nome do perigo.");
    return;
  }

  try {
    await apiPost("/pgr/hazards", payload);
    document.querySelector("#hazard-name").value = "";
    document.querySelector("#hazard-agent").value = "";
    document.querySelector("#hazard-source").value = "";
    document.querySelector("#hazard-description").value = "";
    await loadHazards(selectedSectorId);
  } catch (err) {
    showError(err, "Erro ao salvar perigo.");
  }
}

async function selectHazard(id) {
  selectedHazardId = id;
  document.querySelector("#current-hazard-label").textContent = `Perigo selecionado: ID ${id}`;
  await loadRisks(id);
}

async function deleteHazard(id) {
  if (!confirm("Excluir perigo?")) return;

  try {
    await apiDelete(`/pgr/hazards/${id}`);
    if (selectedSectorId) await loadHazards(selectedSectorId);
  } catch (err) {
    showError(err, "Erro ao excluir perigo.");
  }
}

function calcRiskLevel(prob, sev) {
  if (!prob || !sev) return "-";
  const score = prob * sev;
  if (score <= 4) return "Baixo";
  if (score <= 9) return "Médio";
  if (score <= 16) return "Alto";
  return "Crítico";
}

async function loadRisks(hazardId) {
  const tbody = getTbody("risks-table");
  if (!tbody) return;

  try {
    const risks = await apiGet(`/pgr/risks/by-hazard/${hazardId}`);

    if (!risks.length) {
      tbody.innerHTML = `<tr><td colspan="6">Nenhum risco cadastrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = risks.map(risk => `
      <tr>
        <td>${risk.id}</td>
        <td>${calcRiskLevel(risk.probabilidade, risk.severidade)}</td>
        <td>${risk.probabilidade ?? "-"}</td>
        <td>${risk.severidade ?? "-"}</td>
        <td>${risk.medidas_existentes || "-"}</td>
        <td class="actions-cell">
          <button class="icon-btn" onclick="selectRisk(${risk.id})">🔍</button>
          <button class="icon-btn delete" onclick="deleteRisk(${risk.id})">🗑️</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    showError(err, "Erro ao carregar riscos.");
  }
}

async function handleSaveRisk(event) {
  if (event) event.preventDefault();

  if (!selectedHazardId) {
    alert("Selecione primeiro um perigo.");
    return;
  }

  const payload = {
    hazard_id: selectedHazardId,
    probabilidade: document.querySelector("#risk-probability").value
      ? Number(document.querySelector("#risk-probability").value)
      : null,
    severidade: document.querySelector("#risk-severity").value
      ? Number(document.querySelector("#risk-severity").value)
      : null,
    medidas_existentes: document.querySelector("#risk-measures").value.trim()
  };

  try {
    await apiPost("/pgr/risks", payload);
    document.querySelector("#risk-probability").value = "";
    document.querySelector("#risk-severity").value = "";
    document.querySelector("#risk-measures").value = "";
    await loadRisks(selectedHazardId);
  } catch (err) {
    showError(err, "Erro ao salvar risco.");
  }
}

async function selectRisk(id) {
  selectedRiskId = id;
  document.querySelector("#current-risk-label").textContent = `Risco selecionado: ID ${id}`;
  await loadActions(id);
}

async function deleteRisk(id) {
  if (!confirm("Excluir risco?")) return;

  try {
    await apiDelete(`/pgr/risks/${id}`);
    if (selectedHazardId) await loadRisks(selectedHazardId);
  } catch (err) {
    showError(err, "Erro ao excluir risco.");
  }
}

async function loadActions(riskId) {
  const tbody = getTbody("actions-table");
  if (!tbody) return;

  try {
    const actions = await apiGet(`/pgr/actions/by-risk/${riskId}`);

    if (!actions.length) {
      tbody.innerHTML = `<tr><td colspan="6">Nenhuma ação cadastrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = actions.map(action => `
      <tr>
        <td>${action.id}</td>
        <td>${action.recomendacao || "-"}</td>
        <td>${action.tipo || "-"}</td>
        <td>${action.prazo || "-"}</td>
        <td>${action.status || "-"}</td>
        <td class="actions-cell">
          <button class="icon-btn delete" onclick="deleteAction(${action.id})">🗑️</button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    showError(err, "Erro ao carregar ações.");
  }
}

async function handleSaveAction(event) {
  if (event) event.preventDefault();

  if (!selectedRiskId) {
    alert("Selecione primeiro um risco.");
    return;
  }

  const payload = {
    risk_id: selectedRiskId,
    recomendacao: document.querySelector("#action-recommendation").value.trim(),
    tipo: document.querySelector("#action-type").value.trim(),
    prazo: document.querySelector("#action-deadline").value || null,
    responsavel: document.querySelector("#action-responsible").value.trim(),
    status: document.querySelector("#action-status").value
  };

  if (!payload.recomendacao) {
    alert("Informe a recomendação.");
    return;
  }

  try {
    await apiPost("/pgr/actions", payload);
    document.querySelector("#action-recommendation").value = "";
    document.querySelector("#action-type").value = "";
    document.querySelector("#action-deadline").value = "";
    document.querySelector("#action-responsible").value = "";
    document.querySelector("#action-status").value = "Pendente";
    await loadActions(selectedRiskId);
  } catch (err) {
    showError(err, "Erro ao salvar ação.");
  }
}

async function deleteAction(id) {
  if (!confirm("Excluir ação?")) return;

  try {
    await apiDelete(`/pgr/actions/${id}`);
    if (selectedRiskId) await loadActions(selectedRiskId);
  } catch (err) {
    showError(err, "Erro ao excluir ação.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#btn-save-company")?.addEventListener("click", handleSaveCompany);
  document.querySelector("#btn-save-sector")?.addEventListener("click", handleSaveSector);
  document.querySelector("#btn-save-hazard")?.addEventListener("click", handleSaveHazard);
  document.querySelector("#btn-save-risk")?.addEventListener("click", handleSaveRisk);
  document.querySelector("#btn-save-action")?.addEventListener("click", handleSaveAction);

function montarRelatorioPGR() {

  const empresa =
    document.querySelector("#company-name")?.value || "Empresa não informada";

  const cnpj =
    document.querySelector("#company-cnpj")?.value || "-";

  const atividade =
    document.querySelector("#company-activity")?.value || "-";

  const grau =
    document.querySelector("#company-risk")?.value || "-";

  const sectors =
    document.querySelector("#sectors-table tbody")?.innerHTML || "";

  const hazards =
    document.querySelector("#hazards-table tbody")?.innerHTML || "";

  const risks =
    document.querySelector("#risks-table tbody")?.innerHTML || "";

  const actions =
    document.querySelector("#actions-table tbody")?.innerHTML || "";

  return `
  <div style="
    font-family:Arial,sans-serif;
    background:#f1f5f9;
    padding:40px;
    min-height:100vh;
  ">

    <div style="
      max-width:1200px;
      margin:0 auto;
      background:white;
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,0.12);
    ">

      <!-- HEADER -->
      <div style="
        background:linear-gradient(135deg,#0f172a,#1e3a8a);
        color:white;
        padding:35px;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:20px;
          flex-wrap:wrap;
        ">

          <div>
            <h1 style="
              margin:0;
              font-size:34px;
            ">
              DataInsight SST
            </h1>

            <p style="
              margin-top:8px;
              color:#cbd5e1;
              font-size:14px;
            ">
              Programa de Gerenciamento de Riscos — NR-01
            </p>
          </div>

          <div style="
            background:rgba(255,255,255,0.12);
            padding:14px 18px;
            border-radius:14px;
            font-size:14px;
            font-weight:bold;
          ">
            RELATÓRIO PGR
          </div>

        </div>
      </div>

      <!-- BODY -->
      <div style="padding:35px;">

        <h2 style="
          margin-top:0;
          color:#0f172a;
          font-size:28px;
        ">
          Dados da Empresa
        </h2>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
          margin-top:20px;
        ">

          ${cardPGR("Empresa", empresa)}
          ${cardPGR("CNPJ", cnpj)}
          ${cardPGR("Atividade", atividade)}
          ${cardPGR("Grau de Risco", grau)}

        </div>

        ${secaoTabelaPGR("Setores", sectors)}
        ${secaoTabelaPGR("Perigos", hazards)}
        ${secaoTabelaPGR("Riscos", risks)}
        ${secaoTabelaPGR("Plano de Ação", actions)}

        <div style="
          margin-top:50px;
          padding-top:20px;
          border-top:1px solid #e2e8f0;
          display:flex;
          justify-content:space-between;
          align-items:center;
          flex-wrap:wrap;
          gap:12px;
        ">

          <div style="
            color:#64748b;
            font-size:13px;
          ">
            Documento gerado automaticamente pela suíte
            <strong>DataInsight SST</strong>.
          </div>

          <div style="
            text-align:center;
            min-width:240px;
          ">
            <div style="
              border-top:1px solid #0f172a;
              margin-top:35px;
              padding-top:8px;
              font-size:13px;
              color:#334155;
            ">
              Responsável Técnico
            </div>
          </div>

        </div>

      </div>

    </div>

  </div>
  `;
}

function cardPGR(label, valor) {
  return `
    <div style="
      background:#f8fafc;
      border:1px solid #e2e8f0;
      border-radius:14px;
      padding:16px;
    ">
      <div style="
        font-size:12px;
        color:#64748b;
        margin-bottom:6px;
        font-weight:600;
      ">
        ${label}
      </div>

      <div style="
        font-size:15px;
        color:#0f172a;
        font-weight:600;
      ">
        ${valor || "-"}
      </div>
    </div>
  `;
}

function secaoTabelaPGR(titulo, tbodyHTML) {

  return `
    <div style="margin-top:40px;">

      <h2 style="
        color:#0f172a;
        font-size:24px;
        margin-bottom:14px;
      ">
        ${titulo}
      </h2>

      <div style="
        border:1px solid #e2e8f0;
        border-radius:18px;
        overflow:hidden;
      ">

        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:14px;
        ">

          <tbody>
            ${tbodyHTML}
          </tbody>

        </table>

      </div>

    </div>
  `;
}

function visualizarRelatorioPGR() {

  const html = montarRelatorioPGR();

  const win = window.open("", "_blank");

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">

      <title>Relatório PGR</title>

      <style>
        body{
          margin:0;
          background:#f1f5f9;
        }

        table td{
          padding:12px;
          border-bottom:1px solid #e2e8f0;
          color:#334155;
        }

        @media print{
          button{
            display:none;
          }
        }
      </style>

    </head>

    <body>

      ${html}

      <div style="
        position:fixed;
        bottom:20px;
        right:20px;
      ">

        <button onclick="window.print()" style="
          background:#2563eb;
          color:white;
          border:none;
          border-radius:12px;
          padding:12px 18px;
          cursor:pointer;
          font-size:14px;
        ">
          🖨️ Imprimir
        </button>

      </div>

    </body>
    </html>
  `);

  win.document.close();
  win.focus();
}

document.addEventListener("DOMContentLoaded", () => {

  document.querySelector("#btn-save-company")
    ?.addEventListener("click", handleSaveCompany);

  document.querySelector("#btn-save-sector")
    ?.addEventListener("click", handleSaveSector);

  document.querySelector("#btn-save-hazard")
    ?.addEventListener("click", handleSaveHazard);

  document.querySelector("#btn-save-risk")
    ?.addEventListener("click", handleSaveRisk);

  document.querySelector("#btn-save-action")
    ?.addEventListener("click", handleSaveAction);

  document.querySelector("#btn-clear-all")
    ?.addEventListener("click", () => location.reload());

  document.querySelector("#btn-print")
    ?.addEventListener("click", visualizarRelatorioPGR);

  document.querySelector("#btn-export-pdf")
    ?.addEventListener("click", visualizarRelatorioPGR);

  loadCompanies();
});
