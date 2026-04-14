import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function ConnectWallet({
  walletAddress,
  networkLabel,
  walletError,
  onConnect,
  loading,
}) {
  return (
    <section className="glass-card voter-card">
      <div className="split-header">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2>Connect MetaMask</h2>
        </div>
        <span className="wallet-badge">{networkLabel || "Network unknown"}</span>
      </div>
      <p>
        Transactions are authorized by the private key holder, so only the owner
        of the registered wallet can cast or cancel a vote.
      </p>
      <div className="info-grid">
        <div className="info-chip">
          <strong>Required wallet</strong>
          <span>Use the address that was registered before the election.</span>
        </div>
        <div className="info-chip">
          <strong>Current network</strong>
          <span>{networkLabel || "Connect MetaMask to detect the active chain."}</span>
        </div>
      </div>
      {walletAddress ? (
        <div className="message-box is-success">
          <div className="wallet-line">
            <strong>Connected wallet</strong>
            <code className="wallet-code">{walletAddress}</code>
          </div>
        </div>
      ) : null}
      {walletError ? <div className="message-box is-error">{walletError}</div> : null}
      <button className="cta-button" disabled={loading} onClick={onConnect} type="button">
        {loading ? (
          <span className="button-with-spinner">
            <LoadingSpinner light />
            Connecting wallet
          </span>
        ) : walletAddress ? (
          "Reconnect Wallet"
        ) : (
          "Connect Wallet"
        )}
      </button>
    </section>
  );
}
