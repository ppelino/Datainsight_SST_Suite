// =========================
// PCMSO / ASO – Funções (usando API no backend / Supabase)
// =========================

const API_BASE = "https://datainsight-sst-suite.onrender.com";

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
        const txt = await res.text();
        throw new Error(`Erro POST ${path}: ${txt}`);
    }
    return res.json();
}

// cache em memória para impressão / PDF
let cacheASO = [];

// Carrega automaticamente os registros ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
    carregarASO();
});

async function salvarASO() {
    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const funcao = document.getElementById("funcao").value.trim();
    const setor = document.getElementById("setor").value.trim();
    const tipoExame = document.getElementById("tipoExame").value;
    const dataExame = document.getElementById("dataExame").value; // AAAA-MM-DD
    const medico = document.getElementById("medico").value.trim();
    const resultado = document.getElementById("resultado").value;

    if (!nome || !cpf || !funcao || !dataExame) {
        alert("⚠️ Preencha pelo menos Nome, CPF, Função e Data do Exame.");
        return;
    }

    // Objeto que bate com o AsoCreate do backend
    const aso = {
        nome,
        cpf,
        funcao,
        setor,
        tipo_exame: tipoExame,
        data_exame: dataExame,
        medico,
        resultado
    };

    try {
        await apiPost("/aso/records", aso);
    } catch (e) {
        console.error(e);
        alert("⚠️ Erro ao salvar no servidor. Veja o console para detalhes.");
        return;
    }

    await carregarASO();
    limparFormulario();

    alert("✅ Registro salvo com sucesso!");
}

async function carregarASO() {
    const tbody = document.querySelector("#tabelaASO tbody");
    tbody.innerHTML = "<tr><td colspan='6'>Carregando...</td></tr>";

    try {
        const lista = await apiGet("/aso/records");
        cacheASO = lista; // guarda para impressão / PDF

        tbody.innerHTML = "";

        if (!lista.length) {
            tbody.innerHTML = "<tr><td colspan='6'>Nenhum ASO registrado ainda.</td></tr>";
            return;
        }

        lista.forEach(item => {
            const linha = `
                <tr>
                    <td>${item.nome || ""}</td>
                    <td>${item.cpf || ""}</td>
                    <td>${item.funcao || ""}</td>
                    <td>${item.tipo_exame || ""}</td>
                    <td>${item.data_exame || ""}</td>
                    <td>${item.resultado || ""}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML("beforeend", linha);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = "<tr><td colspan='6'>Erro ao carregar registros.</td></tr>";
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

// =========================
// Funções extras dos botões
// =========================

// Imprimir a última avaliação registrada (do servidor)
async function imprimirUltimoASO() {
    try {
        if (!cacheASO.length) {
            await carregarASO();
        }

        if (!cacheASO.length) {
            alert("⚠️ Não há registros para imprimir.");
            return;
        }

        // lista vem ordenada do mais recente pro mais antigo no backend
        const ultimo = cacheASO[0];

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
            <head>
                <meta charset="utf-8">
                <title>Imprimir ASO</title>
            </head>
            <body>
                <h1>ASO – Avaliação de Saúde Ocupacional</h1>
                <p><strong>Nome:</strong> ${ultimo.nome || ""}</p>
                <p><strong>CPF:</strong> ${ultimo.cpf || ""}</p>
                <p><strong>Função:</strong> ${ultimo.funcao || ""}</p>
                <p><strong>Setor:</strong> ${ultimo.setor || ""}</p>
                <p><strong>Tipo de Exame:</strong> ${ultimo.tipo_exame || ""}</p>
                <p><strong>Data do Exame:</strong> ${ultimo.data_exame || ""}</p>
                <p><strong>Médico Responsável:</strong> ${ultimo.medico || ""}</p>
                <p><strong>Resultado:</strong> ${ultimo.resultado || ""}</p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    } catch (e) {
        console.error(e);
        alert("⚠️ Erro ao tentar imprimir o último ASO.");
    }
}

// "Exportar PDF" – ainda placeholder, mas agora usando dados do servidor
async function exportarPDF_ASO() {
    try {
        if (!cacheASO.length) {
            await carregarASO();
        }

        if (!cacheASO.length) {
            alert("⚠️ Não há registros para exportar.");
            return;
        }

        alert("📄 Exportar PDF será integrado ao backend futuramente.\n\nA função já está pronta para receber a geração de PDF usando o último registro carregado do servidor.");
    } catch (e) {
        console.error(e);
        alert("⚠️ Erro ao tentar preparar dados para exportar PDF.");
    }
}

