import admin from "firebase-admin";

// إعدادات السيرفر تستخدم متغيرات البيئة السرية (بدون NEXT_PUBLIC)
const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // التعامل مع المفتاح الخاص (التعامل مع الرموز السطرية الجديدة \n)
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("[Firebase Admin] ✅ Initialized");
    } catch (error) {
        console.error("[Firebase Admin] ❌ Error:", error);
    }
}

const db = admin.firestore();
const adminAuth = admin.auth();

export { db, adminAuth };