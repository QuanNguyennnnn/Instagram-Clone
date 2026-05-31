import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { commentApi } from '../../api/comment.api'
import { useAuthStore } from '../../stores/authStore'
import { timeAgo, getErrorMessage } from '../../lib/utils'
import Avatar from '../ui/Avatar'
import Spinner from '../ui/Spinner'

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const { user } = useAuthStore()
  const inputRef = useRef()

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      const { data } = await commentApi.getComments(postId)
      setComments(data.data.comments)
    } catch { } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || submitting) return

    setSubmitting(true)
    try {
      const payload = { content }
      if (replyTo) payload.parentCommentId = replyTo.id
      const { data } = await commentApi.createComment(postId, payload)
      const newComment = data.data.comment

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === replyTo.id ? { ...c, replies: [...(c.replies || []), newComment], replyCount: c.replyCount + 1 } : c
          )
        )
      } else {
        setComments((prev) => [newComment, ...prev])
      }
      setContent('')
      setReplyTo(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId) => {
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
          : c
      )
    )
    await commentApi.toggleLike(commentId).catch(() => {})
  }

  const handleDelete = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c._id !== commentId))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>

  return (
    <div className="flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 max-h-80">
        {comments.length === 0 && (
          <p className="text-sm text-[#8e8e8e] text-center py-4">Chưa có bình luận nào</p>
        )}
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            currentUser={user}
            onLike={handleLike}
            onDelete={handleDelete}
            onReply={(id, username) => {
              setReplyTo({ id, username })
              setContent(`@${username} `)
              inputRef.current?.focus()
            }}
            postId={postId}
          />
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-[#dbdbdb] px-4 py-3">
        {replyTo && (
          <div className="text-xs text-[#8e8e8e] mb-1 flex items-center gap-2">
            Đang trả lời <span className="font-semibold text-[#262626]">@{replyTo.username}</span>
            <button onClick={() => { setReplyTo(null); setContent('') }} className="text-[#0095f6]">Huỷ</button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <Avatar src={user?.avatar} size={28} />
          <input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Thêm bình luận..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#8e8e8e]"
          />
          {content.trim() && (
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold text-[#0095f6] hover:text-[#1877f2] disabled:opacity-50"
            >
              {submitting ? '...' : 'Đăng'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

function CommentItem({ comment, currentUser, onLike, onDelete, onReply, postId }) {
  const [showReplies, setShowReplies] = useState(false)
  const [replies, setReplies] = useState([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const isOwn = currentUser?._id === comment.author?._id

  const loadReplies = async () => {
    if (showReplies) { setShowReplies(false); return }
    setLoadingReplies(true)
    try {
      const { data } = await commentApi.getReplies(comment._id)
      setReplies(data.data.replies)
      setShowReplies(true)
    } catch { } finally {
      setLoadingReplies(false)
    }
  }

  return (
    <div>
      <div className="flex gap-3">
        <Link to={`/${comment.author?.username}`}>
          <Avatar src={comment.author?.avatar} size={28} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">
            <Link to={`/${comment.author?.username}`} className="font-semibold mr-1">
              {comment.author?.username}
            </Link>
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-[#8e8e8e]">{timeAgo(comment.createdAt)}</span>
            {comment.likeCount > 0 && (
              <span className="text-xs text-[#8e8e8e] font-semibold">{comment.likeCount} thích</span>
            )}
            <button
              onClick={() => onReply(comment._id, comment.author?.username)}
              className="text-xs text-[#8e8e8e] font-semibold hover:text-[#262626]"
            >
              Trả lời
            </button>
            {isOwn && (
              <button
                onClick={() => onDelete(comment._id)}
                className="text-xs text-[#ed4956] font-semibold"
              >
                Xóa
              </button>
            )}
          </div>
          {comment.replyCount > 0 && (
            <button
              onClick={loadReplies}
              className="flex items-center gap-1 text-xs text-[#8e8e8e] font-semibold mt-1 hover:text-[#262626]"
            >
              <div className="h-px w-5 bg-[#dbdbdb]" />
              {loadingReplies ? 'Đang tải...' : showReplies ? 'Ẩn trả lời' : `Xem ${comment.replyCount} trả lời`}
            </button>
          )}
          {showReplies && (
            <div className="mt-2 space-y-2 pl-2 border-l-2 border-[#dbdbdb]">
              {replies.map((reply) => (
                <div key={reply._id} className="flex gap-2">
                  <Link to={`/${reply.author?.username}`}>
                    <Avatar src={reply.author?.avatar} size={22} />
                  </Link>
                  <div>
                    <p className="text-sm leading-snug">
                      <Link to={`/${reply.author?.username}`} className="font-semibold mr-1">
                        {reply.author?.username}
                      </Link>
                      {reply.content}
                    </p>
                    <span className="text-xs text-[#8e8e8e]">{timeAgo(reply.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => onLike(comment._id)} className="shrink-0 self-start mt-1">
          <Heart
            size={14}
            className={comment.isLiked ? 'fill-[#ed4956] text-[#ed4956]' : 'text-[#8e8e8e]'}
          />
        </button>
      </div>
    </div>
  )
}
