"use client";

// components/UserBadge.js
// ─────────────────────────────────────────────────────────────────────────────
// شارة الرتبة الأكاديمية — تعرض أيقونة + اسم الرتبة بجانب اسم المستخدم.
//
// الاستخدام الأساسي:
//   <UserBadge rank="مُساهِم" />          ← شارة مستقلة
//   <UserBadge rank={user.rank} size="sm" /> ← حجم صغير داخل قوائم
//
// الدمج في MessageList.js:
//   استبدل:  <span className="font-semibold">{msg.authorName}</span>
//   بـ:      <span className="font-semibold">{msg.authorName}</span>
//             <UserBadge rank={msg.authorRank} size="sm" />
//
// الدمج في app/hub/page.js (كارت المنشور):
//   استبدل:  <span>{post.authorRole}</span>
//   بـ:      <UserBadge rank={currentUser?.rank} />
// ─────────────────────────────────────────────────────────────────────────────

import { Book, Lightbulb, Microscope, GraduationCap } from "lucide-react";

// ── تعريف كل رتبة: أيقونة + لون (متوافق Light/Dark) ─────────────────────────
const RANK_CONFIG = {
  "مُبادِر": {
    Icon: Book,
    // أزرق هادئ
    wrapper: "bg-blue-100  dark:bg-blue-900/30  text-blue-700  dark:text-blue-300",
    icon:    "text-blue-500 dark:text-blue-400",
  },
  "مُساهِم": {
    Icon: Lightbulb,
    // أخضر زمردي
    wrapper: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    icon:    "text-emerald-500 dark:text-emerald-400",
  },
  "باحِث": {
    Icon: Microscope,
    // بنفسجي / أرجواني
    wrapper: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    icon:    "text-violet-500 dark:text-violet-400",
  },
  "مَرجِع": {
    Icon: GraduationCap,
    // ذهبي خفيف
    wrapper: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    icon:    "text-amber-500 dark:text-amber-400",
  },
};

const DEFAULT_RANK = "مُبادِر";

// ── أحجام متاحة ───────────────────────────────────────────────────────────────
const SIZE_CONFIG = {
  sm: { badge: "gap-0.5 px-1.5 py-0.5 rounded text-[10px]", iconSize: 10 },
  md: { badge: "gap-1   px-2   py-1   rounded-md text-xs",  iconSize: 12 },
  lg: { badge: "gap-1.5 px-3   py-1   rounded-md text-sm",  iconSize: 14 },
};

/**
 * @param {Object}  props
 * @param {string}  props.rank      - اسم الرتبة (مُبادِر / مُساهِم / باحِث / مَرجِع)
 * @param {"sm"|"md"|"lg"} [props.size="md"]
 * @param {boolean} [props.showLabel=true] - إظهار نص الرتبة أم الأيقونة فقط
 * @param {string}  [props.className]      - كلاسات إضافية اختيارية
 */
export default function UserBadge({
  rank,
  size = "md",
  showLabel = true,
  className = "",
}) {
  const config = RANK_CONFIG[rank] ?? RANK_CONFIG[DEFAULT_RANK];
  const sizes  = SIZE_CONFIG[size]  ?? SIZE_CONFIG.md;
  const { Icon, wrapper, icon } = config;

  return (
    <span
      className={[
        "inline-flex items-center font-medium select-none",
        sizes.badge,
        wrapper,
        className,
      ].join(" ")}
      title={rank ?? DEFAULT_RANK}
    >
      <Icon size={sizes.iconSize} className={icon} strokeWidth={2} />
      {showLabel && <span>{rank ?? DEFAULT_RANK}</span>}
    </span>
  );
}
