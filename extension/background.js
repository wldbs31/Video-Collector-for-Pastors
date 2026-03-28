// background.js — uses Firebase REST API directly (no SDK imports needed)

// ── PASTE YOUR FIREBASE CONFIG HERE ──
const FIREBASE_API_KEY = "AIzaSyDfna05mBke0GGbkH9kUKpsr71QyNyTSx0";
const FIREBASE_PROJECT_ID = "yt-downloader-fa9df";
// ─────────────────────────────────────

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Get the most recently active user UID from Firestore
async function getActiveUid() {
  try {
    const url = `${FIRESTORE_URL}/activeUsers?pageSize=10`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.documents?.length) {
      console.warn("No active users found. Sign in to the desktop app first.");
      return null;
    }

    // Find most recently active user
    let latest = null;
    let latestTime = "";
    for (const doc of data.documents) {
      const lastSeen = doc.fields?.lastSeen?.stringValue || "";
      if (lastSeen > latestTime) {
        latestTime = lastSeen;
        latest = doc.fields?.uid?.stringValue;
      }
    }
    return latest;
  } catch (e) {
    console.error("getActiveUid error:", e);
    return null;
  }
}

// Add a video to the user's collection via Firestore REST API
async function collectVideo(uid, videoData) {
  const url = `${FIRESTORE_URL}/users/${uid}/videos`;
  const now = new Date().toISOString();

  const body = {
    fields: {
      url: { stringValue: videoData.url },
      title: { stringValue: videoData.title },
      thumbnail: { stringValue: videoData.thumbnail },
      tags: { arrayValue: { values: [] } },
      transcript: { stringValue: "" },
      format: { stringValue: "mp4" },
      quality: { stringValue: "1080p" },
      downloadPath: { stringValue: "" },
      downloaded: { booleanValue: false },
      collectedAt: { timestampValue: now },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await res.json();
  if (result.error) throw new Error(result.error.message);
  return result;
}

// Listen for messages from content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "COLLECT_VIDEO") return;

  const { url, title, thumbnail } = message.payload;
  console.log("Collecting:", title);

  getActiveUid().then((uid) => {
    if (!uid) {
      console.warn("No active user — open the desktop app and sign in first.");
      sendResponse({ success: false, error: "Not signed in to desktop app" });
      return;
    }

    collectVideo(uid, { url, title, thumbnail })
      .then(() => {
        console.log("✓ Collected for user", uid, ":", title);
        sendResponse({ success: true });
      })
      .catch((e) => {
        console.error("Collect error:", e.message);
        sendResponse({ success: false, error: e.message });
      });
  });

  return true; // keep channel open for async response
});
