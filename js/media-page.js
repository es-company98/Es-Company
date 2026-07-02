import { initHeader } from "./page-common.js";
import { loadMediaImages, loadVideoContent } from "./firebase-content.js";
import { getEmbedUrl } from "./videos.js";
import { applyMediaLanguage, initMediaLangSelector } from "./lang-media.js";
import { canAccessProtectedContent, watchAuthState } from "./firebase-auth.js";

const $ = (selector) => document.querySelector(selector);

function createEmbed(videoId, title) {
  const url = getEmbedUrl(videoId);
  if (!url) return null;
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.className = "youtube-embed";
  iframe.title = title;
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute(
    "allow",
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  );
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  return iframe;
}

function renderVlog(videoId, allowed) {
  const container = $("#media-vlog-video");
  if (!container) return;
  container.replaceChildren();
  if (!allowed) {
    const p = document.createElement("p");
    p.className = "youtube-placeholder";
    p.textContent = "Login + approbation admin requis pour le vlog.";
    container.appendChild(p);
    return;
  }
  const iframe = createEmbed(videoId, "Vlog ES-Company");
  if (iframe) {
    container.appendChild(iframe);
    return;
  }
  const p = document.createElement("p");
  p.className = "youtube-placeholder";
  p.textContent = "Vlog indisponible";
  container.appendChild(p);
}

function renderImages(images) {
  const grid = $("#media-image-grid");
  if (!grid) return;
  grid.replaceChildren();

  if (!Array.isArray(images) || images.length === 0) {
    const p = document.createElement("p");
    p.className = "youtube-placeholder";
    p.textContent = "Aucune image disponible";
    grid.appendChild(p);
    return;
  }

  const fragment = document.createDocumentFragment();
  images.forEach((item) => {
    const card = document.createElement("article");
    card.className = "firebase-image-card";

    const img = document.createElement("img");
    img.src = item.imageUrl;
    img.alt = item.title || "Image ES-Company";
    img.loading = "lazy";
    img.className = "firebase-image-card__img";

    const caption = document.createElement("p");
    caption.className = "firebase-image-card__title";
    caption.textContent = item.title || "Image";

    card.appendChild(img);
    card.appendChild(caption);
    fragment.appendChild(card);
  });
  grid.appendChild(fragment);
}

async function initMediaPage() {
  applyMediaLanguage();
  initMediaLangSelector();
  initHeader();

  const [videos, images] = await Promise.all([loadVideoContent(), loadMediaImages()]);
  watchAuthState((_user, profile) => {
    renderVlog(videos.vlog, canAccessProtectedContent(profile));
  });
  renderImages(images);
}

document.addEventListener("DOMContentLoaded", () => {
  initMediaPage().catch((error) => {
    console.error("media page error:", error);
  });
});

