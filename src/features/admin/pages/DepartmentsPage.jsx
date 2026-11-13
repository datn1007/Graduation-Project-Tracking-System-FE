import React, { useState } from 'react'
import { Building2, Pencil, Plus } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../hooks/useToast'
import { PageHeader, Alert } from '../../../components/ui/Misc'
import { Card, CardBody } from '../../../components/ui/Card'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import FormField from '../../../components/ui/FormField'
import { createDepartment, getDepartments, updateDepartment } from '../admin.service'

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/

const DepartmentFormModal = ({ department, onClose, onSaved }) => {
  const toast = useToast()
  const [form, setForm] = useState({ code: department?.code || '', name: department?.name || '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!CODE_PATTERN.test(form.code.trim())) next.code = 'Chỉ gồm chữ, số, "-" và "_".'
    if (!form.name.trim()) next.name = 'Vui lòng nhập tên bộ môn.'
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    setFormError(null)
    try {
      const body = { code: form.code.trim(), name: form.name.trim() }
      const saved = department ? await updateDepartment(department.id, body) : await createDepartment(body)
      toast.success(`Đã lưu bộ môn ${saved.code}.`)
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
      title={department ? `Sửa bộ môn ${department.code}` : 'Thêm bộ môn'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="department-form" loading={saving}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="department-form" className="form-grid" onSubmit={submit} noValidate>
        {formError && (
          <div className="span-2">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <FormField label="Mã" required error={errors.code}>
          <input className="input" maxLength={20} value={form.code} onChange={set('code')} placeholder="SE" data-autofocus />
        </FormField>
        <FormField label="Tên bộ môn" required error={errors.name}>
          <input className="input" maxLength={255} value={form.name} onChange={set('name')} />
        </FormField>
      </form>
    </Modal>
  )
}

const DepartmentsPage = () => {
  const departments = useAsync(() => getDepartments(), [])
  const [editing, setEditing] = useState(null)

  return (
    <>
      <PageHeader
        title="Bộ môn"
        description="Giáo vụ chỉ xem được đồ án thuộc bộ môn của mình."
        actions={
          <Button icon={Plus} onClick={() => setEditing({})}>
            Thêm bộ môn
          </Button>
        }
      />
      <Card>
        <CardBody flush>
          <AsyncContent {...departments} onRetry={departments.reload} empty={<EmptyState icon={Building2} title="Chưa có bộ môn" />}>
            {(list) => (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Mã</th>
                      <th scope="col">Tên</th>
                      <th scope="col">
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((d) => (
                      <tr key={d.id}>
                        <td className="table__primary">{d.code}</td>
                        <td>{d.name}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(d)}>
                            Sửa
                          </Button>
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
      {editing && <DepartmentFormModal department={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={departments.reload} />}
    </>
  )
}

export default DepartmentsPage
