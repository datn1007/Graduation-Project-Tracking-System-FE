import React, { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Misc'
import { LoadingState } from '../../../components/ui/States'
import { useAsync } from '../../../hooks/useAsync'
import { useMeta } from '../../../hooks/useMeta'
import { useToast } from '../../../hooks/useToast'
import { createProject, getAdvisors, getDepartments, getTerms, updateProject } from '../project.service'

// PROJECT_MANAGE. Create: { termId, departmentId, advisorId, code, title, description? }
// Update: { departmentId, advisorId, title, description?, status }
const ProjectFormModal = ({ project, onClose, onSaved }) => {
  const toast = useToast()
  const { options } = useMeta()
  const isEdit = !!project
  const lookups = useAsync(
    () =>
      Promise.all([getTerms(), getDepartments(), getAdvisors()]).then(([terms, departments, advisors]) => ({ terms, departments, advisors })),
    [],
  )
  const [form, setForm] = useState(() => ({
    termId: project?.term?.id || '',
    departmentId: project?.department?.id || '',
    advisorId: project?.advisor?.id || '',
    code: project?.code || '',
    title: project?.title || '',
    description: project?.description || '',
    status: project?.status || 'IN_PROGRESS',
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const data = lookups.data
  const termId = form.termId || data?.terms.find((t) => t.status === 'ACTIVE')?.id || ''

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!isEdit && !termId) next.termId = 'Chọn học kỳ.'
    if (!form.departmentId) next.departmentId = 'Chọn bộ môn.'
    if (!form.advisorId) next.advisorId = 'Chọn giảng viên hướng dẫn.'
    if (!isEdit && !form.code.trim()) next.code = 'Nhập mã đồ án.'
    if (!form.title.trim()) next.title = 'Nhập tên đề tài.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError(null)
    try {
      const common = { departmentId: form.departmentId, advisorId: form.advisorId, title: form.title.trim(), description: form.description.trim() || undefined }
      const saved = isEdit
        ? await updateProject(project.id, { ...common, status: form.status })
        : await createProject({ ...common, termId, code: form.code.trim() })
      toast.success(isEdit ? 'Đã cập nhật đồ án.' : `Đã tạo đồ án ${saved.code}.`)
      onSaved(saved)
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
      size="lg"
      title={isEdit ? `Sửa đồ án ${project.code}` : 'Tạo đồ án'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="project-form" loading={saving} disabled={!data}>
            Lưu
          </Button>
        </>
      }
    >
      {!data ? (
        lookups.error ? <Alert tone="danger">{lookups.error.message}</Alert> : <LoadingState compact />
      ) : (
        <form id="project-form" className="form-grid" onSubmit={submit} noValidate>
          {formError && (
            <div className="span-2">
              <Alert tone="danger">{formError}</Alert>
            </div>
          )}
          {!isEdit && (
            <>
              <FormField label="Học kỳ" required error={errors.termId}>
                <select className="select" value={termId} onChange={set('termId')}>
                  <option value="">— Chọn —</option>
                  {data.terms
                    .filter((t) => t.status !== 'ARCHIVED')
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} — {t.name}
                      </option>
                    ))}
                </select>
              </FormField>
              <FormField label="Mã đồ án" required error={errors.code}>
                <input className="input" maxLength={50} value={form.code} onChange={set('code')} placeholder="SE05" />
              </FormField>
            </>
          )}
          <FormField label="Bộ môn" required error={errors.departmentId}>
            <select className="select" value={form.departmentId} onChange={set('departmentId')}>
              <option value="">— Chọn —</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Giảng viên hướng dẫn" required error={errors.advisorId}>
            <select className="select" value={form.advisorId} onChange={set('advisorId')}>
              <option value="">— Chọn —</option>
              {data.advisors.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tên đề tài" required error={errors.title} className="span-2">
            <input className="input" maxLength={500} value={form.title} onChange={set('title')} />
          </FormField>
          <FormField label="Mô tả" error={errors.description} className="span-2">
            <textarea className="textarea" maxLength={5000} value={form.description} onChange={set('description')} />
          </FormField>
          {isEdit && (
            <FormField label="Trạng thái" required error={errors.status}>
              <select className="select" value={form.status} onChange={set('status')}>
                {options('projectStatus').map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form>
      )}
    </Modal>
  )
}

export default ProjectFormModal
