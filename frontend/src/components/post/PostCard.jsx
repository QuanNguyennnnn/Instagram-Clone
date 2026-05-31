import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { postApi } from '../../api/post.api'
import { useAuthStore } from '../../stores/authStore'
import { formatCount, timeAgo, getErrorMessage } from '../../lib/utils'
import Avatar from '../ui/Avatar'
import MediaCarousel from './MediaCarousel'

export default function PostCard({ post: initialPost, onDelete }) {
  const [post, setPost] = useState(initialPost)
  const { user } = useAuthStore()

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

  const isOwn = user?._id === post.author?._id

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
            {post.location && (
              <p className="text-xs text-[#8e8e8e] leading-tight">{post.location}</p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8e8e8e]">{timeAgo(post.createdAt)}</span>
          {isOwn && (
            <button className="p-1 hover:bg-gray-100 rounded-full" onClick={() => onDelete?.(post._id)}>
              <MoreHorizontal size={18} className="text-[#262626]" />
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      {post.media?.length > 0 && <MediaCarousel media={post.media} />}

      {/* Actions */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform hover:scale-110 active:scale-95">
              <Heart
                size={24}
                className={post.isLiked ? 'fill-[#ed4956] text-[#ed4956]' : 'text-[#262626]'}
              />
            </button>
            <Link to={`/p/${post._id}`}>
              <MessageCircle size={24} className="text-[#262626] hover:text-gray-500" />
            </Link>
            <button>
              <Send size={24} className="text-[#262626] hover:text-gray-500" />
            </button>
          </div>
          <button onClick={handleSave} className="transition-transform hover:scale-110">
            <Bookmark
              size={24}
              className={post.isSaved ? 'fill-[#262626] text-[#262626]' : 'text-[#262626]'}
            />
          </button>
        </div>

        {/* Like count */}
        {post.likeCount > 0 && (
          <p className="text-sm font-semibold text-[#262626] mb-1">
            {formatCount(post.likeCount)} lượt thích
          </p>
        )}

        {/* Caption */}
        {post.content && (
          <p className="text-sm text-[#262626] mb-1 line-clamp-2">
            <Link to={`/${post.author?.username}`} className="font-semibold mr-1">
              {post.author?.username}
            </Link>
            <CaptionText content={post.content} />
          </p>
        )}

        {/* Comment count */}
        {post.commentCount > 0 && (
          <Link to={`/p/${post._id}`} className="text-sm text-[#8e8e8e] hover:text-gray-600">
            Xem tất cả {formatCount(post.commentCount)} bình luận
          </Link>
        )}

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {post.hashtags.map((tag) => (
              <Link
                key={tag}
                to={`/search?q=%23${tag}&type=hashtags`}
                className="text-xs text-[#0095f6] hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function CaptionText({ content }) {
  return content.split(/(@\w+)/g).map((part, i) =>
    part.startsWith('@') ? (
      <Link key={i} to={`/${part.slice(1)}`} className="text-[#0095f6] font-medium">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}
