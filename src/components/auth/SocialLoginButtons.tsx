import { Loader2 } from 'lucide-react'

interface Props {
  loadingProvider: 'google' | 'apple' | null
  disabled?: boolean
  onGoogleClick: () => void
  onAppleClick: () => void
}

export function SocialLoginButtons({
  loadingProvider,
  disabled = false,
  onGoogleClick,
  onAppleClick,
}: Props) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onGoogleClick}
        disabled={disabled || !!loadingProvider}
        className="w-full bg-white border border-zinc-200 text-zinc-900 font-bold py-3.5 px-4 rounded-2xl hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'google'
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <span className="text-lg leading-none font-black">G</span>}
        Continuar con Google
      </button>
      <button
        type="button"
        onClick={onAppleClick}
        disabled={disabled || !!loadingProvider}
        className="w-full bg-zinc-900 text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:bg-zinc-400 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'apple'
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <span className="text-xl leading-none font-black"></span>}
        Continuar con Apple
      </button>
    </div>
  )
}
