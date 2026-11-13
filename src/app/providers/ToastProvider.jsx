import React, { useCallback, useMemo, useRef, useState } from 'react'
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { ToastContext } from './contexts'

const ICONS = { success: CircleCheck, error: TriangleAlert, info: Info }
const DURATION = { success: 4000, info: 5000, error: 7000 }

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (type, message) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-3), { id, type, message }])
      setTimeout(() => dismiss(id), DURATION[type])
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type]
          return (
            <div key={toast.id} className={`toast toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
              <Icon aria-hidden="true" />
              <div className="toast__message">{toast.message}</div>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Đóng thông báo" onClick={() => dismiss(toast.id)}>
                <X aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
