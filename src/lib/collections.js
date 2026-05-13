// ════════════════════════════════════════════════════════════════
// Collections Firestore — TAWASSOL (Client-Safe Version)
// ════════════════════════════════════════════════════════════════

import { firestore as db } from "./firebase"; // استيراد نسخة المتصفح
import { collection, serverTimestamp } from "firebase/firestore";

// ─── Noms des collections ──────────────────────────────────────
export const COL = {
  USERS: "users",
  GROUPS: "groups",
  MESSAGES: "messages",
  POSTS: "posts",
  NOTIFICATIONS: "notifications",
  RESOURCES: "resources",
  JOIN_REQUESTS: "join-requests",
};

// ─── Références rapides (Client-Side Compatible) ───────────────
export const usersCol = () => collection(db, COL.USERS);
export const groupsCol = () => collection(db, COL.GROUPS);
export const messagesCol = () => collection(db, COL.MESSAGES);
export const postsCol = () => collection(db, COL.POSTS);
export const notificationsCol = () => collection(db, COL.NOTIFICATIONS);
export const resourcesCol = () => collection(db, COL.RESOURCES);
export const joinRequestsCol = () => collection(db, COL.JOIN_REQUESTS);

// ════════════════════════════════════════════════════════════════
// Validators & Document Builders
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// ─── Message ───────────────────────────────────────────────────
export function buildMessageDoc(data) {
  assert(data.groupId, "groupId requis");
  assert(data.uid, "uid requis");
  assert(data.userName, "userName requis");
  assert(data.text || data.imageUrl || data.fileUrl, "Message vide");

  const hasAttachment = !!(data.imageUrl || data.fileUrl);
  const isLeaderUpload = hasAttachment && data.leaderId && data.uid === data.leaderId;
  const moderationStatus = hasAttachment
    ? (isLeaderUpload ? "approved" : "pending")
    : "approved";

  return {
    groupId: data.groupId,
    uid: data.uid,
    userName: data.userName,
    text: data.text || "",
    imageUrl: data.imageUrl || null,
    fileUrl: data.fileUrl || null,
    fileName: data.fileName || null,
    fileType: data.fileType || null,
    replyTo: data.replyTo || null,
    moderationStatus,
    createdAt: serverTimestamp(),
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
    createdAt: serverTimestamp(),
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
    createdAt: serverTimestamp(),
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
    createdAt: serverTimestamp(),
  };
}