const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function startBackend() {
  // Cek apakah aplikasi sedang jalan sebagai .exe atau mode dev
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js')
    : path.join(__dirname, '../backend/server.js');

  const cwd = app.isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '../backend');

  // Gunakan process.execPath agar backend jalan menggunakan Node internal Electron
  backendProcess = spawn(process.execPath, [backendPath], {
    cwd,
    env: { 
      ELECTRON_RUN_AS_NODE: '1',
      ...process.env 
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    webPreferences: { contextIsolation: true },
    title: 'Penjualan Ayam',
  });

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  if (app.isPackaged) {
    // Load file hasil build Vite
    win.loadFile(path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(() => {
  // CSP: longgar di dev (Vite butuh unsafe-inline), ketat di production
  const isDev = !app.isPackaged;
 
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "connect-src 'self' http://localhost:3001 ws://localhost:5173; " +
          "img-src 'self' data:; " +
          "font-src 'self' data:;"
        ]
      : [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' http://localhost:3001; " +
          "img-src 'self' data:; " +
          "font-src 'self' data:;"
        ];
 
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': csp
      }
    });
  });

  startBackend();
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});