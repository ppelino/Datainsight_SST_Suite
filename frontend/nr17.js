// ===============================
// Configuração API
// ===============================
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// Ao carregar a página, busca registros do servidor
document.addEventListener("DOMContentLoaded", carregarNR17DoServidor);

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
// Salvar avaliação (POST na API)
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

    const indice = calcularIndiceNR17();

    const payload = {
        empresa: empresa || null,
        setor,
        funcao,
        trabalhador: trabalhador || null,
        tipo_posto: tipoPosto,
        data_avaliacao: dataAvaliacao,
        risco: indice.classificacao,
        score: indice.soma,
        observacoes: observacoes || null
    };

    try {
        const res = await fetch(`${API_BASE}/nr17/records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            console.error("Erro ao salvar NR-17:", txt);
            alert("⚠️ Erro ao salvar no servidor. Veja o console para detalhes.");
            return;
        }

        const saved = await res.json();

        // Atualiza lista trazendo tudo do servidor de novo
        await carregarNR17DoServidor();

        // Mantém campos limpos, índice visível
        limparNR17(false);

        // Guarda id da última avaliação no localStorage (usado pelo relatório)
        localStorage.setItem("ultimaNR17Id", String(saved.id));

        alert("✅ Avaliação NR-17 salva com sucesso!");
    } catch (err) {
        console.error(err);
        alert("⚠️ Erro de rede ao salvar a avaliação NR-17.");
    }
}

// ===============================
// Carregar da API e sincronizar localStorage
// ===============================
async function carregarNR17DoServidor() {
    try {
        const res = await fetch(`${API_BASE}/nr17/records`);
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
        const linha = `
            <tr>
                <td>${item.data_avaliacao || item.dataAvaliacao || ""}</td>
                <td>${item.setor || ""}</td>
                <td>${item.funcao || ""}</td>
                <td>${item.tipo_posto || item.tipoPosto || ""}</td>
                <td>${item.risco} (score: ${item.score})</td>
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
// Relatório – última avaliação (usa localStorage)
// ===============================
function obterUltimaAvaliacaoNR17() {
    let lista = JSON.parse(localStorage.getItem("avaliacoesNR17")) || [];
    if (lista.length === 0) return null;

    const ultimaId = localStorage.getItem("ultimaNR17Id");
    if (ultimaId) {
        const achada = lista.find(a => String(a.id) === ultimaId);
        if (achada) return achada;
    }

    return lista[lista.length - 1];
}

// --- a partir daqui mantém seu código de montarHTMLRelatorio,
// imprimirUltimaNR17 e exportarPDFUltimaNR17 exatamente como já estava ---

