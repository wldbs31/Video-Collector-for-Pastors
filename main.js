require("dotenv").config();
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

const { autoUpdater } = require("electron-updater");

// Add this inside app.whenReady().then(createWindow) — after createWindow():
app.whenReady().then(() => {
  createWindow();

  // Check for updates 3 seconds after launch (give window time to load)
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 3000);
});

// Tell autoUpdater where your GitHub releases are
autoUpdater.setFeedURL({
  provider: "github",
  owner: "wldbs31",
  repo: "Video-Collector-for-Pastors",
  private: false,
});

autoUpdater.on("update-available", () => {
  mainWindow.webContents.send("update-available");
});

autoUpdater.on("update-downloaded", () => {
  mainWindow.webContents.send("update-downloaded");
});

let mainWindow;

function createWindow() {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  process.env.FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
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
}

// Let user pick a download destination folder
ipcMain.handle("choose-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Choose Download Destination",
  });
  return result.canceled ? null : result.filePaths[0];
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Load .env in development, use process.env in production (injected at build time)
if (!app.isPackaged) {
  require("dotenv").config();
}

// Auto-updater events
ipcMain.on("restart-to-update", () => {
  autoUpdater.quitAndInstall();
});
