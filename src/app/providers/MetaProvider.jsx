import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MetaContext } from './contexts'
import { getConfig, getEnums } from '../../features/auth/auth.service'

// Loads GET /meta/enums and GET /meta/config once at start-up (both public).
// If the Backend is unreachable the app still renders; labels fall back to the raw enum value.
export const MetaProvider = ({ children }) => {
  const [state, setState] = useState({ enums: {}, config: null, loading: true, error: null })

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const [enums, config] = await Promise.all([getEnums(), getConfig()])
      setState({ enums, config, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error }))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const value = useMemo(() => {
    const options = (enumName) => state.enums?.[enumName] || []
    const label = (enumName, value) => options(enumName).find((o) => o.value === value)?.label || value || '—'
    return { ...state, reload: load, options, label }
  }, [state, load])

  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>
}
