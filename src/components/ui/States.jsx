import React from 'react'
import { Inbox, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import Button from './Button'
import { getErrorMessage } from '../../services/apiClient'

export const LoadingState = ({ label = 'Đang tải dữ liệu…', compact = false }) => (
  <div className={`state ${compact ? 'state--compact' : ''}`} role="status" aria-live="polite">
    <LoaderCircle className="spin" aria-hidden="true" />
    <span className="state__text">{label}</span>
  </div>
)

export const EmptyState = ({ icon: Icon = Inbox, title, text, action, compact = false }) => (
  <div className={`state ${compact ? 'state--compact' : ''}`}>
    <div className="state__icon">
      <Icon aria-hidden="true" />
    </div>
    {title && <div className="state__title">{title}</div>}
    {text && <div className="state__text">{text}</div>}
    {action}
  </div>
)

export const ErrorState = ({ error, title = 'Không thể tải dữ liệu', onRetry, compact = false }) => (
  <div className={`state state--error ${compact ? 'state--compact' : ''}`} role="alert">
    <div className="state__icon">
      <TriangleAlert aria-hidden="true" />
    </div>
    <div className="state__title">{title}</div>
    <div className="state__text">{getErrorMessage(error)}</div>
    {onRetry && (
      <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
        Thử lại
      </Button>
    )}
  </div>
)

// Renders loading / error / empty / content for an async resource in one place.
export const AsyncContent = ({ loading, error, data, onRetry, isEmpty, empty, loadingLabel, compact, children }) => {
  if (loading && data === undefined) return <LoadingState label={loadingLabel} compact={compact} />
  if (error && data === undefined) return <ErrorState error={error} onRetry={onRetry} compact={compact} />
  const emptyCheck = isEmpty ?? ((value) => value == null || (Array.isArray(value) && value.length === 0) || (Array.isArray(value?.content) && value.content.length === 0))
  if (empty && emptyCheck(data)) return empty
  return children(data)
}
