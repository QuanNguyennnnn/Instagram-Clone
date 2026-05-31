import { useState } from 'react'
import { Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { reportApi } from '../../api/report.api'
import { getErrorMessage } from '../../lib/utils'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'hate_speech', label: 'Ngôn từ thù ghét' },
  { value: 'violence', label: 'Bạo lực' },
  { value: 'nudity', label: 'Nội dung nhạy cảm / khiêu dâm' },
  { value: 'misinformation', label: 'Thông tin sai lệch' },
  { value: 'harassment', label: 'Quấy rối / bắt nạt' },
  { value: 'other', label: 'Lý do khác' },
]

export default function ReportModal({ isOpen, onClose, postId }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!reason) return toast.error('Vui lòng chọn lý do')
    setLoading(true)
    try {
      await reportApi.createReport({ targetId: postId, targetType: 'post', reason, description })
      setDone(true)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDescription('')
    setDone(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Báo cáo bài viết" maxWidth="max-w-sm">
      <div className="p-4">
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-[#262626]">Cảm ơn bạn đã báo cáo</p>
            <p className="text-sm text-[#8e8e8e] mt-1 mb-4">Chúng tôi sẽ xem xét và xử lý vi phạm này.</p>
            <Button onClick={handleClose} className="w-full">Đóng</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#8e8e8e] mb-4">Tại sao bạn muốn báo cáo bài viết này?</p>
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left text-sm px-4 py-3 rounded-lg border transition-colors ${
                    reason === r.value
                      ? 'border-[#262626] bg-gray-50 font-semibold'
                      : 'border-[#dbdbdb] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{r.label}</span>
                    {reason === r.value && <div className="w-4 h-4 rounded-full bg-[#262626]" />}
                  </div>
                </button>
              ))}
            </div>
            {reason && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thêm mô tả (tuỳ chọn)..."
                rows={3}
                maxLength={500}
                className="w-full text-sm border border-[#dbdbdb] rounded-lg px-3 py-2 outline-none focus:border-[#a8a8a8] resize-none mb-4"
              />
            )}
            <Button onClick={handleSubmit} loading={loading} className="w-full" disabled={!reason}>
              <Flag size={14} /> Gửi báo cáo
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
