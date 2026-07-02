import { approveUser, canAccessAdmin, loadPendingUsers, watchAuthState } from "../../js/firebase-auth.js";
import { initHeader } from "../../js/page-common.js";

const $ = (selector) => document.querySelector(selector);

function renderDenied() {
  const status = $("#admin-status");
  const list = $("#pending-users");
  status.textContent = "Accès refusé: admin approuvé requis.";
  list.replaceChildren();
}

async function renderPendingUsers() {
  const list = $("#pending-users");
  list.replaceChildren();
  const users = await loadPendingUsers();
  if (!users.length) {
    const p = document.createElement("p");
    p.className = "youtube-placeholder";
    p.textContent = "Aucun utilisateur en attente.";
    list.appendChild(p);
    return;
  }
  const fragment = document.createDocumentFragment();
  users.forEach((u) => {
    const card = document.createElement("article");
    card.className = "firebase-card";

    const email = document.createElement("p");
    email.textContent = `Email: ${u.email || "N/A"}`;

    const role = document.createElement("p");
    role.textContent = `Role demandé: ${u.role || "member"}`;

    const btn = document.createElement("button");
    btn.className = "btn btn--primary";
    btn.textContent = "Approuver (member)";
    btn.addEventListener("click", async () => {
      await approveUser(u.uid, "member");
      await renderPendingUsers();
    });

    card.appendChild(email);
    card.appendChild(role);
    card.appendChild(btn);
    fragment.appendChild(card);
  });
  list.appendChild(fragment);
}

function initAdmin() {
  initHeader();
  watchAuthState(async (_user, profile) => {
    if (!canAccessAdmin(profile)) {
      renderDenied();
      return;
    }
    $("#admin-status").textContent = "Accès admin confirmé.";
    await renderPendingUsers();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAdmin();
});

