import React, { useState } from 'react'
import { Send } from 'lucide-react'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Misc'
import { useToast } from '../../../hooks/useToast'
import { isHttpUrl } from '../../../utils/validation'
import { submitWork } from '../submission.service'

// POST /tasks/{id}/submissions { url, description? }. Late submissions are accepted (BE sets `late`),
// and the task moves to REVIEW automatically.
const SubmissionForm = ({ taskId, onSubmitted }) => {
  const toast = useToast()
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!url.trim()) next.url = 'Vui lòng nhập link bài nộp.'
    else if (!isHttpUrl(url.trim())) next.url = 'Phải bắt đầu bằng http:// hoặc https://'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError(null)
    try {
      const submission = await submitWork(taskId, url.trim(), description.trim())
      toast.success(submission.late ? 'Đã nộp bài (nộp trễ).' : 'Đã nộp bài. Task được chuyển sang Chờ duyệt.')
      setUrl('')
      setDescription('')
      onSubmitted(submission)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={submit} noValidate>
      <div className="section-title">Nộp bài</div>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Link bài nộp" required error={errors.url} hint="GitHub, Google Drive, Figma…">
        <input className="input" type="url" inputMode="url" maxLength={2048} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/…" />
      </FormField>
      <FormField label="Mô tả (tuỳ chọn)" error={errors.description}>
        <textarea className="textarea" maxLength={10000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </FormField>
      <div>
        <Button type="submit" icon={Send} loading={saving}>
          Nộp bài
        </Button>
      </div>
    </form>
  )
}

export default SubmissionForm
