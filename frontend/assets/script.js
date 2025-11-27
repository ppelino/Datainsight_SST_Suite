// ===============================
// Configuração API (mesma do NR-17)
// ===============================
const API_BASE = "https://datainsight-sst-suite.onrender.com";

// Mostrar mensagens na tela de login
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
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    setLoginMessage("Informe e-mail e senha.", true);
    return;
  }

  setLoginMessage("Conectando...", false);

  try {
    // MESMA ROTA QUE VOCÊ USOU NO SWAGGER: /api/login
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        username: email,
        password: password,
        grant_type: "password",
      }),
    });

    if (!res.ok) {
      // 401 = credenciais inválidas, outros códigos = erro de servidor
      if (res.status === 401) {
        setLoginMessage("Usuário ou senha inválidos.", true);
        return;
      }
      const txt = await res.text().catch(() => "");
      console.error("Erro ao fazer login:", res.status, txt);
      setLoginMessage("Erro ao fazer login no servidor.", true);
      return;
    }

    // O backend pode devolver só uma string ou um JSON com access_token
    let token;
    let data = null;

    try {
      data = await res.json();
    } catch {
      // se não for JSON, tenta como texto simples
      const txt = await res.text();
      if (txt && typeof txt === "string") {
        token = txt;
      }
    }

    if (!token && data) {
      if (typeof data === "string") {
        token = data;
      } else if (data.access_token) {
        token = data.access_token;
      }
    }

    if (!token) {
      console.error("Resposta inesperada do login:", data);
      setLoginMessage("Login realizado, mas resposta inesperada da API.", true);
      return;
    }

    // guarda token e redireciona
    localStorage.setItem("authToken", token);
    setLoginMessage("Login realizado com sucesso. Redirecionando...");

    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Falha de conexão com API:", err);
    alert("Erro de conexão com o servidor API."); // mesma mensagem que você via
    setLoginMessage("Erro de conexão com o servidor API.", true);
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


