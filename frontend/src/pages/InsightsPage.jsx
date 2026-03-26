import React, { useState, useEffect, useRef } from 'react'
import { listDatasets, getInsights, nlpQuery } from '../services/api'
import Select from 'react-select'
import toast from 'react-hot-toast'
import { Brain, Send, Sparkles, Loader2, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const selectStyles = {
  control: (b) => ({ ...b, background: '#090C14', borderColor: '#1C2640', color: '#E2E8F0', boxShadow: 'none' }),
  menu: (b) => ({ ...b, background: '#0F1623', border: '1px solid #1C2640' }),
  option: (b, s) => ({ ...b, background: s.isFocused ? '#1C2640' : '#0F1623', color: '#E2E8F0', fontSize: 13 }),
  input: (b) => ({ ...b, color: '#E2E8F0' }),
  placeholder: (b) => ({ ...b, color: '#64748B', fontSize: 13 }),
  singleValue: (b) => ({ ...b, color: '#E2E8F0' }),
}

export default function InsightsPage() {
  const [datasets, setDatasets]     = useState([])
  const [selectedDs, setSelectedDs] = useState(null)
  const [insights, setInsights]     = useState(null)
  const [messages, setMessages]     = useState([])
  const [query, setQuery]           = useState('')
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingQuery, setLoadingQuery]       = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    listDatasets().then(r => setDatasets(r.data?.datasets || []))
  }, [])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const fetchInsights = async () => {
    if (!selectedDs) return
    setLoadingInsights(true); setInsights(null)
    try {
      const { data } = await getInsights(selectedDs, [])
      setInsights(data)
    } catch { toast.error('Could not generate insights') }
    finally { setLoadingInsights(false) }
  }

  const handleQuery = async (e) => {
    e.preventDefault()
    if (!query.trim() || !selectedDs || loadingQuery) return
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery(''); setLoadingQuery(true)
    try {
      const { data } = await nlpQuery(selectedDs, query)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, chart: data.chart }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not answer that. Try rephrasing.', error: true }])
    } finally { setLoadingQuery(false) }
  }

  const dsOptions = datasets.map(d => ({ value: d.id, label: d.name }))

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-700 text-2xl text-atlas-text">AI Insights</h1>
        <p className="text-atlas-dim font-body text-sm mt-1">Pattern detection, correlations, and natural language queries.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Auto-insights */}
        <div className="space-y-4">
          <div className="atlas-card p-5">
            <label className="atlas-label">Dataset</label>
            <Select options={dsOptions} value={dsOptions.find(o => o.value === selectedDs) || null}
              onChange={o => { setSelectedDs(o?.value || null); setInsights(null); setMessages([]) }}
              styles={selectStyles} placeholder="Choose dataset…" />
            <button onClick={fetchInsights} disabled={!selectedDs || loadingInsights}
              className="atlas-btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-40">
              {loadingInsights ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate Insights
            </button>
          </div>

          {loadingInsights && (
            <div className="atlas-card p-8 text-center">
              <Loader2 size={28} className="text-atlas-glow animate-spin mx-auto mb-3" />
              <p className="text-atlas-dim text-sm font-body">Analyzing patterns…</p>
            </div>
          )}

          {insights && !loadingInsights && (
            <div className="space-y-3 animate-slide-up">
              {/* Summary */}
              {insights.summary && (
                <div className="atlas-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={15} className="text-atlas-glow" />
                    <span className="font-display font-600 text-sm text-atlas-text">Summary</span>
                  </div>
                  <p className="text-atlas-dim text-sm font-body leading-relaxed">{insights.summary}</p>
                </div>
              )}

              {/* Correlations */}
              {insights.correlations?.length > 0 && (
                <div className="atlas-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={15} className="text-atlas-cyan" />
                    <span className="font-display font-600 text-sm text-atlas-text">Key Correlations</span>
                  </div>
                  <div className="space-y-2">
                    {insights.correlations.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-atlas-bg rounded-lg px-3 py-2.5">
                        <span className="text-xs font-mono text-atlas-dim">{c.col1} ↔ {c.col2}</span>
                        <span className={clsx('text-xs font-display font-600 px-2 py-0.5 rounded-full border', {
                          'text-green-400 bg-green-400/10 border-green-400/30': c.value > 0.5,
                          'text-red-400 bg-red-400/10 border-red-400/30': c.value < -0.5,
                          'text-atlas-amber bg-atlas-amber/10 border-atlas-amber/30': Math.abs(c.value) <= 0.5,
                        })}>{c.value?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anomalies */}
              {insights.anomalies?.length > 0 && (
                <div className="atlas-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={15} className="text-atlas-amber" />
                    <span className="font-display font-600 text-sm text-atlas-text">Anomalies Detected</span>
                  </div>
                  <ul className="space-y-1.5">
                    {insights.anomalies.map((a, i) => (
                      <li key={i} className="text-xs text-atlas-dim font-body flex items-start gap-2">
                        <span className="text-atlas-amber mt-0.5">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!selectedDs && !loadingInsights && (
            <div className="atlas-card p-12 text-center">
              <Brain size={36} className="text-atlas-border mx-auto mb-3" />
              <p className="text-atlas-dim text-sm font-body">Select a dataset to generate AI insights</p>
            </div>
          )}
        </div>

        {/* Right: NLP Chat */}
        <div className="atlas-card flex flex-col h-[600px]">
          <div className="px-5 py-4 border-b border-atlas-border flex items-center gap-2.5">
            <MessageSquare size={15} className="text-atlas-cyan" />
            <span className="font-display font-600 text-sm text-atlas-text">Ask your data</span>
            {selectedDs && <span className="glow-dot ml-auto" />}
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <MessageSquare size={28} className="text-atlas-border" />
                <p className="text-atlas-dim text-sm font-body">Ask a question in plain English</p>
                <div className="flex flex-col gap-2 mt-2">
                  {['What is the average age?', 'Show me the top 5 values', 'Are there any outliers?'].map(q => (
                    <button key={q} onClick={() => setQuery(q)}
                      className="text-xs text-atlas-muted hover:text-atlas-dim px-3 py-1.5 border border-atlas-border hover:border-atlas-muted rounded-lg font-body transition-colors">
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={clsx('max-w-[80%] px-4 py-3 rounded-2xl text-sm font-body', {
                  'bg-atlas-accent/20 border border-atlas-accent/30 text-atlas-text': msg.role === 'user',
                  'bg-atlas-surface border border-atlas-border text-atlas-dim': msg.role === 'assistant',
                  'border-red-500/30 bg-red-500/5': msg.error,
                })}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loadingQuery && (
              <div className="flex justify-start">
                <div className="atlas-card px-4 py-3 flex items-center gap-2">
                  <Loader2 size={13} className="text-atlas-glow animate-spin" />
                  <span className="text-xs text-atlas-dim font-body">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleQuery} className="p-4 border-t border-atlas-border flex gap-3">
            <input
              className="atlas-input flex-1"
              placeholder={selectedDs ? 'Ask anything about your data…' : 'Select a dataset first'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={!selectedDs || loadingQuery}
            />
            <button type="submit" disabled={!selectedDs || !query.trim() || loadingQuery}
              className="atlas-btn-primary px-4 disabled:opacity-40">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
