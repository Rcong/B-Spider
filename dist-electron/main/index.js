"use strict";
const electron = require("electron");
const node_os = require("node:os");
const node_path = require("node:path");
const request = require("superagent");
const cheerio = require("cheerio");
const electronUpdater = require("electron-updater");
const channelConst = {
  QUERY_SENSE_BY_KEYWORD: "query-sense-by-keyword",
  MAIN_PROCESS_SENSE_LIST: "main-process-sense-list",
  QUERY_TIMELINE: "query-timeline",
  MAIN_PROCESS_TIMELINE: "main-process-timeline"
};
async function getPageUrl({ searchKey }) {
  try {
    const key = encodeURIComponent(searchKey);
    const response = await request.post(`https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?appid=379020&bk_key=${key}`);
    return { code: 200, data: response };
  } catch (error) {
    return { code: 0, msg: error.msg };
  }
}
function getPageContent({ pageUrl }) {
  return new Promise((resolve, reject) => {
    request.post(pageUrl).set("sec-ch-ua", 'Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111').set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36").end((err, res) => {
      if (err) {
        return reject({ code: 0, data: err });
      }
      resolve({ code: 200, data: res.text });
    });
  });
}
function getSenseList({ content, pageUrl }) {
  try {
    const $ = cheerio.load(content);
    const senseList = [];
    $("#J-polysemant-content li a").each(function(index, element) {
      var $element = $(element);
      senseList.push({ label: $element.html(), value: index === 0 ? pageUrl : `http:${$element.attr("data-href")}` });
    });
    return { code: 200, data: senseList };
  } catch (error) {
    return { code: 0, msg: error.msg };
  }
}
function getTimeline({ content }) {
  try {
    const $ = cheerio.load(content);
    const timeline = [];
    $('h2[data-title="人物履历"] ~ .para:not(h2[data-title="人物履历"] ~ .BK-content-margin ~ .para)').each(function(i, element) {
      var $element = $(element);
      const textList = $element.text().split("\n");
      const filterTextList = textList.filter((text) => !!text);
      timeline.push({ children: filterTextList[0] });
    });
    return { code: 200, data: timeline };
  } catch (error) {
    return { code: 0, msg: error.msg };
  }
}
function updateChannel() {
  electron.ipcMain.on(channelConst.QUERY_SENSE_BY_KEYWORD, async (event, { panelId, keyword: searchKey }) => {
    try {
      let response = await getPageUrl({ searchKey });
      if (response.code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, { code: 0, msg: response.msg });
        return;
      }
      if (!response || !response.data) {
        event.reply(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, { code: 0, msg: "查询失败" });
        return;
      }
      if (!response.data.body || !response.data.body.wapUrl) {
        event.reply(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, { code: 0, msg: "查询失败，没有链接" });
        return;
      }
      let pageUrl = response.data.body.wapUrl;
      let { code, data, msg } = await getPageContent({ pageUrl });
      if (code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, { code: 0, msg });
        return;
      }
      const res = await getSenseList({ content: data, pageUrl });
      if (res.code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, { code: 0, msg: res.msg });
        return;
      }
      event.reply(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, { code: 200, data: { panelId, list: res.data } });
    } catch (error) {
      event.reply(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, { code: 0, msg: error.msg });
    }
  });
  electron.ipcMain.on(channelConst.QUERY_TIMELINE, async (event, { panelId, pageUrl }) => {
    try {
      let { code, data, msg } = await getPageContent({ pageUrl });
      if (code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 0, msg });
        return;
      }
      const res = await getTimeline({ content: data });
      if (res.code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 0, msg: res.msg });
        return;
      }
      event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 200, data: { panelId, list: res.data } });
    } catch (error) {
      event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 0, msg: error.msg });
    }
  });
}
function update(win2) {
  electronUpdater.autoUpdater.autoDownload = false;
  electronUpdater.autoUpdater.disableWebInstaller = false;
  electronUpdater.autoUpdater.allowDowngrade = false;
  electronUpdater.autoUpdater.on("checking-for-update", function() {
  });
  electronUpdater.autoUpdater.on("update-available", (arg) => {
    win2.webContents.send("update-can-available", { update: true, version: electron.app.getVersion(), newVersion: arg == null ? void 0 : arg.version });
  });
  electronUpdater.autoUpdater.on("update-not-available", (arg) => {
    win2.webContents.send("update-can-available", { update: false, version: electron.app.getVersion(), newVersion: arg == null ? void 0 : arg.version });
  });
  electron.ipcMain.handle("check-update", async () => {
    if (!electron.app.isPackaged) {
      const error = new Error("The update feature is only available after the package.");
      return { message: error.message, error };
    }
    try {
      return await electronUpdater.autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      return { message: "Network error", error };
    }
  });
  electron.ipcMain.handle("start-download", (event) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          event.sender.send("update-error", { message: error.message, error });
        } else {
          event.sender.send("download-progress", progressInfo);
        }
      },
      () => {
        event.sender.send("update-downloaded");
      }
    );
  });
  electron.ipcMain.handle("quit-and-install", () => {
    electronUpdater.autoUpdater.quitAndInstall(false, true);
  });
}
function startDownload(callback, complete) {
  electronUpdater.autoUpdater.on("download-progress", (info) => callback(null, info));
  electronUpdater.autoUpdater.on("error", (error) => callback(error, null));
  electronUpdater.autoUpdater.on("update-downloaded", complete);
  electronUpdater.autoUpdater.downloadUpdate();
}
process.env.DIST_ELECTRON = node_path.join(__dirname, "../");
process.env.DIST = node_path.join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? node_path.join(process.env.DIST_ELECTRON, "../public") : process.env.DIST;
if (node_os.release().startsWith("6.1"))
  electron.app.disableHardwareAcceleration();
if (process.platform === "win32")
  electron.app.setAppUserModelId(electron.app.getName());
if (!electron.app.requestSingleInstanceLock()) {
  electron.app.quit();
  process.exit(0);
}
let win = null;
const preload = node_path.join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = node_path.join(process.env.DIST, "index.html");
async function createWindow() {
  win = new electron.BrowserWindow({
    title: "Main window",
    icon: node_path.join(process.env.PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(url);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", new Date().toLocaleString());
  });
  win.webContents.setWindowOpenHandler(({ url: url2 }) => {
    if (url2.startsWith("https:"))
      electron.shell.openExternal(url2);
    return { action: "deny" };
  });
  updateChannel();
  update(win);
}
electron.app.whenReady().then(createWindow);
electron.app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin")
    electron.app.quit();
});
electron.app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized())
      win.restore();
    win.focus();
  }
});
electron.app.on("activate", () => {
  const allWindows = electron.BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
electron.ipcMain.handle("open-win", async (_, arg) => {
  const childWindow = new electron.BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});
//# sourceMappingURL=index.js.map
