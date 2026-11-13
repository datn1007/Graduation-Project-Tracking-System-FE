import React from 'react'
import { Badge } from '../../../components/ui/Badge'
import { formatDateTime } from '../../../utils/format'

// How a user can sign in (BE v1.2.0): password if `hasPassword`; Google is always allowed for an
// added account, `googleLinked` tells whether they have actually signed in with Google yet.
const SignInMethods = ({ user }) => (
  <div className="row" style={{ gap: 4 }}>
    {user.hasPassword && (
      <Badge tone="primary" title={user.passwordChangedAt ? `Đổi mật khẩu lần cuối ${formatDateTime(user.passwordChangedAt)}` : undefined}>
        Mật khẩu
      </Badge>
    )}
    {user.googleLinked ? (
      <Badge tone="success">Google (đã liên kết)</Badge>
    ) : (
      <Badge title="Được phép đăng nhập Google nhưng chưa đăng nhập lần nào">Google (chưa liên kết)</Badge>
    )}
  </div>
)

export default SignInMethods
