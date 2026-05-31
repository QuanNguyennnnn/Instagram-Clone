import { NavLink } from 'react-router-dom'
import { Home, Search, Compass, MessageCircle, UserRound } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const navItems = [
  { to: '/', icon: Home },
  { to: '/search', icon: Search },
  { to: '/explore', icon: Compass },
  { to: '/messages', icon: MessageCircle },
]

export default function MobileNav() {
  const { user } = useAuthStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#dbdbdb] z-40 flex items-center justify-around px-2 py-2 safe-pb">
      {navItems.map(({ to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `p-2 rounded-lg transition-colors ${isActive ? 'text-black' : 'text-[#8e8e8e]'}`
          }
        >
          <Icon size={26} />
        </NavLink>
      ))}
      <NavLink
        to={`/${user?.username}`}
        className={({ isActive }) =>
          `p-1 rounded-full border-2 transition-colors ${isActive ? 'border-black' : 'border-transparent'}`
        }
      >
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username}&size=26`}
          alt="profile"
          className="w-6 h-6 rounded-full object-cover"
        />
      </NavLink>
    </nav>
  )
}
