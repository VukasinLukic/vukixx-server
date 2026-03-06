import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initFirebase() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    console.error('FIREBASE_SERVICE_ACCOUNT env var is not set!');
    console.error('Set it to the full JSON content of your Firebase service account key.');
    process.exit(1);
  }

  let serviceAccount: ServiceAccount;
  try {
    const parsed = JSON.parse(serviceAccountJson);
    // Fix private key: env vars often escape \n as literal characters
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    serviceAccount = parsed;
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON!');
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
  });

  return getFirestore(app);
}

export const db = initFirebase();
