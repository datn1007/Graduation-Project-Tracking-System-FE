import React, { useState } from 'react'
import { Archive, CalendarRange, Pencil, Play, Plus } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../hooks/useToast'
import { PageHeader, Alert } from '../../../components/ui/Misc'
import { Card, CardBody } from '../../../components/ui/Card'
import { EnumBadge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import FormField from '../../../components/ui/FormField'
import { formatDate, formatDateTime } from '../../../utils/format'
import { activateTerm, archiveTerm, createTerm, getTerms, updateTerm } from '../admin.service'

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/

const TermFormModal = ({ term, onClose, onSaved }) => {
  const toast = useToast()
  const [form, setForm] = useState({ code: term?.code || '', name: term?.name || '', startDate: term?.startDate || '', endDate: term?.endDate || '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!CODE_PATTERN.test(form.code.trim())) next.code = 'Chỉ gồm chữ, số, "-" và "_" (VD: FA26).'
    if (!form.name.trim()) next.name = 'Vui lòng nhập tên học kỳ.'
    if (!form.startDate) next.startDate = 'Chọn ngày bắt đầu.'
    if (!form.endDate) next.endDate = 'Chọn ngày kết thúc.'
    else if (form.startDate && form.endDate <= form.startDate) next.endDate = 'Phải sau ngày bắt đầu.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError(null)
    try {
      const body = { code: form.code.trim(), name: form.name.trim(), startDate: form.startDate, endDate: form.endDate }
      const saved = term ? await updateTerm(term.id, body) : await createTerm(body)
      toast.success(`Đã lưu học kỳ ${saved.code}.`)
      onSaved()
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
      open
      onClose={onClose}
      busy={saving}
      title={term ? `Sửa học kỳ ${term.code}` : 'Thêm học kỳ'}
      description="Học kỳ mới ở trạng thái Sắp diễn ra; kích hoạt khi bắt đầu."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="term-form" loading={saving}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="term-form" className="form-grid" onSubmit={submit} noValidate>
        {formError && (
          <div className="span-2">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <FormField label="Mã học kỳ" required error={errors.code}>
          <input className="input" maxLength={20} value={form.code} onChange={set('code')} placeholder="SP27" data-autofocus />
        </FormField>
        <FormField label="Tên" required error={errors.name}>
          <input className="input" maxLength={255} value={form.name} onChange={set('name')} placeholder="Spring 2027" />
        </FormField>
        <FormField label="Ngày bắt đầu" required error={errors.startDate}>
          <input className="input" type="date" value={form.startDate} onChange={set('startDate')} />
        </FormField>
        <FormField label="Ngày kết thúc" required error={errors.endDate}>
          <input className="input" type="date" value={form.endDate} onChange={set('endDate')} />
        </FormField>
      </form>
    </Modal>
  )
}

const ACTIONS = {
  activate: { title: 'Kích hoạt học kỳ?', text: 'Chỉ một học kỳ được ACTIVE tại một thời điểm.', run: activateTerm, done: 'Đã kích hoạt học kỳ.', variant: 'primary' },
  archive: {
    title: 'Lưu trữ học kỳ?',
    text: 'Học kỳ chuyển sang chỉ đọc. Slot còn trống và lịch hẹn sắp tới sẽ bị huỷ. Không thể hoàn tác.',
    run: archiveTerm,
    done: 'Đã lưu trữ học kỳ.',
    variant: 'danger',
  },
}

const TermsPage = () => {
  const toast = useToast()
  const terms = useAsync(() => getTerms(), [])
  const [editing, setEditing] = useState(null)
  const [pending, setPending] = useState(null) // { action, term }
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await ACTIONS[pending.action].run(pending.term.id)
      toast.success(ACTIONS[pending.action].done)
      setPending(null)
      terms.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Học kỳ"
        description="Vòng đời: Sắp diễn ra → Đang diễn ra → Đã lưu trữ (chỉ đọc)."
        actions={
          <Button icon={Plus} onClick={() => setEditing({})}>
            Thêm học kỳ
          </Button>
        }
      />
      <Card>
        <CardBody flush>
          <AsyncContent {...terms} onRetry={terms.reload} empty={<EmptyState icon={CalendarRange} title="Chưa có học kỳ" />}>
            {(list) => (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Học kỳ</th>
                      <th scope="col">Thời gian</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col">
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="table__primary">{t.code}</div>
                          <div className="table__secondary">{t.name}</div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {formatDate(`${t.startDate}T00:00:00+07:00`)} – {formatDate(`${t.endDate}T00:00:00+07:00`)}
                        </td>
                        <td>
                          <EnumBadge name="termStatus" value={t.status} />
                          {t.archivedAt && <div className="table__secondary">{formatDateTime(t.archivedAt)}</div>}
                        </td>
                        <td>
                          <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                            {t.status === 'UPCOMING' && (
                              <Button variant="secondary" size="sm" icon={Play} onClick={() => setPending({ action: 'activate', term: t })}>
                                Kích hoạt
                              </Button>
                            )}
                            {t.status !== 'ARCHIVED' && (
                              <>
                                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(t)}>
                                  Sửa
                                </Button>
                                <Button variant="danger-outline" size="sm" icon={Archive} onClick={() => setPending({ action: 'archive', term: t })}>
                                  Lưu trữ
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AsyncContent>
        </CardBody>
      </Card>

      {editing && <TermFormModal term={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={terms.reload} />}
      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        busy={busy}
        title={pending ? `${ACTIONS[pending.action].title} (${pending.term.code})` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPending(null)} disabled={busy}>
              Huỷ
            </Button>
            <Button variant={pending ? ACTIONS[pending.action].variant : 'primary'} loading={busy} onClick={confirm}>
              Xác nhận
            </Button>
          </>
        }
      >
        <p>{pending && ACTIONS[pending.action].text}</p>
      </Modal>
    </>
  )
}

export default TermsPage
