import { useState, useEffect } from 'react'
import * as leaderboardService from '@/services/leaderboard.service'
import { getTradeMatch } from '@/services/trades.service'
import type { LeaderboardEntry } from '@/types/user'

export function useLeaderboard(compareFilter: string, refreshKey = 0) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false)

  useEffect(() => {
    let cancelled = false

    setIsLoadingLeaderboard(true)
    const fetch = compareFilter === 'all'
      ? leaderboardService.getGlobalLeaderboard()
      : leaderboardService.getGroupLeaderboard(compareFilter)

    fetch.then(async ({ data, error }) => {
      if (cancelled) return
      if (!error) {
        setLeaderboard(data)
        setIsLoadingLeaderboard(false)

        const usersToMatch = data.filter(user => !user.isMe).slice(0, 50)
        const summaries = await Promise.all(
          usersToMatch.map(async user => {
            try {
              const result = await getTradeMatch(String(user.id))
              if (!result.ok) {
                return {
                  id: user.id,
                  tradeSummary: {
                    theyOfferCount: 0,
                    iOfferCount: 0,
                    status: result.reason === 'not_accessible' ? 'not_accessible' as const : 'error' as const,
                  },
                }
              }
              return {
                id: user.id,
                tradeSummary: {
                  theyOfferCount: result.match.theyOfferCount,
                  iOfferCount: result.match.iOfferCount,
                  status: 'ok' as const,
                },
              }
            } catch {
              return {
                id: user.id,
                tradeSummary: {
                  theyOfferCount: 0,
                  iOfferCount: 0,
                  status: 'error' as const,
                },
              }
            }
          })
        )

        if (cancelled) return
        const summaryById = new Map(summaries.map(item => [String(item.id), item.tradeSummary]))
        setLeaderboard(current => current.map(user => ({
          ...user,
          tradeSummary: summaryById.get(String(user.id)) ?? user.tradeSummary,
        })))
      } else {
        setLeaderboard([])
        setIsLoadingLeaderboard(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [compareFilter, refreshKey])

  return { leaderboard, isLoadingLeaderboard }
}
