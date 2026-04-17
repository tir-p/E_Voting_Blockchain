export default function PostVoteCard({
  selectedCandidate,
  transactionHash,
  transactionUrl,
  canCancel,
  cancelled,
  loading,
  onCancel,
}) {
  const statusLabel = cancelled
    ? "Cancelled and permanently ineligible"
    : canCancel
      ? "Vote recorded"
      : "Waiting for on-chain eligibility";

  return (
    <section className="glass-card status-card">
      <div className="post-vote-card">
        <div className="split-header">
          <div>
            <span className="eyebrow">Step 4</span>
            <h3>Post-vote status</h3>
          </div>
          <span className={`status-badge ${cancelled ? "is-closed" : "is-live"}`}>
            {statusLabel}
          </span>
        </div>

        <div className="summary-grid">
          <div className="summary-row">
            <strong>Selected candidate</strong>
            <span>{selectedCandidate?.party || selectedCandidate?.name || "Not recorded yet"}</span>
          </div>
          <div className="summary-row">
            <strong>Candidate label</strong>
            <span>{selectedCandidate?.name || "Not recorded yet"}</span>
          </div>
          <div className="summary-row">
            <strong>Cancellation rule</strong>
            <span>
              {cancelled
                ? "Already cancelled"
                : "One-time cancellation remains available until used"}
            </span>
          </div>
        </div>

        {transactionHash ? (
          <div className="message-box">
            <div className="hash-row">
              <strong>Latest transaction hash</strong>
              <code>{transactionHash}</code>
            </div>
            {transactionUrl ? (
              <p className="message-subtext">
                <a href={transactionUrl} rel="noreferrer" target="_blank">
                  Open this transaction in the blockchain explorer.
                </a>
              </p>
            ) : (
              <p className="message-subtext">
                Keep this hash if you want to confirm the action in a blockchain explorer.
              </p>
            )}
          </div>
        ) : null}

        {cancelled ? (
          <div className="message-box is-error">
            This wallet has already cancelled the vote. The contract will reject
            any future vote attempts from the same address for this election.
          </div>
        ) : null}

        {!cancelled && canCancel ? (
          <div className="post-vote-actions">
            <button className="danger-button" disabled={loading} onClick={onCancel} type="button">
              Cancel Vote
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
