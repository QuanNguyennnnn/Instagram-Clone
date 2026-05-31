import Spinner from './Spinner'

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#0095f6] text-white hover:bg-[#1877f2] active:bg-[#0077cc]',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    outline: 'border border-[#dbdbdb] text-[#262626] bg-white hover:bg-gray-50',
    danger: 'bg-[#ed4956] text-white hover:bg-red-600',
    ghost: 'text-[#262626] hover:bg-gray-100',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-6 py-3',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={14} className="border-t-white" />}
      {children}
    </button>
  )
}
