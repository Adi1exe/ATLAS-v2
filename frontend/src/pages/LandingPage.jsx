import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, BarChart2, Brain, TrendingUp, Upload, Zap, Globe2, X, ChevronDown, Play, Palette } from 'lucide-react'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

const FEATURES = [
  { icon: Upload,     title: 'Smart Ingestion',      desc: 'Drop any CSV or Excel file. ATLAS auto-cleans, formats, and prepares it instantly.' },
  { icon: BarChart2,  title: 'Intelligent Viz',      desc: 'AI recommends the best chart type — bar, scatter, line, pie, heatmap, and 5 more.' },
  { icon: Brain,      title: 'AI Insights',          desc: 'Pattern detection, correlation analysis, and natural language explanations built-in.' },
  { icon: Zap,        title: 'NLP Queries',          desc: 'Ask in plain English. ATLAS responds instantly with data-backed answers.' },
  { icon: TrendingUp, title: 'Predictive Analytics', desc: 'Forecast future trends using scikit-learn models trained directly on your dataset.' },
  { icon: Globe2,     title: 'Export & Share',       desc: 'Generate polished PDF/HTML reports from your dashboard with a single click.' },
]

const TEAM = [
  {
    name: 'Aditya Dolas',
    role: 'ML Engineer & Backend Lead',
    avatar: <Brain size={32} className="text-atlas-glow" />,
    contributions: [
      'Built the entire ML pipeline from scratch',
      'Designed Flask backend architecture & REST API',
      'Implemented scikit-learn training + ARIMA forecasting',
      'Integrated Google OAuth & JWT authentication',
    ],
  },
  {
    name: 'Mayur Chalke',
    role: 'Frontend Developer',
    avatar: <Palette size={32} className="text-atlas-accent" />,
    contributions: [
      'Designed the ATLAS landing page layout',
      'Reviewed component structure decisions',
      'Provided feedback on color palette choices',
      'Nodded approvingly during stand-ups',
    ],
  },
  {
    name: 'Prasad Nasikkar',
    role: 'Data Analyst',
    avatar: <BarChart2 size={32} className="text-atlas-amber" />,
    contributions: [
      'Tested the upload feature (once)',
      'Suggested adding a pie chart option',
      'Confirmed the dark mode "looks cool"',
      'Wrote the project name in the README',
    ],
  },
]

const DEMO_STEPS = [
  {
    title: 'Upload Your Dataset',
    icon: Upload,
    color: 'text-atlas-cyan',
    desc: 'Drag and drop a CSV or Excel file. ATLAS instantly parses, cleans, and profiles your data — detecting column types, missing values, and anomalies automatically.',
    mockup: (isDark) => (
      <div className={`rounded-xl p-5 border ${isDark ? 'bg-atlas-bg border-atlas-border' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-center border-2 border-dashed border-atlas-accent/40 rounded-xl h-24 gap-3">
          <Upload size={20} className="text-atlas-cyan" />
          <div>
            <p className="text-sm font-display">sales_data_2024.csv</p>
            <p className="text-xs text-atlas-muted">1,240 rows · 8 columns · 0% missing</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {['numeric ×4', 'categorical ×3', 'datetime ×1'].map(t => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'border-atlas-border text-atlas-dim' : 'border-slate-200 text-slate-500'}`}>{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'AI Recommends Charts',
    icon: BarChart2,
    color: 'text-atlas-glow',
    desc: 'Based on your column types and cardinality, ATLAS ranks up to 10 chart types and explains why each one fits your data. Click any recommendation to render it instantly.',
    mockup: (isDark) => (
      <div className={`rounded-xl p-4 border space-y-2 ${isDark ? 'bg-atlas-bg border-atlas-border' : 'bg-slate-50 border-slate-200'}`}>
        {[
          { type: 'Scatter', tag: 'Best', reason: 'Two numeric columns → correlation' },
          { type: 'Line',    tag: '',     reason: 'Datetime × numeric → trend' },
          { type: 'Bar',     tag: '',     reason: 'Category × numeric → comparison' },
        ].map((r) => (
          <div key={r.type} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${r.tag ? 'border-atlas-accent/40 bg-atlas-accent/5' : (isDark ? 'border-atlas-border' : 'border-slate-200')}`}>
            <BarChart2 size={14} className="text-atlas-glow" />
            <div className="flex-1">
              <span className="text-xs font-display">{r.type}</span>
              <p className="text-xs text-atlas-muted">{r.reason}</p>
            </div>
            {r.tag && <span className="text-xs px-1.5 py-0.5 rounded-full bg-atlas-cyan/10 border border-atlas-cyan/30 text-atlas-cyan">{r.tag}</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Ask in Plain English',
    icon: Zap,
    color: 'text-atlas-amber',
    desc: 'Type any question about your data. ATLAS understands averages, sums, top values, correlations, outliers and more — responding in plain, readable English within milliseconds.',
    mockup: (isDark) => (
      <div className={`rounded-xl p-4 border space-y-3 ${isDark ? 'bg-atlas-bg border-atlas-border' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex justify-end">
          <div className="bg-atlas-accent/20 border border-atlas-accent/30 text-xs px-3 py-2 rounded-2xl max-w-[80%]">
            What is the average revenue per region?
          </div>
        </div>
        <div className="flex justify-start">
          <div className={`border text-xs px-3 py-2 rounded-2xl max-w-[90%] leading-relaxed ${isDark ? 'bg-atlas-surface border-atlas-border text-atlas-dim' : 'bg-white border-slate-200 text-slate-600'}`}>
            The average revenue across all regions is <span className="text-atlas-cyan font-mono">₹4,28,350</span>. The North region leads with <span className="text-atlas-cyan font-mono">₹6,12,000</span>, while South has the lowest at <span className="text-atlas-cyan font-mono">₹2,84,200</span>.
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Predict & Export',
    icon: TrendingUp,
    color: 'text-green-400',
    desc: 'Train regression, classification, or ARIMA models with one click. View performance metrics with plain-English explanations, then export your full analysis as PDF or HTML.',
    mockup: (isDark) => (
      <div className={`rounded-xl p-4 border ${isDark ? 'bg-atlas-bg border-atlas-border' : 'bg-slate-50 border-slate-200'}`}>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[['R²', '0.91'], ['RMSE', '3.42'], ['MAE', '2.18']].map(([k, v]) => (
            <div key={k} className={`text-center rounded-lg py-2 border ${isDark ? 'bg-atlas-surface border-atlas-border' : 'bg-white border-slate-200'}`}>
              <p className="text-sm font-display font-700 text-atlas-cyan">{v}</p>
              <p className="text-xs text-atlas-muted mt-0.5">{k}</p>
            </div>
          ))}
        </div>
        <div className="h-14 flex items-end gap-0.5 px-2">
          {[40,65,55,80,70,90,75,85,60,95].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i%2===0 ? '#2563EB':'#06B6D4', opacity: 0.7 }} />
          ))}
        </div>
      </div>
    ),
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.09 } } }

export default function LandingPage() {
  const { user }  = useAuth()
  const { theme } = useTheme()
  const navigate  = useNavigate()
  const isDark    = theme === 'dark'

  const [flippedCard, setFlippedCard] = useState(null)
  const [demoOpen, setDemoOpen]       = useState(false)
  const [demoStep, setDemoStep]       = useState(0)

  const goToApp = () => navigate(user ? '/app/dashboard' : '/login')

  const surfaceClass  = isDark ? 'bg-atlas-surface border-atlas-border' : 'bg-white border-slate-200 shadow-sm'
  const dimTextClass  = isDark ? 'text-atlas-dim' : 'text-slate-500'
  const mutedClass    = isDark ? 'text-atlas-muted' : 'text-slate-400'
  const borderClass   = isDark ? 'border-atlas-border' : 'border-slate-200'

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden
      ${isDark ? 'bg-atlas-bg text-atlas-text' : 'bg-slate-50 text-slate-900'}`}>

      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />

      {/* Navbar */}
      <nav className={`relative flex items-center justify-between px-10 py-5 border-b ${borderClass}`}>
        <div className="flex items-center gap-2.5">
          <AtlasLogo />
          <span className="font-display font-800 text-xl tracking-widest">ATLAS</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={goToApp} className="atlas-btn-primary flex items-center gap-2">
            {user ? 'Open Dashboard' : 'Get Started'} <ArrowRight size={15} />
          </motion.button>
        </div>
      </nav>

      {/* Hero */}
      <motion.section className="relative text-center pt-28 pb-20 px-6"
        variants={stagger} initial="hidden" animate="show">

        <motion.div variants={fadeUp}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8 ${isDark ? 'border-atlas-border bg-atlas-surface/50' : 'border-slate-200 bg-white'}`}>
          <span className="glow-dot" />
          <span className={`text-xs font-body tracking-wider uppercase ${dimTextClass}`}>Intelligent Analytics Platform</span>
        </motion.div>

        <motion.h1 variants={fadeUp} className="font-display font-800 text-6xl md:text-7xl leading-[1.05] mb-6">
          <span className="text-gradient">Map your data.</span><br />
          <span className="text-gradient-blue">Decode the world.</span>
        </motion.h1>

        <motion.p variants={fadeUp} className={`font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${dimTextClass}`}>
          ATLAS transforms raw datasets into interactive visualizations, AI-powered insights,
          and predictive forecasts — all in one seamless workspace.
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={goToApp} className="atlas-btn-primary flex items-center gap-2 text-base px-8 py-3">
            Start Analyzing <ArrowRight size={16} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { setDemoOpen(true); setDemoStep(0) }}
            className={`flex items-center gap-2 text-base px-8 py-3 rounded-xl border transition-all duration-200
              ${isDark ? 'border-atlas-border text-atlas-dim hover:border-atlas-accent/50 hover:text-atlas-text' : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600'}`}>
            <Play size={15} /> View Demo
          </motion.button>
        </motion.div>

        {/* Mock dashboard */}
        <motion.div variants={fadeUp} className="mt-20 max-w-5xl mx-auto">
          <div className={`rounded-2xl p-1 shadow-glow-blue border ${isDark ? 'bg-atlas-surface border-atlas-border' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className={`rounded-xl p-6 grid grid-cols-3 gap-4 h-64 items-center ${isDark ? 'bg-atlas-bg' : 'bg-slate-50'}`}>
              {[{ label:'Datasets',val:'12'},{ label:'Visualizations',val:'47'},{ label:'AI Queries',val:'230'}].map((s,i) => (
                <motion.div key={s.label}
                  initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.6+i*0.12 }}
                  className={`rounded-xl p-5 text-center border ${surfaceClass}`}>
                  <p className="text-3xl font-display font-800 text-gradient-blue">{s.val}</p>
                  <p className={`text-xs mt-1 uppercase tracking-wider font-body ${mutedClass}`}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <motion.div initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }}
          transition={{ duration:0.5 }} className="text-center mb-14">
          <h2 className="font-display font-700 text-3xl text-gradient mb-2">Everything you need</h2>
          <p className={`font-body ${dimTextClass}`}>From raw data to board-ready reports in minutes.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={fadeUp}
              whileHover={{ y:-4, transition:{ duration:0.2 } }}
              className={`p-6 rounded-2xl border transition-all duration-300 group
                ${isDark ? 'bg-atlas-surface border-atlas-border hover:border-atlas-accent/50'
                         : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                ${isDark ? 'bg-atlas-accent/10 border border-atlas-accent/20 group-hover:bg-atlas-accent/20'
                         : 'bg-blue-50 border border-blue-100 group-hover:bg-blue-100'}`}>
                <Icon size={18} className="text-atlas-glow" />
              </div>
              <h3 className="font-display font-600 text-sm mb-2 tracking-wide">{title}</h3>
              <p className={`text-sm font-body leading-relaxed ${dimTextClass}`}>{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Team */}
      <section className="relative max-w-5xl mx-auto px-6 pb-28">
        <motion.div initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }}
          transition={{ duration:0.5 }} className="text-center mb-14">
          <h2 className="font-display font-700 text-3xl text-gradient mb-2">Meet the Team</h2>
          <p className={`font-body text-sm ${dimTextClass}`}>Click a card to reveal contributions. Honesty not guaranteed.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once:true }}>
          {TEAM.map((member, i) => (
            <motion.div key={member.name} variants={fadeUp}
              onClick={() => setFlippedCard(flippedCard === i ? null : i)}
              className="cursor-pointer"
              style={{ perspective: 1000 }}>
              <motion.div
                animate={{ rotateY: flippedCard === i ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle:'preserve-3d', position:'relative', minHeight:220 }}>
                {/* Front */}
                <div style={{ backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden' }}
                  className={`absolute inset-0 rounded-2xl border p-6 flex flex-col items-center justify-center text-center ${surfaceClass}`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border ${isDark ? 'bg-atlas-bg border-atlas-border' : 'bg-slate-50 border-slate-200'}`}>
                    {member.avatar}
                  </div>
                  <p className="font-display font-700 text-base">{member.name}</p>
                  <p className={`text-xs mt-1 font-body ${dimTextClass}`}>{member.role}</p>
                  <div className={`mt-4 flex items-center gap-1.5 text-xs ${mutedClass}`}>
                    <span>Click to see contributions</span>
                    <ChevronDown size={11} />
                  </div>
                </div>
                {/* Back */}
                <div style={{ backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', transform:'rotateY(180deg)' }}
                  className={`absolute inset-0 rounded-2xl border p-6 flex flex-col justify-center
                    ${isDark ? 'bg-atlas-accent/10 border-atlas-accent/30' : 'bg-blue-50 border-blue-200'}`}>
                  <p className="font-display font-700 text-sm mb-3 text-atlas-glow">{member.name}'s Contributions</p>
                  <ul className="space-y-2">
                    {member.contributions.map((c, j) => (
                      <li key={j} className={`flex items-start gap-2 text-xs font-body ${dimTextClass}`}>
                        <span className="text-atlas-cyan mt-0.5 shrink-0">✦</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={`border-t text-center py-8 text-xs font-body tracking-wide ${borderClass} ${mutedClass}`}>
        <p>© {new Date().getFullYear()} ATLAS · Intelligent Data Analytics Platform</p>
        <p className="mt-2 text-atlas-cyan font-semibold">powered by मानचित्र</p>
      </footer>

      {/* Demo Modal */}
      <AnimatePresence>
        {demoOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:'rgba(9,12,20,0.85)', backdropFilter:'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && setDemoOpen(false)}>
            <motion.div
              initial={{ opacity:0,scale:0.92,y:24 }} animate={{ opacity:1,scale:1,y:0 }} exit={{ opacity:0,scale:0.92,y:24 }}
              transition={{ duration:0.35, ease:[0.22,1,0.36,1] }}
              className={`w-full max-w-2xl rounded-2xl border shadow-glow-blue overflow-hidden
                ${isDark ? 'bg-atlas-surface border-atlas-border' : 'bg-white border-slate-200'}`}>

              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${borderClass}`}>
                <div className="flex items-center gap-2">
                  <Play size={15} className="text-atlas-glow" />
                  <span className="font-display font-600 text-sm">How ATLAS works</span>
                </div>
                <button onClick={() => setDemoOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-atlas-border text-atlas-muted' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div className={`flex border-b ${borderClass}`}>
                {DEMO_STEPS.map((step, i) => (
                  <button key={i} onClick={() => setDemoStep(i)}
                    className={`flex-1 py-3 text-xs font-display font-600 transition-all border-b-2
                      ${demoStep === i ? 'border-atlas-accent text-atlas-glow'
                        : `border-transparent ${mutedClass} hover:text-atlas-dim`}`}>
                    {i+1}. {step.title.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div key={demoStep}
                  initial={{ opacity:0,x:16 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-16 }}
                  transition={{ duration:0.22 }} className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    {React.createElement(DEMO_STEPS[demoStep].icon, { size:18, className:DEMO_STEPS[demoStep].color })}
                    <h3 className="font-display font-700 text-base">{DEMO_STEPS[demoStep].title}</h3>
                  </div>
                  <p className={`text-sm font-body leading-relaxed ${dimTextClass}`}>{DEMO_STEPS[demoStep].desc}</p>
                  {DEMO_STEPS[demoStep].mockup(isDark)}
                </motion.div>
              </AnimatePresence>

              {/* Nav */}
              <div className={`flex items-center justify-between px-6 py-4 border-t ${borderClass}`}>
                <button onClick={() => setDemoStep(s => Math.max(0,s-1))} disabled={demoStep===0}
                  className={`text-sm font-display px-4 py-2 rounded-xl border transition-colors disabled:opacity-30
                    ${isDark ? 'border-atlas-border text-atlas-dim' : 'border-slate-200 text-slate-500'}`}>
                  ← Back
                </button>
                <div className="flex gap-1.5">
                  {DEMO_STEPS.map((_,i) => (
                    <button key={i} onClick={() => setDemoStep(i)}
                      className={`h-2 rounded-full transition-all ${i===demoStep ? 'bg-atlas-accent w-4' : (isDark?'bg-atlas-border w-2':'bg-slate-300 w-2')}`} />
                  ))}
                </div>
                {demoStep < DEMO_STEPS.length-1 ? (
                  <button onClick={() => setDemoStep(s=>s+1)} className="atlas-btn-primary text-sm px-4 py-2">Next →</button>
                ) : (
                  <button onClick={() => { setDemoOpen(false); navigate(user?'/app/dashboard':'/login') }}
                    className="atlas-btn-primary text-sm px-4 py-2 flex items-center gap-2">
                    Try ATLAS <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AtlasLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 2"/>
      <circle cx="20" cy="20" r="10" stroke="#06B6D4" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="3" fill="#2563EB"/>
      <line x1="20" y1="2"  x2="20" y2="10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="30" x2="20" y2="38" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2"  y1="20" x2="10" y2="20" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="30" y1="20" x2="38" y2="20" stroke="#06B6D4" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
