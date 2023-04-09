interface SenseItem {
  value: string
  label: string
}

interface TimelineItem {
  children: string
}

interface YearItem {
  value: string
  label: string
}

interface IpcRendererResponse<T> {
  code: number
  msg?: string
  data?: {
    keywordUrl?: string
    panelId: number
    list: T[]
  }
}