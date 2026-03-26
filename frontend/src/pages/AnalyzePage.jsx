import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listDatasets, getDatasetInfo, getDatasetPreview } from '../services/api'
import { Database, ChevronDown, ArrowRight, BarChart2 } from 'lucide-react'
import Select from 'react-select'

const selectStyles = {
  control: (b) => ({ ...b, background: '#090C14', borderColor: '#1C2640', color: '#E2E8F0', boxShadow: 'none', '&:hover': { borderColor: '#2563EB' } }),
  menu: (b) => ({ ...b, background: '#0F1623', border: '1px solid #1C2640' }),
  option: (b, s) => ({ ...b, background: s.isFocused ? '#1C2640' : '#0F1623', color: '#E2E8F0', fontSize: 13 }),
  multiValue: (b) => ({ ...b, background: 'rgba(37,99,235,0.2)', borderRadius: 6 }),
  multiValueLabel: (b) => ({ ...b, color: '#93C5FD', fontSize: 12 }),
  input: (b) => ({ ...b, color: '#E2E8F0' }),
  placeholder: (b) => ({ ...b, color: '#64748B', fontSize: 13 }),
  singleValue: (b) => ({ ...b, color: '#E2E8F0' }),
}

export default function AnalyzePage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const [datasets, setDatasets]         = useState([])
  const [selectedDs, setSelectedDs]     = useState(location.state?.datasetId || null)
  const [dsInfo, setDsInfo]             = useState(null)
  const [preview, setPreview]           = useState(null)
  const [selectedCols, setSelectedCols] = useState([])
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    listDatasets().then(r => setDatasets(r.data?.datasets || []))
  }, [])

  useEffect(() => {
    if (!selectedDs) return
    setLoading(true)
    Promise.all([getDatasetInfo(selectedDs), getDatasetPreview(selectedDs)])
      .then(([infoRes, previewRes]) => {
        setDsInfo(infoRes.data)
        setPreview(previewRes.data)
        setSelectedCols([])
      })
      .finally(() => setLoading(false))
  }, [selectedDs])

  const dsOptions = datasets.map(d => ({ value: d.id, label: d.name }))
  const colOptions = dsInfo?.columns?.map(c => ({ value: c.name, label: `${c.name} (${c.dtype})` })) || []

  const handleVisualize = () => {
    navigate('/app/visualize', { state: { datasetId: selectedDs, columns: selectedCols.map(c => c.value) } })
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-700 text-2xl text-atlas-text">Analyze Dataset</h1>
        <p className="text-atlas-dim font-body text-sm mt-1">Select a dataset, explore columns, and send to visualization.</p>
      </div>

      {/* Dataset selector */}
      <div className="atlas-card p-6 mb-6">
        <label className="atlas-label">Select Dataset</label>
        <Select
          options={dsOptions}
          value={dsOptions.find(o => o.value === selectedDs) || null}
          onChange={o => setSelectedDs(o?.value || null)}
          styles={selectStyles}
          placeholder="Choose a dataset…"
        />
      </div>

      {loading && (
        <div className="atlas-card p-6 space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded-xl" />)}
        </div>
      )}

      {dsInfo && !loading && (
        <>
          {/* Column info */}
          <div className="atlas-card mb-6">
            <div className="px-6 py-4 border-b border-atlas-border flex items-center justify-between">
              <h2 className="font-display font-600 text-sm text-atlas-text">Column Summary</h2>
              <span className="text-xs text-atlas-muted font-mono">{dsInfo.columns?.length} cols · {dsInfo.rows?.toLocaleString()} rows</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body">
                <thead>
                  <tr className="border-b border-atlas-border">
                    {['Column', 'Type', 'Non-null', 'Unique', 'Sample'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-atlas-muted font-display uppercase tracking-widest text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dsInfo.columns?.map(col => (
                    <tr key={col.name} className="border-b border-atlas-border/50 hover:bg-atlas-border/20 transition-colors">
                      <td className="px-5 py-3 text-atlas-text font-mono">{col.name}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${
                          col.dtype === 'object' ? 'bg-atlas-amber/10 border-atlas-amber/30 text-atlas-amber' :
                          col.dtype?.startsWith('int') || col.dtype?.startsWith('float') ? 'bg-atlas-cyan/10 border-atlas-cyan/30 text-atlas-cyan' :
                          'bg-atlas-accent/10 border-atlas-accent/30 text-atlas-glow'
                        }`}>{col.dtype}</span>
                      </td>
                      <td className="px-5 py-3 text-atlas-dim">{col.non_null?.toLocaleString()}</td>
                      <td className="px-5 py-3 text-atlas-dim">{col.unique}</td>
                      <td className="px-5 py-3 text-atlas-muted truncate max-w-xs">{String(col.sample ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column selection for visualization */}
          <div className="atlas-card p-6 mb-6">
            <label className="atlas-label">Select Columns for Visualization</label>
            <Select
              isMulti
              options={colOptions}
              value={selectedCols}
              onChange={setSelectedCols}
              styles={selectStyles}
              placeholder="Pick one or more columns…"
            />
          </div>

          {/* Data preview */}
          {preview?.rows && (
            <div className="atlas-card mb-6">
              <div className="px-6 py-4 border-b border-atlas-border">
                <h2 className="font-display font-600 text-sm text-atlas-text">Data Preview <span className="text-atlas-muted text-xs font-mono ml-2">(first {preview.rows.length} rows)</span></h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead>
                    <tr className="border-b border-atlas-border">
                      {preview.headers?.map(h => (
                        <th key={h} className="text-left px-4 py-3 text-atlas-muted font-display uppercase tracking-widest text-xs whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-atlas-border/30 hover:bg-atlas-border/20 transition-colors">
                        {preview.headers?.map(h => (
                          <td key={h} className="px-4 py-2.5 text-atlas-dim truncate max-w-xs">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleVisualize}
            disabled={selectedCols.length === 0}
            className="atlas-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BarChart2 size={15} /> Visualize Selected Columns <ArrowRight size={14} />
          </button>
        </>
      )}

      {!selectedDs && !loading && (
        <div className="atlas-card p-14 text-center">
          <Database size={36} className="text-atlas-border mx-auto mb-4" />
          <p className="font-display font-600 text-sm text-atlas-dim">Choose a dataset above to begin analysis</p>
        </div>
      )}
    </div>
  )
}
