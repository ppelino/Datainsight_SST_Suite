// =========================
// PCMSO / ASO – Funções
// =========================

// Carrega automaticamente os registros ao abrir a página
document.addEventListener("DOMContentLoaded", carregarASO);

function salvarASO() {
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

    // Objeto ASO
    const aso = {
        id: Date.now(),
        nome,
        cpf,
        funcao,
        setor,
        tipoExame,
        dataExame,
        medico,
        resultado
    };

    // Obtém lista anterior
    let lista = JSON.parse(localStorage.getItem("asos")) || [];

    // Adiciona novo
    lista.push(aso);

    // Grava no localStorage
    localStorage.setItem("asos", JSON.stringify(lista));

    // Atualiza a tabela
    carregarASO();

    // Limpa os campos
    limparFormulario();

    alert("✅ Registro salvo com sucesso!");
}

function carregarASO() {
    let lista = JSON.parse(localStorage.getItem("asos")) || [];
    const tbody = document.querySelector("#tabelaASO tbody");

    tbody.innerHTML = "";

    lista.forEach(item => {
        const linha = `
            <tr>
                <td>${item.nome}</td>
                <td>${item.cpf}</td>
                <td>${item.funcao}</td>
                <td>${item.tipoExame}</td>
                <td>${item.dataExame}</td>
                <td>${item.resultado}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", linha);
    });
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

// Imprimir a última avaliação registrada
function imprimirUltimoASO() {
    const lista = JSON.parse(localStorage.getItem("asos")) || [];
    if (lista.length === 0) {
        alert("⚠️ Não há registros para imprimir.");
        return;
    }

    const ultimo = lista[lista.length - 1];

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
        <html>
        <head>
            <meta charset="utf-8">
            <title>Imprimir ASO</title>
        </head>
        <body>
            <h1>ASO – Avaliação de Saúde Ocupacional</h1>
            <p><strong>Nome:</strong> ${ultimo.nome}</p>
            <p><strong>CPF:</strong> ${ultimo.cpf}</p>
            <p><strong>Função:</strong> ${ultimo.funcao}</p>
            <p><strong>Setor:</strong> ${ultimo.setor}</p>
            <p><strong>Tipo de Exame:</strong> ${ultimo.tipoExame}</p>
            <p><strong>Data do Exame:</strong> ${ultimo.dataExame}</p>
            <p><strong>Médico Responsável:</strong> ${ultimo.medico}</p>
            <p><strong>Resultado:</strong> ${ultimo.resultado}</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// "Exportar PDF" – placeholder para futura integração com backend
function exportarPDF_ASO() {
    const lista = JSON.parse(localStorage.getItem("asos")) || [];

    if (lista.length === 0) {
        alert("⚠️ Não há registros para exportar.");
        return;
    }

    alert("📄 Exportar PDF será integrado ao backend futuramente.\n\nA função já está pronta para receber a geração de PDF.");
}
