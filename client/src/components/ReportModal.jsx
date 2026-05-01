export default function ReportModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Report">
      <div className="modal report-modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Report</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close report">✕</button>
        </div>

        <div className="report-body">
          <div className="report-section">
            <h3>Worker</h3>
            <p>{report.workerName || '—'}</p>
          </div>

          <div className="report-section">
            <h3>Date</h3>
            <p>{report.date || '—'}</p>
          </div>

          <div className="report-section">
            <h3>Time</h3>
            <p>{report.time || '—'}</p>
          </div>

          <div className="report-section">
            <h3>Transcript</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{report.transcript || '—'}</p>
          </div>
        </div>

        <div className="modal-footer">
          <p className="email-confirm">✓ Report emailed to supervisor</p>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>

      </div>
    </div>
  );
}
