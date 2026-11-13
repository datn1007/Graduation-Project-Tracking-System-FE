import { useCallback, useEffect, useRef, useState } from 'react'

// Runs an async loader and tracks { data, error, loading }. `reload()` re-runs it.
// Results from stale calls (deps changed or unmounted) are ignored.
export function useAsync(loader, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, loading: immediate })
  const callId = useRef(0)

  // `deps` is the caller's dependency list for `loader`, like useEffect.
  const run = useCallback(loader, deps)

  const reload = useCallback(async () => {
    const id = ++callId.current
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await run()
      if (id === callId.current) setState({ data, error: null, loading: false })
      return data
    } catch (error) {
      if (id === callId.current) setState((prev) => ({ ...prev, error, loading: false }))
      return undefined
    }
  }, [run])

  useEffect(() => {
    if (immediate) reload()
    return () => {
      callId.current++
    }
  }, [reload, immediate])

  const setData = useCallback((updater) => {
    setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater }))
  }, [])

  return { ...state, reload, setData }
}
