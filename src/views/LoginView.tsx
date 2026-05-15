import { useEffect, useRef, useState } from 'react'
import { ArrowRight, AtSign, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Trophy } from 'lucide-react'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { useAuth } from '@/contexts/AuthContext'
import { APP_NAME } from '@/lib/constants'

export function LoginView() {
  const {
    authEmail, setAuthEmail, authStep, setAuthStep,
    isLoginFlow, setIsLoginFlow,
    userName, setUserName,
    password, setPassword,
    loginError, oauthProviderLoading, lastSignupEmail, setLastSignupEmail,
    handleEmailSubmit, handleRegisterSubmit, handleOAuthSignIn,
  } = useAuth()

  const passwordRef = useRef<HTMLInputElement>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!lastSignupEmail) return
    setAuthEmail(lastSignupEmail)
    setSignupSuccess(true)
    setLastSignupEmail(null)
    setTimeout(() => passwordRef.current?.focus(), 50)
  }, [lastSignupEmail, setAuthEmail, setLastSignupEmail])

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-300 rounded-full blur-[120px] opacity-30" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-300 rounded-full blur-[120px] opacity-30" />

      <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-[2rem] shadow-2xl shadow-zinc-200/50 border border-white/50 p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mb-5 rotate-3 shadow-inner border border-amber-200/50">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Entrá a {APP_NAME}</h1>
          <p className="text-zinc-500 mt-2 font-medium">Guardá tu álbum, repetidas y canjes en tu cuenta.</p>
        </div>

        {isLoginFlow && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            {signupSuccess && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium px-4 py-3 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
                Cuenta creada. Revisá tu email para confirmar y luego iniciá sesión.
              </div>
            )}

            <SocialLoginButtons
              loadingProvider={oauthProviderLoading}
              disabled={authStep === 'loading'}
              onGoogleClick={() => handleOAuthSignIn('google')}
            />

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">o continuá con email</span>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Email o usuario</label>
                <input
                  type="text"
                  required
                  placeholder="tu@email.com o tu_usuario"
                  className="w-full px-5 py-3.5 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  disabled={authStep === 'loading' || !!oauthProviderLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ingresá tu contraseña"
                    className="w-full pl-11 pr-12 py-3.5 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={authStep === 'loading' || !!oauthProviderLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                  </button>
                </div>
              </div>
              {loginError && (
                <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={authStep === 'loading' || !!oauthProviderLoading || !authEmail.trim() || password.length < 6}
                className="w-full bg-zinc-900 text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-zinc-300 disabled:shadow-none disabled:transform-none"
              >
                {authStep === 'loading' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</>
                ) : (
                  <>Iniciar sesión <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <div className="pt-3 text-center">
                <p className="text-sm font-medium text-zinc-500">
                  ¿No tenés una cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsLoginFlow(false); setAuthStep('register'); setAuthEmail(''); setPassword(''); setSignupSuccess(false); setShowPassword(false) }}
                    className="text-amber-600 font-bold hover:text-amber-700 transition-colors"
                  >
                    Registrate
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}

        {!isLoginFlow && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Crear cuenta</h2>
              <p className="text-sm text-zinc-500 mt-1 font-medium">Unite a la comunidad para intercambiar.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  disabled={authStep === 'loading'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Elegí tu nombre de usuario</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ej: coleccionista_vip"
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400 lowercase"
                  value={userName}
                  onChange={e => setUserName(e.target.value.replace(/\s/g, ''))}
                  disabled={authStep === 'loading'}
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 ml-1">Este será tu identificador público. No puede contener espacios.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Creá una contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-amber-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-12 py-3.5 bg-zinc-100/50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white outline-none transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={authStep === 'loading'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                </button>
              </div>
            </div>
            {loginError && (
              <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-center">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={authStep === 'loading' || !userName.trim() || !authEmail.trim() || password.length < 6}
              className="w-full bg-amber-500 text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-zinc-300 disabled:shadow-none disabled:transform-none"
            >
              {authStep === 'loading' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creando cuenta...</>
              ) : 'Crear cuenta'}
            </button>
            <div className="pt-3 text-center">
              <p className="text-sm font-medium text-zinc-500">
                ¿Ya tenés cuenta?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthStep('email'); setIsLoginFlow(true); setPassword(''); setShowPassword(false) }}
                  className="text-amber-600 font-bold hover:text-amber-700 transition-colors"
                >
                  Iniciá sesión
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="pt-6 mt-6 border-t border-zinc-100 text-center">
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">
            Asegurado con <span className="font-black text-zinc-500">Supabase Auth</span>
          </p>
        </div>
      </div>
    </div>
  )
}
