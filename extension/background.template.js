import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, Timestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── PASTE YOUR FIREBASE CONFIG HERE ──
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// ─────────────────────────────────────

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Find the most recently active user UID
async function getActiveUid() {
  try {
    const q = query(collection(db, "activeUsers"), orderBy("lastSeen", "desc"), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data().uid;
  } catch(e) {
    console.warn("Could not get active user:", e);
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'COLLECT_VIDEO') return;
  const { url, title, thumbnail } = message.payload;

  // Get the active user then write to their collection
  getActiveUid().then(uid => {
    if (!uid) {
      console.warn("No active user found — open the desktop app and sign in first.");
      sendResponse({ success: false, error: "No active user" });
      return;
    }

    addDoc(collection(db, 'users', uid, 'videos'), {
      url,
      title,
      thumbnail,
      tags: [],
      transcript: '',
      format: 'mp4',
      quality: '1080p',
      downloadPath: '',
      downloaded: false,
      collectedAt: Timestamp.fromDate(new Date()),
    }).then(() => {
      console.log('Collected for user', uid, ':', title);
      sendResponse({ success: true });
    }).catch(e => {
      console.error('Firebase error:', e);
      sendResponse({ success: false, error: e.message });
    });
  });

  return true; // keep message channel open for async response
});
