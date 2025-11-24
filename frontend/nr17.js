// ===============================
// NR-17 – Avaliação Ergonômica
// ===============================

// Ao carregar a página, monta a tabela
document.addEventListener("DOMContentLoaded", carregarNR17);

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

function salvarNR17() {
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

    const indice = calcularIndiceNR17();

    const avaliacao = {
        id: Date.now(),
        empresa,
        setor,
        funcao,
        trabalhador,
        tipoPosto,
        dataAvaliacao,
        risco: indice.classificacao,
        score: indice.soma,
        observacoes
    };

    let lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
    lista.push(avaliacao);
    localStorage.setItem("avaliacoesNR17", JSON.stringify(lista));

    // guarda id da última avaliação salva (para imprimir / PDF)
    localStorage.setItem("ultimaNR17Id", String(avaliacao.id));

    carregarNR17();
    limparNR17(false); // limpa campos, mas mantém índice na tela

    alert("✅ Avaliação NR-17 salva com sucesso!");
}

function carregarNR17(listaFiltrada = null) {
    let lista = listaFiltrada;
    if (!lista) {
        lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
    }

    const tbody = document.querySelector("#tabelaNR17 tbody");
    tbody.innerHTML = "";

    lista.forEach(item => {
        const linha = `
            <tr>
                <td>${item.dataAvaliacao || ""}</td>
                <td>${item.setor || ""}</td>
                <td>${item.funcao || ""}</td>
                <td>${item.tipoPosto || ""}</td>
                <td>${item.risco} (score: ${item.score})</td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", linha);
    });
}

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
}

// ===============================
// FILTRO / BUSCA NA TABELA
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
// RELATÓRIO – ÚLTIMA AVALIAÇÃO
// ===============================

function obterUltimaAvaliacaoNR17() {
    let lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
    if (lista.length === 0) {
        return null;
    }

    const ultimaId = localStorage.getItem("ultimaNR17Id");
    if (ultimaId) {
        const achada = lista.find(a => String(a.id) === ultimaId);
        if (achada) return achada;
    }

    // fallback: última da lista
    return lista[lista.length - 1];
}

function montarHTMLRelatorio(av) {
    const riscoCor =
        av.risco === "Alto" ? "#dc2626" :
        av.risco === "Médio" ? "#f97316" :
        "#16a34a";

    return `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111827;">
        <h1 style="font-size:20px; margin-bottom:4px;">Relatório de Avaliação Ergonômica – NR-17</h1>
        <p style="font-size:13px; color:#6b7280; margin-bottom:18px;">
          Gerado pela suíte DataInsight SST.
        </p>

        <h2 style="font-size:16px; margin-bottom:6px;">1. Identificação</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:12px;">
          <tr>
            <td style="padding:4px 0;"><strong>Empresa:</strong> ${av.empresa || "-"}</td>
            <td style="padding:4px 0;"><strong>Setor:</strong> ${av.setor || "-"}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Função Avaliada:</strong> ${av.funcao || "-"}</td>
            <td style="padding:4px 0;"><strong>Trabalhador:</strong> ${av.trabalhador || "-"}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Tipo de Posto:</strong> ${av.tipoPosto || "-"}</td>
            <td style="padding:4px 0;"><strong>Data da Avaliação:</strong> ${av.dataAvaliacao || "-"}</td>
          </tr>
        </table>

        <h2 style="font-size:16px; margin-bottom:6px;">2. Resultado Global</h2>
        <p style="font-size:13px; margin-bottom:4px;">
          <strong>Classificação de risco: </strong>
          <span style="color:${riscoCor}; font-weight:600;">
            ${av.risco} (score: ${av.score})
          </span>
        </p>
        <p style="font-size:12px; color:#6b7280; margin-bottom:14px;">
          Score calculado a partir de fatores de mobiliário, postura, esforço físico, pausas, ambiente físico e organização do trabalho.
        </p>

        <h2 style="font-size:16px; margin-bottom:6px;">3. Observações</h2>
        <div style="font-size:13px; border:1px solid #e5e7eb; border-radius:8px; padding:10px; min-height:60px;">
          ${av.observacoes && av.observacoes.trim() !== "" ? av.observacoes : "Sem observações registradas."}
        </div>

        <p style="font-size:11px; color:#9ca3af; margin-top:18px;">
          Este relatório simplificado não substitui o laudo ergonômico completo, mas serve como registro estruturado da avaliação do posto de trabalho segundo a NR-17.
        </p>
      </div>
    `;
}

function imprimirUltimaNR17() {
    const av = obterUltimaAvaliacaoNR17();
    if (!av) {
        alert("⚠️ Ainda não há avaliações NR-17 salvas.");
        return;
    }

    const html = montarHTMLRelatorio(av);
    const win = window.open("", "_blank");
    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório NR-17</title>
      </head>
      <body style="margin:20px;">${html}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
}

function exportarPDFUltimaNR17() {
    const av = obterUltimaAvaliacaoNR17();
    if (!av) {
        alert("⚠️ Ainda não há avaliações NR-17 salvas.");
        return;
    }

    const container = document.getElementById("conteudoRelatorioNR17");
    container.innerHTML = montarHTMLRelatorio(av);

    const opt = {
        margin:       10,
        filename:     `Relatorio_NR17_${(av.setor || "setor").replace(/\s+/g,"_")}.pdf`,
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(container).set(opt).save();
}
