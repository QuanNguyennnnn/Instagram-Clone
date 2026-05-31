import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UserCheck, UserX, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { friendApi } from '../../api/friend.api'
import { getErrorMessage } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'

const TABS = [
  { id: 'requests', label: 'Lời mời kết bạn' },
  { id: 'suggestions', label: 'Gợi ý' },
  { id: 'friends', label: 'Bạn bè' },
]

export default function FriendsPage() {
  const [tab, setTab] = useState('requests')
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reqRes, sugRes] = await Promise.all([
        friendApi.getFriendRequests(),
        friendApi.getSuggestions(20),
      ])
      setRequests(reqRes.data.data.requests)
      setSuggestions(sugRes.data.data.users)
    } catch { } finally {
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    if (friends.length > 0) return
    try {
      const { data } = await friendApi.getFriends('me')
      setFriends(data.data.friends)
    } catch { }
  }

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'friends') loadFriends()
  }

  const handleAccept = async (requestId) => {
    try {
      await friendApi.acceptRequest(requestId)
      setRequests((prev) => prev.filter((r) => r._id !== requestId))
      toast.success('Đã chấp nhận lời mời kết bạn')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDecline = async (requestId) => {
    try {
      await friendApi.declineRequest(requestId)
      setRequests((prev) => prev.filter((r) => r._id !== requestId))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleAddFriend = async (userId) => {
    try {
      await friendApi.sendRequest(userId)
      setSuggestions((prev) => prev.filter((u) => u._id !== userId))
      toast.success('Đã gửi lời mời kết bạn')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleRemoveFriend = async (userId) => {
    try {
      await friendApi.removeFriend(userId)
      setFriends((prev) => prev.filter((f) => f._id !== userId))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="max-w-[935px] mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-[#262626] mb-4">Bạn bè</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#dbdbdb]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? 'text-[#262626] border-b-2 border-[#262626]' : 'text-[#8e8e8e] hover:text-[#262626]'}`}
          >
            {t.label}
            {t.id === 'requests' && requests.length > 0 && (
              <span className="ml-1.5 bg-[#ed4956] text-white text-xs rounded-full px-1.5 py-0.5">{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : (
        <>
          {/* Friend Requests */}
          {tab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <p className="text-sm text-[#8e8e8e] text-center py-8">Không có lời mời kết bạn nào</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      onAccept={() => handleAccept(req._id)}
                      onDecline={() => handleDecline(req._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {tab === 'suggestions' && (
            <div>
              {suggestions.length === 0 ? (
                <p className="text-sm text-[#8e8e8e] text-center py-8">Không có gợi ý nào</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.map((user) => (
                    <SuggestionCard
                      key={user._id}
                      user={user}
                      onAdd={() => handleAddFriend(user._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friends list */}
          {tab === 'friends' && (
            <div>
              {friends.length === 0 ? (
                <p className="text-sm text-[#8e8e8e] text-center py-8">Chưa có bạn bè nào</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend) => (
                    <FriendCard
                      key={friend._id}
                      friend={friend}
                      onRemove={() => handleRemoveFriend(friend._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RequestCard({ request, onAccept, onDecline }) {
  const sender = request.sender || request
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-lg p-4 flex flex-col gap-3">
      <Link to={`/${sender.username}`} className="flex items-center gap-3">
        <Avatar src={sender.avatar} size={48} />
        <div>
          <p className="text-sm font-semibold text-[#262626]">{sender.username}</p>
          <p className="text-xs text-[#8e8e8e]">{sender.fullName}</p>
        </div>
      </Link>
      <div className="flex gap-2">
        <button onClick={onAccept} className="flex-1 py-1.5 bg-[#0095f6] text-white text-sm font-semibold rounded-lg hover:bg-[#1877f2] flex items-center justify-center gap-1">
          <UserCheck size={14} /> Chấp nhận
        </button>
        <button onClick={onDecline} className="flex-1 py-1.5 bg-gray-100 text-[#262626] text-sm font-semibold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1">
          <UserX size={14} /> Từ chối
        </button>
      </div>
    </div>
  )
}

function SuggestionCard({ user, onAdd }) {
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-lg p-4 flex flex-col gap-3">
      <Link to={`/${user.username}`} className="flex items-center gap-3">
        <Avatar src={user.avatar} size={48} />
        <div>
          <p className="text-sm font-semibold text-[#262626]">{user.username}</p>
          <p className="text-xs text-[#8e8e8e]">{user.fullName}</p>
          {user.mutualFriends > 0 && (
            <p className="text-xs text-[#8e8e8e]">{user.mutualFriends} bạn chung</p>
          )}
        </div>
      </Link>
      <button onClick={onAdd} className="w-full py-1.5 bg-[#0095f6] text-white text-sm font-semibold rounded-lg hover:bg-[#1877f2] flex items-center justify-center gap-1">
        <UserPlus size={14} /> Kết bạn
      </button>
    </div>
  )
}

function FriendCard({ friend, onRemove }) {
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-lg p-4 flex flex-col gap-3">
      <Link to={`/${friend.username}`} className="flex items-center gap-3">
        <Avatar src={friend.avatar} size={48} />
        <div>
          <p className="text-sm font-semibold text-[#262626]">{friend.username}</p>
          <p className="text-xs text-[#8e8e8e]">{friend.fullName}</p>
        </div>
      </Link>
      <button onClick={onRemove} className="w-full py-1.5 bg-gray-100 text-[#262626] text-sm font-semibold rounded-lg hover:bg-gray-200">
        Hủy kết bạn
      </button>
    </div>
  )
}
