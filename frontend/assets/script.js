// ===============================
// Supabase Auth (Email + Senha)
// ===============================

// 1) Cole aqui os dados do seu projeto Supabase:
// Supabase -> Settings -> API -> Project URL / anon public key
const SUPABASE_URL = "https://abcd1234efgh5678.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";



// ===============================
// Mensagem embaixo do botão
// ===============================
function setLoginMessage(text, isError = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text || "";
  el.style.color = isError ? "#dc2626" : "#16a34a";
}

// ===============================
// Carrega Supabase JS via CDN (sem precisar mexer no build)
// ===============================
async function getSupabaseClient() {
  // UMD disponível em window.supabase
  if (!window.supabase) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Falha ao carregar supabase-js"));
      document.head.appendChild(s);
    });
  }
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ===============================
// Limpa hashes antigos do tipo #error=otp_expired (para não travar a página)
// ===============================
(function clearHashErrors() {
  if (location.hash && location.hash.includes("error=")) {
    history.replaceState(null, "", location.pathname + location.search);
  }
})();

// ===============================
// Função de login (Supabase)
// ===============================
async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    setLoginMessage("Informe e-mail e senha.", true);
    return;
  }

  setLoginMessage("Conectando...", false);

  try {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();

      if (msg.includes("invalid login credentials")) {
        setLoginMessage("Usuário ou senha inválidos.", true);
      } else if (msg.includes("email not confirmed")) {
        setLoginMessage("E-mail não confirmado. Fale com o administrador.", true);
      } else if (msg.includes("captcha")) {
        setLoginMessage("Bloqueado por segurança (captcha/rate limit). Tente mais tarde.", true);
      } else {
        setLoginMessage(`Erro ao fazer login: ${error.message}`, true);
      }
      return;
    }

    // Guarda token (se você ainda quiser usar token no resto do app)
    // OBS: no Supabase, o ideal é usar supabase.auth.getSession(), mas manteremos simples.
    const accessToken = data?.session?.access_token;
    if (accessToken) {
      localStorage.setItem("authToken", accessToken);
    }

    setLoginMessage("Login realizado com sucesso. Redirecionando...");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);
  } catch (err) {
    console.error("Falha de conexão/auth:", err);
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

// Expõe login para o onclick do botão no HTML
window.login = login;


