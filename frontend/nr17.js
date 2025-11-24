// ===============================
// NR-17 – Avaliação Ergonômica
// ===============================

// Ao carregar a página, monta a tabela
document.addEventListener("DOMContentLoaded", carregarNR17);

function calcularIndiceNR17() {
    const mobiliario = parseInt(document.getElementById("mobiliario").value || "1");
    const postura    = parseInt(document.getElementById("postura").value || "1");
    const esforco    = parseInt(document.getElementById("esforco").value || "1");
    const pausas     = parseInt(document.getElementById("pausas").value || "1");
    const ambiente   = parseInt(document.getElementById("ambiente").value || "1");
    const organizacao= parseInt(document.getElementById("organizacao").value || "1");

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

    carregarNR17();
    limparNR17(false); // limpa mas mantém o índice na tela

    alert("✅ Avaliação NR-17 salva com sucesso!");
}

function carregarNR17() {
    let lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
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
