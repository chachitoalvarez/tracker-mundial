import { Loader2 } from 'lucide-react'

interface Props {
  loadingProvider: 'google' | null
  disabled?: boolean
  onGoogleClick: () => void
}

export function SocialLoginButtons({
  loadingProvider,
  disabled = false,
  onGoogleClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onGoogleClick}
      disabled={disabled || !!loadingProvider}
      className="w-full h-14 bg-white border-2 border-[#1a73e8] text-[#1a73e8] text-[17px] sm:text-lg font-bold px-4 rounded-[14px] transition-all flex items-center justify-center gap-3 hover:bg-[#f3f8ff] hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1a73e8]/20 active:bg-[#eaf3ff] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100"
    >
      {loadingProvider === 'google'
        ? <Loader2 className="w-5 h-5 animate-spin" />
        : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[22px] w-[22px] shrink-0"
          >
            <path fill="#4285F4" d="M21.82 12.22c0-.71-.06-1.39-.18-2.05H12v3.89h5.51a4.72 4.72 0 0 1-2.04 3.09v2.52h3.25c1.9-1.75 3.1-4.33 3.1-7.45Z" />
            <path fill="#34A853" d="M12 22c2.76 0 5.08-.91 6.77-2.47l-3.25-2.52c-.9.6-2.05.96-3.52.96-2.7 0-4.98-1.82-5.79-4.27H2.86v2.6A10.22 10.22 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.21 13.7A6.11 6.11 0 0 1 5.87 12c0-.59.12-1.16.34-1.7V7.7H2.86A10.22 10.22 0 0 0 1.8 12c0 1.64.39 3.19 1.06 4.3l3.35-2.6Z" />
            <path fill="#EA4335" d="M12 6.03c1.5 0 2.84.52 3.89 1.53l2.92-2.92C17.07 3.02 14.76 2 12 2a10.22 10.22 0 0 0-9.14 5.7l3.35 2.6C7.02 7.85 9.3 6.03 12 6.03Z" />
          </svg>
        )}
      Continuar con Google
    </button>
  )
}
