// ===============================
// Configuração API
// ===============================
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// Mensagem embaixo do botão
function setLoginMessage(text, isError = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text || "";
  el.style.color = isError ? "#dc2626" : "#16a34a";
}

// ===============================
// Função de login (usando /auth/login)
// ===============================
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    setLoginMessage("Informe e-mail e senha.", true);
    return;
  }

  setLoginMessage("Conectando...", false);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,        // casa com o modelo do backend
        username: email,     // se o modelo usar username, também funciona
        password: password,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Erro login:", res.status, txt);

      if (res.status === 401) {
        setLoginMessage("Usuário ou senha inválidos.", true);
      } else if (res.status === 422) {
        setLoginMessage("Erro de validação (422) — checar campos esperados no /auth/login.", true);
      } else if (res.status === 404) {
        setLoginMessage("Rota /auth/login não encontrada (404).", true);
      } else {
        setLoginMessage(`Erro ao fazer login no servidor. Código ${res.status}.`, true);
      }
      return;
    }

    const data = await res.json();
    console.log("Resposta login:", data);

    if (!data.access_token) {
      setLoginMessage("Login OK, mas resposta inesperada da API (sem access_token).", true);
      return;
    }

    // guarda token e redireciona
    localStorage.setItem("authToken", data.access_token);
    setLoginMessage("Login realizado com sucesso. Redirecionando...");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    console.error("Falha de conexão com o servidor:", err);
    setLoginMessage("Erro de conexão com o servidor.", true);
  }
}

// ===============================
// Atalho: Enter faz login
// ===============================
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    login();
  }
});
