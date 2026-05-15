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

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateBR(dateStr) {
  if (!dateStr) return "-";

  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return dateStr < todayISO();
}

function getPlanStatus(user) {
  if (!user.is_active) {
    return {
      text: "Inativo",
      className: "status-inactive"
    };
  }

  if (isExpired(user.plan_expires_at)) {
    return {
      text: "Vencido",
      className: "status-expired"
    };
  }

  return {
    text: "Ativo",
    className: "status-active"
  };
}

function setDefaultExpirationDate() {
  const input = document.getElementById("plan_expires_at");

  if (input && !input.value) {
    input.value = addDaysISO(30);
  }
}

async function loadUsers() {
  const table = document.getElementById("usersTable");

  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="7">Carregando usuários...</td>
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
          <td colspan="7">Erro ao carregar usuários.</td>
        </tr>
      `;
      console.error("Erro ao listar usuários:", res.status, data);
      return;
    }

    if (!data.length) {
      table.innerHTML = `
        <tr>
          <td colspan="7">Nenhum usuário cadastrado.</td>
        </tr>
      `;
      return;
    }

    table.innerHTML = data.map(user => {
      const status = getPlanStatus(user);

      return `
        <tr>
          <td>${user.name || "-"}</td>
          <td>${user.email || "-"}</td>
          <td>${user.role || "-"}</td>
          <td>${user.plan || "-"}</td>
          <td>${formatDateBR(user.plan_expires_at)}</td>
          <td>
            <span class="${status.className}">
              ${status.text}
            </span>
          </td>
          <td>
            <div class="actions">
              <button
                class="action-btn ${user.is_active ? "btn-disable" : "btn-enable"}"
                onclick="toggleUser(${user.id})"
              >
                ${user.is_active ? "Inativar" : "Ativar"}
              </button>

              <button
                class="action-btn btn-renew"
                onclick="renewPlan(${user.id})"
              >
                Renovar +30 dias
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("Erro de conexão:", err);

    table.innerHTML = `
      <tr>
        <td colspan="7">Erro de conexão com o servidor.</td>
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
  const plan_expires_at = document.getElementById("plan_expires_at").value;

  if (!name || !email || !password) {
    setMsg("Preencha nome, e-mail e senha.", true);
    return;
  }

  if (!plan_expires_at) {
    setMsg("Informe a data de vencimento do plano.", true);
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
        company_id: null,
        plan_expires_at
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
    document.getElementById("plan_expires_at").value = addDaysISO(30);

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

async function renewPlan(userId) {
  if (!confirm("Deseja renovar este plano por mais 30 dias?")) return;

  try {
    const res = await fetch(`${API_BASE}/auth/users/${userId}/renew-plan?days=30`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.detail || "Erro ao renovar plano.");
      return;
    }

    loadUsers();

  } catch (err) {
    console.error("Erro de conexão:", err);
    alert("Erro de conexão com o servidor.");
  }
}

setDefaultExpirationDate();
loadUsers();
