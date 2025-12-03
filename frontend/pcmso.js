// =========================
// PCMSO / ASO – Integração com API
// =========================
const API_BASE = "https://datainsight-sst-suite.onrender.com/api";
const ASO_ENDPOINT = "/aso/records";

// cache em memória para usar na lupa / impressão por ID
let _asoCache = [];

// ------------------------
// Helpers de auth + fetch
// ------------------------
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

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleResponse(res, "POST", path);
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse(res, "DELETE", path);
}

// ------------------------
// Carrega automaticamente os registros ao abrir a página
// ------------------------
document.addEventListener("DOMContentLoaded", () => {
  carregarASO();
});

// ------------------------
// SALVAR
// ------------------------
async function salvarASO() {
  const nome = document.getElementById("nome").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const funcao = document.getElementById("funcao").value.trim();
  const setor = document.getElementById("setor").value.trim();
  const tipoExame = document.getElementById("tipoExame").value;
  const dataExame = document.getElementById("dataExame").value;
  const medico = document.getElementById("medico").value.trim();
  const resultado = document.getElementById("resultado").value;

  if (!nome || !cpf || !funcao || !dataExame) {
    alert("⚠️ Preencha pelo menos Nome, CPF, Função e Data do Exame.");
    return;
  }

  const payload = {
    nome,
    cpf,
    funcao,
    setor,
    tipo_exame: tipoExame,
    data_exame: dataExame,
    medico,
    resultado,
  };

  try {
    await apiPost(ASO_ENDPOINT, payload);
    await carregarASO();
    limparFormulario();
    alert("✅ Registro salvo com sucesso!");
  } catch (err) {
    console.error("Erro ao salvar ASO:", err);
    alert("❌ Erro ao salvar no servidor. Veja o console para detalhes.");
  }
}

// ------------------------
// CARREGAR TABELA
// ------------------------
async function carregarASO() {
  const tbody = document.querySelector("#tabelaASO tbody");
  tbody.innerHTML = "<tr><td colspan='7'>Carregando...</td></tr>";

  try {
    const lista = (await apiGet(ASO_ENDPOINT)) || [];

    _asoCache = lista;
    localStorage.setItem("registrosASO", JSON.stringify(lista));

    atualizarTotalASO(lista.length);

    if (!lista.length) {
      tbody.innerHTML =
        "<tr><td colspan='7'>Nenhum ASO registrado ainda.</td></tr>";
      return;
    }

    tbody.innerHTML = "";
    lista.forEach((item) => {
      const linha = `
        <tr>
          <td>${item.nome}</td>
          <td>${item.cpf}</td>
          <td>${item.funcao}</td>
          <td>${item.tipo_exame}</td>
          <td>${item.data_exame}</td>
          <td>${item.resultado}</td>
          <td style="display:flex; gap:4px; flex-wrap:wrap;">
            <button class="btn secondary" 
                    style="padding:4px 8px; font-size:12px;"
                    onclick="visualizarASO(${item.id})">
              🔍 Ver
            </button>
            <button class="btn danger" 
                    style="padding:4px 8px; font-size:12px;"
                    onclick="deletarASO(${item.id})">
              🗑 Excluir
            </button>
          </td>
        </tr>
      `;
      tbody.insertAdjacentHTML("beforeend", linha);
    });
  } catch (err) {
    console.error("Erro ao carregar ASO:", err);
    tbody.innerHTML =
      "<tr><td colspan='7'>Erro ao carregar registros.</td></tr>";
    atualizarTotalASO(0);
  }
}

// Atualiza contador de total de ASOs (rodapé da tabela)
function atualizarTotalASO(total) {
  localStorage.setItem("totalASOS", String(total));
  const el = document.getElementById("total-asos-pagina");
  if (el) el.textContent = total;
}

// ------------------------
// DELETAR REGISTRO
// ------------------------
async function deletarASO(id) {
  if (!confirm("❓ Deseja realmente excluir este registro de ASO?")) {
    return;
  }

  try {
    await apiDelete(`${ASO_ENDPOINT}/${id}`);
    await carregarASO();
    alert("🗑 Registro excluído com sucesso!");
  } catch (err) {
    console.error("Erro ao excluir ASO:", err);
    alert("❌ Erro ao excluir o registro.");
  }
}

// ------------------------
// LIMPAR FORM
// ------------------------
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

// =========================
// Funções extras – visualização / impressão
// =========================
function montarHTMLASO(reg) {
  return `
    <div style="font-family: system-ui; padding: 20px;">
      <h1 style="margin-bottom: 8px;">ASO – Avaliação de Saúde Ocupacional</h1>
      <p style="margin: 4px 0;"><strong>Nome:</strong> ${reg.nome}</p>
      <p style="margin: 4px 0;"><strong>CPF:</strong> ${reg.cpf}</p>
      <p style="margin: 4px 0;"><strong>Função:</strong> ${reg.funcao}</p>
      <p style="margin: 4px 0;"><strong>Setor:</strong> ${reg.setor || "-"}</p>
      <p style="margin: 4px 0;"><strong>Tipo de Exame:</strong> ${reg.tipo_exame}</p>
      <p style="margin: 4px 0;"><strong>Data do Exame:</strong> ${reg.data_exame}</p>
      <p style="margin: 4px 0;"><strong>Médico Responsável:</strong> ${reg.medico || "-"}</p>
      <p style="margin: 4px 0;"><strong>Resultado:</strong> ${reg.resultado}</p>

      <hr style="margin: 16px 0;">

      <p style="font-size: 12px; color:#6b7280;">
        Gerado pela suíte <strong>DataInsight SST</strong>.
      </p>
      <button onclick="window.print()" 
              style="padding:6px 12px; margin-top:8px;">
        🖨 Imprimir
      </button>
    </div>
  `;
}

function visualizarASO(id) {
  const reg = _asoCache.find((r) => r.id === id);
  if (!reg) {
    alert("⚠️ Registro não encontrado na memória.");
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

// =========================
// Funções extras dos botões
// =========================
async function obterUltimoASO() {
  const lista = (await apiGet(ASO_ENDPOINT)) || [];
  if (!lista.length) return null;
  // se quiser o mais recente “por último”
  return lista[lista.length - 1];
}

async function imprimirUltimoASO() {
  const ultimo = await obterUltimoASO();
  if (!ultimo) {
    alert("⚠️ Não há registros para imprimir.");
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
    alert("⚠️ Não há registros para exportar.");
    return;
  }

  alert(
    "📄 Exportar PDF (último ASO) vai ser ligado depois a um gerador de PDF.\n" +
      "Os dados já estão vindo do banco (Supabase) direitinho."
  );
}
