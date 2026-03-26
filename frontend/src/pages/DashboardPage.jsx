import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listDatasets } from '../services/api'
import { Upload, BarChart2, Brain, TrendingUp, FileText, ArrowRight, Database, Clock } from 'lucide-react'
import { format } from 'date-fns'

const QUICK_ACTIONS = [
  { icon: Upload,     label: 'Upload Dataset',  to: '/app/upload',    color: 'text-atlas-cyan' },
  { icon: BarChart2,  label: 'Visualize',       to: '/app/visualize', color: 'text-atlas-glow' },
  { icon: Brain,      label: 'AI Insights',     to: '/app/insights',  color: 'text-atlas-amber' },
  { icon: TrendingUp, label: 'Predict',         to: '/app/predict',   color: 'text-green-400' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDatasets()
      .then(r => setDatasets(r.data?.datasets || []))
      .catch(() => setDatasets([]))
      .finally(() => setLoading(false))
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-700 text-2xl text-atlas-text">
          {greeting()}, <span className="text-gradient-blue">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-atlas-dim font-body text-sm mt-1">Here's what's happening in your workspace.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Datasets', value: datasets.length, icon: Database, color: 'text-atlas-cyan' },
          { label: 'Visualizations', value: '—', icon: BarChart2, color: 'text-atlas-glow' },
          { label: 'AI Queries', value: '—', icon: Brain, color: 'text-atlas-amber' },
          { label: 'Reports', value: '—', icon: FileText, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="atlas-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-atlas-muted font-display uppercase tracking-wider">{label}</span>
              <Icon size={15} className={color} />
            </div>
            <p className="font-display font-700 text-2xl text-atlas-text">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display font-600 text-sm text-atlas-dim uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ icon: Icon, label, to, color }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="atlas-card p-5 text-left hover:border-atlas-accent/50 transition-all duration-200 group"
            >
              <Icon size={22} className={`${color} mb-3 group-hover:scale-110 transition-transform`} />
              <p className="font-display font-600 text-sm text-atlas-text">{label}</p>
              <ArrowRight size={13} className="text-atlas-muted mt-2 group-hover:text-atlas-dim group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent datasets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-600 text-sm text-atlas-dim uppercase tracking-widest">Recent Datasets</h2>
          <button onClick={() => navigate('/app/upload')} className="text-xs text-atlas-accent hover:text-atlas-glow font-display transition-colors flex items-center gap-1">
            Upload new <ArrowRight size={11} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="atlas-card h-14 skeleton" />)}
          </div>
        ) : datasets.length === 0 ? (
          <div className="atlas-card p-10 text-center">
            <Database size={32} className="text-atlas-border mx-auto mb-3" />
            <p className="font-display font-600 text-sm text-atlas-dim">No datasets yet</p>
            <p className="text-xs text-atlas-muted mt-1 font-body">Upload a CSV or Excel file to get started</p>
            <button onClick={() => navigate('/app/upload')} className="atlas-btn-primary mt-5 inline-flex items-center gap-2">
              <Upload size={14} /> Upload Dataset
            </button>
          </div>
        ) : (
          <div className="atlas-card divide-y divide-atlas-border">
            {datasets.map((ds) => (
              <div key={ds.id} className="flex items-center justify-between px-5 py-4 hover:bg-atlas-border/30 transition-colors cursor-pointer"
                onClick={() => navigate('/app/analyze', { state: { datasetId: ds.id } })}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-atlas-accent/10 border border-atlas-accent/20 flex items-center justify-center">
                    <Database size={14} className="text-atlas-glow" />
                  </div>
                  <div>
                    <p className="font-display font-600 text-sm text-atlas-text">{ds.name}</p>
                    <p className="text-xs text-atlas-muted font-body">{ds.rows?.toLocaleString()} rows · {ds.columns} columns</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-atlas-muted font-body">
                  <Clock size={11} />
                  {ds.uploaded_at ? format(new Date(ds.uploaded_at), 'MMM d') : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
