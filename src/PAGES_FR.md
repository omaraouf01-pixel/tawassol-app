# Pages de l'Application — Tawassol

---

## 1. Page d'accueil — `/`

Page d'entrée intelligente qui redirige automatiquement l'utilisateur selon son état (admin, en attente, onboarding ou hub). Les visiteurs non connectés voient une interface de bienvenue avec les boutons de connexion et d'inscription.

*صورة صفحة الرئيسية*

---

## 2. Authentification — `/auth`

Formulaire unifié pour la connexion et l'inscription, avec support de l'e-mail, Google, GitHub et téléphone (OTP). L'utilisateur est redirigé automatiquement après une authentification réussie.

*صورة صفحة المصادقة*

---

## 3. En attente d'approbation — `/pending`

Page affichée après l'inscription en attendant la validation du compte par un administrateur. Elle informe l'utilisateur de l'état de son dossier et propose un bouton de déconnexion.

*صورة صفحة الانتظار*

---

## 4. Configuration initiale — `/onboarding`

Formulaire multi-étapes affiché une seule fois après la première approbation. L'utilisateur y renseigne son université, sa spécialité, son niveau et sa photo de profil avant d'accéder au hub.

*صورة صفحة الإعداد الأولي*

---

## 5. Hub principal — `/hub`

Page centrale de la plateforme affichant le fil des publications des groupes. L'utilisateur peut créer des posts, commenter, liker et partager des fichiers en temps réel.

*صورة صفحة الهاب*

---

## 6. Salle de discussion — `/hub/chat/[id]`

Chat en temps réel propre à chaque groupe académique. L'accès est réservé aux membres, leaders et admins. La page inclut une liste de messages, les membres actifs et les ressources partagées.

*صورة صفحة الدردشة*

---

## 7. Exploration — `/explore`

Page de découverte des groupes publics avec recherche et filtres (université, spécialité, niveau). Des recommandations personnalisées sont affichées selon le profil de l'utilisateur.

*صورة صفحة الاستكشاف*

---

## 8. Rejoindre un groupe — `/groups/join`

Liste tous les groupes publics disponibles que l'utilisateur n'a pas encore rejoints. Permet de rechercher, filtrer et envoyer une demande d'adhésion. Un bouton redirige vers la création d'un nouveau groupe.

*صورة صفحة الانضمام*

---

## 9. Créer un groupe — `/groups/create`

Formulaire pour créer un nouveau groupe académique (Node) avec nom, spécialité, université, niveau et type d'accès (ouvert ou protégé). Une fois créé, l'utilisateur est redirigé vers la salle de discussion du groupe.

*صورة صفحة إنشاء المجموعة*

---

## 10. Profil personnel — `/profile`

Affiche les informations académiques et les statistiques de l'utilisateur (groupes, ressources). Permet de modifier le nom, la photo, la bio et les liens GitHub/LinkedIn.

*صورة صفحة الملف الشخصي*

---

## 11. Tableau de bord administrateur — `/admin`

Page réservée aux administrateurs avec trois onglets : comptes en attente de validation, liste des utilisateurs actifs, et gestion des groupes. Inclut une barre de recherche et un affichage de la carte d'identité.

*صورة صفحة لوحة التحكم*
