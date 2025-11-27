// ===============================
// Configuração API
// ===============================
const API_BASE = "https://datainsight-sst-suite.onrender.com";

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

// ID do registro em edição (null = criando novo)
let selectedLTCATId = null;

// Ao carregar a página, garante token e busca registros do servidor
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  carregarLTCATDoServidor();
  attachTabelaLTCATHandlers();
});

// ===============================
// Helpers de formulário
// ===============================
function coletarFormularioLTCAT() {
  const empresa      = document.getElementById("empresa").value.trim();
  const cnpj         = document.getElementById("cnpj").value.trim();
  const setor        = document.getElementById("setor").value.trim();
  const funcao       = document.getElementById("funcao").value.trim();
  const ghe          = document.getElementById("ghe").value.trim();
  const agente       = document.getElementById("agente").value.trim();
  const classificacao= document.getElementById("classificacao").value;
  const fonte        = document.getElementById("fonte").value.trim();
  const meio         = document.getElementById("meio").value.trim();
  const intensidade  = document.getElementById("intensidade").value.trim();
  const unidade      = document.getElementById("unidade").value.trim();
  const jornada      = document.getElementById("jornada").value;
  const diasSemana   = document.getElementById("diasSemana").value;
  const tempoAnos    = document.getElementById("tempoAnos").value;
  const epiEficaz    = document.getElementById("epiEficaz").value;
  const enquadramento= document.getElementById("enquadramento").value;
  const data         = document.getElementById("data").value;
  const responsavel  = document.getElementById("responsavel").value.trim();
  const observacoes  = document.getElementById("observacoes").value.trim();

  return {
    empresa,
    cnpj,
    setor,
    funcao,
    ghe,
    agente,
    classificacao,
    fonte,
    meio,
    intensidade,
    unidade,
    jornada,
    diasSemana,
    tempoAnos,
    epiEficaz,
    enquadramento,
    data,
    responsavel,
    observacoes,
  };
}

function preencherFormularioLTCAT(r) {
  document.getElementById("empresa").value      = r.empresa || "";
  document.getElementById("cnpj").value         = r.cnpj || "";
  document.getElementById("setor").value        = r.setor || "";
  document.getElementById("funcao").value       = r.funcao || "";
  document.getElementById("ghe").value          = r.ghe || "";
  document.getElementById("agente").value       = r.agente || "";
  document.getElementById("classificacao").value= r.classificacao || "Físico";
  document.getElementById("fonte").value        = r.fonte || "";
  document.getElementById("meio").value         = r.meio || "";
  document.getElementById("intensidade").value  = r.intensidade || "";
  document.getElementById("unidade").value      = r.unidade || "";
  document.getElementById("jornada").value      = r.jornada ?? "";
  document.getElementById("diasSemana").value   = r.dias_semana ?? r.diasSemana ?? "";
  document.getElementById("tempoAnos").value    = r.tempo_anos ?? r.tempoAnos ?? "";
  document.getElementById("epiEficaz").value    = r.epi_eficaz || r.epiEficaz || "Sim";
  document.getElementById("enquadramento").value= r.enquadramento || "Sem enquadramento";
  document.getElementById("data").value         = r.data_avaliacao || r.data || "";
  document.getElementById("responsavel").value  = r.responsavel || "";
  document.getElementById("observacoes").value  = r.observacoes || "";

  selectedLTCATId = r.id;

  // botão vira "Atualizar"
  const btn = document.getElementById("btn-salvar-ltcat");
  if (btn) btn.textContent = "💾 Atualizar Registro";
}

// ===============================
// Salvar / atualizar
// ===============================
async function salvarLTCAT() {
  const form = coletarFormularioLTCAT();

  if (!form.empresa || !form.setor || !form.funcao || !form.agente) {
    alert("⚠️ Preencha pelo menos Empresa, Setor, Função e Agente nocivo.");
    return;
  }

  // payload alinhado com o backend (snake_case)
  const payload = {
    empresa: form.empresa,
    cnpj: form.cnpj || null,
    setor: form.setor,
    funcao: form.funcao,
    ghe: form.ghe || null,
    agente: form.agente,
    classificacao: form.classificacao,
    fonte: form.fonte || null,
    meio: form.meio || null,
    intensidade: form.intensidade || null,
    unidade: form.unidade || null,
    jornada: form.jornada ? Number(form.jornada) : null,
    dias_semana: form.diasSemana ? Number(form.diasSemana) : null,
    tempo_anos: form.tempoAnos ? Number(form.tempoAnos) : null,
    epi_eficaz: form.epiEficaz,
    enquadramento: form.enquadramento,
    data_avaliacao: form.data || null,
    responsavel: form.responsavel || null,
    observacoes: form.observacoes || null,
  };

  try {
    let url = `${API_BASE}/ltcat/records`;
    let method = "POST";

    if (selectedLTCATId) {
      url = `${API_BASE}/ltcat/records/${selectedLTCATId}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    if (checkUnauthorized(res.status)) return;

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Erro ao salvar/atualizar LTCAT:", res.status, txt);
      alert(
        "⚠️ Erro ao salvar o registro LTCAT.\n\n" +
        "Status: " + res.status + "\n" +
        (txt ? "Detalhe: " + txt : "Sem corpo de resposta.")
      );
      return;
    }

    const saved = await res.json().catch(() => null);

    // Atualiza lista com o que veio do servidor
    await carregarLTCATDoServidor();

    const idToStore = saved && saved.id ? saved.id : selectedLTCATId;
    if (idToStore) {
      localStorage.setItem("ultimoLTCATId", String(idToStore));
    }

    selectedLTCATId = null;
    limparLTCAT();

    const btn = document.getElementById("btn-salvar-ltcat");
    if (btn) btn.textContent = "💾 Salvar Registro";

    alert("✅ Registro LTCAT salvo com sucesso!");
  } catch (err) {
    console.error("Erro de rede ao salvar LTCAT:", err);
    alert("⚠️ Erro de rede ao salvar o registro LTCAT.");
  }
}

// ===============================
// Carregar da API e sincronizar localStorage
// ===============================
async function carregarLTCATDoServidor() {
  try {
    const res = await fetch(`${API_BASE}/ltcat/records`, {
      headers: getAuthHeaders(),
    });

    if (checkUnauthorized(res.status)) return;

    if (!res.ok) {
      console.error("Erro ao buscar LTCAT:", await res.text());
      return;
    }

    const lista = await res.json();

    localStorage.setItem("registrosLTCAT", JSON.stringify(lista));
    carregarLTCAT(lista);
  } catch (err) {
    console.error("Erro de rede ao carregar LTCAT:", err);
  }
}

// Monta tabela a partir de uma lista
function carregarLTCAT(listaFiltrada = null) {
  let lista = listaFiltrada;
  if (!lista) {
    lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];
  }

  const tbody = document.querySelector("#tabelaLTCAT tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  lista.forEach((item) => {
    const data = item.data_avaliacao || item.data || "";
    const linha = `
      <tr data-id="${item.id}">
        <td>${data}</td>
        <td>${item.empresa || ""}</td>
        <td>${item.setor || ""}</td>
        <td>${item.funcao || ""}</td>
        <td>${item.agente || ""}</td>
        <td>${item.classificacao || ""}</td>
        <td>${item.enquadramento || ""}</td>
        <td class="actions-cell">
          <button class="icon-btn view-ltcat" title="Ver relatório">🔍</button>
          <button class="icon-btn edit-ltcat" title="Editar registro">✏️</button>
          <button class="icon-btn delete delete-ltcat" title="Excluir registro">🗑️</button>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", linha);
  });
}

// ===============================
// Limpar formulário
// ===============================
function limparLTCAT() {
  document.getElementById("empresa").value = "";
  document.getElementById("cnpj").value = "";
  document.getElementById("setor").value = "";
  document.getElementById("funcao").value = "";
  document.getElementById("ghe").value = "";
  document.getElementById("agente").value = "";
  document.getElementById("classificacao").value = "Físico";
  document.getElementById("fonte").value = "";
  document.getElementById("meio").value = "";
  document.getElementById("intensidade").value = "";
  document.getElementById("unidade").value = "";
  document.getElementById("jornada").value = "";
  document.getElementById("diasSemana").value = "";
  document.getElementById("tempoAnos").value = "";
  document.getElementById("epiEficaz").value = "Sim";
  document.getElementById("enquadramento").value = "Sem enquadramento";
  document.getElementById("data").value = "";
  document.getElementById("responsavel").value = "";
  document.getElementById("observacoes").value = "";

  selectedLTCATId = null;
  const btn = document.getElementById("btn-salvar-ltcat");
  if (btn) btn.textContent = "💾 Salvar Registro";
}

// ===============================
// Filtro da tabela
// ===============================
function filtrarLTCAT() {
  const termo = document
    .getElementById("filtroLTCAT")
    .value.trim()
    .toLowerCase();

  let lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];

  if (termo === "") {
    carregarLTCAT(lista);
    return;
  }

  const filtrada = lista.filter((item) => {
    return (
      (item.empresa || "").toLowerCase().includes(termo) ||
      (item.setor || "").toLowerCase().includes(termo) ||
      (item.funcao || "").toLowerCase().includes(termo) ||
      (item.agente || "").toLowerCase().includes(termo)
    );
  });

  carregarLTCAT(filtrada);
}

// ===============================
// Clique na tabela: ver / editar / excluir
// ===============================
function attachTabelaLTCATHandlers() {
  const tabela = document.getElementById("tabelaLTCAT");
  if (!tabela) return;

  tabela.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr?.dataset.id;
    if (!id) return;

    const lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];
    const registro = lista.find((r) => String(r.id) === String(id));
    if (!registro) return;

    // Ver relatório
    if (btn.classList.contains("view-ltcat")) {
      visualizarLTCAT(registro);
      return;
    }

    // Editar
    if (btn.classList.contains("edit-ltcat")) {
      preencherFormularioLTCAT(registro);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Excluir
    if (btn.classList.contains("delete-ltcat")) {
      if (!confirm("Excluir este registro LTCAT?")) return;

      try {
        const res = await fetch(`${API_BASE}/ltcat/records/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });

        if (checkUnauthorized(res.status)) return;

        if (!res.ok) {
          const txt = await res.text();
          console.error("Erro ao excluir LTCAT:", txt);
          alert("⚠️ Erro ao excluir registro LTCAT no servidor.");
          return;
        }

        await carregarLTCATDoServidor();

        if (selectedLTCATId && String(selectedLTCATId) === String(id)) {
          limparLTCAT();
        }

        alert("✅ Registro LTCAT excluído com sucesso.");
      } catch (err) {
        console.error(err);
        alert("⚠️ Erro de rede ao excluir registro LTCAT.");
      }
    }
  });
}

// ===============================
// Relatório / impressão / PDF
// ===============================
function obterUltimoLTCAT() {
  let lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];
  if (lista.length === 0) return null;

  const ultimoId = localStorage.getItem("ultimoLTCATId");
  if (ultimoId) {
    const achado = lista.find((r) => String(r.id) === String(ultimoId));
    if (achado) return achado;
  }
  return lista[lista.length - 1];
}

function montarHTMLRelatorioLTCAT(r) {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827;">
      <h1 style="font-size:20px; margin-bottom:4px;">Relatório Sintético – LTCAT</h1>
      <p style="font-size:13px; color:#6b7280; margin-bottom:18px;">
        Registro estruturado para suporte ao Laudo Técnico de Condições Ambientais do Trabalho.
      </p>

      <h2 style="font-size:16px; margin-bottom:6px;">1. Identificação</h2>
      <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:12px;">
        <tr>
          <td style="padding:4px 0;"><strong>Empresa:</strong> ${r.empresa || "-"}</td>
          <td style="padding:4px 0;"><strong>CNPJ:</strong> ${r.cnpj || "-"}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Setor:</strong> ${r.setor || "-"}</td>
          <td style="padding:4px 0;"><strong>Função:</strong> ${r.funcao || "-"}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>GHE:</strong> ${r.ghe || "-"}</td>
          <td style="padding:4px 0;"><strong>Data da avaliação:</strong> ${r.data_avaliacao || r.data || "-"}</td>
        </tr>
      </table>

      <h2 style="font-size:16px; margin-bottom:6px;">2. Agente Nocivo e Exposição</h2>
      <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:12px;">
        <tr>
          <td style="padding:4px 0;"><strong>Agente nocivo:</strong> ${r.agente || "-"}</td>
          <td style="padding:4px 0;"><strong>Classificação:</strong> ${r.classificacao || "-"}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Fonte geradora:</strong> ${r.fonte || "-"}</td>
          <td style="padding:4px 0;"><strong>Meio de propagação:</strong> ${r.meio || "-"}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Intensidade / concentração:</strong> ${r.intensidade || "-"} ${r.unidade || ""}</td>
          <td style="padding:4px 0;"><strong>Jornada / dias semanais:</strong> ${r.jornada || "-"} h, ${r.dias_semana ?? r.diasSemana ?? "-"} dias/sem</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Tempo de exposição:</strong> ${r.tempo_anos ?? r.tempoAnos ?? "-"} anos</td>
          <td style="padding:4px 0;"><strong>EPC / EPI eficaz:</strong> ${r.epi_eficaz || r.epiEficaz || "-"}</td>
        </tr>
      </table>

      <h2 style="font-size:16px; margin-bottom:6px;">3. Enquadramento Previdenciário</h2>
      <p style="font-size:13px; margin-bottom:10px;">
        <strong>Situação:</strong> ${r.enquadramento || "Sem enquadramento definido."}
      </p>

      <h2 style="font-size:16px; margin-bottom:6px;">4. Observações</h2>
      <div style="font-size:13px; border:1px solid #e5e7eb; border-radius:8px; padding:10px; min-height:60px;">
        ${r.observacoes && r.observacoes.trim() !== "" ? r.observacoes : "Sem observações adicionais registradas."}
      </div>

      <h2 style="font-size:16px; margin-top:16px; margin-bottom:6px;">5. Responsável Técnico</h2>
      <p style="font-size:13px; margin-bottom:4px;">
        <strong>Nome / Registro:</strong> ${r.responsavel || "-"}
      </p>

      <p style="font-size:11px; color:#9ca3af; margin-top:18px;">
        Este relatório sintético não substitui o LTCAT completo, mas organiza de forma padronizada as informações
        essenciais para sua elaboração, em conformidade com a legislação previdenciária e normas de SST.
      </p>
    </div>
  `;
}

function visualizarLTCAT(r) {
  const html = montarHTMLRelatorioLTCAT(r);
  const win = window.open("", "_blank");
  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório LTCAT</title>
    </head>
    <body style="margin:20px;">${html}</body>
    </html>
  `);
  win.document.close();
  win.focus();
}

function imprimirUltimoLTCAT() {
  const r = obterUltimoLTCAT();
  if (!r) {
    alert("⚠️ Ainda não há registros LTCAT salvos.");
    return;
  }

  const html = montarHTMLRelatorioLTCAT(r);
  const win = window.open("", "_blank");
  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório LTCAT</title>
    </head>
    <body style="margin:20px;">${html}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function exportarPDFUltimoLTCAT() {
  const r = obterUltimoLTCAT();
  if (!r) {
    alert("⚠️ Ainda não há registros LTCAT salvos.");
    return;
  }

  const container = document.getElementById("conteudoRelatorioLTCAT");
  container.innerHTML = montarHTMLRelatorioLTCAT(r);

  const opt = {
    margin: 10,
    filename: `LTCAT_${(r.empresa || "empresa").replace(/\s+/g, "_")}.pdf`,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  html2pdf().from(container).set(opt).save();
}
