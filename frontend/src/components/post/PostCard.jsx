import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Send, Pencil, Trash2, Flag } from 'lucide-react'
import toast from 'react-hot-toast'
import { postApi } from '../../api/post.api'
import { useAuthStore } from '../../stores/authStore'
import { formatCount, timeAgo, getErrorMessage } from '../../lib/utils'
import Avatar from '../ui/Avatar'
import MediaCarousel from './MediaCarousel'
import ReportModal from './ReportModal'

export default function PostCard({ post: initialPost, onDelete }) {
  const [post, setPost] = useState(initialPost)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [editLoading, setEditLoading] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const menuRef = useRef()
  const { user } = useAuthStore()
  const isOwn = user?._id === post.author?._id

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLike = async () => {
    const prev = { liked: post.isLiked, count: post.likeCount }
    setPost((p) => ({ ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }))
    try {
      const { data } = await postApi.toggleLike(post._id)
      setPost((p) => ({ ...p, likeCount: data.data.likeCount }))
    } catch {
      setPost((p) => ({ ...p, isLiked: prev.liked, likeCount: prev.count }))
    }
  }

  const handleSave = async () => {
    const prev = post.isSaved
    setPost((p) => ({ ...p, isSaved: !p.isSaved }))
    try {
      await postApi.toggleSave(post._id)
    } catch {
      setPost((p) => ({ ...p, isSaved: prev }))
    }
  }

  const handleDelete = async () => {
    if (!confirm('Xóa bài viết này?')) return
    setMenuOpen(false)
    try {
      await postApi.deletePost(post._id)
      onDelete?.(post._id)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return
    setEditLoading(true)
    try {
      const { data } = await postApi.updatePost(post._id, { content: editContent })
      setPost((p) => ({ ...p, content: data.data.post.content }))
      setEditing(false)
      toast.success('Đã cập nhật bài viết')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <article className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/${post.author?.username}`} className="flex items-center gap-3">
          <Avatar src={post.author?.avatar} size={32} />
          <div>
            <p className="text-sm font-semibold text-[#262626] hover:text-gray-600 leading-tight">
              {post.author?.username}
            </p>
            {post.location && <p className="text-xs text-[#8e8e8e] leading-tight">{post.location}</p>}
          </div>
        </Link>

        {/* Menu */}
        <div className="flex items-center gap-2" ref={menuRef}>
          <span className="text-xs text-[#8e8e8e]">{timeAgo(post.createdAt)}</span>
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="p-1 hover:bg-gray-100 rounded-full">
              <MoreHorizontal size={18} className="text-[#262626]" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-[#dbdbdb] rounded-xl shadow-lg z-20 min-w-40 py-1 overflow-hidden">
                {isOwn ? (
                  <>
                    <button
                      onClick={() => { setEditing(true); setEditContent(post.content || ''); setMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#262626] hover:bg-gray-50"
                    >
                      <Pencil size={14} /> Chỉnh sửa
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#ed4956] hover:bg-gray-50"
                    >
                      <Trash2 size={14} /> Xóa bài viết
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setReportOpen(true); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#ed4956] hover:bg-gray-50"
                  >
                    <Flag size={14} /> Báo cáo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media */}
      {post.media?.length > 0 && <MediaCarousel media={post.media} />}

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform hover:scale-110 active:scale-95">
              <Heart size={24} className={post.isLiked ? 'fill-[#ed4956] text-[#ed4956]' : 'text-[#262626]'} />
            </button>
            <Link to={`/p/${post._id}`}>
              <MessageCircle size={24} className="text-[#262626] hover:text-gray-500" />
            </Link>
            <button>
              <Send size={24} className="text-[#262626] hover:text-gray-500" />
            </button>
          </div>
          <button onClick={handleSave} className="transition-transform hover:scale-110">
            <Bookmark size={24} className={post.isSaved ? 'fill-[#262626] text-[#262626]' : 'text-[#262626]'} />
          </button>
        </div>

        {post.likeCount > 0 && (
          <p className="text-sm font-semibold text-[#262626] mb-1">{formatCount(post.likeCount)} lượt thích</p>
        )}

        {/* Caption — edit mode hoặc display */}
        {editing ? (
          <div className="mb-2 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              maxLength={2200}
              className="w-full text-sm border border-[#dbdbdb] rounded-lg px-3 py-2 outline-none focus:border-[#a8a8a8] resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={editLoading}
                className="px-3 py-1.5 bg-[#0095f6] text-white text-xs font-semibold rounded-lg hover:bg-[#1877f2] disabled:opacity-60"
              >
                {editLoading ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-gray-100 text-[#262626] text-xs font-semibold rounded-lg hover:bg-gray-200">
                Huỷ
              </button>
            </div>
          </div>
        ) : post.content ? (
          <p className="text-sm text-[#262626] mb-1 line-clamp-2">
            <Link to={`/${post.author?.username}`} className="font-semibold mr-1">{post.author?.username}</Link>
            <CaptionText content={post.content} />
          </p>
        ) : null}

        {post.commentCount > 0 && (
          <Link to={`/p/${post._id}`} className="text-sm text-[#8e8e8e] hover:text-gray-600">
            Xem tất cả {formatCount(post.commentCount)} bình luận
          </Link>
        )}

        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {post.hashtags.map((tag) => (
              <Link key={tag} to={`/search?q=%23${tag}&type=hashtags`} className="text-xs text-[#0095f6] hover:underline">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} postId={post._id} />
    </article>
  )
}

function CaptionText({ content }) {
  return content.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@') ? (
      <Link key={i} to={`/${part.slice(1)}`} className="text-[#0095f6] font-medium">{part}</Link>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}
