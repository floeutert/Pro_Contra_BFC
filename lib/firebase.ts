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

export interface Cluster {
  id: string;
  name: string;
  order: number;
}

export interface Point {
  id: string;
  type: "pro" | "contra" | "anmerkung";
  text: string;
  clusterId?: string | null;
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

// ─── Clusters ─────────────────────────────────────────────────────────────────

const DEFAULT_CLUSTERS = ["Effizienz", "Klarheit", "Transparenz", "Kosten"];

export async function initDefaultClusters() {
  const snap = await getDocs(collection(db, "clusters"));
  if (snap.empty) {
    for (let i = 0; i < DEFAULT_CLUSTERS.length; i++) {
      await addDoc(collection(db, "clusters"), {
        name: DEFAULT_CLUSTERS[i],
        order: i,
      });
    }
  }
}

export function subscribeToClusters(callback: (clusters: Cluster[]) => void) {
  const q = query(collection(db, "clusters"), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => {
    const clusters = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cluster));
    callback(clusters);
  });
}

export async function addCluster(name: string) {
  return addDoc(collection(db, "clusters"), {
    name: name.trim(),
    order: Date.now(),
  });
}

export async function deleteCluster(clusterId: string) {
  return deleteDoc(doc(db, "clusters", clusterId));
}

// ─── Points ───────────────────────────────────────────────────────────────────

export async function addPoint(
  topicId: string,
  type: "pro" | "contra" | "anmerkung",
  text: string,
  clusterId?: string | null
) {
  return addDoc(collection(db, "topics", topicId, "points"), {
    type,
    text,
    clusterId: clusterId ?? null,
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
