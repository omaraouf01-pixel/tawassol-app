// ════════════════════════════════════════════════════════════════
// Academic Data — Single Source of Truth for TAWASSOL
// ────────────────────────────────────────────────────────────────
// مصدر وحيد للجامعات والتخصصات والمستويات الدراسية.
// يُستخدم في صفحات: Onboarding، Group Creation، Explore Filters.
// أي تعديل هنا ينعكس على المنصة بأكملها.
// ════════════════════════════════════════════════════════════════

// ─── الجامعات (Full names) ─────────────────────────────────────
export const UNIVERSITIES = [
  "University of Oran 1 Ahmed Ben Bella",
  "USTO-MB (Oran)",
  "University of Algiers 1",
  "University of Constantine 1",
  "University of Tlemcen",
  "ESI (Algiers)",
];

// ─── الجامعات (Short labels for chips) ─────────────────────────
export const UNIVERSITY_LABELS = {
  "University of Oran 1 Ahmed Ben Bella": "Oran 1",
  "USTO-MB (Oran)": "USTO-MB",
  "University of Algiers 1": "Algiers 1",
  "University of Constantine 1": "Constantine 1",
  "University of Tlemcen": "Tlemcen",
  "ESI (Algiers)": "ESI",
};

// ─── التخصصات (Full names) ─────────────────────────────────────
export const MAJORS = [
  "Computer Science (Informatique)",
  "Artificial Intelligence",
  "Cyber Security",
  "Mathematics",
  "Theoretical Physics",
  "Biology & Health",
];

// ─── التخصصات (Short labels for chips) ─────────────────────────
export const MAJOR_LABELS = {
  "Computer Science (Informatique)": "Computer Sci",
  "Artificial Intelligence": "AI",
  "Cyber Security": "Cyber Sec",
  "Mathematics": "Math",
  "Theoretical Physics": "Physics",
  "Biology & Health": "Biology",
};

// ─── المستويات (Compact codes) ─────────────────────────────────
export const LEVELS = ["l1", "l2", "l3", "m1", "m2"];

// ─── الثابت "All" المستعمل في الفلاتر ─────────────────────────
export const ALL = "All";

// ─── دوال مساعدة قصيرة ────────────────────────────────────────
export const shortUni = (u) => UNIVERSITY_LABELS[u] || u;
export const shortMajor = (m) => MAJOR_LABELS[m] || m;
