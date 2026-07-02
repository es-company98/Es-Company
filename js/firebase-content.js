import {
  collection,
  getDocs,
  limit,
  query,
  addDoc,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFirestoreDb } from "./firebase-core.js";

async function readCollectionDocs(name, maxItems = 20) {
  const db = getFirestoreDb();
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
  const docs = await readCollectionDocs("site_links", 50);
  return docs.filter((item) => typeof item.key === "string" && typeof item.url === "string");
}

export async function loadMediaImages() {
  const docs = await readCollectionDocs("media_images", 40);
  return docs.filter((item) => typeof item.imageUrl === "string" && item.imageUrl.trim());
}

export async function saveContactMessage(payload) {
  const db = getFirestoreDb();
  if (!db) return false;
  const data = {
    name: payload.name,
    company: payload.company || "",
    email: payload.email,
    message: payload.message,
    userId: payload.userId || null,
    userEmail: payload.userEmail || null,
    createdAt: serverTimestamp(),
  };
  try {
    await addDoc(collection(db, "contact_messages"), data);
    return true;
  } catch (error) {
    console.error("contact_messages write error:", error);
    return false;
  }
}

export async function saveNewsletterEmail(email, userContext) {
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    await addDoc(collection(db, "newsletter_subscribers"), {
      email,
      userId: userContext?.uid || null,
      approvedUser: Boolean(userContext?.approved),
      role: userContext?.role || "guest",
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("newsletter_subscribers write error:", error);
    return false;
  }
}

export async function loadSiteLinksByKey(key) {
  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const snap = await getDocs(query(collection(db, "site_links"), where("key", "==", key), limit(1)));
    if (snap.empty) return null;
    return snap.docs[0].data().url || null;
  } catch (error) {
    console.error("site_links key read error:", error);
    return null;
  }
}

