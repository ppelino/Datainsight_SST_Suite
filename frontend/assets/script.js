const API = "https://SEU-BACKEND.onrender.com";

async function login() {
    let email = document.getElementById("email").value;
    let senha = document.getElementById("password").value;

    let req = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: senha })
    });

    let res = await req.json();

    if (res.access_token) {
        localStorage.setItem("token", res.access_token);
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("msg").innerText = "Erro no login";
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}
