// ==================================
// Datainsight SST – PGR / NR-01
// Integração completa com API + lupa/editar/excluir RISCO
// ==================================

// URL base da API no Render
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// helpers básicos
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Erro GET ${path}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro POST ${path}: ${text}`);
  }
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Erro PUT ${path}`);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Erro DELETE ${path}`);
  // muitos DELETE retornam vazio; só tenta json se tiver
  try {
    return await res.json();
  } catch {
    return null;
  }
}


async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro DELETE ${path}: ${text}`);
  }
  return res.json();
}

// estados selecionados
let currentCompany = null;
let currentSector = null;
let currentHazard = null;
let currentRisk = null;

// cache de riscos para lupa/edição
let currentRiskList = [];
let editingRiskId = null;

document.addEventListener("DOMContentLoaded", () => {
  setupForms();
  loadCompanies();
});

// configura envio dos formulários
function setupForms() {
  // Empresa
  document
    .getElementById("form-company")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        name: form.name.value,
        cnpj: form.cnpj.value,
        endereco: form.endereco.value,
        atividade: form.atividade.value,
        grau_risco: form.grau_risco.value
          ? parseInt(form.grau_risco.value)
          : null,
      };
      try {
        await apiPost("/pgr/companies", data);
        form.reset();
        await loadCompanies();
      } catch (err) {
        console.error(err);
        alert("❌ Erro ao salvar empresa.");
      }
    });

  // Setor
  document
    .getElementById("form-sector")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentCompany) return alert("Selecione uma empresa primeiro.");
      const form = e.target;
      const data = {
        company_id: currentCompany.id,
        nome: form.nome.value,
        descricao: form.descricao.value,
      };
      try {
        await apiPost("/pgr/sectors", data);
        form.reset();
        await loadSectors(currentCompany.id);
      } catch (err) {
        console.error(err);
        alert("❌ Erro ao salvar setor.");
      }
    });

  // Perigo
  document
    .getElementById("form-hazard")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentSector) return alert("Selecione um setor primeiro.");
      const form = e.target;
      const data = {
        sector_id: currentSector.id,
        nome: form.nome.value,
        agente: form.agente.value,
        fonte: form.fonte.value,
        descricao: form.descricao.value,
      };
      try {
        await apiPost("/pgr/hazards", data);
        form.reset();
        await loadHazards(currentSector.id);
      } catch (err) {
        console.error(err);
        alert("❌ Erro ao salvar perigo.");
      }
    });

  // Risco (criar ou editar)
  document
    .getElementById("form-risk")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentHazard) return alert("Selecione um perigo primeiro.");
      const form = e.target;
      const data = {
        hazard_id: currentHazard.id,
        probabilidade: parseInt(form.probabilidade.value),
        severidade: parseInt(form.severidade.value),
        medidas_existentes: form.medidas_existentes.value,
      };

      try {
        if (editingRiskId) {
          // ✏️ modo edição
          await apiPut(`/pgr/risks/${editingRiskId}`, data);
          editingRiskId = null;
          alert("✅ Risco atualizado com sucesso!");
        } else {
          // novo risco
          await apiPost("/pgr/risks", data);
          alert("✅ Risco cadastrado com sucesso!");
        }

        form.reset();
        document.getElementById("label-risk-mode").textContent =
          "Cadastro de risco";
        await loadRisks(currentHazard.id);
      } catch (err) {
        console.error(err);
        alert("❌ Erro ao salvar risco.");
      }
    });

  // Ação
  document
    .getElementById("form-action")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentRisk) return alert("Selecione um risco primeiro.");
      const form = e.target;
      const data = {
        risk_id: currentRisk.id,
        recomendacao: form.recomendacao.value,
        tipo: form.tipo.value,
        prazo: form.prazo.value || null,
        responsavel: form.responsavel.value,
        status: form.status.value,
      };
      try {
        await apiPost("/pgr/actions", data);
        form.reset();
        await loadActions(currentRisk.id);
      } catch (err) {
        console.error(err);
        alert("❌ Erro ao salvar ação.");
      }
    });
}

// ============================
//  Carregamento das listas
// ============================

async function loadCompanies() {
  const tbody = document.querySelector("#table-companies tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Carregando...</td></tr>";

  try {
    const companies = await apiGet("/pgr/companies");
    tbody.innerHTML = "";

    companies.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.name}</td>
        <td>${c.cnpj || "-"}</td>
        <td>${c.grau_risco || "-"}</td>
      `;
      tr.addEventListener("click", () => selectCompany(c, tr));
      tbody.appendChild(tr);
    });

    if (!companies.length) {
      tbody.innerHTML =
        "<tr><td colspan='4'>Nenhuma empresa cadastrada.</td></tr>";
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='4'>Erro ao carregar empresas.</td></tr>";
  }
}

async function loadSectors(companyId) {
  const tbody = document.querySelector("#table-sectors tbody");
  tbody.innerHTML = "<tr><td colspan='3'>Carregando...</td></tr>";

  try {
    const sectors = await apiGet(`/pgr/sectors/by-company/${companyId}`);
    tbody.innerHTML = "";

    sectors.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${s.nome}</td>
        <td>${s.descricao || "-"}</td>
      `;
      tr.addEventListener("click", () => selectSector(s, tr));
      tbody.appendChild(tr);
    });

    if (!sectors.length) {
      tbody.innerHTML =
        "<tr><td colspan='3'>Nenhum setor cadastrado.</td></tr>";
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='3'>Erro ao carregar setores.</td></tr>";
  }
}

async function loadHazards(sectorId) {
  const tbody = document.querySelector("#table-hazards tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Carregando...</td></tr>";

  try {
    const hazards = await apiGet(`/pgr/hazards/by-sector/${sectorId}`);
    tbody.innerHTML = "";

    hazards.forEach((h) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${h.id}</td>
        <td>${h.nome}</td>
        <td>${h.agente || "-"}</td>
        <td>${h.fonte || "-"}</td>
      `;
      tr.addEventListener("click", () => selectHazard(h, tr));
      tbody.appendChild(tr);
    });

    if (!hazards.length) {
      tbody.innerHTML =
        "<tr><td colspan='4'>Nenhum perigo cadastrado.</td></tr>";
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='4'>Erro ao carregar perigos.</td></tr>";
  }
}

async function loadRisks(hazardId) {
  const tbody = document.querySelector("#table-risks tbody");
  tbody.innerHTML = "<tr><td colspan='6'>Carregando...</td></tr>";

  try {
    const risks = await apiGet(`/pgr/risks/by-hazard/${hazardId}`);
    currentRiskList = risks; // cache para lupa/edição

    tbody.innerHTML = "";

    risks.forEach((r) => {
      const nivel = r.probabilidade * r.severidade;
      let cls = "pill-green";
      if (nivel >= 12) cls = "pill-red";
      else if (nivel >= 6) cls = "pill-yellow";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id}</td>
        <td><span class="pill ${cls}">${nivel}</span></td>
        <td>${r.probabilidade}</td>
        <td>${r.severidade}</td>
        <td>${r.medidas_existentes || "-"}</td>
        <td style="display:flex; gap:4px; flex-wrap:wrap;">
          <button class="btn btn-outline"
                  style="padding:4px 8px; font-size:12px;"
                  onclick="verRisco(event, ${r.id})">
            🔍 Ver
          </button>
          <button class="btn btn-outline"
                  style="padding:4px 8px; font-size:12px;"
                  onclick="editarRisco(event, ${r.id})">
            ✏️ Editar
          </button>
          <button class="btn btn-primary"
                  style="padding:4px 8px; font-size:12px; background:#e11d48;"
                  onclick="deletarRisco(event, ${r.id})">
            🗑 Excluir
          </button>
        </td>
      `;
      tr.addEventListener("click", () => selectRisk(r, tr));
      tbody.appendChild(tr);
    });

    if (!risks.length) {
      tbody.innerHTML =
        "<tr><td colspan='6'>Nenhum risco cadastrado.</td></tr>";
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='6'>Erro ao carregar riscos.</td></tr>";
  }
}

async function loadActions(riskId) {
  const tbody = document.querySelector("#table-actions tbody");
  tbody.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";

  try {
    const actions = await apiGet(`/pgr/actions/by-risk/${riskId}`);
    tbody.innerHTML = "";

    actions.forEach((a) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.id}</td>
        <td>${a.recomendacao}</td>
        <td>${a.tipo || "-"}</td>
        <td>${a.prazo || "-"}</td>
        <td>${a.status || "-"}</td>
      `;
      tbody.appendChild(tr);
    });

    if (!actions.length) {
      tbody.innerHTML =
        "<tr><td colspan='5'>Nenhuma ação cadastrada.</td></tr>";
    }
  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='5'>Erro ao carregar ações.</td></tr>";
  }
}

// ============================
//  Seleções em cascata
// ============================

function selectCompany(c, row) {
  currentCompany = c;
  currentSector = null;
  currentHazard = null;
  currentRisk = null;

  document
    .querySelectorAll("#table-companies tr")
    .forEach((tr) => tr.classList.remove("highlight"));
  row.classList.add("highlight");

  document.getElementById(
    "current-company"
  ).textContent = `Empresa selecionada: [${c.id}] ${c.name}`;
  document.getElementById("btn-save-sector").disabled = false;

  // limpa níveis abaixo
  document.querySelector("#table-sectors tbody").innerHTML = "";
  document.querySelector("#table-hazards tbody").innerHTML = "";
  document.querySelector("#table-risks tbody").innerHTML = "";
  document.querySelector("#table-actions tbody").innerHTML = "";
  document.getElementById("current-sector").textContent =
    "Nenhum setor selecionado.";
  document.getElementById("current-hazard").textContent =
    "Nenhum perigo selecionado.";
  document.getElementById("current-risk").textContent =
    "Nenhum risco selecionado.";
  document.getElementById("btn-save-hazard").disabled = true;
  document.getElementById("btn-save-risk").disabled = true;
  document.getElementById("btn-save-action").disabled = true;

  loadSectors(c.id);
}

function selectSector(s, row) {
  currentSector = s;
  currentHazard = null;
  currentRisk = null;

  document
    .querySelectorAll("#table-sectors tr")
    .forEach((tr) => tr.classList.remove("highlight"));
  row.classList.add("highlight");

  document.getElementById(
    "current-sector"
  ).textContent = `Setor selecionado: [${s.id}] ${s.nome}`;
  document.getElementById("btn-save-hazard").disabled = false;

  document.querySelector("#table-hazards tbody").innerHTML = "";
  document.querySelector("#table-risks tbody").innerHTML = "";
  document.querySelector("#table-actions tbody").innerHTML = "";
  document.getElementById("current-hazard").textContent =
    "Nenhum perigo selecionado.";
  document.getElementById("current-risk").textContent =
    "Nenhum risco selecionado.";
  document.getElementById("btn-save-risk").disabled = true;
  document.getElementById("btn-save-action").disabled = true;

  loadHazards(s.id);
}

function selectHazard(h, row) {
  currentHazard = h;
  currentRisk = null;

  document
    .querySelectorAll("#table-hazards tr")
    .forEach((tr) => tr.classList.remove("highlight"));
  row.classList.add("highlight");

  document.getElementById(
    "current-hazard"
  ).textContent = `Perigo selecionado: [${h.id}] ${h.nome}`;
  document.getElementById("btn-save-risk").disabled = false;

  document.querySelector("#table-risks tbody").innerHTML = "";
  document.querySelector("#table-actions tbody").innerHTML = "";
  document.getElementById("current-risk").textContent =
    "Nenhum risco selecionado.";
  document.getElementById("btn-save-action").disabled = true;

  loadRisks(h.id);
}

function selectRisk(r, row) {
  currentRisk = r;

  document
    .querySelectorAll("#table-risks tr")
    .forEach((tr) => tr.classList.remove("highlight"));
  row.classList.add("highlight");

  document.getElementById(
    "current-risk"
  ).textContent = `Risco selecionado: [${r.id}] Nível = ${
    r.probabilidade * r.severidade
  }`;
  document.getElementById("btn-save-action").disabled = false;

  loadActions(r.id);
}

// ============================
//  Lupa / editar / excluir risco
// ============================

function montarHTMLRisco(r) {
  const nivel = r.probabilidade * r.severidade;

  return `
    <div style="font-family: system-ui; padding: 20px;">
      <h1 style="margin-bottom: 8px;">PGR – Detalhes do Risco</h1>
      <p style="margin:4px 0;"><strong>ID:</strong> ${r.id}</p>
      <p style="margin:4px 0;"><strong>Perigo (ID):</strong> ${r.hazard_id}</p>
      <p style="margin:4px 0;"><strong>Probabilidade (P):</strong> ${r.probabilidade}</p>
      <p style="margin:4px 0;"><strong>Severidade (S):</strong> ${r.severidade}</p>
      <p style="margin:4px 0;"><strong>Nível (P×S):</strong> ${nivel}</p>
      <p style="margin:4px 0;"><strong>Medidas existentes:</strong><br>
        ${r.medidas_existentes || "-"}
      </p>

      <hr style="margin:16px 0;">
      <p style="font-size:12px; color:#6b7280;">
        Gerado pela suíte <strong>DataInsight SST</strong>.
      </p>
      <button onclick="window.print()" style="padding:6px 12px; margin-top:8px;">
        🖨 Imprimir
      </button>
    </div>
  `;
}

function verRisco(ev, id) {
  ev.stopPropagation();
  const r = currentRiskList.find((x) => x.id === id);
  if (!r) {
    alert("⚠️ Risco não encontrado em memória.");
    return;
  }

  const win = window.open("", "_blank");
  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Detalhes do risco</title>
    </head>
    <body>
      ${montarHTMLRisco(r)}
    </body>
    </html>
  `);
  win.document.close();
  win.focus();
}

function editarRisco(ev, id) {
  ev.stopPropagation();
  const r = currentRiskList.find((x) => x.id === id);
  if (!r) {
    alert("⚠️ Risco não encontrado em memória.");
    return;
  }

  editingRiskId = id;

  const form = document.getElementById("form-risk");
  form.probabilidade.value = r.probabilidade;
  form.severidade.value = r.severidade;
  form.medidas_existentes.value = r.medidas_existentes || "";

  document.getElementById("label-risk-mode").textContent =
    `Edição do risco [${id}]`;
  window.scrollTo({ top: form.offsetTop - 80, behavior: "smooth" });
}

async function deletarRisco(ev, id) {
  ev.stopPropagation();
  if (!confirm("❓ Deseja realmente excluir este risco?")) return;

  try {
    await apiDelete(`/pgr/risks/${id}`);
    alert("🗑 Risco excluído com sucesso!");

    if (currentHazard) {
      await loadRisks(currentHazard.id);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Erro ao excluir risco.");
  }
}

// ============================
//  Ações rápidas (barra do topo)
// ============================

function limparPGR() {
  // zera estados
  currentCompany = null;
  currentSector = null;
  currentHazard = null;
  currentRisk = null;
  currentRiskList = [];
  editingRiskId = null;

  // reseta todos os formulários
  document.querySelectorAll("form").forEach((form) => form.reset());

  // limpa destaques
  document
    .querySelectorAll("tr.highlight")
    .forEach((tr) => tr.classList.remove("highlight"));

  // limpa tabelas (mas mantém cabeçalho)
  document.querySelector("#table-sectors tbody").innerHTML = "";
  document.querySelector("#table-hazards tbody").innerHTML = "";
  document.querySelector("#table-risks tbody").innerHTML = "";
  document.querySelector("#table-actions tbody").innerHTML = "";

  // reseta textos
  document.getElementById("current-company").textContent =
    "Nenhuma empresa selecionada.";
  document.getElementById("current-sector").textContent =
    "Nenhum setor selecionado.";
  document.getElementById("current-hazard").textContent =
    "Nenhum perigo selecionado.";
  document.getElementById("current-risk").textContent =
    "Nenhum risco selecionado.";
  const label = document.getElementById("label-risk-mode");
  if (label) label.textContent = "Cadastro de risco";

  // desabilita botões em cascata
  document.getElementById("btn-save-sector").disabled = true;
  document.getElementById("btn-save-hazard").disabled = true;
  document.getElementById("btn-save-risk").disabled = true;
  document.getElementById("btn-save-action").disabled = true;

  // recarrega lista de empresas
  loadCompanies();
}

function imprimirPGR() {
  window.print();
}

function exportarPDF_PGR() {
  alert(
    "📄 Exportar PDF do PGR será integrado ao backend futuramente.\nA tela já está preparada para isso."
  );
}
