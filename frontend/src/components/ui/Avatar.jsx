import { getAvatarUrl } from '../../lib/utils'

export default function Avatar({ src, alt = 'avatar', size = 32, className = '' }) {
  return (
    <img
      src={getAvatarUrl(src)}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-gray-100 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => { e.target.src = getAvatarUrl(null) }}
    />
  )
}
