// Only run once per page load
function getVideoInfo() {
  const url = window.location.href;
  const title =
    document
      .querySelector(
        "h1.ytd-watch-metadata yt-formatted-string, h1.style-scope.ytd-watch-metadata",
      )
      ?.textContent?.trim() || document.title.replace(" - YouTube", "").trim();

  // Handle both regular and Shorts URLs
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  const regularMatch = new URLSearchParams(window.location.search).get("v");
  const videoId = shortsMatch ? shortsMatch[1] : regularMatch;

  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "";
  const cleanUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
  return { url: cleanUrl, title, thumbnail, videoId };
}

let collected = false;

function createCollectButton() {
  const btn = document.createElement("button");
  btn.id = "ivory-collect-btn";
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
    <span>Collect</span>
  `;
  btn.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 50px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(79,70,229,0.35);
    transition: all 0.2s ease;
    letter-spacing: 0.02em;
  `;

  btn.onmouseenter = () => {
    if (!collected) btn.style.background = "#6366f1";
    btn.style.transform = "scale(1.04)";
  };
  btn.onmouseleave = () => {
    btn.style.background = collected ? "#16a34a" : "#4f46e5";
    btn.style.transform = "scale(1)";
  };

  return btn;
}

function injectButton() {
  collected = false;
  const existing = document.getElementById("ivory-collect-btn");
  if (existing) existing.remove();

  const btn = createCollectButton();
  document.body.appendChild(btn);

  // Hide button when video goes fullscreen, show again when exiting
  document.addEventListener("fullscreenchange", () => {
    const b = document.getElementById("ivory-collect-btn");
    if (b) b.style.display = document.fullscreenElement ? "none" : "flex";
  });

  btn.addEventListener("click", () => {
    if (collected) return;

    const info = getVideoInfo();
    if (!info.videoId) {
      btn.querySelector("span").textContent = "Not a video";
      setTimeout(() => {
        btn.querySelector("span").textContent = "Collect";
      }, 2000);
      return;
    }

    // Guard against invalidated extension context
    try {
      if (!chrome?.runtime?.id) {
        console.warn("Extension context invalidated — reload the page.");
        btn.querySelector("span").textContent = "Reload page";
        return;
      }

      chrome.runtime.sendMessage(
        { type: "COLLECT_VIDEO", payload: info },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn(
              "sendMessage error:",
              chrome.runtime.lastError.message,
            );
            // Still show success if the message was sent — background may have handled it
          }
        },
      );

      // Visual feedback
      collected = true;
      btn.style.background = "#16a34a";
      btn.querySelector("span").textContent = "✓ Collected!";
      btn.style.pointerEvents = "none";

      setTimeout(() => {
        btn.querySelector("span").textContent = "Collect";
        btn.style.background = "#4f46e5";
        btn.style.pointerEvents = "auto";
        collected = false;
      }, 3000);
    } catch (e) {
      console.warn("Collect error:", e.message);
      btn.querySelector("span").textContent = "Reload page ↺";
      btn.style.background = "#ef4444";
      setTimeout(() => {
        btn.querySelector("span").textContent = "Collect";
        btn.style.background = "#4f46e5";
      }, 3000);
    }
  });
}

// Inject on load if on a watch or shorts page
if (location.href.includes("/watch") || location.href.includes("/shorts/")) {
  injectButton();
}

// YouTube is a SPA — re-inject when navigating between videos
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (
      location.href.includes("/watch") ||
      location.href.includes("/shorts/")
    ) {
      setTimeout(injectButton, 1500);
    } else {
      const btn = document.getElementById("ivory-collect-btn");
      if (btn) btn.remove();
    }
  }
}).observe(document.body, { subtree: true, childList: true });
