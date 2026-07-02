import { getTranslations, supportedLangs } from "./i18n.js";

const STORAGE_LANG = "es-company-lang";

const $$ = (selector) => document.querySelectorAll(selector);

export function applyMediaLanguage() {
  const savedLang = localStorage.getItem(STORAGE_LANG);
  const lang = supportedLangs.includes(savedLang) ? savedLang : "fr";
  const t = getTranslations(lang);
  document.documentElement.lang = lang;
  document.title = t.metaTitle;

  $$("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] !== undefined) el.textContent = t[key];
  });
}

export function initMediaLangSelector() {
  const savedLang = localStorage.getItem(STORAGE_LANG);
  const lang = supportedLangs.includes(savedLang) ? savedLang : "fr";
  $$(".lang-selector__btn").forEach((btn) => {
    btn.classList.toggle("lang-selector__btn--active", btn.dataset.lang === lang);
    btn.addEventListener("click", () => {
      localStorage.setItem(STORAGE_LANG, btn.dataset.lang);
      window.location.reload();
    });
  });
}

