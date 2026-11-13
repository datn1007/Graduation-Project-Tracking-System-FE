import React, { useMemo, useState } from 'react'
import { Repeat } from 'lucide-react'
import { useToast } from '../../../hooks/useToast'
import { Alert } from '../../../components/ui/Misc'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { toMinutes } from '../../../utils/format'
import { isHttpUrl } from '../../../utils/validation'
import { WEEKDAYS } from '../availability.constants'
import { createRule } from '../availability.service'

// POST /availability/rules → { rule, generatedSlots, skippedSlots }. Times are Vietnam local "HH:mm";
// overlapping slots are skipped by the Backend and reported in skippedSlots.
const RuleForm = ({ config, onCreated }) => {
  const toast = useToast()
  const initial = () => ({
    dayOfWeek: '2',
    startTime: '09:00',
    endTime: '11:00',
    slotDurationMinutes: String(config?.defaultSlotDurationMinutes ?? 30),
    bufferMinutes: String(config?.defaultBufferMinutes ?? 0),
    location: '',
    meetingUrl: '',
    effectiveFrom: '',
    effectiveTo: '',
  })
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const preview = useMemo(() => {
    const span = toMinutes(form.endTime) - toMinutes(form.startTime)
    const step = Number(form.slotDurationMinutes) + Number(form.bufferMinutes || 0)
    if (span <= 0 || !Number(form.slotDurationMinutes)) return 0
    return Math.floor((span + Number(form.bufferMinutes || 0)) / step)
  }, [form])

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (toMinutes(form.endTime) <= toMinutes(form.startTime)) next.endTime = 'Giờ kết thúc phải sau giờ bắt đầu.'
    const duration = Number(form.slotDurationMinutes)
    if (!Number.isInteger(duration) || duration < 5 || duration > 480) next.slotDurationMinutes = 'Từ 5 đến 480 phút.'
    const buffer = Number(form.bufferMinutes || 0)
    if (!Number.isInteger(buffer) || buffer < 0 || buffer > 120) next.bufferMinutes = 'Từ 0 đến 120 phút.'
    if (form.meetingUrl && !isHttpUrl(form.meetingUrl)) next.meetingUrl = 'Phải bắt đầu bằng http:// hoặc https://'
    if (form.effectiveFrom && form.effectiveTo && form.effectiveTo < form.effectiveFrom) next.effectiveTo = 'Phải sau ngày bắt đầu.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    setFormError(null)
    try {
      const result = await createRule({
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDurationMinutes: duration,
        bufferMinutes: buffer,
        location: form.location.trim() || undefined,
        meetingUrl: form.meetingUrl.trim() || undefined,
        effectiveFrom: form.effectiveFrom || undefined,
        effectiveTo: form.effectiveTo || undefined,
      })
      toast.success(`Đã tạo lịch rảnh: sinh ${result.generatedSlots} slot${result.skippedSlots ? `, bỏ qua ${result.skippedSlots} slot bị trùng` : ''}.`)
      setForm(initial())
      onCreated()
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {formError && (
        <div className="span-2">
          <Alert tone="danger">{formError}</Alert>
        </div>
      )}
      <FormField label="Thứ" required error={errors.dayOfWeek} className="span-2">
        <select className="select" value={form.dayOfWeek} onChange={set('dayOfWeek')}>
          {WEEKDAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Từ" required error={errors.startTime}>
        <input className="input" type="time" step="300" value={form.startTime} onChange={set('startTime')} />
      </FormField>
      <FormField label="Đến" required error={errors.endTime}>
        <input className="input" type="time" step="300" value={form.endTime} onChange={set('endTime')} />
      </FormField>
      <FormField label="Thời lượng (phút)" error={errors.slotDurationMinutes}>
        <input className="input" type="number" min={5} max={480} value={form.slotDurationMinutes} onChange={set('slotDurationMinutes')} />
      </FormField>
      <FormField label="Nghỉ giữa slot (phút)" error={errors.bufferMinutes}>
        <input className="input" type="number" min={0} max={120} value={form.bufferMinutes} onChange={set('bufferMinutes')} />
      </FormField>
      <FormField label="Áp dụng từ" hint="Trống = đầu học kỳ" error={errors.effectiveFrom}>
        <input className="input" type="date" value={form.effectiveFrom} onChange={set('effectiveFrom')} />
      </FormField>
      <FormField label="Đến ngày" hint="Trống = cuối học kỳ" error={errors.effectiveTo}>
        <input className="input" type="date" value={form.effectiveTo} onChange={set('effectiveTo')} />
      </FormField>
      <FormField label="Địa điểm" error={errors.location} className="span-2">
        <input className="input" maxLength={255} value={form.location} onChange={set('location')} placeholder="VD: Phòng 304 - Toà Alpha" />
      </FormField>
      <FormField label="Link họp online" hint="Google Meet / Zoom (tuỳ chọn)" error={errors.meetingUrl} className="span-2">
        <input className="input" type="url" maxLength={1024} value={form.meetingUrl} onChange={set('meetingUrl')} placeholder="https://meet.google.com/…" />
      </FormField>
      <div className="span-2 row-between">
        <span className="text-muted text-small">≈ {preview} slot mỗi tuần · giờ Việt Nam</span>
        <Button type="submit" icon={Repeat} loading={saving}>
          Tạo lịch rảnh
        </Button>
      </div>
    </form>
  )
}

export default RuleForm
