import type { ReactNode } from 'react'

interface Props {
  title: string
  message: ReactNode
  confirmLabel?: string
  disabled?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, message, confirmLabel = 'Delete', disabled, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !disabled && onCancel()}>
      <div className="modal-box confirm-modal-box">
        <h2 className="modal-title">{title}</h2>
        <div className="confirm-modal-message">{message}</div>
        <div className="modal-footer">
          <button type="button" className="btn-outline" disabled={disabled} onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-danger" disabled={disabled} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
