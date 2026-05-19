# LEARN_APP_DEBUGGING — التصحيح والحواف

> دليل عملي: كيف تشخّص، أين تنظر، ما الفخاخ المعروفة.

---

## 1) قراءة خطأ Firebase

أخطاء Firebase تأتي بـ `code` وregex على `message`. أكثرها شيوعاً:

| Code | السبب | الحل |
|---|---|---|
| `auth/invalid-credential` | بريد/كلمة سر خاطئة | تحقق من matricule + password |
| `auth/email-already-in-use` | الإيميل مستخدم | تسجيل دخول بدل register |
| `auth/too-many-requests` | محاولات كثيرة فاشلة | انتظر ~15 دقيقة |
| `auth/id-token-expired` | التوكن تجاوز ساعة | `getIdToken(true)` للتحديث |
| `permission-denied` (Firestore) | قواعد ترفض الطلب | افحص rules أو هل أنت عضو |
| `failed-precondition` | استعلام يحتاج index | افتح الرابط في console الخطأ — Firebase يبني index تلقائياً |
| `unavailable` | انقطاع شبكة | إعادة محاولة |

[lib/authErrors.js:9](lib/authErrors.js:9) يحوّل أكثرها لرسائل مفهومة. عند الخطأ المجهول `console.error("Auth Error:", err)` يطبع الكائن الكامل.

---

## 2) Network tab — متى ولماذا

افتح **DevTools → Network → Fetch/XHR**:
- لمعرفة ما إذا كان `/api/*` يصل (`Status` و`Response`).
- لرؤية `Authorization` header — هل التوكن موجود؟
- لقياس زمن: لو `/api/upload` يأخذ 30s، المشكلة في Cloudinary أو في حجم الملف.

**Tip:** Right-click على الطلب → "Copy as cURL" — تستطيع إعادة تشغيله من terminal لإعادة إنتاج الخطأ بدون UI.

---

## 3) `console.log` vs debugger vs React DevTools

| الأداة | متى |
|---|---|
| `console.log` | تتبّع قيمة لحظية، خاصة داخل `useEffect` و`onSnapshot` |
| `debugger;` | لإيقاف التنفيذ ومعاينة scope كاملاً (يحتاج DevTools مفتوحة) |
| React DevTools | لمعاينة props/state لكل مكوّن، خاصة `AuthProvider` Context |
| Firebase Console → Firestore | لمعاينة البيانات الفعلية وكأنك السيرفر |

**Anti-pattern:** `console.log` داخل onSnapshot يطبع آلاف المرات. ضع شرطاً أو احذفه بعد التشخيص.

---

## 4) Edge cases معروفة

### 4.1 انقطاع الإنترنت أثناء إرسال رسالة
- `useChat.sendMessage` يضيف رسالة optimistic ثم `addDoc`.
- لو `addDoc` فشل، الرسالة تُعلَّم `_failed:true` ([lib/useChat.js:210](lib/useChat.js:210)) لكن **لا توجد واجهة retry** — المستخدم يفقد الرسالة بصمت.

### 4.2 رفض مستخدم بعد دخوله
- لو الأدمن غيّر `status:"rejected"` بينما المستخدم في `/hub`، `useAuth` يلتقط onSnapshot ويُحدّث userData لكن **لا يوجد فرع explicit لـ rejected** في منطق التوجيه. النتيجة: يبقى في `/hub` لكن قواعد Firestore تبدأ ترفض كتاباته. **حل مقترح:** إضافة فرع `status==="rejected" → router.replace("/auth") + signOut`.

### 4.3 ضغط زرّين بسرعة (race conditions)
- **الموافقة المتعدّدة:** [app/admin/page.js:69](app/admin/page.js:69) يستخدم `processingId` لمنع نقر مزدوج. جيد.
- **`handleFinalize` في Onboarding:** محمي بـ `isSubmitting` ⊕ `finalizingRef`. ممتاز.
- **`handleAuth`:** يحمي بـ `if (loading) return`. جيد.
- **`handleCreatePost`:** يستخدم `isSubmitting`. لكن لو الرفع طويل، المستخدم يرى الزر معطّلاً بدون feedback — اعتبار UX.

### 4.4 onSnapshot يطلق re-renders كثيرة
- في `/hub` فيه 2 listeners (posts + groups). كل تحديث يعيد رسم 25 بطاقة. الحل عند الحاجة: React.memo على بطاقات المنشور.
- في `/admin` listener على كل `users` بدون pagination — يصير ثقيلاً عند مئات المستخدمين.

### 4.5 `finalizingRef` في Onboarding
**لا تزل** هذا الـ ref. ([CLAUDE.md](CLAUDE.md) #6 + [app/onboarding/page.js:104](app/onboarding/page.js:104))
سيناريو الكسر:
1. المستخدم يضغط Finish.
2. `updateDoc` ينجح بسرعة.
3. `onSnapshot` في `useAuth` يرى `status:"active" && onboarded:true` فيوجّه لـ `/hub`.
4. لكن `setStep(3)` لم يحدث بعد لأن React batched.
5. النتيجة: المستخدم لا يرى شاشة الترحيب.

`finalizingRef.current = true` يُحبط الـ useEffect قبل التوجيه.

---

## 5) صفحات/ملفات ضخمة وقابلة للتفكيك

| الملف | السطور تقريباً | المخاطر |
|---|---|---|
| `app/auth/page.js` | 735 | عدة modals مزروعة + reCAPTCHA + 3 طرق دخول. اقتراح: استخراج `PhoneSignInModal`, `OAuthCompletionModal`. |
| `app/hub/chat/[id]/page.js` | 167 | معقول لكن CLAUDE.md يحذّر من تعديلات تكسر الـ guard. |
| `app/hub/page.js` | 521 | فيه post creation + post list + comments — قابل لـ split. |
| `app/admin/page.js` | 245 | فيه tabs + listeners + handlers. مقبول. |
| `app/onboarding/page.js` | 338 | 3 steps في ملف. قابل لـ split إلى Step1/Step2/Step3. |

التفكيك التدريجي مفضّل ([CLAUDE.md](CLAUDE.md)).

---

## 6) TODO/FIXME ملاحظات معاينة

- في [app/api/groups/[id]/messages/route.js:111](app/api/groups/[id]/messages/route.js:111) تعليق: `// Override uid with senderId as requested by the prompt` — يوحي بتعديل سريع لم يُكتمل تنظيفه. الحقل المخزّن قد يصير `uid` و`senderId` و`authorId` كلها — اختر واحداً.
- [lib/useChat.js:39](lib/useChat.js:39) يقارن `prev.uid === m.uid` — لكن السيرفر يكتب `authorId/senderId`. هذا قد يكسر `_grouped` عند الرسائل القادمة من POST API بدلاً من addDoc العميل.

---

## 7) متغيرات البيئة

| المتغير | جانب | سرّي؟ |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | عميل | لا (عامة) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | عميل | لا |
| `FIREBASE_PROJECT_ID` | سيرفر | نوعاً ما |
| `FIREBASE_CLIENT_EMAIL` | سيرفر | متوسط |
| `FIREBASE_PRIVATE_KEY` | سيرفر | **سرّي جداً** |
| `CLOUDINARY_API_KEY` | سيرفر | سرّي |
| `CLOUDINARY_API_SECRET` | سيرفر | **سرّي جداً** |

**فرق محلي/إنتاج:**
- محلي: `.env.local` (لا يُرفع لـ git).
- إنتاج (Vercel/Netlify): إعدادات المشروع → Environment Variables. **تأكد:** `FIREBASE_PRIVATE_KEY` يحتاج `\n` (الكود في [lib/firebaseAdmin.js:34](lib/firebaseAdmin.js:34) يفك `\\n` إلى `\n`).
- في dev: `appVerificationDisabledForTesting = true` ([lib/firebase.js:76](lib/firebase.js:76)) — تأكد ألا يعمل في prod (الشرط على `NODE_ENV` يكفي).

---

## 8) كيف تختبر سريعاً

| السيناريو | الخطوات |
|---|---|
| تدفق تسجيل كامل | سجّل بحساب test، افتح console للأدمن، اضغط Approve، راقب redirect |
| Race في الـ onboarding | عدّل `finalizingRef.current = true` إلى `false` مؤقتاً وحاول التسجيل |
| فقدان شبكة | DevTools → Network → Throttling → Offline، اكتب رسالة |
| توكن منتهٍ | في console: `auth.currentUser._delegate.accessToken = "bad"` ثم api call |
| permission-denied | اطلب `/api/admin/users` كطالب عادي |
