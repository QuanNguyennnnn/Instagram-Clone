import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar />
      <main className="md:pl-[72px] xl:pl-60 pb-16 md:pb-0 min-h-screen">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
