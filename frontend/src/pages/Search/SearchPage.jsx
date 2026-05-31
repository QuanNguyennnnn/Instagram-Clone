import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Hash } from 'lucide-react'
import { searchApi } from '../../api/search.api'
import { postApi } from '../../api/post.api'
import { userApi } from '../../api/user.api'
import { friendApi } from '../../api/friend.api'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../../lib/utils'

const TYPES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'users', label: 'Người dùng' },
  { id: 'hashtags', label: 'Hashtag' },
  { id: 'posts', label: 'Bài viết' },
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const initialType = searchParams.get('type') || 'all'

  const [query, setQuery] = useState(initialQ)
  const [type, setType] = useState(initialType)
  const [results, setResults] = useState({ users: [], posts: [], hashtags: [] })
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(false)
  const [hashtagPosts, setHashtagPosts] = useState([])
  const [hashtagCursor, setHashtagCursor] = useState(null)
  const [hashtagHasMore, setHashtagHasMore] = useState(false)
  const [hashtagLoading, setHashtagLoading] = useState(false)
  const debounceRef = useRef()

  useEffect(() => {
    searchApi.getTrendingHashtags(8).then(({ data }) => setTrending(data.data.hashtags || []))
  }, [])

  useEffect(() => {
    if (!initialQ) return
    doSearch(initialQ, initialType)
  }, [])

  const doSearch = useCallback(async (q, t) => {
    if (!q.trim()) { setResults({ users: [], posts: [], hashtags: [] }); return }

    if (t === 'hashtags' || (t === 'all' && q.startsWith('#'))) {
      const tag = q.replace('#', '').trim()
      loadHashtagPosts(tag)
      return
    }

    setLoading(true)
    try {
      const { data } = await searchApi.search(q, t === 'all' ? undefined : t)
      setResults(data.data)
    } catch { } finally {
      setLoading(false)
    }
  }, [])

  const loadHashtagPosts = async (tag, cur = null) => {
    setHashtagLoading(true)
    try {
      const { data } = await postApi.getPostsByHashtag(tag, { limit: 30, cursor: cur })
      if (cur) {
        setHashtagPosts((prev) => [...prev, ...data.data.posts])
      } else {
        setHashtagPosts(data.data.posts)
      }
      setHashtagCursor(data.data.nextCursor)
      setHashtagHasMore(!!data.data.nextCursor)
    } catch { } finally {
      setHashtagLoading(false)
    }
  }

  const handleSearch = (q, t = type) => {
    setQuery(q)
    setSearchParams({ q, type: t })
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q, t), 400)
  }

  const handleTypeChange = (t) => {
    setType(t)
    setHashtagPosts([])
    setSearchParams({ q: query, type: t })
    doSearch(query, t)
  }

  const hashtagSentinelRef = useInfiniteScroll(
    () => loadHashtagPosts(query.replace('#', '').trim(), hashtagCursor),
    hashtagHasMore,
    hashtagLoading
  )

  const isHashtagSearch = type === 'hashtags' || (type === 'all' && query.startsWith('#'))

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6">
      {/* Search input */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e8e]" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Tìm kiếm..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#efefef] rounded-lg text-sm outline-none placeholder:text-[#8e8e8e] focus:ring-1 focus:ring-[#dbdbdb]"
        />
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#dbdbdb]">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTypeChange(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${type === t.id ? 'text-[#262626] border-b-2 border-[#262626]' : 'text-[#8e8e8e] hover:text-[#262626]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Trending hashtags when no query */}
      {!query && (
        <div>
          <p className="text-sm font-semibold text-[#262626] mb-3">Đang thịnh hành</p>
          <div className="flex flex-wrap gap-2">
            {trending.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleSearch(`#${tag.name}`, 'hashtags')}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#efefef] rounded-full text-sm font-semibold text-[#262626] hover:bg-gray-200"
              >
                <Hash size={14} />#{tag.name}
                {tag.count > 0 && <span className="text-xs text-[#8e8e8e] ml-1">{tag.count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="flex justify-center py-12"><Spinner size={32} /></div>}

      {/* Hashtag posts grid */}
      {!loading && isHashtagSearch && hashtagPosts.length > 0 && (
        <div>
          <p className="text-sm text-[#8e8e8e] mb-3">{hashtagPosts.length}+ bài viết</p>
          <div className="grid grid-cols-3 gap-1">
            {hashtagPosts.map((post) => (
              <Link key={post._id} to={`/p/${post._id}`} className="relative bg-black overflow-hidden group" style={{ aspectRatio: '1/1' }}>
                {post.media?.[0] ? (
                  <img src={post.media[0].url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-[#efefef] flex items-center justify-center p-2">
                    <span className="text-xs text-[#8e8e8e] text-center line-clamp-3">{post.content}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
          <div ref={hashtagSentinelRef} className="py-4 flex justify-center">
            {hashtagHasMore && <Spinner />}
          </div>
        </div>
      )}

      {/* Users results */}
      {!loading && !isHashtagSearch && (type === 'all' || type === 'users') && results.users?.length > 0 && (
        <div className="mb-6">
          {type === 'all' && <p className="text-sm font-semibold text-[#262626] mb-3">Người dùng</p>}
          <div className="space-y-1">
            {results.users.map((u) => <UserRow key={u._id} user={u} />)}
          </div>
        </div>
      )}

      {/* Hashtag results */}
      {!loading && !isHashtagSearch && (type === 'all' || type === 'hashtags') && results.hashtags?.length > 0 && (
        <div className="mb-6">
          {type === 'all' && <p className="text-sm font-semibold text-[#262626] mb-3">Hashtag</p>}
          <div className="space-y-1">
            {results.hashtags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleSearch(`#${tag.name}`, 'hashtags')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="w-10 h-10 bg-[#efefef] rounded-full flex items-center justify-center shrink-0">
                  <Hash size={18} className="text-[#262626]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#262626]">#{tag.name}</p>
                  <p className="text-xs text-[#8e8e8e]">{tag.count} bài viết</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Posts results */}
      {!loading && !isHashtagSearch && (type === 'all' || type === 'posts') && results.posts?.length > 0 && (
        <div>
          {type === 'all' && <p className="text-sm font-semibold text-[#262626] mb-3">Bài viết</p>}
          <div className="grid grid-cols-3 gap-1">
            {results.posts.map((post) => (
              <Link key={post._id} to={`/p/${post._id}`} className="relative bg-black overflow-hidden group" style={{ aspectRatio: '1/1' }}>
                {post.media?.[0] ? (
                  <img src={post.media[0].url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-[#efefef] flex items-center justify-center p-2">
                    <span className="text-xs text-[#8e8e8e] text-center line-clamp-3">{post.content}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {!loading && query && !isHashtagSearch && results.users?.length === 0 && results.hashtags?.length === 0 && results.posts?.length === 0 && (
        <p className="text-sm text-[#8e8e8e] text-center py-8">Không tìm thấy kết quả nào cho "{query}"</p>
      )}
    </div>
  )
}

function UserRow({ user }) {
  const [status, setStatus] = useState(user.friendshipStatus || 'none')

  const handleFriend = async () => {
    try {
      if (status === 'none') {
        await friendApi.sendRequest(user._id)
        setStatus('pending_sent')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
      <Link to={`/${user.username}`} className="flex items-center gap-3">
        <Avatar src={user.avatar} size={44} />
        <div>
          <p className="text-sm font-semibold text-[#262626]">{user.username}</p>
          <p className="text-xs text-[#8e8e8e]">{user.fullName}</p>
          {user.mutualFriends > 0 && (
            <p className="text-xs text-[#8e8e8e]">{user.mutualFriends} bạn chung</p>
          )}
        </div>
      </Link>
      {status === 'none' && (
        <button onClick={handleFriend} className="text-xs font-semibold text-[#0095f6] hover:text-[#1877f2]">
          Kết bạn
        </button>
      )}
      {status === 'pending_sent' && (
        <span className="text-xs text-[#8e8e8e]">Đã gửi</span>
      )}
      {status === 'friends' && (
        <span className="text-xs text-[#8e8e8e] font-semibold">Bạn bè</span>
      )}
    </div>
  )
}
