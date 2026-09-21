// ==========================================================================
// Firebase Configuration & Initialization
// Replace the placeholder values below with your Firebase Web App credentials.
// You can get these credentials in 1 click from your Firebase Console:
// Project Settings -> General -> Your Apps -> Web App -> SDK Setup/Config
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};

// Check if credentials are configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";

let app = null;
let db = null;
let auth = null;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("🟢 Firebase initialized successfully.");
    } catch (err) {
        console.warn("⚠️ Firebase init warning:", err.message);
    }
} else {
    console.log("ℹ️ Running in Local Demo Mode (Configure firebase-config.js to sync live Cloud Firestore).");
}

export { 
    isFirebaseConfigured,
    db, 
    auth, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
};
