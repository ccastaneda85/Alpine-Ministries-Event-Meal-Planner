import { useEffect, useState } from 'react'
import { Truck, Upload, Trash2, FileText } from 'lucide-react'
import { api, type VendorFileInfo } from '../services/api'
import { useBreadcrumb } from '../components/layout/BreadcrumbContext'
import ConfirmModal from './CalendarView/ConfirmModal'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function extractApiErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const match = raw.match(/^\d+:\s*(.*)$/s)
  return match ? match[1] : raw
}

export default function VendorsView() {
  useBreadcrumb(['Vendors'])
  const [files, setFiles] = useState<VendorFileInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listVendorFiles()
      setFiles(data)
    } catch (err) {
      setError(extractApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(name: string) {
    setDeleting(true)
    setError(null)
    try {
      await api.deleteVendorFile(name)
      await load()
      setPendingDelete(null)
    } catch (err) {
      setError(extractApiErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="groups-view">
      <div className="groups-header">
        <div>
          <h1 className="groups-title"><Truck size={20} /> Vendors</h1>
          <p className="groups-subtitle">Upload vendor catalog CSVs. Used by AI suggestions on purchase lists.</p>
        </div>
        <div>
          <button type="button" className="btn-gold" onClick={() => setShowUpload(true)}>
            <Upload size={15} /> Upload CSV
          </button>
        </div>
      </div>

      {error && <p className="field-error" style={{ marginBottom: 'var(--spacing-md)' }}>{error}</p>}

      {loading ? (
        <p className="empty-state">Loading vendor files...</p>
      ) : files.length === 0 ? (
        <p className="empty-state">
          No vendor CSV files uploaded yet. Click <strong>Upload CSV</strong> to add your first file.
        </p>
      ) : (
        <div className="vendor-file-list">
          {files.map(f => (
            <div key={f.name} className="vendor-file-card">
              <div className="vendor-file-icon">
                <FileText size={20} />
              </div>
              <div className="vendor-file-main">
                <div className="vendor-file-name">
                  {f.originalName}
                  {f.vendor && <span className="status-badge status-badge--gold vendor-file-vendor">{f.vendor}</span>}
                  {!f.vendor && <span className="status-badge status-badge--neutral vendor-file-vendor">no vendor</span>}
                </div>
                <div className="vendor-file-meta">
                  {formatSize(f.size)} · Uploaded {formatTimestamp(f.lastModified)}
                </div>
              </div>
              <div className="vendor-file-actions">
                <button
                  type="button"
                  className="kp-del-btn"
                  title="Delete file"
                  onClick={() => setPendingDelete(f.name)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadVendorModal
          onClose={() => setShowUpload(false)}
          onUploaded={async () => { setShowUpload(false); await load() }}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="Delete vendor file?"
          message={`This will permanently delete "${pendingDelete}". This cannot be undone.`}
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          disabled={deleting}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}

interface UploadProps {
  onClose: () => void
  onUploaded: () => void | Promise<void>
}

function UploadVendorModal({ onClose, onUploaded }: UploadProps) {
  const [vendor, setVendor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = vendor.trim().length > 0 && file !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !file) return
    setUploading(true)
    setError(null)
    try {
      await api.uploadVendorFile(vendor.trim(), file)
      await onUploaded()
    } catch (err) {
      setError(extractApiErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <h2 className="modal-title"><Truck size={20} /> Upload Vendor CSV</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Vendor <span className="field-required">*</span></label>
            <input
              required
              placeholder="e.g., Sysco, US Foods"
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              autoFocus
            />
            <p className="checkbox-hint">Only letters, numbers, dashes, and underscores are kept.</p>
          </div>
          <div className="form-group">
            <label>CSV File <span className="field-required">*</span></label>
            <input
              type="file"
              accept=".csv,text/csv"
              required
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error && <p className="field-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={uploading}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={!canSubmit || uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
