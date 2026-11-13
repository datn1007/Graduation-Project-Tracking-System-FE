import React, { useState } from 'react'
import { LogIn } from 'lucide-react'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import PasswordInput from '../../../components/ui/PasswordInput'
import { Alert } from '../../../components/ui/Misc'
import { useAuth } from '../../../hooks/useAuth'
import { isValidEmail } from '../../../utils/validation'

// POST /auth/login. Unknown email, Google-only account and wrong password all return the same
// 401 AUTH_INVALID_CREDENTIALS — we just show the Backend's `detail`.
const PasswordLoginForm = ({ disabled }) => {
  const { signInPassword } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    const email = form.email.trim().toLowerCase()
    const next = {}
    if (!email) next.email = 'Vui lòng nhập email.'
    else if (!isValidEmail(email)) next.email = 'Email không hợp lệ.'
    if (!form.password) next.password = 'Vui lòng nhập mật khẩu.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    setFormError(null)
    try {
      await signInPassword(email, form.password)
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message)
      setForm((f) => ({ ...f, password: '' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="login-form" onSubmit={submit} noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <FormField label="Email" required error={errors.email}>
        <input
          className="input"
          type="email"
          name="email"
          autoComplete="username"
          placeholder="ten@example.com"
          value={form.email}
          onChange={set('email')}
          disabled={busy || disabled}
        />
      </FormField>
      <FormField label="Mật khẩu" required error={errors.password}>
        <PasswordInput name="password" autoComplete="current-password" value={form.password} onChange={set('password')} disabled={busy || disabled} />
      </FormField>
      <Button type="submit" size="lg" block icon={LogIn} loading={busy} disabled={disabled}>
        Đăng nhập
      </Button>
      <p className="text-small text-muted">Quên mật khẩu? Liên hệ Quản trị viên để được cấp lại.</p>
    </form>
  )
}

export default PasswordLoginForm
