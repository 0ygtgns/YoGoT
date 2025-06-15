const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Path for storing bookmarks
const bookmarksPath = path.join(app.getPath('userData'), 'bookmarks.json');

function readBookmarks() {
    try {
        if (fs.existsSync(bookmarksPath)) {
            const data = fs.readFileSync(bookmarksPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading bookmarks:', error);
    }
    return []; // Return empty array if file doesn't exist or is corrupted
}

function writeBookmarks(bookmarks) {
    try {
        fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks, null, 2));
    } catch (error) {
        console.error('Error writing bookmarks:', error);
    }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "Yogot Browser",
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      webviewTag: true,
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
}

// IPC Listeners
ipcMain.on('update-title', (event, title) => {
  if(mainWindow) mainWindow.setTitle(title);
});

// Bookmarks IPC
ipcMain.handle('get-bookmarks', () => readBookmarks());
ipcMain.on('add-bookmark', (event, bookmark) => {
    const bookmarks = readBookmarks();
    // Prevent duplicates
    if (!bookmarks.some(b => b.url === bookmark.url)) {
        bookmarks.push(bookmark);
        writeBookmarks(bookmarks);
    }
});
ipcMain.on('remove-bookmark', (event, url) => {
    let bookmarks = readBookmarks();
    bookmarks = bookmarks.filter(b => b.url !== url);
    writeBookmarks(bookmarks);
});

// YENİ: Get App Version IPC
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});


// Context Menu IPC
ipcMain.on('show-context-menu', (event) => {
    const template = [
        { label: 'Back', click: () => event.sender.send('context-menu-command', 'back') },
        { label: 'Forward', click: () => event.sender.send('context-menu-command', 'forward') },
        { label: 'Reload', click: () => event.sender.send('context-menu-command', 'reload') },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { type: 'separator' },
        { 
            label: 'Inspect Element', 
            click: () => event.sender.send('context-menu-command', 'inspect') 
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup(BrowserWindow.fromWebContents(event.sender));
});


app.whenReady().then(createWindow);

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
