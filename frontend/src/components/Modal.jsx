import './Modal.css'

export default function Modal({ title, icon, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-panel ${wide ? 'modal-panel-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {icon && <span className="modal-icon">{icon}</span>} {title}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
