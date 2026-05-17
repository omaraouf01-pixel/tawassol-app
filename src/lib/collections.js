// ════════════════════════════════════════════════════════════════
// Collections Firestore — TAWASSOL (Server / Admin SDK)
// ────────────────────────────────────────────────────────────────
// هذا الملف server-only ويستخدم firebase-admin.
// المكوّنات (use client) يجب أن تستورد COL من "@/lib/collectionNames".
// Server-only — يستورد firebase-admin (Node).
// ════════════════════════════════════════════════════════════════
import { adminDb, FieldValue } from "./firebaseAdmin";
import { COL } from "./collectionNames";

// أعد تصدير COL كي تبقى الاستيرادات الحالية في API routes تعمل دون تغيير
export { COL };

// ─── Collection References (Admin SDK) ──────────────────────────
export const usersCol = () => adminDb.collection(COL.USERS);
export const groupsCol = () => adminDb.collection(COL.GROUPS);
export const messagesCol = () => adminDb.collection(COL.MESSAGES);
export const postsCol = () => adminDb.collection(COL.POSTS);
export const notificationsCol = () => adminDb.collection(COL.NOTIFICATIONS);
export const resourcesCol = () => adminDb.collection(COL.RESOURCES);
export const joinRequestsCol = () => adminDb.collection(COL.JOIN_REQUESTS);

// ════════════════════════════════════════════════════════════════
// Document Builders (Admin FieldValue)
// ════════════════════════════════════════════════════════════════

function assert(cond, msg) {
  if (!cond) {
    const err = new Error(msg);
    err.status = 400;
    throw err;
  }
}

const serverTimestamp = () => FieldValue.serverTimestamp();

// ─── User Document Builder ─────────────────────────────────────
export function buildUserDoc(data) {
  assert(data.uid, "uid is required");
  assert(data.email, "email is required");
  assert(data.fullName, "fullName is required");
  assert(data.matricule, "matricule is required");

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
    university: data.university || "University of Oran 1",
    department: data.department || null,
    major: data.major || null,
    bio: (data.bio || "").slice(0, 500),
    avatarUrl: data.avatarUrl || null,
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// ─── Group Document Builder ────────────────────────────────────
export function buildGroupDoc(data) {
  assert(data.name, "name is required");
  assert(data.leaderId, "leaderId is required");

  const max = Number(data.maxMembers) || 30;
  const accessType = data.accessType === "open" ? "open" : "protected";
  const questions = Array.isArray(data.questions) ? data.questions.filter(Boolean) : [];
  return {
    name: String(data.name).trim(),
    subject: data.subject || "General",
    description: data.description || "",
    rules: data.rules || "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    questions: accessType === "open" ? [] : questions,
    accessType,
    maxMembers: Math.min(Math.max(max, 2), 200),
    leaderId: data.leaderId,
    leaderName: data.leaderName,
    members: Array.isArray(data.members) ? data.members : [data.leaderId],
    membersList: Array.isArray(data.membersList) ? data.membersList : [],
    memberCount: data.members?.length || 1,
    status: data.status || "active",
    isPublic: data.isPublic !== undefined ? !!data.isPublic : true,
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// ─── Message Document Builder ──────────────────────────────────
export function buildMessageDoc(data) {
  assert(data.groupId, "groupId is required");
  assert(data.authorId, "authorId is required");
  assert(data.text || data.fileUrl, "Message cannot be empty");

  return {
    groupId: data.groupId,
    authorId: data.authorId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar || null,
    text: data.text || "",
    fileUrl: data.fileUrl || null,
    fileName: data.fileName || null,
    fileType: data.fileType || null,
    replyTo: data.replyTo || null,
    moderationStatus: data.moderationStatus || "approved",
    createdAt: serverTimestamp(),
  };
}

// ─── Post Document Builder ─────────────────────────────────────
export function buildPostDoc(data) {
  assert(data.authorId, "authorId is required");
  assert(data.authorName, "authorName is required");
  assert(data.content, "content is required");

  return {
    authorId: data.authorId,
    authorName: data.authorName,
    authorRole: data.authorRole || "Scholar",
    authorAvatar: data.authorAvatar || null,
    content: data.content,
    fileUrl: data.fileUrl || null,
    fileName: data.fileName || null,
    likes: data.likes || 0,
    commentsCount: data.commentsCount || 0,
    createdAt: data.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

// ─── Notification Document Builder ─────────────────────────────
export function buildNotificationDoc(data) {
  assert(data.userId, "userId is required");
  assert(data.title, "title is required");

  return {
    userId: data.userId,
    title: data.title,
    body: data.body || "",
    link: data.link || null,
    read: false,
    createdAt: serverTimestamp(),
  };
}

// ─── Resource Document Builder ─────────────────────────────────
export function buildResourceDoc(data) {
  assert(data.groupId, "groupId is required");
  assert(data.name, "name is required");
  assert(data.url, "url is required");
  assert(data.uid, "uid is required");

  const status = ["pending", "approved", "rejected"].includes(data.status)
    ? data.status
    : "pending";

  return {
    groupId: data.groupId,
    name: String(data.name).slice(0, 200),
    url: data.url,
    uid: data.uid,
    uploader: data.uploader || "Étudiant",
    status,
    createdAt: serverTimestamp(),
  };
}

// ─── Join Request Document Builder ─────────────────────────────
export function buildJoinRequestDoc(data) {
  assert(data.groupId, "groupId is required");
  assert(data.userId, "userId is required");

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
