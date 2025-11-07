const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
      saveFile: (filename, content) =>
    ipcRenderer.invoke("save-file", { filename, content }),

  loadFile: (filename) =>
    ipcRenderer.invoke("load-file", filename),
  checkOnline: () => ipcRenderer.invoke("check-online"),
});
