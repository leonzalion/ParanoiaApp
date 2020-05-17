'use strict';

import {app, protocol, BrowserWindow, ipcMain} from 'electron'
import path from 'path';
import dateFormat from 'dateformat';
import screenshot from 'screenshot-desktop';
import io from 'socket.io-client';
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib';
import Jimp from 'jimp';
import fs from 'fs';

const socket = io('https://paranoia-app.herokuapp.com/');
const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

async function takeScreenshot() {
  const filedir = path.join(
    app.getPath('appData'),
    'screenshots'
  );
  fs.mkdirSync(filedir, {recursive: true});

  const displays = await screenshot.listDisplays();
  const base64Screenshots = [];

  for (const display of displays) {
    const filename = path.join(filedir, `${dateFormat(new Date(), "iosUtcDateTime")}${display.id}.png`);
    await screenshot({ screen: display.id, filename });
    const image = await Jimp.read(filename);
    image.resize(100, Jimp.AUTO);
    const base64 = await image.getBase64Async(Jimp.MIME_JPEG);
    base64Screenshots.push(base64);
  }

  socket.emit('tookScreenshot', 'leonzalion', base64Screenshots);
  win.webContents.send('tookScreenshot', base64Screenshots);
  return base64Screenshots;
}

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });
  socket.emit('connectUser', 'leonzalion');

  socket.on('takeScreenshot', async () => {
    return takeScreenshot();
  });

  ipcMain.handle('takeScreenshot', async () => {
    return takeScreenshot();
  });

  ipcMain.handle('lockSchedule', function (event, schedules) {
    socket.emit('setSchedules', 'leonzalion', schedules);
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools({mode: 'detach'})
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }


  win.on('closed', () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createWindow();
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    })
  }
}
