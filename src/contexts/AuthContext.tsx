import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/services/supabase'
import { signIn, isUsernameAvailable } from '@/services/auth.service'
import { formatUsername } from '@/lib/username'

type AuthStep = 'email' | 'loading' | 'register'
type OAuthProvider = 'google'

function getInitialOAuthError() {
  const authParams = new URLSearchParams(
    window.location.hash ? window.location.hash.slice(1) : window.location.search
  )
  return authParams.get('error_description')
    ? 'No pudimos iniciar sesión. Intentá de nuevo.'
    : ''
}

interface AuthContextValue {
  isAuthenticated: boolean
  authInitialized: boolean
  sessionUserId: string
  sessionEmail: string
  authEmail: string
  setAuthEmail: (v: string) => void
  authStep: AuthStep
  setAuthStep: (v: AuthStep) => void
  isLoginFlow: boolean
  setIsLoginFlow: (v: boolean) => void
  userName: string
  setUserName: (v: string) => void
  password: string
  setPassword: (v: string) => void
  loginError: string
  oauthProviderLoading: OAuthProvider | null
  lastSignupEmail: string | null
  setLastSignupEmail: (v: string | null) => void
  handleEmailSubmit: (e: React.FormEvent) => void
  handleRegisterSubmit: (e: React.FormEvent) => void
  handleOAuthSignIn: (provider: OAuthProvider) => void
  handleLogout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [sessionUserId, setSessionUserId] = useState('')
  const [sessionEmail, setSessionEmail] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authStep, setAuthStep] = useState<AuthStep>('email')
  const [isLoginFlow, setIsLoginFlow] = useState(true)
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(getInitialOAuthError)
  const [oauthProviderLoading, setOauthProviderLoading] = useState<OAuthProvider | null>(null)
  const [lastSignupEmail, setLastSignupEmail] = useState<string | null>(null)

  useEffect(() => {
    if (getInitialOAuthError()) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserName(formatUsername(session.user.user_metadata?.username ?? session.user.email?.split('@')[0] ?? ''))
        setSessionUserId(session.user.id)
        setSessionEmail(session.user.email ?? '')
        setIsAuthenticated(true)
      }
      setOauthProviderLoading(null)
      setAuthInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserName(formatUsername(session.user.user_metadata?.username ?? session.user.email?.split('@')[0] ?? ''))
        setSessionUserId(session.user.id)
        setSessionEmail(session.user.email ?? '')
        setIsAuthenticated(true)
      } else {
        setSessionUserId('')
        setSessionEmail('')
        setIsAuthenticated(false)
      }
      setOauthProviderLoading(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authEmail.trim() || password.length < 6) return
    setAuthStep('loading')
    setLoginError('')

    const { error } = await signIn(authEmail, password)

    if (error) {
      setLoginError(error)
      setAuthStep('email')
      setPassword('')
    } else {
      setAuthStep('email')
      setPassword('')
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUsername = formatUsername(userName)
    if (!trimmedUsername || password.length < 6 || !authEmail.trim()) return

    const usernameRegex = /^[a-z0-9_]{3,20}$/
    if (!usernameRegex.test(trimmedUsername)) {
      setLoginError('El usuario debe tener 3–20 caracteres: letras, números o guion bajo.')
      return
    }

    setAuthStep('loading')
    const available = await isUsernameAvailable(trimmedUsername)
    if (!available) {
      setLoginError('Ese nombre de usuario ya está en uso. Elegí otro.')
      setAuthStep('register')
      return
    }

    const email = authEmail.trim()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: trimmedUsername } },
    })

    if (error) {
      setLoginError(error.message)
      setAuthStep('register')
    } else {
      setLastSignupEmail(email)
      setIsLoginFlow(true)
      setAuthStep('email')
      setAuthEmail('')
      setUserName('')
      setPassword('')
    }
  }

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLoginError('')
    setOauthProviderLoading(provider)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setLoginError('No pudimos iniciar sesión. Intentá de nuevo.')
      setOauthProviderLoading(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthEmail('')
    setPassword('')
    setAuthStep('email')
    setIsLoginFlow(true)
    setLoginError('')
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated, authInitialized,
      sessionUserId, sessionEmail,
      authEmail, setAuthEmail, authStep, setAuthStep,
      isLoginFlow, setIsLoginFlow, userName, setUserName, password, setPassword,
      loginError, oauthProviderLoading, lastSignupEmail, setLastSignupEmail,
      handleEmailSubmit, handleRegisterSubmit, handleOAuthSignIn, handleLogout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
