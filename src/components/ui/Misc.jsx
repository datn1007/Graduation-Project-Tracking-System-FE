import React from 'react'
import { ChevronLeft, ChevronRight, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import Button from './Button'
import { initials } from '../../utils/format'

export const PageHeader = ({ title, description, actions }) => (
  <div className="page-header">
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
)

export const StatCard = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="card stat-card">
    <div className={`stat-card__icon ${tone ? `stat-card__icon--${tone}` : ''}`}>
      <Icon aria-hidden="true" />
    </div>
    <div>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {hint && <div className="stat-card__hint">{hint}</div>}
    </div>
  </div>
)

export const ProgressBar = ({ value = 0, tone, label = true, ariaLabel = 'Tiến độ' }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className="progress">
      <div className="progress__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}>
        <div className={`progress__bar ${tone ? `progress__bar--${tone}` : ''}`} style={{ width: `${pct}%` }} />
      </div>
      {label && <span className="progress__label">{pct}%</span>}
    </div>
  )
}

export const Tabs = ({ tabs, value, onChange, label }) => (
  <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        role="tab"
        className="tabs__tab"
        aria-selected={tab.value === value}
        onClick={() => onChange(tab.value)}
      >
        {tab.label}
        {tab.count !== undefined && <span className="tabs__count">{tab.count}</span>}
      </button>
    ))}
  </div>
)

// Expects the Backend page shape { page (0-based), size, totalElements, totalPages }.
export const Pagination = ({ pageData, onPageChange }) => {
  if (!pageData || pageData.totalElements === 0) return null
  const { page, size, totalElements, totalPages } = pageData
  const from = page * size + 1
  const to = Math.min(totalElements, from + size - 1)
  return (
    <div className="pagination">
      <span>
        {from}–{to} / {totalElements}
      </span>
      <div className="pagination__controls">
        <Button variant="secondary" size="sm" iconOnly icon={ChevronLeft} aria-label="Trang trước" disabled={page <= 0} onClick={() => onPageChange(page - 1)} />
        <span>
          Trang {page + 1}/{totalPages}
        </span>
        <Button variant="secondary" size="sm" iconOnly icon={ChevronRight} aria-label="Trang sau" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)} />
      </div>
    </div>
  )
}

export const Avatar = ({ name, size }) => (
  <span className={`avatar ${size ? `avatar--${size}` : ''}`} aria-hidden="true">
    {initials(name)}
  </span>
)

const ALERT_ICONS = { info: Info, warning: TriangleAlert, danger: TriangleAlert, success: CircleCheck }

export const Alert = ({ tone = 'info', title, children }) => {
  const Icon = ALERT_ICONS[tone]
  return (
    <div className={`alert alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <div>
        {title && <div className="alert__title">{title}</div>}
        {children}
      </div>
    </div>
  )
}
