const API_BASE = "https://datainsight-sst-suite.onrender.com";

const token = localStorage.getItem("authToken");
const role = localStorage.getItem("userRole");

if (!token) {
  window.location.href = "index.html";
}

if (role !== "admin") {
  alert("Acesso permitido apenas para administrador.");
  window.location.href = "dashboard.html";
}

function setMsg(text, isError = false) {
  const el = document.getElementById("msg");
  if (!el) return;

  el.textContent = text || "";
  el.style.color = isError ? "#ef4444" : "#22c55e";
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

async function loadUsers() {
  const table = document.getElementById("usersTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="6">Carregando usuários...</td>
    </tr>
  `;

  try {
    const res = await fetch(`${API_BASE}/auth/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      table.innerHTML = `
        <tr>
          <td colspan="6">Erro ao carregar usuários.</td>
        </tr>
      `;
      console.error("Erro ao listar usuários:", res.status, data);
      return;
    }

    if (!data.length) {
      table.innerHTML = `
        <tr>
          <td colspan="6">Nenhum usuário cadastrado.</td>
        </tr>
      `;
      return;
    }

    table.innerHTML = data.map(user => `
      <tr>
        <td>${user.name || "-"}</td>
        <td>${user.email || "-"}</td>
        <td>${user.role || "-"}</td>
        <td>${user.plan || "-"}</td>
        <td>
          <span class="${user.is_active ? "status-active" : "status-inactive"}">
            ${user.is_active ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td>
          <button
            class="action-btn ${user.is_active ? "btn-disable" : "btn-enable"}"
            onclick="toggleUser(${user.id})"
          >
            ${user.is_active ? "Inativar" : "Ativar"}
          </button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Erro de conexão:", err);

    table.innerHTML = `
      <tr>
        <td colspan="6">Erro de conexão com o servidor.</td>
      </tr>
    `;
  }
}

async function createUser() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const plan = document.getElementById("plan").value;

  if (!name || !email || !password) {
    setMsg("Preencha nome, e-mail e senha.", true);
    return;
  }

  setMsg("Criando usuário...", false);

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        plan,
        company_id: null
      })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error("Erro ao criar usuário:", res.status, data);
      setMsg(data?.detail || "Erro ao criar usuário.", true);
      return;
    }

    setMsg("Usuário criado com sucesso.", false);

    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
    document.getElementById("role").value = "user";
    document.getElementById("plan").value = "free";

    loadUsers();

  } catch (err) {
    console.error("Erro de conexão:", err);
    setMsg("Erro de conexão com o servidor.", true);
  }
}

async function toggleUser(userId) {
  if (!confirm("Deseja alterar o status deste usuário?")) return;

  try {
    const res = await fetch(`${API_BASE}/auth/users/${userId}/toggle-active`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.detail || "Erro ao alterar status do usuário.");
      return;
    }

    loadUsers();

  } catch (err) {
    console.error("Erro de conexão:", err);
    alert("Erro de conexão com o servidor.");
  }
}

loadUsers();
