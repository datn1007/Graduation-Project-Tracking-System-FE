import React, { useState } from 'react'
import { Code, ExternalLink, FileText, Link2, PenTool, Send } from 'lucide-react'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { Badge } from '../../../components/ui/Badge'
import { Alert } from '../../../components/ui/Misc'
import { useToast } from '../../../hooks/useToast'
import { SCORE_MAX, SCORE_MIN } from '../submission.constants'
import { detectLinkType, LINK_TYPE_LABELS } from '../../../utils/validation'
import { formatDateTime, formatScore } from '../../../utils/format'
import { createFeedback } from '../submission.service'

const LINK_ICONS = { REPOSITORY: Code, DRIVE: FileText, FIGMA: PenTool, OTHER: Link2 }

export const LinkChip = ({ url }) => {
  const type = detectLinkType(url)
  const Icon = LINK_ICONS[type]
  return (
    <a className="link-chip" href={url} target="_blank" rel="noopener noreferrer" title={url}>
      <Icon aria-hidden="true" />
      <span>{LINK_TYPE_LABELS[type]}</span>
      <ExternalLink aria-hidden="true" />
    </a>
  )
}

export const ScorePill = ({ score }) =>
  score === null || score === undefined ? null : (
    <span className="score-pill" aria-label={`Điểm ${formatScore(score)} trên ${SCORE_MAX}`}>
      {formatScore(score)}
      <small>/{SCORE_MAX}</small>
    </span>
  )

const FeedbackItem = ({ feedback }) => (
  <div className="feedback-item">
    <div className="row-between">
      <strong className="text-small">{feedback.advisor?.fullName}</strong>
      <ScorePill score={feedback.score} />
    </div>
    <div className="feedback-item__comment">{feedback.content}</div>
    <div className="text-muted text-small" style={{ marginTop: 6 }}>
      {formatDateTime(feedback.createdAt)}
    </div>
  </div>
)

// Append-only (audit trail): no edit/delete buttons — a new feedback replaces nothing.
const FeedbackForm = ({ submissionId, onCreated }) => {
  const toast = useToast()
  const [content, setContent] = useState('')
  const [score, setScore] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!content.trim()) next.content = 'Vui lòng nhập nhận xét.'
    if (score !== '') {
      const value = Number(score)
      if (Number.isNaN(value) || value < SCORE_MIN || value > SCORE_MAX) next.score = `Điểm từ ${SCORE_MIN} đến ${SCORE_MAX}.`
      else if (Math.round(value * 100) !== value * 100) next.score = 'Tối đa 2 chữ số thập phân.'
    }
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError(null)
    try {
      const feedback = await createFeedback(submissionId, content.trim(), score === '' ? null : Number(score))
      toast.success('Đã gửi nhận xét.')
      setContent('')
      setScore('')
      onCreated(feedback)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={submit} noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Nhận xét" required error={errors.content}>
        <textarea className="textarea" value={content} maxLength={20000} onChange={(e) => setContent(e.target.value)} />
      </FormField>
      <div className="row" style={{ alignItems: 'flex-end' }}>
        <FormField label={`Điểm milestone (${SCORE_MIN}–${SCORE_MAX}, tuỳ chọn)`} error={errors.score}>
          <input className="input" type="number" inputMode="decimal" min={SCORE_MIN} max={SCORE_MAX} step="0.25" value={score} onChange={(e) => setScore(e.target.value)} style={{ maxWidth: 140 }} />
        </FormField>
        <Button type="submit" icon={Send} loading={saving}>
          Gửi nhận xét
        </Button>
      </div>
    </form>
  )
}

// SubmissionResponse with its feedbacks; `canFeedback` shows the feedback form.
const SubmissionItem = ({ submission, canFeedback = false, showTask = false, onFeedback }) => {
  const [writing, setWriting] = useState(false)
  return (
    <div className="submission">
      <div className="submission__head">
        <span>
          {showTask && submission.task && (
            <strong>
              Tuần {submission.task.weekNumber} · {submission.task.title} ·{' '}
            </strong>
          )}
          {submission.submittedBy?.fullName} · {formatDateTime(submission.submittedAt)}
        </span>
        {submission.late && <Badge tone="danger">Nộp trễ</Badge>}
      </div>
      {submission.description && <div className="submission__text">{submission.description}</div>}
      <div className="submission__links">
        <LinkChip url={submission.url} />
      </div>
      {submission.feedbacks?.length > 0 && (
        <div className="stack-sm">
          {submission.feedbacks.map((f) => (
            <FeedbackItem key={f.id} feedback={f} />
          ))}
        </div>
      )}
      {canFeedback &&
        (writing ? (
          <FeedbackForm
            submissionId={submission.id}
            onCreated={(feedback) => {
              setWriting(false)
              onFeedback?.(submission.id, feedback)
            }}
          />
        ) : (
          <div>
            <Button variant="secondary" size="sm" onClick={() => setWriting(true)}>
              Nhận xét & chấm điểm
            </Button>
          </div>
        ))}
    </div>
  )
}

export default SubmissionItem
