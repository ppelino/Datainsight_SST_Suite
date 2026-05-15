// =====================================================
// DATainsight SST Suite
// Login profissional + sessão + proteção
// =====================================================

const API_BASE = "https://datainsight-sst-suite.onrender.com";

// =====================================================
// Mensagem do login
// =====================================================

function setLoginMessage(text, isError = false) {
  const el = document.getElementById("msg");

  if (!el) return;

  el.textContent = text || "";
  el.style.color = isError ? "#ef4444" : "#22c55e";
}

// =====================================================
// Loading botão
// =====================================================

function setButtonLoading(isLoading) {
  const btn = document.querySelector(".login-button");

  if (!btn) return;

  if (isLoading) {
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerHTML = "Conectando...";
  } else {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerHTML = "Entrar no sistema";
  }
}

// =====================================================
// Login principal
// =====================================================

async function login() {

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passwordInput ? passwordInput.value.trim() : "";

  if (!email || !password) {
    setLoginMessage("Informe e-mail e senha.", true);
    return;
  }

  setButtonLoading(true);
  setLoginMessage("Conectando ao servidor...", false);

  try {

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        username: email,
        password
      })
    });

    const data = await res.json().catch(() => null);

    // ==========================================
    // ERROS
    // ==========================================

    if (!res.ok) {

      console.error("Erro login:", res.status, data);

      const detalhe = data?.detail || "";

      if (res.status === 400) {

        setLoginMessage(
          detalhe || "Usuário ou senha inválidos.",
          true
        );

      } else if (res.status === 403) {

        if (
          detalhe.toLowerCase().includes("vencido")
        ) {

          setLoginMessage(
            "Seu plano está vencido. Procure o administrador.",
            true
          );

        } else {

          setLoginMessage(
            detalhe || "Usuário inativo.",
            true
          );

        }

      } else if (res.status === 404) {

        setLoginMessage(
          "Servidor de autenticação não encontrado.",
          true
        );

      } else if (res.status === 422) {

        setLoginMessage(
          "Erro de validação. Verifique os campos.",
          true
        );

      } else {

        setLoginMessage(
          `Erro ao acessar o sistema (${res.status}).`,
          true
        );

      }

      setButtonLoading(false);
      return;
    }

    // ==========================================
    // VALIDA TOKEN
    // ==========================================

    if (!data || !data.access_token) {

      setLoginMessage(
        "Login realizado, porém token inválido.",
        true
      );

      setButtonLoading(false);
      return;
    }

    // ==========================================
    // SALVA SESSÃO
    // ==========================================

    localStorage.setItem("authToken", data.access_token);

    localStorage.setItem(
      "userName",
      data.name || ""
    );

    localStorage.setItem(
      "userEmail",
      data.email || email
    );

    localStorage.setItem(
      "userRole",
      data.role || "user"
    );

    localStorage.setItem(
      "userPlan",
      data.plan || "free"
    );

    localStorage.setItem(
      "companyId",
      data.company_id || ""
    );

    localStorage.setItem(
      "isActive",
      String(data.is_active ?? true)
    );

    localStorage.setItem(
      "planExpiresAt",
      data.plan_expires_at || ""
    );

    // ==========================================
    // SUCESSO
    // ==========================================

    setLoginMessage(
      "Login realizado com sucesso. Redirecionando..."
    );

    setTimeout(() => {

      // Admin entra no dashboard premium
      // e acessa admin pelo menu
      window.location.href = "dashboard.html";

    }, 900);

  } catch (err) {

    console.error(
      "Falha de conexão:",
      err
    );

    setLoginMessage(
      "Erro de conexão com o servidor.",
      true
    );

  } finally {

    setButtonLoading(false);

  }
}

// =====================================================
// Verifica autenticação
// =====================================================

function requireAuth() {

  const token = localStorage.getItem("authToken");

  if (!token) {

    window.location.href = "index.html";
    return false;

  }

  return true;
}

// =====================================================
// Logout global
// =====================================================

function logout() {

  localStorage.clear();

  window.location.href = "index.html";
}

// =====================================================
// ENTER faz login
// =====================================================

document.addEventListener("keydown", (ev) => {

  if (ev.key === "Enter") {

    const email = document.getElementById("email");
    const password = document.getElementById("password");

    if (email || password) {
      login();
    }
  }
});

// =====================================================
// Auto focus
// =====================================================

window.addEventListener("load", () => {

  const email = document.getElementById("email");

  if (email) {
    email.focus();
  }

});
