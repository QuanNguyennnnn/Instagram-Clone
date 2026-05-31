import { Link, useNavigate } from 'react-router-dom'
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
  username: z.string().min(3, 'Username 3-30 ký tự').max(30).regex(/^[a-zA-Z0-9_.]+$/, 'Chỉ chứa chữ, số, dấu chấm, gạch dưới'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc').max(50),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    try {
      await authApi.register(values)
      toast.success('Đăng ký thành công! Kiểm tra email để xác thực tài khoản.')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-8 mb-3">
          <h1 className="text-4xl font-bold italic text-center mb-2">Instagram</h1>
          <p className="text-center text-[#8e8e8e] text-sm mb-6 font-semibold">
            Đăng ký để xem ảnh và video của bạn bè.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input {...register('email')} type="email" placeholder="Email" error={errors.email?.message} />
            <Input {...register('username')} placeholder="Tên người dùng" error={errors.username?.message} />
            <Input {...register('fullName')} placeholder="Họ và tên" error={errors.fullName?.message} />
            <Input {...register('password')} type="password" placeholder="Mật khẩu" error={errors.password?.message} />
            <Button type="submit" className="w-full" loading={isSubmitting}>Đăng ký</Button>
          </form>
          <p className="text-xs text-[#8e8e8e] text-center mt-4">
            Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ của chúng tôi.
          </p>
        </div>
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-5 text-center">
          <span className="text-sm">Đã có tài khoản? </span>
          <Link to="/login" className="text-sm font-semibold text-[#0095f6]">Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
