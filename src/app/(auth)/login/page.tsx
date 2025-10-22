'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    grecaptcha: any
  }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await res.json()
        if (data?.authenticated) {
          router.replace('/admin00o1')
        }
      } catch {}
    }
    checkAuth()
  }, [router])

  // Load reCAPTCHA
  useEffect(() => {
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    
    if (!recaptchaSiteKey) {
      // No reCAPTCHA configured - set as loaded for development
      setRecaptchaLoaded(true)
      return
    }

    const loadRecaptcha = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          setRecaptchaLoaded(true)
        })
        return
      }
      
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            setRecaptchaLoaded(true)
          })
        }
      }
      document.head.appendChild(script)
    }

    loadRecaptcha()
  }, [])

  const executeRecaptcha = async () => {
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    
    if (!recaptchaSiteKey || !window.grecaptcha || !recaptchaLoaded) {
      return ''
    }
    
    try {
      const token = await window.grecaptcha.execute(recaptchaSiteKey, { action: 'login' })
      setRecaptchaToken(token)
      return token
    } catch (error) {
      console.error('reCAPTCHA error:', error)
      return ''
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Execute reCAPTCHA
      const recaptchaToken = await executeRecaptcha()
      const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
      
      if (recaptchaSiteKey && !recaptchaToken) {
        setError('Please complete the reCAPTCHA verification')
        setLoading(false)
        return
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, recaptchaToken })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Login failed')
      } else {
        const from = searchParams.get('from') || '/admin00o1'
        // Hard redirect to ensure cookies are respected immediately
        window.location.href = from
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4" suppressHydrationWarning>
      <div className="w-full max-w-md bg-dark-800 rounded-lg p-6 shadow-lg" suppressHydrationWarning>
        <h1 className="text-2xl font-bold text-white mb-6 text-center" suppressHydrationWarning>Admin Login</h1>
        {error && (
          <div className="mb-4 rounded bg-red-900/40 text-red-200 px-3 py-2 text-sm">{error}</div>
        )}
        <form onSubmit={onSubmit} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-sm text-dark-300 mb-1" suppressHydrationWarning>Username</label>
            <input
              className="w-full rounded bg-dark-700 border border-dark-600 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-600"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
              suppressHydrationWarning
            />
          </div>
          <div>
            <label className="block text-sm text-dark-300 mb-1" suppressHydrationWarning>Password</label>
            <input
              type="password"
              className="w-full rounded bg-dark-700 border border-dark-600 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-600"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              suppressHydrationWarning
            />
          </div>
          <button
            type="submit"
            disabled={loading || !recaptchaLoaded}
            className="w-full rounded bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors px-3 py-2 text-white font-medium"
            suppressHydrationWarning
          >
            {loading ? 'Signing in...' : !recaptchaLoaded ? 'Loading reCAPTCHA...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-center" suppressHydrationWarning>
          <p className="text-xs text-dark-400" suppressHydrationWarning>Default: admin / 2cd95cc2466656a4</p>
          {recaptchaLoaded && !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
            <p className="text-xs text-yellow-400 mt-1" suppressHydrationWarning>⚠ reCAPTCHA not configured - using development mode</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}


