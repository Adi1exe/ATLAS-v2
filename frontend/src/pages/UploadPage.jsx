import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { uploadDataset } from '../services/api'
import toast from 'react-hot-toast'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

const STEPS = ['Uploading', 'Parsing', 'Cleaning', 'Profiling', 'Ready']

export default function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile]             = useState(null)
  const [progress, setProgress]     = useState(0)
  const [stepIndex, setStepIndex]   = useState(-1)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)

  const onDrop = useCallback((accepted) => {
    if (accepted.length) { setFile(accepted[0]); setError(null); setResult(null); setStepIndex(-1) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  })

  const handleUpload = async () => {
    if (!file) return
    setError(null); setResult(null); setStepIndex(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate preprocessing steps
      const stepInterval = setInterval(() => {
        setStepIndex(prev => (prev < STEPS.length - 2 ? prev + 1 : prev))
      }, 700)

      const { data } = await uploadDataset(formData, setProgress)
      clearInterval(stepInterval)
      setStepIndex(STEPS.length - 1)
      setResult(data)
      toast.success(`${file.name} uploaded and processed!`)
    } catch (err) {
      setStepIndex(-1)
      const msg = err.response?.data?.error || 'Upload failed'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-700 text-2xl text-atlas-text">Upload Dataset</h1>
        <p className="text-atlas-dim font-body text-sm mt-1">
          CSV or Excel files up to 50MB. ATLAS will auto-clean and profile your data.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-14 text-center transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-atlas-accent bg-atlas-accent/10'
            : file
            ? 'border-atlas-cyan/40 bg-atlas-cyan/5'
            : 'border-atlas-border hover:border-atlas-muted hover:bg-atlas-surface/50'
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet size={36} className="text-atlas-cyan" />
            <p className="font-display font-600 text-atlas-text">{file.name}</p>
            <p className="text-xs text-atlas-muted font-body">{(file.size / 1024 / 1024).toFixed(2)} MB · Click or drop to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={36} className="text-atlas-muted" />
            <p className="font-display font-600 text-atlas-text">{isDragActive ? 'Drop it here' : 'Drag & drop your file here'}</p>
            <p className="text-xs text-atlas-muted font-body">or click to browse · CSV, XLS, XLSX</p>
          </div>
        )}
      </div>

      {/* Upload button */}
      {file && stepIndex === -1 && !result && (
        <button onClick={handleUpload} className="atlas-btn-primary w-full mt-4 flex items-center justify-center gap-2">
          <Upload size={15} /> Process File
        </button>
      )}

      {/* Progress steps */}
      {stepIndex >= 0 && (
        <div className="atlas-card mt-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-600 text-sm text-atlas-text">Processing</p>
            <p className="text-xs text-atlas-muted font-mono">{progress}%</p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-atlas-border rounded-full h-1.5 mb-5">
            <div
              className="h-1.5 rounded-full bg-atlas-accent transition-all duration-300"
              style={{ width: `${Math.max(progress, (stepIndex / (STEPS.length - 1)) * 100)}%` }}
            />
          </div>

          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className={clsx('w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300', {
                  'bg-atlas-accent/20 border border-atlas-accent': i === stepIndex,
                  'bg-green-500/20 border border-green-500': i < stepIndex,
                  'bg-atlas-border/50 border border-atlas-border': i > stepIndex,
                })}>
                  {i < stepIndex
                    ? <CheckCircle size={12} className="text-green-400" />
                    : i === stepIndex
                    ? <Loader2 size={12} className="text-atlas-glow animate-spin" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-atlas-muted" />}
                </div>
                <span className={clsx('text-sm font-body', {
                  'text-atlas-glow': i === stepIndex,
                  'text-green-400': i < stepIndex,
                  'text-atlas-muted': i > stepIndex,
                })}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 atlas-card p-4 border-red-500/30 bg-red-500/5 flex items-center gap-3">
          <XCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300 font-body">{error}</p>
        </div>
      )}

      {/* Success result */}
      {result && (
        <div className="mt-6 atlas-card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle size={20} className="text-green-400" />
            <h3 className="font-display font-600 text-atlas-text">Dataset ready</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Rows', value: result.rows?.toLocaleString() },
              { label: 'Columns', value: result.columns },
              { label: 'Missing %', value: `${result.missing_pct ?? 0}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-atlas-bg rounded-xl p-4 text-center">
                <p className="font-display font-700 text-xl text-gradient-blue">{value ?? '—'}</p>
                <p className="text-xs text-atlas-muted mt-1 uppercase tracking-wider font-body">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/app/analyze', { state: { datasetId: result.dataset_id } })} className="atlas-btn-primary flex-1 flex items-center justify-center gap-2">
              Analyze <ArrowRight size={14} />
            </button>
            <button onClick={() => { setFile(null); setResult(null); setStepIndex(-1) }} className="atlas-btn-ghost">
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
