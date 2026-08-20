const API_URL =
  "https://vyntra-ai-api.ezhilarasanpofficial.workers.dev";

let adminSecret = "";


// ==========================================
// ADMIN LOGIN
// ==========================================

async function adminLogin() {

  const input =
    document.getElementById("adminSecret");

  const message =
    document.getElementById("message");

  adminSecret = input.value.trim();

  if (!adminSecret) {
    message.textContent =
      "Enter Admin Secret.";
    return;
  }

  message.textContent = "Checking...";

  try {

    const response = await fetch(
      `${API_URL}/admin/pending`,
      {
        method: "GET",

        headers: {
          "X-Admin-Secret": adminSecret
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {

      message.textContent =
        data.error || "Admin login failed.";

      adminSecret = "";
      return;
    }

    // Login successful

    message.textContent = "";

    document.getElementById(
      "loginSection"
    ).style.display = "none";

    document.getElementById(
      "dashboard"
    ).style.display = "block";

    renderRequests(data.users || []);

  } catch (error) {

    console.error(error);

    message.textContent =
      "Unable to connect to VYNTRA API.";

  }
}


// ==========================================
// LOAD PENDING REQUESTS
// ==========================================

async function loadRequests() {

  const container =
    document.getElementById("requests");

  container.innerHTML = "Loading...";

  try {

    const response = await fetch(
      `${API_URL}/admin/pending`,
      {
        method: "GET",

        headers: {
          "X-Admin-Secret": adminSecret
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {

      container.textContent =
        data.error ||
        "Could not load requests.";

      return;
    }

    renderRequests(data.users || []);

  } catch (error) {

    console.error(error);

    container.textContent =
      "Unable to connect to server.";

  }
}


// ==========================================
// DISPLAY REQUESTS
// ==========================================

function renderRequests(users) {

  const container =
    document.getElementById("requests");

  container.innerHTML = "";

  if (!users.length) {

    container.innerHTML =
      "<p>No pending access requests.</p>";

    return;
  }

  users.forEach(user => {

    const card =
      document.createElement("div");

    card.className = "request-card";


    const email =
      document.createElement("div");

    email.className = "email";

    email.textContent =
      user.email || "Unknown email";


    const name =
      document.createElement("div");

    name.className = "name";

    name.textContent =
      user.name || "No name";


    const approve =
      document.createElement("button");

    approve.className = "approve";

    approve.textContent = "Approve";

    approve.onclick = () =>
      updateAccess(
        user.email,
        "approved",
        card
      );


    const deny =
      document.createElement("button");

    deny.className = "deny";

    deny.textContent = "Deny";

    deny.onclick = () =>
      updateAccess(
        user.email,
        "denied",
        card
      );


    card.appendChild(email);
    card.appendChild(name);
    card.appendChild(approve);
    card.appendChild(deny);

    container.appendChild(card);

  });

}


// ==========================================
// APPROVE / DENY USER
// ==========================================

async function updateAccess(
  email,
  status,
  card
) {

  if (!adminSecret) {
    alert("Admin session expired.");
    return;
  }

  const action =
    status === "approved"
      ? "approve"
      : "deny";

  const confirmed = confirm(
    `Are you sure you want to ${action} ${email}?`
  );

  if (!confirmed) {
    return;
  }

  const buttons =
    card.querySelectorAll("button");

  buttons.forEach(button => {
    button.disabled = true;
  });


  try {

    const response = await fetch(
      `${API_URL}/admin/update-access`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "X-Admin-Secret":
            adminSecret
        },

        body: JSON.stringify({
          email: email,
          status: status
        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.error ||
        "Unable to update access."
      );

      buttons.forEach(button => {
        button.disabled = false;
      });

      return;
    }


    // Remove completed request
    card.remove();


    // Check whether list became empty
    const container =
      document.getElementById("requests");

    if (
      !container.querySelector(
        ".request-card"
      )
    ) {

      container.innerHTML =
        "<p>No pending access requests.</p>";

    }


    alert(
      status === "approved"
        ? `${email} approved successfully.`
        : `${email} denied.`
    );


  } catch (error) {

    console.error(error);

    alert(
      "Unable to connect to VYNTRA API."
    );

    buttons.forEach(button => {
      button.disabled = false;
    });

  }

}