import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';
import winston from 'winston';

// Basic logger for config initialization
const configLogger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Check if Firebase is already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      readFileSync(join(__dirname, '../../sky-bell-firebase.json'), 'utf-8'),
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    configLogger.info('🔥 Firebase Admin initialized successfully');
  } catch (error) {
    configLogger.error('❌ Firebase initialization failed: ' + (error as Error).message);
    throw error;
  }
}

export const firebaseAdmin = admin;
