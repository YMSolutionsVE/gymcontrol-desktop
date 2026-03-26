const { contextBridge, shell, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  appVersion: ipcRenderer.sendSync('get-app-version'),
  openExternal: function (url) {
    return shell.openExternal(url)
  },

  /* Auto-update API */
  checkForUpdates: function () {
    return ipcRenderer.invoke('check-for-updates')
  },
  downloadUpdate: function () {
    return ipcRenderer.invoke('download-update')
  },
  installUpdate: function () {
    return ipcRenderer.invoke('install-update')
  },
  onUpdateEvent: function (callback) {
    var handler = function (_event, payload) {
      callback(payload)
    }
    ipcRenderer.on('auto-update-event', handler)
    return function () {
      ipcRenderer.removeListener('auto-update-event', handler)
    }
  }
})