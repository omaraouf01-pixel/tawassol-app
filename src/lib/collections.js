// ════════════════════════════════════════════════════════════════
// Collections Firestore — TSSWAL
// ════════════════════════════════════════════════════════════════
// Firestore est schemaless, donc on définit ici :
//   1. Les noms des collections (centralisés)
//   2. Des helpers de validation (au lieu des Schemas Mongoose)
//   3. Des "shapes" par défaut pour chaque type de document
// ════════════════════════════════════════════════════════════════

import { db, FieldValue } from "./firestore";

// ─── Noms des collections ──────────────────────────────────────
export const COL = {
  USERS: "users",
  GROUPS: "groups",
  MESSAGES: "messages",
  POSTS: "posts",
  NOTIFICATIONS: "notifications",
  RESOURCES: "resources",
  JOIN_REQUESTS: "joinRequests",
};

// ─── Références rapides ────────────────────────────────────────
export const usersCol = () => db.collection(COL.USERS);
export const groupsCol = () => db.collection(COL.GROUPS);
export const messagesCol = () => db.collection(COL.MESSAGES);
export const postsCol = () => db.collection(COL.POSTS);
export const notificationsCol = () => db.collection(COL.NOTIFICATIONS);
export const resourcesCol = () => db.collection(COL.RESOURCES);
export const joinRequestsCol = () => db.collection(COL.JOIN_REQUESTS);

// ════════════════════════════════════════════════════════════════
// Validators (remplacent les schemas Mongoose)
// ════════════════════════════════════════════════════════════════

/** Lance une erreur si une condition n'est pas remplie. */
function assert(cond, msg) {
  if (!cond) {
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
}

// ─── User ──────────────────────────────────────────────────────
export function buildUserDoc(data) {
  assert(data.uid, "uid requis");
  assert(data.email, "email requis");
  assert(data.fullName, "fullName requis");
  assert(data.matricule, "matricule requis");

  return {
    uid: data.uid,
    email: data.email,
    fullName: data.fullName,
    matricule: data.matricule,
    studentCardUrl: data.studentCardUrl || null,
    role: data.role && ["student", "admin"].includes(data.role) ? data.role : "student",
    status: data.status && ["pending", "active", "rejected"].includes(data.status) ? data.status : "pending",
    groups: Array.isArray(data.groups) ? data.groups : [],
    onboarded: !!data.onboarded,
    createdByAdmin: !!data.createdByAdmin,
    university: data.university || null,
    department: data.department || null,
    bio: (data.bio || "").slice(0, 500),
    avatarUrl: data.avatarUrl || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

// ─── Group ─────────────────────────────────────────────────────
export function buildGroupDoc(data) {
  assert(data.name, "name requis");
  assert(data.subject, "subject requis");
  assert(data.leaderId, "leaderId requis");
  assert(data.leaderName, "leaderName requis");

  const max = Number(data.maxMembers) || 30;
  return {
    name: String(data.name).trim(),
    subject: data.subject,
    description: data.description || "",
    rules: data.rules || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    questions: Array.isArray(data.questions) ? data.questions : [],
    maxMembers: Math.min(Math.max(max, 2), 200),
    leaderId: data.leaderId,
    leaderName: data.leaderName,
    members: Array.isArray(data.members) ? data.members : [data.leaderId],
    memberCount: data.memberCount || 1,
    membersList: Array.isArray(data.membersList) ? data.membersList : [
      { uid: data.leaderId, name: data.leaderName, role: "Leader" },
    ],
    status: data.status && ["active", "archived"].includes(data.status) ? data.status : "active",
    isPublic: data.isPublic !== undefined ? !!data.isPublic : true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

// ─── Message ───────────────────────────────────────────────────
export function buildMessageDoc(data) {
  assert(data.groupId, "groupId requis");
  assert(data.uid, "uid requis");
  assert(data.userName, "userName requis");
  assert(data.text || data.imageUrl || data.fileUrl, "Message vide");

  return {
    groupId: data.groupId,
    uid: data.uid,
    userName: data.userName,
    text: data.text || "",
    imageUrl: data.imageUrl || null,    // image (rendu inline)
    fileUrl: data.fileUrl || null,      // fichier générique (PDF, doc, etc.)
    fileName: data.fileName || null,    // nom original (affichage)
    fileType: data.fileType || null,    // mime-type (icône appropriée)
    replyTo: data.replyTo || null,
    createdAt: FieldValue.serverTimestamp(),
  };
}

// ─── Post ──────────────────────────────────────────────────────
export function buildPostDoc(data) {
  assert(data.uid, "uid requis");
  assert(data.authorName, "authorName requis");
  assert(data.text, "text requis");
  assert(data.text.length <= 2000, "Texte trop long (max 2000)");

  return {
    uid: data.uid,
    authorName: data.authorName,
    major: data.major || "",
    text: data.text,
    tag: data.tag || "General",
    likes: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

// ─── Notification ──────────────────────────────────────────────
export function buildNotificationDoc(data) {
  assert(data.userId, "userId requis");
  assert(data.title, "title requis");

  return {
    userId: data.userId,
    title: data.title,
    body: data.body || "",
    link: data.link || null,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  };
}

// ─── Resource ──────────────────────────────────────────────────
export function buildResourceDoc(data) {
  assert(data.groupId, "groupId requis");
  assert(data.name, "name requis");
  assert(data.url, "url requis");
  assert(data.uid, "uid requis");
  assert(data.uploader, "uploader requis");

  return {
    groupId: data.groupId,
    name: data.name,
    url: data.url,
    uid: data.uid,
    uploader: data.uploader,
    status: data.status && ["pending", "approved"].includes(data.status) ? data.status : "pending",
    createdAt: FieldValue.serverTimestamp(),
  };
}

// ─── JoinRequest ───────────────────────────────────────────────
export function buildJoinRequestDoc(data) {
  assert(data.groupId, "groupId requis");
  assert(data.groupName, "groupName requis");
  assert(data.userId, "userId requis");
  assert(data.userName, "userName requis");

  return {
    groupId: data.groupId,
    groupName: data.groupName,
    userId: data.userId,
    userName: data.userName,
    matricule: data.matricule || "",
    answers: Array.isArray(data.answers) ? data.answers : [],
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  };
}
