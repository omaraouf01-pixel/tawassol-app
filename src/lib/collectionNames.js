// src/lib/collectionNames.js
// ─────────────────────────────────────────────────────────────
// مصدر وحيد لأسماء مجموعات Firestore.
// خالٍ من أي اعتماد على Firebase حتى يكون آمناً للاستيراد
// من كل من العميل والسيرفر دون تسريب admin SDK في الباندل.
// ─────────────────────────────────────────────────────────────

export const COL = {
  USERS: "users",
  GROUPS: "groups",
  MESSAGES: "messages",
  POSTS: "posts",
  NOTIFICATIONS: "notifications",
  RESOURCES: "resources",
  JOIN_REQUESTS: "join-requests",
};
