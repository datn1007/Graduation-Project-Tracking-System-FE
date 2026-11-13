import React from 'react'
import { LoaderCircle } from 'lucide-react'

const Button = ({
  variant = 'primary',
  size,
  block = false,
  loading = false,
  icon: Icon,
  iconOnly = false,
  type = 'button',
  className = '',
  disabled,
  children,
  ...rest
}) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    iconOnly && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : Icon && <Icon aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
