import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import { getErrorMessage } from '../../lib/utils'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }) => {
    try {
      await authApi.resetPassword(token, { password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-8 mb-3">
          <h1 className="text-4xl font-bold italic text-center mb-6">Instagram</h1>

          {done ? (
            <div className="text-center">
              <p className="text-sm text-[#262626] font-semibold mb-2">Mật khẩu đã được đặt lại!</p>
              <p className="text-sm text-[#8e8e8e]">Đang chuyển hướng về trang đăng nhập...</p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-center text-[#262626] mb-2">Tạo mật khẩu mới</h2>
              <p className="text-sm text-[#8e8e8e] text-center mb-6">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <Input {...register('password')} type="password" placeholder="Mật khẩu mới" error={errors.password?.message} />
                <Input {...register('confirmPassword')} type="password" placeholder="Xác nhận mật khẩu" error={errors.confirmPassword?.message} />
                <Button type="submit" className="w-full" loading={isSubmitting}>Đặt lại mật khẩu</Button>
              </form>
            </>
          )}
        </div>

        <div className="bg-white border border-[#dbdbdb] rounded-lg p-5 text-center">
          <Link to="/login" className="text-sm font-semibold text-[#262626]">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
