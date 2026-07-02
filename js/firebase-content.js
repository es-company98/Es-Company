import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  limit,
  query,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let firestoreDb = null;

function getFirebaseConfig() {
  if (window.ES_FIREBASE_CONFIG && typeof window.ES_FIREBASE_CONFIG === "object") {
    return window.ES_FIREBASE_CONFIG;
  }
  return null;
}

function ensureDb() {
  if (firestoreDb) return firestoreDb;
  const config = getFirebaseConfig();
  if (!config) return null;
  const app = initializeApp(config);
  firestoreDb = getFirestore(app);
  return firestoreDb;
}

async function readCollectionDocs(name, maxItems = 20) {
  const db = ensureDb();
  if (!db) return [];
  try {
    const ref = collection(db, name);
    const snap = await getDocs(query(ref, limit(maxItems)));
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Firestore read error:", name, error);
    return [];
  }
}

function extractVideoId(urlValue) {
  if (typeof urlValue !== "string" || !urlValue.trim()) return "";
  const raw = urlValue.trim();
  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return shortMatch[1];
  const queryMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (queryMatch) return queryMatch[1];
  const embedMatch = raw.match(/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embedMatch) return embedMatch[1];
  return raw;
}

function pickFirst(items) {
  return items.length > 0 ? items[0] : null;
}

export async function loadVideoContent() {
  const pubDocs = await readCollectionDocs("videos_pub", 1);
  const tutorielDocs = await readCollectionDocs("videos_tutoriels", 1);
  const seriesDocs = await readCollectionDocs("videos_series_tutoriels", 1);
  const vlogDocs = await readCollectionDocs("videos_vlogs", 1);

  const pub = pickFirst(pubDocs);
  const tutoriel = pickFirst(tutorielDocs);
  const series = pickFirst(seriesDocs);
  const vlog = pickFirst(vlogDocs);

  return {
    pub: extractVideoId(pub?.youtubeUrl || pub?.youtubeId || ""),
    tutoriel: extractVideoId(tutoriel?.youtubeUrl || tutoriel?.youtubeId || ""),
    seriesTutoriels: extractVideoId(series?.youtubeUrl || series?.youtubeId || ""),
    vlog: extractVideoId(vlog?.youtubeUrl || vlog?.youtubeId || ""),
  };
}

export async function loadSiteLinks() {
  const docs = await readCollectionDocs("site_links", 30);
  return docs.filter((item) => typeof item.key === "string" && typeof item.url === "string");
}

export async function loadMediaImages() {
  const docs = await readCollectionDocs("media_images", 40);
  return docs.filter((item) => typeof item.imageUrl === "string" && item.imageUrl.trim());
}

