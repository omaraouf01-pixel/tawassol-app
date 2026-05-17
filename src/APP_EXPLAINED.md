# APP_EXPLAINED — تطبيق Tawassol

> ملف الفهرس الرئيسي. يحتوي: نظرة عامة، خريطة الملفات، وخطة تعلّم 4 أيام.
> العمليات التفصيلية في **[APP_FLOWS.md](APP_FLOWS.md)**.
> فهارس الدوال/الأزرار/Firestore في **[APP_INDEX.md](APP_INDEX.md)**.

---

## 1) نظرة عامة

### ما هو Tawassol؟
منصة أكاديمية للطلاب الجامعيين. الطالب يسجّل ببطاقته الجامعية → الأدمن يوافق → يكمل الملف الأكاديمي → ينضم لمجموعات دراسية (Nodes) ويتشارك ويتدارس فيها.

- **المستخدم المستهدف:** طلاب جامعيون + مشرفون أكاديميون.
- **القيمة:** مساحة موثوقة (هوية متحقَّق منها) للنقاش الأكاديمي ومشاركة الموارد بحسب الجامعة/التخصص/المستوى.

### المخطّط المعماري (نصّي)
```
                  ┌─────────────────────────────┐
                  │  Client (Next.js App Router)│
                  │  "use client" pages         │
                  └──────────┬──────────────────┘
                             │
        ┌────────────────────┼─────────────────────────┐
        │                    │                         │
        ▼                    ▼                         ▼
 Firebase Auth        Firestore (real-time)     API Routes
 (signIn,             onSnapshot listeners      app/api/**/route.js
  onIdToken-          مباشرة من الصفحات          (Bearer token →
   Changed)           للـ users/groups/messages   firebase-admin)
        │                    │                         │
        └────────┬───────────┘                         ▼
                 ▼                              Cloudinary (رفع/تحميل)
       lib/useAuth.js                           عبر /api/upload و
       (AuthProvider + توجيه تلقائي)            /api/download
```

### جدول التقنيات

| الطبقة          | التقنية                         | الدور                                                  |
|-----------------|----------------------------------|--------------------------------------------------------|
| Framework       | Next.js 13+ (App Router)         | صفحات + API routes                                     |
| UI              | React 18 + Tailwind CSS          | المكوّنات والتنسيق                                     |
| Animation       | Framer Motion                    | حركات الانتقال (0.25–0.5s)                             |
| Icons           | Lucide React                     | الأيقونات                                              |
| Theme           | next-themes                      | Light/Dark (مفتاح `tawassol-theme`)                    |
| Auth            | Firebase Authentication          | تسجيل دخول إيميل/كلمة سر + JWT                         |
| DB              | Cloud Firestore                  | تخزين البيانات + بثّ حيّ عبر `onSnapshot`              |
| Server SDK      | firebase-admin                   | في API routes فقط (`lib/firebaseAdmin.js`)             |
| Files           | Cloudinary                       | صور + PDF (resourceType تلقائي)                        |
| State           | React Context + hooks            | بدلاً من Redux                                         |

### قواعد ذهبية (من `CLAUDE.md`)
1. لا تستورد من `lib/i18n/` (محذوف).
2. لا تعدّل `firestore.rules` (غير موجود في الـ repo).
3. لا تكسر فحص الصلاحيات في الدردشة (`member|leader|admin`).
4. استخدم `useAuth()` بدلاً من Firebase Auth مباشرة.
5. ألوان النظام: `cream`, `ink`, `accent` (#7c83f2), `sand`.

---

## 2) خريطة الملفات

### `app/` — الصفحات
| المسار                          | النوع | الغرض                              | يعتمد على                          | يستخدمها                |
|---------------------------------|-------|------------------------------------|------------------------------------|-------------------------|
| `app/layout.js`                 | Layout| تغليف Root بـ ThemeProvider + AuthProvider | `ThemeProvider`, `AuthProvider`    | كل الصفحات              |
| `app/page.js`                   | Page  | Landing + توجيه تلقائي حسب الحالة  | `useAuth`                          | المستخدم غير المسجَّل    |
| `app/auth/page.js`              | Page  | تسجيل دخول/إنشاء حساب              | `/api/login`, `/api/register`, `mapAuthError` | الزوّار          |
| `app/pending/page.js`           | Page  | شاشة انتظار موافقة الأدمن          | `onSnapshot(users/uid)`            | حالة `pending`          |
| `app/onboarding/page.js`        | Page  | 3 خطوات لإكمال الملف الأكاديمي     | `academicData`, `/api/upload`      | `active` + غير onboarded |
| `app/hub/page.js`               | Page  | Feed (Scholar Hub) + إنشاء منشورات | `posts` collection, `/api/posts/*` | المستخدم النشط          |
| `app/explore/page.js`           | Page  | استكشاف وفلترة المجموعات           | `useAllGroups`, `relevance`        | المستخدم النشط          |
| `app/hub/chat/[id]/page.js`     | Page  | دردشة المجموعة (real-time)         | `useChat`, `ChatHeader`, `MessageList`, `MessageInput` | عضو/قائد/أدمن |
| `app/profile/page.js`           | Page  | عرض/تعديل الملف الشخصي             | `/api/user/profile`, `/api/upload` | المستخدم نفسه           |
| `app/admin/page.js`             | Page  | لوحة الأدمن (3 تبويبات)            | `Admin*Table`, `/api/admin/users/*`| `role=admin`            |
| `app/groups/create/page.js`     | Page  | نموذج إنشاء مجموعة                 | `/api/groups`, `academicData`      | أي مستخدم نشط           |

### `app/api/` — Endpoints
| المسار                                                | الطريقة | Auth      | الغرض                              |
|-------------------------------------------------------|---------|-----------|------------------------------------|
| `app/api/login/route.js`                              | POST    | عام       | بحث user عبر matricule/email       |
| `app/api/register/route.js`                           | POST    | عام       | تسجيل + رفع بطاقة + إنشاء user doc |
| `app/api/upload/route.js`                             | POST    | عام       | رفع ملف لـ Cloudinary              |
| `app/api/download/route.js`                           | GET     | عام       | Proxy Cloudinary مع Content-Disposition |
| `app/api/user/profile/route.js`                       | GET/PATCH | withAuth| قراءة/تعديل الملف الشخصي          |
| `app/api/user/setup/route.js`                         | POST    | withAuth  | إعداد user doc بعد التسجيل         |
| `app/api/user/pending-requests/route.js`              | GET     | withAuth  | قائمة طلبات الانضمام المعلَّقة      |
| `app/api/admin/users/route.js`                        | GET     | withAdmin | كل المستخدمين                       |
| `app/api/admin/users/[uid]/approve/route.js`          | POST    | withAdmin | تفعيل + customClaims               |
| `app/api/admin/users/[uid]/reject/route.js`           | POST    | withAdmin | رفض                                |
| `app/api/admin/users/[uid]/route.js`                  | GET/PATCH/DELETE | withAdmin | إدارة مستخدم          |
| `app/api/admin/sync-claims/route.js`                  | POST    | withAdmin | مزامنة custom claims               |
| `app/api/admin/groups/[id]/route.js`                  | DELETE  | withAdmin | حذف مجموعة                         |
| `app/api/groups/route.js`                             | GET/POST| withAuth (POST) | قائمة/إنشاء مجموعات          |
| `app/api/groups/[id]/route.js`                        | GET/PATCH/DELETE | mixed | تفاصيل/تعديل/حذف           |
| `app/api/groups/[id]/members/[uid]/route.js`          | DELETE  | leader    | إخراج عضو                          |
| `app/api/groups/[id]/messages/route.js`               | GET/POST| withAuth  | جلب/إرسال رسائل                    |
| `app/api/groups/[id]/messages/[msgId]/route.js`       | PATCH/DELETE | mod  | اعتماد/رفض/حذف رسالة               |
| `app/api/groups/[id]/resources/route.js`              | GET/POST| member    | ملفات المجموعة                     |
| `app/api/groups/[id]/resources/[resId]/route.js`      | DELETE  | leader    | حذف مورد                           |
| `app/api/groups/[id]/join-requests/route.js`          | GET/POST| mixed     | طلبات الانضمام                     |
| `app/api/groups/[id]/join-requests/[reqId]/route.js`  | PATCH   | leader    | قبول/رفض طلب                       |
| `app/api/posts/route.js`                              | GET/POST| withAuth (POST) | Feed posts                   |
| `app/api/posts/[id]/route.js`                         | DELETE  | author    | حذف منشور                          |
| `app/api/posts/[id]/like/route.js`                    | POST    | withAuth  | toggle like                        |
| `app/api/posts/[id]/comments/route.js`                | GET/POST| withAuth  | تعليقات                            |
| `app/api/notifications/route.js`                      | GET/POST| withAuth  | الإشعارات                           |
| `app/api/notifications/[id]/route.js`                 | PATCH   | withAuth  | تحديد كمقروء                       |

### `lib/` — منطق مشترك
| المسار                       | النوع   | الغرض                                       |
|------------------------------|---------|---------------------------------------------|
| `lib/firebase.js`            | Init    | Client Firebase (app/auth/firestore/storage)|
| `lib/firebaseAdmin.js`       | Init    | Admin SDK + helpers (snapToObj, listSnap)   |
| `lib/firestore.js`           | Barrel  | Re-export server-only للـ admin             |
| `lib/useAuth.js`             | Hook    | AuthContext + توجيه تلقائي                  |
| `lib/authErrors.js`          | Helper  | `mapAuthError(err)` → رسائل عربية           |
| `lib/apiClient.js`           | Helper  | `api(path, opts)` + Bearer + retry 401/403  |
| `lib/useApi.js`              | Hook    | wrapper لـ `api()` مع mountedRef            |
| `lib/useChat.js`             | Hook    | محرّك الدردشة (optimistic + moderation)     |
| `lib/useMessages.js`         | Hook    | مستمع رسائل بسيط ⚠️ (يبدو غير مستخدم)        |
| `lib/useMyGroups.js`         | Hook    | مجموعات المستخدم (real-time)                |
| `lib/useAllGroups.js`        | Hook    | كل المجموعات العامة (Explore)              |
| `lib/useJoinRequests.js`     | Hook    | طلبات الانضمام (للقائد)                     |
| `lib/useFileUpload.js`       | Hook    | رفع ملف لـ Cloudinary + إرسال               |
| `lib/withAuth.js`            | Helper  | wrappers لـ API: `withAuth/withAdmin/withPublic` |
| `lib/verifyAdmin.js`         | Helper  | تحقق JWT + customClaims + Firestore fallback|
| `lib/collections.js`         | Helper  | server-only: `*Col()` + `build*Doc()`       |
| `lib/collectionNames.js`     | Const   | `COL.USERS`, `COL.GROUPS`, ... ثوابت        |
| `lib/fileLinks.js`           | Helper  | `buildViewUrl/buildDownloadUrl` (Cloudinary proxy) |
| `lib/relevance.js`           | Pure    | خوارزمية اقتراح المجموعات                   |
| `lib/academicData.js`        | Const   | UNIVERSITIES/MAJORS/LEVELS                  |
| `lib/notify.js`              | Client  | إنشاء إشعار عبر API                         |
| `lib/serverNotify.js`        | Server  | `notifyMany` + `extractMentionedUids`       |

### `components/` — المكوّنات
| المسار                                  | الغرض                                                 |
|-----------------------------------------|-------------------------------------------------------|
| `components/Sidebar.js`                 | الشريط الجانبي (Hub/Explore/Profile/مجموعاتي)         |
| `components/SettingsMenu.js`            | قائمة الإعدادات                                       |
| `components/SettingsModals.js`          | نوافذ الإعدادات                                       |
| `components/NotificationCenter.js`      | مركز الإشعارات real-time                              |
| `components/NotificationsBell.js`       | أيقونة الجرس + عدّاد                                  |
| `components/DiscoveryGrid.js`           | شبكة مجموعات (Explore)                                |
| `components/MessageAttachment.js`       | عرض مرفق رسالة                                        |
| `components/LinkField.js`               | حقل رابط اجتماعي مع أيقونة                            |
| `components/TsswalLogo.js`              | شعار SVG متحرّك                                       |
| `components/ThemeProvider.js`           | غلاف next-themes                                      |
| `components/admin/IDCardModal.js`       | نافذة عرض بطاقة الطالب                                |
| `components/admin/AdminPendingTable.js` | جدول طلبات الموافقة                                   |
| `components/admin/AdminUsersTable.js`   | جدول المستخدمين النشطين                               |
| `components/admin/AdminGroupsTable.js`  | جدول المجموعات                                        |
| `components/chat/ChatHeader.js`         | رأس الدردشة (اسم/أعضاء/إعدادات)                       |
| `components/chat/MessageList.js`        | قائمة الرسائل (تجميع + reply)                         |
| `components/chat/MessageInput.js`       | حقل الإرسال + رفع ملف                                 |
| `components/chat/ActiveNodesSidebar.js` | قائمة مجموعاتي على اليسار                             |
| `components/chat/ResourcesSidebar.js`   | قائمة موارد المجموعة على اليمين                       |
| `components/chat/ModerationPanel.js`    | لوحة اعتماد الملفات (قائد)                            |
| `components/chat/OverseerPanel.js`      | لوحة الإشراف الموحّدة                                 |
| `components/chat/GroupSettings.js`      | إعدادات المجموعة (تعديل/حذف)                          |
| `components/chat/GroupMembers.js`       | عرض الأعضاء                                           |
| `components/chat/MemberListDrawer.js`   | درج جانبي للأعضاء                                     |
| `components/explore/JoinNodeModal.js`   | نافذة طلب الانضمام                                    |
| `components/explore/NodeShelf.js`       | رف أفقي لبطاقات المجموعات                             |

### ملاحظات على تناقضات مكتشفة
- `lib/useMessages.js` موجود لكن الصفحة تستخدم `lib/useChat.js`. **مرشّح للحذف.**
- `lib/firebase.js` يصدّر `storage` (Firebase Storage) لكنه غير مستعمل — Cloudinary هو الأساس.
- `buildMessageDoc` يستقبل `authorName` بينما `useChat` يمرّر `senderName` و API الرسائل يضيف `userName` — **تباين في تسمية الحقول**.
- `lib/i18n/config.js` لا يزال موجوداً رغم أن `CLAUDE.md` يقول "محذوف بالكامل" — تحقّق إذا كان أي ملف يستورد منه.
- منطق ضبط `customClaims` مكرَّر في `verifyAdmin.js` (auto-sync) و `approve/route.js` — احتمال تعارض.

---

## 7) خطة التعلّم في 4 أيام

> الهدف: في نهاية اليوم الرابع، تستطيع تتبّع أي زر إلى Firestore وتنفيذ تعديل صغير بثقة.

### اليوم 1 — الأساسات والـ Auth (≈ 6 ساعات)

| الساعة | المهمة                                                                                       |
|--------|----------------------------------------------------------------------------------------------|
| 1      | اقرأ `CLAUDE.md` + `PROJECT_MAP.md` + هذا الملف. شغّل المشروع (`npm run dev`).               |
| 2      | افتح `lib/firebase.js`، `lib/firebaseAdmin.js`، `lib/collectionNames.js`. افهم الفصل client/server. |
| 3      | اقرأ `lib/useAuth.js` كاملاً — افهم منطق `routeUser()` (السطور 98–130).                       |
| 4      | اقرأ `lib/apiClient.js` + `lib/withAuth.js` — افهم كيف تتدفق الـ Bearer token من Client → API. |
| 5      | اقرأ `lib/authErrors.js` + جرّب صفحة `/auth` بإيميل خاطئ.                                    |
| 6      | تتبّع: سجِّل دخول مستخدم وهمي → راقب الـ Network → تأكّد من توجيهك إلى `/pending` أو `/hub`. |

**الملفات المقروءة:** كل `lib/` تقريباً + `app/auth/page.js` + `app/pending/page.js`.

**أسئلة نهاية اليوم:**
- كيف ينتقل user من `pending` إلى `/hub`؟ ما الذي يقرّر التوجيه ولماذا؟
- لماذا نحتاج `withAuth` في API routes رغم وجود JWT؟
- ما الفرق بين `firestore` (client) و `db` (admin)؟

**تمرين:** غيّر رسالة خطأ في `mapAuthError` ولاحظ ظهورها في صفحة `/auth`.

---

### اليوم 2 — Admin + Onboarding (≈ 6 ساعات)

| الساعة | المهمة                                                                                       |
|--------|----------------------------------------------------------------------------------------------|
| 1      | اقرأ `app/admin/page.js` كاملاً. لاحظ الثلاث `onSnapshot` (السطور 50–58).                    |
| 2      | اقرأ `components/admin/AdminPendingTable.js` + `IDCardModal.js`. تتبّع زر "Approve".         |
| 3      | اقرأ `app/api/admin/users/[uid]/approve/route.js` + `lib/verifyAdmin.js`.                    |
| 4      | اقرأ `app/onboarding/page.js`. ركّز على `finalizingRef` (السطر 81) — لماذا موجود؟           |
| 5      | اقرأ `app/api/user/profile/route.js` + `app/api/upload/route.js`.                            |
| 6      | اقرأ `app/api/user/pending-requests/route.js` (في الملفات المعدَّلة `M`).                    |

**الملفات المقروءة:** كل `app/api/admin/*`, `app/api/user/*`, `components/admin/*`, `app/onboarding/*`.

**أسئلة نهاية اليوم:**
- ماذا يحدث بالضبط عند ضغط "Approve"؟ (4 خطوات على الأقل)
- لماذا نضع `customClaims` بدلاً من الاكتفاء بحقل `role` في Firestore؟
- ما الـ race condition الذي يحلّه `finalizingRef`؟ ماذا يحدث لو أزلتَه؟

**تمرين:** أضف حقل "ملاحظات الأدمن" لكل مستخدم في `AdminPendingTable.js` (إظهار فقط، لا حفظ).

---

### اليوم 3 — Hub + Explore + Chat (≈ 7 ساعات)

| الساعة | المهمة                                                                                       |
|--------|----------------------------------------------------------------------------------------------|
| 1      | اقرأ `app/hub/page.js` — افهم flow إنشاء post + like + comment.                              |
| 2      | اقرأ `app/api/posts/route.js` + `[id]/like` + `[id]/comments`.                               |
| 3      | اقرأ `app/explore/page.js` + `lib/useAllGroups.js` + `lib/relevance.js`.                     |
| 4      | اقرأ `components/explore/JoinNodeModal.js` + `NodeShelf.js` + `DiscoveryGrid.js`.            |
| 5      | اقرأ `app/hub/chat/[id]/page.js` — افهم فحص الصلاحيات (السطور 49–64).                       |
| 6      | اقرأ `lib/useChat.js` كاملاً — أهم ملف في المشروع. ركّز على 3 الـ `onSnapshot`.              |
| 7      | اقرأ `components/chat/MessageInput.js` + `MessageList.js`. تتبّع إرسال رسالة كاملة.          |

**أسئلة نهاية اليوم:**
- ما هي 3 الـ `onSnapshot` في `useChat`؟ وما الذي يستمع له كلٌّ منها؟
- لماذا نحتاج `optimistic` و `sentKeys` في `useChat`؟
- متى تكون رسالة بحالة `pending` (moderation)؟ من يعتمدها؟
- ما الفرق بين `members` و `membersList` في وثيقة `group`؟

**تمرين:** عند الإرسال، اطبع `console.log` في `useChat.sendMessage` يوضح ما إذا كانت الرسالة ستذهب `pending` أم لا.

---

### اليوم 4 — Moderation + Upload + تعديل عملي (≈ 6 ساعات)

| الساعة | المهمة                                                                                       |
|--------|----------------------------------------------------------------------------------------------|
| 1      | اقرأ `components/chat/ModerationPanel.js` + `OverseerPanel.js`.                              |
| 2      | اقرأ `app/api/groups/[id]/messages/[msgId]/route.js` (اعتماد/رفض).                          |
| 3      | اقرأ `components/chat/GroupSettings.js` + `GroupMembers.js` + `MemberListDrawer.js`.        |
| 4      | اقرأ `lib/useFileUpload.js` + `lib/fileLinks.js` + `app/api/download/route.js`.             |
| 5      | اقرأ `components/Sidebar.js` + `SettingsMenu.js` + `NotificationCenter.js`.                  |
| 6      | **تمرين تطبيقي:** نفّذ تعديلاً صغيراً (مثلاً: غيّر عدد آخر رسائل تُحمَّل في الدردشة، أو أضف عدّاد للمجموعات في الشريط الجانبي). commit بعد كل خطوة. |

**أسئلة نهاية اليوم:**
- لماذا نحتاج `/api/download` بدلاً من رابط Cloudinary المباشر؟
- كيف تُستخرج الـ @mentions وأين تذهب الإشعارات؟
- ما الذي يحدث عند حذف مجموعة (`DELETE /api/groups/[id]`)؟ كم وثيقة تُحذف؟

**تمرين ختامي:** اختر زراً أو ميزة لم تلمسها بعد، تتبّعها من النقرة حتى Firestore، واكتب 5 أسطر تشرحها.

---

## روابط سريعة

- **العمليات الـ 15 بالتفصيل:** [APP_FLOWS.md](APP_FLOWS.md)
- **فهرس الدوال:** [APP_INDEX.md#فهرس-الدوال](APP_INDEX.md)
- **فهرس الأزرار:** [APP_INDEX.md#فهرس-الأزرار-ui-actions](APP_INDEX.md)
- **مخطّط Firestore:** [APP_INDEX.md#firestore-المخطّط](APP_INDEX.md)
