import { getTranslations, supportedLangs } from "./i18n.js";
import { youtubeVideos, getEmbedUrl, getThumbnailUrl } from "./videos.js";
import { loadVideoContent, loadSiteLinks } from "./firebase-content.js";

const STORAGE_LANG = "es-company-lang";
const STORAGE_INTRO = "es-company-intro-watched";

let currentLang = "fr";
let introModalBound = false;
let currentVideos = { ...youtubeVideos };

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
  iframe.setAttribute(
    "allow",
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  );
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

function stopYoutubeInContainer(container) {
  if (!container) return;
  container.replaceChildren();
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

  $$("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (t[key] !== undefined) {
      el.setAttribute("aria-label", t[key]);
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

function closeIntroModal() {
  const overlay = $("#intro-modal-overlay");
  const container = $("#intro-modal-youtube");

  localStorage.setItem(STORAGE_INTRO, "true");
  stopYoutubeInContainer(container);
  hideOverlay(overlay);
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
  const watchBtn = $("#intro-modal-watch");
  const skipBtn = $("#intro-modal-skip");
  const closeBtn = $("#intro-modal-close");

  const loadIntroVideo = () => {
    mountYoutubeEmbed(container, "pub", { autoplay: true });
  };

  watchBtn.addEventListener("click", loadIntroVideo);

  skipBtn.addEventListener("click", closeIntroModal);
  closeBtn.addEventListener("click", closeIntroModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeIntroModal();
    }
  });
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

  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("header--scrolled", window.scrollY > 20);
    },
    { passive: true }
  );

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

function initStaticYoutubeEmbeds() {
  mountYoutubeEmbed($("#intro-youtube"), "pub");
  mountYoutubeEmbed($("#tutoriel-youtube"), "tutoriel");
  initProjectThumbnails();
}

function initProjectThumbnails() {
  const stockflowMedia = $("#stockflow-media");
  const tutorielThumb = getThumbnailUrl(getVideoId("tutoriel"));

  if (stockflowMedia && tutorielThumb) {
    stockflowMedia.style.backgroundImage = `url(${tutorielThumb})`;
  }
}

function initGalleryTabs() {
  const tabs = $$(".gallery-tab");
  const cards = $$(".gallery-card");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const category = tab.dataset.category;

      tabs.forEach((t) => {
        t.classList.toggle("gallery-tab--active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });

      cards.forEach((card) => {
        const show = card.dataset.category === category;
        card.classList.toggle("gallery-card--hidden", !show);
      });
    });
  });
}

function initGalleryThumbnails() {
  $$(".gallery-card").forEach((card) => {
    const videoKey = card.dataset.youtube;
    const thumb = card.querySelector(".gallery-card__thumb");
    const videoId = getVideoId(videoKey);
    const thumbUrl = getThumbnailUrl(videoId);

    if (!thumb) return;

    if (thumbUrl) {
      const img = document.createElement("img");
      img.src = thumbUrl;
      img.alt = "";
      img.className = "gallery-card__thumbnail";
      img.setAttribute("loading", "lazy");
      thumb.insertBefore(img, thumb.firstChild);
    }
  });
}

function initGalleryCards() {
  $$(".gallery-card").forEach((card) => {
    card.addEventListener("click", () => {
      const videoKey = card.dataset.youtube;
      const thumb = card.querySelector(".gallery-card__thumb");
      const embedSlot = card.querySelector(".gallery-card__embed");

      if (!thumb || !embedSlot || embedSlot.querySelector("iframe")) return;

      const iframe = mountYoutubeEmbed(embedSlot, videoKey, { autoplay: true });
      if (!iframe) return;

      thumb.classList.add("gallery-card__thumb--hidden");
      embedSlot.classList.add("gallery-card__embed--active");
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
  document.documentElement.classList.add("js-ready");

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

function updateLinksFromFirebase(links) {
  if (!Array.isArray(links) || links.length === 0) return;

  const linkMap = new Map();
  links.forEach((item) => {
    linkMap.set(item.key, item.url);
  });

  const cbcUrl = linkMap.get("cbc_station");
  if (cbcUrl) {
    const cbcCta = $("#cbc-cta");
    if (cbcCta) cbcCta.setAttribute("href", cbcUrl);
  }

  const stockflowUrl = linkMap.get("stockflow");
  if (stockflowUrl) {
    const stockflowCta = $("#stockflow-cta");
    if (stockflowCta) {
      stockflowCta.setAttribute("href", stockflowUrl);
      stockflowCta.setAttribute("target", "_blank");
      stockflowCta.setAttribute("rel", "noopener noreferrer");
    }
  }

  const tutorialsUrl = linkMap.get("tutorials_page");
  if (tutorialsUrl) {
    const ids = ["nav-tutorials-link", "footer-tutorials-link"];
    ids.forEach((id) => {
      const el = $(`#${id}`);
      if (el) el.setAttribute("href", tutorialsUrl);
    });
  }

  const mediaUrl = linkMap.get("media_page");
  if (mediaUrl) {
    const ids = ["nav-media-link", "footer-media-link"];
    ids.forEach((id) => {
      const el = $(`#${id}`);
      if (el) el.setAttribute("href", mediaUrl);
    });
  }
}

async function initApp() {
  const savedLang = localStorage.getItem(STORAGE_LANG);
  if (savedLang && supportedLangs.includes(savedLang)) {
    setLanguage(savedLang);
  } else {
    setLanguage("fr");
  }

  const [videoContent, siteLinks] = await Promise.all([
    loadVideoContent(),
    loadSiteLinks(),
  ]);
  currentVideos = { ...youtubeVideos, ...videoContent };

  updateLinksFromFirebase(siteLinks);
  initStaticYoutubeEmbeds();
  initGalleryThumbnails();
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

document.addEventListener("DOMContentLoaded", () => {
  initApp().catch((error) => {
    console.error("Init error:", error);
    initStaticYoutubeEmbeds();
    initGalleryThumbnails();
    initLanguageWelcome();
    initLangSelector();
    initHeader();
    initGalleryTabs();
    initGalleryCards();
    initContactForm();
    initFadeIn();
  });
});
