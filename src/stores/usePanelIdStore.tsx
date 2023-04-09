import create from 'zustand'

export interface PanelIdStore {
  panelIdList: string[]
  setPanelIdList: (data: string[]) => void
}

export const usePanelIdStore = create<PanelIdStore>((set, get) => (
  {
    panelIdList: [],
    setPanelIdList: (panelIdList: string[]) => {
      set({ panelIdList })
    },
  }
))