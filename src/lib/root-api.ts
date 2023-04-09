import { ipcRenderer } from 'electron'
import { channelConst } from '../const'

interface senseQuery {
  panelId: string,
  keyword: string
}

export const querySenseByKeyword = (data: senseQuery) => ipcRenderer.send(channelConst.QUERY_SENSE_BY_KEYWORD, data)

interface timelineQuery {
  panelId: string,
  pageUrl: string
}

export const queryTimeline = (data: timelineQuery) => ipcRenderer.send(channelConst.QUERY_TIMELINE, data)