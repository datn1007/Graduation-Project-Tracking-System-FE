import React, { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import PasswordInput from '../../../components/ui/PasswordInput'
import { Alert } from '../../../components/ui/Misc'
import { useMeta } from '../../../hooks/useMeta'
import { useToast } from '../../../hooks/useToast'
import { checkNewPassword, isValidEmail } from '../../../utils/validation'
import { createUser, updateUser } from '../admin.service'
import { DEFAULT_NEW_USER_ROLE } from '../admin.constants'

// Create: POST /users — any email domain; adding an email is what grants Google sign-in (BE v1.2.0).
// Password is optional: blank = Google-only account. Edit: PUT /users/{id} — full replacement incl.
// `active`; the password is managed separately (SetPasswordModal).
const UserFormModal = ({ user, departments, onClose, onSaved }) => {
  const { options, config } = useMeta()
  const toast = useToast()
  const isEdit = !!user
  const [form, setForm] = useState(() => ({
    email: user?.email || '',
    fullName: user?.fullName || '',
    userCode: user?.userCode || '',
    role: user?.role || DEFAULT_NEW_USER_ROLE,
    departmentId: user?.department?.id || '',
    active: user ? user.active : true,
    password: '',
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!isEdit && !isValidEmail(form.email)) next.email = 'Email không hợp lệ.'
    if (!form.fullName.trim()) next.fullName = 'Vui lòng nhập họ tên.'
    if (!isEdit && form.password) {
      const passwordError = checkNewPassword(form.password, config)
      if (passwordError) next.password = passwordError
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    setFormError(null)
    const common = { fullName: form.fullName.trim(), userCode: form.userCode.trim() || undefined, role: form.role, departmentId: form.departmentId || undefined }
    try {
      const saved = isEdit
        ? await updateUser(user.id, { ...common, active: form.active })
        : await createUser({ ...common, email: form.email.trim().toLowerCase(), password: form.password || undefined })
      toast.success(isEdit ? `Đã cập nhật ${saved.fullName}.` : `Đã tạo tài khoản ${saved.email}.`)
      onSaved(saved)
      onClose()
    } catch (err) {
      if (err.code === 'PASSWORD_POLICY_VIOLATION') setErrors({ password: err.message })
      else setErrors(err.fieldErrors || {})
      setFormError(err.code === 'PASSWORD_POLICY_VIOLATION' ? null : err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={saving}
      title={isEdit ? `Sửa ${user.fullName}` : 'Thêm người dùng'}
      description={
        isEdit
          ? 'Vai trò mới có hiệu lực ở lần làm mới token kế tiếp (tối đa 30 phút).'
          : 'Thêm email (mọi domain, kể cả Gmail) để cấp quyền đăng nhập Google cho người đó. Có mật khẩu thì đăng nhập được cả bằng email + mật khẩu.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="user-form" className="form-grid" onSubmit={submit} noValidate>
        {formError && (
          <div className="span-2">
            <Alert tone="danger">{formError}</Alert>
          </div>
        )}
        <FormField label="Email" required={!isEdit} error={errors.email} className="span-2">
          <input className="input" type="email" value={form.email} onChange={set('email')} disabled={isEdit} placeholder="ten@fpt.edu.vn hoặc ten@gmail.com" />
        </FormField>
        {!isEdit && (
          <FormField
            label="Mật khẩu (tuỳ chọn)"
            error={errors.password}
            hint={`Bỏ trống = tài khoản chỉ đăng nhập bằng Google. ${config?.passwordRule || ''}`}
            className="span-2"
          >
            <PasswordInput autoComplete="new-password" maxLength={200} value={form.password} onChange={set('password')} />
          </FormField>
        )}
        <FormField label="Họ và tên" required error={errors.fullName} className="span-2">
          <input className="input" maxLength={255} value={form.fullName} onChange={set('fullName')} />
        </FormField>
        <FormField label="Mã (MSSV / mã GV)" error={errors.userCode}>
          <input className="input" maxLength={50} value={form.userCode} onChange={set('userCode')} />
        </FormField>
        <FormField label="Vai trò" required error={errors.role}>
          <select className="select" value={form.role} onChange={set('role')}>
            {options('role').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Bộ môn" error={errors.departmentId} className="span-2">
          <select className="select" value={form.departmentId} onChange={set('departmentId')}>
            <option value="">— Không —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>
        </FormField>
        {isEdit && (
          <label className="span-2 row" style={{ gap: 8 }}>
            <input type="checkbox" checked={form.active} onChange={set('active')} />
            <span>Đang hoạt động (bỏ chọn để vô hiệu hoá tài khoản)</span>
          </label>
        )}
      </form>
    </Modal>
  )
}

export default UserFormModal
