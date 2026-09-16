const path = require('path')
const { app, BrowserWindow, ipcMain } = require('electron/main')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1300,
    height: 845,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile(path.join(__dirname, '..', 'index.html'))
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})  

