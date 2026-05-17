# خريطة مشروع Tawassol

> **الغرض:** فهم المشروع بسرعة. اقرأ هذا الملف أولاً قبل أي تعديل.

## 1. ما هو المشروع؟

منصة أكاديمية للطلاب الجامعيين: تسجيل بهوية الطالب → موافقة الأدمن → إكمال الملف الأكاديمي → الانضمام لمجموعات دراسية (Nodes) والدردشة فيها.

## 2. التقنيات

| الطبقة | التقنية |
|---|---|
| Framework | Next.js 13+ (App Router, `"use client"` في الصفحات) |
| Auth | Firebase Authentication (مع نظام Matricule مخصص) |
| Database | Cloud Firestore (real-time عبر onSnapshot) |
| File Storage | Cloudinary (عبر `/api/upload`) |
| Styling | Tailwind CSS + متغيرات CSS مخصصة |
| Theme | `next-themes` (Light/Dark) |
| Animation | Framer Motion |
| Icons | Lucide React |
| i18n | ❌ **محذوف بالكامل** (كان موجوداً وأُزيل) |

## 3. الأدوار والحالات

**الأدوار (role):**
- `student` — الطالب العادي
- `admin` — المسؤول

**الحالات (status):**
- `pending` — بانتظار موافقة الأدمن
- `active` — مُوافَق عليه
- `onboarded: true/false` — هل أكمل الملف الأكاديمي

## 4. رحلة المستخدم

```
/ (Landing)
  ↓
/auth?mode=register  →  رفع بطاقة الطالب
  ↓
/pending  →  انتظار موافقة الأدمن
  ↓ (admin approves)
/onboarding  →  3 خطوات: جامعة/تخصص → صورة وسيرة → نجاح
  ↓
/hub  →  الصفحة الرئيسية (Feed)
  ├── /explore  →  استكشاف المجموعات
  ├── /hub/chat/[id]  →  دردشة المجموعة
  ├── /profile  →  الملف الشخصي
  └── /groups/create  →  إنشاء مجموعة جديدة

/admin  →  لوحة الأدمن (تبويبات: تحقق / طلاب / مجموعات)
```

## 5. مجموعات Firestore

| Collection | الحقول الرئيسية | الاستخدام |
|---|---|---|
| `users` | uid, matricule, fullName, email, university, major, level, role, status, onboarded, avatarUrl, bio, socialLinks | بيانات المستخدمين |
| `groups` | id, name, leaderId, members[], accessType (open/protected), tags, questions, maxMembers | المجموعات الدراسية (Nodes) |
| `posts` | content, authorId, fileUrl, likes, commentsCount | منشورات Feed في الـ Hub |
| `messages` | groupId, authorId, content, fileUrl, createdAt | رسائل الدردشة |
| `resources` | groupId, uploadedBy, fileName, fileUrl | ملفات المجموعة |

## 6. الصفحات (app/)

| الصفحة | الوظيفة | يقرأ من | يستخدم |
|---|---|---|---|
| `app/page.js` | Landing + توجيه تلقائي | useAuth | Framer Motion |
| `app/auth/page.js` | تسجيل دخول / حساب جديد | `/api/login`, `/api/register` | mapAuthError |
| `app/onboarding/page.js` | 3 خطوات لإكمال الملف | users, `/api/upload` | academicData |
| `app/pending/page.js` | شاشة انتظار الموافقة | users (onSnapshot) | — |
| `app/hub/page.js` | Feed + إنشاء منشورات | posts, groups | Sidebar, NotificationCenter |
| `app/explore/page.js` | استكشاف وفلترة المجموعات | groups | DiscoveryGrid, JoinNodeModal |
| `app/hub/chat/[id]/page.js` | دردشة المجموعة (real-time) | messages, groups | ChatHeader, MessageList, MessageInput |
| `app/profile/page.js` | عرض/تعديل الملف الشخصي | users, `/api/user/profile` | — |
| `app/admin/page.js` | لوحة الأدمن | users, groups | Admin*Table |
| `app/groups/create/page.js` | إنشاء مجموعة | `/api/groups` | — |
| `app/layout.js` | Root layout | — | ThemeProvider, AuthProvider |

## 7. المكتبات المساعدة (lib/)

| الملف | الوظيفة |
|---|---|
| `lib/firebase.js` | تهيئة Firebase Client SDK |
| `lib/useAuth.js` | AuthContext + توجيه ذكي حسب الحالة |
| `lib/authErrors.js` | تحويل أخطاء Firebase لرسائل عربية |
| `lib/academicData.js` | قوائم الجامعات/التخصصات/المستويات |
| `lib/apiClient.js` | استدعاءات API مع Bearer Token |
| `lib/useChat.js` | اشتراك real-time في الرسائل |
| `lib/useMyGroups.js` | مجموعات المستخدم الحالي |
| `lib/useAllGroups.js` | كل المجموعات العامة |
| `lib/fileLinks.js` | بناء روابط Cloudinary |
| `lib/relevance.js` | خوارزميات اقتراح المجموعات |
| `lib/collectionNames.js` | ثوابت أسماء الـ Collections |

## 8. API Endpoints

| Endpoint | الوظيفة |
|---|---|
| `POST /api/register` | تسجيل مع بطاقة طالب |
| `POST /api/login` | دخول بـ matricule |
| `POST /api/upload` | رفع ملف لـ Cloudinary |
| `GET/PATCH /api/user/profile` | الملف الشخصي |
| `POST /api/admin/users/[uid]/approve` | موافقة |
| `POST /api/admin/users/[uid]/reject` | رفض |
| `POST /api/groups` | إنشاء مجموعة |
| `GET/POST /api/posts/[id]/comments` | تعليقات |

## 9. نظام التصميم

- **الألوان:** `cream` (خلفية فاتحة)، `ink` (نص أسود)، `accent` (#7c83f2 بنفسجي)، `sand` (حدود)
- **الخطوط:** Lora (عناوين)، Plus Jakarta Sans (نص)
- **الحدود:** `rounded-2xl` للأزرار، `rounded-3xl` للنوافذ
- **الظلال:** `shadow-soft`, `shadow-warm`
- **الحركات:** Framer Motion بمدد 0.25-0.5s

## 10. تحذيرات ومخاطر

⚠️ **تعديلات غير ملتزمة:** 25+ ملف معدّل بدون commit. اعمل commit قبل أي تغيير كبير.

⚠️ **i18n محذوف:** `lib/i18n/*` و `LanguageSwitcher.js` أُزيلت. لا تستورد منها.

⚠️ **firestore.rules غير موجود في الـ repo:** القواعد الأمنية تُدار من مكان آخر — لا تفترض شيئاً.

⚠️ **Race conditions:** صفحة onboarding تستخدم `finalizingRef` لتجنب تعارض onSnapshot مع الحفظ. كن حذراً عند التعديل.

⚠️ **التحقق من الصلاحيات:** الدردشة تتحقق أن المستخدم `member|leader|admin` قبل التحميل. لا تكسر هذا.
