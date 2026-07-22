import { usePollingCount } from './usePollingCount'

export function useClientCount(): number {
  return usePollingCount('/clients?limit=1')
}
