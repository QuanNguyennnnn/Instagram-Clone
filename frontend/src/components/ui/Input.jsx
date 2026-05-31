import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-[#262626]">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-3 py-2 text-sm bg-[#fafafa] border rounded-md outline-none transition-colors
        border-[#dbdbdb] placeholder:text-[#8e8e8e]
        focus:border-[#a8a8a8] focus:bg-white
        disabled:opacity-50 ${error ? 'border-[#ed4956]' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-[#ed4956]">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
