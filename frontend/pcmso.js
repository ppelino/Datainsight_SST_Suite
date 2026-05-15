const API_BASE = "https://datainsight-sst-suite.onrender.com/api";
const ASO_ENDPOINT = "/aso/records";

let _asoCache = [];

function getToken() {
  return localStorage.getItem("authToken");
}

function getAuthHeaders(extra = {}) {
  const token = getToken();

  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function checkUnauthorized(status) {
  if (status === 401) {
    alert("Sessão expirada ou não autorizada. Faça login novamente.");
    localStorage.clear();
    window.location.href = "index.html";
    return true;
  }

  return false;
}

async function handleResponse(res, method, path) {
  if (!res.ok) {
    if (checkUnauthorized(res.status)) {
      throw new Error(`HTTP 401 ${method} ${path}`);
    }

    let errorBody = null;
    let errorText = "";

    try {
      errorBody = await res.json();
      errorText = JSON.stringify(errorBody, null, 2);
    } catch {
      errorText = await res.text().catch(() => "");
    }

    throw new Error(`HTTP ${res.status} ${method} ${path}\n${errorText}`);
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
    headers: getAuthHeaders()
  });

  return handleResponse(res, "GET", path);
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(body)
  });

  return handleResponse(res, "POST", path);
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });

  return handleResponse(res, "DELETE", path);
}

function formatDateBR(dateStr) {
  if (!dateStr) return "-";

  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getResultadoBadge(resultado) {
  if (!resultado) return "-";

  if (resultado === "Apto") {
    return `<span class="status-apto">Apto</span>`;
  }

  if (resultado === "Inapto") {
    return `<span class="status-inapto">Inapto</span>`;
  }

  return `<span class="status-restricao">${resultado}</span>`;
}

async function salvarASO() {
  const payload = {
    nome: document.getElementById("nome").value.trim(),
    cpf: document.getElementById("cpf").value.trim(),
    funcao: document.getElementById("funcao").value.trim(),
    setor: document.getElementById("setor").value.trim(),
    tipo_exame: document.getElementById("tipoExame").value,
    data_exame: document.getElementById("dataExame").value,
    medico: document.getElementById("medico").value.trim(),
    resultado: document.getElementById("resultado").value
  };

  if (!payload.nome || !payload.cpf || !payload.funcao || !payload.data_exame) {
    alert("Preencha pelo menos Nome, CPF, Função e Data do Exame.");
    return;
  }

  console.log("Payload ASO enviado:", payload);

  try {
    await apiPost(ASO_ENDPOINT, payload);

    await carregarASO();
    limparFormulario();

    alert("Registro salvo com sucesso!");
  } catch (err) {
    console.error("Erro ao salvar ASO:", err);

    alert(
      "Erro ao salvar no servidor.\n\n" +
      err.message
    );
  }
}

async function carregarASO() {
  const tbody = document.querySelector("#tabelaASO tbody");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7">Carregando registros...</td>
    </tr>
  `;

  try {
    const lista = (await apiGet(ASO_ENDPOINT)) || [];

    _asoCache = lista;
    localStorage.setItem("registrosASO", JSON.stringify(lista));

    atualizarTotalASO(lista.length);

    if (!lista.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">Nenhum ASO registrado ainda.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map((item) => `
      <tr>
        <td>${item.nome || "-"}</td>
        <td>${item.cpf || "-"}</td>
        <td>${item.funcao || "-"}</td>
        <td>${item.tipo_exame || "-"}</td>
        <td>${formatDateBR(item.data_exame)}</td>
        <td>${getResultadoBadge(item.resultado)}</td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button
              class="btn secondary"
              style="padding:6px 10px; font-size:12px;"
              onclick="visualizarASO(${item.id})"
            >
              🔍 Ver
            </button>

            <button
              class="btn danger"
              style="padding:6px 10px; font-size:12px;"
              onclick="deletarASO(${item.id})"
            >
              🗑 Excluir
            </button>
          </div>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Erro ao carregar ASO:", err);

    tbody.innerHTML = `
      <tr>
        <td colspan="7">Erro ao carregar registros.</td>
      </tr>
    `;

    atualizarTotalASO(0);
  }
}

function atualizarTotalASO(total) {
  localStorage.setItem("totalASOS", String(total));

  const el = document.getElementById("total-asos-pagina");

  if (el) {
    el.textContent = total;
  }
}

async function deletarASO(id) {
  if (!confirm("Deseja realmente excluir este registro de ASO?")) {
    return;
  }

  try {
    await apiDelete(`${ASO_ENDPOINT}/${id}`);
    await carregarASO();

    alert("Registro excluído com sucesso!");
  } catch (err) {
    console.error("Erro ao excluir ASO:", err);

    alert(
      "Erro ao excluir o registro.\n\n" +
      err.message
    );
  }
}

function limparFormulario() {
  document.getElementById("nome").value = "";
  document.getElementById("cpf").value = "";
  document.getElementById("funcao").value = "";
  document.getElementById("setor").value = "";
  document.getElementById("tipoExame").value = "Admissional";
  document.getElementById("dataExame").value = "";
  document.getElementById("medico").value = "";
  document.getElementById("resultado").value = "Apto";
}

function montarHTMLASO(reg) {
  return `
    <div style="font-family: system-ui; padding: 28px; max-width: 850px; margin: 0 auto;">
      <h1 style="margin-bottom: 8px;">ASO – Atestado de Saúde Ocupacional</h1>

      <p><strong>Nome:</strong> ${reg.nome || "-"}</p>
      <p><strong>CPF:</strong> ${reg.cpf || "-"}</p>
      <p><strong>Função:</strong> ${reg.funcao || "-"}</p>
      <p><strong>Setor:</strong> ${reg.setor || "-"}</p>
      <p><strong>Tipo de Exame:</strong> ${reg.tipo_exame || "-"}</p>
      <p><strong>Data do Exame:</strong> ${formatDateBR(reg.data_exame)}</p>
      <p><strong>Médico Responsável:</strong> ${reg.medico || "-"}</p>
      <p><strong>Resultado:</strong> ${reg.resultado || "-"}</p>

      <hr style="margin: 20px 0;">

      <p style="font-size: 12px; color:#6b7280;">
        Gerado pela suíte <strong>DataInsight SST</strong>.
      </p>

      <button onclick="window.print()" style="padding:8px 14px; margin-top:10px;">
        Imprimir
      </button>
    </div>
  `;
}

function visualizarASO(id) {
  const reg = _asoCache.find((r) => r.id === id);

  if (!reg) {
    alert("Registro não encontrado na memória.");
    return;
  }

  const win = window.open("", "_blank");

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Detalhes do ASO</title>
    </head>
    <body>
      ${montarHTMLASO(reg)}
    </body>
    </html>
  `);

  win.document.close();
  win.focus();
}

async function obterUltimoASO() {
  const lista = (await apiGet(ASO_ENDPOINT)) || [];

  if (!lista.length) return null;

  return lista[0];
}

async function imprimirUltimoASO() {
  const ultimo = await obterUltimoASO();

  if (!ultimo) {
    alert("Não há registros para imprimir.");
    return;
  }

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Imprimir ASO</title>
    </head>
    <body>
      ${montarHTMLASO(ultimo)}
      <script>
        window.print();
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
}

async function exportarPDF_ASO() {
  const ultimo = await obterUltimoASO();

  if (!ultimo) {
    alert("Não há registros para exportar.");
    return;
  }

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Exportar ASO</title>
    </head>
    <body>
      ${montarHTMLASO(ultimo)}
      <script>
        window.print();
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!getToken()) {
    window.location.href = "index.html";
    return;
  }

  carregarASO();
});
