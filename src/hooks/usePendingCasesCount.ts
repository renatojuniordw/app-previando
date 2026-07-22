import { usePollingCount } from './usePollingCount'

export function usePendingCasesCount(): number {
  return usePollingCount('/cases?limit=1')
}
