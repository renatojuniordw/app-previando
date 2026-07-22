import { create } from 'zustand'

interface UpgradeModalState {
  open: boolean
  message: string
  feature: string
  upgradeRequired: string
  openModal: (params: { message: string; feature: string; upgradeRequired: string }) => void
  closeModal: () => void
}

export const useUpgradeModal = create<UpgradeModalState>((set) => ({
  open: false,
  message: '',
  feature: '',
  upgradeRequired: 'SOLO',
  openModal: ({ message, feature, upgradeRequired }) =>
    set({ open: true, message, feature, upgradeRequired }),
  closeModal: () => set({ open: false, message: '', feature: '', upgradeRequired: 'SOLO' }),
}))
