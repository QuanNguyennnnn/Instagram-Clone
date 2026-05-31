import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { postApi } from '../../api/post.api'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import Spinner from '../../components/ui/Spinner'

export default function ExplorePage() {
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
      const { data } = await postApi.getExplore({ limit: 30 })
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
      const { data } = await postApi.getExplore({ limit: 30, cursor })
      setPosts((prev) => [...prev, ...data.data.posts])
      setCursor(data.data.nextCursor)
      setHasMore(!!data.data.nextCursor)
    } catch { }
  }, [cursor])

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading)

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size={32} /></div>
  )

  return (
    <div className="max-w-[935px] mx-auto px-4 py-6">
      {posts.length === 0 ? (
        <p className="text-center text-[#8e8e8e] py-12">Chưa có bài viết nào để khám phá</p>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {posts.map((post, i) => (
            <ExploreCell key={post._id} post={post} featured={i % 7 === 0} />
          ))}
        </div>
      )}
      <div ref={sentinelRef} className="py-4 flex justify-center">
        {hasMore && <Spinner />}
      </div>
    </div>
  )
}

function ExploreCell({ post, featured }) {
  const thumb = post.media?.[0]
  const isVideo = thumb?.type === 'video'

  return (
    <Link
      to={`/p/${post._id}`}
      className={`relative bg-black overflow-hidden group ${featured ? 'col-span-2 row-span-2' : ''}`}
      style={{ aspectRatio: '1/1' }}
    >
      {thumb ? (
        isVideo ? (
          <video src={thumb.url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
        ) : (
          <img src={thumb.url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
        )
      ) : (
        <div className="w-full h-full bg-[#efefef] flex items-center justify-center">
          <span className="text-xs text-[#8e8e8e] text-center px-2 line-clamp-3">{post.content}</span>
        </div>
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <span className="text-white text-sm font-semibold">❤ {post.likeCount}</span>
        <span className="text-white text-sm font-semibold">💬 {post.commentCount}</span>
      </div>

      {/* Indicators */}
      {post.media?.length > 1 && (
        <div className="absolute top-2 right-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white drop-shadow">
            <path d="M2 6a2 2 0 012-2h9a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm13 0v9a2 2 0 01-2 2h9a2 2 0 002-2V6a2 2 0 00-2-2h-9z" />
          </svg>
        </div>
      )}
      {isVideo && !post.media?.length > 1 && (
        <div className="absolute top-2 right-2">
          <Play size={20} className="text-white drop-shadow fill-white" />
        </div>
      )}
    </Link>
  )
}
