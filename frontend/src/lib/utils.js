export const formatCount = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return `${Math.floor(diff)}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(date).toLocaleDateString('vi-VN')
}

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Đã xảy ra lỗi'

export const getAvatarUrl = (url) =>
  url || `https://ui-avatars.com/api/?name=User&background=dbdbdb&color=262626&size=150`
