import axios from 'axios'
import { useUpgradeModal } from '@/store/upgrade-modal'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor global: 402 → abre modal de upgrade automaticamente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 402) {
      const { error, feature, upgradeRequired } = err.response.data
      useUpgradeModal.getState().openModal({
        message: error ?? 'Esta feature requer upgrade de plano.',
        feature: feature ?? '',
        upgradeRequired: upgradeRequired ?? 'SOLO',
      })
    }
    return Promise.reject(err)
  }
)

export default api
