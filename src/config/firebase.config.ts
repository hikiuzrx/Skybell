import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if Firebase is already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      readFileSync(join(__dirname, '../../sky-bell-firebase.json'), 'utf-8'),
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('🔥 Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

export const firebaseAdmin = admin;
