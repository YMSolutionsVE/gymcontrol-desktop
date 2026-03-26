const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater')

const isDev = !app.isPackaged

let mainWindow = null

/* ------------------------------------------------------------------ */
/*  Version handler (sync para preload)                                */
/* ------------------------------------------------------------------ */

ipcMain.on('get-app-version', function (event) {
  event.returnValue = app.getVersion()
})

/* ------------------------------------------------------------------ */
/*  Auto-updater config                                                */
/* ------------------------------------------------------------------ */

function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.autoRunAppAfterInstall = true

  if (isDev) {
    autoUpdater.forceDevUpdateConfig = false
    return
  }

  autoUpdater.logger = {
    info: function () {},
    warn: function () {},
    error: function () {},
    debug: function () {}
  }

  autoUpdater.on('checking-for-update', function () {
    sendUpdateEvent('checking', {})
  })

  autoUpdater.on('update-available', function (info) {
    sendUpdateEvent('available', {
      version: info.version || '',
      releaseDate: info.releaseDate || '',
      releaseNotes: parseReleaseNotes(info.releaseNotes)
    })
  })

  autoUpdater.on('update-not-available', function () {
    sendUpdateEvent('not-available', {})
  })

  autoUpdater.on('download-progress', function (progress) {
    sendUpdateEvent('progress', {
      percent: Math.round(progress.percent || 0),
      transferred: progress.transferred || 0,
      total: progress.total || 0,
      bytesPerSecond: progress.bytesPerSecond || 0
    })
  })

  autoUpdater.on('update-downloaded', function (info) {
    sendUpdateEvent('downloaded', {
      version: info.version || ''
    })
  })

  autoUpdater.on('error', function (err) {
    sendUpdateEvent('error', {
      message: err ? err.message || String(err) : 'Error desconocido'
    })
  })
}

function sendUpdateEvent(status, data) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  try {
    mainWindow.webContents.send('auto-update-event', {
      status: status,
      data: data
    })
  } catch (_e) {
    /* window closed during send — ignore */
  }
}

function parseReleaseNotes(notes) {
  if (!notes) return []
  if (typeof notes === 'string') {
    return notes
      .split('\n')
      .map(function (line) { return line.replace(/^[\s*-]+/, '').trim() })
      .filter(function (line) { return line.length > 0 })
  }
  if (Array.isArray(notes)) {
    return notes.map(function (n) { return n.note || String(n) })
  }
  return []
}

/* ------------------------------------------------------------------ */
/*  IPC handlers                                                       */
/* ------------------------------------------------------------------ */

function setupIPC() {
  ipcMain.handle('check-for-updates', function () {
    if (isDev) {
      return { status: 'dev', message: 'Auto-update deshabilitado en desarrollo' }
    }
    autoUpdater.checkForUpdates()
    return { status: 'checking' }
  })

  ipcMain.handle('download-update', function () {
    if (isDev) {
      return { status: 'dev' }
    }
    autoUpdater.downloadUpdate()
    return { status: 'downloading' }
  })

  ipcMain.handle('install-update', function () {
    if (isDev) {
      return { status: 'dev' }
    }
    setImmediate(function () {
      autoUpdater.quitAndInstall(false, true)
    })
    return { status: 'installing' }
  })
}

/* ------------------------------------------------------------------ */
/*  Window                                                             */
/* ------------------------------------------------------------------ */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: 'GymControl',
    icon: path.join(__dirname, '..', 'public', 'icon.ico'),
    backgroundColor: '#0B0F1A',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.setMenuBarVisibility(false)

  mainWindow.once('ready-to-show', function () {
    mainWindow.show()
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

/* ------------------------------------------------------------------ */
/*  App lifecycle                                                      */
/* ------------------------------------------------------------------ */

app.whenReady().then(function () {
  setupIPC()
  setupAutoUpdater()
  createWindow()

  if (!isDev) {
    setTimeout(function () {
      autoUpdater.checkForUpdates()
    }, 8000)
  }
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})