import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function fixPrivateKey(key: string): string {
  // If key doesn't contain actual newlines but has literal \n, fix them
  if (!key.includes('\n') || key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  return key;
}

function initFirebase() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    console.error('FIREBASE_SERVICE_ACCOUNT env var is not set!');
    process.exit(1);
  }

  // Debug: log first 50 chars to see format (safe, no secrets)
  console.log('FIREBASE_SERVICE_ACCOUNT starts with:', serviceAccountJson.substring(0, 50));
  console.log('FIREBASE_SERVICE_ACCOUNT length:', serviceAccountJson.length);

  let serviceAccount: ServiceAccount;
  try {
    const parsed = JSON.parse(serviceAccountJson);

    if (parsed.private_key) {
      console.log('private_key length before fix:', parsed.private_key.length);
      console.log('private_key starts with:', parsed.private_key.substring(0, 30));
      console.log('contains literal backslash-n:', parsed.private_key.includes('\\n'));
      console.log('contains real newline:', parsed.private_key.includes('\n'));

      parsed.private_key = fixPrivateKey(parsed.private_key);

      console.log('private_key length after fix:', parsed.private_key.length);
    }

    serviceAccount = parsed;
  } catch (e) {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON!');
    console.error('Parse error:', e);
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
  });

  return getFirestore(app);
}

export const db = initFirebase();
