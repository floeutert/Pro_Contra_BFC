import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Topic {
  id: string;
  title: string;
  description: string;
  createdAt: Timestamp | null;
}

export interface Point {
  id: string;
  type: "pro" | "contra";
  text: string;
  createdAt: Timestamp | null;
}

// ─── Topics ───────────────────────────────────────────────────────────────────

export async function addTopic(title: string, description: string) {
  return addDoc(collection(db, "topics"), {
    title,
    description,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToTopics(callback: (topics: Topic[]) => void) {
  const q = query(collection(db, "topics"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const topics = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Topic));
    callback(topics);
  });
}

export async function deleteTopic(topicId: string) {
  return deleteDoc(doc(db, "topics", topicId));
}

// ─── Points ───────────────────────────────────────────────────────────────────

export async function addPoint(topicId: string, type: "pro" | "contra", text: string) {
  return addDoc(collection(db, "topics", topicId, "points"), {
    type,
    text,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToPoints(topicId: string, callback: (points: Point[]) => void) {
  const q = query(
    collection(db, "topics", topicId, "points"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const points = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Point));
    callback(points);
  });
}

export async function deletePoint(topicId: string, pointId: string) {
  return deleteDoc(doc(db, "topics", topicId, "points", pointId));
}
