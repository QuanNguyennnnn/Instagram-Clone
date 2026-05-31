import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import { getErrorMessage } from '../../lib/utils'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-8 mb-3">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-[#262626] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>

          {sent ? (
            <div className="text-center">
              <h2 className="font-semibold text-[#262626] mb-2">Kiểm tra email của bạn</h2>
              <p className="text-sm text-[#8e8e8e]">
                Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-center text-[#262626] mb-2">Quên mật khẩu?</h2>
              <p className="text-sm text-[#8e8e8e] text-center mb-6">
                Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <Input {...register('email')} type="email" placeholder="Email" error={errors.email?.message} />
                <Button type="submit" className="w-full" loading={isSubmitting}>Gửi liên kết đặt lại</Button>
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
