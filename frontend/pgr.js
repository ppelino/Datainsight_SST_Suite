const API_BASE = "https://datainsight-sst-suite.onrender.com";
const token = localStorage.getItem("authToken");

if (!token) {
  window.location.href = "index.html";
}

let selectedCompanyId = null;
let selectedSectorId = null;
let selectedHazardId = null;
let selectedRiskId = null;

// ===============================
// API HELPERS
// ===============================

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

// ===============================
// EMPRESAS
// ===============================

function clearCompanyForm() {
  selectedCompanyId = null;
  selectedSectorId = null;
  selectedHazardId = null;
  selectedRiskId = null;

  document.querySelector("#company-name").value = "";
  document.querySelector("#company-cnpj").value = "";
  document.querySelector("#company-address").value = "";
  document.querySelector("#company-activity").value = "";
  document.querySelector("#company-risk").value = "";

  const btn = document.querySelector("#btn-save-company");
  if (btn) btn.textContent = "Salvar empresa";

  const label = document.querySelector("#current-company-label");
  if (label) label.textContent = "Nenhuma empresa selecionada.";
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
    selectedSectorId = null;
    selectedHazardId = null;
    selectedRiskId = null;

    document.querySelector("#company-name").value = company.name || "";
    document.querySelector("#company-cnpj").value = company.cnpj || "";
    document.querySelector("#company-address").value = company.endereco || "";
    document.querySelector("#company-activity").value = company.atividade || "";
    document.querySelector("#company-risk").value = company.grau_risco ?? "";

    const label = document.querySelector("#current-company-label");
    if (label) label.textContent = `Empresa selecionada: ${company.name}`;

    const btn = document.querySelector("#btn-save-company");
    if (btn) btn.textContent = "Atualizar empresa";

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

// ===============================
// SETORES
// ===============================

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
  selectedHazardId = null;
  selectedRiskId = null;

  const label = document.querySelector("#current-sector-label");
  if (label) label.textContent = `Setor selecionado: ID ${id}`;

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

// ===============================
// PERIGOS
// ===============================

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
  selectedRiskId = null;

  const label = document.querySelector("#current-hazard-label");
  if (label) label.textContent = `Perigo selecionado: ID ${id}`;

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

// ===============================
// RISCOS
// ===============================

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

  const label = document.querySelector("#current-risk-label");
  if (label) label.textContent = `Risco selecionado: ID ${id}`;

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

// ===============================
// AÇÕES
// ===============================

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

// ===============================
// RELATÓRIO PGR COMPLETO
// ===============================

async function montarRelatorioPGRCompleto() {
  const empresa = document.querySelector("#company-name")?.value || "Empresa não informada";
  const cnpj = document.querySelector("#company-cnpj")?.value || "-";
  const atividade = document.querySelector("#company-activity")?.value || "-";
  const grau = document.querySelector("#company-risk")?.value || "-";

  let setoresHTML = "";

  if (selectedCompanyId) {
    const setores = await apiGet(`/pgr/sectors/by-company/${selectedCompanyId}`);

    for (const setor of setores || []) {
      let perigosHTML = "";

      const perigos = await apiGet(`/pgr/hazards/by-sector/${setor.id}`);

      for (const perigo of perigos || []) {
        let riscosHTML = "";

        const riscos = await apiGet(`/pgr/risks/by-hazard/${perigo.id}`);

        for (const risco of riscos || []) {
          const acoes = await apiGet(`/pgr/actions/by-risk/${risco.id}`);

          const acoesHTML = (acoes || []).map(acao => `
            <tr>
              <td>${acao.recomendacao || "-"}</td>
              <td>${acao.tipo || "-"}</td>
              <td>${acao.responsavel || "-"}</td>
              <td>${acao.prazo || "-"}</td>
              <td>${acao.status || "-"}</td>
            </tr>
          `).join("");

          riscosHTML += `
            <div style="margin-top:18px; padding:16px; border:1px solid #e5e7eb; border-radius:14px;">
              <h4 style="margin-bottom:10px;">Risco: ${calcRiskLevel(risco.probabilidade, risco.severidade)}</h4>
              <p><strong>Probabilidade:</strong> ${risco.probabilidade ?? "-"}</p>
              <p><strong>Severidade:</strong> ${risco.severidade ?? "-"}</p>
              <p><strong>Medidas existentes:</strong> ${risco.medidas_existentes || "-"}</p>

              <table style="width:100%; border-collapse:collapse; margin-top:12px; font-size:13px;">
                <thead>
                  <tr style="background:#f3f4f6;">
                    <th style="padding:9px; text-align:left;">Recomendação</th>
                    <th style="padding:9px; text-align:left;">Tipo</th>
                    <th style="padding:9px; text-align:left;">Responsável</th>
                    <th style="padding:9px; text-align:left;">Prazo</th>
                    <th style="padding:9px; text-align:left;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${acoesHTML || `<tr><td colspan="5" style="padding:10px;">Nenhuma ação cadastrada.</td></tr>`}
                </tbody>
              </table>
            </div>
          `;
        }

        perigosHTML += `
          <div style="margin-top:22px; background:#f8fafc; padding:18px; border-radius:16px;">
            <h3 style="margin-bottom:10px;">Perigo: ${perigo.nome || "-"}</h3>
            <p><strong>Agente:</strong> ${perigo.agente || "-"}</p>
            <p><strong>Fonte:</strong> ${perigo.fonte || "-"}</p>
            <p><strong>Descrição:</strong> ${perigo.descricao || "-"}</p>
            ${riscosHTML || "<p style='margin-top:10px;'>Nenhum risco cadastrado.</p>"}
          </div>
        `;
      }

      setoresHTML += `
        <div style="margin-top:30px; border-top:2px solid #e5e7eb; padding-top:22px;">
          <h2>Setor: ${setor.nome || "-"}</h2>
          <p><strong>Descrição:</strong> ${setor.descricao || "-"}</p>
          ${perigosHTML || "<p>Nenhum perigo cadastrado.</p>"}
        </div>
      `;
    }
  }

  return `
    <div style="font-family:Arial,sans-serif; padding:40px; background:#f1f5f9;">
      <div style="max-width:1100px; margin:0 auto; background:white; border-radius:22px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.12);">
        <div style="background:#0f172a; color:white; padding:35px;">
          <h1 style="margin:0;">DataInsight SST</h1>
          <p style="margin-top:8px;">Programa de Gerenciamento de Riscos — NR-01</p>
        </div>

        <div style="padding:35px;">
          <h2 style="margin-bottom:20px;">Relatório Completo PGR</h2>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:30px;">
            <div><strong>Empresa:</strong><br>${empresa}</div>
            <div><strong>CNPJ:</strong><br>${cnpj}</div>
            <div><strong>Atividade:</strong><br>${atividade}</div>
            <div><strong>Grau de risco:</strong><br>${grau}</div>
          </div>

          ${setoresHTML || `<p>Nenhum setor cadastrado ou nenhuma empresa selecionada.</p>`}

          <div style="margin-top:45px; padding-top:20px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; gap:20px;">
            <div style="font-size:13px; color:#64748b;">
              Documento gerado automaticamente pela suíte <strong>DataInsight SST</strong>.
            </div>

            <div style="text-align:center; min-width:260px;">
              <div style="border-top:1px solid #0f172a; padding-top:8px; margin-top:35px;">
                Responsável Técnico
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function visualizarRelatorioPGR() {
  try {
    const html = await montarRelatorioPGRCompleto();
    const win = window.open("", "_blank");

    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório PGR</title>

        <style>
          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>

      <body style="margin:0;background:#f1f5f9;">
        ${html}

        <button onclick="window.print()" style="
          position:fixed;
          bottom:20px;
          right:20px;
          background:#2563eb;
          color:white;
          border:none;
          border-radius:12px;
          padding:12px 18px;
          cursor:pointer;
          font-size:16px;
        ">
          🖨️ Imprimir
        </button>
      </body>
      </html>
    `);

    win.document.close();
    win.focus();

  } catch (err) {
    showError(err, "Erro ao gerar relatório PGR.");
  }
}

// ===============================
// START
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#btn-save-company")?.addEventListener("click", handleSaveCompany);
  document.querySelector("#btn-save-sector")?.addEventListener("click", handleSaveSector);
  document.querySelector("#btn-save-hazard")?.addEventListener("click", handleSaveHazard);
  document.querySelector("#btn-save-risk")?.addEventListener("click", handleSaveRisk);
  document.querySelector("#btn-save-action")?.addEventListener("click", handleSaveAction);

  document.querySelector("#btn-clear-all")?.addEventListener("click", () => location.reload());
  document.querySelector("#btn-print")?.addEventListener("click", visualizarRelatorioPGR);
  document.querySelector("#btn-export-pdf")?.addEventListener("click", visualizarRelatorioPGR);

  loadCompanies();
});
