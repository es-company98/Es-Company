import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  limit,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getFirebaseAuth, getFirestoreDb } from "./firebase-core.js";

function normalizeRole(role) {
  const safe = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (safe === "admin" || safe === "editor" || safe === "member") return safe;
  return "member";
}

export async function registerUser(email, password, profile) {
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  if (!auth || !db) throw new Error("Firebase non configuré");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const userDocRef = doc(db, "users", cred.user.uid);
  await setDoc(userDocRef, {
    email,
    displayName: profile?.displayName || "",
    role: "member",
    approved: false,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return cred.user;
}

export async function loginUser(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase non configuré");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export async function getUserProfile(uid) {
  const db = getFirestoreDb();
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    email: data.email || null,
    role: normalizeRole(data.role),
    approved: Boolean(data.approved),
    active: data.active !== false,
    displayName: data.displayName || "",
  };
}

export function watchAuthState(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null, null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }
    const profile = await getUserProfile(user.uid);
    callback(user, profile);
  });
}

export function canAccessProtectedContent(profile) {
  if (!profile || !profile.active) return false;
  return profile.approved && (profile.role === "admin" || profile.role === "editor" || profile.role === "member");
}

export function canAccessAdmin(profile) {
  if (!profile || !profile.active) return false;
  return profile.approved && profile.role === "admin";
}

export async function loadPendingUsers() {
  const db = getFirestoreDb();
  if (!db) return [];
  const q = query(collection(db, "users"), where("approved", "==", false), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function approveUser(uid, role = "member") {
  const db = getFirestoreDb();
  if (!db || !uid) return false;
  await updateDoc(doc(db, "users", uid), {
    approved: true,
    role: normalizeRole(role),
    updatedAt: serverTimestamp(),
  });
  return true;
}

