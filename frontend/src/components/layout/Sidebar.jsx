import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Compass, MessageCircle, Bell, Bookmark, UserRound, Users, LogOut, PlusSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import { useSocketStore } from '../../stores/socketStore'
import { authApi } from '../../api/auth.api'
import Avatar from '../ui/Avatar'
import { useState } from 'react'
import CreatePostModal from '../post/CreatePostModal'

const navItems = [
  { to: '/', icon: Home, label: 'Trang chủ' },
  { to: '/search', icon: Search, label: 'Tìm kiếm' },
  { to: '/explore', icon: Compass, label: 'Khám phá' },
  { to: '/messages', icon: MessageCircle, label: 'Tin nhắn' },
  { to: '/notifications', icon: Bell, label: 'Thông báo' },
  { to: '/friends', icon: Users, label: 'Bạn bè' },
  { to: '/saved', icon: Bookmark, label: 'Đã lưu' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const { disconnect, unreadCount } = useSocketStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { }
    logout()
    disconnect()
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-[72px] xl:w-60 h-screen fixed left-0 top-0 border-r border-[#dbdbdb] bg-white px-3 py-6 z-40">
        {/* Logo */}
        <div className="px-3 mb-8">
          <span className="hidden xl:block text-2xl font-bold italic">Instagram</span>
          <span className="xl:hidden text-2xl">📸</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50 text-[#262626]'}`
              }
            >
              <div className="relative">
                <Icon size={24} />
                {label === 'Thông báo' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ed4956] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:block">{label}</span>
            </NavLink>
          ))}

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 text-[#262626] transition-colors"
          >
            <PlusSquare size={24} />
            <span className="hidden xl:block">Tạo bài viết</span>
          </button>
        </nav>

        {/* Profile + Logout */}
        <div className="flex flex-col gap-1">
          <NavLink
            to={`/${user?.username}`}
            className={({ isActive }) =>
              `flex items-center gap-4 px-3 py-3 rounded-lg transition-colors
              ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`
            }
          >
            <Avatar src={user?.avatar} size={24} />
            <span className="hidden xl:block text-sm font-medium">{user?.username}</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-3 py-3 rounded-lg text-sm hover:bg-gray-50 text-[#262626] transition-colors"
          >
            <LogOut size={24} />
            <span className="hidden xl:block">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <CreatePostModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </>
  )
}
