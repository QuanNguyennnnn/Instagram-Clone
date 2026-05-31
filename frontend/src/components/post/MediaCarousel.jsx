import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function MediaCarousel({ media }) {
  const [index, setIndex] = useState(0)

  if (!media?.length) return null

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(media.length - 1, i + 1))
  const current = media[index]

  return (
    <div className="relative w-full bg-black select-none" style={{ aspectRatio: '1/1' }}>
      {current.type === 'video' ? (
        <video
          src={current.url}
          controls
          className="w-full h-full object-contain"
        />
      ) : (
        <img
          src={current.url}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
      )}

      {media.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {index < media.length - 1 && (
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          )}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {media.map((_, i) => (
              <div
                key={i}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-colors ${i === index ? 'bg-[#0095f6]' : 'bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
