import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { postApi } from '../../api/post.api'
import { useAuthStore } from '../../stores/authStore'
import { getErrorMessage, timeAgo } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import MediaCarousel from '../../components/post/MediaCarousel'
import CommentSection from '../../components/post/CommentSection'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    loadPost()
  }, [postId])

  const loadPost = async () => {
    setLoading(true)
    try {
      const { data } = await postApi.getPostById(postId)
      setPost(data.data.post)
    } catch (err) {
      toast.error(getErrorMessage(err))
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Xóa bài viết này?')) return
    try {
      await postApi.deletePost(postId)
      toast.success('Đã xóa bài viết')
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size={32} /></div>
  )

  if (!post) return null

  const isOwn = user?._id === post.author?._id

  return (
    <div className="max-w-[935px] mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#262626] mb-4 hover:text-gray-500">
        <ArrowLeft size={20} />
        <span>Quay lại</span>
      </button>

      <div className="bg-white border border-[#dbdbdb] rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Media side */}
        {post.media?.length > 0 && (
          <div className="md:w-1/2 shrink-0 bg-black">
            <MediaCarousel media={post.media} />
          </div>
        )}

        {/* Content side */}
        <div className={`flex flex-col ${post.media?.length > 0 ? 'md:w-1/2' : 'w-full'} min-h-[500px]`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
            <Link to={`/${post.author?.username}`} className="flex items-center gap-3">
              <Avatar src={post.author?.avatar} size={32} />
              <div>
                <p className="text-sm font-semibold text-[#262626]">{post.author?.username}</p>
                {post.location && <p className="text-xs text-[#8e8e8e]">{post.location}</p>}
              </div>
            </Link>

            {isOwn && (
              <div className="relative">
                <button onClick={() => setShowMenu((v) => !v)} className="p-1 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal size={20} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-white border border-[#dbdbdb] rounded-lg shadow-lg z-10 min-w-[140px]">
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#ed4956] hover:bg-gray-50"
                    >
                      <Trash2 size={16} />
                      Xóa bài viết
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Caption */}
          {post.content && (
            <div className="px-4 py-3 border-b border-[#dbdbdb]">
              <p className="text-sm text-[#262626] whitespace-pre-wrap">
                <Link to={`/${post.author?.username}`} className="font-semibold mr-1">{post.author?.username}</Link>
                {post.content}
              </p>
              <p className="text-xs text-[#8e8e8e] mt-1">{timeAgo(post.createdAt)}</p>
              {post.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {post.hashtags.map((tag) => (
                    <Link key={tag} to={`/search?q=%23${tag}&type=hashtags`} className="text-xs text-[#0095f6] hover:underline">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="flex-1">
            <CommentSection postId={postId} />
          </div>
        </div>
      </div>
    </div>
  )
}
