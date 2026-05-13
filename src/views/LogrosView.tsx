import { AchievementCard } from '@/features/logros/AchievementCard'
import type { Achievement } from '@/types/achievement'

interface Props {
  achievements: Achievement[]
  unlockedCount: number
}

export function LogrosView({ achievements, unlockedCount }: Props) {
  void unlockedCount

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {achievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  )
}
