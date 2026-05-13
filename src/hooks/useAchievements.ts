import { useMemo, useRef, useEffect } from 'react'
import type { AlbumSection, AlbumStats } from '@/types/album'
import type { Achievement } from '@/types/achievement'

export function useAchievements(
  albumData: AlbumSection[],
  stats: AlbumStats,
  isLoadingAlbum: boolean,
  triggerCelebration: (type: 'sticker' | 'achievement' | 'match', msg: string, icon: string) => void
) {
  const achievements = useMemo((): Achievement[] => {
    const completedSectionsCount = albumData.filter(s => {
      const unique = Object.values(s.collected).filter(v => v > 0).length
      return unique === s.needed
    }).length

    const hasAllSectionsStarted = albumData.every(
      s => Object.values(s.collected).filter(v => v > 0).length > 0
    )

    return [
      { id: 'first_sticker', title: 'Primeros Pasos', description: 'Pega tu primera figurita en el álbum.', icon: 'star', progress: Math.min(stats.totalCompleted, 1), total: 1, unlocked: stats.totalCompleted >= 1, color: 'text-amber-500', bg: 'bg-amber-100' },
      { id: 'collector_25', title: 'Coleccionista Novato', description: 'Alcanza el 25% del álbum completado.', icon: 'piechart', progress: Math.min(stats.percentage, 25), total: 25, unlocked: stats.percentage >= 25, color: 'text-blue-500', bg: 'bg-blue-100' },
      { id: 'collector_50', title: 'A Mitad de Camino', description: 'Alcanza el 50% del álbum completado.', icon: 'piechart', progress: Math.min(stats.percentage, 50), total: 50, unlocked: stats.percentage >= 50, color: 'text-indigo-500', bg: 'bg-indigo-100' },
      { id: 'team_complete', title: '¡Equipo Completo!', description: 'Completa todas las figuritas de al menos 1 país.', icon: 'check', progress: completedSectionsCount, total: 1, unlocked: completedSectionsCount >= 1, color: 'text-emerald-500', bg: 'bg-emerald-100' },
      { id: 'repeated_king', title: 'Rey del Canje', description: 'Acumula 50 figuritas repetidas para intercambiar.', icon: 'layers', progress: Math.min(stats.totalRepeated, 50), total: 50, unlocked: stats.totalRepeated >= 50, color: 'text-purple-500', bg: 'bg-purple-100' },
      { id: 'world_tour', title: 'Gira Mundial', description: 'Consigue al menos 1 figurita de cada sección.', icon: 'globe', progress: albumData.filter(s => Object.values(s.collected).filter(v => v > 0).length > 0).length, total: albumData.length, unlocked: hasAllSectionsStarted, color: 'text-pink-500', bg: 'bg-pink-100' },
      { id: 'collector_100', title: 'Leyenda del Mundial', description: '¡Completa el álbum al 100%!', icon: 'trophy', progress: stats.percentage, total: 100, unlocked: stats.percentage === 100, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    ]
  }, [stats, albumData])

  // null = not yet initialized (waiting for album to load from Supabase)
  const previousUnlockedIdsRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    // Don't initialize until album data has loaded from Supabase
    if (isLoadingAlbum) return

    const currentUnlocked = new Set(achievements.filter(a => a.unlocked).map(a => a.id))

    // First time with real data: seed the ref, do NOT celebrate
    if (previousUnlockedIdsRef.current === null) {
      previousUnlockedIdsRef.current = currentUnlocked
      return
    }

    // Detect locked → unlocked transitions
    const prev = previousUnlockedIdsRef.current
    for (const id of currentUnlocked) {
      if (!prev.has(id)) {
        const achievement = achievements.find(a => a.id === id)
        if (achievement) {
          triggerCelebration('achievement', `¡Nueva Medalla Desbloqueada!\n${achievement.title}`, achievement.icon)
        }
      }
    }

    previousUnlockedIdsRef.current = currentUnlocked
  }, [achievements, isLoadingAlbum, triggerCelebration])

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return { achievements, unlockedCount }
}
