import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listDatasets, getDatasetInfo, trainModel } from '../services/api'
import Select from 'react-select'
import Plot from 'react-plotly.js'
import toast from 'react-hot-toast'
import { TrendingUp, Loader2, Play, CheckCircle, Info, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

const MODEL_TYPES = [
  { value: 'linear_regression',    label: 'Linear Regression',       tag: 'Regression' },
  { value: 'random_forest_reg',    label: 'Random Forest Regressor', tag: 'Regression' },
  { value: 'logistic_regression',  label: 'Logistic Regression',     tag: 'Classification' },
  { value: 'random_forest_clf',    label: 'Random Forest Classifier', tag: 'Classification' },
  { value: 'arima',                label: 'ARIMA Forecast',          tag: 'Time-Series' },
]

const TAG_COLORS = {
  'Regression':     'text-atlas-cyan  bg-atlas-cyan/10  border-atlas-cyan/30',
  'Classification': 'text-atlas-amber bg-atlas-amber/10 border-atlas-amber/30',
  'Time-Series':    'text-green-400   bg-green-400/10   border-green-400/30',
}

const selectStyles = {
  control:       (b) => ({ ...b, background: '#090C14', borderColor: '#1C2640', color: '#E2E8F0', boxShadow: 'none' }),
  menu:          (b) => ({ ...b, background: '#0F1623', border: '1px solid #1C2640' }),
  option:        (b, s) => ({ ...b, background: s.isFocused ? '#1C2640' : '#0F1623', color: '#E2E8F0', fontSize: 13 }),
  multiValue:    (b) => ({ ...b, background: 'rgba(37,99,235,0.2)', borderRadius: 6 }),
  multiValueLabel:(b)=> ({ ...b, color: '#93C5FD', fontSize: 12 }),
  input:         (b) => ({ ...b, color: '#E2E8F0' }),
  placeholder:   (b) => ({ ...b, color: '#64748B', fontSize: 13 }),
  singleValue:   (b) => ({ ...b, color: '#E2E8F0' }),
}

// Render markdown-style **bold** and bullet lists in explanation text
function ExplanationText({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        const parts = line.split(/\*\*(.+?)\*\*/g)
        const rendered = parts.map((p, j) =>
          j % 2 === 1
            ? <strong key={j} className="text-atlas-text font-600">{p}</strong>
            : <span key={j}>{p}</span>
        )
        if (line.startsWith('•')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm font-body text-atlas-dim">
              <span className="text-atlas-cyan mt-0.5 shrink-0">•</span>
              <span>{rendered}</span>
            </div>
          )
        }
        return <p key={i} className="text-sm font-body text-atlas-dim leading-relaxed">{rendered}</p>
      })}
    </div>
  )
}

export default function PredictPage() {
  const [datasets, setDatasets]       = useState([])
  const [selectedDs, setSelectedDs]   = useState(null)
  const [columns, setColumns]         = useState([])
  const [features, setFeatures]       = useState([])
  const [target, setTarget]           = useState(null)
  const [modelType, setModelType]     = useState(null)
  const [trainResult, setTrainResult] = useState(null)
  const [plotData, setPlotData]       = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading]         = useState(false)
  const [showExplain, setShowExplain] = useState(true)

  useEffect(() => {
    listDatasets().then(r => setDatasets(r.data?.datasets || []))
  }, [])

  useEffect(() => {
    if (!selectedDs) return
    getDatasetInfo(selectedDs).then(r => {
      setColumns(r.data?.columns?.map(c => ({ value: c.name, label: `${c.name} (${c.dtype})` })) || [])
      setFeatures([]); setTarget(null); setTrainResult(null); setPlotData(null); setExplanation(null)
    })
  }, [selectedDs])

  const handleTrain = async () => {
    if (!selectedDs || features.length === 0 || !target || !modelType) return
    setLoading(true); setTrainResult(null); setPlotData(null); setExplanation(null)
    try {
      const { data } = await trainModel({
        dataset_id: selectedDs,
        model_type: modelType.value,
        features:   features.map(f => f.value),
        target:     target.value,
      })
      setTrainResult(data)
      if (data.plot)        setPlotData(data.plot)
      if (data.explanation) setExplanation(data.explanation)
      toast.success('Model trained successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Training failed')
    } finally { setLoading(false) }
  }

  const dsOptions    = datasets.map(d => ({ value: d.id, label: d.name }))
  const modelOptions = MODEL_TYPES.map(m => ({ value: m.value, label: m.label, tag: m.tag }))
  const canTrain     = selectedDs && features.length > 0 && target && modelType && !loading

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-700 text-2xl text-atlas-text">Predictive Analytics</h1>
        <p className="text-atlas-dim font-body text-sm mt-1">
          Train ML models and get plain-English explanations of the results.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Config Panel ── */}
        <div className="xl:col-span-1 space-y-4">
          <div className="atlas-card p-5 space-y-4">
            <div>
              <label className="atlas-label">Dataset</label>
              <Select options={dsOptions} value={dsOptions.find(o => o.value === selectedDs) || null}
                onChange={o => setSelectedDs(o?.value || null)} styles={selectStyles} placeholder="Choose dataset…" />
            </div>

            <div>
              <label className="atlas-label">Model Type</label>
              <Select
                options={modelOptions} value={modelType} onChange={setModelType}
                styles={selectStyles} placeholder="Select model…"
                formatOptionLabel={({ label, tag }) => (
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${TAG_COLORS[tag] || ''}`}>{tag}</span>
                  </div>
                )}
              />
            </div>

            <div>
              <label className="atlas-label">Feature Columns</label>
              <Select isMulti options={columns} value={features} onChange={setFeatures}
                styles={selectStyles} placeholder="Select features…"
                isOptionDisabled={o => o.value === target?.value} />
            </div>

            <div>
              <label className="atlas-label">Target Column</label>
              <Select options={columns} value={target} onChange={setTarget}
                styles={selectStyles} placeholder="Select target…"
                isOptionDisabled={o => features.some(f => f.value === o.value)} />
            </div>

            <motion.button
              whileHover={{ scale: canTrain ? 1.02 : 1 }}
              whileTap={{   scale: canTrain ? 0.97 : 1 }}
              onClick={handleTrain} disabled={!canTrain}
              className="atlas-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {loading ? 'Training…' : 'Train Model'}
            </motion.button>
          </div>

          {/* Metrics card */}
          <AnimatePresence>
            {trainResult?.metrics && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="atlas-card p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={15} className="text-green-400" />
                  <span className="font-display font-600 text-sm text-atlas-text">Model Metrics</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(trainResult.metrics).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-xs text-atlas-dim font-body uppercase tracking-wide">{k}</span>
                      <span className={clsx('font-mono text-sm font-600',
                        k === 'R²' || k === 'Accuracy'
                          ? Number(v) >= 0.75 ? 'text-green-400' : Number(v) >= 0.5 ? 'text-atlas-amber' : 'text-red-400'
                          : 'text-atlas-cyan'
                      )}>{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Results Panel ── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Chart */}
          <div className="atlas-card p-6 min-h-[380px] flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 size={32} className="text-atlas-glow animate-spin" />
                <p className="text-atlas-dim text-sm font-body">Training model…</p>
              </div>
            ) : plotData ? (
              <Plot
                data={plotData.data}
                layout={{
                  ...plotData.layout,
                  paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                  font: { color: '#94A3B8', family: 'DM Sans' },
                  xaxis: { ...plotData.layout?.xaxis, gridcolor: '#1C2640', zerolinecolor: '#1C2640' },
                  yaxis: { ...plotData.layout?.yaxis, gridcolor: '#1C2640', zerolinecolor: '#1C2640' },
                  margin: { t: 48, r: 20, b: 52, l: 52 },
                  legend: { bgcolor: 'transparent' },
                }}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%', minHeight: 340 }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <TrendingUp size={40} className="text-atlas-border" />
                <p className="font-display font-600 text-sm text-atlas-dim">
                  Configure your model on the left and click Train
                </p>
                <div className="flex items-start gap-2 mt-3 bg-atlas-accent/5 border border-atlas-accent/20 rounded-xl p-4 max-w-sm text-left">
                  <Info size={13} className="text-atlas-glow mt-0.5 shrink-0" />
                  <p className="text-xs text-atlas-dim font-body leading-relaxed">
                    ATLAS trains on 80% of your data and tests on the remaining 20%.
                    After training, you'll get metrics, a chart, and a plain-English explanation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Plain-English Explanation */}
          <AnimatePresence>
            {explanation && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="atlas-card overflow-hidden"
              >
                <button
                  onClick={() => setShowExplain(s => !s)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-atlas-border/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={15} className="text-atlas-glow" />
                    <span className="font-display font-600 text-sm text-atlas-text">
                      What does this mean?
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-atlas-glow/10 border border-atlas-glow/30 text-atlas-glow font-display">
                      Plain English
                    </span>
                  </div>
                  {showExplain
                    ? <ChevronUp size={15} className="text-atlas-muted" />
                    : <ChevronDown size={15} className="text-atlas-muted" />}
                </button>

                <AnimatePresence>
                  {showExplain && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 border-t border-atlas-border">
                        <ExplanationText text={explanation} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
