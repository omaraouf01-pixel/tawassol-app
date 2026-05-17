# CLAUDE.md — تعليمات دائمة للمساعد

> اقرأ هذا الملف أولاً في كل جلسة. للخريطة الكاملة راجع `PROJECT_MAP.md`.

## نظرة سريعة
- **المشروع:** Tawassol — منصة طلابية أكاديمية (Next.js + Firebase).
- **اللغة:** الرد بالعربية افتراضياً (الواجهة عربية والمستخدم يكتب بالعربية).
- **الـ Stack:** Next.js 13+ App Router، Firebase Auth/Firestore، Cloudinary، Tailwind، Framer Motion.

## بنية المجلدات
```
src/
├── app/              # صفحات Next.js (App Router)
├── components/       # مكونات قابلة لإعادة الاستخدام
│   ├── chat/         # مكونات الدردشة
│   ├── admin/        # لوحة الأدمن
│   └── explore/      # الاستكشاف
├── lib/              # منطق مشترك، Firebase hooks، helpers
└── (لا يوجد src/hooks أو src/services حالياً)
```

## اصطلاحات الكود
- جميع صفحات `app/**/page.js` تستخدم `"use client"`.
- استدعاءات Firestore الحية عبر `onSnapshot` (مباشرة في الصفحات حالياً).
- الـ API calls تذهب عبر `lib/apiClient.js` (يضيف Bearer Token تلقائياً).
- الترجمة الخطأ لـ Firebase عبر `mapAuthError()` من `lib/authErrors.js`.
- ثوابت أسماء الـ Collections في `lib/collectionNames.js` — استخدمها بدلاً من النصوص.

## قواعد مهمة
1. ❌ **لا تستورد من `lib/i18n/`** — محذوف بالكامل.
2. ❌ **لا تعدّل `firestore.rules`** بدون إذن صريح (غير موجود في الـ repo).
3. ❌ **لا تكسر فحص الصلاحيات** في `app/hub/chat/[id]/page.js` — يجب أن يكون المستخدم `member` أو `leader` أو `admin`.
4. ✅ **استخدم `useAuth()`** من `lib/useAuth.js` للحصول على المستخدم — لا تستدعي Firebase Auth مباشرة في الصفحات.
5. ✅ **التزم بنظام الألوان:** `cream`, `ink`, `accent` (#7c83f2), `sand`. لا تضف ألواناً عشوائية.
6. ✅ **commit قبل refactor كبير** — حالياً 25+ ملف معدّل غير ملتزم.

## نقاط دخول رئيسية
- **التوجيه التلقائي:** `lib/useAuth.js` يقرر الوجهة حسب `status` + `onboarded` + `role`.
- **رفع الملفات:** `/api/upload` يرفع لـ Cloudinary ويعيد URL.
- **تدفق التحقق:** `pending` → admin يوافق → `active` → onboarding → `onboarded:true` → `/hub`.

## المخاطر المعروفة
- صفحة `onboarding` بها race condition محلولة بـ `finalizingRef` — لا تزيل هذا.
- تعديلات onSnapshot قد تسبب re-renders كثيرة — احذر من حلقات لا نهائية في useEffect.
- بعض الصفحات ضخمة (hub، chat، admin) — قابلة للتفكيك تدريجياً عند الحاجة.

## أسلوب العمل المفضل
- المستخدم يفضّل **التفكيك التدريجي** على إعادة كتابة شاملة.
- المستخدم يفضّل **خطوات صغيرة قابلة للاختبار** بين كل تعديل.
- اعرض الخطة أولاً، ثم نفّذ بعد الموافقة.
