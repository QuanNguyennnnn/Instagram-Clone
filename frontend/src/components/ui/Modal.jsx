import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} bg-white rounded-xl shadow-2xl z-10 max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
            <h3 className="text-sm font-semibold text-[#262626]">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
