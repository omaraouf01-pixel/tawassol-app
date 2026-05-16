// Server-only notification helper — call this from API routes.
// Uses the firebase-admin SDK so it bypasses client security rules safely.

import { notificationsCol, buildNotificationDoc } from "@/lib/collections";

/**
 * Create a single notification document for one user.
 * Silent on failure — never throw from the notify path.
 *
 * @param {object} args
 * @param {string} args.userId  recipient UID
 * @param {string} args.title   short headline (sans-serif in UI)
 * @param {string} [args.body]  longer body (serif italic in UI)
 * @param {string} [args.link]  internal route to open on click
 * @param {string} [args.type]  one of: review | file_update | new_member | mention
 */
export async function notifyUser({ userId, title, body = "", link = null, type = "generic" }) {
  if (!userId || !title) return;
  try {
    const doc = buildNotificationDoc({ userId, title, body, link });
    doc.type = type;
    await notificationsCol().add(doc);
  } catch (err) {
    console.error("[NOTIFY_USER]", err);
  }
}

/**
 * Fan-out a notification to many recipients in a single batched create.
 *
 * @param {object} args
 * @param {string[]} args.userIds  recipient UIDs (duplicates and falsy values are filtered)
 * @param {string} args.title
 * @param {string} [args.body]
 * @param {string} [args.link]
 * @param {string} [args.type]
 */
export async function notifyMany({ userIds, title, body = "", link = null, type = "generic" }) {
  const unique = Array.from(new Set((userIds || []).filter(Boolean)));
  if (unique.length === 0 || !title) return;
  await Promise.all(
    unique.map((userId) => notifyUser({ userId, title, body, link, type }))
  );
}

/**
 * Find mentions of the form @Name inside a free-text message and resolve them
 * to the UIDs of group members. Matching is case-insensitive and walks the
 * member list once (no extra Firestore reads).
 *
 * Names with spaces should be quoted in messages — `@"Omar Aouf"` — but we
 * also do a best-effort prefix match on the first token for `@Omar`.
 *
 * @param {string} text                message body
 * @param {Array<{uid:string,name:string}>} members  group.membersList
 * @returns {string[]} matched UIDs (deduplicated)
 */
export function extractMentionedUids(text, members) {
  if (!text || !Array.isArray(members) || members.length === 0) return [];

  const quoted = [...text.matchAll(/@"([^"]{1,80})"/g)].map((m) => m[1].trim().toLowerCase());
  const bare = [...text.matchAll(/@([\p{L}][\p{L}\p{N}_-]{1,40})/gu)].map((m) => m[1].trim().toLowerCase());
  const tokens = new Set([...quoted, ...bare]);
  if (tokens.size === 0) return [];

  const hits = new Set();
  for (const m of members) {
    const name = (m?.name || "").trim().toLowerCase();
    if (!name || !m?.uid) continue;
    const firstToken = name.split(/\s+/)[0];
    if (tokens.has(name) || tokens.has(firstToken)) hits.add(m.uid);
  }
  return [...hits];
}
