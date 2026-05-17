# APP_FLOWS — العمليات (Flows) في Tawassol

> 15 عملية أساسية. كل عملية: نقطة بداية UI، تسلسل تنفيذ، دوال مشاركة، استدعاءات Firestore/API، حالات الخطأ، مخاطر.
> الفهرس الرئيسي: **[APP_EXPLAINED.md](APP_EXPLAINED.md)**.

---

## العملية 1: التسجيل وإنشاء حساب

- **الوصف:** الطالب يدخل matricule + بياناته + بطاقة الطالب، فيُنشأ حسابه بحالة `pending`.
- **نقطة البداية (UI):** زر "Register Now" في [app/auth/page.js:222](app/auth/page.js:222) (mode=register).
- **التسلسل:**
  1. المستخدم يملأ النموذج ويرفع بطاقة الطالب (file input في السطر 214).
  2. `handleAuth()` يستدعي `POST /api/register` بـ FormData ([app/auth/page.js:96](app/auth/page.js:96)).
  3. السيرفر يتحقّق من uniqueness (email/matricule) في `users`.
  4. يرفع البطاقة لـ Cloudinary (السطر 81).
  5. ينشئ Firebase Auth user (`adminAuth.createUser`، السطر 92).
  6. ينشئ Firestore user doc (السطر 103) بـ `status="pending"`، `onboarded=false`.
  7. عند الفشل بعد إنشاء Auth → Rollback (`adminAuth.deleteUser`، السطور 135–141).
  8. Client يستدعي `signInWithEmailAndPassword` → `useAuth` يكتشف user → يوجّه لـ `/pending`.
- **الدوال المشاركة:**

  | الدالة                | الملف:السطر                                   | المدخلات                     | المخرجات                                          | ماذا تفعل                              |
  |-----------------------|-----------------------------------------------|------------------------------|---------------------------------------------------|----------------------------------------|
  | `handleAuth`          | [app/auth/page.js:90](app/auth/page.js:90)    | event                        | —                                                 | يقرر login أو register ويستدعي API     |
  | `POST handler`        | [app/api/register/route.js:1](app/api/register/route.js:1) | FormData    | `{ ok, uid, studentCardUrl }`                     | ينشئ user كامل                         |
  | `mapAuthError`        | [lib/authErrors.js:3](lib/authErrors.js:3)    | err                          | string عربي                                       | ترجمة أخطاء Firebase                   |

- **استدعاءات Firestore/API:** `POST /api/register`، `POST /api/upload` (داخل السيرفر)، كتابة في `users`.
- **حالات الخطأ:** 400 (بيانات ناقصة)، 409 (مكرّر)، 413 (ملف > 10MB)، 500 (rollback مع حذف Auth).
- **مخاطر:** Race بين إنشاء Auth وإنشاء Firestore doc → محلولة بـ rollback صريح.

---

## العملية 2: تسجيل الدخول + التوجيه التلقائي

- **الوصف:** المستخدم يدخل بـ matricule أو email + كلمة سر، فيُوجَّه تلقائياً للوجهة الصحيحة.
- **نقطة البداية (UI):** زر "Sign In" في [app/auth/page.js:222](app/auth/page.js:222) (mode=login).
- **التسلسل:**
  1. `handleAuth()` يستدعي `POST /api/login` للبحث عن email المقابل للـ matricule ([app/auth/page.js:106](app/auth/page.js:106)).
  2. السيرفر يستعلم `users.where("matricule","==",x)` ثم email كـ fallback.
  3. Client ينفّذ `signInWithEmailAndPassword(auth, email, password)` ([app/auth/page.js:104](app/auth/page.js:104) أو 115).
  4. `onIdTokenChanged` في [lib/useAuth.js:22](lib/useAuth.js:22) يلتقط الـ user.
  5. `getDoc(users/uid)` يجلب وثيقة المستخدم ([lib/useAuth.js:27](lib/useAuth.js:27)).
  6. `onSnapshot` يبدأ بثاً حياً للوثيقة ([lib/useAuth.js:70](lib/useAuth.js:70)).
  7. `routeUser()` يقرّر الوجهة (السطور 98–130):
     - `admin` → `/admin`
     - `pending` → `/pending`
     - `active` + `!onboarded` → `/onboarding`
     - `active` + `onboarded` → `/hub`
- **الدوال المشاركة:**

  | الدالة          | الملف:السطر                                | ماذا تفعل                                          |
  |-----------------|--------------------------------------------|----------------------------------------------------|
  | `AuthProvider`  | [lib/useAuth.js:12](lib/useAuth.js:12)     | يدير الـ user state ويوجّه                         |
  | `useAuth`       | [lib/useAuth.js:139](lib/useAuth.js:139)   | يعطي `{ user, userData, loading }` لأي مكوّن       |
  | `POST handler`  | [app/api/login/route.js:1](app/api/login/route.js:1) | يبحث عن email عبر matricule              |

- **استدعاءات Firestore:** قراءة `users/uid` + `onSnapshot` عليها.
- **حالات الخطأ:** `mapAuthError` للأخطاء، 404 إذا لم يوجد user.
- **مخاطر:** التوجيه يحدث في useEffect → احذر من حلقة لا نهائية لو غيّرت dependencies بسوء.

---

## العملية 3: صفحة Pending

- **الوصف:** المستخدم ينتظر موافقة الأدمن. عند الموافقة يُحوَّل تلقائياً.
- **نقطة البداية (UI):** الوصول التلقائي بعد التسجيل عبر `routeUser` في [lib/useAuth.js:114](lib/useAuth.js:114).
- **التسلسل:**
  1. [app/pending/page.js](app/pending/page.js) يقرأ `userData` من `useAuth`.
  2. مستمع `onSnapshot` في `useAuth` يكتشف تغيّر `status` فوراً.
  3. عند `status="active"` → `routeUser` يوجّه إلى `/onboarding` (إن لم يكن onboarded) أو `/hub`.
  4. زر "Log out" في [app/pending/page.js:110](app/pending/page.js:110) يستدعي `signOut(auth)`.
- **استدعاءات Firestore:** اشتراك حيّ على `users/uid`.
- **حالات الخطأ:** لا شيء خاص — الصفحة عرض فقط.
- **مخاطر:** لا توجد، لكن `useAuth` لا يجب أن يُلغى بدون cleanup.

---

## العملية 4: موافقة/رفض الأدمن

- **الوصف:** الأدمن يرى الطلبات المعلَّقة، يفتح بطاقة الطالب، يوافق أو يرفض.
- **نقطة البداية (UI):** زر "Approve" أو "Reject" في صف من [components/admin/AdminPendingTable.js](components/admin/AdminPendingTable.js).
- **التسلسل:**
  1. [app/admin/page.js:50](app/admin/page.js:50) يستمع `onSnapshot(users, orderBy createdAt desc)`.
  2. الأدمن يفتح تبويب "Verification" → يرى المستخدمين بـ `status="pending"`.
  3. ضغط Approve → `handleApprove(uid)` في [app/admin/page.js:72](app/admin/page.js:72) يستدعي `api("/api/admin/users/[uid]/approve", {method:"POST"})`.
  4. السيرفر (`withAdmin`) يتحقّق من صلاحية الأدمن.
  5. يُحدِّث `users/uid` → `status="active"`.
  6. يضبط `customClaims` (role, admin flag, status).
  7. يستدعي `revokeRefreshTokens(uid)` ليُجبَر المستخدم على إعادة تسجيل الدخول (لتحميل الـ claims الجديدة).
  8. على العميل: `onSnapshot` يكتشف التغيير → يوجّهه `routeUser` إلى `/onboarding`.
- **الدوال المشاركة:**

  | الدالة            | الملف:السطر                                                       | ماذا تفعل              |
  |-------------------|-------------------------------------------------------------------|------------------------|
  | `handleApprove`   | [app/admin/page.js:72](app/admin/page.js:72)                      | يستدعي API + يحدّث UI |
  | `handleReject`    | [app/admin/page.js:86](app/admin/page.js:86)                      | يستدعي reject endpoint|
  | `verifyAdmin`     | [lib/verifyAdmin.js:82](lib/verifyAdmin.js:82)                    | تحقّق صلاحية           |
  | POST approve      | [app/api/admin/users/[uid]/approve/route.js](app/api/admin/users/[uid]/approve/route.js) | تحديث + claims |
  | `withAdmin`       | [lib/withAuth.js:99](lib/withAuth.js:99)                          | wrapper للحماية        |

- **استدعاءات Firestore:** قراءة `users` (snapshot)، تحديث `users/uid`.
- **حالات الخطأ:** 401/403 إذا لم يكن أدمن، 404 إذا لم يوجد user.
- **مخاطر:** `verifyAdmin` ينفّذ auto-sync للـ claims (السطور 99–103) + `approve` يضبطها أيضاً → احتمال كتابة مزدوجة.

---

## العملية 5: Onboarding

- **الوصف:** 3 خطوات: (1) جامعة/تخصص/مستوى، (2) صورة + سيرة، (3) شاشة نجاح.
- **نقطة البداية (UI):** التوجيه التلقائي من `useAuth` عند `active && !onboarded`.
- **التسلسل:**
  1. الخطوة 1: المستخدم يختار من مودالات (`UNIVERSITIES/MAJORS/LEVELS` من `lib/academicData.js`).
  2. ضغط "Continue" ([app/onboarding/page.js:242](app/onboarding/page.js:242)) → `setStep(2)`.
  3. الخطوة 2: المستخدم يرفع صورة + يكتب bio.
  4. ضغط "Finish" ([app/onboarding/page.js:285](app/onboarding/page.js:285)) → `handleFinalize`.
  5. `handleFinalize` يضبط `finalizingRef.current = true` ([app/onboarding/page.js:81](app/onboarding/page.js:81)) **لمنع `routeUser` من التدخّل**.
  6. يرفع الصورة عبر `POST /api/upload` ([app/onboarding/page.js:140](app/onboarding/page.js:140)).
  7. `updateDoc(users/uid, { university, major, level, avatarUrl, bio, onboarded:true })` ([app/onboarding/page.js:155](app/onboarding/page.js:155)).
  8. الخطوة 3: شاشة نجاح. زر "The Hub" ([app/onboarding/page.js:313](app/onboarding/page.js:313)) → `window.location.replace("/hub")` (إعادة تحميل كاملة).
- **استدعاءات Firestore/API:** `POST /api/upload`، `updateDoc(users/uid)`.
- **حالات الخطأ:** فشل الرفع → رسالة + إيقاف، فشل التحديث → log + يبقى المستخدم في الصفحة.
- **مخاطر:** **Race condition**: لو `onSnapshot` التقط `onboarded=true` قبل اكتمال خطوة 3 → `routeUser` يوجّه لـ `/hub` قبل إظهار شاشة النجاح. الحل: `finalizingRef` يمنع التوجيه التلقائي.

---

## العملية 6: Hub (Feed)

- **الوصف:** فيد رئيسي للمنشورات، إنشاء post، like، comments.
- **نقطة البداية (UI):** [app/hub/page.js](app/hub/page.js).
- **التسلسل:**
  1. `onSnapshot(posts, orderBy createdAt desc, limit 25)` يبدأ ([app/hub/page.js:151](app/hub/page.js:151)).
  2. `onSnapshot` آخر للمجموعات يملأ الـ Sidebar ([app/hub/page.js:166](app/hub/page.js:166)).
  3. إنشاء post:
     - حقل نص + خيار رفع ملف (Paperclip في السطر 382).
     - زر "Transmit" ([app/hub/page.js:391](app/hub/page.js:391)) → `handleCreatePost`.
     - يرفع الملف (إن وُجد) عبر `/api/upload`، ثم `POST /api/posts`.
  4. Like: زر القلب ([app/hub/page.js:469](app/hub/page.js:469)) → `handleLike` → `api("/api/posts/{id}/like", POST)`.
  5. Comments: زر فتح ([app/hub/page.js:474](app/hub/page.js:474)) → `toggleComments` → `GET /api/posts/{id}/comments`.
  6. Reply: زر "Reply" ([app/hub/page.js:114](app/hub/page.js:114)) → `POST /api/posts/{id}/comments`.
- **استدعاءات Firestore/API:** `posts` (snapshot)، `/api/posts/*` لـ create/like/comments.
- **حالات الخطأ:** أخطاء API تُعرض inline.
- **مخاطر:** ⚠️ تباين في تسمية حقول post: `authorRole` يُمرَّر كـ `userData.major` (سطر ~220) بدلاً من `userData.role` — راجع.

---

## العملية 7: Explore / Discovery والانضمام لـ Node

- **الوصف:** المستخدم يستكشف المجموعات العامة، يفلتر، ويطلب الانضمام.
- **نقطة البداية (UI):** [app/explore/page.js](app/explore/page.js).
- **التسلسل:**
  1. `useAllGroups()` يبدأ `onSnapshot(groups, isPublic=true, orderBy createdAt desc, limit 30)` ([lib/useAllGroups.js:75](lib/useAllGroups.js:75)).
  2. `api("/api/user/pending-requests")` يجلب IDs المجموعات التي للمستخدم طلب معلَّق فيها ([app/explore/page.js:72](app/explore/page.js:72)).
  3. الفلترة: بحث (name/subject/major) + dropdowns (university/major/level) + استبعاد المجموعات التي هو فيها.
  4. الرفوف الذكية: "In your field" (selectMajorMatched) و "Trending" (selectHighFrequency) من `lib/relevance.js`.
  5. ضغط بطاقة مجموعة → يفتح `JoinNodeModal`:
     - إن كانت `accessType="open"` → الانضمام مباشر.
     - إن كانت `protected` → نموذج إجابة أسئلة → `POST /api/groups/[id]/join-requests`.
  6. القائد يرى الطلب في `OverseerPanel` ويوافق/يرفض.
- **الدوال المشاركة:**

  | الدالة                | الملف:السطر                                          | ماذا تفعل                         |
  |-----------------------|------------------------------------------------------|-----------------------------------|
  | `useAllGroups`        | [lib/useAllGroups.js:38](lib/useAllGroups.js:38)     | snapshot للمجموعات العامة         |
  | `relevanceScore`      | [lib/relevance.js:66](lib/relevance.js:66)           | حساب نقاط ملاءمة                  |
  | `selectMajorMatched`  | [lib/relevance.js:80](lib/relevance.js:80)           | ترشيح بنفس التخصص                 |
  | `JoinNodeModal`       | [components/explore/JoinNodeModal.js](components/explore/JoinNodeModal.js) | نموذج طلب                |

- **استدعاءات Firestore/API:** snapshot على `groups`، `/api/user/pending-requests`, `/api/groups/[id]/join-requests`.
- **حالات الخطأ:** فشل في استعلام Firestore يُسجَّل (السطور 108–126 في `useAllGroups`).
- **مخاطر:** قد يحتاج Firestore index مركّب → الخطأ `failed-precondition` يُلتقط ويُسجَّل.

---

## العملية 8: الدردشة (فتح + إرسال رسالة)

- **الوصف:** فتح محادثة مجموعة، عرض رسائل حية، إرسال نص/ملف.
- **نقطة البداية (UI):** الضغط على مجموعة في Sidebar → `/hub/chat/[id]`.
- **التسلسل:**
  1. [app/hub/chat/[id]/page.js:38](app/hub/chat/[id]/page.js:38): `onSnapshot(groups/id)` يجلب بيانات المجموعة.
  2. فحص الصلاحيات (السطور 49–64): `member || leader || admin` → إن لا، 403.
  3. `useChat({ groupId, user, userData, group })` يبدأ ([lib/useChat.js:44](lib/useChat.js:44)):
     - `onSnapshot` رسائل المجموعة مرتّبة `createdAt asc` ([lib/useChat.js:68](lib/useChat.js:68)).
     - إن كان قائداً/أدمن: `onSnapshot` لطلبات الانضمام المعلَّقة (السطر 120).
     - إن كان قائداً/أدمن: `onSnapshot` للملفات بحالة `moderationStatus="pending"` (السطر 139).
  4. عرض الرسائل: [components/chat/MessageList.js](components/chat/MessageList.js). نفس المؤلف خلال 5 دقائق → `_grouped=true`.
  5. إرسال رسالة:
     - المستخدم يكتب في [components/chat/MessageInput.js](components/chat/MessageInput.js).
     - زر الإرسال ([components/chat/MessageInput.js:66](components/chat/MessageInput.js:66)) → `handleSendMessage`.
     - إن وُجد ملف: يرفع عبر `/api/upload` (السطر 58)، حد أقصى 25MB.
     - يستدعي `sendMessage` من `useChat` ([lib/useChat.js:194](lib/useChat.js:194)) → `addDoc(messages)` مع `optimistic` فوري.
     - إن كان فيه ملف والمستخدم ليس قائداً → `moderationStatus="pending"` (السطور 170–171).
  6. الـ snapshot يحلّ محل الـ optimistic عبر `sentKeys` Map.
- **استدعاءات Firestore:** 1–3 listeners + `addDoc(messages)`.
- **حالات الخطأ:** فشل رفع → رسالة، فشل إرسال → الرسالة تبقى في `optimistic` مع تنبيه.
- **مخاطر:** كثرة `onSnapshot` للقادة (3 مستمعات) → احذر cleanup في unmount.

---

## العملية 9: إدارة المجموعة (GroupSettings)

- **الوصف:** القائد يعدّل اسم/وصف/أسئلة/قواعد المجموعة أو يحذفها.
- **نقطة البداية (UI):** [components/chat/GroupSettings.js](components/chat/GroupSettings.js) من رأس الدردشة.
- **التسلسل:**
  1. القائد يفتح إعدادات المجموعة → نموذج بالحقول الحالية.
  2. تعديل + حفظ → `PATCH /api/groups/[id]` ([app/api/groups/[id]/route.js](app/api/groups/[id]/route.js)).
  3. السيرفر يتحقّق `leaderId === uid`، يحدّث الحقول المسموحة فقط + `updatedAt`.
  4. حذف المجموعة → `DELETE /api/groups/[id]` → batch يحذف: المجموعة + كل messages + كل resources + كل join-requests.
  5. عرض/إخراج الأعضاء عبر `GroupMembers.js` + `MemberListDrawer.js` → `DELETE /api/groups/[id]/members/[uid]`.
- **استدعاءات Firestore:** ضمن API: قراءة `groups/id`، تحديث، batch delete (في حالة الحذف).
- **حالات الخطأ:** 403 لغير القائد، 404 للمجموعة المفقودة.
- **مخاطر:** الحذف batch ضخم — لو فشل جزئياً قد تبقى رسائل يتيمة.

---

## العملية 10: الإشراف (Moderation & Overseer)

- **الوصف:** القائد يعتمد/يرفض الملفات المرفوعة، ويرى الطلبات المعلَّقة في لوحة موحَّدة.
- **نقطة البداية (UI):** [components/chat/OverseerPanel.js](components/chat/OverseerPanel.js) في صفحة الدردشة (للقادة فقط).
- **التسلسل:**
  1. `useChat` يبثّ `pendingFiles` و `joinRequests` للقادة فقط.
  2. القائد يفتح OverseerPanel → يرى:
     - الملفات المعلَّقة (من `ModerationPanel`).
     - طلبات الانضمام المعلَّقة.
  3. اعتماد ملف: `PATCH /api/groups/[id]/messages/[msgId]` → `moderationStatus="approved"`.
  4. رفض/حذف: `DELETE /api/groups/[id]/messages/[msgId]`.
  5. قبول طلب انضمام: `PATCH /api/groups/[id]/join-requests/[reqId]` → يضيف uid لـ `members`.
  6. رفض طلب: PATCH بـ `status="rejected"`.
- **استدعاءات Firestore:** snapshots داخل `useChat` + API mutations.
- **حالات الخطأ:** 403 لغير القائد.
- **مخاطر:** اعتماد رسالة لا يُشعر المرسل حالياً — تحقّق ما إذا كنت تريد إشعاراً.

---

## العملية 11: رفع الملفات (Cloudinary)

- **الوصف:** أي ملف (صورة/PDF) يُرفع عبر `/api/upload`.
- **نقطة البداية (UI):** في عدّة أماكن: Profile (صورة)، Hub (post)، Chat (مرفق)، Onboarding (صورة)، Register (بطاقة).
- **التسلسل:**
  1. Client ينشئ `FormData` ويرفقه + `folder` اختياري.
  2. `POST /api/upload` ([app/api/upload/route.js](app/api/upload/route.js)).
  3. السيرفر يحدّد `resourceType`: `"image"` للصور، `"raw"` للـ PDF/غيرها.
  4. يرفع لـ Cloudinary مع `use_filename` + `unique_filename`.
  5. يعيد `{ url (secure_url), publicId, resourceType }`.
  6. Client يستخدم الـ URL مباشرة (Image) أو يبني view/download URL عبر `lib/fileLinks.js`.
- **استدعاءات API:** `POST /api/upload`، لاحقاً `GET /api/download?url=...` للتنزيل الآمن.
- **حالات الخطأ:** 400 (no file)، 500 (فشل Cloudinary).
- **مخاطر:** لا تحقّق من نوع/حجم الملف على السيرفر بشكل صارم — اعتمد على Client validation.

---

## العملية 12: الإعدادات والـ Sidebar

- **الوصف:** الشريط الجانبي للتنقل + قائمة الإعدادات + الإشعارات.
- **نقطة البداية (UI):** [components/Sidebar.js](components/Sidebar.js) في كل الصفحات الرئيسية.
- **التسلسل:**
  1. Sidebar يستلم `currentUser` + `groups` من الصفحة الأم.
  2. أزرار التنقل: The Hub / Explore / Profile (السطر 80).
  3. قسم "My Communities" (السطر 95): يعرض مجموعات المستخدم + زر `+` لإنشاء.
  4. قسم "System Control" (السطر 147):
     - SettingsMenu (Theme/Logout/...).
     - NotificationCenter (real-time bell).
  5. NotificationCenter: `onSnapshot(notifications, userId=uid, orderBy createdAt desc, limit 20)` ([components/NotificationCenter.js:88](components/NotificationCenter.js:88)).
- **استدعاءات Firestore:** snapshot للإشعارات.
- **حالات الخطأ:** صامتة في NotificationCenter.
- **مخاطر:** كل صفحة بها onSnapshot منفصل للمجموعات → احتمال تكرار قراءات.

---

## العملية 13: إدارة الأدمن للمستخدمين والمجموعات

- **الوصف:** الأدمن يرى كل المستخدمين والمجموعات في 3 تبويبات: تحقق / طلاب / مجموعات.
- **نقطة البداية (UI):** [app/admin/page.js](app/admin/page.js).
- **التسلسل:**
  1. snapshots على `users` و `groups` (مرتّبة بـ `createdAt desc`).
  2. التبويب يفلتر بحسب `status` (pending → AdminPendingTable, active → AdminUsersTable).
  3. AdminUsersTable: عرض + فتح بطاقة (IDCardModal).
  4. AdminGroupsTable: عرض + حذف عبر `/api/admin/groups/[id]`.
  5. بحث موحَّد عبر `searchQuery` يفلتر كل التبويبات (السطور 104–130).
- **استدعاءات Firestore/API:** snapshots + admin endpoints.
- **حالات الخطأ:** أخطاء API تُعرض كـ alerts.
- **مخاطر:** صفحة الأدمن تحمّل **كل** المستخدمين والمجموعات بدون pagination → مشكلة عند الكبر.

---

## العملية 14: معالجة أخطاء Firebase (mapAuthError)

- **الوصف:** كل أخطاء Firebase Auth تترجم لرسائل عربية مفهومة.
- **نقطة البداية:** [lib/authErrors.js:3](lib/authErrors.js:3).
- **التسلسل:**
  1. أي `try/catch` حول `signInWithEmailAndPassword` أو `createUserWithEmailAndPassword`.
  2. الـ catch يستدعي `mapAuthError(err)` → يرجع نص عربي.
  3. النص يُعرض في حالة الصفحة (مثلاً `setError`).
- **الأكواد المغطّاة:** `auth/invalid-credential`, `auth/email-already-in-use`, `auth/weak-password`, `auth/network-request-failed`, ... (السطور 9–34).
- **مخاطر:** أي كود غير مغطّى → يرجع رسالة افتراضية. أضف الكود الجديد عند ظهوره.

---

## العملية 15: ثوابت أسماء الـ Collections

- **الوصف:** `COL.*` ثوابت لمنع typos.
- **الملف:** [lib/collectionNames.js:8](lib/collectionNames.js:8).
- **الاستخدام:**
  ```js
  import { COL } from "@/lib/collectionNames";
  collection(firestore, COL.USERS)
  ```
- **القائمة:** `USERS`, `GROUPS`, `MESSAGES`, `POSTS`, `NOTIFICATIONS`, `RESOURCES`, `JOIN_REQUESTS`.
- **مهم:** `lib/collections.js` (server-only) يستورد `COL` ويبني refs للـ admin SDK.
- **قاعدة:** لا تكتب "users" كنصّ مباشر في أي مكان — استخدم `COL.USERS`.

---

## ملاحظات عابرة على تداخل العمليات

- **مَن يكتب في `users`؟** فقط: `/api/register`، `/api/user/profile` (PATCH)، `/api/user/setup`، endpoints الأدمن (approve/reject)، و `app/onboarding/page.js` مباشرةً (updateDoc).
- **مَن يكتب في `messages`؟** Client مباشرةً عبر `useChat.sendMessage` (addDoc)، و `/api/groups/[id]/messages` (POST). **تداخل** — يجب توحيد إذا أمكن.
- **مَن يكتب في `groups`؟** فقط API routes: `/api/groups` (POST/PATCH/DELETE).
