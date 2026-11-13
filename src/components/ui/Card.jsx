import React from 'react'

export const Card = ({ className = '', children, ...rest }) => (
  <section className={`card ${className}`} {...rest}>
    {children}
  </section>
)

export const CardHeader = ({ title, subtitle, icon: Icon, actions }) => (
  <div className="card__header">
    <div>
      <h2>
        {Icon && <Icon aria-hidden="true" />}
        {title}
      </h2>
      {subtitle && <div className="card__subtitle">{subtitle}</div>}
    </div>
    {actions && <div className="row">{actions}</div>}
  </div>
)

export const CardBody = ({ flush = false, className = '', children }) => (
  <div className={`card__body ${flush ? 'card__body--flush' : ''} ${className}`}>{children}</div>
)
