import ElectionBanner from "@/components/LandingPage/ElectionBanner";
import ProceedButton from "@/components/LandingPage/ProceedButton";
import ResultsChart from "@/components/LandingPage/ResultsChart";

export default function Home() {
  return (
    <main className="shell">
      <section className="overview-ribbon">
        <div className="overview-stat">
          <strong>Public access</strong>
          <span>Results page stays open to every observer.</span>
        </div>
        <div className="overview-stat">
          <strong>No sessions</strong>
          <span>Eligibility is derived from NIC-to-wallet binding only.</span>
        </div>
        <div className="overview-stat">
          <strong>One-time cancel</strong>
          <span>Cancellation removes the vote and permanently locks re-voting.</span>
        </div>
      </section>
      <ElectionBanner />
      <section className="dashboard-grid">
        <ResultsChart />
        <aside className="info-column">
          <div className="glass-card info-card">
            <span className="eyebrow">Verification Model</span>
            <h2>Firebase lookup. MetaMask proof. Blockchain finality.</h2>
            <p>
              Voters do not log in. They enter a NIC number, the server checks
              the pre-registered NIC hash in Firestore, and the connected wallet
              must match the assigned address before the ballot appears.
            </p>
          </div>
          <div className="glass-card info-card">
            <span className="eyebrow">Election Rules</span>
            <ul className="feature-list">
              <li>One registered wallet can cast one vote.</li>
              <li>Cancellation is allowed once and permanently ends eligibility.</li>
              <li>Results are read directly from the smart contract.</li>
            </ul>
          </div>
          <ProceedButton />
        </aside>
      </section>
    </main>
  );
}
