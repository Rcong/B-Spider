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
    index: number
    list: T[]
  }
}

interface CardItem {
  isLoading: boolean
  senseList: SenseItem[]
  timeline: TimelineItem[]
}

interface CardList {
  cardList: CardItem[]
  setCardList: (list: CardItem[]) => void
}