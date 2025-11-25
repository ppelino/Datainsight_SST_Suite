// =========================
// PCMSO / ASO – Integração com API
// =========================

const API_BASE = "https://datainsight-sst-suite.onrender.com";

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

    await res.json(); // não precisamos do retorno agora

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
      return;
    }

    const lista = await res.json();

    // 🔁 mantém um espelho no localStorage para o dashboard
    localStorage.setItem("registrosASO", JSON.stringify(lista));

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
          <td>
            <button class="btn danger" style="padding:4px 8px; font-size:12px;"
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
      alert("❌ Erro ao excluir o registro.");
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
// Funções extras dos botões
// =========================

// Busca o último registro direto da API
async function obterUltimoASO() {
  const res = await fetch(`${API_BASE}/aso/records`);
  if (!res.ok) return null;
  const lista = await res.json();
  if (!lista.length) return null;
  // assumindo ordenação desc no backend: primeiro = mais recente
  return lista[0];
}

// Imprimir a última avaliação registrada
async function imprimirUltimoASO() {
  const ultimo = await obterUltimoASO();
  if (!ultimo) {
    alert("⚠️ Não há registros para imprimir.");
    return;
  }

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <meta charset="utf-8">
      <title>Imprimir ASO</title>
    </head>
    <body style="font-family: system-ui; padding: 20px;">
      <h1>ASO – Avaliação de Saúde Ocupacional</h1>
      <p><strong>Nome:</strong> ${ultimo.nome}</p>
      <p><strong>CPF:</strong> ${ultimo.cpf}</p>
      <p><strong>Função:</strong> ${ultimo.funcao}</p>
      <p><strong>Setor:</strong> ${ultimo.setor}</p>
      <p><strong>Tipo de Exame:</strong> ${ultimo.tipo_exame}</p>
      <p><strong>Data do Exame:</strong> ${ultimo.data_exame}</p>
      <p><strong>Médico Responsável:</strong> ${ultimo.medico || "-"}</p>
      <p><strong>Resultado:</strong> ${ultimo.resultado}</p>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// "Exportar PDF" – por enquanto só placeholder
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
