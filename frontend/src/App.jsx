import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { useSocketStore } from './stores/socketStore'

import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'

import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/Auth/ResetPasswordPage'
import VerifyEmailPage from './pages/Auth/VerifyEmailPage'

import FeedPage from './pages/Feed/FeedPage'
import ExplorePage from './pages/Explore/ExplorePage'
import ProfilePage from './pages/Profile/ProfilePage'
import PostDetailPage from './pages/Post/PostDetailPage'
import MessagesPage from './pages/Messages/MessagesPage'
import FriendsPage from './pages/Friends/FriendsPage'
import SearchPage from './pages/Search/SearchPage'
import NotificationsPage from './pages/Notifications/NotificationsPage'
import SavedPage from './pages/Saved/SavedPage'
import AdminPage from './pages/Admin/AdminPage'

export default function App() {
  const { user, accessToken } = useAuthStore()
  const { connect, disconnect } = useSocketStore()

  useEffect(() => {
    if (user && accessToken) {
      connect(accessToken)
    } else {
      disconnect()
    }
  }, [user, accessToken])

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<MessagesPage />} />
            <Route path="/p/:postId" element={<PostDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/:username" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
