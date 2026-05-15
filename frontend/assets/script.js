// ===============================
// Configuração API
// ===============================
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// ===============================
// Mensagem do login
// ===============================
function setLoginMessage(text, isError = false) {
  const el = document.getElementById("msg");
  if (!el) return;

  el.textContent = text || "";
  el.style.color = isError ? "#dc2626" : "#16a34a";
}

// ===============================
// Função de login
// ===============================
async function login() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    setLoginMessage("Informe e-mail e senha.", true);
    return;
  }

  setLoginMessage("Conectando...", false);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        username: email,
        password: password
      })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Erro login:", res.status, data);

      const detalhe = data?.detail;

      if (res.status === 400) {
        setLoginMessage(detalhe || "Usuário ou senha inválidos.", true);
      } else if (res.status === 403) {
        setLoginMessage(detalhe || "Usuário inativo. Procure o administrador.", true);
      } else if (res.status === 422) {
        setLoginMessage("Erro de validação. Verifique e-mail e senha.", true);
      } else if (res.status === 404) {
        setLoginMessage("Rota de login não encontrada no servidor.", true);
      } else {
        setLoginMessage(`Erro ao fazer login. Código ${res.status}.`, true);
      }

      return;
    }

    if (!data || !data.access_token) {
      setLoginMessage("Login realizado, mas a API não retornou token.", true);
      return;
    }

    // ===============================
    // Guarda dados da sessão
    // ===============================
    localStorage.setItem("authToken", data.access_token);
    localStorage.setItem("userName", data.name || "");
    localStorage.setItem("userEmail", data.email || email);
    localStorage.setItem("userRole", data.role || "user");
    localStorage.setItem("userPlan", data.plan || "free");
    localStorage.setItem("companyId", data.company_id || "");
    localStorage.setItem("isActive", String(data.is_active ?? true));

    setLoginMessage("Login realizado com sucesso. Redirecionando...");

    setTimeout(() => {
      if (data.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    }, 700);

  } catch (err) {
    console.error("Falha de conexão com o servidor:", err);
    setLoginMessage("Erro de conexão com o servidor.", true);
  }
}

// ===============================
// Proteção de páginas internas
// ===============================
function requireAuth() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "index.html";
    return false;
  }

  return true;
}

// ===============================
// Logout
// ===============================
function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userPlan");
  localStorage.removeItem("companyId");
  localStorage.removeItem("isActive");

  window.location.href = "index.html";
}

// ===============================
// Atalho: Enter faz login
// ===============================
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (email || password) {
      login();
    }
  }
});
