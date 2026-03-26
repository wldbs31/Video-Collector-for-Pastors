// ── PASTE YOUR FIREBASE CONFIG HERE ──────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDfna05mBke0GGbkH9kUKpsr71QyNyTSx0",
  authDomain: "yt-downloader-fa9df.firebaseapp.com",
  projectId: "yt-downloader-fa9df",
  storageBucket: "yt-downloader-fa9df.firebasestorage.app",
  messagingSenderId: "1085797530596",
  appId: "1:1085797530596:web:0f32d3e3225cee027325f1",
};
// ─────────────────────────────────────────────────────

let db;

function initFirebaseCompat() {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK not loaded");
    return false;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  return true;
}

function addVideo(url, title, thumbnail = "") {
  if (!db) initFirebaseCompat();
  return db.collection("videos").add({
    url,
    title,
    thumbnail,
    tags: [],
    transcript: "",
    format: "mp4",
    quality: "1080p",
    downloadPath: "",
    downloaded: false,
    collectedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function watchVideos(callback) {
  if (!db) initFirebaseCompat();
  return db
    .collection("videos")
    .orderBy("collectedAt", "desc")
    .onSnapshot((snapshot) => {
      const videos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(videos);
    });
}

function updateVideo(id, data) {
  if (!db) initFirebaseCompat();
  return db.collection("videos").doc(id).update(data);
}
