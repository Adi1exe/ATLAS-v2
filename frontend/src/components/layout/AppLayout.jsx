import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Upload, BarChart2, LineChart,
  Brain, TrendingUp, FileText, LogOut, Menu, X,
  Globe2, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'
import ThemeToggle from '../ui/ThemeToggle'

const NAV_ITEMS = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/upload',    icon: Upload,          label: 'Upload Data' },
  { to: '/app/analyze',   icon: BarChart2,       label: 'Analyze' },
  { to: '/app/visualize', icon: LineChart,       label: 'Visualize' },
  { to: '/app/insights',  icon: Brain,           label: 'AI Insights' },
  { to: '/app/predict',   icon: TrendingUp,      label: 'Predict' },
  { to: '/app/report',    icon: FileText,        label: 'Reports' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-atlas-bg overflow-hidden">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col border-r border-atlas-border bg-atlas-surface transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        {/* Logo row */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-atlas-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <AtlasIcon />
              <span className="font-display font-700 text-base text-atlas-text tracking-wider">ATLAS</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-atlas-muted hover:text-atlas-text transition-colors p-1 rounded-lg hover:bg-atlas-border"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                isActive
                  ? 'bg-atlas-accent/15 text-atlas-glow border border-atlas-accent/30'
                  : 'text-atlas-dim hover:text-atlas-text hover:bg-atlas-border/60'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-atlas-glow' : ''} />
                  {sidebarOpen && (
                    <span className="font-body text-sm">{label}</span>
                  )}
                  {isActive && sidebarOpen && (
                    <ChevronRight size={13} className="ml-auto text-atlas-glow" />
                  )}
                  {/* Tooltip when collapsed */}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-atlas-surface border border-atlas-border rounded-lg text-xs text-atlas-text font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-atlas-border p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <img
                src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=1C2640&color=E2E8F0`}
                alt={user?.name}
                className="w-8 h-8 rounded-full border border-atlas-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-600 text-atlas-text truncate">{user?.name}</p>
                <p className="text-xs text-atlas-muted truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-atlas-muted hover:text-red-400 transition-colors p-1">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-atlas-muted hover:text-red-400 transition-colors py-1">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

function AtlasIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
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
