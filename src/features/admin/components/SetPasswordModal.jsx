import React, { useState } from 'react'
import { KeyRound } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import PasswordInput from '../../../components/ui/PasswordInput'
import { Alert } from '../../../components/ui/Misc'
import { useMeta } from '../../../hooks/useMeta'
import { useToast } from '../../../hooks/useToast'
import { checkNewPassword } from '../../../utils/validation'
import { setUserPassword } from '../admin.service'

// PUT /users/{id}/password — grants a password to a Google-only account or resets a forgotten one.
// The user is signed out of every session (README BE §5.4a).
const SetPasswordModal = ({ user, onClose, onSaved }) => {
  const { config } = useMeta()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const policyError = checkNewPassword(password, config)
    if (policyError) return setError(policyError)
    setSaving(true)
    setError(null)
    try {
      const saved = await setUserPassword(user.id, password)
      toast.success(`Đã ${user.hasPassword ? 'đặt lại' : 'cấp'} mật khẩu cho ${user.fullName}.`)
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err.fieldErrors?.newPassword || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={saving}
      title={user.hasPassword ? 'Đặt lại mật khẩu' : 'Cấp mật khẩu'}
      description={`${user.fullName} · ${user.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button type="submit" form="set-password-form" icon={KeyRound} loading={saving}>
            Lưu mật khẩu
          </Button>
        </>
      }
    >
      <form id="set-password-form" className="stack" onSubmit={submit} noValidate>
        <Alert tone="warning">Người dùng sẽ bị đăng xuất khỏi mọi phiên. Hãy gửi mật khẩu mới cho họ qua kênh an toàn.</Alert>
        <FormField label="Mật khẩu mới" required error={error} hint={config?.passwordRule}>
          <PasswordInput autoComplete="new-password" maxLength={200} value={password} onChange={(e) => setPassword(e.target.value)} data-autofocus />
        </FormField>
      </form>
    </Modal>
  )
}

export default SetPasswordModal
