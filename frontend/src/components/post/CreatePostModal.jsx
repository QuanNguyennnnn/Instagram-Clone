import { useState, useRef } from 'react'
import { ImagePlus, X, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { postApi } from '../../api/post.api'
import { aiApi } from '../../api/ai.api'
import { getErrorMessage } from '../../lib/utils'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function CreatePostModal({ isOpen, onClose, onCreated }) {
  const [content, setContent] = useState('')
  const [privacy, setPrivacy] = useState('public')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiCaptions, setAiCaptions] = useState([])
  const fileRef = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10)
    setFiles(selected)
    setPreviews(selected.map((f) => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video') ? 'video' : 'image' })))
  }

  const handleGenerateCaption = async () => {
    if (!files[0] || !files[0].type.startsWith('image')) {
      return toast.error('Chọn ảnh trước để tạo caption AI')
    }
    setAiLoading(true)
    try {
      const { data } = await aiApi.generateCaption(files[0])
      setAiCaptions(data.data.captions)
      const tags = data.data.hashtags.map((t) => `#${t}`).join(' ')
      setContent((prev) => prev + (prev ? '\n' : '') + tags)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !files.length) return toast.error('Bài viết phải có nội dung hoặc ảnh')
    setLoading(true)
    try {
      const { data } = await postApi.createPost({ content, privacy, media: files })
      toast.success('Đăng bài thành công!')
      onCreated?.(data.data.post)
      handleClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setContent(''); setFiles([]); setPreviews([]); setAiCaptions([])
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tạo bài viết" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Media preview */}
        {previews.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
            {previews.map((p, i) => (
              <div key={i} className="relative aspect-square bg-black">
                {p.type === 'video'
                  ? <video src={p.url} className="w-full h-full object-cover" />
                  : <img src={p.url} alt="" className="w-full h-full object-cover" />
                }
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="w-full aspect-video border-2 border-dashed border-[#dbdbdb] rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <ImagePlus size={36} className="text-[#8e8e8e]" />
            <span className="text-sm text-[#8e8e8e]">Thêm ảnh / video (tối đa 10)</span>
          </button>
        )}
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />

        {/* AI captions */}
        {aiCaptions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8e8e8e]">Gợi ý caption AI:</p>
            {aiCaptions.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setContent(c + '\n' + content.split('\n').filter(l => l.startsWith('#')).join(' '))}
                className="w-full text-left text-sm p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Caption input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Viết caption..."
          rows={4}
          className="w-full text-sm p-3 border border-[#dbdbdb] rounded-lg resize-none outline-none focus:border-[#a8a8a8] placeholder:text-[#8e8e8e]"
          maxLength={2200}
        />
        <div className="flex items-center justify-between text-xs text-[#8e8e8e]">
          <span>{content.length}/2200</span>
        </div>

        {/* Privacy + Actions */}
        <div className="flex items-center justify-between gap-3">
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value)}
            className="text-sm border border-[#dbdbdb] rounded-lg px-3 py-2 outline-none bg-white"
          >
            <option value="public">Công khai</option>
            <option value="friends">Bạn bè</option>
            <option value="private">Riêng tư</option>
          </select>
          <div className="flex gap-2">
            {files[0]?.type.startsWith('image') && (
              <Button type="button" variant="outline" size="sm" onClick={handleGenerateCaption} loading={aiLoading}>
                <Sparkles size={14} /> AI Caption
              </Button>
            )}
            <Button type="submit" size="sm" loading={loading}>Đăng bài</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
