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

// ID da avaliação em edição (null = criando nova)
let selectedNR17Id = null;

// Ao carregar a página, garante token e busca registros do servidor
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // se abrir NR-17 sem estar logado, volta para o login
    window.location.href = "index.html";
    return;
  }
  carregarNR17DoServidor();
  attachTabelaNR17Handlers();
});

// ===============================
// Cálculo do índice NR-17
// ===============================
function calcularIndiceNR17() {
  const mobiliario  = parseInt(document.getElementById("mobiliario").value || "1");
  const postura     = parseInt(document.getElementById("postura").value || "1");
  const esforco     = parseInt(document.getElementById("esforco").value || "1");
  const pausas      = parseInt(document.getElementById("pausas").value || "1");
  const ambiente    = parseInt(document.getElementById("ambiente").value || "1");
  const organizacao = parseInt(document.getElementById("organizacao").value || "1");

  const soma = mobiliario + postura + esforco + pausas + ambiente + organizacao;

  let classificacao = "Baixo";
  let cor = "#16a34a"; // verde

  if (soma >= 9 && soma <= 12) {
    classificacao = "Médio";
    cor = "#f97316"; // laranja
  } else if (soma > 12) {
    classificacao = "Alto";
    cor = "#dc2626"; // vermelho
  }

  const span = document.getElementById("resultadoRisco");
  span.textContent = classificacao + " (score: " + soma + ")";
  span.style.color = cor;

  return { soma, classificacao };
}

// ===============================
// Preencher formulário a partir de um registro
// ===============================
function preencherFormularioNR17(av) {
  document.getElementById("empresa").value       = av.empresa || "";
  document.getElementById("setor").value         = av.setor || "";
  document.getElementById("funcao").value        = av.funcao || "";
  document.getElementById("trabalhador").value   = av.trabalhador || "";
  document.getElementById("tipoPosto").value     = av.tipo_posto || av.tipoPosto || "Administrativo";
  document.getElementById("dataAvaliacao").value = av.data_avaliacao || av.dataAvaliacao || "";
  document.getElementById("observacoes").value   = av.observacoes || "";

  // Atualiza indicação de risco na sidebar
  const span = document.getElementById("resultadoRisco");
  span.textContent = `${av.risco} (score: ${av.score})`;
  let cor = "#16a34a";
  if (av.risco === "Médio") cor = "#f97316";
  if (av.risco === "Alto")  cor = "#dc2626";
  span.style.color = cor;

  // Coloca botão em modo "Atualizar"
  const btn = document.getElementById("btn-salvar-nr17");
  if (btn) btn.textContent = "💾 Atualizar Avaliação";
}

// ===============================
// Salvar OU atualizar avaliação
// ===============================
async function salvarNR17() {
  const empresa       = document.getElementById("empresa").value.trim();
  const setor         = document.getElementById("setor").value.trim();
  const funcao        = document.getElementById("funcao").value.trim();
  const trabalhador   = document.getElementById("trabalhador").value.trim();
  const tipoPosto     = document.getElementById("tipoPosto").value;
  const dataAvaliacao = document.getElementById("dataAvaliacao").value;
  const observacoes   = document.getElementById("observacoes").value.trim();

  if (!setor || !funcao || !dataAvaliacao) {
    alert("⚠️ Preencha pelo menos Setor, Função e Data da Avaliação.");
    return;
  }

  let risco, score;

  if (selectedNR17Id) {
    // EDIÇÃO: mantém risco/score original (não temos mais os fatores detalhados)
    const lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
    const avOrig = lista.find(a => String(a.id) === String(selectedNR17Id));
    if (avOrig) {
      risco = avOrig.risco;
      score = avOrig.score;
    } else {
      const indice = calcularIndiceNR17();
      risco = indice.classificacao;
      score = indice.soma;
    }
  } else {
    // NOVO: calcula índice com base nos selects
    const indice = calcularIndiceNR17();
    risco = indice.classificacao;
    score = indice.soma;
  }

  const payload = {
    empresa: empresa || null,
    setor,
    funcao,
    trabalhador: trabalhador || null,
    tipo_posto: tipoPosto,
    data_avaliacao: dataAvaliacao,
    risco,
    score,
    observacoes: observacoes || null
  };

  try {
    let url = `${API_BASE}/nr17/records`;
    let method = "POST";

    if (selectedNR17Id) {
      url = `${API_BASE}/nr17/records/${selectedNR17Id}`;
      method = "PUT";
    }

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload)
    });

    if (checkUnauthorized(res.status)) return;

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Erro ao salvar/atualizar NR-17:", res.status, txt);

      alert(
        "⚠️ Erro ao salvar no servidor.\n\n" +
        "Status: " + res.status + "\n" +
        (txt ? "Detalhe: " + txt : "Sem corpo de resposta.")
      );
      return;
    }

    const saved = await res.json().catch(() => null);

    // Atualiza lista trazendo tudo do servidor de novo
    await carregarNR17DoServidor();

    // guarda id da última avaliação salva (para imprimir / PDF)
    const idToStore = saved && saved.id ? saved.id : selectedNR17Id;
    if (idToStore) {
      localStorage.setItem("ultimaNR17Id", String(idToStore));
    }

    // Limpa formulário e volta para modo "salvar novo"
    selectedNR17Id = null;
    limparNR17(false);

    const btn = document.getElementById("btn-salvar-nr17");
    if (btn) btn.textContent = "💾 Salvar Avaliação";

    alert("✅ Avaliação NR-17 salva com sucesso!");
  } catch (err) {
    console.error("Erro de rede ao salvar NR-17:", err);
    alert("⚠️ Erro de rede ao salvar a avaliação NR-17.");
  }
}


// ===============================
// Carregar da API e sincronizar localStorage
// ===============================
async function carregarNR17DoServidor() {
  try {
    const res = await fetch(`${API_BASE}/nr17/records`, {
      headers: getAuthHeaders()
    });

    if (checkUnauthorized(res.status)) return;

    if (!res.ok) {
      console.error("Erro ao buscar NR-17:", await res.text());
      return;
    }

    const lista = await res.json();

    // Sincroniza localStorage para dashboard e relatórios
    localStorage.setItem("avaliacoesNR17", JSON.stringify(lista));

    // Monta tabela na tela
    carregarNR17(lista);
  } catch (err) {
    console.error("Erro de rede ao carregar NR-17:", err);
  }
}

// Monta tabela a partir de uma lista (já carregada)
function carregarNR17(listaFiltrada = null) {
  let lista = listaFiltrada;
  if (!lista) {
    lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
  }

  const tbody = document.querySelector("#tabelaNR17 tbody");
  tbody.innerHTML = "";

  lista.forEach(item => {
    const data = item.data_avaliacao || item.dataAvaliacao || "";
    const tipoPosto = item.tipo_posto || item.tipoPosto || "";
    const risco = item.risco || "";
    const score = item.score ?? "";

    const linha = `
      <tr data-id="${item.id}">
        <td>${data}</td>
        <td>${item.setor || ""}</td>
        <td>${item.funcao || ""}</td>
        <td>${tipoPosto}</td>
        <td>${risco} (score: ${score})</td>
        <td class="actions-cell">
          <button class="icon-btn view-nr17" title="Ver detalhes">🔍</button>
          <button class="icon-btn edit-nr17" title="Editar avaliação">✏️</button>
          <button class="icon-btn delete delete-nr17" title="Excluir avaliação">🗑️</button>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML("beforeend", linha);
  });
}

// ===============================
// Limpar formulário
// ===============================
function limparNR17(resetIndice = true) {
  document.getElementById("empresa").value = "";
  document.getElementById("setor").value = "";
  document.getElementById("funcao").value = "";
  document.getElementById("trabalhador").value = "";
  document.getElementById("tipoPosto").value = "Administrativo";
  document.getElementById("dataAvaliacao").value = "";

  document.getElementById("mobiliario").value = "1";
  document.getElementById("postura").value = "1";
  document.getElementById("esforco").value = "1";
  document.getElementById("pausas").value = "1";
  document.getElementById("ambiente").value = "1";
  document.getElementById("organizacao").value = "1";
  document.getElementById("observacoes").value = "";

  if (resetIndice) {
    const span = document.getElementById("resultadoRisco");
    span.textContent = "–";
    span.style.color = "#6b7280";
  }

  // volta para modo "novo"
  selectedNR17Id = null;
  const btn = document.getElementById("btn-salvar-nr17");
  if (btn) btn.textContent = "💾 Salvar Avaliação";
}

// ===============================
// Filtro na tabela (usa localStorage sincronizado)
// ===============================
function filtrarNR17() {
  const termo = document.getElementById("filtroNR17").value.trim().toLowerCase();
  let lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];

  if (termo === "") {
    carregarNR17(lista);
    return;
  }

  const filtrada = lista.filter(item => {
    const setor = (item.setor || "").toLowerCase();
    const funcao = (item.funcao || "").toLowerCase();
    const risco = (item.risco || "").toLowerCase();
    return (
      setor.includes(termo) ||
      funcao.includes(termo) ||
      risco.includes(termo)
    );
  });

  carregarNR17(filtrada);
}

// ===============================
// Clique na tabela (Ver / Editar / Excluir)
// ===============================
function attachTabelaNR17Handlers() {
  const tabela = document.getElementById("tabelaNR17");
  if (!tabela) return;

  tabela.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;

    const tr = btn.closest("tr");
    const id = tr?.dataset.id;
    if (!id) return;

    const lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
    const av = lista.find(a => String(a.id) === String(id));
    if (!av) return;

    // Visualizar (lupinha)
    if (btn.classList.contains("view-nr17")) {
      visualizarNR17(av);
      return;
    }

    // Editar
    if (btn.classList.contains("edit-nr17")) {
      selectedNR17Id = av.id;
      preencherFormularioNR17(av);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Excluir
    if (btn.classList.contains("delete-nr17")) {
      if (!confirm("Excluir esta avaliação NR-17?")) return;

      try {
        const res = await fetch(`${API_BASE}/nr17/records/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        if (checkUnauthorized(res.status)) return;

        if (!res.ok) {
          const txt = await res.text();
          console.error("Erro ao excluir NR-17:", txt);
          alert("⚠️ Erro ao excluir avaliação no servidor.");
          return;
        }

        // Atualiza lista
        await carregarNR17DoServidor();

        // Se estava editando este registro, limpa formulário
        if (selectedNR17Id && String(selectedNR17Id) === String(id)) {
          limparNR17();
        }

        alert("✅ Avaliação excluída com sucesso.");
      } catch (err) {
        console.error(err);
        alert("⚠️ Erro de rede ao excluir avaliação NR-17.");
      }
    }
  });
}

// ===============================
// RELATÓRIO – ÚLTIMA AVALIAÇÃO
// ===============================
function obterUltimaAvaliacaoNR17() {
  let lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
  if (lista.length === 0) {
    return null;
  }

  const ultimaId = localStorage.getItem("ultimaNR17Id");
  if (ultimaId) {
    const achada = lista.find(a => String(a.id) === String(ultimaId));
    if (achada) return achada;
  }

  // fallback: última da lista
  return lista[lista.length - 1];
}

function cardCampo(label, valor) {
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

function montarHTMLRelatorio(av) {

  const riscoCor =
    av.risco === "Alto" ? "#dc2626" :
    av.risco === "Médio" ? "#f97316" :
    "#16a34a";

  const data = av.data_avaliacao || av.dataAvaliacao || "-";
  const tipoPosto = av.tipo_posto || av.tipoPosto || "-";

  return `
  <div style="
    font-family:Arial,sans-serif;
    background:#f1f5f9;
    padding:40px;
    min-height:100vh;
  ">

    <div style="
      max-width:950px;
      margin:0 auto;
      background:white;
      border-radius:22px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,0.12);
    ">

      <!-- HEADER -->
      <div style="
        background:linear-gradient(135deg,#0f172a,#1e3a8a);
        color:white;
        padding:30px;
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
              font-size:30px;
            ">
              DataInsight SST
            </h1>

            <p style="
              margin-top:8px;
              color:#cbd5e1;
              font-size:14px;
            ">
              Sistema de Gestão em Segurança do Trabalho
            </p>
          </div>

          <div style="
            background:rgba(255,255,255,0.12);
            padding:12px 18px;
            border-radius:14px;
            font-size:14px;
            font-weight:bold;
          ">
            NR-17
          </div>

        </div>
      </div>

      <!-- BODY -->
      <div style="padding:35px;">

        <h2 style="
          margin-top:0;
          color:#0f172a;
          font-size:26px;
        ">
          Relatório de Avaliação Ergonômica
        </h2>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:18px;
          margin-top:25px;
        ">

          ${cardCampo("Empresa", av.empresa || "-")}
          ${cardCampo("Setor", av.setor || "-")}
          ${cardCampo("Função", av.funcao || "-")}
          ${cardCampo("Trabalhador", av.trabalhador || "-")}
          ${cardCampo("Tipo de Posto", tipoPosto)}
          ${cardCampo("Data da Avaliação", data)}

        </div>

        <div style="
          margin-top:30px;
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:18px;
          padding:22px;
        ">

          <div style="
            font-size:13px;
            color:#64748b;
            margin-bottom:8px;
            font-weight:600;
          ">
            Resultado Global
          </div>

          <div style="
            font-size:22px;
            font-weight:bold;
            color:${riscoCor};
          ">
            ${av.risco} (score: ${av.score})
          </div>

          <div style="
            margin-top:10px;
            color:#64748b;
            font-size:13px;
            line-height:1.5;
          ">
            Avaliação baseada em critérios ergonômicos relacionados
            à postura, mobiliário, esforço físico, pausas, ambiente
            e organização do trabalho.
          </div>

        </div>

        <div style="
          margin-top:28px;
        ">

          <div style="
            font-size:14px;
            font-weight:700;
            margin-bottom:10px;
            color:#0f172a;
          ">
            Observações Técnicas
          </div>

          <div style="
            border:1px solid #e2e8f0;
            border-radius:14px;
            padding:18px;
            background:#f8fafc;
            min-height:90px;
            font-size:14px;
            color:#334155;
            line-height:1.6;
          ">
            ${
              av.observacoes && av.observacoes.trim() !== ""
                ? av.observacoes
                : "Sem observações registradas."
            }
          </div>

        </div>

        <div style="
          margin-top:40px;
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

function visualizarNR17(av) {

  const html = montarHTMLRelatorio(av);

  const win = window.open("", "_blank");

  win.document.write(`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório NR-17</title>

      <style>
        body{
          margin:0;
          background:#f1f5f9;
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

function imprimirUltimaNR17() {

  const av = obterUltimaAvaliacaoNR17();

  if (!av) {
    alert("⚠️ Ainda não há avaliações NR-17 salvas.");
    return;
  }

  visualizarNR17(av);
}

function exportarPDFUltimaNR17() {

  const av = obterUltimaAvaliacaoNR17();

  if (!av) {
    alert("⚠️ Ainda não há avaliações NR-17 salvas.");
    return;
  }

  visualizarNR17(av);
}
