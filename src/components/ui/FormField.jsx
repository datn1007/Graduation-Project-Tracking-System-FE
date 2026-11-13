import React, { cloneElement, isValidElement, useId } from 'react'

// Wraps a single input/select/textarea: wires label, hint and error with aria attributes.
const FormField = ({ label, hint, error, required = false, className = '', children }) => {
  const generatedId = useId()
  const child = isValidElement(children) ? children : null
  const inputId = child?.props.id || generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`form-field ${className}`}>
      <label className="form-field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="form-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {child
        ? cloneElement(child, {
            id: inputId,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': describedBy,
            'aria-required': required || undefined,
          })
        : children}
      {hint && !error && (
        <span className="form-field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="form-field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default FormField
