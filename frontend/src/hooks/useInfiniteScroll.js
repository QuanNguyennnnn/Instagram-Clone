import { useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll(onLoadMore, hasMore, isLoading) {
  const observerRef = useRef(null)
  const sentinelRef = useRef(null)

  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        onLoadMore()
      }
    },
    [onLoadMore, hasMore, isLoading]
  )

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(handleIntersect, { threshold: 0.1 })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [handleIntersect])

  return sentinelRef
}
