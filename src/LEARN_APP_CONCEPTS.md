# LEARN_APP_CONCEPTS — المفاهيم وراء الكود

> هذا الملف يشرح المفاهيم **بمعزل** عن المشروع، ثم يربطها بأمثلة فعلية من Tawassol.

---

## 1) Next.js App Router

### المفهوم
في Next.js القديم (Pages Router) كل ملف في `pages/` يصير URL. في **App Router** (Next.js 13+):
- كل مجلد في `app/` هو مسار.
- داخله ملف `page.js` يعرض الصفحة.
- ملف `layout.js` يلفّ كل صفحات تحته (Persistent UI).
- ملف `route.js` يصير endpoint API.

### لماذا App Router وليس Pages؟
- يدعم **Server Components** افتراضياً (تصيير على السيرفر = HTML أصغر وأسرع).
- نظام Layouts متداخل (الـ AuthProvider يُلفّ كل التطبيق مرة واحدة، لا في كل صفحة).
- Route Handlers بصيغة `route.js` أنظف من `pages/api`.

### في Tawassol
- [app/layout.js](app/layout.js) — الـ Root Layout. يضع `ThemeProvider` و`AuthProvider` حول كل التطبيق.
- [app/auth/page.js](app/auth/page.js) — صفحة `/auth`.
- [app/hub/chat/[id]/page.js](app/hub/chat/[id]/page.js) — صفحة ديناميكية. `[id]` يصير معاملاً (يُقرأ بـ `useParams()`).

### `"use client"` — ما معناه؟
بدون هذه الكلمة، المكوّن يُصيَّر على **السيرفر فقط** (لا state, لا useEffect, لا onClick). إضافتها في أول السطر تجعل الملف **Client Component** ينفذ في المتصفح.

كل `page.js` في Tawassol يبدأ بها لأن الواجهات تحتاج تفاعل + Firebase listeners تعمل في المتصفح فقط.

### الحدود في Tawassol
- **Client Components:** كل الصفحات والمكونات في `app/` و`components/`.
- **Server Components / Server-only:** كل ملفات `app/api/*/route.js` + `lib/firebaseAdmin.js` + `lib/collections.js` + `lib/withAuth.js`. هذه **لا يجوز** استيرادها من ملف عميل (سيُسرّب admin SDK في bundle المتصفح).
- **Shared:** `lib/collectionNames.js` آمن للجهتين (لا يستورد firebase-admin) — لذلك يستخدمه العميل والسيرفر معاً ([lib/collectionNames.js:5](lib/collectionNames.js:5)).

---

## 2) React Hooks في هذا المشروع

### `useState`
حالة محلية للمكوّن. تُسبّب re-render عند تغيّرها.
```js
const [posts, setPosts] = useState([]); // app/hub/page.js:130
```

### `useEffect`
يعمل بعد render. يُستخدم لـ:
- ربط listeners (Firestore `onSnapshot`).
- التوجيه (`router.replace`).
- جلب بيانات أولية.

أهم قاعدة: إذا أعدت دالة من useEffect، فهي **cleanup** تُستدعى عند خروج المكوّن أو تغيّر dependencies. **بدونها = memory leak**.

مثال صحيح من [app/hub/page.js:149](app/hub/page.js:149):
```js
useEffect(() => {
  const unsubscribe = onSnapshot(q, snapshot => setPosts(...));
  return () => unsubscribe(); // ← cleanup إجباري
}, [authLoading, user?.uid]);
```

### `useRef`
قيمة ثابتة لا تسبب re-render. ممتازة لـ:
- DOM refs (`fileInputRef.current.click()` في [app/onboarding/page.js:75](app/onboarding/page.js:75)).
- **حماية من race conditions:** `finalizingRef` في [app/onboarding/page.js:81](app/onboarding/page.js:81) يمنع توجيه المستخدم تلقائياً بعد بدء الحفظ. **لو استبدلتها بـ useState لكسرت السباق** لأن الـ state يحتاج render لينتشر.

### `useMemo`
يحفظ ناتج عملية ثقيلة. في [app/admin/page.js:105](app/admin/page.js:105) يُستخدم لتصفية القوائم بناءً على البحث — يُعاد الحساب فقط عند تغير `searchQuery` أو القوائم.

### دورة الحياة + re-renders
```
mount → useEffect يعمل (مع cleanup للسابق إن وجد)
state change → re-render → useEffect deps إن تغيرت → cleanup قديم + effect جديد
unmount → cleanup أخير
```

`onSnapshot` **يولّد re-render** كلما تغيّرت البيانات في Firestore. حذار من حلقة لا نهائية: لا تضع داخل useEffect كوداً يكتب في Firestore بدون شرط — سيستدعي onSnapshot الذي يستدعي الكتابة من جديد.

---

## 3) Firestore: مفاهيم أساسية

### `getDoc` (مرة واحدة) vs `onSnapshot` (لحظي)
- `getDoc(ref)` — يقرأ مرّة ويعيد البيانات.
- `onSnapshot(ref, callback)` — يبقى مفتوحاً ويستدعي الـ callback عند كل تغيّر. **يعيد دالة unsubscribe** يجب استدعاؤها في cleanup.

في [lib/useAuth.js:33](lib/useAuth.js:33) يُستخدم `getDoc` أولاً للحصول السريع، ثم [lib/useAuth.js:70](lib/useAuth.js:70) يربط `onSnapshot` للتحديثات المستمرة.

### Listeners & Memory Leaks
كل `onSnapshot` بدون cleanup = اتصال مفتوح دائماً = استهلاك بطارية + فواتير Firebase + حشو ذاكرة. **القاعدة:** كل listener له `return () => unsub()` في useEffect.

### متى Firestore من العميل، ومتى عبر API؟

**من العميل (`firestore` من lib/firebase):**
- القراءة اللحظية: messages, posts, groups, notifications.
- لأن قواعد Firestore (المُعرّفة في Firebase Console) تتحقّق من هوية المستخدم.

**عبر `/api/*` (Admin SDK):**
- العمليات التي تتجاوز القواعد: إنشاء حساب، موافقة الأدمن، رفع ملف، تعيين Custom Claims.
- العمليات التي تحتاج تحقّق متعدد الجداول (race-free).

مثال: في [app/admin/page.js:68](app/admin/page.js:68) الموافقة تذهب عبر `/api/admin/users/[uid]/approve` لأنها تحتاج Admin SDK لتعيين Custom Claims (شيء لا يستطيع العميل فعله).

---

## 4) Firebase Auth + Bearer Tokens

### ID Token
عند تسجيل دخول المستخدم، Firebase Auth يصدر **ID Token** (JWT) صالحاً لساعة واحدة. هو إثبات الهوية.

### كيف يصل للسيرفر؟
في كل طلب لـ `/api/*` نضيف header:
```
Authorization: Bearer <idToken>
```
ثم على السيرفر [lib/withAuth.js:76](lib/withAuth.js:76):
```js
const decoded = await adminAuth.verifyIdToken(token);
const uid = decoded.uid;
```
لو التوكن مفقود أو منتهي → 401.

### لماذا `apiClient.js` تلقائي؟
[lib/apiClient.js:25](lib/apiClient.js:25) — كل استدعاء يأخذ التوكن الحالي تلقائياً (`auth.currentUser.getIdToken()`)، يضيفه للـ headers، ويعالج timeout + retry على 401/403 بتوكن جديد. **هذا يجنّبك تكرار 10 أسطر في كل طلب.**

### Custom Claims
بعد موافقة الأدمن، السيرفر يضيف claims على Auth user ([app/api/admin/users/[uid]/approve/route.js:36](app/api/admin/users/[uid]/approve/route.js:36)):
```js
setCustomUserClaims(uid, { role: "student", status: "active" });
revokeRefreshTokens(uid); // يجبر تحديث التوكن
```
ثم في العميل، عند `onSnapshot` لاحظ تغيّر status → `getIdToken(true)` لجلب التوكن الجديد المتضمن claims الحالية ([lib/useAuth.js:81](lib/useAuth.js:81)).

---

## 5) أخطاء Firebase + `mapAuthError`

أخطاء Firebase Auth تأتي بأكواد ثابتة (`auth/wrong-password`, `auth/email-already-in-use`, ...). [lib/authErrors.js:3](lib/authErrors.js:3) يُحوّلها لرسائل قابلة للعرض للمستخدم. تُستخدم في كل صفحات Auth ([app/auth/page.js:345](app/auth/page.js:345)).

---

## أسئلة مفتوحة
- التطبيق يستخدم `onSnapshot` مباشرة من العميل لـ `posts` و`messages` و`groups`. هذا يفترض قواعد Firestore أمنية صحيحة في Console — غير مرئية في المستودع.
