# برومت: فهم تطبيق Tawassol خلال يومين

> انسخ هذا البرومت وأعطه لـ Claude Code في بداية كل يوم.
> النتائج تُكتب تدريجياً في الملفات المدرجة أسفله.

---

## البرومت الرئيسي (انسخه كاملاً في بداية كل جلسة)

```
أنا أدرس مشروع Tawassol (Next.js 13 + Firebase) وأريد فهمه كاملاً خلال يومين:
كل صفحة، كل مكوّن، كل API route، كل دالة، وكل عملية من البداية للنهاية.

مهمتك: افحص الكود الفعلي (لا تخمّن)، واكتب النتائج في الملفات المحددة لكل
مرحلة. اقرأ كل ملف قبل شرحه. اكتب بالعربية. لا تنتقل لمرحلة جديدة إلا بعد
أن أكتب لك "تابع".

══════════════════════════════════════════════════════════
اليوم 1 — المرحلة 1: الأدوات والبنية  →  اكتب في LEARN_APP.md
══════════════════════════════════════════════════════════

اقرأ: package.json, next.config.js, CLAUDE.md, lib/collections.js,
lib/collectionNames.js, lib/useAuth.js, lib/useMyGroups.js, lib/academicData.js

اكتب في LEARN_APP.md:
1. جدول المكتبات: الاسم | الدور | أين يُستخدم
2. شجرة المجلدات مع شرح دور كل مجلد (جملة واحدة لكل مجلد)
3. ملفات lib/ واحداً واحداً: ماذا يصدّر + متى يُستخدم
4. خريطة التوجيه: كل مسار في app/ → من يصل إليه (guest/pending/active/admin)
5. جدول Firestore Collections: الاسم | الحقول الرئيسية | من يكتب / من يقرأ

في نهاية هذه المرحلة اكتب: "✅ انتهت المرحلة 1" وانتظر.

══════════════════════════════════════════════════════════
اليوم 1 — المرحلة 2: الصفحات والمكونات  →  اكتب في LEARN_APP_PAGES.md
══════════════════════════════════════════════════════════

لكل صفحة في القائمة التالية اقرأ الملف الفعلي ثم اكتب:
  • الغرض من الصفحة (جملة واحدة)
  • من يصل إليها
  • البيانات التي تجلبها (Firestore collections)
  • المكونات التي تستخدمها
  • الدوال الرئيسية (الاسم + ماذا تفعل في سطر)

الصفحات بالترتيب:
  app/auth/page.js → app/pending/page.js → app/onboarding/page.js
  → app/page.js → app/explore/page.js → app/hub/page.js
  → app/hub/chat/[id]/page.js → app/groups/create/page.js
  → app/groups/join/page.js → app/profile/page.js
  → app/profile/[uid]/page.js → app/admin/page.js

ثم لكل مكوّن في القائمة التالية:
  • الوظيفة + الـ Props التي يستقبلها + أين يُستخدم

المكونات:
  Sidebar.js, NotificationCenter.js, SettingsMenu.js, SearchBar.js,
  UserBadge.js, SelectionModal.js,
  chat/MessageList.js, chat/MessageInput.js, chat/MemberListDrawer.js,
  chat/OverseerPanel.js, chat/ResourcesSidebar.js,
  admin/AdminUsersTable.js, admin/AdminGroupsTable.js,
  admin/AdminReportsTable.js, admin/UserProfileModal.js

في نهاية هذه المرحلة اكتب: "✅ انتهت المرحلة 2" وانتظر.

══════════════════════════════════════════════════════════
اليوم 2 — المرحلة 3: API Routes  →  اكتب في LEARN_APP_FUNCTIONS.md
══════════════════════════════════════════════════════════

لكل API route اقرأ الملف ثم اكتب:
  • المسار + الـ HTTP method
  • ما يستقبله (body/params)
  • ما يرجعه
  • التحقق من الصلاحيات
  • الـ Firestore collections التي يعدّلها
  • من يستدعيه (صفحة أو مكوّن)

الملفات:
  app/api/user/setup/route.js
  app/api/groups/route.js
  app/api/groups/[id]/members/[uid]/route.js
  app/api/groups/[id]/members/[uid]/role/route.js
  app/api/groups/[id]/resources/[resId]/route.js
  app/api/groups/[id]/messages/[msgId]/react/route.js
  app/api/groups/[id]/messages/[msgId]/report/route.js
  app/api/groups/[id]/pin/route.js
  app/api/groups/[id]/report/route.js
  app/api/groups/[id]/events/route.js
  app/api/posts/route.js
  app/api/posts/[id]/like/route.js
  app/api/posts/[id]/comments/route.js
  app/api/posts/[id]/report/route.js
  app/api/profile/route.js
  app/api/search/route.js
  app/api/admin/groups/[id]/route.js
  app/api/admin/reports/route.js
  app/api/admin/backfill-points/route.js

في نهاية هذه المرحلة اكتب: "✅ انتهت المرحلة 3" وانتظر.

══════════════════════════════════════════════════════════
اليوم 2 — المرحلة 4: مراحل العمليات  →  اكتب في LEARN_APP_EXERCISES.md
══════════════════════════════════════════════════════════

لكل عملية اكتب: الدوال بالترتيب + الملفات + الـ Collections التي تتأثر.

1. إنشاء حساب جديد (Signup):
   إدخال بيانات → handleSignUp() في auth/page.js
   → createUserWithEmailAndPassword() (Firebase Auth)
   → addDoc() في Firestore (users collection, status: "pending")
   → useAuth() يكتشف التغيير → توجيه لـ /pending

2. تسجيل الدخول (Login):
   إدخال بيانات → handleSignIn() → signInWithEmailAndPassword()
   → onAuthStateChanged() يُطلق useAuth()
   → useAuth() يقرأ status+onboarded+role من Firestore
   → يوجّه: pending→/pending | active+onboarded→/hub | active→/onboarding

3. موافقة الأدمن على مستخدم:
   AdminUsersTable → زر موافقة → استدعاء API (PUT /api/admin/users أو مباشراً)
   → Firestore update (status: "active") → useAuth() يلتقط التغيير
   → المستخدم يُوجَّه لـ /onboarding

4. إتمام الـ Onboarding:
   ملء النموذج → handleImageUpload() → رفع لـ Cloudinary (/api/upload)
   → handleSubmit() → POST /api/user/setup
   → Firestore update (onboarded: true, displayName, photoURL, major, ...)
   → finalizingRef يمنع race condition → توجيه لـ /hub

5. إنشاء مجموعة:
   نموذج الإنشاء → handleCreate() في groups/create/page.js
   → POST /api/groups → Firestore addDoc (groups collection)
   → إضافة المنشئ كـ leader في subcollection members
   → توجيه لصفحة المجموعة

6. الانضمام لمجموعة:
   استكشاف/بحث → طلب انضمام → Firestore addDoc (joinRequests)
   → إشعار لـ leader → leader يوافق
   → PUT /api/groups/[id]/members/[uid] → إضافة في members subcollection

7. إرسال رسالة في الدردشة:
   MessageInput → handleSend() → Firestore addDoc (messages subcollection)
   → onSnapshot في MessageList يكتشف الرسالة الجديدة → تحديث الـ UI فوراً

8. رفع مرفق في الدردشة:
   اختيار ملف → رفع لـ /api/upload → Cloudinary يعيد URL
   → إدراج URL في document الرسالة مع الـ message text

9. إنشاء منشور (Post):
   نموذج النشر → رفع مرفقات لـ Cloudinary → POST /api/posts
   → Firestore addDoc (posts collection) → يظهر في Feed عبر onSnapshot

10. الإعجاب بمنشور:
    زر Like → POST /api/posts/[id]/like
    → Firestore update (likes array أو counter)

11. إضافة تعليق:
    نموذج التعليق → POST /api/posts/[id]/comments
    → Firestore addDoc (comments subcollection)

12. الإبلاغ عن محتوى:
    زر إبلاغ → POST /api/[entity]/[id]/report
    → Firestore addDoc (reports collection)
    → يظهر في AdminReportsTable

13. طرد عضو من مجموعة:
    OverseerPanel أو MemberListDrawer → DELETE /api/groups/[id]/members/[uid]
    → Firestore delete من members subcollection

14. حذف مجموعة (من الأدمن):
    AdminGroupsTable → DELETE /api/admin/groups/[id]
    → Firestore delete للمجموعة + تنظيف البيانات المرتبطة

15. تغيير دور عضو (member → leader):
    OverseerPanel → PUT /api/groups/[id]/members/[uid]/role
    → Firestore update (role field في members subcollection)

في نهاية هذه المرحلة اكتب: "✅ انتهت المرحلة 4" وانتظر.

══════════════════════════════════════════════════════════
اليوم 2 — المرحلة 5: الدوال المهمة + الأمان  →  اكتب في LEARN_APP_SECURITY.md
══════════════════════════════════════════════════════════

لكل دالة اكتب: ماذا تفعل + المعاملات + ماذا ترجع + أين تُستدعى + أي تحذير مهم.

دوال الـ Auth:
  useAuth() — كيف يقرّر التوجيه؟ ما الحقول التي يقرأها من Firestore؟
  mapAuthError() من lib/authErrors.js — ما الأخطاء التي تُترجمها؟

دوال المجموعات:
  useMyGroups() — كيف تجلب المجموعات؟ هل تستخدم onSnapshot؟

دوال الـ API:
  كيف تتحقق API routes من هوية المستخدم؟ (Bearer Token → Firebase Admin)
  lib/apiClient.js — كيف يُلصق التوكن؟ كيف يعالج أخطاء 401/403؟

نظام الصلاحيات:
  • في chat/[id]/page.js: كيف يتحقق من أن المستخدم member أو leader أو admin؟
  • في admin routes: كيف يتحقق من role === "admin"؟
  • ما يحدث عند محاولة الوصول غير المصرّح؟

المخاطر والـ Gotchas:
  • race condition في onboarding وكيف يحلها finalizingRef
  • حلقات re-renders من onSnapshot داخل useEffect
  • الصفحات الضخمة القابلة للتفكيك (hub، chat، admin)

في نهاية هذه المرحلة اكتب: "✅ انتهت جميع المراحل"

══════════════════════════════════════════════════════════
قواعد الكتابة (مهمة جداً)
══════════════════════════════════════════════════════════
• اقرأ كل ملف بـ Read أو Grep قبل شرحه — لا تخمّن.
• اكتب بالعربية، مختصراً ومباشراً.
• كل مرجع لملف يكون بالصيغة: path/file.js:رقم_السطر
• استخدم جداول Markdown حيثما أمكن.
• لا تكرّر المعلومات بين الملفات.
• في نهاية كل مرحلة اكتب سطر الانتهاء وانتظر "تابع" مني.

ابدأ الآن بالمرحلة 1 فقط.
```

---

## ملخص خطة اليومين

| اليوم | المرحلة | الموضوع | الناتج |
|------|---------|---------|--------|
| 1 | 1 | الأدوات + البنية + Firestore | LEARN_APP.md |
| 1 | 2 | الصفحات + المكونات | LEARN_APP_PAGES.md |
| 2 | 3 | API Routes | LEARN_APP_FUNCTIONS.md |
| 2 | 4 | مراحل 15 عملية بالدوال | LEARN_APP_EXERCISES.md |
| 2 | 5 | الدوال المهمة + الأمان + المخاطر | LEARN_APP_SECURITY.md |

## كيف تستخدم هذا البرومت

1. افتح جلسة Claude Code جديدة.
2. الصق البرومت الرئيسي أعلاه كاملاً.
3. انتظر انتهاء كل مرحلة.
4. اكتب "تابع" للانتقال للمرحلة التالية.
5. بعد كل مرحلة راجع الملف الناتج واسأل عن أي نقطة غير واضحة.

## نصائح
- ابدأ بقراءة `lib/useAuth.js` يدوياً — هو قلب التطبيق.
- استخدم Grep للبحث عن أي دالة لرؤية كل أماكن استخدامها.
- جرّب كل عملية في المتصفح بعد قراءة شرحها — التطبيق العملي يثبّت الفهم.
