import React, { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Misc'
import { useToast } from '../../../hooks/useToast'
import { dayKey, formatTime, todayKey, vnDateTimeToIso } from '../../../utils/format'
import { createMilestone, generateMilestones, updateMilestone } from '../kanban.service'

const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// mode: 'create' | 'edit' | 'generate'
const MilestoneFormModal = ({ mode, projectId, milestone, nextWeek = 1, onClose, onSaved }) => {
  const toast = useToast()
  const isGenerate = mode === 'generate'
  const [form, setForm] = useState(() => {
    if (isGenerate) return { firstWeekStart: todayKey(), weeks: '12', dueTime: '23:59' }
    if (milestone) {
      return {
        weekNumber: String(milestone.weekNumber),
        title: milestone.title,
        description: milestone.description || '',
        startDate: milestone.startDate,
        dueDate: dayKey(milestone.dueAt),
        dueTime: formatTime(milestone.dueAt),
      }
    }
    const start = todayKey()
    return { weekNumber: String(nextWeek), title: `Tuần ${nextWeek}`, description: '', startDate: start, dueDate: addDays(start, 6), dueTime: '23:59' }
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (isGenerate) {
      const weeks = Number(form.weeks)
      if (!form.firstWeekStart) next.firstWeekStart = 'Chọn ngày bắt đầu tuần 1.'
      if (!Number.isInteger(weeks) || weeks < 1 || weeks > 20) next.weeks = 'Từ 1 đến 20 tuần.'
    } else {
      const week = Number(form.weekNumber)
      if (!Number.isInteger(week) || week < 1 || week > 20) next.weekNumber = 'Tuần từ 1 đến 20.'
      if (!form.title.trim()) next.title = 'Vui lòng nhập tiêu đề.'
      if (!form.startDate) next.startDate = 'Chọn ngày bắt đầu.'
      if (!form.dueDate) next.dueAt = 'Chọn hạn nộp.'
      else if (form.startDate && form.dueDate < form.startDate) next.dueAt = 'Hạn nộp phải sau ngày bắt đầu.'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    setFormError(null)
    try {
      if (isGenerate) {
        const created = await generateMilestones(projectId, { firstWeekStart: form.firstWeekStart, weeks: Number(form.weeks), dueTime: form.dueTime || undefined })
        toast.success(`Đã tạo ${created.length} milestone (bỏ qua tuần đã có).`)
      } else {
        const body = {
          weekNumber: Number(form.weekNumber),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startDate: form.startDate,
          dueAt: vnDateTimeToIso(form.dueDate, form.dueTime || '23:59'),
        }
        if (milestone) await updateMilestone(milestone.id, body)
        else await createMilestone(projectId, body)
        toast.success(milestone ? 'Đã cập nhật milestone.' : 'Đã tạo milestone.')
      }
      onSaved()
      onClose()
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const title = isGenerate ? 'Sinh milestone theo tuần' : milestone ? `Sửa ${milestone.title}` : 'Tạo milestone'

  return (
    <Modal
      open
      onClose={onClose}
      busy={saving}
      title={title}
      description={isGenerate ? 'Tạo "Tuần 1…N", mỗi tuần 7 ngày, hạn vào Chủ nhật. Tuần đã có sẽ được bỏ qua.' : 'Giờ Việt Nam'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="milestone-form" loading={saving}>
            {isGenerate ? 'Sinh milestone' : 'Lưu'}
          </Button>
        </>
      }
    >
      <form id="milestone-form" className="form-grid" onSubmit={submit} noValidate>
        {formError && (
          <div className="span-2">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        {isGenerate ? (
          <>
            <FormField label="Ngày bắt đầu tuần 1" required error={errors.firstWeekStart} className="span-2">
              <input className="input" type="date" value={form.firstWeekStart} onChange={set('firstWeekStart')} />
            </FormField>
            <FormField label="Số tuần" required error={errors.weeks}>
              <input className="input" type="number" min={1} max={20} value={form.weeks} onChange={set('weeks')} />
            </FormField>
            <FormField label="Giờ hạn nộp" error={errors.dueTime}>
              <input className="input" type="time" value={form.dueTime} onChange={set('dueTime')} />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Tuần" required error={errors.weekNumber}>
              <input className="input" type="number" min={1} max={20} value={form.weekNumber} onChange={set('weekNumber')} />
            </FormField>
            <FormField label="Tiêu đề" required error={errors.title}>
              <input className="input" maxLength={255} value={form.title} onChange={set('title')} />
            </FormField>
            <FormField label="Mô tả" error={errors.description} className="span-2">
              <textarea className="textarea" maxLength={5000} value={form.description} onChange={set('description')} />
            </FormField>
            <FormField label="Ngày bắt đầu" required error={errors.startDate}>
              <input className="input" type="date" value={form.startDate} onChange={set('startDate')} />
            </FormField>
            <FormField label="Hạn nộp (ngày)" required error={errors.dueAt}>
              <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
            </FormField>
            <FormField label="Hạn nộp (giờ)">
              <input className="input" type="time" value={form.dueTime} onChange={set('dueTime')} />
            </FormField>
          </>
        )}
      </form>
    </Modal>
  )
}

export default MilestoneFormModal
