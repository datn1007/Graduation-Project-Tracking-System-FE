import React from 'react'
import { useMeta } from '../../hooks/useMeta'
import { TONES } from '../../constants/enums'

export const Badge = ({ tone = 'neutral', icon: Icon, children, title }) => (
  <span className={`badge badge--${tone}`} title={title}>
    {Icon && <Icon aria-hidden="true" />}
    {children}
  </span>
)

// Renders a Backend enum value: label from GET /meta/enums, tone from constants/enums TONES.
// Unknown values (added later by the Backend) still render with their own label / raw value.
export const EnumBadge = ({ name, value, icon, prefix }) => {
  const { label } = useMeta()
  return (
    <Badge tone={TONES[name]?.[value] || 'neutral'} icon={icon}>
      {prefix}
      {label(name, value)}
    </Badge>
  )
}
