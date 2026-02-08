import admin from 'firebase-admin';

const firebaseProjectID = process.env.FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!firebaseProjectID || !firebaseClientEmail || !firebasePrivateKey) {
  console.error('Firebase environment variables are missing');
} else {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseProjectID,
      clientEmail: firebaseClientEmail,
      privateKey: firebasePrivateKey,
    }),
  });
  console.log('Firebase Admin initialized');
}

export default admin;
