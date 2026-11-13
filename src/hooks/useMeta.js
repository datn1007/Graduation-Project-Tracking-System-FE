import { useContext } from 'react'
import { MetaContext } from '../app/providers/contexts'

// { enums, config, label(enumName, value), options(enumName), loading, error, reload }
export function useMeta() {
  const context = useContext(MetaContext)
  if (!context) throw new Error('useMeta must be used inside <MetaProvider>')
  return context
}
