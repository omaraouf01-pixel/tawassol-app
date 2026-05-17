# LEARN_APP_PLAN — خطة تعلّم 4 أيام

> 4 أيام × (صباح: اقرأ + افهم) × (مساء: نفّذ تمارين). الهدف: في اليوم الرابع تشرح 3 عمليات بصوت عالٍ دون فتح الكود.

---

## يوم 1 — المصادقة والأساسيات

### 🌅 صباحاً (قراءة + فهم)
1. [LEARN_APP.md](LEARN_APP.md) — نظرة عامة + الأدوات.
2. [LEARN_APP_CONCEPTS.md](LEARN_APP_CONCEPTS.md) — App Router, hooks, Bearer Tokens.
3. اقرأ بهذا الترتيب وحاول أن تتنبأ بدور كل ملف **قبل** فتحه:
   - [lib/firebase.js](lib/firebase.js) — تهيئة Firebase العميل (singleton).
   - [lib/firebaseAdmin.js](lib/firebaseAdmin.js) — تهيئة Admin SDK (server-only).
   - [lib/collectionNames.js](lib/collectionNames.js) — `COL` ثوابت أسماء.
   - [lib/useAuth.js](lib/useAuth.js) — الـ Context الذي يدير الجلسة + التوجيه.
   - [lib/authErrors.js](lib/authErrors.js) — `mapAuthError`.
   - [lib/apiClient.js](lib/apiClient.js) — `api()` مع Bearer + timeout.
   - [app/layout.js](app/layout.js) — كيف يُلفّ التطبيق بـ AuthProvider.
   - [app/auth/page.js](app/auth/page.js) — صفحة الدخول/التسجيل.
   - [app/pending/page.js](app/pending/page.js) — انتظار الموافقة.
   - [app/api/register/route.js](app/api/register/route.js) و [app/api/login/route.js](app/api/login/route.js).
   - [app/api/user/pending-requests/route.js](app/api/user/pending-requests/route.js).

### 🌙 مساءً (تمرين)
**ارسم بيدك** (ورقة + قلم) المخطط الكامل لتدفق التسجيل من ضغط "Register" حتى وصول المستخدم إلى `/pending`. اذكر كل دالة وملف. ثم قارن بـ [LEARN_APP_FLOWS.md §1](LEARN_APP_FLOWS.md).

**اختبار صغير:**
- لماذا `/api/login` يستخدم Admin SDK وليس العميل يستعلم مباشرة؟
- ماذا يفعل `getIdToken(true)` ولماذا يُستدعى بعد تغيّر status؟
- في `useAuth`، لماذا ثلاث `useEffect` بدل واحد؟

---

## يوم 2 — Hub والاستكشاف

### 🌅 صباحاً
- [app/hub/page.js](app/hub/page.js) — الموجز + نشر منشور + التعليقات.
- [components/Sidebar.js](components/Sidebar.js) — التنقل الجانبي + قائمة عقدي.
- [components/DiscoveryGrid.js](components/DiscoveryGrid.js) — شبكة اكتشاف.
- [app/explore/page.js](app/explore/page.js) — استكشاف كل العقد.
- [components/explore/NodeShelf.js](components/explore/NodeShelf.js) و [components/explore/JoinNodeModal.js](components/explore/JoinNodeModal.js).
- [app/api/groups/route.js](app/api/groups/route.js) — GET (mine/all) + POST.
- [app/api/groups/[id]/join-requests/route.js](app/api/groups/[id]/join-requests/route.js) — open vs protected.
- [app/api/posts/route.js](app/api/posts/route.js) + [app/api/posts/[id]/like/route.js](app/api/posts/[id]/like/route.js).

### 🌙 مساءً
**تتبّع زر "Join" حتى Firestore:**
1. أين الزر؟ ما الدالة المرتبطة؟
2. ما الـ endpoint؟ ما parameters؟
3. كيف يتغير `groups/{id}.members`؟
4. كيف تكتشف الواجهة التغيير؟ (أين `onSnapshot` على `groups`?)

اكتب الجواب على شكل سلسلة مراحل قبل النظر في [LEARN_APP_FLOWS.md §6](LEARN_APP_FLOWS.md).

**تمرين كسر:** في DevTools افتح Network وارفض الـ POST يدوياً (right-click → Block) ثم انضم. ماذا يحدث للواجهة؟

---

## يوم 3 — الدردشة

### 🌅 صباحاً
- [app/hub/chat/[id]/page.js](app/hub/chat/[id]/page.js) — صفحة العقدة.
- [lib/useChat.js](lib/useChat.js) — محرك المزامنة + Optimistic UI.
- [components/chat/ChatHeader.js](components/chat/ChatHeader.js).
- [components/chat/MessageList.js](components/chat/MessageList.js).
- [components/chat/MessageInput.js](components/chat/MessageInput.js).
- [components/chat/ActiveNodesSidebar.js](components/chat/ActiveNodesSidebar.js).
- [components/chat/ResourcesSidebar.js](components/chat/ResourcesSidebar.js).
- [components/chat/OverseerPanel.js](components/chat/OverseerPanel.js) و [components/chat/ModerationPanel.js](components/chat/ModerationPanel.js).
- [components/chat/GroupMembers.js](components/chat/GroupMembers.js) و [components/chat/GroupSettings.js](components/chat/GroupSettings.js).
- [app/api/groups/[id]/messages/route.js](app/api/groups/[id]/messages/route.js) — GET + POST + moderation logic.

### 🌙 مساءً
**تتبّع رسالة من الكتابة حتى الظهور لكل الأعضاء:**
- ما تتابع state؟ (`optimistic` → `serverMessages` → `messages` المدمجة).
- متى تظهر بأيقونة "pending"؟
- ماذا لو رفعت ملفاً وأنت ليس Leader؟ كيف يصير `moderationStatus:"pending"`؟ من يراه قبل الموافقة؟

**تمارين كسر:**
1. غيّر اللون الذي يحدد رسائل القائد في `MessageList`. أعد التشغيل.
2. أضف زراً مؤقتاً في `OverseerPanel` يطبع `joinRequests` في console.
3. **ماذا يحدث لو حذفت `return () => unsub()` من useEffect في useChat؟** افتح Tab الدردشة، انتقل لتاب آخر وارجع 10 مرات، راقب الذاكرة.

---

## يوم 4 — الأدمن وAPI ومراجعة

### 🌅 صباحاً
- [app/admin/page.js](app/admin/page.js) — لوحة الأدمن.
- [components/admin/AdminPendingTable.js](components/admin/AdminPendingTable.js).
- [components/admin/AdminUsersTable.js](components/admin/AdminUsersTable.js).
- [components/admin/AdminGroupsTable.js](components/admin/AdminGroupsTable.js).
- [components/admin/IDCardModal.js](components/admin/IDCardModal.js).
- [app/api/admin/users/[uid]/approve/route.js](app/api/admin/users/[uid]/approve/route.js) و [app/api/admin/users/[uid]/reject/route.js](app/api/admin/users/[uid]/reject/route.js).
- [app/api/admin/users/route.js](app/api/admin/users/route.js).
- [app/api/admin/sync-claims/route.js](app/api/admin/sync-claims/route.js).
- [lib/withAuth.js](lib/withAuth.js) — كيف يحمي `withAuth` و`withAdmin` الـ APIs.
- [lib/verifyAdmin.js](lib/verifyAdmin.js).
- [components/SettingsMenu.js](components/SettingsMenu.js) — قائمة المستخدم.

### 🌙 مساءً — التمرين النهائي
**اشرح بصوت عالٍ، دون فتح الكود**، ثلاث عمليات:
1. تسجيل طالب جديد ← وصوله لـ `/hub` بعد الموافقة.
2. إنشاء عقدة محمية ← انضمام طالب آخر بموافقة القائد.
3. إرسال رسالة فيها ملف من طالب عادي ← ظهورها بعد موافقة القائد.

سجّل نفسك. استمع. أين توقفت؟ هذه الفجوات هي ما يحتاج مراجعة.

---

## بعد الـ4 أيام

- [LEARN_APP_FLOWS.md](LEARN_APP_FLOWS.md) كمرجع سريع.
- [LEARN_APP_CONCEPTS.md](LEARN_APP_CONCEPTS.md) كل ما تنسى مفهوماً.
- ابدأ **مهمة صغيرة حقيقية**: مثلاً أضف عداد "آخر ظهور" للطلاب في `GroupMembers`. هذا يجبرك على المرور بكل الطبقات (UI + Firestore + ربما API).

---

## ملاحظة من [CLAUDE.md](CLAUDE.md)
- المستخدم يفضّل **تفكيك تدريجي** على إعادة كتابة شاملة.
- خطوات صغيرة قابلة للاختبار.
- لا تعدّل `firestore.rules` (غير موجود في الـ repo).
- لا تستورد من `lib/i18n/` (محذوف بالكامل).
