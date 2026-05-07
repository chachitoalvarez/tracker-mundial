import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '@/services/supabase'
import { signIn } from '@/services/auth.service'

type AuthStep = 'email' | 'loading' | 'register'

interface AuthContextValue {
  isAuthenticated: boolean
  authInitialized: boolean
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
  lastSignupEmail: string | null
  setLastSignupEmail: (v: string | null) => void
  handleEmailSubmit: (e: React.FormEvent) => void
  handleRegisterSubmit: (e: React.FormEvent) => void
  handleLogout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authStep, setAuthStep] = useState<AuthStep>('email')
  const [isLoginFlow, setIsLoginFlow] = useState(true)
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [lastSignupEmail, setLastSignupEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserName(session.user.user_metadata?.user_name ?? session.user.email?.split('@')[0] ?? '')
        setIsAuthenticated(true)
      }
      setAuthInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserName(session.user.user_metadata?.user_name ?? session.user.email?.split('@')[0] ?? '')
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
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
    if (!userName.trim() || password.length < 6 || !authEmail.trim()) return
    setAuthStep('loading')

    const email = authEmail.trim()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { user_name: userName.trim() } },
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
      authEmail, setAuthEmail, authStep, setAuthStep,
      isLoginFlow, setIsLoginFlow, userName, setUserName, password, setPassword,
      loginError, lastSignupEmail, setLastSignupEmail,
      handleEmailSubmit, handleRegisterSubmit, handleLogout,
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
