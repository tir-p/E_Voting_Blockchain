export default function ElectionBanner() {
  return (
    <section className="panel-dark glass-card hero">
      <div className="hero-copy">
        <span className="eyebrow">E-Voting Using Blockchain V2</span>
        <h1>Public counting with private-key controlled ballots.</h1>
        <p>
          Local JSON data handles NIC-to-wallet lookup. MetaMask proves wallet
          ownership. The Ethereum contract enforces registration, vote status,
          cancellation status, and the live tally visible to every observer.
        </p>
        <div className="hero-band">
          <div className="stat-chip">
            <strong>No logins</strong>
            <span>Eligibility comes from the pre-approved NIC map.</span>
          </div>
          <div className="stat-chip">
            <strong>On-chain rules</strong>
            <span>Double voting and re-voting after cancellation are blocked.</span>
          </div>
        </div>
      </div>
      <aside className="hero-aside">
        <div className="timeline-card">
          <h2>Audit posture</h2>
          <ul className="feature-list">
            <li>Results are read from the contract, not a private database.</li>
            <li>Each successful action returns a transaction hash for verification.</li>
            <li>NIC values stay off-chain and should be stored only as hashes.</li>
          </ul>
        </div>
        <div className="timeline-card">
          <h2>Authority boundary</h2>
          <ul className="feature-list">
            <li>Election authority registers eligible wallets on-chain.</li>
            <li>The voter JSON only confirms which wallet a NIC was bound to.</li>
            <li>Smart contract state is the final truth for every ballot.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
