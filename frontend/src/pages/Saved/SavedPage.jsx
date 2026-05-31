import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { postApi } from '../../api/post.api'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import Spinner from '../../components/ui/Spinner'

export default function SavedPage() {
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitial()
  }, [])

  const loadInitial = async () => {
    setLoading(true)
    try {
      const { data } = await postApi.getSavedPosts({ limit: 30 })
      setPosts(data.data.posts)
      setCursor(data.data.nextCursor)
      setHasMore(!!data.data.nextCursor)
    } catch { } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (!cursor) return
    try {
      const { data } = await postApi.getSavedPosts({ limit: 30, cursor })
      setPosts((prev) => [...prev, ...data.data.posts])
      setCursor(data.data.nextCursor)
      setHasMore(!!data.data.nextCursor)
    } catch { }
  }, [cursor])

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading)

  return (
    <div className="max-w-[935px] mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Bookmark size={20} className="fill-[#262626] text-[#262626]" />
        <h1 className="text-xl font-semibold text-[#262626]">Đã lưu</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full border-2 border-[#262626] flex items-center justify-center">
            <Bookmark size={28} />
          </div>
          <h3 className="text-xl font-semibold text-[#262626]">Lưu</h3>
          <p className="text-sm text-[#8e8e8e] text-center max-w-xs">
            Lưu ảnh và video mà bạn muốn xem lại. Chỉ bạn mới thấy nội dung đã lưu.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post) => (
              <SavedCell key={post._id} post={post} />
            ))}
          </div>
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {hasMore && <Spinner />}
          </div>
        </>
      )}
    </div>
  )
}

function SavedCell({ post }) {
  const thumb = post.media?.[0]

  return (
    <Link
      to={`/p/${post._id}`}
      className="relative bg-black overflow-hidden group"
      style={{ aspectRatio: '1/1' }}
    >
      {thumb ? (
        <img src={thumb.url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
      ) : (
        <div className="w-full h-full bg-[#efefef] flex items-center justify-center p-2">
          <span className="text-xs text-[#8e8e8e] text-center line-clamp-4">{post.content}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <span className="text-white text-sm font-semibold">❤ {post.likeCount}</span>
        <span className="text-white text-sm font-semibold">💬 {post.commentCount}</span>
      </div>
    </Link>
  )
}
