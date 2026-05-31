import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Grid3x3, Settings, UserPlus, UserMinus, UserCheck, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { userApi } from '../../api/user.api'
import { friendApi } from '../../api/friend.api'
import { postApi } from '../../api/post.api'
import { messageApi } from '../../api/message.api'
import { useAuthStore } from '../../stores/authStore'
import { formatCount, getErrorMessage } from '../../lib/utils'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'

export default function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: me, setUser } = useAuthStore()
  const isOwnProfile = me?.username === username

  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)

  useEffect(() => {
    setLoading(true)
    setPosts([])
    setCursor(null)
    setHasMore(true)
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    try {
      const { data } = await userApi.getUserProfile(username)
      setProfile(data.data.user)
      setEditData({ fullName: data.data.user.fullName, bio: data.data.user.bio || '' })
      loadPosts(data.data.user._id)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async (userId, cur = null) => {
    setPostsLoading(true)
    try {
      const { data } = await postApi.getPostsByUser(userId, { limit: 12, cursor: cur })
      setPosts((prev) => cur ? [...prev, ...data.data.posts] : data.data.posts)
      setCursor(data.data.nextCursor)
      setHasMore(!!data.data.nextCursor)
    } catch { } finally {
      setPostsLoading(false)
    }
  }

  const loadMore = useCallback(async () => {
    if (!profile || !cursor) return
    loadPosts(profile._id, cursor)
  }, [profile, cursor])

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, postsLoading)

  const handleFollow = async () => {
    if (!profile) return
    setActionLoading(true)
    try {
      await userApi.toggleFollow(profile._id)
      setProfile((p) => ({
        ...p,
        isFollowing: !p.isFollowing,
        followerCount: p.isFollowing ? p.followerCount - 1 : p.followerCount + 1,
      }))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleFriendAction = async () => {
    if (!profile) return
    setActionLoading(true)
    try {
      if (profile.friendshipStatus === 'friends') {
        await friendApi.removeFriend(profile._id)
        setProfile((p) => ({ ...p, friendshipStatus: 'none' }))
      } else if (profile.friendshipStatus === 'none') {
        await friendApi.sendRequest(profile._id)
        setProfile((p) => ({ ...p, friendshipStatus: 'pending_sent' }))
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleMessage = async () => {
    try {
      const { data } = await messageApi.getOrCreateConversation(profile._id)
      navigate(`/messages/${data.data.conversation._id}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleSaveProfile = async () => {
    setActionLoading(true)
    try {
      const { data } = await userApi.updateProfile(editData)
      setUser(data.data.user)
      setProfile(data.data.user)
      setEditMode(false)
      toast.success('Đã cập nhật hồ sơ')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { data } = await userApi.uploadAvatar(file)
      setUser(data.data.user)
      setProfile(data.data.user)
      toast.success('Đã cập nhật ảnh đại diện')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>
  if (!profile) return null

  const friendBtnLabel = {
    friends: 'Bạn bè',
    pending_sent: 'Đã gửi yêu cầu',
    pending_received: 'Phản hồi',
    none: 'Kết bạn',
  }[profile.friendshipStatus || 'none']

  return (
    <div className="max-w-[935px] mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar src={profile.avatar} size={96} />
          {isOwnProfile && (
            <label className="absolute inset-0 rounded-full cursor-pointer overflow-hidden hover:bg-black/20 transition-colors flex items-center justify-center group">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-semibold text-center leading-tight">Đổi ảnh</span>
            </label>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editMode ? (
            <div className="space-y-3 max-w-sm">
              <input
                value={editData.fullName}
                onChange={(e) => setEditData((d) => ({ ...d, fullName: e.target.value }))}
                className="w-full text-sm border border-[#dbdbdb] rounded-lg px-3 py-2 outline-none focus:border-[#a8a8a8]"
                placeholder="Họ và tên"
              />
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData((d) => ({ ...d, bio: e.target.value }))}
                rows={3}
                maxLength={150}
                className="w-full text-sm border border-[#dbdbdb] rounded-lg px-3 py-2 outline-none focus:border-[#a8a8a8] resize-none"
                placeholder="Tiểu sử"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveProfile} disabled={actionLoading} className="px-4 py-1.5 bg-[#0095f6] text-white text-sm font-semibold rounded-lg hover:bg-[#1877f2] disabled:opacity-60">
                  Lưu
                </button>
                <button onClick={() => setEditMode(false)} className="px-4 py-1.5 bg-gray-100 text-[#262626] text-sm font-semibold rounded-lg hover:bg-gray-200">
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-xl font-light text-[#262626]">{profile.username}</h1>
                {isOwnProfile ? (
                  <button onClick={() => setEditMode(true)} className="px-4 py-1.5 bg-gray-100 text-[#262626] text-sm font-semibold rounded-lg hover:bg-gray-200 flex items-center gap-2">
                    <Settings size={14} /> Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleFollow}
                      disabled={actionLoading}
                      className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 ${profile.isFollowing ? 'bg-gray-100 text-[#262626] hover:bg-gray-200' : 'bg-[#0095f6] text-white hover:bg-[#1877f2]'}`}
                    >
                      {profile.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                    </button>
                    <button
                      onClick={handleFriendAction}
                      disabled={actionLoading || profile.friendshipStatus === 'pending_sent'}
                      className="px-4 py-1.5 bg-gray-100 text-[#262626] text-sm font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-60 flex items-center gap-1"
                    >
                      {profile.friendshipStatus === 'friends' ? <UserCheck size={14} /> : <UserPlus size={14} />}
                      {friendBtnLabel}
                    </button>
                    <button onClick={handleMessage} className="px-3 py-1.5 bg-gray-100 text-[#262626] rounded-lg hover:bg-gray-200">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-4">
                <div className="text-center sm:text-left">
                  <span className="text-sm font-semibold text-[#262626]">{formatCount(profile.postCount || 0)}</span>
                  <span className="text-sm text-[#262626] ml-1">bài viết</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-sm font-semibold text-[#262626]">{formatCount(profile.followerCount || 0)}</span>
                  <span className="text-sm text-[#262626] ml-1">người theo dõi</span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-sm font-semibold text-[#262626]">{formatCount(profile.followingCount || 0)}</span>
                  <span className="text-sm text-[#262626] ml-1">đang theo dõi</span>
                </div>
              </div>

              {/* Bio */}
              <div>
                <p className="text-sm font-semibold text-[#262626]">{profile.fullName}</p>
                {profile.bio && <p className="text-sm text-[#262626] whitespace-pre-wrap">{profile.bio}</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts tab */}
      <div className="border-t border-[#dbdbdb] pt-4">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#262626] border-t-2 border-[#262626] -mt-4 pt-3 px-2">
            <Grid3x3 size={14} />
            BÀI VIẾT
          </div>
        </div>

        {postsLoading && posts.length === 0 ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#8e8e8e]">
            <Grid3x3 size={40} strokeWidth={1} />
            <p className="text-sm">Chưa có bài viết nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  to={`/p/${post._id}`}
                  className="relative bg-black overflow-hidden group"
                  style={{ aspectRatio: '1/1' }}
                >
                  {post.media?.[0] ? (
                    <img src={post.media[0].url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
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
              ))}
            </div>
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {hasMore && <Spinner />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
