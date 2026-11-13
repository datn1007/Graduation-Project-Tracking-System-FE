import React, { useState } from 'react'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { LogIn } from 'lucide-react'
import Button from '../../../components/ui/Button'

// Google Identity Services, authorization-code flow (README BE §5.3). The code is exchanged by the
// Backend (redirect_uri = postmessage); the Calendar scope lets the Backend sync bookings.
// No hosted_domain hint: since BE v1.2.0 any Google account the admin added (Gmail included) may sign in.
const CodeFlowButton = ({ onCode, onError, disabled }) => {
  const [pending, setPending] = useState(false)
  const login = useGoogleLogin({
    flow: 'auth-code',
    scope: 'openid email profile https://www.googleapis.com/auth/calendar.events',
    onSuccess: async ({ code }) => {
      try {
        await onCode(code)
      } finally {
        setPending(false)
      }
    },
    onError: (error) => {
      setPending(false)
      onError(error)
    },
    onNonOAuthError: (error) => {
      // popup closed / blocked
      setPending(false)
      if (error?.type !== 'popup_closed') onError(error)
    },
  })

  return (
    <Button
      size="lg"
      block
      icon={LogIn}
      loading={pending}
      disabled={disabled}
      onClick={() => {
        setPending(true)
        login()
      }}
    >
      Đăng nhập bằng Google
    </Button>
  )
}

const GoogleLoginButton = ({ clientId, ...props }) => (
  <GoogleOAuthProvider clientId={clientId}>
    <CodeFlowButton {...props} />
  </GoogleOAuthProvider>
)

export default GoogleLoginButton
