import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function NICVerifyCard({
  nicValue,
  onNicChange,
  onVerify,
  verifying,
  walletAddress,
  verificationState,
}) {
  const canVerify = nicValue.trim() && walletAddress && !verifying;

  return (
    <section className="glass-card verify-card">
      <div className="split-header">
        <div>
          <span className="eyebrow">Step 2</span>
          <h2>Verify NIC</h2>
        </div>
        {verificationState.verified ? (
          <span className="status-badge is-live">Verified</span>
        ) : (
          <span className="status-badge is-neutral">Pending</span>
        )}
      </div>
      <p>
        The server hashes the NIC, checks the local voter JSON for a matching record,
        and returns the wallet bound to that NIC hash. The ballot unlocks only
        when it matches the connected MetaMask address.
      </p>
      <div className="field-stack">
        <label htmlFor="nic-input">NIC number</label>
        <input
          autoComplete="off"
          id="nic-input"
          inputMode="text"
          onChange={(event) => onNicChange(event.target.value)}
          placeholder="Enter NIC number"
          spellCheck="false"
          type="text"
          value={nicValue}
        />
        <small>The raw NIC stays off-chain and should be stored only as a hash in your voter data.</small>
      </div>
      {verificationState.assignedWallet && !verificationState.verified ? (
        <div className="message-box">
          <div className="summary-row">
            <strong>Assigned wallet</strong>
            <code className="wallet-code">{verificationState.assignedWallet}</code>
          </div>
        </div>
      ) : null}
      {verificationState.message ? (
        <div
          className={`message-box ${
            verificationState.verified ? "is-success" : verificationState.type === "error" ? "is-error" : ""
          }`}
        >
          {verificationState.message}
        </div>
      ) : null}
      <button className="cta-button" disabled={!canVerify} onClick={onVerify} type="button">
        {verifying ? (
          <span className="button-with-spinner">
            <LoadingSpinner light />
            Verifying NIC
          </span>
        ) : (
          "Verify NIC"
        )}
      </button>
    </section>
  );
}
