import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getGraphRecommendations, generateChart, listDatasets, getDatasetInfo } from '../services/api'
import Plot from 'react-plotly.js'
import Select from 'react-select'
import toast from 'react-hot-toast'
import { Sparkles, BarChart2, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const CHART_ICONS = {
  bar:       '▪',
  line:      '↗',
  area:      '▲',
  scatter:   '·',
  pie:       '◔',
  donut:     '◎',
  histogram: '▩',
  box:       '⊡',
  violin:    '♫',
  heatmap:   '⊞',
  treemap:   '⊟',
}

const selectStyles = {
  control:        (b) => ({ ...b, background: '#090C14', borderColor: '#1C2640', color: '#E2E8F0', boxShadow: 'none' }),
  menu:           (b) => ({ ...b, background: '#0F1623', border: '1px solid #1C2640' }),
  option:         (b, s) => ({ ...b, background: s.isFocused ? '#1C2640' : '#0F1623', color: '#E2E8F0', fontSize: 13 }),
  multiValue:     (b) => ({ ...b, background: 'rgba(37,99,235,0.2)', borderRadius: 6 }),
  multiValueLabel:(b) => ({ ...b, color: '#93C5FD', fontSize: 12 }),
  input:          (b) => ({ ...b, color: '#E2E8F0' }),
  placeholder:    (b) => ({ ...b, color: '#64748B', fontSize: 13 }),
  singleValue:    (b) => ({ ...b, color: '#E2E8F0' }),
}

export default function VisualizePage() {
  const location = useLocation()
  const [datasets,       setDatasets]       = useState([])
  const [selectedDs,     setSelectedDs]     = useState(location.state?.datasetId || null)
  const [columns,        setColumns]        = useState([])
  const [selectedCols,   setSelectedCols]   = useState(location.state?.columns?.map(c => ({ value: c, label: c })) || [])
  const [recommendations,setRecommendations]= useState([])
  const [selectedChart,  setSelectedChart]  = useState(null)
  const [chartData,      setChartData]      = useState(null)
  const [loadingRec,     setLoadingRec]     = useState(false)
  const [loadingChart,   setLoadingChart]   = useState(false)

  useEffect(() => { listDatasets().then(r => setDatasets(r.data?.datasets || [])) }, [])

  useEffect(() => {
    if (!selectedDs) return
    getDatasetInfo(selectedDs).then(r =>
      setColumns(r.data?.columns?.map(c => ({ value: c.name, label: `${c.name} (${c.dtype})` })) || [])
    )
  }, [selectedDs])

  useEffect(() => {
    if (selectedDs && selectedCols.length > 0 && recommendations.length === 0 && columns.length > 0) {
      fetchRecommendations()
    }
  }, [columns])

  const fetchRecommendations = async () => {
    if (!selectedDs || selectedCols.length === 0) return
    setLoadingRec(true)
    try {
      const { data } = await getGraphRecommendations(selectedDs, selectedCols.map(c => c.value))
      setRecommendations(data.recommendations || [])
      setSelectedChart(null); setChartData(null)
    } catch { toast.error('Could not fetch recommendations') }
    finally { setLoadingRec(false) }
  }

  const fetchChart = async (rec) => {
    setSelectedChart(rec); setLoadingChart(true)
    try {
      const { data } = await generateChart({
        dataset_id: selectedDs,
        chart_type: rec.type,
        columns:    selectedCols.map(c => c.value),
        config:     rec.config || {},
      })
      setChartData(data.plotly)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Chart generation failed')
    } finally { setLoadingChart(false) }
  }

  const dsOptions = datasets.map(d => ({ value: d.id, label: d.name }))

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-700 text-2xl text-atlas-text">Visualize</h1>
        <p className="text-atlas-dim font-body text-sm mt-1">
          AI recommends the best chart from 10 types based on your column data.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="atlas-card p-5">
          <label className="atlas-label">Dataset</label>
          <Select options={dsOptions} value={dsOptions.find(o => o.value === selectedDs) || null}
            onChange={o => { setSelectedDs(o?.value || null); setColumns([]); setSelectedCols([]); setRecommendations([]) }}
            styles={selectStyles} placeholder="Choose dataset…" />
        </div>
        <div className="atlas-card p-5">
          <label className="atlas-label">Columns</label>
          <Select isMulti options={columns} value={selectedCols} onChange={setSelectedCols}
            styles={selectStyles} placeholder="Select columns…" />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={fetchRecommendations}
        disabled={!selectedDs || selectedCols.length === 0 || loadingRec}
        className="atlas-btn-primary flex items-center gap-2 mb-8 disabled:opacity-40"
      >
        {loadingRec ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Get Recommendations
      </motion.button>

      {/* Recommendations grid */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-8">
            <h2 className="font-display font-600 text-xs text-atlas-dim uppercase tracking-widest mb-3">
              {recommendations.length} Chart{recommendations.length>1?'s':''} Recommended
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {recommendations.map((rec, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity:0, scale:0.9 }}
                  animate={{ opacity:1, scale:1 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y:-3, transition:{ duration:0.15 } }}
                  whileTap={{ scale:0.95 }}
                  onClick={() => fetchChart(rec)}
                  className={clsx(
                    'atlas-card px-4 py-3 text-left transition-all duration-200',
                    selectedChart?.type === rec.type
                      ? 'border-atlas-accent bg-atlas-accent/10 shadow-glow-blue'
                      : 'hover:border-atlas-accent/40'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{CHART_ICONS[rec.type] || '📊'}</span>
                    {i === 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-atlas-cyan/10 border border-atlas-cyan/30 text-atlas-cyan font-display">
                        Best
                      </span>
                    )}
                  </div>
                  <p className="font-display font-600 text-xs text-atlas-text capitalize mb-1">{rec.type}</p>
                  <p className="text-xs text-atlas-muted font-body leading-tight line-clamp-2">{rec.reason}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart area */}
      <div className="atlas-card p-6">
        <AnimatePresence mode="wait">
          {loadingChart ? (
            <motion.div key="loading"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex flex-col items-center justify-center h-80 gap-4">
              <Loader2 size={28} className="text-atlas-glow animate-spin" />
              <p className="text-atlas-dim text-sm font-body">Generating chart…</p>
            </motion.div>
          ) : chartData ? (
            <motion.div key="chart" initial={{ opacity:0 }} animate={{ opacity:1 }}>
              <Plot
                data={chartData.data}
                layout={{
                  ...chartData.layout,
                  paper_bgcolor: 'transparent',
                  plot_bgcolor:  'transparent',
                  font:   { color: '#94A3B8', family: 'DM Sans' },
                  xaxis:  { ...chartData.layout?.xaxis,  gridcolor: '#1C2640', zerolinecolor: '#1C2640' },
                  yaxis:  { ...chartData.layout?.yaxis,  gridcolor: '#1C2640', zerolinecolor: '#1C2640' },
                  margin: { t: 48, r: 20, b: 52, l: 52 },
                  legend: { bgcolor: 'transparent' },
                }}
                config={{ responsive: true, displayModeBar: true, displaylogo: false }}
                style={{ width: '100%', minHeight: 440 }}
              />
            </motion.div>
          ) : (
            <motion.div key="empty"
              initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex flex-col items-center justify-center h-80 gap-3">
              <BarChart2 size={40} className="text-atlas-border" />
              <p className="font-display font-600 text-sm text-atlas-dim text-center">
                {recommendations.length === 0
                  ? 'Select columns and click Get Recommendations'
                  : 'Click any chart type above to render it'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
