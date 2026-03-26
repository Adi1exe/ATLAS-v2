import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-atlas-bg flex flex-col items-center justify-center text-center px-6">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <p className="font-mono text-8xl font-700 text-gradient-blue mb-4">404</p>
      <h1 className="font-display font-700 text-2xl text-atlas-text mb-2">Page not found</h1>
      <p className="text-atlas-dim font-body text-sm mb-8">This coordinate doesn't exist on the map.</p>
      <button onClick={() => navigate('/')} className="atlas-btn-primary flex items-center gap-2">
        <ArrowLeft size={14} /> Back to Home
      </button>
    </div>
  )
}
