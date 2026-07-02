import { initHeader } from "./page-common.js";
import { loadVideoContent } from "./firebase-content.js";
import { getEmbedUrl } from "./videos.js";
import { applyTutorialsLanguage, initTutorialsLangSelector } from "./lang-tutorials.js";

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

function renderPlaceholder(container, text) {
  container.replaceChildren();
  const p = document.createElement("p");
  p.className = "youtube-placeholder";
  p.textContent = text;
  container.appendChild(p);
}

function renderMainTutorial(videoId) {
  const container = $("#tutorial-main-video");
  if (!container) return;
  container.replaceChildren();
  const iframe = createEmbed(videoId, "Tutoriel ES-Company");
  if (!iframe) {
    renderPlaceholder(container, "Tutoriel indisponible");
    return;
  }
  container.appendChild(iframe);
}

function renderSeries(videoId) {
  const list = $("#tutorial-series-list");
  if (!list) return;
  list.replaceChildren();
  const card = document.createElement("article");
  card.className = "firebase-card";
  const title = document.createElement("h3");
  title.className = "firebase-card__title";
  title.textContent = "Série tutoriel";
  const media = document.createElement("div");
  media.className = "firebase-card__media";
  const iframe = createEmbed(videoId, "Série tutoriel ES-Company");
  if (iframe) {
    media.appendChild(iframe);
  } else {
    const p = document.createElement("p");
    p.className = "youtube-placeholder";
    p.textContent = "Série indisponible";
    media.appendChild(p);
  }
  card.appendChild(title);
  card.appendChild(media);
  list.appendChild(card);
}

async function initTutorialsPage() {
  applyTutorialsLanguage();
  initTutorialsLangSelector();
  initHeader();

  const videos = await loadVideoContent();
  renderMainTutorial(videos.tutoriel);
  renderSeries(videos.seriesTutoriels);
}

document.addEventListener("DOMContentLoaded", () => {
  initTutorialsPage().catch((error) => {
    console.error("tutorials page error:", error);
  });
});

