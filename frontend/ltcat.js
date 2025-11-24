// ===============================
// LTCAT – Registros básicos
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    console.log("LTCAT carregado");
    carregarLTCAT();
});

function salvarLTCAT() {
    console.log("salvarLTCAT chamado");

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

    if (!empresa || !setor || !funcao || !agente) {
        alert("⚠️ Preencha pelo menos Empresa, Setor, Função e Agente nocivo.");
        return;
    }

    const registro = {
        id: Date.now(),
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
        observacoes
    };

    console.log("Registro a salvar:", registro);

    let lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];
    lista.push(registro);
    localStorage.setItem("registrosLTCAT", JSON.stringify(lista));

    // marca último id salvo
    localStorage.setItem("ultimoLTCATId", String(registro.id));

    carregarLTCAT();
    limparLTCAT();

    alert("✅ Registro LTCAT salvo com sucesso!");
}

function carregarLTCAT(listaFiltrada = null) {
    let lista = listaFiltrada;
    if (!lista) {
        lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];
    }

    console.log("Carregando LTCAT, total registros:", lista.length);

    const tbody = document.querySelector("#tabelaLTCAT tbody");
    if (!tbody) {
        console.error("Elemento #tabelaLTCAT tbody não encontrado!");
        return;
    }

    tbody.innerHTML = "";

    lista.forEach(item => {
        const linha = `
            <tr>
                <td>${item.data || ""}</td>
                <td>${item.empresa || ""}</td>
                <td>${item.setor || ""}</td>
                <td>${item.funcao || ""}</td>
                <td>${item.agente || ""}</td>
                <td>${item.classificacao || ""}</td>
                <td>${item.enquadramento || ""}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML("beforeend", linha);
    });
}

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
}

// -------- Filtro simples --------
function filtrarLTCAT() {
    const termo = document.getElementById("filtroLTCAT").value.trim().toLowerCase();
    let lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];

    if (termo === "") {
        carregarLTCAT(lista);
        return;
    }

    const filtrada = lista.filter(item => {
