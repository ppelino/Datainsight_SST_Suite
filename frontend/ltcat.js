// ===============================
// LTCAT – Registros básicos
// ===============================

document.addEventListener("DOMContentLoaded", carregarLTCAT);

function salvarLTCAT() {
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

    const tbody = document.querySelector("#tabelaLTCAT tbody");
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
        return (
            (item.empresa || "").toLowerCase().includes(termo) ||
            (item.setor || "").toLowerCase().includes(termo) ||
            (item.funcao || "").toLowerCase().includes(termo) ||
            (item.agente || "").toLowerCase().includes(termo)
        );
    });

    carregarLTCAT(filtrada);
}

// -------- Relatório: última avaliação --------

function obterUltimoLTCAT() {
    let lista = JSON.parse(localStorage.getItem("registrosLTCAT")) || [];
    if (lista.length === 0) return null;

    const ultimoId = localStorage.getItem("ultimoLTCATId");
    if (ultimoId) {
        const achado = lista.find(r => String(r.id) === ultimoId);
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
            <td style="padding:4px 0;"><strong>Data da avaliação:</strong> ${r.data || "-"}</td>
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
            <td style="padding:4px 0;"><strong>Jornada / dias semanais:</strong> ${r.jornada || "-"} h, ${r.diasSemana || "-"} dias/sem</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Tempo de exposição:</strong> ${r.tempoAnos || "-"} anos</td>
            <td style="padding:4px 0;"><strong>EPC / EPI eficaz:</strong> ${r.epiEficaz || "-"}</td>
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
          essenciais para sua elaboração, em conformidade com a legislação pr
