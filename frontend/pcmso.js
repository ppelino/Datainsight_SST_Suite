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
