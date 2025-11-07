
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import fs from "fs";

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(app.getAppPath(), "dist/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(app.getAppPath(), "dist/index.html"));

});

//Save file
ipcMain.handle("save-file", async (event, { filename, content }) => {
    try {
    const filePath = path.join(app.getAppPath(), filename);
    fs.writeFileSync(filePath, content, "utf8");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message};
  }
});

//Load file
ipcMain.handle("load-file", async (filename) => {
  try {
    const filePath = path.join(app.getAppPath(), filename);
    const data = fs.readFileSync(filePath, "utf8");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("check-online", async () => {
  try {
    const res = await fetch("https://www.google.com", { method: "HEAD", timeout: 3000 });
    return res.ok;
  } catch {
    return false;
  }
});



