# LEARN_APP — تطبيق Tawassol: نظرة عامة وأدوات

> ملف تعليمي عربي. الهدف: أن تفهم **ما هو** التطبيق، **بماذا** بُني، **ولماذا** اختيرت هذه الأدوات بالذات.
> هذا الملف هو بوابتك. لاستيعاب أعمق راجع: [LEARN_APP_CONCEPTS.md](LEARN_APP_CONCEPTS.md)، [LEARN_APP_FLOWS.md](LEARN_APP_FLOWS.md)، [LEARN_APP_PLAN.md](LEARN_APP_PLAN.md).

---

## 1) ما هو Tawassol؟

منصة أكاديمية لطلاب **جامعة وهران 1** تربط الطلاب بمعلميهم وزملائهم داخل **عقد (Nodes) دراسية** فيها دردشة حيّة، موارد، ومنشورات. كل طالب يُسجّل ببطاقة جامعية، ثم يوافق عليه **أدمن** يدوياً، ثم يكمل مرحلة **Onboarding**، ثم يدخل **Hub** ويستكشف العقد أو ينضم لها.

**المشكلة التي تحلّها:** البديل عن مجموعات Facebook وWhatsApp الفوضوية — مساحة مركزية، موثّقة (كل طالب مُعتمد ببطاقته)، وفيها أدوار واضحة (طالب/قائد عقدة/أدمن).

---

## 2) الأدوات المختارة — ولماذا هنا تحديداً

### Next.js 14 (App Router)
- **ما هو:** إطار React يجمع بين تصيير عميل وسيرفر، مع نظام Routing مبني على المجلدات.
- **لماذا هنا:** كل صفحة في [app/](app/) ملف `page.js`، وكل API في `app/api/.../route.js`. هذا يجعل **الواجهة + الـAPI في نفس المشروع** — لا تحتاج Express منفصلاً. مرجع: [app/layout.js:1](app/layout.js:1).
- **App Router (وليس Pages):** يدعم Server Components و`use client` بشكل دقيق، ويُسهّل الـ Route Handlers (`route.js`). كل `page.js` في هذا المشروع يبدأ بـ `"use client"` لأن الواجهات تفاعلية بالكامل (Firebase listeners تعمل في المتصفح).

### Firebase (Auth + Firestore + Admin SDK)
- **Auth:** لإدارة تسجيل الدخول. يدعم Email/Password وGoogle وGitHub وHاتف (SMS عبر reCAPTCHA). انظر [app/auth/page.js:13](app/auth/page.js:13).
- **Firestore:** قاعدة بيانات NoSQL لحظية — `onSnapshot` يدفع التغييرات للمستخدم تلقائياً (مهم للدردشة والإشعارات). يُستخدم مباشرة من العميل عبر [lib/firebase.js:67](lib/firebase.js:67).
- **Admin SDK:** نسخة سيرفر بصلاحيات كاملة، تُستخدم في `/api/*` لتجاوز قواعد Firestore عند الحاجة (مثلاً إنشاء حساب جديد أو موافقة أدمن). مرجع: [lib/firebaseAdmin.js:46](lib/firebaseAdmin.js:46).
- **لماذا Firebase ولا backend خاص؟** التطبيق صغير-متوسط ويحتاج real-time. Firestore يوفر ذلك بصيغة جاهزة دون كتابة WebSockets.

### Cloudinary
- **ما هو:** خدمة استضافة ملفات (صور + ملفات).
- **لماذا هنا:** بطاقات الطلاب، صور البروفايل، وملفات الدردشة كلها تُرفع عبر [app/api/upload/route.js:11](app/api/upload/route.js:11). Firebase Storage بديل، لكن المشروع اختار Cloudinary لتسهيل التحويل والـ CDN.

### Tailwind CSS
- **لماذا:** نظام تصميم بدون CSS منفصل. كل المكوّنات تستخدم classes utility (مثلاً `bg-cream text-ink rounded-2xl`). الألوان المخصّصة (`cream`, `ink`, `accent #7c83f2`, `sand`) معرّفة في إعدادات Tailwind ومُلتزم بها حصراً (راجع [CLAUDE.md](CLAUDE.md)).

### Framer Motion
- **لماذا:** انتقالات سلسة بين الصفحات والمكوّنات (مثل `AnimatePresence` في [app/auth/page.js:412](app/auth/page.js:412) لإظهار رسائل الخطأ). يضيف لمسة "Apple-like" للواجهة.

### Lucide React + React Icons
- مكتبتا أيقونات. Lucide هي الافتراضية (أيقونات نحيفة)، React Icons احتياط.

### date-fns
- معالجة التواريخ (لأن Firestore يعيد Timestamp objects تحتاج تحويل).

### next-themes
- إدارة الوضع الليلي/النهاري. مغلف في [components/ThemeProvider.js](components/ThemeProvider.js) ومستخدم في [app/layout.js:14](app/layout.js:14).

### emoji-picker-react
- للوحة الرموز التعبيرية في input الدردشة.

### i18next + react-i18next
- **ملاحظة:** موجودة في `package.json` لكن نظام الترجمة **محذوف بالكامل** (راجع [CLAUDE.md](CLAUDE.md) القاعدة #1). الواجهة بالإنجليزية فقط حالياً.

---

## 3) مخطط تدفق المستخدم

```
زائر يدخل /                      → صفحة Landing
   │
   ↓ يضغط "Sign In" / "Join Us"
/auth                            → تسجيل (Email/Pass/OAuth/Phone) أو دخول
   │  (يرفع بطاقة طالب)
   ↓
/api/register                     → ينشئ Auth user + مستند Firestore بـ status="pending"
   │
   ↓ يدخل تلقائياً (signInWithEmailAndPassword)
useAuth يكتشف status="pending"
   │
   ↓
/pending                          → "حسابك تحت المراجعة"
   │
   ↓ (أدمن يضغط Approve في /admin)
/api/admin/users/[uid]/approve    → status="active", custom claims
   │
   ↓ useAuth يلتقط التغيير (onSnapshot) ويُحدّث Token
status=active && !onboarded
   │
   ↓
/onboarding                       → 3 خطوات (تخصص، صورة، Bio)
   │ ينقر "Finish"
   ↓
updateDoc(users) { onboarded:true, status:"active" }
   │
   ↓
/hub                              → الموجز الرئيسي: منشورات + قائمة عقدي
   │
   ├→ /explore                    → اكتشاف كل العقد + طلب انضمام
   ├→ /hub/chat/[id]              → دردشة لحظية داخل عقدة
   ├→ /groups/create              → إنشاء عقدة جديدة (تصبح Leader)
   └→ /profile                    → بيانات الطالب
```

---

## 4) فهرس الملفات الأخرى

- [LEARN_APP_CONCEPTS.md](LEARN_APP_CONCEPTS.md) — مفاهيم: App Router, hooks, Server vs Client, Firestore listeners, Bearer Tokens.
- [LEARN_APP_FLOWS.md](LEARN_APP_FLOWS.md) — تدفق العمليات الكاملة (التسجيل، إرسال رسالة، الموافقة، إلخ).
- [LEARN_APP_PLAN.md](LEARN_APP_PLAN.md) — خطة تعلّم 4 أيام.

> ⚠️ ملاحظات لم تُنتج بعد لقرار النطاق: `PAGES`, `FUNCTIONS`, `DATA_MODEL`, `SECURITY`, `DEBUGGING`, `EXERCISES`. يمكن إنتاجها لاحقاً عند الحاجة.

---

## 5) أسئلة مفتوحة

- ملف `firestore.rules` غير موجود في الـ repo — هل يُدار من Firebase Console يدوياً؟ (راجع [CLAUDE.md](CLAUDE.md))
- `app/api/auth/` ظاهر كـ `??` في git status — تم إنشاؤه مؤخراً ولم يُلتزم بعد.
- مكتبة `i18next` ما زالت في `package.json` رغم حذف نظام الترجمة — هل تُزال؟
