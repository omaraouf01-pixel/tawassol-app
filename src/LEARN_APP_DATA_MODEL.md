# LEARN_APP_DATA_MODEL — نموذج بيانات Firestore

> مأخوذ من [lib/collectionNames.js](lib/collectionNames.js) + builders في [lib/collections.js](lib/collections.js) + الاستعلامات الفعلية.

---

## قائمة Collections

| Collection | المصدر |
|---|---|
| `users` | `COL.USERS` |
| `groups` | `COL.GROUPS` |
| `messages` | `COL.MESSAGES` |
| `posts` | `COL.POSTS` |
| `notifications` | `COL.NOTIFICATIONS` |
| `resources` | `COL.RESOURCES` |
| `join-requests` | `COL.JOIN_REQUESTS` |

> **ملاحظة:** التعليقات على المنشورات (comments) موجودة كـ **subcollection** تحت `posts/{id}/comments` (تتبع `/api/posts/[id]/comments`).

---

## `users/{uid}`

من [lib/collections.js:38](lib/collections.js:38) (`buildUserDoc`) و [app/api/register/route.js:103](app/api/register/route.js:103):

| الحقل | النوع | ملاحظات |
|---|---|---|
| `uid` | string | = doc ID |
| `email` | string | lowercased |
| `fullName` | string | |
| `matricule` | string | lowercased (للبحث) |
| `studentCardUrl` | string \| null | Cloudinary |
| `role` | "student" \| "admin" | افتراضي student |
| `status` | "pending" \| "active" \| "rejected" | افتراضي pending |
| `onboarded` | boolean | افتراضي false |
| `groups` | string[] | IDs of joined groups |
| `university`, `department`, `major`, `level`, `bio` | string \| null | |
| `avatarUrl` | string \| null | Cloudinary |
| `socialLinks` | `{github, linkedin, portfolio}` | اختياري (يُكتب من Profile) |
| `createdAt`, `updatedAt` | Timestamp | serverTimestamp |

**يكتبها:**
- `/api/register` (إنشاء)
- `/api/auth/google-register` (إنشاء OAuth)
- `/api/user/profile` PATCH (تحديث)
- `/api/admin/users/[uid]/approve` (status, claims)
- `/onboarding` page (updateDoc مباشر من العميل)
- `/profile` page (avatarUrl مباشر)

**يقرأها:**
- العميل: `useAuth` (`onSnapshot`)، `/admin` (`onSnapshot orderBy createdAt`).
- السيرفر: كل `withAuth` route يقرأها بـ `getUserByUid`.

---

## `groups/{id}`

من [lib/collections.js:65](lib/collections.js:65):

| الحقل | النوع | ملاحظات |
|---|---|---|
| `name`, `subject`, `description`, `rules` | string | |
| `tags` | string[] | للبحث/الفلترة |
| `accessType` | "open" \| "protected" | |
| `questions` | string[] | فارغ إذا open |
| `maxMembers` | number | 2..200 |
| `leaderId` | string | uid القائد |
| `leaderName` | string | |
| `members` | string[] | uids (يُستخدم في `array-contains`) |
| `membersList` | `{uid, name, role}[]` | لـ mentions/UI |
| `memberCount` | number | كاش |
| `status` | "active" \| ... | |
| `isPublic` | boolean | |
| `createdAt`, `updatedAt` | Timestamp | |

**يكتبها:**
- `/api/groups` POST (إنشاء).
- `/api/groups/[id]/join-requests` (arrayUnion عند open أو بعد الموافقة).
- `/api/groups/[id]/members/[uid]` DELETE (arrayRemove).
- `/api/groups/[id]` PATCH.

**يقرأها:**
- العميل: `useAllGroups`, `useMyGroups`, `Sidebar`, `/explore`, `/hub` (myGroups), `/hub/chat/[id]`.

---

## `messages/{id}`

من [lib/collections.js:94](lib/collections.js:94) و [lib/useChat.js:194](lib/useChat.js:194):

| الحقل | النوع | ملاحظات |
|---|---|---|
| `groupId` | string | للاستعلام `where("groupId", "==", X)` |
| `uid` / `authorId` / `senderId` | string | (الكود يستخدم `uid` من useChat و`authorId` من builder — تنبيه: عدم اتساق) |
| `authorName` / `senderName` | string | |
| `authorAvatar` | string \| null | |
| `text` / `content` | string | (عدم اتساق مماثل) |
| `fileUrl`, `fileName`, `fileType`, `fileSize` | اختياري | |
| `imageUrl` | اختياري | |
| `moderationStatus` | "approved" \| "pending" | افتراضي approved؛ pending للملفات من غير القائد |
| `replyTo` | string \| null | id رسالة |
| `createdAt` | Timestamp | |

**يكتبها:**
- العميل عبر `addDoc` في [lib/useChat.js:194](lib/useChat.js:194).
- السيرفر عبر `POST /api/groups/[id]/messages` (بديل API كامل مع mentions).

**يقرأها:**
- العميل عبر `onSnapshot(messages WHERE groupId == X ORDER BY createdAt ASC)`.

---

## `posts/{id}` + `posts/{id}/comments/{id}`

من [app/hub/page.js:219](app/hub/page.js:219):

| الحقل | النوع |
|---|---|
| `content` | string |
| `authorId, authorName, authorRole, authorAvatar` | string |
| `fileUrl, fileName` | اختياري |
| `likes` | string[] (uids) — أو number قديماً |
| `commentsCount` | number |
| `createdAt` | Timestamp |

**comments subcollection:** `{content, authorId, authorName, authorAvatar, authorRole, createdAt}`.

**يكتبها:** `addDoc(posts)` من /hub، `/api/posts/[id]/like` (toggle uid في array)، `/api/posts/[id]/comments`.

---

## `notifications/{id}`

من [lib/collections.js:136](lib/collections.js:136):

| الحقل | النوع |
|---|---|
| `userId` | string (recipient) |
| `title`, `body` | string |
| `link` | string \| null |
| `type` | "review" \| "file_update" \| "new_member" \| "mention" \| "generic" |
| `read` | boolean (افتراضي false) |
| `createdAt` | Timestamp |

**يكتبها:** السيرفر فقط عبر [lib/serverNotify.js](lib/serverNotify.js).
**يقرأها:** [components/NotificationCenter.js:88](components/NotificationCenter.js:88) — `onSnapshot WHERE userId == uid ORDER BY createdAt DESC LIMIT 20`.

---

## `resources/{id}`

من [lib/collections.js:151](lib/collections.js:151):

| الحقل | النوع |
|---|---|
| `groupId` | string |
| `name` | string (≤ 200) |
| `url` | string (Cloudinary) |
| `uid` / `uploadedBy` | string |
| `uploader` | string (display name) |
| `status` | "pending" \| "approved" \| "rejected" |
| `createdAt` | Timestamp |

**يكتبها:** `POST /api/groups/[id]/resources`.
**يقرأها:** `ResourcesSidebar`, `/profile` (count via `getCountFromServer`).

---

## `join-requests/{id}`

من [lib/collections.js:173](lib/collections.js:173):

| الحقل | النوع |
|---|---|
| `groupId`, `groupName` | string |
| `userId`, `userName`, `matricule` | string |
| `answers` | string[] |
| `status` | "pending" \| "approved" \| "rejected" |
| `createdAt` | Timestamp |

**يكتبها:** `POST /api/groups/[id]/join-requests`.
**يقرأها:** `useChat` للقادة، `/api/user/pending-requests` للمستخدم.

---

## مخطط العلاقات

```
                  ┌──────────────────────┐
                  │      users/{uid}     │
                  │  - role              │
                  │  - status            │
                  │  - groups: [id…]     │◄────────────┐
                  └──────────┬───────────┘             │
                             │ leader/member            │
                             ▼                          │
            ┌────────────────────────────────┐          │
            │         groups/{id}            │          │
            │  - leaderId ───────────────────┼──────────┘
            │  - members: [uid…]             │
            │  - membersList: [{uid,name}…]  │
            └───┬────────┬────────┬──────────┘
                │        │        │
                │        │        └──────► resources/{id} (groupId)
                │        │
                │        └──► join-requests/{id} (groupId, userId)
                │
                ▼
        messages/{id} (groupId, uid)


   posts/{id} (authorId)
     └── comments/{id} (subcollection)


   notifications/{id} (userId, link → /hub/chat/{groupId})
```

---

## ملاحظات عدم الاتساق (يجب توثيقها)

- في `messages` يوجد خلط بين `uid` / `authorId` / `senderId` و`text` / `content`. [lib/useChat.js](lib/useChat.js) يكتب `uid` و`content`، بينما [lib/collections.js:buildMessageDoc](lib/collections.js:94) يستخدم `authorId` و`text`. الكود الحالي يقبل الاثنين لكن هذا مصدر هشاشة.
- `resources.uid` vs `resources.uploadedBy` — [app/profile/page.js:340](app/profile/page.js:340) يستعلم بـ `uploadedBy` بينما builder يستخدم `uid`. هذا يفسّر لماذا `resourcesCount` قد يكون 0 دائماً.

---

## أسئلة مفتوحة

- لا يوجد `firestore.rules` في الـ repo. القواعد الفعلية في Firebase Console — غير قابلة للمراجعة من هنا.
- لا توجد indexes معرّفة محلياً؛ Firebase تطلبها تلقائياً عند الاستعلام الأول (مثل `where + orderBy`).
