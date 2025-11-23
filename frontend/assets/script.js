const API = "https://datainsight-sst-suite.onrender.com";

async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("password").value;

  const msg = document.getElementById("msg");
  msg.innerText = "Entrando...";
  
  try {
    const req = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: senha })
    });

    const res = await req.json();
    console.log("Resposta do login:", req.status, res);

    if (req.ok && res.access_token) {
      // Login OK
      localStorage.setItem("token", res.access_token);
      window.location.href = "dashboard.html";
    } else {
      // Login recusado pela API
      msg.innerText = res.detail || "E-mail ou senha inválidos.";
    }
  } catch (erro) {
    console.error("Erro na requisição:", erro);
    msg.innerText = "Erro ao conectar com o servidor.";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}


