# LEARN_APP_FLOWS — تدفق البيانات والعمليات

> لكل عملية: من أين تبدأ، تسلسل الدوال، Firestore المتأثر، حالات الفشل.

---

## 1) التسجيل (Sign Up)

**نقطة البداية:** زر "Register" في [app/auth/page.js:405](app/auth/page.js:405).

| المرحلة | المسؤول | المرجع |
|---|---|---|
| المستخدم يملأ matricule/email/password/fullName ويرفق بطاقة | `handleAuth` | [app/auth/page.js:305](app/auth/page.js:305) |
| إرسال FormData إلى `/api/register` | `fetch` | [app/auth/page.js:322](app/auth/page.js:322) |
| السيرفر يتحقق من التفرّد (matricule + email) | `usersRef.where(...).get()` | [app/api/register/route.js:66](app/api/register/route.js:66) |
| رفع البطاقة لـ Cloudinary | `cloudinary.uploader.upload_stream` | [app/api/register/route.js:82](app/api/register/route.js:82) |
| إنشاء Firebase Auth user | `adminAuth.createUser` | [app/api/register/route.js:92](app/api/register/route.js:92) |
| إنشاء مستند users بـ `status:"pending"` | `usersRef.doc(uid).set(...)` | [app/api/register/route.js:103](app/api/register/route.js:103) |
| العميل يستدعي `signInWithEmailAndPassword` | Firebase Auth | [app/auth/page.js:330](app/auth/page.js:330) |
| `useAuth` يلتقط onIdTokenChanged → يقرأ status="pending" → يوجّه إلى `/pending` | `useAuth.useEffect[1]` + `[3]` | [lib/useAuth.js:115](lib/useAuth.js:115) |

**Firestore:** `users/{uid}` يُكتب.
**حالات الفشل:** matricule مكرر (409)، email مكرر (409)، حجم بطاقة > 10MB (413). عند فشل خلق Firestore بعد Auth → **rollback يحذف Auth user** ([app/api/register/route.js:136](app/api/register/route.js:136)).

---

## 2) تسجيل الدخول

**نقطة البداية:** زر "Sign In" — `handleAuth` في وضع `login`.

| المرحلة | المرجع |
|---|---|
| إرسال matricule إلى `/api/login` | [app/auth/page.js:332](app/auth/page.js:332) |
| السيرفر يبحث بـ Admin SDK (لتجاوز قواعد Firestore لأن المستخدم لم يدخل بعد) | [app/api/login/route.js:27](app/api/login/route.js:27) |
| يعيد `user.email` | [app/api/login/route.js:50](app/api/login/route.js:50) |
| العميل يستدعي `signInWithEmailAndPassword(email, password)` | [app/auth/page.js:341](app/auth/page.js:341) |
| في حال خطأ Firebase → `mapAuthError(err)` يحوّل للرسالة | [lib/authErrors.js:3](lib/authErrors.js:3) |
| `useAuth` يقرأ userData ويوجّه حسب status/role | [lib/useAuth.js:97-130](lib/useAuth.js:97) |

**لماذا البحث بالـ matricule على السيرفر؟** لأن الطالب لا يحفظ بريده عادةً — يحفظ رقمه الجامعي. والعميل لا يستطيع الاستعلام عن users قبل تسجيل الدخول (القواعد ترفض).

---

## 3) `pending → approved → onboarding → active`

| الحالة | الصفحة | السلوك |
|---|---|---|
| `status:"pending"` | `/pending` | شاشة انتظار + زر Logout. [app/pending/page.js](app/pending/page.js) |
| **أدمن يضغط Approve** | `/admin` | `handleApprove` → `POST /api/admin/users/[uid]/approve` ([app/admin/page.js:68](app/admin/page.js:68)) |
| السيرفر يحدّث `status:"active"` + Custom Claims + `revokeRefreshTokens` | [app/api/admin/users/[uid]/approve/route.js:28](app/api/admin/users/[uid]/approve/route.js:28) |
| `useAuth` يلتقط التغيير عبر `onSnapshot` → يُجبر `getIdToken(true)` | [lib/useAuth.js:79](lib/useAuth.js:79) |
| status="active" && !onboarded → `router.replace("/onboarding")` | [lib/useAuth.js:122](lib/useAuth.js:122) |
| المستخدم يكمل 3 خطوات في onboarding | [app/onboarding/page.js](app/onboarding/page.js) |
| عند Finish: `updateDoc(users/{uid}, { onboarded:true, status:"active", university, major, level, bio, avatarUrl })` | [app/onboarding/page.js:155](app/onboarding/page.js:155) |
| `finalizingRef.current = true` يمنع التوجيه التلقائي حتى تظهر شاشة "Welcome" | [app/onboarding/page.js:129](app/onboarding/page.js:129) |
| المستخدم يضغط "The Hub" → `window.location.replace("/hub")` | [app/onboarding/page.js:313](app/onboarding/page.js:313) |

**⚠️ مهم:** لا تزل `finalizingRef`. وإلا `useAuth` سيرى `status:"active" && onboarded:true` ويوجّه فوراً قبل عرض شاشة النجاح ([CLAUDE.md](CLAUDE.md) — المخاطر).

---

## 4) التوجيه التلقائي (`useAuth`)

ثلاث `useEffect` متعاقبة في [lib/useAuth.js](lib/useAuth.js):

1. **`onIdTokenChanged`** (السطر 21): يضبط `user` و`userData`. لو لا يوجد مستخدم → توجيه لـ `/auth` (إلا في `/` أو `/auth`).
2. **`onSnapshot(users/{uid})`** (السطر 70): يكتشف تغيّر status → يُجبر تحديث Token → يُحدّث `userData`.
3. **منطق التوجيه** (السطر 98):
   - `onboarding` → `/onboarding`
   - `pending` (وليس في `/pending` أو `/onboarding`) → `/pending`
   - `active && !onboarded` → `/onboarding`
   - `active && onboarded && (path ∈ [/auth, /pending])` → `/hub`

---

## 5) إنشاء عقدة (Node)

**نقطة البداية:** [app/groups/create/page.js](app/groups/create/page.js) (الصفحة فيها form).
- يضغط Create → `POST /api/groups` مع `{ name, subject, description, rules, tags, questions, maxMembers, accessType }`.
- السيرفر [app/api/groups/route.js:64](app/api/groups/route.js:64): `withAuth` يتحقق من Token → `groupsCol().add(buildGroupDoc(...))` → يضيف `groupId` إلى `users/{uid}.groups`.

**Firestore:** `groups/{id}` + تحديث `users/{uid}.groups`.

---

## 6) الانضمام لعقدة

**نقطة البداية:** زر "Join" في [components/explore/JoinNodeModal.js](components/explore/JoinNodeModal.js).

نوعان حسب `accessType`:

### `accessType: "open"`
`POST /api/groups/[id]/join-requests` → السيرفر يكتشف `open` → يضيف المستخدم مباشرة عبر `arrayUnion` ([app/api/groups/[id]/join-requests/route.js:32](app/api/groups/[id]/join-requests/route.js:32)).

### `accessType: "protected"`
السيرفر يبني `join-requests/{id}` بـ `status:"pending"` ([app/api/groups/[id]/join-requests/route.js:62](app/api/groups/[id]/join-requests/route.js:62)).
قائد العقدة يرى الطلب في `OverseerPanel` (عبر `useChat.joinRequests` listener — [lib/useChat.js:115](lib/useChat.js:115)) → يقبل/يرفض → السيرفر يحدّث `group.members` و`join-request.status`.

---

## 7) إرسال رسالة في الدردشة (`onSnapshot`)

**نقطة البداية:** [components/chat/MessageInput.js](components/chat/MessageInput.js) → `sendMessage` من `useChat`.

| المرحلة | المرجع |
|---|---|
| المستخدم يكتب نصاً (ربما يرفق ملفاً عبر `/api/upload`) | MessageInput |
| **Optimistic UI:** الرسالة تُضاف فوراً لـ state محلي قبل تأكيد السيرفر | [lib/useChat.js:191](lib/useChat.js:191) |
| `addDoc(messages, { groupId, uid, content, fileUrl, moderationStatus, createdAt: serverTimestamp() })` | [lib/useChat.js:194](lib/useChat.js:194) |
| `moderationStatus` = `pending` إذا فيه ملف والمستخدم ليس Leader/Admin | [lib/useChat.js:171](lib/useChat.js:171) |
| `onSnapshot` للـ messages في العقدة يستقبل الرسالة الحقيقية | [lib/useChat.js:74](lib/useChat.js:74) |
| المُطابقة تزيل النسخة المؤقتة | [lib/useChat.js:87](lib/useChat.js:87) |
| الفلتر يخفي الملفات pending عن غير القادة في العقد المحمية | [lib/useChat.js:228](lib/useChat.js:228) |

**فشل:** الرسالة المؤقتة تُعلَّم `_failed:true` ([lib/useChat.js:210](lib/useChat.js:210)).

---

## 8) إضافة/إزالة عضو (Admin)

`DELETE /api/groups/[id]/members/[uid]` ([app/api/groups/[id]/members/[uid]/route.js](app/api/groups/[id]/members/[uid]/route.js)). يستخدم `withAuth` للتحقق من أن الفاعل هو Leader أو Admin، ثم `arrayRemove` على `members` و`membersList`.

---

## 9) لوحة الأدمن (قبول / رفض)

ملف الصفحة: [app/admin/page.js](app/admin/page.js).
- `onSnapshot` على `users` و`groups` مع `orderBy("createdAt", "desc")`.
- Approve: `POST /api/admin/users/[uid]/approve` ← مفصّل في القسم 3.
- Reject: `POST /api/admin/users/[uid]/reject` — يحدّث status إلى rejected (لم نفحص الملف لكن نمطه نفس approve).
- إدارة العقد: `AdminGroupsTable` يعرض كل العقد للأدمن (يستطيع حذف/تعطيل عبر `/api/admin/groups/[id]`).

---

## 10) رفع ملف عبر `/api/upload`

[app/api/upload/route.js:11](app/api/upload/route.js:11):
1. يستلم `FormData` بحقل `file` (+`folder` اختياري).
2. يحوّل لـ Buffer.
3. يحدد `resource_type`: `image` للصور، `raw` للباقي (لتفادي قيود Cloudinary على PDF).
4. `cloudinary.uploader.upload_stream` ← يعيد `secure_url`.

**ملاحظة أمنية:** هذا الـ endpoint **بدون `withAuth`** — أي زائر يستطيع الرفع. (راجع المخاطر في [CLAUDE.md](CLAUDE.md)).

---

## 11) الإشعارات

عند إشارة `@user` في رسالة → السيرفر [app/api/groups/[id]/messages/route.js:119](app/api/groups/[id]/messages/route.js:119) يستخرج الـ uids عبر `extractMentionedUids` ثم يستدعي `notifyMany(...)` من [lib/serverNotify.js](lib/serverNotify.js) الذي يكتب في `notifications`.

العميل يقرأها لحظياً عبر [components/NotificationCenter.js](components/NotificationCenter.js) ← `onSnapshot(notifications WHERE userId == uid)`.

---

## 12) المشرفون (Moderation / Overseer)

`OverseerPanel` ([components/chat/OverseerPanel.js](components/chat/OverseerPanel.js)) يظهر فقط لـ Leader/Admin. يعرض:
- `joinRequests` (طلبات انضمام pending).
- `pendingFiles` (ملفات بـ `moderationStatus:"pending"`).

عند الموافقة على ملف → `PATCH /api/groups/[id]/messages/[msgId]` يضع `moderationStatus:"approved"` فيصير ظاهراً للجميع.

---

## 13) الموارد (Resources)

`POST /api/groups/[id]/resources` يبني `resources/{id}` بـ `status:"pending"`. المشرف يوافق عبر `PATCH /api/groups/[id]/resources/[resId]`. `ResourcesSidebar` يعرضها لحظياً.

---

## 14) تسجيل الخروج

في أي صفحة فيها زر Logout (مثلاً [app/admin/page.js:96](app/admin/page.js:96), [app/pending/page.js:37](app/pending/page.js:37)):
```js
await signOut(auth);
router.replace("/auth");
```
`useAuth` يلتقط `onIdTokenChanged(null)` ويُصفّر state.
