import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { notificationApi } from '../../api/notification.api'
import { useSocketStore } from '../../stores/socketStore'
import { useSocketEvent } from '../../hooks/useSocket'
import { timeAgo } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'

const NOTIF_LABELS = {
  like: 'đã thích bài viết của bạn.',
  comment: 'đã bình luận về bài viết của bạn.',
  follow: 'đã theo dõi bạn.',
  friend_request: 'đã gửi lời mời kết bạn.',
  friend_accept: 'đã chấp nhận lời mời kết bạn.',
  message: 'đã gửi tin nhắn cho bạn.',
  mention: 'đã đề cập đến bạn trong một bình luận.',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { clearNotifications } = useSocketStore()

  useEffect(() => {
    loadNotifications()
    return () => { clearNotifications() }
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const { data } = await notificationApi.getNotifications({ limit: 50 })
      setNotifications(data.data.notifications)
      await notificationApi.markAllRead()
    } catch { } finally {
      setLoading(false)
    }
  }

  useSocketEvent('notification', (notif) => {
    setNotifications((prev) => [notif, ...prev])
  })

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size={32} /></div>
  )

  return (
    <div className="max-w-[600px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[#262626]">Thông báo</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-[#dbdbdb] rounded-lg p-8 text-center">
          <p className="text-sm text-[#8e8e8e]">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="bg-white border border-[#dbdbdb] rounded-lg divide-y divide-[#dbdbdb]">
          {notifications.map((n) => (
            <NotificationItem key={n._id} notification={n} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n }) {
  const sender = n.sender
  const isUnread = !n.isRead

  const getLink = () => {
    if (n.post) return `/p/${n.post._id || n.post}`
    if (n.type === 'follow' || n.type === 'friend_request' || n.type === 'friend_accept') return `/${sender?.username}`
    if (n.type === 'message') return `/messages`
    return '/'
  }

  return (
    <Link
      to={getLink()}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/30' : ''}`}
    >
      <div className="relative shrink-0">
        <Avatar src={sender?.avatar} size={40} />
        <span className="absolute -bottom-1 -right-1 text-base">
          {n.type === 'like' ? '❤️' :
           n.type === 'comment' ? '💬' :
           n.type === 'follow' ? '👤' :
           n.type === 'friend_request' ? '🤝' :
           n.type === 'friend_accept' ? '✅' :
           n.type === 'message' ? '✉️' :
           n.type === 'mention' ? '💬' : '🔔'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#262626]">
          <span className="font-semibold">{sender?.username}</span>
          {' '}{NOTIF_LABELS[n.type] || 'đã tương tác với bạn.'}
        </p>
        <p className="text-xs text-[#8e8e8e] mt-0.5">{timeAgo(n.createdAt)}</p>
      </div>
      {n.post?.media?.[0] && (
        <img src={n.post.media[0].url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
      )}
      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-[#0095f6] shrink-0 mt-2" />
      )}
    </Link>
  )
}
