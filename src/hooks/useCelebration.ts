import { useState, useEffect, useCallback } from 'react'

export interface Celebration {
  id: number
  type: 'sticker' | 'achievement' | 'match'
  message: string
  icon: string
}

export function useCelebration() {
  const [queue, setQueue] = useState<Celebration[]>([])
  const [current, setCurrent] = useState<Celebration | null>(null)

  // Pop next item from queue when current slot is free
  useEffect(() => {
    if (current !== null || queue.length === 0) return
    const [next, ...rest] = queue
    setCurrent(next)
    setQueue(rest)
  }, [current, queue])

  // Auto-dismiss current after 3s
  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => setCurrent(null), 3000)
    return () => clearTimeout(timer)
  }, [current])

  const triggerCelebration = useCallback((type: Celebration['type'], message: string, icon: string) => {
    setQueue(prev => [...prev, { id: Date.now(), type, message, icon }])
  }, [])

  return { celebration: current, triggerCelebration }
}
