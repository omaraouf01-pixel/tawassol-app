# برومت تعلّم تطبيق Tawassol

> الصق هذا البرومت في جلسة Claude Code جديدة داخل مجلد المشروع لإنتاج توثيق تعليمي كامل.

---

أنت معلّم برمجة خبير. مشروع **Tawassol** (Next.js + Firebase) موجود في `C:\Users\omara\tawassol\src`. مهمتك إنتاج توثيق تعليمي عربي عميق ومنظّم يمكّن مبتدئ-متوسط من **فهم التطبيق والتطوير عليه** (لا مجرد قراءته).

## قواعد صارمة
- **افحص التطبيق فعلياً** قبل أي كتابة: استخدم Glob/Grep/Read على كل ملفات `app/`, `components/`, `lib/`, `app/api/`, و `package.json`. ممنوع التخمين.
- لكل عنصر تشرحه اذكر: الاسم + المسار + رقم السطر + ماذا يفعل + متى يُستدعى + **لماذا موجود**.
- روابط Markdown: `[الاسم](path:line)`.
- العربية، أسلوب مبسّط، أمثلة قصيرة من الكود الفعلي.
- ما لا تتأكد منه ← قسم "أسئلة مفتوحة".
- لا تخترع ملفات أو دوال.

---

## الملفات المطلوب إنشاؤها (كلها داخل جذر المشروع)

### 1) `LEARN_APP.md` — نظرة عامة + شرح الأدوات
- ما هو التطبيق، لمن، ما المشكلة التي يحلّها.
- **شرح كل أداة مستخدمة ولماذا اختيرت بالذات في هذا المشروع**: Next.js App Router، Firebase Auth، Firestore، Cloudinary، Tailwind، Framer Motion، وأي مكتبة في `package.json`. لكل أداة: ما هي + لماذا هنا تحديداً + أين تظهر في الكود.
- مخطط نصي لتدفق المستخدم من التسجيل حتى الاستخدام.
- فهرس بروابط لباقي ملفات `LEARN_APP_*`.

### 2) `LEARN_APP_CONCEPTS.md` — المفاهيم وراء الكود
اشرح **بمعزل عن الكود** ثم اربط بأمثلة من المشروع:
- ما هو App Router ولماذا وليس Pages Router؟ ما معنى `"use client"`؟
- Server vs Client Components، وأين الحدود في هذا المشروع.
- React hooks: `useState`, `useEffect`, `useRef`, `useMemo` — متى كلٌّ منها؟
- دورة حياة المكوّن + re-renders + cleanup functions.
- Firestore: `getDoc` vs `onSnapshot` (real-time)، listeners و memory leaks.
- Firebase Auth: ID Token + Bearer Token + لماذا `apiClient` يضيفه تلقائياً.
- متى تستدعي Firestore مباشرة من العميل، ومتى تمرّ عبر `/api/*`؟

### 3) `LEARN_APP_PAGES.md` — الصفحات والمكوّنات وAPI
لكل صفحة `app/**/page.js`، وكل مكوّن `components/**`، وكل route `app/api/**`:
- المسار، **الغرض ولماذا أُنشئ**، ماذا يعرض/يفعل.
- الـ state المهم، useEffect الرئيسية، الأزرار وما تفعله، شروط الوصول (guards)، props.
- ركّز على: `auth`, `pending`, `hub`, `chat/[id]`, `explore`, `admin`, `onboarding`، و `components/chat/*`, `components/admin/*`, `components/explore/*`, و `Sidebar`, `SettingsMenu`, `DiscoveryGrid`.

### 4) `LEARN_APP_FUNCTIONS.md` — الدوال
كل دالة مهمة في `lib/*` و `app/api/*` ومكوّنات الدردشة والأدمن:
- التوقيع، الموقع `[ملف:سطر]`، ماذا تفعل، من يستدعيها، مثال استخدام.
- شمل بالكامل: `useAuth`, `apiClient`, `mapAuthError`, `collections`, `collectionNames`, `firebase`, `firebaseAdmin` (إن وجد).

### 5) `LEARN_APP_FLOWS.md` — تدفق البيانات والعمليات
لكل عملية: الغرض، نقطة البداية (زر/صفحة)، **تسلسل المراحل خطوة-بخطوة مع اسم الدالة المسؤولة عن كل مرحلة ورابطها**، Firestore collections المتأثرة، حالات النجاح والفشل.

العمليات الإلزامية:
- التسجيل (Sign Up)
- تسجيل الدخول + `mapAuthError`
- `pending → admin يوافق → active → onboarding → onboarded`
- التوجيه التلقائي في `useAuth`
- إنشاء/الانضمام لمجموعة (Node)
- إرسال رسالة + `onSnapshot`
- إضافة/إزالة عضو
- لوحة الأدمن (قبول، رفض، إدارة)
- رفع ملف عبر `/api/upload` (Cloudinary)
- الإشعارات
- المشرفون (Moderation / Overseer)
- الموارد (Resources)
- تسجيل الخروج

### 6) `LEARN_APP_DATA_MODEL.md` — نموذج بيانات Firestore
- قائمة كل الـ collections (من `lib/collectionNames.js` والاستعلامات الفعلية).
- لكل collection: الحقول المتوقّعة + من يكتب + من يقرأ + العلاقات مع collections أخرى.
- مخطط ASCII يُظهر العلاقات (users ↔ groups ↔ messages …).

### 7) `LEARN_APP_SECURITY.md` — الأمان والصلاحيات
- Guards في الصفحات (`useAuth`, فحص `status`/`role`/`onboarded`).
- Bearer Token في `/api/*`: كيف يُضاف، كيف يُتحقّق منه، ماذا لو نقص.
- ملاحظات أمنية: ما الذي يحميه العميل وما يجب أن يحميه السيرفر/القواعد.
- ما ينقص (مثلاً `firestore.rules` غير موجود في الـrepo) ومخاطره.

### 8) `LEARN_APP_DEBUGGING.md` — التصحيح والحواف
- كيف تقرأ خطأ Firebase، كيف تفتح Network tab، متى تستخدم `console.log` vs debugger.
- Edge cases معروفة: انقطاع الإنترنت أثناء الإرسال، رفض مستخدم بعد دخوله، ضغط زرّين بسرعة (race conditions).
- المخاطر القائمة: `finalizingRef` في onboarding، re-renders بسبب `onSnapshot`، الصفحات الضخمة، أي TODO/FIXME وجدتها.
- متغيرات البيئة: ما السرّي وما العام (`NEXT_PUBLIC_*`)، وفرق محلي/إنتاج.

### 9) `LEARN_APP_EXERCISES.md` — تمارين عملية
تمارين مرتبطة بخطة الـ4 أيام، من السهل للصعب:
- **اقرأ وخمّن:** "ماذا يحدث لو حذفت `finalizingRef`؟"
- **عدّل وجرّب:** "غيّر لون رسائل المشرف"، "أضف زراً يطبع المستخدم الحالي في console".
- **اكسر التطبيق:** سيناريوهات مقصودة لفهم الحواف.
- في نهاية كل يوم: 15 دقيقة "افتح التطبيق وحاول تكسره".

### 10) `LEARN_APP_PLAN.md` — خطة 4 أيام
كل يوم مقسّم: **صباحاً** اقرأ المفاهيم + الملفات، **مساءً** نفّذ التمارين.

- **يوم 1 — المصادقة والأساسيات:** `lib/firebase`, `useAuth`, `authErrors`, `apiClient`, `collectionNames`, `collections`, `app/layout`, `app/auth`, `app/pending`, `app/api/auth/*`, `app/api/user/pending-requests`. تمرين: ارسم تدفق التسجيل بنفسك.
- **يوم 2 — Hub والاستكشاف:** `app/hub/**`, `app/explore/**`, `Sidebar`, `DiscoveryGrid`, `NodeShelf`, `JoinNodeModal`. تمرين: تتبّع زر "انضمام" حتى Firestore.
- **يوم 3 — الدردشة:** `app/hub/chat/[id]/page.js`, كل `components/chat/*`. تمرين: تتبّع رسالة من الإرسال للظهور.
- **يوم 4 — الأدمن وAPI ومراجعة:** `components/admin/*`, `app/admin/**`, `app/api/**`, `SettingsMenu`. تمرين نهائي: اشرح 3 عمليات بصوت عالٍ دون الكود.

---

## في النهاية
اطبع قائمة بكل الملفات التي أنشأتها مع مساراتها الكاملة وحجم كل ملف تقريبياً.

ابدأ الآن. اقرأ كل شيء مهم قبل أن تكتب.
