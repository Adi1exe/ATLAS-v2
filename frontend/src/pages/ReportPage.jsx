import React, { useState, useEffect } from 'react'
import { listDatasets, exportReport } from '../services/api'
import Select from 'react-select'
import toast from 'react-hot-toast'
import { FileText, Download, Loader2, BarChart2, Brain, TrendingUp } from 'lucide-react'

const selectStyles = {
  control: (b) => ({ ...b, background: '#090C14', borderColor: '#1C2640', color: '#E2E8F0', boxShadow: 'none' }),
  menu: (b) => ({ ...b, background: '#0F1623', border: '1px solid #1C2640' }),
  option: (b, s) => ({ ...b, background: s.isFocused ? '#1C2640' : '#0F1623', color: '#E2E8F0', fontSize: 13 }),
  input: (b) => ({ ...b, color: '#E2E8F0' }),
  placeholder: (b) => ({ ...b, color: '#64748B', fontSize: 13 }),
  singleValue: (b) => ({ ...b, color: '#E2E8F0' }),
}

const SECTIONS = [
  { id: 'summary',        icon: FileText,    label: 'Dataset Summary',   desc: 'Row/column counts, dtypes, missing values' },
  { id: 'visualizations', icon: BarChart2,   label: 'Visualizations',    desc: 'All generated charts and graphs' },
  { id: 'insights',       icon: Brain,       label: 'AI Insights',       desc: 'Patterns, correlations, anomalies' },
  { id: 'predictions',    icon: TrendingUp,  label: 'Predictive Models', desc: 'Model metrics and forecast plots' },
]

export default function ReportPage() {
  const [datasets, setDatasets]       = useState([])
  const [selectedDs, setSelectedDs]   = useState(null)
  const [format, setFormat]           = useState('pdf')
  const [selected, setSelected]       = useState(['summary', 'visualizations', 'insights'])
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    listDatasets().then(r => setDatasets(r.data?.datasets || []))
  }, [])

  const toggleSection = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const handleExport = async () => {
    if (!selectedDs) return
    setLoading(true)
    try {
      const { data } = await exportReport(selectedDs, format)
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a'); a.href = url
      a.download = `atlas-report-${selectedDs}.${format}`
      a.click(); URL.revokeObjectURL(url)
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch { toast.error('Export failed') }
    finally { setLoading(false) }
  }

  const dsOptions = datasets.map(d => ({ value: d.id, label: d.name }))

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-700 text-2xl text-atlas-text">Reports</h1>
        <p className="text-atlas-dim font-body text-sm mt-1">Generate and export polished reports from your analysis.</p>
      </div>

      {/* Dataset & format */}
      <div className="atlas-card p-6 mb-5 space-y-4">
        <div>
          <label className="atlas-label">Dataset</label>
          <Select options={dsOptions} value={dsOptions.find(o => o.value === selectedDs) || null}
            onChange={o => setSelectedDs(o?.value || null)} styles={selectStyles} placeholder="Choose dataset…" />
        </div>

        <div>
          <label className="atlas-label">Export Format</label>
          <div className="flex gap-3">
            {['pdf', 'html', 'csv'].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-5 py-2 rounded-xl text-sm font-display font-600 border transition-all ${
                  format === f
                    ? 'bg-atlas-accent/20 border-atlas-accent text-atlas-glow'
                    : 'border-atlas-border text-atlas-dim hover:border-atlas-muted'
                }`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="atlas-card mb-5">
        <div className="px-6 py-4 border-b border-atlas-border">
          <h2 className="font-display font-600 text-sm text-atlas-text">Report Sections</h2>
        </div>
        <div className="divide-y divide-atlas-border">
          {SECTIONS.map(({ id, icon: Icon, label, desc }) => (
            <label key={id} className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-atlas-border/20 transition-colors">
              <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleSection(id)}
                className="w-4 h-4 rounded border-atlas-border accent-atlas-accent" />
              <div className="w-8 h-8 rounded-lg bg-atlas-accent/10 border border-atlas-accent/20 flex items-center justify-center shrink-0">
                <Icon size={15} className="text-atlas-glow" />
              </div>
              <div>
                <p className="font-display font-600 text-sm text-atlas-text">{label}</p>
                <p className="text-xs text-atlas-muted font-body mt-0.5">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button onClick={handleExport} disabled={!selectedDs || selected.length === 0 || loading}
        className="atlas-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed py-3">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {loading ? 'Generating…' : `Export ${format.toUpperCase()} Report`}
      </button>

      {!selectedDs && (
        <div className="mt-8 atlas-card p-12 text-center">
          <FileText size={36} className="text-atlas-border mx-auto mb-3" />
          <p className="text-atlas-dim text-sm font-body">Select a dataset to generate a report</p>
        </div>
      )}
    </div>
  )
}
