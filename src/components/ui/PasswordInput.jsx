import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Password field with a show/hide toggle. Works inside <FormField>: the id / aria-* props that
// FormField injects are forwarded to the <input>, so the label stays attached to it.
const PasswordInput = ({ className = '', ...inputProps }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className={`password-input ${className}`}>
      <input {...inputProps} className="input" type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="btn btn--ghost btn--icon btn--sm password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  )
}

export default PasswordInput
