import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { CalendarCheck, ChartColumn, GraduationCap, RefreshCw, SquareKanban } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useMeta } from '../../../hooks/useMeta'
import { ENV } from '../../../constants/env'
import { getErrorMessage } from '../../../services/apiClient'
import Button from '../../../components/ui/Button'
import { Alert } from '../../../components/ui/Misc'
import { LoadingState } from '../../../components/ui/States'
import GoogleLoginButton from '../components/GoogleLoginButton'
import PasswordLoginForm from '../components/PasswordLoginForm'
import '../auth.scss'

// Login methods follow GET /meta/config (README BE §6.4): email + password (passwordLoginEnabled),
// Google (googleLoginEnabled + client id).
const LoginPage = () => {
  const { status, error: sessionError, sessionExpired, signInGoogle } = useAuth()
  const meta = useMeta()
  const location = useLocation()
  const [googleError, setGoogleError] = useState(null)

  if (status === 'loading' || (meta.loading && !meta.config)) {
    return (
      <div className="fullscreen-center">
        <LoadingState label="Đang kết nối hệ thống…" />
      </div>
    )
  }
  if (status === 'authenticated') return <Navigate to={location.state?.from || '/'} replace />

  const config = meta.config
  // Informational only (BE v1.2.0): unknown emails of these domains are auto-registered as STUDENT on
  // their first Google sign-in. Other accounts must be added by an admin. The FE never blocks by domain.
  const autoDomains = config?.autoRegisterEmailDomains || []
  const googleClientId = config?.googleClientId || ENV.googleClientId
  const showGoogle = !!(config?.googleLoginEnabled && googleClientId)
  const showPassword = config?.passwordLoginEnabled !== false

  const handleGoogleCode = async (code) => {
    setGoogleError(null)
    try {
      await signInGoogle(code)
    } catch (err) {
      setGoogleError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-hero" aria-hidden="true">
        <div className="auth-hero__brand">
          <GraduationCap />
          <span>GPTS</span>
        </div>
        <h2>Đặt lịch hướng dẫn và theo dõi tiến độ đồ án tốt nghiệp trên một nền tảng duy nhất.</h2>
        <ul>
          <li>
            <CalendarCheck /> Đặt lịch gặp giảng viên, tự động xác nhận, không trùng lịch
          </li>
          <li>
            <SquareKanban /> Theo dõi milestone hằng tuần theo mô hình Kanban
          </li>
          <li>
            <ChartColumn /> Giáo vụ Khoa nắm bắt tiến độ toàn bộ đồ án theo thời gian thực
          </li>
        </ul>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h1>Đăng nhập</h1>
          <p className="text-muted">Dùng email và mật khẩu, hoặc tài khoản Google đã được Quản trị viên cấp quyền.</p>

          <div className="stack">
            {sessionExpired && <Alert tone="warning">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</Alert>}
            {sessionError && <Alert tone="danger">{getErrorMessage(sessionError)}</Alert>}

            {meta.error && !config && (
              <Alert tone="danger" title="Không kết nối được Backend">
                {getErrorMessage(meta.error)}
                <div style={{ marginTop: 8 }}>
                  <Button variant="secondary" size="sm" icon={RefreshCw} onClick={meta.reload}>
                    Thử lại
                  </Button>
                </div>
              </Alert>
            )}

            {config && showPassword && <PasswordLoginForm />}

            {config && showGoogle && (
              <>
                {showPassword && <div className="auth-divider">hoặc</div>}
                {googleError && <Alert tone="danger">{googleError}</Alert>}
                <GoogleLoginButton
                  clientId={googleClientId}
                  onCode={handleGoogleCode}
                  onError={() => setGoogleError('Không thể mở cửa sổ đăng nhập Google. Vui lòng thử lại.')}
                />
              </>
            )}

            {config && !showPassword && !showGoogle && (
              <Alert tone="warning">Máy chủ chưa bật phương thức đăng nhập nào. Vui lòng liên hệ quản trị viên.</Alert>
            )}
          </div>
          <p className="auth-card__note">
            {autoDomains.length > 0 &&
              `Email ${autoDomains.map((d) => `@${d}`).join(', ')} đăng nhập Google lần đầu sẽ tự được tạo tài khoản sinh viên. `}
            Tài khoản khác cần Quản trị viên thêm trước. Quyền truy cập theo vai trò được gán.
          </p>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
