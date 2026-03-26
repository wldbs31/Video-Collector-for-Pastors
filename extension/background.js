import {
  initializeApp,
  getApps,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── PASTE YOUR FIREBASE CONFIG HERE ──
const firebaseConfig = {
  apiKey: "AIzaSyDfna05mBke0GGbkH9kUKpsr71QyNyTSx0",
  authDomain: "yt-downloader-fa9df.firebaseapp.com",
  projectId: "yt-downloader-fa9df",
  storageBucket: "yt-downloader-fa9df.firebasestorage.app",
  messagingSenderId: "1085797530596",
  appId: "1:1085797530596:web:0f32d3e3225cee027325f1",
};
// ─────────────────────────────────────

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "COLLECT_VIDEO") return;
  const { url, title, thumbnail } = message.payload;

  addDoc(collection(db, "videos"), {
    url,
    title,
    thumbnail,
    tags: [],
    transcript: "",
    format: "mp4",
    quality: "1080p",
    downloadPath: "",
    downloaded: false,
    collectedAt: Timestamp.fromDate(new Date()),
  })
    .then(() => {
      console.log("Collected:", title);
    })
    .catch((e) => {
      console.error("Firebase error:", e);
    });

  return true;
});
