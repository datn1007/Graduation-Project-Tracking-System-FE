import React, { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useMeta } from '../../../hooks/useMeta'
import { useToast } from '../../../hooks/useToast'
import { PageHeader, Alert } from '../../../components/ui/Misc'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import PasswordInput from '../../../components/ui/PasswordInput'
import { checkNewPassword } from '../../../utils/validation'
import { PASSWORD_ERROR_FIELD } from '../auth.constants'

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' }

// POST /auth/change-password → new token pair (stored by AuthProvider); other sessions are signed out.
// Only for accounts with a password (user.hasPassword); Google-only accounts ask an admin instead.
const ChangePasswordPage = () => {
  const { user, changePassword } = useAuth()
  const { config } = useMeta()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const next = {}
    if (!form.currentPassword) next.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    const policyError = checkNewPassword(form.newPassword, config)
    if (policyError) next.newPassword = policyError
    else if (form.newPassword === form.currentPassword) next.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.'
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Mật khẩu nhập lại không khớp.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    setFormError(null)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      setForm(EMPTY)
      toast.success('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.')
    } catch (err) {
      const field = PASSWORD_ERROR_FIELD[err.code]
      if (field) setErrors({ [field]: err.message })
      else if (Object.keys(err.fieldErrors || {}).length) setErrors(err.fieldErrors)
      else setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user.hasPassword) {
    return (
      <>
        <PageHeader title="Đổi mật khẩu" />
        <Alert tone="info">Tài khoản của bạn chỉ đăng nhập bằng Google nên chưa có mật khẩu. Liên hệ Quản trị viên nếu cần được cấp mật khẩu.</Alert>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Đổi mật khẩu" description={user.email} />
      <Card style={{ maxWidth: 520 }}>
        <CardHeader icon={KeyRound} title="Mật khẩu mới" subtitle={config?.passwordRule} />
        <CardBody>
          <form className="stack" onSubmit={submit} noValidate>
            {formError && <Alert tone="danger">{formError}</Alert>}
            <FormField label="Mật khẩu hiện tại" required error={errors.currentPassword}>
              <PasswordInput name="currentPassword" autoComplete="current-password" maxLength={200} value={form.currentPassword} onChange={set('currentPassword')} />
            </FormField>
            <FormField label="Mật khẩu mới" required error={errors.newPassword} hint={config?.passwordRule}>
              <PasswordInput name="newPassword" autoComplete="new-password" maxLength={200} value={form.newPassword} onChange={set('newPassword')} />
            </FormField>
            <FormField label="Nhập lại mật khẩu mới" required error={errors.confirmPassword}>
              <PasswordInput name="confirmPassword" autoComplete="new-password" maxLength={200} value={form.confirmPassword} onChange={set('confirmPassword')} />
            </FormField>
            <div>
              <Button type="submit" icon={KeyRound} loading={saving}>
                Đổi mật khẩu
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  )
}

export default ChangePasswordPage
