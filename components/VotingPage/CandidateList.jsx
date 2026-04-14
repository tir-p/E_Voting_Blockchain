export default function CandidateList({
  candidates,
  selectedCandidateId,
  onSelect,
  onOpenVoteModal,
  disabled,
  loading,
  note,
  noteTone,
}) {
  return (
    <section className="glass-card candidate-shell">
      <div className="split-header">
        <div>
          <span className="eyebrow">Step 3</span>
          <h2>Select a candidate</h2>
        </div>
        <span className={`pill ${disabled ? "is-warning" : "is-live"}`}>
          {disabled ? "Locked" : "Ready to vote"}
        </span>
      </div>
      <p>
        The contract enforces whether this wallet can still vote. The interface
        only forwards a candidate choice after NIC verification and on-chain
        status checks both pass.
      </p>
      {note ? (
        <div className={`message-box ${noteTone ? `is-${noteTone}` : ""}`}>{note}</div>
      ) : null}
      {loading ? (
        <div className="candidate-loading">
          <div className="skeleton" />
        </div>
      ) : candidates.length ? (
        <div className="candidate-list">
          {candidates.map((candidate) => {
            const selected = selectedCandidateId === candidate.id;

            return (
              <label
                className={`candidate-option ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                key={candidate.id}
              >
                <div className="candidate-radio">
                  <input
                    checked={selected}
                    disabled={disabled}
                    name="candidate"
                    onChange={() => onSelect(candidate.id)}
                    type="radio"
                    value={candidate.id}
                  />
                  <span className="candidate-meta">
                    <span className="candidate-party-line">
                      <strong>{candidate.party || candidate.name}</strong>
                      <span className="candidate-tag">Candidate #{candidate.id}</span>
                    </span>
                    <span>{candidate.name}</span>
                  </span>
                </div>
                <div className="candidate-stats">
                  <strong>{candidate.voteCount}</strong>
                  <span>Votes on chain</span>
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="message-box is-warning">
          Candidate data is not available yet. Confirm the contract is deployed
          and the ABI/address configuration is correct.
        </div>
      )}
      <div className="candidate-actions">
        <button
          className="cta-button"
          disabled={disabled || loading || !selectedCandidateId}
          onClick={onOpenVoteModal}
          type="button"
        >
          Confirm Vote
        </button>
      </div>
    </section>
  );
}
