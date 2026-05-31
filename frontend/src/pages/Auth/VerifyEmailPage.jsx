import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authApi } from '../../api/auth.api'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-[#dbdbdb] rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold italic mb-6">Instagram</h1>

        {status === 'loading' && (
          <p className="text-sm text-[#8e8e8e]">Đang xác thực email...</p>
        )}

        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-semibold text-[#262626] mb-2">Email đã được xác thực!</h2>
            <p className="text-sm text-[#8e8e8e] mb-6">Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay.</p>
            <Link to="/login" className="inline-block px-6 py-2 bg-[#0095f6] text-white text-sm font-semibold rounded-lg hover:bg-[#1877f2]">
              Đăng nhập
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="font-semibold text-[#262626] mb-2">Link không hợp lệ</h2>
            <p className="text-sm text-[#8e8e8e] mb-6">Link xác thực đã hết hạn hoặc không đúng. Hãy đăng ký lại.</p>
            <Link to="/register" className="inline-block px-6 py-2 bg-[#0095f6] text-white text-sm font-semibold rounded-lg hover:bg-[#1877f2]">
              Đăng ký lại
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
