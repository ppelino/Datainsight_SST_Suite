// =========================
// PCMSO / ASO – Integração com API
// =========================
const API_BASE = "https://datainsight-sst-suite.onrender.com/api";
    // ... KPIs + gráficos ...
    buildPCMSOCharts(asos);
    buildChartDistribuicaoModulos(asos, nr17, ltcat);
    // etc...
  } catch (err) {
    console.error("Erro ao carregar KPIs / gráficos gerais:", err);
  }
}


// cache em memória para usar na lupa / impressão por ID
let _asoCache = [];

// Carrega automaticamente os registros ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
  carregarASO();
});

// --------- SALVAR ---------
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
    const res = await fetch(`${API_BASE}/aso/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("Erro ao salvar ASO:", res.status, msg);
      alert("❌ Erro ao salvar no servidor. Veja o console para detalhes.");
      return;
    }

    await res.json();

    await carregarASO();
    limparFormulario();

    alert("✅ Registro salvo com sucesso!");
  } catch (err) {
    console.error("Erro de rede ao salvar ASO:", err);
    alert("❌ Erro de comunicação com o servidor.");
  }
}

// --------- CARREGAR TABELA ---------
async function carregarASO() {
  const tbody = document.querySelector("#tabelaASO tbody");
  tbody.innerHTML = "<tr><td colspan='7'>Carregando...</td></tr>";

  try {
    const res = await fetch(`${API_BASE}/aso/records`);
    if (!res.ok) {
      const msg = await res.text();
      console.error("Erro ao carregar ASO:", res.status, msg);
      tbody.innerHTML =
        "<tr><td colspan='7'>Erro ao carregar registros.</td></tr>";

      // se der erro, zera contador visual
      atualizarTotalASO(0);
      return;
    }

    const lista = await res.json();

    // cache + localStorage
    _asoCache = lista;
    localStorage.setItem("registrosASO", JSON.stringify(lista));

    // ATUALIZA TOTAL (contador na página + localStorage)
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
    console.error("Erro de rede ao carregar ASO:", err);
    tbody.innerHTML =
      "<tr><td colspan='7'>Erro de comunicação com o servidor.</td></tr>";
    atualizarTotalASO(0);
  }
}

// Atualiza contador de total de ASOs
function atualizarTotalASO(total) {
  // guarda no localStorage (se quiser usar em outros lugares)
  localStorage.setItem("totalASOS", String(total));

  // atualiza contador na página, se existir
  const el = document.getElementById("total-asos-pagina");
  if (el) {
    el.textContent = total;
  }
}

// --------- DELETAR REGISTRO ---------
async function deletarASO(id) {
  if (!confirm("❓ Deseja realmente excluir este registro de ASO?")) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/aso/records/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("Erro ao excluir ASO:", res.status, msg);
      alert(`❌ Erro ao excluir o registro (status ${res.status}).`);
      return;
    }

    await carregarASO();
    alert("🗑 Registro excluído com sucesso!");
  } catch (err) {
    console.error("Erro de rede ao excluir ASO:", err);
    alert("❌ Erro de comunicação com o servidor ao excluir.");
  }
}

// --------- LIMPAR FORM ---------
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
  const res = await fetch(`${API_BASE}/aso/records`);
  if (!res.ok) return null;
  const lista = await res.json();
  if (!lista.length) return null;
  return lista[0];
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
