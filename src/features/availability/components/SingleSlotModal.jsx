import React, { useState } from 'react'
import { useToast } from '../../../hooks/useToast'
import { Alert } from '../../../components/ui/Misc'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import FormField from '../../../components/ui/FormField'
import { todayKey, toMinutes, vnDateTimeToIso } from '../../../utils/format'
import { isHttpUrl } from '../../../utils/validation'
import { createSlot } from '../availability.service'

// POST /slots { startAt, endAt, location?, meetingUrl? } — a one-off slot outside the weekly rules.
const SingleSlotModal = ({ open, onClose, onCreated }) => {
  const toast = useToast()
  const [form, setForm] = useState({ date: todayKey(), startTime: '09:00', endTime: '09:30', location: '', meetingUrl: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!form.date) next.date = 'Chọn ngày.'
    if (toMinutes(form.endTime) <= toMinutes(form.startTime)) next.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.'
    if (form.meetingUrl && !isHttpUrl(form.meetingUrl)) next.meetingUrl = 'Phải bắt đầu bằng http:// hoặc https://'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError(null)
    try {
      await createSlot({
        startAt: vnDateTimeToIso(form.date, form.startTime),
        endAt: vnDateTimeToIso(form.date, form.endTime),
        location: form.location.trim() || undefined,
        meetingUrl: form.meetingUrl.trim() || undefined,
      })
      toast.success('Đã tạo slot.')
      onCreated()
      onClose()
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      title="Thêm slot lẻ"
      description="Slot không lặp lại, ngoài lịch rảnh hằng tuần."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="single-slot-form" loading={saving}>
            Tạo slot
          </Button>
        </>
      }
    >
      <form id="single-slot-form" className="form-grid" onSubmit={submit} noValidate>
        {formError && (
          <div className="span-2">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <FormField label="Ngày" required error={errors.date} className="span-2">
          <input className="input" type="date" min={todayKey()} value={form.date} onChange={set('date')} />
        </FormField>
        <FormField label="Từ" required error={errors.startAt || errors.startTime}>
          <input className="input" type="time" step="300" value={form.startTime} onChange={set('startTime')} />
        </FormField>
        <FormField label="Đến" required error={errors.endAt || errors.endTime}>
          <input className="input" type="time" step="300" value={form.endTime} onChange={set('endTime')} />
        </FormField>
        <FormField label="Địa điểm" error={errors.location} className="span-2">
          <input className="input" maxLength={255} value={form.location} onChange={set('location')} />
        </FormField>
        <FormField label="Link họp online" error={errors.meetingUrl} className="span-2">
          <input className="input" type="url" maxLength={1024} value={form.meetingUrl} onChange={set('meetingUrl')} />
        </FormField>
      </form>
    </Modal>
  )
}

export default SingleSlotModal
