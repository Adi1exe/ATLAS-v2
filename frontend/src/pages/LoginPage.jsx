import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { user, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/app/dashboard', { replace: true })
  }, [user, navigate])

  const handleSuccess = async (credentialResponse) => {
    const toastId = toast.loading('Signing you in…')
    const result = await loginWithGoogle(credentialResponse)
    toast.dismiss(toastId)
    if (result.success) {
      toast.success('Welcome to ATLAS!')
      navigate('/app/dashboard', { replace: true })
    } else {
      toast.error(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-atlas-bg flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />

      {/* Card */}
      <div className="relative atlas-card p-10 w-full max-w-sm mx-4 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 2"/>
              <circle cx="20" cy="20" r="10" stroke="#06B6D4" strokeWidth="1.5"/>
              <circle cx="20" cy="20" r="3" fill="#2563EB"/>
              <line x1="20" y1="2" x2="20" y2="10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="20" y1="30" x2="20" y2="38" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="20" x2="10" y2="20" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="30" y1="20" x2="38" y2="20" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-display font-800 text-2xl tracking-widest text-atlas-text">ATLAS</h1>
          <p className="text-atlas-muted text-xs mt-1 font-body tracking-wider uppercase">Intelligent Analytics</p>
        </div>

        <h2 className="font-display font-600 text-lg text-atlas-text text-center mb-1">Welcome back</h2>
        <p className="text-atlas-dim text-sm font-body text-center mb-8">Sign in to access your workspace</p>

        {/* Google OAuth button */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => toast.error('Google login failed')}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="signin_with"
            logo_alignment="left"
          />
        </div>

        <div className="mt-8 pt-6 border-t border-atlas-border text-center">
          <p className="text-atlas-muted text-xs font-body">
            By signing in, you agree to our{' '}
            <span className="text-atlas-dim hover:text-atlas-text cursor-pointer transition-colors">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  )
}
