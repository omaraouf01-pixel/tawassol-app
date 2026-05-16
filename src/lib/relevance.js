// ════════════════════════════════════════════════════════════════
// Relevance Algorithm — Discovery Engine for TAWASSOL Explore
// ────────────────────────────────────────────────────────────────
// خوارزميات نقية (Pure) لاختيار/ترتيب المجموعات حسب علاقتها بالمستخدم.
// لا تعتمد على Firebase ولا React — قابلة للاختبار.
// ════════════════════════════════════════════════════════════════

const SHELF_LIMIT = 10;

function norm(s) {
  return (s || "").toString().trim().toLowerCase();
}

function tokenize(s) {
  return norm(s).split(/[\s,/\-_()]+/).filter(Boolean);
}

// تطابق التخصص: tokens مشتركة بين major المستخدم و subject/major/tags المجموعة
function majorMatchScore(node, user) {
  const userTokens = new Set(tokenize(user?.major));
  if (userTokens.size === 0) return 0;

  const nodeText = [
    node.subject,
    node.major,
    ...(Array.isArray(node.tags) ? node.tags : []),
  ].join(" ");
  const nodeTokens = tokenize(nodeText);

  let hits = 0;
  for (const t of nodeTokens) {
    if (t.length >= 3 && userTokens.has(t)) hits++;
  }
  return hits;
}

function levelMatchScore(node, user) {
  if (!user?.level || !node.level) return 0;
  return norm(node.level) === norm(user.level) ? 1 : 0;
}

// نشاط حديث: كم مضى منذ آخر تحديث (millis). كل ما كان أقرب، الوزن أعلى.
function recencyBoost(node) {
  const ts = toMillis(node.updatedAt) || toMillis(node.createdAt);
  if (!ts) return 0;
  const ageHours = (Date.now() - ts) / (1000 * 60 * 60);
  if (ageHours < 24) return 3;
  if (ageHours < 24 * 7) return 2;
  if (ageHours < 24 * 30) return 1;
  return 0;
}

function toMillis(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  }
  if (v.toMillis) return v.toMillis();
  if (v.seconds) return v.seconds * 1000;
  return 0;
}

// نقطة الملاءمة الكلية: تخصص (الأقوى) + سنة + شعبية + حداثة
export function relevanceScore(node, user) {
  const major = majorMatchScore(node, user);
  const level = levelMatchScore(node, user);
  const popularity = Math.min((node.memberCount || node.members?.length || 0) / 5, 2);
  const recency = recencyBoost(node);
  return major * 10 + level * 4 + popularity + recency * 0.5;
}

// ─── Public Selectors ──────────────────────────────────────────

/**
 * المجموعات المتزامنة مع تخصص الطالب.
 * تشترط وجود تطابق حقيقي (score > 0) — لا تستخدم fallback عشوائي.
 */
export function selectMajorMatched(nodes, user, limit = SHELF_LIMIT) {
  if (!user?.major) return [];
  return nodes
    .map((n) => ({ n, s: majorMatchScore(n, user) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      return relevanceScore(b.n, user) - relevanceScore(a.n, user);
    })
    .slice(0, limit)
    .map(({ n }) => n);
}

/**
 * العقد عالية النشاط: مزيج من الشعبية (memberCount) والحداثة (updatedAt).
 */
export function selectHighFrequency(nodes, limit = SHELF_LIMIT) {
  return [...nodes]
    .map((n) => ({
      n,
      s:
        (n.memberCount || n.members?.length || 0) * 1.0 +
        recencyBoost(n) * 2,
    }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ n }) => n);
}

/**
 * استبعاد ID-set من المصفوفة (للمجموعات التي يشارك فيها الطالب).
 */
export function excludeIds(nodes, idsSet) {
  if (!idsSet || idsSet.size === 0) return nodes;
  return nodes.filter((n) => !idsSet.has(n.id));
}
