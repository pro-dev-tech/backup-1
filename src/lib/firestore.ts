// ============================================
// Firestore Service Layer – All CRUD operations
// ============================================

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, limit, serverTimestamp, Timestamp,
  type DocumentData, type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

// ---- Helpers ----
function userCol(uid: string, col: string) {
  return collection(db, "users", uid, col);
}

function userDoc(uid: string, ...path: string[]) {
  return doc(db, "users", uid, ...path);
}

// ---- User Profile ----
export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function setUserProfile(uid: string, data: DocumentData) {
  await setDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ---- Settings ----
export async function getUserSettings(uid: string) {
  const snap = await getDoc(userDoc(uid, "settings", "preferences"));
  return snap.exists() ? snap.data() : null;
}

export async function setUserSettings(uid: string, data: DocumentData) {
  await setDoc(userDoc(uid, "settings", "preferences"), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// ---- Chat Messages ----
export async function getChatMessages(uid: string, maxMessages = 100) {
  const q = query(userCol(uid, "chatMessages"), orderBy("createdAt", "asc"), limit(maxMessages));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addChatMessage(uid: string, message: DocumentData) {
  return addDoc(userCol(uid, "chatMessages"), { ...message, createdAt: serverTimestamp() });
}

export async function clearChatMessages(uid: string) {
  const snap = await getDocs(userCol(uid, "chatMessages"));
  const deletes = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletes);
}

// ---- Calendar Events ----
export async function getCalendarEvents(uid: string) {
  const snap = await getDocs(userCol(uid, "calendarEvents"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCalendarEvent(uid: string, event: DocumentData) {
  const ref = await addDoc(userCol(uid, "calendarEvents"), { ...event, createdAt: serverTimestamp() });
  return { id: ref.id, ...event };
}

export async function deleteCalendarEvent(uid: string, eventId: string) {
  await deleteDoc(userDoc(uid, "calendarEvents", eventId));
}

// ---- Integrations / Evaluations ----
export async function getEvaluations(uid: string) {
  const snap = await getDocs(userCol(uid, "evaluations"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function setEvaluation(uid: string, platformId: string, data: DocumentData) {
  await setDoc(userDoc(uid, "evaluations", platformId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getAuditTrail(uid: string) {
  const q = query(userCol(uid, "auditTrail"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addAuditEntry(uid: string, entry: DocumentData) {
  await addDoc(userCol(uid, "auditTrail"), { ...entry, createdAt: serverTimestamp() });
}

// ---- Compliance Score (derived from evaluations) ----
export async function getComplianceScore(uid: string) {
  const evals = await getEvaluations(uid);
  if (evals.length === 0) return { score: 0, hasData: false };

  const totalViolations = evals.reduce((sum: number, e: any) => sum + (e.violations?.length || 0), 0);
  const totalRules = evals.reduce((sum: number, e: any) => sum + (e.rulesChecked || 0), 0);

  if (totalRules === 0) return { score: 100, hasData: true };
  const score = Math.max(0, Math.round(100 - (totalViolations / totalRules) * 100));
  return { score, hasData: true, totalViolations, evaluatedPlatforms: evals.length, evals };
}

// ---- Managed Users ----
export async function getManagedUsers(uid: string) {
  const snap = await getDocs(userCol(uid, "managedUsers"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addManagedUser(uid: string, userData: DocumentData) {
  const ref = await addDoc(userCol(uid, "managedUsers"), { ...userData, createdAt: serverTimestamp(), active: true });
  return { id: ref.id, ...userData, active: true };
}

export async function deleteManagedUser(uid: string, userId: string) {
  await deleteDoc(userDoc(uid, "managedUsers", userId));
}

export async function toggleManagedUser(uid: string, userId: string, active: boolean) {
  await updateDoc(userDoc(uid, "managedUsers", userId), { active: !active });
}

// ---- Document Storage Metadata ----
export async function addDocumentMeta(uid: string, meta: DocumentData) {
  return addDoc(userCol(uid, "documents"), { ...meta, createdAt: serverTimestamp() });
}

export async function getDocuments(uid: string) {
  const snap = await getDocs(userCol(uid, "documents"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
