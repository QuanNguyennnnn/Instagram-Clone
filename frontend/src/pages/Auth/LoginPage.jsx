import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/authStore'
import { getErrorMessage } from '../../lib/utils'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
})

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    try {
      const { data } = await authApi.login(values)
      setAuth(data.data.user, data.data.accessToken)
      toast.success('Đăng nhập thành công!')
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-8 mb-3">
          <h1 className="text-4xl font-bold italic text-center mb-8">Instagram</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input
              {...register('email')}
              type="email"
              placeholder="Email"
              error={errors.email?.message}
              autoComplete="email"
            />
            <Input
              {...register('password')}
              type="password"
              placeholder="Mật khẩu"
              error={errors.password?.message}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Đăng nhập
            </Button>
          </form>
          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-[#dbdbdb]" />
            <span className="px-3 text-xs font-semibold text-[#8e8e8e]">HOẶC</span>
            <div className="flex-1 h-px bg-[#dbdbdb]" />
          </div>
          <div className="text-center">
            <Link to="/forgot-password" className="text-sm font-semibold text-[#0095f6]">
              Quên mật khẩu?
            </Link>
          </div>
        </div>
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-5 text-center">
          <span className="text-sm text-[#262626]">Chưa có tài khoản? </span>
          <Link to="/register" className="text-sm font-semibold text-[#0095f6]">
            Đăng ký
          </Link>
        </div>
      </div>
    </div>
  )
}
