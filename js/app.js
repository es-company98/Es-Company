import { getTranslations, supportedLangs } from "./i18n.js";

const STORAGE_LANG = "es-company-lang";
const STORAGE_INTRO = "es-company-intro-watched";

let currentLang = "fr";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

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
    if (t[key] !== undefined) {
      el.textContent = t[key];
    }
  });

  $$("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] !== undefined) {
      el.setAttribute("placeholder", t[key]);
    }
  });

  $$(".lang-selector__btn").forEach((btn) => {
    btn.classList.toggle("lang-selector__btn--active", btn.dataset.lang === lang);
  });

  updateDynamicContent();
}

function hideOverlay(overlay) {
  overlay.classList.add("overlay--hidden");
}

function showOverlay(overlay) {
  overlay.classList.remove("overlay--hidden");
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

function initIntroModal() {
  const overlay = $("#intro-modal-overlay");
  if (!overlay) return;

  if (localStorage.getItem(STORAGE_INTRO) === "true") {
    hideOverlay(overlay);
    return;
  }

  showOverlay(overlay);

  const video = $("#intro-modal-video");
  const watchBtn = $("#intro-modal-watch");
  const skipBtn = $("#intro-modal-skip");

  const markWatched = () => {
    localStorage.setItem(STORAGE_INTRO, "true");
    hideOverlay(overlay);
    if (video) video.pause();
  };

  watchBtn.addEventListener("click", () => {
    if (video) {
      video.play().catch(() => {});
    }
  });

  if (video) {
    video.addEventListener("ended", markWatched);
  }

  skipBtn.addEventListener("click", markWatched);
}

function initLangSelector() {
  $$(".lang-selector__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
    });
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
    const expanded = navList.classList.contains("nav__list--open");
    toggle.setAttribute("aria-expanded", String(expanded));
  });

  $$(".nav__link").forEach((link) => {
    link.addEventListener("click", () => {
      navList.classList.remove("nav__list--open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function buildSolutionTags(container, tagsString) {
  container.replaceChildren();
  const fragment = document.createDocumentFragment();
  tagsString.split(",").forEach((tag) => {
    const span = document.createElement("span");
    span.className = "solution-card__tag";
    span.textContent = tag.trim();
    fragment.appendChild(span);
  });
  container.appendChild(fragment);
}

function buildProjectFeatures(container, featuresString) {
  container.replaceChildren();
  const fragment = document.createDocumentFragment();
  featuresString.split(",").forEach((feat) => {
    const span = document.createElement("span");
    span.className = "project-card__feature";
    span.textContent = feat.trim();
    fragment.appendChild(span);
  });
  container.appendChild(fragment);
}

function updateDynamicContent() {
  const t = getTranslations(currentLang);

  buildSolutionTags($("#solution1-tags"), t.solution1Tags);
  buildSolutionTags($("#solution2-tags"), t.solution2Tags);
  buildSolutionTags($("#solution3-tags"), t.solution3Tags);
  buildSolutionTags($("#solution4-tags"), t.solution4Tags);
  buildProjectFeatures($("#stockflow-features"), t.stockflowFeatures);
}

function initGalleryTabs() {
  const tabs = $$(".gallery-tab");
  const cards = $$(".gallery-card");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const category = tab.dataset.category;

      tabs.forEach((t) => t.classList.toggle("gallery-tab--active", t === tab));

      cards.forEach((card) => {
        const show = card.dataset.category === category;
        card.classList.toggle("gallery-card--hidden", !show);
      });
    });
  });
}

function initGalleryCards() {
  $$(".gallery-card").forEach((card) => {
    card.addEventListener("click", () => {
      const video = card.querySelector("video");
      if (video) {
        video.play().catch(() => {});
      }
    });
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeInput(value) {
  return value.trim().replace(/[<>]/g, "");
}

function initContactForm() {
  const form = $("#contact-form");
  const message = $("#form-message-status");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const t = getTranslations(currentLang);
    const name = sanitizeInput($("#form-name").value);
    const company = sanitizeInput($("#form-company").value);
    const email = sanitizeInput($("#form-email").value);
    const msg = sanitizeInput($("#form-message").value);

    message.className = "form-message";
    message.textContent = "";

    if (!name || !email || !msg || !validateEmail(email)) {
      message.className = "form-message form-message--error";
      message.textContent = t.formError;
      return;
    }

    message.className = "form-message form-message--success";
    message.textContent = t.formSuccess;
    form.reset();

    void company;
  });
}

function initFadeIn() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  $$(".fade-in").forEach((el) => observer.observe(el));
}

function initApp() {
  const savedLang = localStorage.getItem(STORAGE_LANG);
  if (savedLang && supportedLangs.includes(savedLang)) {
    setLanguage(savedLang);
  } else {
    setLanguage("fr");
  }

  initLanguageWelcome();
  initLangSelector();
  initHeader();
  initGalleryTabs();
  initGalleryCards();
  initContactForm();
  initFadeIn();

  if (localStorage.getItem(STORAGE_LANG)) {
    initIntroModal();
  }
}

document.addEventListener("DOMContentLoaded", initApp);

