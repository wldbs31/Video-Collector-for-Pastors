const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDfna05mBke0GGbkH9kUKpsr71QyNyTSx0",
  authDomain: "yt-downloader-fa9df.firebaseapp.com",
  projectId: "yt-downloader-fa9df",
  storageBucket: "yt-downloader-fa9df.firebasestorage.app",
  messagingSenderId: "1085797530596",
  appId: "1:1085797530596:web:0f32d3e3225cee027325f1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    // Write a test document
    console.log("Writing test document...");
    const docRef = await addDoc(collection(db, "videos"), {
      url: "https://youtube.com/watch?v=test123",
      title: "Test Video",
      downloaded: false,
      collectedAt: new Date(),
    });
    console.log("✅ Write successful! Document ID:", docRef.id);

    // Read it back
    console.log("Reading documents...");
    const snapshot = await getDocs(collection(db, "videos"));
    snapshot.forEach((doc) => {
      console.log("✅ Read successful!", doc.id, "→", doc.data().title);
    });

    console.log("\n🎉 Firebase is connected and working!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Firebase error:", err.message);
    process.exit(1);
  }
}

test();
