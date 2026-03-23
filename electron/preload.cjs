const { contextBridge, shell } = require('electron')
const packageJson = require('../package.json')

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  appVersion: packageJson.version,
  openExternal: (url) => shell.openExternal(url),
})
