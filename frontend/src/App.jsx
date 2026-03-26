import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

// Pages
import LoginPage       from './pages/LoginPage'
import LandingPage     from './pages/LandingPage'
import DashboardPage   from './pages/DashboardPage'
import UploadPage      from './pages/UploadPage'
import AnalyzePage     from './pages/AnalyzePage'
import VisualizePage   from './pages/VisualizePage'
import InsightsPage    from './pages/InsightsPage'
import PredictPage     from './pages/PredictPage'
import ReportPage      from './pages/ReportPage'
import NotFoundPage    from './pages/NotFoundPage'

// Layout
import AppLayout from './components/layout/AppLayout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function FullScreenLoader() {
  return (
    <div className="h-screen w-screen bg-atlas-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <AtlasLogo size={40} animated />
        <p className="text-atlas-dim font-display text-sm tracking-widest uppercase">Loading</p>
      </div>
    </div>
  )
}

function AtlasLogo({ size = 28, animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'animate-spin-slow' : ''}>
      <circle cx="20" cy="20" r="18" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 2"/>
      <circle cx="20" cy="20" r="10" stroke="#06B6D4" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="3" fill="#2563EB"/>
      <line x1="20" y1="2" x2="20" y2="10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="30" x2="20" y2="38" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="20" x2="10" y2="20" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="30" y1="20" x2="38" y2="20" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0F1623',
              color: '#E2E8F0',
              border: '1px solid #1C2640',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#06B6D4', secondary: '#0F1623' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#0F1623' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected – wrapped in AppLayout (sidebar + topbar) */}
          <Route path="/app" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index              element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardPage />} />
            <Route path="upload"     element={<UploadPage />} />
            <Route path="analyze"    element={<AnalyzePage />} />
            <Route path="visualize"  element={<VisualizePage />} />
            <Route path="insights"   element={<InsightsPage />} />
            <Route path="predict"    element={<PredictPage />} />
            <Route path="report"     element={<ReportPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
