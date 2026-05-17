# APP_INDEX — فهرس الدوال والأزرار ومخطّط Firestore

> الفهرس الرئيسي: **[APP_EXPLAINED.md](APP_EXPLAINED.md)** — العمليات: **[APP_FLOWS.md](APP_FLOWS.md)**.

---

## فهرس الدوال (Function Index)

> مرتّب أبجدياً بحسب اسم الدالة/Hook.

| الدالة                  | الملف:السطر                                                                                  | النوع    | مختصر ما تفعله                                          | تُستدعى من                            |
|-------------------------|----------------------------------------------------------------------------------------------|----------|---------------------------------------------------------|---------------------------------------|
| `api`                   | [lib/apiClient.js:14](lib/apiClient.js:14)                                                   | Helper   | fetch + Bearer + 15s timeout + retry 401/403            | كل صفحات/مكوّنات تستدعي API           |
| `AuthProvider`          | [lib/useAuth.js:12](lib/useAuth.js:12)                                                       | Component| سياق Auth + توجيه تلقائي                                | `app/layout.js`                       |
| `buildGroupDoc`         | [lib/collections.js:~70](lib/collections.js:70)                                              | Builder  | يبني وثيقة group بحقول مطلوبة                           | `/api/groups` POST                    |
| `buildMessageDoc`       | [lib/collections.js:~102](lib/collections.js:102)                                            | Builder  | يبني وثيقة message                                      | `/api/groups/[id]/messages` POST      |
| `buildNotificationDoc`  | [lib/collections.js](lib/collections.js)                                                     | Builder  | يبني وثيقة notification                                 | `serverNotify`                        |
| `buildPostDoc`          | [lib/collections.js:~115](lib/collections.js:115)                                            | Builder  | يبني وثيقة post                                         | `/api/posts` POST                     |
| `buildViewUrl`          | [lib/fileLinks.js:18](lib/fileLinks.js:18)                                                   | Helper   | يبني رابط معاينة (disposition=inline)                    | `MessageAttachment`, viewers          |
| `buildDownloadUrl`      | [lib/fileLinks.js:32](lib/fileLinks.js:32)                                                   | Helper   | يبني رابط تنزيل                                         | resources, downloads                  |
| `convertTimestamps`     | [lib/firebaseAdmin.js:95](lib/firebaseAdmin.js:95)                                           | Helper   | يحوّل Timestamp إلى ISO string                          | `snapToObj`                           |
| `extractMentionedUids`  | [lib/serverNotify.js:58](lib/serverNotify.js:58)                                             | Helper   | يستخرج @mentions من النص                                 | `/api/groups/[id]/messages` POST      |
| `handleApprove`         | [app/admin/page.js:72](app/admin/page.js:72)                                                 | Handler  | يستدعي endpoint الموافقة                                | زر Approve في AdminPendingTable       |
| `handleAuth`            | [app/auth/page.js:90](app/auth/page.js:90)                                                   | Handler  | submit نموذج auth                                       | زر Sign In / Register Now             |
| `handleCreatePost`      | [app/hub/page.js](app/hub/page.js)                                                           | Handler  | إنشاء post                                              | زر Transmit                           |
| `handleFinalize`        | [app/onboarding/page.js](app/onboarding/page.js)                                             | Handler  | حفظ Onboarding النهائي                                  | زر Finish                             |
| `handleLike`            | [app/hub/page.js:194](app/hub/page.js:194)                                                   | Handler  | toggle like                                             | زر القلب                              |
| `handleLogout`          | [app/pending/page.js](app/pending/page.js), [app/admin/page.js:176](app/admin/page.js:176)   | Handler  | signOut                                                 | زر Log out                            |
| `handleReject`          | [app/admin/page.js:86](app/admin/page.js:86)                                                 | Handler  | يستدعي endpoint الرفض                                   | زر Reject                             |
| `handleSendMessage`     | [components/chat/MessageInput.js:66](components/chat/MessageInput.js:66)                     | Handler  | إرسال رسالة (+ رفع ملف)                                 | زر الإرسال                            |
| `isPdf` / `isViewableInBrowser` | [lib/fileLinks.js:46](lib/fileLinks.js:46)                                            | Helper   | تحديد نوع الملف للمعاينة                                | عارضات الملفات                        |
| `jsonError`             | [lib/withAuth.js:17](lib/withAuth.js:17)                                                     | Helper   | response خطأ موحّدة                                     | كل API routes                         |
| `jsonOk`                | [lib/withAuth.js:14](lib/withAuth.js:14)                                                     | Helper   | response نجاح موحّدة                                    | كل API routes                         |
| `listSnap`              | [lib/firebaseAdmin.js:90](lib/firebaseAdmin.js:90)                                           | Helper   | تحويل قائمة snapshots                                   | API routes                            |
| `mapAuthError`          | [lib/authErrors.js:3](lib/authErrors.js:3)                                                   | Helper   | ترجمة أخطاء Firebase                                    | كل catches في auth                    |
| `notify`                | [lib/notify.js:14](lib/notify.js:14)                                                         | Client   | إنشاء إشعار عبر API                                     | client code                           |
| `notifyMany`            | [lib/serverNotify.js:38](lib/serverNotify.js:38)                                             | Server   | إشعارات جماعية (mentions)                                | `/api/groups/[id]/messages` POST      |
| `notifyUser`            | [lib/serverNotify.js:17](lib/serverNotify.js:17)                                             | Server   | إشعار فردي                                               | عدة endpoints                         |
| `refreshIdToken`        | [lib/apiClient.js:84](lib/apiClient.js:84)                                                   | Helper   | force-refresh JWT                                       | `api()` عند 401/403                  |
| `relevanceScore`        | [lib/relevance.js:66](lib/relevance.js:66)                                                   | Pure     | نقاط ملاءمة مجموعة لمستخدم                              | `selectMajorMatched`                  |
| `routeUser` (داخلي)     | [lib/useAuth.js:~98](lib/useAuth.js:98)                                                      | Logic    | يقرر الوجهة حسب status/role/onboarded                   | `AuthProvider`                        |
| `safeJson`              | [lib/withAuth.js:119](lib/withAuth.js:119)                                                   | Helper   | parse JSON بأمان                                         | API routes                            |
| `selectHighFrequency`   | [lib/relevance.js:96](lib/relevance.js:96)                                                   | Pure     | ترشيح بالمجموعات النشطة                                  | Explore "Trending"                    |
| `selectMajorMatched`    | [lib/relevance.js:80](lib/relevance.js:80)                                                   | Pure     | ترشيح بنفس التخصص                                       | Explore "In your field"               |
| `sendMessage` (returned)| [lib/useChat.js:~194](lib/useChat.js:194)                                                    | Function | addDoc + optimistic                                     | MessageInput                          |
| `snapToObj`             | [lib/firebaseAdmin.js:81](lib/firebaseAdmin.js:81)                                           | Helper   | snapshot → object مع ISO timestamps                     | API routes                            |
| `toggleComments`        | [app/hub/page.js:250](app/hub/page.js:250)                                                   | Handler  | فتح/جلب تعليقات post                                    | زر التعليقات                          |
| `upload` (returned)     | [lib/useFileUpload.js:39](lib/useFileUpload.js:39)                                           | Function | POST /api/upload                                        | profile, post, chat                   |
| `uploadAndSend`         | [lib/useFileUpload.js:75](lib/useFileUpload.js:75)                                           | Function | upload ثم إنشاء رسالة                                   | (متاحة)                               |
| `useAllGroups`          | [lib/useAllGroups.js:38](lib/useAllGroups.js:38)                                             | Hook     | snapshot للمجموعات العامة                               | `app/explore/page.js`                 |
| `useApi`                | [lib/useApi.js:25](lib/useApi.js:25)                                                         | Hook     | wrapper لـ `api()`                                      | عدّة صفحات                            |
| `useApiFetch`           | [lib/useApi.js:76](lib/useApi.js:76)                                                         | Hook     | fetch on mount                                          | (متاح)                                |
| `useAuth`               | [lib/useAuth.js:139](lib/useAuth.js:139)                                                     | Hook     | يعيد `{ user, userData, loading }`                      | كل الصفحات الخاصة                     |
| `useChat`               | [lib/useChat.js:44](lib/useChat.js:44)                                                       | Hook     | محرّك دردشة كامل                                         | `app/hub/chat/[id]/page.js`           |
| `useFileUpload`         | [lib/useFileUpload.js:30](lib/useFileUpload.js:30)                                           | Hook     | upload + uploadAndSend                                  | (متاح)                                |
| `useJoinRequests`       | [lib/useJoinRequests.js:6](lib/useJoinRequests.js:6)                                         | Hook     | snapshot لطلبات الانضمام (للقائد)                       | OverseerPanel                         |
| `useMessages`           | [lib/useMessages.js:9](lib/useMessages.js:9)                                                 | Hook     | snapshot رسائل بسيط ⚠️ غير مستخدم                       | —                                     |
| `useMyGroups`           | [lib/useMyGroups.js:28](lib/useMyGroups.js:28)                                               | Hook     | snapshot لمجموعات المستخدم                              | Sidebar/Hub                           |
| `verifyAdmin`           | [lib/verifyAdmin.js:82](lib/verifyAdmin.js:82)                                               | Helper   | تحقّق صلاحية أدمن (claims + Firestore)                  | `withAdmin`                           |
| `verifyAuth`            | [lib/verifyAdmin.js:114](lib/verifyAdmin.js:114)                                             | Helper   | تحقّق مستخدم مصادَق                                     | `withAuth`                            |
| `withAdmin`             | [lib/withAuth.js:99](lib/withAuth.js:99)                                                     | Wrapper  | يلفّ handler ويحمي بـ admin role                        | كل admin endpoints                    |
| `withAuth`              | [lib/withAuth.js:67](lib/withAuth.js:67)                                                     | Wrapper  | يتطلب JWT صالح + user doc                               | كل protected endpoints                |
| `withErrorHandling`     | [lib/withAuth.js:41](lib/withAuth.js:41)                                                     | Wrapper  | timeout 10s + error global                              | داخل withAuth/withAdmin               |
| `withPublic`            | [lib/withAuth.js:112](lib/withAuth.js:112)                                                   | Wrapper  | error handling فقط                                      | login, register, upload               |

---

## فهرس الأزرار (UI Actions)

| الزر/النص الظاهر          | الصفحة/المكوّن                                                       | المعالج onClick                   | العملية المرتبطة (FLOWS) |
|---------------------------|----------------------------------------------------------------------|-----------------------------------|--------------------------|
| Theme toggle              | [app/page.js:110](app/page.js:110)                                   | `setTheme()`                      | —                        |
| "Join Us"                 | [app/page.js:119](app/page.js:119)                                   | `router.push("/auth?mode=register")`| 1                      |
| "Sign In" (Landing)       | [app/page.js:127](app/page.js:127)                                   | `router.push("/auth")`            | 2                        |
| "Explore Platform"        | [app/page.js:175](app/page.js:175)                                   | `router.push("/auth")`            | —                        |
| Back to Home              | [app/auth/page.js:135](app/auth/page.js:135)                         | `router.push("/")`                | —                        |
| Sign In / Register tabs   | [app/auth/page.js:180](app/auth/page.js:180)                         | `setMode(tab.key)`                | 1, 2                     |
| Eye (toggle password)     | [app/auth/page.js:209](app/auth/page.js:209)                         | `setShowPwd(!showPwd)`            | —                        |
| ID card upload            | [app/auth/page.js:214](app/auth/page.js:214)                         | `fileRef.current?.click()`        | 1                        |
| "Sign In" / "Register Now"| [app/auth/page.js:222](app/auth/page.js:222)                         | `handleAuth`                      | 1, 2                     |
| "Log out" (Pending)       | [app/pending/page.js:110](app/pending/page.js:110)                   | `signOut(auth)`                   | 3                        |
| اختيار جامعة/تخصص/مستوى    | [app/onboarding/page.js:225](app/onboarding/page.js:225)             | `setModal(...)`                   | 5                        |
| "Continue"                | [app/onboarding/page.js:242](app/onboarding/page.js:242)             | `setStep(2)`                      | 5                        |
| رفع صورة Onboarding       | [app/onboarding/page.js:260](app/onboarding/page.js:260)             | `fileInputRef.current.click()`    | 5                        |
| "Finish"                  | [app/onboarding/page.js:285](app/onboarding/page.js:285)             | `handleFinalize`                  | 5                        |
| "The Hub"                 | [app/onboarding/page.js:313](app/onboarding/page.js:313)             | `window.location.replace("/hub")` | 5                        |
| Paperclip (Hub)           | [app/hub/page.js:382](app/hub/page.js:382)                           | `fileInputRef.current.click()`    | 6                        |
| "Transmit" (post)         | [app/hub/page.js:391](app/hub/page.js:391)                           | `handleCreatePost`                | 6                        |
| ❤️ Like                   | [app/hub/page.js:469](app/hub/page.js:469)                           | `handleLike`                      | 6                        |
| 💬 Comments               | [app/hub/page.js:474](app/hub/page.js:474)                           | `toggleComments`                  | 6                        |
| "Reply" (comment)         | [app/hub/page.js:114](app/hub/page.js:114)                           | `onSubmit` (comment)              | 6                        |
| Sliders (filters)         | [app/explore/page.js:202](app/explore/page.js:202)                   | `setShowFilters(!showFilters)`    | 7                        |
| "Reset" filters           | [app/explore/page.js:264](app/explore/page.js:264)                   | `resetFilters` + `setSearchQuery("")` | 7                    |
| "View All" (major)        | [app/explore/page.js:343](app/explore/page.js:343)                   | `setFilters({major})`             | 7                        |
| Dropdown toggle/option    | [app/explore/page.js:464](app/explore/page.js:464), 517              | `onToggle/onSelect`               | 7                        |
| Back (Chat)               | [app/hub/chat/[id]/page.js:107](app/hub/chat/[id]/page.js:107)       | `router.push(backHref)`           | 8                        |
| إرسال رسالة               | [components/chat/MessageInput.js:66](components/chat/MessageInput.js:66) | `handleSendMessage`           | 8                        |
| Camera (Avatar)           | [app/profile/page.js:463](app/profile/page.js:463)                   | `fileInputRef.current?.click()`   | 11                       |
| "Edit Profile"            | [app/profile/page.js:520](app/profile/page.js:520)                   | `setEditing(true)`                | —                        |
| "Save changes" (Profile)  | [app/profile/page.js:258](app/profile/page.js:258)                   | `handleSave`                      | —                        |
| Tabs (Admin)              | [app/admin/page.js:162](app/admin/page.js:162)                       | `setTab(item.id)`                 | 4, 13                    |
| "Sign Out" (Admin)        | [app/admin/page.js:176](app/admin/page.js:176)                       | `handleLogout`                    | —                        |
| Approve / Reject (per row)| `components/admin/AdminPendingTable.js`                              | `onApprove` / `onReject` props    | 4                        |
| View ID card              | `components/admin/AdminPendingTable.js`                              | `onViewID` prop                   | 4                        |
| Back (Create Group)       | [app/groups/create/page.js:135](app/groups/create/page.js:135)       | `router.back()`                   | —                        |
| Access type toggle        | [app/groups/create/page.js:235](app/groups/create/page.js:235)       | `setForm({accessType})`           | —                        |
| "Initialize Node"         | [app/groups/create/page.js:287](app/groups/create/page.js:287)       | `handleSubmit` → `POST /api/groups`| —                       |
| Bell (Notifications)      | [components/NotificationCenter.js:126](components/NotificationCenter.js:126) | `setIsOpen(!isOpen)`      | 12                       |
| "Mark all as read"        | [components/NotificationCenter.js:175](components/NotificationCenter.js:175) | `markAllRead`             | 12                       |
| Sidebar: The Hub/Explore/Profile | [components/Sidebar.js:80](components/Sidebar.js:80)          | `router.push(...)`                | 12                       |
| Sidebar: + (create group) | `components/Sidebar.js`                                              | `router.push("/groups/create")`   | —                        |

---

## Firestore: المخطّط

> **القاعدة:** أسماء الـ collections من `lib/collectionNames.js`. كل الكتابات الحسّاسة تمرّ بـ admin SDK (API routes).

### Collection: `users`
| الحقل          | النوع       | يكتبه                                   | يقرؤه                                                 |
|----------------|-------------|-----------------------------------------|-------------------------------------------------------|
| uid            | string (DocID) | `/api/register`                       | كل مكان                                               |
| matricule      | string      | `/api/register`                         | `/api/login`, `verifyAdmin`                           |
| fullName       | string      | `/api/register`, `/api/user/profile`    | كل صفحة (display)                                     |
| email          | string      | `/api/register`                         | `/api/login`                                          |
| password (hashed) | —        | Firebase Auth (مش Firestore)            | —                                                     |
| university     | string      | `app/onboarding/page.js:155`            | `/profile`, `/explore`                                |
| major          | string      | `app/onboarding/page.js:155`            | `/profile`, `relevance`                               |
| level          | string      | `app/onboarding/page.js:155`            | `/profile`, `relevance`                               |
| role           | "student" \| "admin" | `/api/register`, admin endpoints | `useAuth`, `verifyAdmin`                              |
| status         | "pending" \| "active" | `/api/register`, approve/reject endpoints | `useAuth.routeUser`                          |
| onboarded      | boolean     | `app/onboarding/page.js:155`            | `useAuth.routeUser`                                   |
| avatarUrl      | string (URL)| `/profile`, Onboarding                  | كل عرض avatar                                          |
| bio            | string      | `/profile`, Onboarding                  | `/profile`                                            |
| socialLinks    | object      | `/profile`                              | `/profile`                                            |
| studentCardUrl | string      | `/api/register`                         | AdminPendingTable                                     |
| groups         | string[] (DocIDs) | `/api/groups` POST (arrayUnion)   | (متاح)                                                 |
| createdAt      | Timestamp   | `/api/register`                         | `app/admin/page.js:50` (orderBy)                      |

**Subscribers via `onSnapshot`:** `useAuth` (uid), `app/admin/page.js` (الكلّ).

---

### Collection: `groups`
| الحقل          | النوع                     | يكتبه                              | يقرؤه                                       |
|----------------|---------------------------|-------------------------------------|---------------------------------------------|
| id             | string (DocID)            | `/api/groups` POST                  | كل مكان                                     |
| name           | string                    | POST / PATCH                        | Sidebar, Explore, Chat                      |
| subject        | string                    | POST / PATCH                        | Explore                                     |
| description    | string                    | POST / PATCH                        | JoinNodeModal, Settings                     |
| leaderId       | string (uid)              | POST                                | Auth checks (PATCH/DELETE)                  |
| members        | string[] (uids)           | POST + join-requests accept         | `useMyGroups`, chat access check            |
| membersList    | `{uid,name,role}[]`       | POST / join-requests accept         | GroupMembers (display)                      |
| accessType     | "open" \| "protected"     | POST                                | JoinNodeModal                               |
| questions      | string[] (للـ protected)   | POST / PATCH                        | JoinNodeModal                               |
| rules          | string                    | POST / PATCH                        | Settings                                    |
| tags           | string[]                  | POST / PATCH                        | Explore, relevance                          |
| maxMembers     | number                    | POST / PATCH                        | join checks                                 |
| isPublic       | boolean                   | POST                                | `useAllGroups` (where)                      |
| status         | "active" \| "archived"    | POST                                | `useMyGroups`, `useAllGroups` (where)       |
| memberCount    | number (denorm)           | POST + accept                       | relevance                                   |
| createdAt      | Timestamp                 | POST                                | orderBy                                     |
| updatedAt      | Timestamp                 | POST / كل message + PATCH           | orderBy (recent activity)                   |

**Subscribers:** `useAllGroups`, `useMyGroups`, `app/hub/chat/[id]/page.js` (واحدة), Sidebar.

---

### Collection: `messages`
| الحقل            | النوع                          | يكتبه                                                          | يقرؤه                          |
|------------------|--------------------------------|----------------------------------------------------------------|--------------------------------|
| groupId          | string                         | `addDoc` (useChat) + `/api/groups/[id]/messages` POST          | `useChat` (where)              |
| authorId         | string (uid)                   | كلاهما                                                          | display                        |
| authorName / senderName / userName | string ⚠️ تباين  | useChat (senderName), API (userName), builder (authorName)     | display                        |
| content / text   | string                         | كلاهما                                                          | display                        |
| fileUrl, fileName, fileType | string             | كلاهما                                                          | MessageAttachment              |
| replyTo          | string (msgId)                 | كلاهما                                                          | MessageList (quote)            |
| moderationStatus | "approved" \| "pending" \| "rejected" | useChat (إذا فيه ملف + ليس قائد)                         | useChat filtering              |
| createdAt        | Timestamp (serverTimestamp)    | كلاهما                                                          | orderBy asc                    |

**Subscribers:** `useChat` (3 listeners: all, pending join requests, pending files).

---

### Collection: `posts`
| الحقل          | النوع                | يكتبه                | يقرؤه                          |
|----------------|----------------------|----------------------|--------------------------------|
| authorId       | string (uid)         | `/api/posts` POST    | display, delete check          |
| authorName     | string               | POST                 | display                        |
| authorRole     | string ⚠️ يُمرَّر `userData.major` بدلاً من role | POST (Hub) | display |
| authorAvatar   | string (URL)         | POST                 | display                        |
| content / text | string               | POST                 | display                        |
| tag            | string               | POST                 | display                        |
| fileUrl, fileName | string            | POST                 | display                        |
| likes          | number / string[]    | `/api/posts/[id]/like`| display                       |
| commentsCount  | number               | يُحدّث عند تعليق     | display                        |
| createdAt      | Timestamp            | POST                 | orderBy desc                   |

**Subscribers:** `app/hub/page.js` (limit 25).

---

### Collection: `notifications`
| الحقل      | النوع     | يكتبه                                 | يقرؤه                          |
|------------|-----------|---------------------------------------|--------------------------------|
| userId     | string    | `serverNotify.notifyUser/notifyMany`  | `NotificationCenter` (where)   |
| title      | string    | server                                 | display                        |
| body       | string    | server                                 | display                        |
| link       | string    | server                                 | onClick → router.push          |
| type       | "review" \| "file_update" \| "new_member" \| "mention" | server | icon mapping  |
| read       | boolean   | `markAllRead` / mark individual        | filtering, count               |
| createdAt  | Timestamp | server                                 | orderBy desc                   |

**Subscribers:** `NotificationCenter` (limit 20 per user).

---

### Collection: `resources`
| الحقل       | النوع     | يكتبه                                      | يقرؤه                          |
|-------------|-----------|--------------------------------------------|--------------------------------|
| groupId     | string    | `/api/groups/[id]/resources` POST          | ResourcesSidebar (where)       |
| uploadedBy  | string    | POST                                       | display + delete check         |
| fileName    | string    | POST                                       | display                        |
| fileUrl     | string    | POST                                       | preview/download               |
| fileType    | string    | POST                                       | icon                           |
| createdAt   | Timestamp | POST                                       | orderBy                        |

**Subscribers:** `ResourcesSidebar` (لكل مجموعة).

---

### Collection: `join-requests` (في الكود قد تكون `joinRequests`)
| الحقل      | النوع     | يكتبه                                                            | يقرؤه                                 |
|------------|-----------|------------------------------------------------------------------|---------------------------------------|
| groupId    | string    | POST من Explore (JoinNodeModal)                                  | `useJoinRequests`, useChat            |
| userId     | string    | POST                                                              | display                               |
| answers    | object    | POST                                                              | display للقائد                        |
| status     | "pending" \| "approved" \| "rejected" | POST + PATCH                            | `useJoinRequests` (where pending)     |
| createdAt  | Timestamp | POST                                                              | orderBy                               |

**Subscribers:** `useJoinRequests`, `useChat` (للقادة).

---

## نقاط مهمة عن المخطّط

1. **Denormalization مقصودة:** `members[]` في groups + `groups[]` في users لتسريع الاستعلامات `array-contains`.
2. **Real-time مكثّف:** بعض الصفحات تشغّل 3+ `onSnapshot` معاً (مثلاً chat للقائد). كل listener = quota Firestore.
3. **Indexes مركّبة محتملة:** `useAllGroups` يستخدم `where("isPublic","==",true) + orderBy("createdAt","desc")` → يحتاج index. الكود يلتقط `failed-precondition` ويسجّله.
4. **Server-side timestamps:** كل الـ `createdAt`/`updatedAt` تُكتب بـ `serverTimestamp()` لمنع الـ clock drift.
5. **Soft delete مفقود:** الحذف فعلي (batch delete في group). لا يوجد `deletedAt`.

---

## ملاحظات وتناقضات لاحظتها (Audit)

| التناقض | الموقع | الأثر | اقتراح |
|---------|--------|------|--------|
| `useMessages` غير مستخدم | `lib/useMessages.js` | كود ميت | احذف |
| `storage` (Firebase Storage) مُصدَّر وغير مستخدم | `lib/firebase.js:44` | bundle أكبر | احذف |
| تباين أسماء حقل المرسِل: `authorName` / `senderName` / `userName` | messages | صعوبة قراءة + خطر display خاطئ | وحّد إلى `authorName` |
| `authorRole` يُمرَّر `userData.major` بدلاً من `userData.role` في hub post | `app/hub/page.js:~220` | معلومة خاطئة في الفيد | صحّح |
| ضبط `customClaims` مكرَّر (verifyAdmin auto-sync + approve endpoint) | lib + admin endpoints | كتابات مكرّرة | اختر مكاناً واحداً |
| `lib/i18n/config.js` لا يزال موجوداً رغم أن CLAUDE.md يقول محذوف | lib | تشتيت | تأكد لا أحد يستورده، ثم احذف |
| Admin page بدون pagination | `app/admin/page.js` | بطء مع نموّ البيانات | أضف pagination/lazy load |
| كتابة messages من Client و Server | useChat vs /api/groups/[id]/messages | تشتيت في قواعد الأمان | وحّد عبر API فقط |

---

**انتهى. لتفاصيل أعمق عن أي عملية، راجع [APP_FLOWS.md](APP_FLOWS.md).**
