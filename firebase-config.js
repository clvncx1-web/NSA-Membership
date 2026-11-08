// ==========================================================================
// Firebase Cloud Firestore & Realtime Sync Engine for Netball South Africa
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    writeBatch,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Static / Default Config:
// Replace these values or simply paste them in the "Online Cloud Database" settings popup in the app!
const defaultFirebaseConfig = {
  apiKey: "AIzaSyDTA5Lgqt0b3yMkNeNNRMBHtut16R7fvoM",
  authDomain: "nsa-membership-v.firebaseapp.com",
  projectId: "nsa-membership-v",
  storageBucket: "nsa-membership-v.firebasestorage.app",
  messagingSenderId: "750108273531",
  appId: "1:750108273531:web:ee326d7c1f18cb47426bde",
  measurementId: "G-MHEWH13F77"
};

let app = null;
let db = null;
let unsubscribeSnapshot = null;
let isConfigured = false;

// Resolve config: Custom UI input takes priority, then default config
function getActiveConfig() {
    try {
        const custom = localStorage.getItem("nsa_firebase_custom_config");
        if (custom) {
            const parsed = JSON.parse(custom);
            if (parsed.apiKey && parsed.apiKey !== "YOUR_FIREBASE_API_KEY" && parsed.projectId) {
                return parsed;
            }
        }
    } catch(e) {}

    if (defaultFirebaseConfig.apiKey && defaultFirebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
        return defaultFirebaseConfig;
    }
    return null;
}

// Initialize Firebase
function initFirebase() {
    const config = getActiveConfig();
    if (!config) {
        isConfigured = false;
        db = null;
        app = null;
        notifyStatus(false);
        return false;
    }

    try {
        app = initializeApp(config);
        db = getFirestore(app);
        isConfigured = true;
        console.log("🟢 [CloudDB] Connected to Google Cloud Firestore successfully! Project:", config.projectId);
        notifyStatus(true, config.projectId);
        return true;
    } catch (err) {
        console.warn("⚠️ [CloudDB] Connection error:", err.message);
        isConfigured = false;
        notifyStatus(false);
        return false;
    }
}

function notifyStatus(connected, projectId = "") {
    window.dispatchEvent(new CustomEvent("cloud-db-status", {
        detail: { connected, projectId }
    }));
}

// Cloud Database API exposed to the application
window.CloudDB = {
    isConnected: () => isConfigured && db !== null,
    
    getActiveConfig: () => getActiveConfig(),

    saveConfig: async (config) => {
        try {
            if (!config.authDomain && config.projectId) {
                config.authDomain = `${config.projectId}.firebaseapp.com`;
            }
            if (!config.storageBucket && config.projectId) {
                config.storageBucket = `${config.projectId}.appspot.com`;
            }
            localStorage.setItem("nsa_firebase_custom_config", JSON.stringify(config));
            const success = initFirebase();
            if (success) {
                // Trigger reload of data
                const members = await window.CloudDB.loadMembers();
                if (members && window.onCloudDataLoaded) {
                    window.onCloudDataLoaded(members);
                }
            }
            return success;
        } catch (err) {
            console.error("Failed to save config:", err);
            return false;
        }
    },

    disconnect: () => {
        localStorage.removeItem("nsa_firebase_custom_config");
        if (unsubscribeSnapshot) {
            try { unsubscribeSnapshot(); } catch(e) {}
            unsubscribeSnapshot = null;
        }
        app = null;
        db = null;
        isConfigured = false;
        notifyStatus(false);
    },

    loadMembers: async () => {
        if (!isConfigured || !db) return null;
        try {
            const querySnapshot = await getDocs(collection(db, "members"));
            const list = [];
            querySnapshot.forEach((docSnap) => {
                list.push(docSnap.data());
            });
            console.log(`📥 [CloudDB] Fetched ${list.length} members from Cloud Firestore.`);
            return list;
        } catch (err) {
            console.error("❌ [CloudDB] Error loading members from Firestore:", err);
            return null;
        }
    },

    saveMember: async (member) => {
        if (!isConfigured || !db) return false;
        try {
            await setDoc(doc(db, "members", member.id), member);
            console.log("☁️ [CloudDB] Saved member:", member.id);
            return true;
        } catch (err) {
            console.error("❌ [CloudDB] Failed to save member to cloud:", err);
            return false;
        }
    },

    deleteMember: async (memberId) => {
        if (!isConfigured || !db) return false;
        try {
            await deleteDoc(doc(db, "members", memberId));
            console.log("☁️ [CloudDB] Deleted member:", memberId);
            return true;
        } catch (err) {
            console.error("❌ [CloudDB] Failed to delete member from cloud:", err);
            return false;
        }
    },

    batchUpload: async (membersList, onProgress = null) => {
        if (!isConfigured || !db) return false;
        try {
            // Firestore batches allow max 500 operations per batch
            const CHUNK_SIZE = 400;
            const total = membersList.length;
            let processed = 0;

            for (let i = 0; i < total; i += CHUNK_SIZE) {
                const chunk = membersList.slice(i, i + CHUNK_SIZE);
                const batch = writeBatch(db);

                chunk.forEach(m => {
                    const docRef = doc(db, "members", m.id);
                    batch.set(docRef, m);
                });

                await batch.commit();
                processed += chunk.length;
                if (onProgress) onProgress(processed, total);
            }

            console.log(`☁️ [CloudDB] Successfully batch uploaded ${total} records to Cloud Firestore.`);
            return true;
        } catch (err) {
            console.error("❌ [CloudDB] Batch upload failed:", err);
            return false;
        }
    },

    // Listen for real-time remote updates
    startRealtimeSync: (callback) => {
        if (!isConfigured || !db) return;
        if (unsubscribeSnapshot) unsubscribeSnapshot();

        try {
            unsubscribeSnapshot = onSnapshot(collection(db, "members"), (snapshot) => {
                const list = [];
                snapshot.forEach(docSnap => list.push(docSnap.data()));
                if (callback) callback(list);
            }, (err) => {
                console.warn("⚠️ [CloudDB] Realtime listener error:", err.message);
            });
        } catch (err) {
            console.warn("⚠️ [CloudDB] Realtime listener exception:", err);
        }
    }
};

// Auto-run initialization on load
initFirebase();
