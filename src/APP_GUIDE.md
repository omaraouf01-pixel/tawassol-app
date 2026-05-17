# دليل تطبيق Tawassol الشامل (APP_GUIDE)

> **الهدف:** فهم التطبيق بالكامل خلال 4 أيام بدون الرجوع للكود.
> **اقترح تقسيماً للقراءة:** يوم 1 (الأقسام 1-3) · يوم 2 (4-5) · يوم 3 (6-8) · يوم 4 (9-11).

---

## القسم 1 — نظرة عامة

### 1.1 ما هو التطبيق؟
**Tawassol** (يُكتب أحياناً "Twassel") منصة أكاديمية للطلاب الجامعيين الجزائريين. الفكرة بسيطة: الطالب يسجّل ببطاقته الجامعية → الأدمن يوافق يدوياً → يكمل ملفه الأكاديمي → ينضم لـ "Nodes" (مجموعات دراسية) ويتفاعل فيها عبر دردشة جماعية + مشاركة موارد + Feed عام.

**الجمهور:** طلاب جامعيون (Student) + مشرفون (Admin). لا توجد أدوار وسيطة.

**القيمة:** بيئة موثوقة (لأن كل عضو تم التحقق من بطاقته يدوياً) لتبادل الموارد الأكاديمية والنقاش بين أبناء التخصص الواحد.

### 1.2 الـ Stack ودور كل أداة

| الطبقة | التقنية | الدور |
|---|---|---|
| الإطار | Next.js 13+ (App Router) | كل الصفحات `"use client"` |
| المصادقة | Firebase Authentication | إدارة الجلسة + JWT |
| قاعدة البيانات | Cloud Firestore | بيانات حية عبر `onSnapshot` |
| التخزين | Cloudinary | رفع الصور والملفات (PDF, …) |
| المظهر | Tailwind CSS + متغيرات CSS | تصميم متجاوب |
| الثيم | `next-themes` | Light/Dark |
| الحركات | Framer Motion | انتقالات 0.25-0.5s |
| الأيقونات | Lucide React | — |
| (محذوف) | i18n | كان موجوداً وحُذف بالكامل |

### 1.3 المعمارية العامة

```
┌────────────────────────────────────────────────────┐
│             المتصفح (Client - Next.js)              │
│   صفحات + مكونات + useAuth + hooks (real-time)     │
└──────────┬─────────────────────────┬───────────────┘
           │                         │
           │ Firebase SDK             │ fetch + Bearer
           │ (onSnapshot real-time)   │ (apiClient.js)
           ▼                         ▼
   ┌────────────────┐      ┌─────────────────────┐
   │   Firestore    │      │  Next.js API Routes │
   │  (users,       │◄─────┤  (firebase-admin)    │
   │   groups,      │      │  + verifyAdmin       │
   │   messages, …) │      │  + Cloudinary upload │
   └────────────────┘      └─────────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │    Cloudinary    │
                            │ (صور + PDF + ملفات)│
                            └──────────────────┘
```

- **حركة البيانات الحية:** Firestore ↔ المتصفح مباشرة عبر `onSnapshot` — لا تمرّ بالـ API.
- **حركة الكتابة الحساسة (تسجيل، موافقات، حذف):** المتصفح → API Routes (مع Bearer) → Firebase Admin SDK → Firestore.
- **رفع الملفات:** المتصفح → `/api/upload` → Cloudinary → يعيد URL → يُخزَّن في Firestore.

---

## القسم 2 — خريطة الملفات والمجلدات

### 2.1 بنية المجلدات

```
src/
├── app/                  # صفحات Next.js وroutes (App Router)
│   ├── api/              # خادم: REST endpoints
│   ├── admin/            # لوحة الأدمن
│   ├── auth/             # تسجيل الدخول/الإنشاء
│   ├── explore/          # استكشاف المجموعات
│   ├── groups/create/    # إنشاء مجموعة
│   ├── hub/              # الـ Feed الرئيسي
│   │   └── chat/[id]/    # غرفة دردشة المجموعة
│   ├── onboarding/       # إكمال الملف الأكاديمي
│   ├── pending/          # شاشة انتظار الموافقة
│   ├── profile/          # الملف الشخصي
│   ├── layout.js         # Root Layout + Providers
│   └── page.js           # Landing
├── components/           # مكونات قابلة لإعادة الاستخدام
│   ├── chat/             # مكونات الدردشة
│   ├── admin/            # جداول لوحة الأدمن
│   └── explore/          # عناصر Discovery
└── lib/                  # منطق مشترك (hooks + helpers)
```

### 2.2 فهرس الملفات الرئيسية

#### `app/` — الصفحات
| الملف | الدور |
|---|---|
| [page.js](app/page.js) | Landing + توجيه تلقائي للمستخدم المسجَّل |
| [layout.js](app/layout.js) | يلفّ كل شيء بـ ThemeProvider + AuthProvider |
| [auth/page.js](app/auth/page.js) | تسجيل دخول/إنشاء حساب (مع رفع بطاقة الطالب) |
| [pending/page.js](app/pending/page.js) | شاشة انتظار الموافقة |
| [onboarding/page.js](app/onboarding/page.js) | 3 خطوات لإكمال الملف الأكاديمي |
| [hub/page.js](app/hub/page.js) | Feed + إنشاء منشورات + تعليقات |
| [explore/page.js](app/explore/page.js) | استكشاف وفلترة المجموعات |
| [hub/chat/[id]/page.js](app/hub/chat/[id]/page.js) | دردشة مجموعة (real-time) |
| [profile/page.js](app/profile/page.js) | عرض/تعديل الملف الشخصي |
| [admin/page.js](app/admin/page.js) | لوحة الأدمن (3 تبويبات) |
| [groups/create/page.js](app/groups/create/page.js) | نموذج إنشاء مجموعة جديدة |

#### `components/` — المكونات
| الملف | الدور |
|---|---|
| [Sidebar.js](components/Sidebar.js) | الشريط الجانبي العام (التنقل + قائمة مجموعاتي) |
| [SettingsMenu.js](components/SettingsMenu.js) | قائمة الإعدادات (ثيم/أمان/خصوصية/خروج) |
| [SettingsModals.js](components/SettingsModals.js) | نوافذ Security + Privacy |
| [NotificationCenter.js](components/NotificationCenter.js) | جرس الإشعارات + قائمة منسدلة |
| [NotificationsBell.js](components/NotificationsBell.js) | wrapper للجرس |
| [DiscoveryGrid.js](components/DiscoveryGrid.js) | شبكة بطاقات المجموعات في Explore |
| [MessageAttachment.js](components/MessageAttachment.js) | عرض المرفقات في الدردشة |
| [LinkField.js](components/LinkField.js) | حقل URL مع أيقونة |
| [TsswalLogo.js](components/TsswalLogo.js) | شعار التطبيق SVG |
| [ThemeProvider.js](components/ThemeProvider.js) | provider لـ next-themes |
| [explore/NodeShelf.js](components/explore/NodeShelf.js) | رف أفقي لمجموعات موصى بها |
| [explore/JoinNodeModal.js](components/explore/JoinNodeModal.js) | نافذة طلب الانضمام لمجموعة |
| [chat/ChatHeader.js](components/chat/ChatHeader.js) | رأس غرفة الدردشة |
| [chat/MessageList.js](components/chat/MessageList.js) | قائمة الرسائل |
| [chat/MessageInput.js](components/chat/MessageInput.js) | حقل كتابة/إرفاق |
| [chat/ActiveNodesSidebar.js](components/chat/ActiveNodesSidebar.js) | شريط جانبي لمجموعات المستخدم |
| [chat/ResourcesSidebar.js](components/chat/ResourcesSidebar.js) | شريط الموارد المعتمدة |
| [chat/ModerationPanel.js](components/chat/ModerationPanel.js) | لوحة مراجعة الطلبات والملفات |
| [chat/OverseerPanel.js](components/chat/OverseerPanel.js) | لوحة القائد (3 تبويبات) |
| [chat/GroupSettings.js](components/chat/GroupSettings.js) | تعديل إعدادات المجموعة |
| [chat/GroupMembers.js](components/chat/GroupMembers.js) | إدارة الأعضاء |
| [chat/MemberListDrawer.js](components/chat/MemberListDrawer.js) | درج جانبي لعرض الأعضاء |
| [admin/AdminPendingTable.js](components/admin/AdminPendingTable.js) | جدول الطلبات المعلقة |
| [admin/AdminUsersTable.js](components/admin/AdminUsersTable.js) | جدول الطلاب المقبولين |
| [admin/AdminGroupsTable.js](components/admin/AdminGroupsTable.js) | جدول المجموعات |
| [admin/IDCardModal.js](components/admin/IDCardModal.js) | عرض بطاقة طالب بحجم كبير |

#### `lib/` — الـ Helpers
| الملف | الدور |
|---|---|
| [firebase.js](lib/firebase.js) | تهيئة Firebase Client SDK |
| [firebaseAdmin.js](lib/firebaseAdmin.js) | Firebase Admin SDK (server-only) |
| [firestore.js](lib/firestore.js) | barrel exports لـ adminDb/adminAuth |
| [useAuth.js](lib/useAuth.js) | **AuthContext + التوجيه الذكي** |
| [authErrors.js](lib/authErrors.js) | ترجمة أخطاء Firebase للعربية |
| [apiClient.js](lib/apiClient.js) | fetch مع Bearer Token + retry |
| [withAuth.js](lib/withAuth.js) | middleware لـ API routes |
| [verifyAdmin.js](lib/verifyAdmin.js) | التحقق من صلاحيات admin |
| [collectionNames.js](lib/collectionNames.js) | ثوابت أسماء الـ Collections |
| [collections.js](lib/collections.js) | constructors لمستندات Firestore |
| [academicData.js](lib/academicData.js) | قوائم الجامعات/التخصصات/المستويات |
| [relevance.js](lib/relevance.js) | خوارزمية اقتراح المجموعات |
| [fileLinks.js](lib/fileLinks.js) | بناء روابط Cloudinary الآمنة |
| [useChat.js](lib/useChat.js) | **محرك دردشة المجموعة الكامل** |
| [useMessages.js](lib/useMessages.js) | (قديم/مكرر — استخدم useChat) |
| [useMyGroups.js](lib/useMyGroups.js) | مجموعات المستخدم الحالي |
| [useAllGroups.js](lib/useAllGroups.js) | كل المجموعات العامة |
| [useJoinRequests.js](lib/useJoinRequests.js) | طلبات الانضمام للقائد |
| [useFileUpload.js](lib/useFileUpload.js) | رفع ملف + إرسال رسالة |
| [useApi.js](lib/useApi.js) | wrapper آمن للـ async (يحمي من spinner stuck) |
| [notify.js](lib/notify.js) | إنشاء تنبيه من الـ client |
| [serverNotify.js](lib/serverNotify.js) | إنشاء تنبيه من السيرفر + استخراج mentions |
| [mongodb.js](lib/mongodb.js) | اتصال MongoDB (موجود لكن غير مستخدم بشكل واضح) |

---

## القسم 3 — تدفقات المستخدم (User Flows)

> هذا أهم قسم. كل تدفق مع الملفات + الدوال + الـ Collections.

### 3.1 إنشاء حساب جديد
**المسار:** `Landing → /auth?mode=register → /pending → (موافقة) → /onboarding → /hub`

1. الطالب يفتح [auth/page.js](app/auth/page.js)، يختار "Register".
2. يدخل: matricule + fullName + email + password + بطاقة الطالب.
3. الزر "Register" يرسل FormData إلى **`POST /api/register`**:
   - يتحقق من تفرّد `matricule` و `email`.
   - يرفع البطاقة إلى Cloudinary.
   - ينشئ حساب Firebase Auth.
   - يكتب مستند في `users`: `status:"pending"`, `role:"student"`, `onboarded:false`.
   - **rollback** إذا فشلت أي خطوة.
4. الـ client يسجّل دخوله تلقائياً عبر `signInWithEmailAndPassword`.
5. `useAuth` يلاحظ `status:"pending"` → يوجّه إلى [pending/page.js](app/pending/page.js).
6. المستخدم ينتظر. مستمع `onSnapshot` في `useAuth` يراقب التغييرات.
7. حين يوافق الأدمن → `status:"active"` → `useAuth` يجدّد التوكن ويوجّه إلى `/onboarding`.

**Collections:** `users` (إنشاء).

### 3.2 تسجيل الدخول والتوجيه الذكي
**المسار:** `auth → useAuth → (حسب الحالة) → الوجهة المناسبة`

1. المستخدم يدخل matricule + password في [auth/page.js](app/auth/page.js).
2. الزر "Sign In" يستدعي **`POST /api/login`** الذي يبحث عن المستخدم بـ matricule (case-insensitive ثم email ثم case-sensitive) ويرجع `email`.
3. الـ client يستدعي `signInWithEmailAndPassword(auth, email, password)`.
4. **`useAuth` (في [useAuth.js](lib/useAuth.js))** يلاحظ تغيّر الجلسة:
   - يجلب مستند المستخدم من `users` (fallback: `/api/user/profile`).
   - يبدأ `onSnapshot` real-time على هذا المستند.
   - يطبّق منطق التوجيه:

```
if (status === "active" && onboarded === true && path === "/onboarding") → ابقَ (لعرض النجاح)
if (status === "onboarding")                                              → /onboarding
if (status === "pending" && path !∈ {/pending, /onboarding})              → /pending
if (status === "active" && onboarded === false)                           → /onboarding
if (status === "active" && onboarded === true && في صفحة auth)            → /hub
if (role === "admin")                                                     → /admin (في pending)
```

**Collections:** `users` (قراءة + onSnapshot).

### 3.3 موافقة الأدمن على المستخدمين الجدد
**المسار:** `admin → تبويب Verification → زر ✓ → API approve → status:active`

1. الأدمن يفتح [admin/page.js](app/admin/page.js)، تبويب "Verification".
2. يرى الطلبات المعلّقة في [AdminPendingTable.js](components/admin/AdminPendingTable.js):
   - **زر 👁️** → يفتح [IDCardModal.js](components/admin/IDCardModal.js) لمعاينة بطاقة الطالب.
   - **زر ✓** → `handleApprove(uid)` → **`POST /api/admin/users/[uid]/approve`**:
     - `status: "pending" → "active"`.
     - `setCustomUserClaims({role, admin, status:"active"})`.
     - `revokeRefreshTokens(uid)` لإجبار الـ client على جلب توكن جديد بالـ claims الجديدة.
   - **زر ✗** → `handleReject(uid)` → **`POST /api/admin/users/[uid]/reject`**:
     - `status: "rejected"`.
     - لا يحذف حساب Auth.
3. `onSnapshot` في صفحة المستخدم يلتقط التغيير → `useAuth` يوجّهه إلى `/onboarding`.

**Collections:** `users` (تحديث) + **Custom Claims** على Firebase Auth.

### 3.4 الـ Onboarding (إكمال الملف)
**المسار:** 3 خطوات داخل [onboarding/page.js](app/onboarding/page.js).

- **خطوة 1:** اختيار University + Major + Level (من [academicData.js](lib/academicData.js)).
- **خطوة 2:** رفع صورة شخصية + كتابة Bio (≤ 500 حرف).
- **خطوة 3:** رسالة "Welcome" + زر "The Hub" يستخدم `window.location.replace()`.

**حل race condition (مهم جداً):**
- يوجد `finalizingRef = useRef(false)`.
- عند بدء `handleFinalize()` يصبح `finalizingRef.current = true`.
- الـ useEffect للتوجيه يحتوي: `if (finalizingRef.current || step === 3) return;`.
- بدون هذا، `onSnapshot` يلاحظ `onboarded:true` أثناء الكتابة ويوجّه فوراً، فتُفقد شاشة "Welcome".

**حفظ البيانات:** `updateDoc(firestore, "users", uid, {...})` مباشرة من الـ client.

**Collections:** `users` (تحديث).

### 3.5 استكشاف العقد والانضمام
**المسار:** `Sidebar → Explore → بطاقة مجموعة → JoinNodeModal → API → عضو/طلب معلّق`

1. [explore/page.js](app/explore/page.js) يجمع:
   - `useAllGroups()` → كل المجموعات العامة (محدودة بـ 30).
   - `useMyGroups()` → مجموعاتي (للاستبعاد).
   - `GET /api/user/pending-requests` → IDs الطلبات المعلقة.
2. تطبيق فلتر البحث + (University/Major/Level).
3. إذا لا فلاتر → بناء "رفوف ذكية" عبر [relevance.js](lib/relevance.js):
   - **"In your field"**: `selectMajorMatched()` — مطابقة token-based.
   - **"Trending"**: `selectHighFrequency()` — حسب memberCount + حداثة.
4. باقي المجموعات تظهر في [DiscoveryGrid.js](components/DiscoveryGrid.js).
5. الضغط على بطاقة → فتح [JoinNodeModal.js](components/explore/JoinNodeModal.js):
   - **مجموعة `open`:** زر "Join" → `POST /api/groups/[id]/join-requests` بـ `answers:[]` → انضمام فوري.
   - **مجموعة `protected`:** أسئلة → "Send request" → `POST` بـ `answers:[...]` → status pending.

**Collections:** `groups` (قراءة), `join-requests` (إنشاء), `users` (تحديث `groups` array).

### 3.6 الدخول لغرفة دردشة + فحص الصلاحيات
**الملف:** [hub/chat/[id]/page.js](app/hub/chat/[id]/page.js).

عند فتح `/hub/chat/{id}`:
1. جلب مستند `groups/{id}`.
2. حساب 3 صلاحيات:
   - `member = group.members.includes(uid)`
   - `leader = uid === group.leaderId`
   - `admin  = userData.role === "admin"`
3. **إذا لم يستوف أي شرط** → الصفحة ترفض الوصول وتعرض رسالة `forbidden`.
4. إذا مسموح → تركيب الواجهة:
   - [ChatHeader](components/chat/ChatHeader.js) في الأعلى.
   - [ActiveNodesSidebar](components/chat/ActiveNodesSidebar.js) على اليسار.
   - [MessageList](components/chat/MessageList.js) في الوسط (من `useChat`).
   - [MessageInput](components/chat/MessageInput.js) في الأسفل.
   - [ResourcesSidebar](components/chat/ResourcesSidebar.js) على اليمين.
   - [OverseerPanel](components/chat/OverseerPanel.js) (للقائد فقط).

**⚠️ قاعدة حرجة:** لا تكسر فحص الصلاحيات هذا — هو خط الدفاع الأول.

### 3.7 إرسال رسالة / رفع ملف
**المكون:** [MessageInput.js](components/chat/MessageInput.js).

- **رسالة نصية:** الزر "Send" → `useChat.sendMessage({text})`:
  - يضيف optimistic message فوراً (للسرعة).
  - يستدعي `POST /api/groups/[id]/messages`.
  - عند رجوع المستند الحقيقي عبر `onSnapshot`، الـ optimistic يُستبدل (مطابقة بـ uid+content+fileUrl).
- **مع ملف:** زر 📎 → اختيار ملف (max 25MB) → `useFileUpload.upload()` → `/api/upload` → Cloudinary → URL → ثم الإرسال.
- **علم الرقابة (moderation):**
  - إذا المرسل قائد/أدمن → `moderationStatus:"approved"` فوراً.
  - إذا طالب عادي + ملف → `moderationStatus:"pending"`.
- **read-only:** إذا `group.isReadOnly` → فقط القائد/الأدمن يستطيع الإرسال.

**Collections:** `messages` (إنشاء), `groups` (تحديث `updatedAt`).

### 3.8 إضافة مورد للمجموعة
**المسار:** عبر الدردشة نفسها (الملف = مورد). يُعرض في [ResourcesSidebar](components/chat/ResourcesSidebar.js) فقط إذا `moderationStatus !== "pending"`.

أيضاً يوجد endpoint منفصل **`POST /api/groups/[id]/resources`**:
- إذا leader/admin → `status:"approved"`.
- إذا طالب عادي → `status:"pending"` + إشعار للقائد.
- القائد يراجع في [OverseerPanel](components/chat/OverseerPanel.js).

### 3.9 إدارة الأعضاء (إضافة/إزالة/تغيير دور)
**ملفات:** [MemberListDrawer.js](components/chat/MemberListDrawer.js), [GroupMembers.js](components/chat/GroupMembers.js), [OverseerPanel.js](components/chat/OverseerPanel.js).

- **إضافة:** عبر طلب انضمام (3.5) — القائد يوافق في تبويب "Join Requests".
- **إزالة:** زر ❌ بجانب العضو → `DELETE /api/groups/[id]/members/[uid]`:
  - يزيل من `members` array + `memberCount: increment(-1)`.
  - القائد لا يستطيع إزالة نفسه.
- **تغيير دور:** ليس مدعوماً مباشرة في UI (الأدوار محدودة في leader/member).

### 3.10 الإشراف (Moderation) والمراقبة (Overseer)
**اللوحتان:** [ModerationPanel](components/chat/ModerationPanel.js) و [OverseerPanel](components/chat/OverseerPanel.js).

**OverseerPanel — 3 تبويبات:**
1. **Join Requests:** ✓ يضيف العضو + ينشئ إشعار نظام. ✗ يحدّث `status:"rejected"`.
2. **Node Resources:** ✓ يحدّث `moderationStatus:"approved"`. ✗ يحذف الملف من Cloudinary + المستند + ينشئ إشعار رفض.
3. **Settings:** تعديل name/description/rules/accessType (`open` ↔ `protected`).

**القاعدة:** الأعضاء العاديون لا يرون الملفات المعلّقة في المجموعات المحمية، لكن صاحب الملف يراه دائماً.

### 3.11 الإشعارات
**المكون:** [NotificationCenter.js](components/NotificationCenter.js) داخل [Sidebar.js](components/Sidebar.js).

- جرس 🔔 مع badge للعدد غير المقروء (مع pulse animation).
- منسدلة تعرض آخر 50 إشعار (مرتبة `createdAt desc`).
- **زر "Mark all as read"** → `PATCH /api/notifications` (batch update).
- الضغط على إشعار → `PATCH /api/notifications/[id]` ثم الانتقال إلى `link`.
- المستمع `onSnapshot` على `notifications where userId == uid`.

**أنواع الإشعارات:** `review`, `file_update`, `new_member`, `mention`.
**Mentions:** [serverNotify.js](lib/serverNotify.js) `extractMentionedUids()` يستخرج `@Name` أو `@"Full Name"` من الرسائل.

### 3.12 الملف الشخصي والإعدادات
**[profile/page.js](app/profile/page.js):**
- بطاقة Identity (avatar + اسم + تخصص + بريد + matricule + جامعة).
- **رفع صورة:** `handleAvatarChange()` → `/api/upload` (folder `tawassol/avatars`) → `updateDoc(users/{uid}, {avatarUrl})`.
- **زر "Edit Profile"** → نافذة `EditProfileModal`:
  - تعديل: `fullName`, `major`, `bio` (≤500), `socialLinks` (GitHub/LinkedIn/Portfolio).
  - الحفظ: `PATCH /api/user/profile` مع Bearer Token.
- شبكة إحصائيات: Nodes Joined / Resources / تاريخ الانضمام.
- شبكة Bio + Social Links.

**[SettingsMenu.js](components/SettingsMenu.js)** (في Sidebar):
- **Night Mode/Daylight** → `useTheme().setTheme(...)`.
- **Security** → [SettingsModals.js](components/SettingsModals.js) `SecurityModal` → `sendPasswordResetEmail(auth, email)`.
- **Privacy Level** → `PrivacyModal` → تحديث `profileVisibility` في `users/{uid}` (`public` أو `scholars_only`).
- **Log out** → `signOut(auth)` + `router.push("/auth")`.

### 3.13 لوحة الأدمن
**[admin/page.js](app/admin/page.js)** بـ 3 تبويبات:

- **Verification** → [AdminPendingTable](components/admin/AdminPendingTable.js) — الطلبات المعلقة (3.3).
- **Scholars** → [AdminUsersTable](components/admin/AdminUsersTable.js) — قائمة المقبولين (عرض فقط حالياً).
- **Nodes** → [AdminGroupsTable](components/admin/AdminGroupsTable.js):
  - 👥 **Members** → نافذة `ManageMembersModal` لإزالة أعضاء.
  - 🛡️ **Visit** → `/hub/chat/[id]?from=admin`.
  - 🗑️ **Delete** → تأكيد → `DELETE /api/admin/groups/[id]` → batch atomic يحذف المجموعة + كل messages + resources + join-requests.

البحث يعمل على fullName/email/matricule أو name/major/leaderName.

---

## القسم 4 — شرح المكونات (Components)

> الـ props الأساسية + الأزرار + الأثر على Firestore.

### 4.1 مكونات عامة

#### [Sidebar.js](components/Sidebar.js)
- **Props:** `currentUser`, `groups`.
- **يعرض:** Logo + جرس إشعارات + قائمة (Hub/Explore/Profile) + "مجموعاتي" + SettingsMenu + كرت ملف شخصي + زر خروج.
- **أزرار:** كل مجموعة → `/hub/chat/{id}`. زر "+" → `/groups/create`.

#### [SettingsMenu.js](components/SettingsMenu.js)
- منسدلة من الأسفل لأعلى. **أزرار:** Night Mode (تبديل theme), Security (modal), Privacy (modal), Log out (signOut + redirect).

#### [SettingsModals.js](components/SettingsModals.js)
- **SecurityModal:** "Send link" → `sendPasswordResetEmail`.
- **PrivacyModal:** اختيار `public` / `scholars_only` → تحديث `users.profileVisibility`.

#### [NotificationCenter.js](components/NotificationCenter.js)
- **Props:** ضمنياً `currentUser` من useAuth.
- جرس + منسدلة. **أزرار:** Mark all as read (batch PATCH), Click on item (PATCH single + navigate).
- مستمع real-time على `notifications where userId == uid orderBy createdAt desc limit 50`.

#### [DiscoveryGrid.js](components/DiscoveryGrid.js)
- **Props:** `nodes`, `currentUser`, `pendingGroupIds`, `onJoinClick`.
- بطاقات بحركات stagger. **أزرار:** Join (يفتح modal) / Open (للأدمن، يفتح غرفة) / Pending… (معطّل).

#### [LinkField.js](components/LinkField.js)
- **Props:** `label`, `iconName`, `value`, `onChange`, `placeholder`.
- input مع أيقونة + تركيز أرجواني.

#### [TsswalLogo.js](components/TsswalLogo.js) / [ThemeProvider.js](components/ThemeProvider.js)
- شعار SVG + provider لـ `next-themes` (defaultTheme: light, storageKey: "twassel-theme").

#### [MessageAttachment.js](components/MessageAttachment.js)
- **Props:** `imageUrl`, `fileUrl`, `fileName`, `fileType`, `fileSize`, `moderationStatus`.
- يعرض opacity 0.8 + شريط تحذير للملفات pending.
- **أزرار:** View (للأنواع القابلة للعرض) / Download (يفتح `/api/download`).

### 4.2 مكونات الـ Explore

#### [explore/NodeShelf.js](components/explore/NodeShelf.js)
- رف أفقي بعنوان + "View all" + شبكة responsive (1/2/3/4 أعمدة).

#### [explore/JoinNodeModal.js](components/explore/JoinNodeModal.js)
- **Props:** `node`, `currentUser`, `onClose`, `onJoined`.
- جانبان: معلومات المجموعة (40%) + نموذج (60%).
- **أزرار:**
  - open: "Join" → `POST /api/groups/[id]/join-requests` بـ answers:[].
  - protected: حقول أسئلة + "Send request".

### 4.3 مكونات الـ Chat

#### [chat/ChatHeader.js](components/chat/ChatHeader.js)
- **Props:** `group`, `isLeader`, `isAdmin`.
- **أزرار:** Back → /hub أو /admin. View Members → MemberListDrawer. Settings (leader) → PATCH /api/groups/[id]. Delete (admin) → DELETE /api/groups/[id].

#### [chat/MessageList.js](components/chat/MessageList.js)
- **Props:** `messages`, `currentUser`, `groupLeaderId`, `onDeleteMessage`.
- يعرض رسائل + رسائل نظام (انضمام). شارات ADMIN/OVERSEER. زر حذف عند hover للأهل + القائد + الأدمن. حالات: optimistic (opacity 0.7) / failed (خاتم أحمر).

#### [chat/MessageInput.js](components/chat/MessageInput.js)
- **Props:** `groupId`, `group`, `sendMessage`, `isReadOnly`, `currentUser`.
- **أزرار:** 📎 (اختيار ملف ≤25MB) / Send (`POST /api/groups/[id]/messages`).

#### [chat/ActiveNodesSidebar.js](components/chat/ActiveNodesSidebar.js)
- يعرض فقط المجموعات التي المستخدم عضو/قائد فيها. كل بند → `/hub/chat/{id}`.

#### [chat/ResourcesSidebar.js](components/chat/ResourcesSidebar.js)
- يستخرج المرفقات المعتمدة من `messages`. **زر Download** → URL مباشر.

#### [chat/ModerationPanel.js](components/chat/ModerationPanel.js)
- لوحة سريعة للقائد. **أزرار:**
  - Join Requests: ✓ يضيف للأعضاء + يزيد memberCount. ✗ يحدث status:"rejected".
  - Files: ✓ `PATCH /api/groups/[id]/messages/[msgId]`. ✗ `DELETE …/messages/[msgId]`.

#### [chat/OverseerPanel.js](components/chat/OverseerPanel.js)
- 3 تبويبات (Join Requests / Resources / Settings). تفاصيل في 3.10.

#### [chat/GroupSettings.js](components/chat/GroupSettings.js) / [chat/GroupMembers.js](components/chat/GroupMembers.js) / [chat/MemberListDrawer.js](components/chat/MemberListDrawer.js)
- GroupSettings: حفظ → `PATCH /api/groups/[id]`.
- GroupMembers: جلب أعضاء من `users` + زر Kick → `DELETE /api/groups/[id]/members/[uid]`.
- MemberListDrawer: درج منزلق، بحث، حالة online/offline من `lastSeen`. زر إزالة للقائد.

### 4.4 مكونات الأدمن

#### [admin/AdminPendingTable.js](components/admin/AdminPendingTable.js)
- جدول + 3 أزرار لكل صف: 👁️ (IDCardModal) / ✓ (approve) / ✗ (reject).

#### [admin/AdminUsersTable.js](components/admin/AdminUsersTable.js)
- جدول للطلاب المقبولين. زر 👁️ (بطاقة) + Shield Alert (placeholder).

#### [admin/AdminGroupsTable.js](components/admin/AdminGroupsTable.js)
- جدول المجموعات + 3 أزرار: Members / Visit / Delete.

#### [admin/IDCardModal.js](components/admin/IDCardModal.js)
- خلفية سوداء شفافة + صورة كبيرة + X للإغلاق.

---

## القسم 5 — شرح الصفحات (Pages)

### 5.1 [app/page.js](app/page.js) — Landing
- **Guard:** زائر فقط. إن وُجد `userData` → توجيه (admin/pending/onboarding/hub) مع timeout 2s.
- **أزرار:** Theme toggle / Join Us → /auth?mode=register / Sign In → /auth / Explore Platform → /auth.

### 5.2 [app/auth/page.js](app/auth/page.js) — Auth
- تبويبان: Sign In + Register. لتفاصيل الحقول والأزرار راجع 3.1 و 3.2.

### 5.3 [app/pending/page.js](app/pending/page.js) — Pending
- **Guard:** يوجّه إذا status تقدّمت.
- **زر:** Log out.

### 5.4 [app/onboarding/page.js](app/onboarding/page.js) — Onboarding
- 3 خطوات. **خاصية حرجة:** `finalizingRef` لمنع race condition (3.4).
- **أزرار:** Continue (Step1) / Finish (Step2) / The Hub (Step3 → window.location.replace).

### 5.5 [app/hub/page.js](app/hub/page.js) — Feed
- **Guard:** عبر useAuth (يجب status:active + onboarded).
- **يجلب:** آخر 25 منشور (onSnapshot).
- **States:** `posts`, `newPost`, `selectedFile`, `openCommentsFor`, `commentsByPost`, ...
- **أزرار:**
  - Post Forge: 📎 (إرفاق) / Transmit (`POST /api/posts` بعد رفع الملف).
  - ❤️ Like → `POST /api/posts/[id]/like`.
  - 💬 Toggle Comments → `GET /api/posts/[id]/comments`.
  - Reply → `POST /api/posts/[id]/comments` (optimistic UI + transaction يزيد commentsCount).

### 5.6 [app/explore/page.js](app/explore/page.js) — Explore
- **يجلب:** `useAllGroups()` + `useMyGroups()` + pending requests.
- **States:** `searchQuery`, `filters{university,major,level}`, `showFilters`, `openDropdown`, `selectedNode`, `pendingGroupIds`.
- **أزرار:** بحث/فلاتر/Join/Pending. تفاصيل في 3.5.

### 5.7 [app/hub/chat/[id]/page.js](app/hub/chat/[id]/page.js) — Chat
- فحص الصلاحيات الثلاثي (3.6). يستخدم `useChat(groupId, ...)` للرسائل.

### 5.8 [app/profile/page.js](app/profile/page.js) — Profile
- **يجلب:** `users/{uid}` + count من `groups` و `resources`.
- **States:** `stats`, `uploading`, `success`, `editing`.
- **أزرار:** Avatar upload / Edit Profile → modal → PATCH /api/user/profile.

### 5.9 [app/admin/page.js](app/admin/page.js) — Admin
- **Guard:** `userData.role === "admin"`، وإلا → /hub.
- **يجلب:** كل `users` + كل `groups` عبر onSnapshot (مرتبة createdAt desc).
- **States:** `tab`, `allUsers`, `allGroups`, `viewID`, `searchQuery`, `processingId`.
- التبويبات والأزرار في 3.13.

### 5.10 [app/groups/create/page.js](app/groups/create/page.js) — Create Group
- نموذج بسيط → `POST /api/groups` → ينشئ المستند ويضيف ID إلى `user.groups`.

### 5.11 [app/layout.js](app/layout.js) — Root Layout
- يلفّ بـ `ThemeProvider` + `AuthProvider`. metadata: "Twassel - A cozy place for scholars".

---

## القسم 6 — طبقة lib/

### 6.1 [useAuth.js](lib/useAuth.js)
- يوفّر `useAuth() → {user, userData, loading, ...}`.
- `onIdTokenChanged` يراقب Firebase Auth.
- يجلب مستند users (وfallback لـ `/api/user/profile`).
- `onSnapshot` real-time → عند تغير `status` يجدّد التوكن (سطر 82).
- **منطق التوجيه (السطور 97-130):** انظر 3.2.

### 6.2 [apiClient.js](lib/apiClient.js)
- `api(path, options)`: 
  - يجلب التوكن (`user.getIdToken()`).
  - يضيف `Authorization: Bearer ${token}`.
  - timeout 15s.
  - retry تلقائي على 401/403 مع refresh.
  - يدعم FormData (بدون Content-Type يدوي).
- `refreshIdToken()` للتحديث اليدوي.

### 6.3 [authErrors.js](lib/authErrors.js)
- `mapAuthError(code)` → سلسلة عربية مفهومة:
  - `auth/invalid-credential` → "بيانات خاطئة"
  - `auth/email-already-in-use` → "البريد مستخدم بالفعل"
  - `auth/weak-password` → "كلمة المرور ضعيفة"
  - ... إلخ.

### 6.4 [collectionNames.js](lib/collectionNames.js)
ثوابت أسماء الـ collections — استخدمها بدلاً من النصوص المباشرة:
- `users` — المستخدمون.
- `groups` — المجموعات/Nodes.
- `messages` — رسائل الدردشة.
- `posts` — منشورات الـ Feed.
- `notifications` — التنبيهات.
- `resources` — موارد المجموعات.
- `join-requests` — طلبات الانضمام.

### 6.5 helpers أخرى
- [firebase.js](lib/firebase.js): client SDK + persistence (indexedDB/local/session).
- [firebaseAdmin.js](lib/firebaseAdmin.js): admin SDK من متغيرات البيئة (يصحّح `\\n` في المفتاح).
- [firestore.js](lib/firestore.js): barrel يصدر `adminDb`, `adminAuth`, `FieldValue`, `Timestamp` — server-only.
- [verifyAdmin.js](lib/verifyAdmin.js): يتحقق من custom claim `admin` (fast path) + fallback إلى role في Firestore + auto-sync.
- [withAuth.js](lib/withAuth.js): wrappers للـ routes: `withAuth`, `withAdmin`, `withPublic`, `withErrorHandling`, `safeJson`.
- [collections.js](lib/collections.js): builders للمستندات (buildUserDoc, buildGroupDoc, buildMessageDoc, ...) — server-only.
- [academicData.js](lib/academicData.js): UNIVERSITIES, MAJORS, LEVELS + LABELS قصيرة للـ chips.
- [relevance.js](lib/relevance.js): خوارزمية اقتراح (نقاط: تخصص×10، مستوى×4، شعبية، حداثة).
- [fileLinks.js](lib/fileLinks.js): `buildViewUrl` / `buildDownloadUrl` / `isViewableInBrowser` / `isPdf`.
- [useChat.js](lib/useChat.js): مستمعات messages + join-requests + pending-files، optimistic UI، فلترة الملفات حسب الصلاحية.
- [useMyGroups.js](lib/useMyGroups.js): `where("members","array-contains",uid)` + `status:active` + orderBy updatedAt.
- [useAllGroups.js](lib/useAllGroups.js): `where("isPublic",true)` + limit 30.
- [useJoinRequests.js](lib/useJoinRequests.js): مستمع للطلبات pending للقائد.
- [useFileUpload.js](lib/useFileUpload.js): `upload()` + `uploadAndSend()` (max 10MB افتراضياً).
- [useApi.js](lib/useApi.js): `useApi()` و `useApiFetch()` — يضمنان عدم spinner stuck.
- [notify.js](lib/notify.js): `notify({userId,title,body,link})` من الـ client.
- [serverNotify.js](lib/serverNotify.js): `notifyUser`, `notifyMany`, `extractMentionedUids`.
- [mongodb.js](lib/mongodb.js): اتصال MongoDB مخبّأ (مهيأ لكن غير مستخدم في core flows).

---

## القسم 7 — الـ API Routes

> كل المسارات تحت `app/api/`. جميعها تستعمل `withAuth` أو `verifyAdmin` ما لم يُذكر.

### المصادقة والمستخدم
| Endpoint | الوظيفة | Input | يكتب في |
|---|---|---|---|
| `POST /api/login` | بحث عن email من matricule | `{matricule}` | — |
| `POST /api/register` | إنشاء حساب كامل | FormData (matricule, fullName, email, password, studentCard) | `users` + Auth + Cloudinary |
| `GET /api/user/profile` | جلب الملف | Bearer | — |
| `PATCH /api/user/profile` | تحديث | حقول مسموحة فقط | `users` |
| `POST /api/user/setup` | إنهاء onboarding بديل | `{university, department, bio, avatarUrl}` | `users` |
| `GET /api/user/pending-requests` | IDs الطلبات المعلقة | Bearer | — |
| `POST /api/upload` | رفع لـ Cloudinary | FormData (file, folder) | Cloudinary |
| `GET /api/download` | proxy آمن للملفات | `?url=&name=&disposition=` | — (يضمن Cloudinary host فقط) |

### المنشورات (Feed)
| Endpoint | الوظيفة |
|---|---|
| `GET /api/posts?limit=50` | آخر المنشورات (public) |
| `POST /api/posts` | إنشاء (`text ≤ 2000`) |
| `DELETE /api/posts/[id]` | حذف (المؤلف أو admin) |
| `POST /api/posts/[id]/like` | toggle like (transaction) |
| `GET /api/posts/[id]/comments` | تعليقات (asc) |
| `POST /api/posts/[id]/comments` | إضافة (`content ≤ 1000`) + زيادة commentsCount (transaction) |

### المجموعات والرسائل
| Endpoint | الوظيفة |
|---|---|
| `POST /api/groups` | إنشاء مجموعة (leaderId = currentUser) |
| `PATCH /api/groups/[id]` | تحديث (leader فقط) |
| `DELETE /api/groups/[id]` | حذف (leader أو admin) + كل messages/resources/join-requests |
| `POST /api/groups/[id]/messages` | إرسال رسالة (مع moderation للملفات) |
| `PATCH /api/groups/[id]/messages/[msgId]` | اعتماد ملف (leader) |
| `DELETE /api/groups/[id]/messages/[msgId]` | حذف ملف (leader) + Cloudinary + إشعار |
| `DELETE /api/groups/[id]/members/[uid]` | إزالة عضو (leader) |
| `POST /api/groups/[id]/join-requests` | طلب انضمام (open=فوري / protected=pending) |
| `PATCH /api/groups/[id]/join-requests/[reqId]` | approve/reject |
| `POST /api/groups/[id]/resources` | رفع مورد |
| `PATCH /api/groups/[id]/resources/[resId]` | approve/reject |

### الإشعارات
| Endpoint | الوظيفة |
|---|---|
| `GET /api/notifications` | إشعارات المستخدم (50، desc) |
| `POST /api/notifications` | إنشاء (لخدمات داخلية) |
| `PATCH /api/notifications` | mark all as read (batch) |
| `PATCH /api/notifications/[id]` | mark one |

### Admin
| Endpoint | الوظيفة |
|---|---|
| `GET /api/admin/users` | كل المستخدمين |
| `POST /api/admin/users` | إنشاء طالب يدوياً |
| `PATCH /api/admin/users/[uid]` | تحديث + sync custom claims |
| `DELETE /api/admin/users/[uid]` | حذف من Firestore + Auth |
| `POST /api/admin/users/[uid]/approve` | status→active + claims + revoke tokens |
| `POST /api/admin/users/[uid]/reject` | status→rejected |
| `POST /api/admin/sync-claims` | (لمرة واحدة) مزامنة claims للجميع — يتطلب MIGRATION_SECRET |
| `DELETE /api/admin/groups/[id]` | حذف batch atomic |

---

## القسم 8 — نموذج بيانات Firestore

### Collection: `users`
```
uid, matricule (lowercase), fullName, email, password (في Auth فقط)
role: "student" | "admin"
status: "pending" | "active" | "rejected" | "onboarding"
onboarded: boolean
avatarUrl, studentCardUrl
university, department, major, level
bio (≤500), socialLinks: {github, linkedin, portfolio}
profileVisibility: "public" | "scholars_only"
groups: string[]  // IDs المجموعات المنتمي إليها
createdAt, updatedAt, createdByAdmin?
```

### Collection: `groups`
```
id, name, leaderId
description, rules, subject, major, university, level, tags[]
accessType: "open" | "protected"
questions: string[]  // فقط للـ protected
maxMembers: 2-200 (default 30)
isPublic: boolean
isReadOnly: boolean?
members: string[]  // UIDs (max maxMembers)
memberCount: number  // مرآة لطول members
membersList?: object  // اختياري للعرض السريع
createdAt, updatedAt
```

### Collection: `messages`
```
id, groupId, authorId
text?, fileUrl?, fileName?, fileType?, fileSize?
moderationStatus: "pending" | "approved"
isSystem: boolean?  // رسائل النظام (انضمام)
createdAt
```

### Collection: `posts` (Feed عام)
```
id, uid, authorName, authorAvatar, authorRole, major
content (≤2000), tag?
fileUrl?, fileName?
likes: string[]  // UIDs الذين أعجبوا
commentsCount: number
createdAt

// subcollection: posts/{id}/comments
{ content, authorId, authorName, authorAvatar, authorRole, createdAt }
```

### Collection: `notifications`
```
userId, title, body?, link?
type: "review" | "file_update" | "new_member" | "mention" | ...
read: boolean
createdAt
```

### Collection: `resources`
```
groupId, uploadedBy, fileName, fileUrl, fileType, fileSize
status: "pending" | "approved" | "rejected"
createdAt
```

### Collection: `join-requests`
```
groupId, userId, answers: string[]
status: "pending" | "approved" | "rejected"
createdAt
```

### العلاقات
- `users.uid` ↔ `groups.leaderId` (1 → كثير).
- `users.uid` ∈ `groups.members[]` (كثير ↔ كثير).
- `groups.id` → `messages.groupId` / `resources.groupId` / `join-requests.groupId` (1 → كثير).
- `users.uid` → `notifications.userId` (1 → كثير).
- `posts.uid` → `users.uid`. Comments subcollection داخل المنشور.

---

## القسم 9 — نظام التصميم

### الألوان
- `accent` = `#7c83f2` (أرجواني — أزرار رئيسية، حدود التركيز، شارات).
- `cream` = `#F8F8F5` (خلفية فاتحة).
- `sand` ≈ `#E8E8E5` (حدود فاتحة، فواصل).
- `ink` = نص غامق (`rgb(var(--c-ink))`).
- ⚠️ **لا تضف ألواناً خارج هذه المجموعة** بدون مبرر.

### الخطوط
- `font-display italic` للعناوين الكبيرة (Lora غالباً).
- `font-serif italic` للأوصاف.
- `font-sans` للواجهات (Plus Jakarta Sans).

### الأبعاد
- البطاقات: `rounded-3xl` أو `rounded-[2rem]`.
- الأزرار: `rounded-2xl`.
- الظلال: `shadow-soft`, `shadow-warm`.

### Tailwind + Framer Motion
- Tailwind للـ utility classes (responsive: `md:`, `lg:`, `xl:`).
- Framer Motion للحركات: `initial/animate/exit` + spring (damping 26, stiffness 280). مدد 0.25-0.5s.

---

## القسم 10 — المخاطر والقواعد الحرجة

> هذه القواعد من [CLAUDE.md](CLAUDE.md). كسرها يكسر التطبيق.

1. ❌ **لا تستورد من `lib/i18n/`** — حُذف بالكامل. أي استيراد قديم سيكسر البناء.
2. ❌ **لا تعدّل `firestore.rules`** — غير موجود في الـ repo؛ القواعد الأمنية تُدار خارجياً، فلا تفترض شكلها.
3. ❌ **لا تكسر فحص الصلاحيات** في [chat/[id]/page.js](app/hub/chat/[id]/page.js) — الفحص الثلاثي `member|leader|admin` هو خط الدفاع الأول قبل تحميل المحادثة.
4. ✅ **استخدم `useAuth()` دائماً** — لا تستدعِ Firebase Auth مباشرة في الصفحات. الـ context يدير الجلسة + التوجيه + onSnapshot real-time في مكان واحد.
5. ✅ **التزم بنظام الألوان** (cream/ink/accent/sand). أي لون جديد يكسر التماسك البصري.
6. ✅ **commit قبل refactor كبير** — حالياً 25+ ملف معدّل غير ملتزم.
7. ⚠️ **`finalizingRef` في onboarding** — لا تزله. يمنع race condition بين `onSnapshot` (الذي يلاحظ `onboarded:true`) وحفظ البيانات (3.4). إزالته تُفقد شاشة "Welcome".
8. ⚠️ **`onSnapshot` يسبب re-renders كثيرة** — احذر من `setState` داخل `useEffect` بدون deps صحيحة، ستحصل على حلقة لا نهائية.
9. ⚠️ **الصفحات الضخمة** (hub, chat, admin) قابلة للتفكيك تدريجياً — لكن لا تعد كتابتها دفعة واحدة. المستخدم يفضّل خطوات صغيرة قابلة للاختبار.
10. ⚠️ **استخدم ثوابت [collectionNames.js](lib/collectionNames.js)** بدلاً من النصوص. تغيير اسم collection بالنصوص ينسى ملفات عدة.
11. ⚠️ **Custom Claims:** بعد موافقة/تحديث الأدمن، يتم `revokeRefreshTokens` لإجبار جلب توكن جديد. لا تزل ذلك أو ستبقى الـ claims القديمة في جلسة المستخدم.

---

## القسم 10.5 — فهرس الدوال (Functions Catalog)

> كل الدوال الرئيسية في المشروع مع اسمها + ملفها + ما تفعل.

### 10.5.1 دوال طبقة lib/

#### [useAuth.js](lib/useAuth.js)
| الدالة | العمل |
|---|---|
| `AuthProvider({children})` | Context provider — يلفّ التطبيق. يدير `user`, `userData`, `loading`, `onSnapshot` real-time على مستند users، وتجديد التوكن عند تغيّر status |
| `useAuth()` | hook — يرجع `{user, userData, loading, ...}` |
| `fetchUserData(uid)` | يجلب مستند users (fallback: `GET /api/user/profile`) |
| منطق التوجيه (داخل useEffect) | يحدد الوجهة حسب status + onboarded + role + path |

#### [apiClient.js](lib/apiClient.js)
| الدالة | العمل |
|---|---|
| `api(path, options)` | fetch wrapper — يضيف `Authorization: Bearer <token>` تلقائياً + timeout 15s + retry على 401/403 |
| `refreshIdToken()` | يجبر تجديد JWT من Firebase |
| `getAuthToken()` | يجلب التوكن الحالي بدون refresh |

#### [authErrors.js](lib/authErrors.js)
| الدالة | العمل |
|---|---|
| `mapAuthError(code)` | يحوّل رمز خطأ Firebase (`auth/invalid-credential` ...) إلى رسالة عربية للمستخدم |

#### [withAuth.js](lib/withAuth.js)
| الدالة | العمل |
|---|---|
| `withErrorHandling(handler)` | wrapper عام مع timeout 10s + ترجمة أخطاء Firebase |
| `withAuth(handler)` | يتطلب Bearer token صحيح — يمرر `{uid, user, decodedToken}` للـ handler |
| `withAdmin(handler)` | مثل withAuth + يتحقق `role === "admin"` |
| `withPublic(handler)` | لـ APIs العامة (بدون auth) |
| `safeJson(req)` | يجلب JSON body بأمان — يرجع `{}` إذا فشل |

#### [verifyAdmin.js](lib/verifyAdmin.js)
| الدالة | العمل |
|---|---|
| `getUserByUid(uid)` | يبحث في users بـ doc ID أولاً ثم بـ field `uid` |
| `extractIdentity(request)` | يكتشف JWT vs UID خام، ويتحقق من JWT signature |
| `verifyAdmin(request)` | Fast path عبر `claims.admin` ثم fallback لـ Firestore + auto-sync claims |

#### [collections.js](lib/collections.js) — builders للمستندات
| الدالة | العمل |
|---|---|
| `buildUserDoc(data)` | يبني مستند users بـ defaults (role:student, status:pending, onboarded:false, groups:[]) |
| `buildGroupDoc(data)` | يبني مستند groups بـ defaults (accessType, maxMembers:30, memberCount:0) |
| `buildMessageDoc(data)` | يبني مستند messages + يضبط moderationStatus |
| `buildPostDoc(data)` | يبني مستند posts (likes:[], commentsCount:0) |
| `buildNotificationDoc(data)` | يبني مستند notifications (read:false) |
| `buildJoinRequestDoc(data)` | يبني مستند join-requests (status:pending) |

#### [relevance.js](lib/relevance.js)
| الدالة | العمل |
|---|---|
| `relevanceScore(group, user)` | يحسب نقاط ذات الصلة (تخصص×10، مستوى×4، شعبية، حداثة) |
| `selectMajorMatched(groups, user, n)` | يختار n مجموعات تطابق تخصص المستخدم |
| `selectHighFrequency(groups, n)` | يختار أنشط n مجموعة (memberCount + حداثة) |
| `excludeIds(groups, ids)` | يستبعد المجموعات المحددة من القائمة |
| `tokenize(text)` | تقسيم نص إلى tokens بسيطة للمطابقة |

#### [fileLinks.js](lib/fileLinks.js)
| الدالة | العمل |
|---|---|
| `buildViewUrl(url, name)` | يبني رابط عرض inline عبر `/api/download` |
| `buildDownloadUrl(url, name)` | يبني رابط تنزيل (attachment) |
| `isViewableInBrowser(type)` | يتحقق إذا الـ MIME type قابل للعرض في المتصفح |
| `isPdf(type)` | يتحقق إذا الملف PDF |
| `getFileExtension(name)` | يستخرج الامتداد |

#### [useChat.js](lib/useChat.js)
| الدالة | العمل |
|---|---|
| `useChat(groupId, currentUser, group)` | hook رئيسي — يرجع `{messages, sendMessage, joinRequests, pendingFiles, ...}` |
| `sendMessage({text, fileUrl, ...})` | يضيف optimistic message + يستدعي `POST /api/groups/[id]/messages` |
| `matchOptimistic(real, optimistic)` | يطابق الرسالة الحقيقية مع المؤقتة (uid + content + fileUrl) |
| `filterMessages(messages, role)` | يفلتر الملفات pending حسب الصلاحية |

#### Hooks أخرى
| الـ Hook / الملف | العمل |
|---|---|
| `useMyGroups()` — [useMyGroups.js](lib/useMyGroups.js) | onSnapshot على `groups where members array-contains uid` + active + orderBy updatedAt |
| `useAllGroups()` — [useAllGroups.js](lib/useAllGroups.js) | onSnapshot على `groups where isPublic == true` limit 30 |
| `useJoinRequests(groupId)` — [useJoinRequests.js](lib/useJoinRequests.js) | onSnapshot على `join-requests where groupId == X and status == pending` |
| `useFileUpload()` — [useFileUpload.js](lib/useFileUpload.js) | يرجع `{upload, uploadAndSend, uploading, progress}` |
| `upload(file, folder)` | يرفع ملف لـ `/api/upload` ويرجع `{url, public_id}` (max 10MB) |
| `uploadAndSend(file, groupId, text)` | يرفع ثم يستدعي API الرسائل دفعة واحدة |
| `useApi()` — [useApi.js](lib/useApi.js) | wrapper آمن لـ async — يضمن `setLoading(false)` حتى عند unmount |
| `useApiFetch(fn, deps)` | variant يجلب تلقائياً عند تغيّر deps |

#### [notify.js](lib/notify.js) + [serverNotify.js](lib/serverNotify.js)
| الدالة | العمل |
|---|---|
| `notify({userId, title, body, link})` | (client) يرسل POST لـ `/api/notifications` |
| `notifyUser({userId, title, body, link, type})` | (server) ينشئ مستند notifications مباشرة |
| `notifyMany(userIds, payload)` | (server) ينشئ إشعارات لعدة مستخدمين (de-duped) |
| `extractMentionedUids(text, members)` | يستخرج `@Name` و `@"Full Name"` من نص ويطابقها بالأعضاء |

#### مساعدات Firebase Admin
| الدالة | الملف | العمل |
|---|---|---|
| `snapToObj(snap)` | [firebaseAdmin.js](lib/firebaseAdmin.js) | يحوّل Firestore document إلى JSON عادي |
| `listSnap(querySnap)` | [firebaseAdmin.js](lib/firebaseAdmin.js) | يحوّل query snapshot إلى array |
| `convertTimestamps(obj)` | [firebaseAdmin.js](lib/firebaseAdmin.js) | يحوّل Firestore Timestamps إلى ISO strings |

---

### 10.5.2 دوال صفحات Auth

#### [auth/page.js](app/auth/page.js)
| الدالة | العمل |
|---|---|
| `handleSignIn(e)` | يستدعي `/api/login` لجلب email ثم `signInWithEmailAndPassword` |
| `handleRegister(e)` | يبني FormData ويرسلها لـ `/api/register` ثم تسجيل دخول تلقائي |
| `togglePasswordVisibility()` | يظهر/يخفي حقل كلمة المرور |
| `handleFileChange(e)` | يستقبل بطاقة الطالب من input file |

#### [pending/page.js](app/pending/page.js)
| الدالة | العمل |
|---|---|
| `handleLogout()` | `signOut(auth)` + `router.push("/auth")` |
| useEffect guard | يوجّه حسب status (active+onboarded → /hub، active!onboarded → /onboarding، admin → /admin) |

#### [onboarding/page.js](app/onboarding/page.js)
| الدالة | العمل |
|---|---|
| `handleStep1Continue()` | يتحقق من university+major+level ثم step=2 |
| `handleAvatarUpload(file)` | يرفع الصورة لـ `/api/upload` (folder:avatars) |
| `handleFinalize()` | يضع `finalizingRef.current=true` + `updateDoc(users/{uid}, {onboarded:true, ...})` ثم step=3 |
| `handleGoToHub()` | `window.location.replace("/hub")` (لا router.push لتفادي race) |

#### [page.js](app/page.js) (Landing)
| الدالة | العمل |
|---|---|
| useEffect guard | يوجّه المستخدم المسجَّل (admin/pending/onboarding/hub) مع timeout 2s |

---

### 10.5.3 دوال صفحة Hub

#### [hub/page.js](app/hub/page.js)
| الدالة | العمل |
|---|---|
| `handleCreatePost()` | يرفع الملف (إن وُجد) → `POST /api/posts` → ينظف الحقول |
| `handleLike(postId)` | `POST /api/posts/[id]/like` — toggle |
| `toggleComments(postId)` | يفتح/يغلق + يجلب من `GET /api/posts/[id]/comments` إذا أول مرة |
| `handleCommentSubmit(postId)` | optimistic update + `POST /api/posts/[id]/comments` + تحديث commentsCount |
| `handleFileSelect(e)` | يضع الملف في `selectedFile` state |
| `clearSelectedFile()` | يزيل المرفق قبل الإرسال |
| `getFirstName(fullName)` | يستخرج الاسم الأول للـ placeholder |

---

### 10.5.4 دوال صفحة Explore

#### [explore/page.js](app/explore/page.js)
| الدالة | العمل |
|---|---|
| `filteredNodes` (useMemo) | يطبق search + university + major + level filters |
| `smartShelves` (useMemo) | يبني `In your field` و `Trending` عبر relevance.js |
| `handleNodeClick(node)` | للأدمن → ينتقل لـ chat. للطالب → يفتح `JoinNodeModal` |
| `toggleDropdown(key)` | يفتح/يغلق منسدلة فلتر |
| `clearFilters()` | يصفّر كل الفلاتر |
| `loadPendingRequests()` | `GET /api/user/pending-requests` → Set من IDs |
| `handleJoined(groupId)` | يحدّث pendingGroupIds بعد إرسال طلب |

---

### 10.5.5 دوال صفحة Chat

#### [hub/chat/[id]/page.js](app/hub/chat/[id]/page.js)
| الدالة | العمل |
|---|---|
| `loadGroup()` | `getDoc(groups/{id})` + فحص member/leader/admin |
| `handleError(code)` | يعرض رسالة (not-found / forbidden / fetch-failed) |
| `handleDeleteMessage(msgId)` | `DELETE /api/groups/[id]/messages/[msgId]` |

#### [chat/ChatHeader.js](components/chat/ChatHeader.js)
| الدالة | العمل |
|---|---|
| `handleBack()` | router.push إلى `/hub` أو `/admin` حسب `from` param |
| `handleDeleteGroup()` | تأكيد + `DELETE /api/groups/[id]` |
| `openMemberDrawer()` | يفتح MemberListDrawer |

#### [chat/MessageList.js](components/chat/MessageList.js)
| الدالة | العمل |
|---|---|
| `canDelete(msg)` | يحسب صلاحية الحذف (المؤلف/القائد/الأدمن) |
| `scrollToBottom()` | يمرر للأسفل عند رسالة جديدة |
| `formatTime(ts)` | تنسيق وقت |
| `getRoleBadge(authorId)` | يحدد إن كانت الرسالة من ADMIN/OVERSEER |

#### [chat/MessageInput.js](components/chat/MessageInput.js)
| الدالة | العمل |
|---|---|
| `handleSend()` | sendMessage(text) — إن وُجد ملف، يرفع أولاً |
| `handleFileSelect(e)` | يتحقق ≤25MB + يضع في state |
| `handleAttachClick()` | يفتح dialog الملف |
| `handleKeyDown(e)` | Enter → إرسال (Shift+Enter → سطر جديد) |
| `clearFile()` | يلغي المرفق |

#### [chat/ResourcesSidebar.js](components/chat/ResourcesSidebar.js)
| الدالة | العمل |
|---|---|
| `approvedResources` (useMemo) | يفلتر `messages` لأخذ المرفقات المعتمدة فقط |
| `handleDownload(url, name)` | فتح `buildDownloadUrl(url, name)` |

#### [chat/ActiveNodesSidebar.js](components/chat/ActiveNodesSidebar.js)
| الدالة | العمل |
|---|---|
| `myNodes` (filter) | يعرض فقط المجموعات التي المستخدم عضو/قائد فيها |
| `handleSelect(nodeId)` | router.push لـ `/hub/chat/{nodeId}` |

#### [chat/ModerationPanel.js](components/chat/ModerationPanel.js)
| الدالة | العمل |
|---|---|
| `handleApproveRequest(reqId, userId)` | يضيف userId إلى members + memberCount++ + يحدّث request |
| `handleRejectRequest(reqId)` | يحدّث request.status:rejected |
| `handleApproveFile(msgId)` | `PATCH /api/groups/[id]/messages/[msgId]` |
| `handleRejectFile(msgId)` | `DELETE …/messages/[msgId]` + حذف من Cloudinary |

#### [chat/OverseerPanel.js](components/chat/OverseerPanel.js)
| الدالة | العمل |
|---|---|
| `handleApproveJoin(req)` | يقبل طلب الانضمام + ينشئ رسالة نظام |
| `handleRejectJoin(req)` | يرفض الطلب |
| `handleApproveResource(resId)` | اعتماد مورد |
| `handleRejectResource(resId)` | حذف مورد + إشعار |
| `handleSaveSettings(updates)` | `PATCH /api/groups/[id]` |
| `switchTab(tabName)` | يبدّل بين Join Requests / Resources / Settings |

#### [chat/GroupSettings.js](components/chat/GroupSettings.js) / [GroupMembers.js](components/chat/GroupMembers.js) / [MemberListDrawer.js](components/chat/MemberListDrawer.js)
| الدالة | العمل |
|---|---|
| `handleSave()` (GroupSettings) | `PATCH /api/groups/[id]` بكل الحقول المعدّلة |
| `fetchMembers()` (GroupMembers) | يجلب بيانات الأعضاء من users |
| `handleKick(uid)` | `DELETE /api/groups/[id]/members/[uid]` |
| `filteredMembers` (MemberListDrawer) | يطبق search query |
| `isOnline(lastSeen)` | يحدد إن كان آخر ظهور < 5 دقائق |

#### [MessageAttachment.js](components/MessageAttachment.js)
| الدالة | العمل |
|---|---|
| `handleView()` | يفتح `buildViewUrl(...)` في تبويب جديد |
| `handleDownload()` | يفتح `buildDownloadUrl(...)` |
| `formatSize(bytes)` | تنسيق KB/MB |

---

### 10.5.6 دوال صفحة Profile

#### [profile/page.js](app/profile/page.js)
| الدالة | العمل |
|---|---|
| `handleAvatarChange(e)` | يتحقق نوع + يرفع لـ `/api/upload` (avatars) + `updateDoc(users)` |
| `fetchStats()` | `getCountFromServer` على groups (member of) + resources |
| `openEditModal()` | يضع `editing=true` |

#### EditProfileModal (داخل profile/page.js)
| الدالة | العمل |
|---|---|
| `handleSave()` | يتحقق (fullName≥2, bio≤500) + `PATCH /api/user/profile` + يغلق |
| `handleSocialChange(platform, url)` | يحدّث socialLinks state |
| `validate()` | يرجع errors object |

---

### 10.5.7 دوال صفحة Admin

#### [admin/page.js](app/admin/page.js)
| الدالة | العمل |
|---|---|
| `handleApprove(uid)` | `POST /api/admin/users/[uid]/approve` + setProcessingId |
| `handleReject(uid)` | تأكيد + `POST /api/admin/users/[uid]/reject` |
| `filteredData` (useMemo) | يبني 3 قوائم (pending/scholars/groups) حسب tab + searchQuery |
| `handleTabChange(tabName)` | يبدّل التبويب + يعيد searchQuery |
| `openIDModal(url)` | يضع `viewID=url` لفتح IDCardModal |

#### [admin/AdminPendingTable.js](components/admin/AdminPendingTable.js)
| الـ Prop callback | العمل |
|---|---|
| `onApprove(uid)` | يستدعي handleApprove من الصفحة الأم |
| `onReject(uid)` | يستدعي handleReject |
| `onViewID(url)` | يفتح IDCardModal |

#### [admin/AdminGroupsTable.js](components/admin/AdminGroupsTable.js)
| الدالة | العمل |
|---|---|
| `handleDelete(group)` | تأكيد + `DELETE /api/admin/groups/[id]` (batch atomic) |
| `handleVisit(groupId)` | router.push لـ `/hub/chat/[id]?from=admin` |
| `openManageMembers(group)` | يفتح ManageMembersModal |
| `handleRemoveMember(memberId)` | `updateDoc` بـ arrayRemove + increment(-1) |

#### [admin/IDCardModal.js](components/admin/IDCardModal.js)
| الدالة | العمل |
|---|---|
| `handleBackdropClick(e)` | يغلق إذا الضغط على الخلفية فقط |
| `handleClose()` | يستدعي `onClose` prop |

---

### 10.5.8 دوال المكونات العامة

#### [Sidebar.js](components/Sidebar.js)
| الدالة | العمل |
|---|---|
| `handleNavigate(path)` | router.push للصفحة |
| `handleLogout()` | `signOut(auth)` + redirect |
| `isActive(path)` | يحدد التبويب النشط |

#### [SettingsMenu.js](components/SettingsMenu.js)
| الدالة | العمل |
|---|---|
| `toggleMenu()` | يفتح/يغلق المنسدلة |
| `handleThemeToggle()` | `setTheme(theme === "dark" ? "light" : "dark")` |
| `openSecurity()` | يفتح SecurityModal |
| `openPrivacy()` | يفتح PrivacyModal |
| `handleLogout()` | تسجيل خروج |
| `calculatePosition()` | يحسب موضع المنسدلة fixed-position |

#### [SettingsModals.js](components/SettingsModals.js)
| الدالة | العمل |
|---|---|
| `handleSendReset()` (Security) | `sendPasswordResetEmail(auth, email)` + flash message |
| `handleSavePrivacy()` (Privacy) | `updateDoc(users/{uid}, {profileVisibility})` |
| `selectOption(value)` (Privacy) | يحدّث radio selection |

#### [NotificationCenter.js](components/NotificationCenter.js)
| الدالة | العمل |
|---|---|
| `toggleDropdown()` | يفتح/يغلق |
| `handleMarkAllRead()` | `PATCH /api/notifications` (batch) |
| `handleNotificationClick(n)` | `PATCH /api/notifications/[id]` + `router.push(n.link)` |
| `unreadCount` (useMemo) | يحسب عدد read:false |
| `formatRelativeTime(ts)` | "منذ 5د", "منذ ساعة" ... |
| `getIconForType(type)` | يرجع أيقونة حسب نوع الإشعار |

#### [DiscoveryGrid.js](components/DiscoveryGrid.js)
| الدالة | العمل |
|---|---|
| `getButtonState(node)` | يقرر Join / Open / Pending… حسب الصلاحية والـ pendingGroupIds |
| `handleAction(node)` | يستدعي onJoinClick أو يفتح الـ chat |

#### [explore/NodeShelf.js](components/explore/NodeShelf.js)
| الدالة | العمل |
|---|---|
| `handleViewAll()` | يعرض كل المجموعات في الرف |

#### [explore/JoinNodeModal.js](components/explore/JoinNodeModal.js)
| الدالة | العمل |
|---|---|
| `handleSubmit()` | `POST /api/groups/[id]/join-requests` بـ answers |
| `handleAnswerChange(idx, value)` | يحدّث answers state |
| `handleClose()` | onClose prop |
| `isFormValid` (useMemo) | يتحقق أن كل الأسئلة لها إجابات |

#### [LinkField.js](components/LinkField.js)
| الدالة | العمل |
|---|---|
| `handleChange(e)` | onChange callback |
| `getIcon(name)` | يرجع component الأيقونة |

#### [ThemeProvider.js](components/ThemeProvider.js)
| الدالة | العمل |
|---|---|
| (wrapper) | يلف بـ `next-themes` ThemeProvider بإعدادات `defaultTheme:light, storageKey:twassel-theme` |

---

### 10.5.9 دوال الـ API Routes (Handlers)

> كل handler هو `export async function METHOD(request, {params})`. الجدول أدناه يلخّص ما يفعله جسم كل handler.

#### Auth & User
| Route | Handler | العمل |
|---|---|---|
| `/api/login` | `POST` | بحث في users بـ matricule (lowercase ثم email ثم raw) → يرجع `{user}` |
| `/api/register` | `POST` | تحقق تفرّد + رفع بطاقة Cloudinary + `adminAuth.createUser` + `setDoc(users)` + rollback إن فشل Firestore |
| `/api/user/profile` | `GET` | يرجع مستند users كامل |
| `/api/user/profile` | `PATCH` | تحديث الحقول المسموحة فقط (يرفض uid/email/role/status/matricule) + تنظيف URLs |
| `/api/user/setup` | `POST` | تحديث `onboarded:true, status:approved` مع RBAC (admin يتجاوز university) |
| `/api/user/pending-requests` | `GET` | يرجع `{groupIds: [...]}` من join-requests pending |
| `/api/upload` | `POST` | يرفع لـ Cloudinary (auto-detect image vs raw) → `{url, publicId, resourceType}` |
| `/api/download` | `GET` | proxy آمن (Cloudinary host فقط) + دعم Range + headers آمنة |

#### Posts
| Route | Handler | العمل |
|---|---|---|
| `/api/posts` | `GET` | يرجع آخر `limit` منشور (public) |
| `/api/posts` | `POST` | تحقق `text≤2000` + `addDoc(posts)` |
| `/api/posts/[id]` | `DELETE` | تحقق المؤلف/admin + `deleteDoc` |
| `/api/posts/[id]/like` | `POST` | transaction: toggle uid في likes array |
| `/api/posts/[id]/comments` | `GET` | يرجع comments subcollection (asc) |
| `/api/posts/[id]/comments` | `POST` | تحقق `content≤1000` + transaction (add + commentsCount++) |

#### Groups
| Route | Handler | العمل |
|---|---|---|
| `/api/groups` | `POST` | يبني group بـ leaderId=currentUser + يضيف ID لـ users.groups[] |
| `/api/groups/[id]` | `PATCH` | leader فقط — تحديث name/subject/description/rules/tags/questions/maxMembers |
| `/api/groups/[id]` | `DELETE` | leader/admin — حذف group + كل messages/resources/join-requests |
| `/api/groups/[id]/messages` | `POST` | member فقط — يبني message + moderation logic + `groups.updatedAt` |
| `/api/groups/[id]/messages/[msgId]` | `PATCH` | leader — `moderationStatus:approved` |
| `/api/groups/[id]/messages/[msgId]` | `DELETE` | leader — حذف Cloudinary + message + إشعار للمؤلف |
| `/api/groups/[id]/members/[uid]` | `DELETE` | leader — arrayRemove + decrement memberCount (لا يحذف نفسه) |
| `/api/groups/[id]/join-requests` | `POST` | open=فوري join / protected=create pending request |
| `/api/groups/[id]/join-requests/[reqId]` | `PATCH` | leader — approve (add to members + إشعار) أو reject |
| `/api/groups/[id]/resources` | `POST` | member — leader/admin=approved / student=pending + إشعار |
| `/api/groups/[id]/resources/[resId]` | `PATCH` | leader — approve/reject + إشعار للمرسل |

#### Notifications
| Route | Handler | العمل |
|---|---|---|
| `/api/notifications` | `GET` | آخر 50 إشعار للمستخدم (desc) |
| `/api/notifications` | `POST` | إنشاء (خدمات داخلية) |
| `/api/notifications` | `PATCH` | batch — كل غير المقروء → read:true |
| `/api/notifications/[id]` | `PATCH` | تحقق userId + read:true |

#### Admin
| Route | Handler | العمل |
|---|---|---|
| `/api/admin/users` | `GET` | كل المستخدمين (verifyAdmin) |
| `/api/admin/users` | `POST` | إنشاء طالب يدوياً (verifyAdmin + adminAuth.createUser + setDoc) |
| `/api/admin/users/[uid]` | `PATCH` | تحديث + sync custom claims إن تغيّر role/status |
| `/api/admin/users/[uid]` | `DELETE` | حذف Firestore + Auth (مع تعامل user-not-found) |
| `/api/admin/users/[uid]/approve` | `POST` | `status:active` + `setCustomUserClaims` + `revokeRefreshTokens` |
| `/api/admin/users/[uid]/reject` | `POST` | `status:rejected` |
| `/api/admin/sync-claims` | `POST` | (لمرة واحدة) sync claims للجميع — يتطلب MIGRATION_SECRET |
| `/api/admin/groups/[id]` | `DELETE` | batch atomic: groups + messages + resources + join-requests |

---

## القسم 11 — فهرس سريع للأزرار والدوال

| الزر / الفعل | الملف | الدالة / API | الأثر على Firestore |
|---|---|---|---|
| Sign In | [auth/page.js](app/auth/page.js) | `POST /api/login` + `signInWithEmailAndPassword` | — (قراءة users) |
| Register | [auth/page.js](app/auth/page.js) | `POST /api/register` | إنشاء `users` (status:pending) + Auth + Cloudinary |
| Approve user | [AdminPendingTable.js](components/admin/AdminPendingTable.js) | `POST /api/admin/users/[uid]/approve` | `users.status: active` + custom claims |
| Reject user | [AdminPendingTable.js](components/admin/AdminPendingTable.js) | `POST /api/admin/users/[uid]/reject` | `users.status: rejected` |
| Finish onboarding | [onboarding/page.js](app/onboarding/page.js) | `updateDoc(users/{uid})` | `users.onboarded:true` + بيانات أكاديمية |
| Create group | [groups/create/page.js](app/groups/create/page.js) | `POST /api/groups` | إنشاء `groups` + `users.groups[]` |
| Join (open) | [JoinNodeModal.js](components/explore/JoinNodeModal.js) | `POST /api/groups/[id]/join-requests` | إضافة إلى `groups.members` + memberCount++ |
| Join (protected) | [JoinNodeModal.js](components/explore/JoinNodeModal.js) | `POST /api/groups/[id]/join-requests` | إنشاء `join-requests` (status:pending) |
| Approve join | [OverseerPanel.js](components/chat/OverseerPanel.js) | `PATCH /api/groups/[id]/join-requests/[reqId]` | members++ + إشعار |
| Send message | [MessageInput.js](components/chat/MessageInput.js) | `POST /api/groups/[id]/messages` | إنشاء `messages` + `groups.updatedAt` |
| Upload file | [MessageInput.js](components/chat/MessageInput.js) | `POST /api/upload` → ثم messages | Cloudinary URL في `messages` |
| Approve file | [OverseerPanel.js](components/chat/OverseerPanel.js) / [ModerationPanel.js](components/chat/ModerationPanel.js) | `PATCH /api/groups/[id]/messages/[msgId]` | `messages.moderationStatus:approved` |
| Reject file | [OverseerPanel.js](components/chat/OverseerPanel.js) | `DELETE /api/groups/[id]/messages/[msgId]` | حذف `messages` + Cloudinary + `notifications` |
| Delete message | [MessageList.js](components/chat/MessageList.js) | `DELETE /api/groups/[id]/messages/[msgId]` | حذف `messages` |
| Kick member | [MemberListDrawer.js](components/chat/MemberListDrawer.js) / [GroupMembers.js](components/chat/GroupMembers.js) | `DELETE /api/groups/[id]/members/[uid]` | `members` arrayRemove + memberCount-- |
| Delete group | [ChatHeader.js](components/chat/ChatHeader.js) / [AdminGroupsTable.js](components/admin/AdminGroupsTable.js) | `DELETE /api/groups/[id]` (أو admin) | حذف batch: groups+messages+resources+join-requests |
| Edit group | [GroupSettings.js](components/chat/GroupSettings.js) / [OverseerPanel.js](components/chat/OverseerPanel.js) | `PATCH /api/groups/[id]` | تحديث `groups` |
| Create post | [hub/page.js](app/hub/page.js) | `POST /api/posts` (بعد `/api/upload` إن وُجد ملف) | إنشاء `posts` |
| Like post | [hub/page.js](app/hub/page.js) | `POST /api/posts/[id]/like` | toggle `posts.likes[]` (transaction) |
| Open comments | [hub/page.js](app/hub/page.js) | `GET /api/posts/[id]/comments` | — |
| Reply | [hub/page.js](app/hub/page.js) | `POST /api/posts/[id]/comments` | إنشاء comment + `commentsCount++` (transaction) |
| Edit profile | [profile/page.js](app/profile/page.js) | `PATCH /api/user/profile` | تحديث `users` (الحقول المسموحة فقط) |
| Upload avatar | [profile/page.js](app/profile/page.js) | `POST /api/upload` → `updateDoc(users)` | `users.avatarUrl` |
| Change privacy | [SettingsModals.js](components/SettingsModals.js) | `updateDoc(users/{uid})` | `users.profileVisibility` |
| Reset password | [SettingsModals.js](components/SettingsModals.js) | `sendPasswordResetEmail` | — (Firebase Auth) |
| Mark all read | [NotificationCenter.js](components/NotificationCenter.js) | `PATCH /api/notifications` | batch update `notifications.read:true` |
| Click notification | [NotificationCenter.js](components/NotificationCenter.js) | `PATCH /api/notifications/[id]` + redirect | `notifications.read:true` |
| Log out | [SettingsMenu.js](components/SettingsMenu.js) / [pending/page.js](app/pending/page.js) | `signOut(auth)` + push `/auth` | — |
| Delete group (admin) | [AdminGroupsTable.js](components/admin/AdminGroupsTable.js) | `DELETE /api/admin/groups/[id]` | حذف batch atomic |
| Visit group (admin) | [AdminGroupsTable.js](components/admin/AdminGroupsTable.js) | `router.push("/hub/chat/[id]?from=admin")` | — |
| View ID card | [AdminPendingTable.js](components/admin/AdminPendingTable.js) / [AdminUsersTable.js](components/admin/AdminUsersTable.js) | `setViewID(url)` → IDCardModal | — |

---

**🎓 نهاية الدليل.** للتفاصيل الدقيقة أو السلوك غير الموثق، الرجوع للكود مباشرة وأرقام الأسطر المذكورة في النص. وإذا تغيّر شيء جوهري (هجرة Firestore، تغيير schema)، حدّث هذا الدليل مع نفس التحديث.
