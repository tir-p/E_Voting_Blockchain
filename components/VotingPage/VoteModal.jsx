import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function VoteModal({
  candidate,
  open,
  onClose,
  onConfirm,
  loading,
}) {
  if (!open || !candidate) {
    return null;
  }

  return (
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="modal-card">
        <span className="eyebrow">Confirm Vote</span>
        <h2>Submit ballot for {candidate.party || candidate.name}?</h2>
        <p>
          MetaMask will open next. After the transaction is confirmed on-chain,
          the vote becomes immutable unless you use the one-time cancellation
          path, which permanently ends further voting eligibility.
        </p>
        <div className="summary-grid">
          <div className="summary-row">
            <strong>Candidate</strong>
            <span>{candidate.name}</span>
          </div>
          <div className="summary-row">
            <strong>Party</strong>
            <span>{candidate.party || "Not specified"}</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" disabled={loading} onClick={onClose} type="button">
            Review Again
          </button>
          <button className="cta-button" disabled={loading} onClick={onConfirm} type="button">
            {loading ? (
              <span className="button-with-spinner">
                <LoadingSpinner light />
                Waiting for wallet
              </span>
            ) : (
              "Approve in MetaMask"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
