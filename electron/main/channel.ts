import { ipcMain } from 'electron'
import { channelConst } from './const';
import { getPageUrl, getPageContent, getSenseList, getTimeline } from './service';


export function updateChannel() {

  ipcMain.on(channelConst.QUERY_DETAIL_BY_KEYWORD, async (event, { panelId, keyword: searchKey }) => {
    try {
      let response: any = await getPageUrl({ searchKey });
      if (response.code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_KEYWORD_DETAIL}_${panelId}`, { code: 0, msg: response.msg });
        return
      }
      
      if (!response || !response.data) {
        event.reply(`${channelConst.MAIN_PROCESS_KEYWORD_DETAIL}_${panelId}`, { code: 0, msg: '查询失败' });
        return
      }

      if (!response.data.body || !response.data.body.wapUrl) {
        event.reply(`${channelConst.MAIN_PROCESS_KEYWORD_DETAIL}_${panelId}`, { code: 0, msg: '查询失败，没有链接' });
        return
      }

      let pageUrl = response.data.body.wapUrl;
      let { code, data, msg }: any = await getPageContent({ pageUrl })

      if (code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_KEYWORD_DETAIL}_${panelId}`, { code: 0, msg });
        return
      }

      const res: any = await getSenseList({ content: data, pageUrl })
      if (res.code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_KEYWORD_DETAIL}_${panelId}`, { code: 0, msg: res.msg });
        return
      }

      event.reply(`${channelConst.MAIN_PROCESS_KEYWORD_DETAIL}_${panelId}`, { code: 200, data: { panelId, keywordUrl: pageUrl, list: res.data } });
    } catch (error) {
      event.reply(`${channelConst.MAIN_PROCESS_KEYWORD_DETAIL}_${panelId}`, { code: 0, msg: error.msg });
    }
  })

  ipcMain.on(channelConst.QUERY_TIMELINE, async (event, { panelId, pageUrl }) => {
    try {
      let { code, data, msg }: any = await getPageContent({ pageUrl })

      if (code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 0, msg });
        return
      }

      const res: any = await getTimeline({ content: data })
      if (res.code === 0) {
        event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 0, msg: res.msg });
        return
      } 

      event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 200, data: { panelId, list: res.data } });
    } catch (error) {
      event.reply(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, { code: 0, msg: error.msg });
    }
  })
}