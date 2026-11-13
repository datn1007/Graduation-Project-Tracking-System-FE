import React, { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Accessible dialog: focus moves inside on open, Tab is trapped, Esc / backdrop close (unless busy),
// and focus returns to the previously focused element on close.
const Modal = ({ open, onClose, title, description, size, footer, busy = false, children }) => {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descId = useId()
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  })

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const dialog = dialogRef.current
    const first = dialog?.querySelector('[data-autofocus]') || dialog?.querySelector(FOCUSABLE)
    first?.focus()
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.stopPropagation()
        onCloseRef.current?.()
      }
      if (event.key === 'Tab' && dialog) {
        const items = [...dialog.querySelectorAll(FOCUSABLE)]
        if (!items.length) return
        const firstItem = items[0]
        const lastItem = items[items.length - 1]
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault()
          lastItem.focus()
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault()
          firstItem.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.()
      }}
    >
      <div
        ref={dialogRef}
        className={`modal ${size ? `modal--${size}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {description && (
              <p className="modal__description" id={descId}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={onClose} disabled={busy} aria-label="Đóng">
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
