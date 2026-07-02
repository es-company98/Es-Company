import { getTranslations, supportedLangs } from "./i18n.js";
import { youtubeVideos, getEmbedUrl, getThumbnailUrl } from "./videos.js";
import { loadSiteLinks, loadVideoContent, saveContactMessage, saveNewsletterEmail } from "./firebase-content.js";
import { canAccessAdmin, canAccessProtectedContent, loginUser, logoutUser, registerUser, watchAuthState } from "./firebase-auth.js";

const STORAGE_LANG = "es-company-lang";
const STORAGE_INTRO = "es-company-intro-watched";
const WHATSAPP_NUMBER = "243843858955";

let currentLang = "fr";
let introModalBound = false;
let currentVideos = { ...youtubeVideos };
let authMode = "login";
let authUser = null;
let authProfile = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function createYoutubeIframe(videoId, options = {}) {
  const url = getEmbedUrl(videoId, options);
  if (!url) return null;
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.className = "youtube-embed";
  iframe.title = options.title || "YouTube video";
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  return iframe;
}

function getVideoId(videoKey) {
  return currentVideos[videoKey] || "";
}

function mountYoutubeEmbed(container, videoKey, options = {}) {
  if (!container) return null;
  const videoId = getVideoId(videoKey);
  const iframe = createYoutubeIframe(videoId, options);
  container.replaceChildren();
  if (!iframe) {
    const placeholder = document.createElement("p");
    placeholder.className = "youtube-placeholder";
    placeholder.textContent = options.placeholderText || "Vidéo indisponible";
    container.appendChild(placeholder);
    return null;
  }
  container.appendChild(iframe);
  return iframe;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(value) {
  return value.trim().replace(/[<>]/g, "");
}

function hideOverlay(overlay) {
  if (overlay) overlay.classList.add("overlay--hidden");
}

function showOverlay(overlay) {
  if (overlay) overlay.classList.remove("overlay--hidden");
}

function setLanguage(lang) {
  if (!supportedLangs.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_LANG, lang);
  document.documentElement.lang = lang;
  const t = getTranslations(lang);
  document.title = t.metaTitle;
  const metaDesc = $('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", t.metaDescription);

  $$("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] !== undefined) el.textContent = t[key];
  });
  $$("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] !== undefined) el.setAttribute("placeholder", t[key]);
  });
  $$("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (t[key] !== undefined) el.setAttribute("aria-label", t[key]);
  });
  $$(".lang-selector__btn").forEach((btn) => {
    btn.classList.toggle("lang-selector__btn--active", btn.dataset.lang === lang);
  });
  renderAuthState();
  updateDynamicContent();
}

function initLangSelector() {
  $$(".lang-selector__btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
}

function initHeader() {
  const header = $("#header");
  const toggle = $("#nav-toggle");
  const navList = $("#nav-list");
  window.addEventListener("scroll", () => {
    header.classList.toggle("header--scrolled", window.scrollY > 20);
  }, { passive: true });
  toggle.addEventListener("click", () => {
    navList.classList.toggle("nav__list--open");
    toggle.setAttribute("aria-expanded", String(navList.classList.contains("nav__list--open")));
  });
}

function initLanguageWelcome() {
  const overlay = $("#lang-welcome-overlay");
  const savedLang = localStorage.getItem(STORAGE_LANG);
  if (savedLang && supportedLangs.includes(savedLang)) {
    setLanguage(savedLang);
    hideOverlay(overlay);
    return;
  }
  showOverlay(overlay);
  $$(".lang-welcome__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      hideOverlay(overlay);
      initIntroModal();
    });
  });
}

function closeIntroModal() {
  localStorage.setItem(STORAGE_INTRO, "true");
  hideOverlay($("#intro-modal-overlay"));
  const c = $("#intro-modal-youtube");
  if (c) c.replaceChildren();
}

function initIntroModal() {
  const overlay = $("#intro-modal-overlay");
  if (!overlay) return;
  if (localStorage.getItem(STORAGE_INTRO) === "true") {
    hideOverlay(overlay);
    return;
  }
  showOverlay(overlay);
  if (introModalBound) return;
  introModalBound = true;
  const container = $("#intro-modal-youtube");
  $("#intro-modal-watch").addEventListener("click", () => mountYoutubeEmbed(container, "pub", { autoplay: true }));
  $("#intro-modal-skip").addEventListener("click", closeIntroModal);
  $("#intro-modal-close").addEventListener("click", closeIntroModal);
}

function buildBadges(container, values, className) {
  container.replaceChildren();
  const fragment = document.createDocumentFragment();
  values.split(",").forEach((item) => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = item.trim();
    fragment.appendChild(span);
  });
  container.appendChild(fragment);
}

function updateDynamicContent() {
  const t = getTranslations(currentLang);
  buildBadges($("#solution1-tags"), t.solution1Tags, "solution-card__tag");
  buildBadges($("#solution2-tags"), t.solution2Tags, "solution-card__tag");
  buildBadges($("#solution3-tags"), t.solution3Tags, "solution-card__tag");
  buildBadges($("#solution4-tags"), t.solution4Tags, "solution-card__tag");
  buildBadges($("#stockflow-features"), t.stockflowFeatures, "project-card__feature");
}

function renderProtectedContentState() {
  const allowed = canAccessProtectedContent(authProfile);
  const tutorialContainer = $("#tutoriel-youtube");
  if (!allowed && tutorialContainer) {
    tutorialContainer.replaceChildren();
    const p = document.createElement("p");
    p.className = "youtube-placeholder";
    p.textContent = "Contenu protégé: login + approbation admin requis.";
    tutorialContainer.appendChild(p);
  } else if (allowed) {
    mountYoutubeEmbed(tutorialContainer, "tutoriel");
  }
}

function initStaticYoutubeEmbeds() {
  mountYoutubeEmbed($("#intro-youtube"), "pub");
  renderProtectedContentState();
  const stockflowMedia = $("#stockflow-media");
  const tutorielThumb = getThumbnailUrl(getVideoId("tutoriel"));
  if (stockflowMedia && tutorielThumb) stockflowMedia.style.backgroundImage = `url(${tutorielThumb})`;
}

function initGallery() {
  const tabs = $$(".gallery-tab");
  const cards = $$(".gallery-card");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const category = tab.dataset.category;
      tabs.forEach((t) => t.classList.toggle("gallery-tab--active", t === tab));
      cards.forEach((card) => card.classList.toggle("gallery-card--hidden", card.dataset.category !== category));
    });
  });
  cards.forEach((card) => {
    const videoKey = card.dataset.youtube;
    const thumb = card.querySelector(".gallery-card__thumb");
    const embedSlot = card.querySelector(".gallery-card__embed");
    const videoId = getVideoId(videoKey);
    const thumbUrl = getThumbnailUrl(videoId);
    if (thumb && thumbUrl) {
      const img = document.createElement("img");
      img.src = thumbUrl;
      img.alt = "";
      img.className = "gallery-card__thumbnail";
      thumb.insertBefore(img, thumb.firstChild);
    }
    card.addEventListener("click", () => {
      if (videoKey !== "pub" && !canAccessProtectedContent(authProfile)) {
        openAuthModal("login");
        return;
      }
      if (!embedSlot || embedSlot.querySelector("iframe")) return;
      const iframe = mountYoutubeEmbed(embedSlot, videoKey, { autoplay: true });
      if (!iframe) return;
      thumb.classList.add("gallery-card__thumb--hidden");
      embedSlot.classList.add("gallery-card__embed--active");
    });
  });
}

function updateLinksFromFirebase(links) {
  if (!Array.isArray(links)) return;
  const map = new Map();
  links.forEach((item) => map.set(item.key, item.url));
  const mapTargets = [
    ["cbc_station", ["cbc-cta"]],
    ["stockflow", ["stockflow-cta"]],
    ["tutorials_page", ["nav-tutorials-link", "footer-tutorials-link"]],
    ["media_page", ["nav-media-link", "footer-media-link"]],
  ];
  mapTargets.forEach(([key, ids]) => {
    const url = map.get(key);
    if (!url) return;
    ids.forEach((id) => {
      const el = $(`#${id}`);
      if (el) el.setAttribute("href", url);
    });
  });
}

function getAuthUI() {
  return {
    overlay: $("#auth-modal-overlay"),
    form: $("#auth-form"),
    message: $("#auth-message"),
    title: $("#auth-modal-title"),
    subtitle: $("#auth-modal-text"),
    submit: $("#auth-submit"),
  };
}

function openAuthModal(mode) {
  authMode = mode;
  const ui = getAuthUI();
  ui.form.reset();
  ui.message.className = "form-message";
  ui.message.textContent = "";
  ui.title.textContent = mode === "signup" ? "Créer un compte" : "Connexion";
  ui.subtitle.textContent = mode === "signup"
    ? "Créez votre compte. L'accès protégé sera activé après approbation admin."
    : "Connectez-vous pour accéder au contenu protégé.";
  ui.submit.textContent = mode === "signup" ? "Créer le compte" : "Se connecter";
  showOverlay(ui.overlay);
}

function closeAuthModal() {
  hideOverlay($("#auth-modal-overlay"));
}

function renderAuthState() {
  const t = getTranslations(currentLang);
  const status = $("#auth-status");
  const adminLink = $("#admin-link");
  const loginBtn = $("#auth-open-login");
  const signupBtn = $("#auth-open-signup");
  const logoutBtn = $("#auth-logout");
  if (!authUser) {
    status.textContent = t.authGuest || "Invité";
    adminLink.classList.add("auth-admin-link--hidden");
    loginBtn.classList.remove("auth-logout-btn--hidden");
    signupBtn.classList.remove("auth-logout-btn--hidden");
    logoutBtn.classList.add("auth-logout-btn--hidden");
    return;
  }
  const role = authProfile?.role || "member";
  const approvedText = authProfile?.approved ? "approved" : "pending";
  status.textContent = `${authUser.email} (${role}, ${approvedText})`;
  if (canAccessAdmin(authProfile)) adminLink.classList.remove("auth-admin-link--hidden");
  else adminLink.classList.add("auth-admin-link--hidden");
  loginBtn.classList.add("auth-logout-btn--hidden");
  signupBtn.classList.add("auth-logout-btn--hidden");
  logoutBtn.classList.remove("auth-logout-btn--hidden");
}

function initAuth() {
  $("#auth-open-login").addEventListener("click", () => openAuthModal("login"));
  $("#auth-open-signup").addEventListener("click", () => openAuthModal("signup"));
  $("#auth-cancel").addEventListener("click", closeAuthModal);
  $("#auth-logout").addEventListener("click", async () => {
    await logoutUser();
  });
  $("#auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = $("#auth-message");
    message.className = "form-message";
    try {
      const email = sanitizeInput($("#auth-email").value);
      const password = $("#auth-password").value;
      const displayName = sanitizeInput($("#auth-name").value);
      if (!validateEmail(email) || !password || password.length < 6) throw new Error("Formulaire invalide");
      if (authMode === "signup") await registerUser(email, password, { displayName });
      else await loginUser(email, password);
      closeAuthModal();
    } catch (error) {
      message.className = "form-message form-message--error";
      message.textContent = String(error.message || "Erreur auth");
    }
  });

  watchAuthState((user, profile) => {
    authUser = user;
    authProfile = profile;
    renderAuthState();
    renderProtectedContentState();
  });
}

function initContactForm() {
  const form = $("#contact-form");
  const message = $("#form-message-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = getTranslations(currentLang);
    const name = sanitizeInput($("#form-name").value);
    const company = sanitizeInput($("#form-company").value);
    const email = sanitizeInput($("#form-email").value);
    const text = sanitizeInput($("#form-message").value);
    message.className = "form-message";
    if (!name || !validateEmail(email) || !text) {
      message.className = "form-message form-message--error";
      message.textContent = t.formError;
      return;
    }
    const saved = await saveContactMessage({
      name,
      company,
      email,
      message: text,
      userId: authUser?.uid || null,
      userEmail: authUser?.email || null,
    });
    const waText = encodeURIComponent(`Nouveau contact ES-Company\nNom: ${name}\nEntreprise: ${company}\nEmail: ${email}\nMessage: ${text}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`, "_blank", "noopener,noreferrer");
    message.className = saved ? "form-message form-message--success" : "form-message form-message--error";
    message.textContent = saved ? t.formSuccess : "Message WhatsApp envoyé, sauvegarde Firebase échouée.";
    if (saved) form.reset();
  });
}

function initNewsletter() {
  const form = $("#newsletter-form");
  const message = $("#newsletter-message");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = sanitizeInput($("#newsletter-email").value);
    message.className = "form-message";
    if (!validateEmail(email)) {
      message.className = "form-message form-message--error";
      message.textContent = "Email invalide.";
      return;
    }
    const ok = await saveNewsletterEmail(email, {
      uid: authUser?.uid || null,
      role: authProfile?.role || "guest",
      approved: Boolean(authProfile?.approved),
    });
    message.className = ok ? "form-message form-message--success" : "form-message form-message--error";
    message.textContent = ok ? "Inscription newsletter enregistrée." : "Erreur newsletter Firebase.";
    if (ok) form.reset();
  });
}

function initFadeIn() {
  document.documentElement.classList.add("js-ready");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in--visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  $$(".fade-in").forEach((el) => observer.observe(el));
}

async function initApp() {
  const savedLang = localStorage.getItem(STORAGE_LANG);
  setLanguage(savedLang && supportedLangs.includes(savedLang) ? savedLang : "fr");
  const [videoContent, siteLinks] = await Promise.all([loadVideoContent(), loadSiteLinks()]);
  currentVideos = { ...youtubeVideos, ...videoContent };
  updateLinksFromFirebase(siteLinks);
  initStaticYoutubeEmbeds();
  initGallery();
  initLanguageWelcome();
  initLangSelector();
  initHeader();
  initAuth();
  initContactForm();
  initNewsletter();
  initFadeIn();
  if (localStorage.getItem(STORAGE_LANG)) initIntroModal();
}

document.addEventListener("DOMContentLoaded", () => {
  initApp().catch((error) => {
    console.error("Init error:", error);
  });
});
