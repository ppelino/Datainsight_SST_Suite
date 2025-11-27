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
// Função de login — NOVA VERSÃO
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
        email: email,
        password: password,
      }),
    });

    if (!res.ok) {
      if (res.status === 401) {
        setLoginMessage("Usuário ou senha inválidos.", true);
        return;
      }
      setLoginMessage("Erro ao fazer login no servidor.", true);
      console.error("Erro login:", await res.text());
      return;
    }

    const data = await res.json();

    if (!data.access_token) {
      setLoginMessage("Erro inesperado ao fazer login.", true);
      console.error("Resposta da API:", data);
      return;
    }

    // guarda token para as demais telas
    localStorage.setItem("authToken", data.access_token);

    setLoginMessage("Login OK! Redirecionando...");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    console.error("Falha ao conectar API:", err);
    setLoginMessage("Erro de conexão com o servidor.", true);
  }
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



