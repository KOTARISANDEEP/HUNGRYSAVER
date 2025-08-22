import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

let db = null;
let initialized = false;

// Try to read service account from local file if available
const loadServiceAccount = () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const keyPath = path.resolve(__dirname, '../../serviceAccountKey.json');
    if (fs.existsSync(keyPath)) {
      const json = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      return json;
    }
  } catch (e) {
    // ignore file errors, we'll fallback to env
  }

  // Fallback to env variables
  return {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
  };
};

export const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      const serviceAccount = loadServiceAccount();
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
      });
      logger.info('Firebase Admin initialized');
    }

    db = admin.firestore();
    initialized = true;
    return db;
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

export const getFirestore = () => {
  if (!initialized || !admin.apps.length) {
    initializeFirebase();
  }
  return db || admin.firestore();
};

export const getAuth = () => {
  if (!initialized || !admin.apps.length) initializeFirebase();
  return admin.auth();
};

export const getMessaging = () => {
  if (!initialized || !admin.apps.length) initializeFirebase();
  return admin.messaging();
};

export default admin;