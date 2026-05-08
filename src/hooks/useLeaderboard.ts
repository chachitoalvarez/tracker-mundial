import { useState, useEffect } from 'react'
import * as leaderboardService from '@/services/leaderboard.service'
import type { LeaderboardEntry } from '@/types/user'

export function useLeaderboard(compareFilter: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)

  useEffect(() => {
    setIsLoadingLeaderboard(true)
    const fetch = compareFilter === 'all'
      ? leaderboardService.getGlobalLeaderboard()
      : leaderboardService.getGroupLeaderboard(compareFilter)

    fetch.then(({ data, error }) => {
      if (!error) setLeaderboard(data)
      setIsLoadingLeaderboard(false)
    })
  }, [compareFilter])

  return { leaderboard, isLoadingLeaderboard }
}
