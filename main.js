const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

// Load .env in development; packaged builds get their config from src/env.js
if (!app.isPackaged) {
  require("dotenv").config();
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
    },
    titleBarStyle: "hiddenInset",
    title: "The Video Collector",
  });

  mainWindow.loadFile("src/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── Auto-updater ───────────────────────────────────────
// Feed URL comes from app-update.yml (generated from the publish config),
// but set it explicitly as well so a stale yml can't break updates.
autoUpdater.setFeedURL({
  provider: "github",
  owner: "wldbs31",
  repo: "Video-Collector-for-Pastors",
  private: false,
});

autoUpdater.on("update-available", () => {
  if (mainWindow) mainWindow.webContents.send("update-available");
});

autoUpdater.on("update-downloaded", () => {
  if (mainWindow) mainWindow.webContents.send("update-downloaded");
});

autoUpdater.on("error", (err) => {
  console.error("Auto-updater error:", err?.message || err);
});

ipcMain.on("restart-to-update", () => {
  autoUpdater.quitAndInstall();
});

// ─── IPC ────────────────────────────────────────────────
ipcMain.handle("get-app-version", () => app.getVersion());

// Let user pick a download destination folder
ipcMain.handle("choose-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Choose Download Destination",
  });
  return result.canceled ? null : result.filePaths[0];
});

// ─── App lifecycle ──────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // Update checks only make sense in the packaged app (dev has no app-update.yml)
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((e) => {
        console.error("Update check failed:", e?.message || e);
      });
    }, 3000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
