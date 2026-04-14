import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function CancelModal({ open, onClose, onConfirm, loading }) {
  if (!open) {
    return null;
  }

  return (
    <div aria-modal="true" className="modal-backdrop" role="dialog">
      <div className="modal-card">
        <span className="eyebrow">Confirm Cancellation</span>
        <h2>Cancel the recorded vote?</h2>
        <p>
          This decrements the selected candidate&apos;s total on-chain and marks
          the wallet as cancelled forever. After this transaction is mined, the
          wallet cannot vote again in the same election.
        </p>
        <div className="message-box is-error">
          Cancellation is final. This wallet will remain in a cancelled state
          even though the vote count is removed.
        </div>
        <div className="modal-actions">
          <button className="secondary-button" disabled={loading} onClick={onClose} type="button">
            Keep Vote
          </button>
          <button className="danger-button" disabled={loading} onClick={onConfirm} type="button">
            {loading ? (
              <span className="button-with-spinner">
                <LoadingSpinner light />
                Waiting for wallet
              </span>
            ) : (
              "Cancel Vote"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
