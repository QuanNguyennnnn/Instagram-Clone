import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { postApi } from '../../api/post.api'
import { userApi } from '../../api/user.api'
import { useAuthStore } from '../../stores/authStore'
import { getErrorMessage } from '../../lib/utils'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import PostCard from '../../components/post/PostCard'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import CreatePostModal from '../../components/post/CreatePostModal'

export default function FeedPage() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadInitial()
    loadSuggestions()
  }, [])

  const loadInitial = async () => {
    setLoading(true)
    try {
      const { data } = await postApi.getFeed({ limit: 10 })
      setPosts(data.data.posts)
      setCursor(data.data.nextCursor)
      setHasMore(!!data.data.nextCursor)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (!cursor) return
    try {
      const { data } = await postApi.getFeed({ limit: 10, cursor })
      setPosts((prev) => [...prev, ...data.data.posts])
      setCursor(data.data.nextCursor)
      setHasMore(!!data.data.nextCursor)
    } catch { }
  }, [cursor])

  const loadSuggestions = async () => {
    try {
      const { data } = await userApi.getSuggestions(5)
      setSuggestions(data.data.users || [])
    } catch { }
  }

  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId))
  }

  const handleCreated = (post) => {
    setPosts((prev) => [post, ...prev])
  }

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex gap-8">
      {/* Feed */}
      <div className="flex-1 max-w-[470px] space-y-5">
        {/* Create post prompt */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-white border border-[#dbdbdb] rounded-lg px-4 py-3 flex items-center gap-3 text-sm text-[#8e8e8e] hover:bg-gray-50 transition-colors"
        >
          <Avatar src={user?.avatar} size={32} />
          <span>Bạn đang nghĩ gì?</span>
        </button>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-[#dbdbdb] rounded-lg p-8 text-center">
            <p className="text-[#262626] font-semibold mb-1">Chưa có bài viết nào</p>
            <p className="text-sm text-[#8e8e8e]">Theo dõi người dùng khác để xem bài viết của họ.</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handleDelete} />
            ))}
            <div ref={sentinelRef} className="py-2 flex justify-center">
              {hasMore && <Spinner />}
            </div>
          </>
        )}
      </div>

      {/* Sidebar: user + suggestions */}
      <div className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-6 space-y-6">
          {/* Current user */}
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} size={44} />
            <div>
              <p className="text-sm font-semibold text-[#262626]">{user?.username}</p>
              <p className="text-sm text-[#8e8e8e]">{user?.fullName}</p>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#8e8e8e]">Gợi ý cho bạn</span>
              </div>
              <div className="space-y-3">
                {suggestions.map((s) => (
                  <SuggestionItem key={s._id} user={s} onFollow={() => setSuggestions((prev) => prev.filter((u) => u._id !== s._id))} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </div>
  )
}

function SuggestionItem({ user, onFollow }) {
  const [following, setFollowing] = useState(false)

  const handleFollow = async () => {
    setFollowing(true)
    try {
      await userApi.toggleFollow(user._id)
      onFollow()
    } catch {
      setFollowing(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar src={user.avatar} size={32} />
        <div>
          <p className="text-sm font-semibold text-[#262626] leading-tight">{user.username}</p>
          <p className="text-xs text-[#8e8e8e] leading-tight">{user.fullName}</p>
        </div>
      </div>
      <button
        onClick={handleFollow}
        disabled={following}
        className="text-xs font-semibold text-[#0095f6] hover:text-[#1877f2] disabled:opacity-50"
      >
        Theo dõi
      </button>
    </div>
  )
}
