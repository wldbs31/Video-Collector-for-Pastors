require("dotenv").config();
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

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
