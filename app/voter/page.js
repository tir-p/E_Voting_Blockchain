import Link from "next/link";

import VotingExperience from "@/components/VotingPage/VotingExperience";

export const metadata = {
  title: "Cast Vote | E-Voting Using Blockchain V2",
  description:
    "Connect MetaMask, verify a NIC-to-wallet binding, and cast or cancel a blockchain vote.",
};

export default function VoterPage() {
  return (
    <main className="shell">
      <div className="page-toolbar">
        <Link className="ghost-link" href="/">
          Home
        </Link>
      </div>
      <section className="panel-dark glass-card voter-hero">
        <span className="eyebrow">Voting Console</span>
        <h1>One NIC. One registered wallet. One on-chain ballot.</h1>
        <p>
          The ballot stays hidden until the connected wallet matches the
          wallet pre-assigned to the NIC hash stored in Firestore. Voting and
          cancellation both require MetaMask transaction approval.
        </p>
        <div className="step-strip">
          <div className="step-pill">
            <strong>01. Connect</strong>
            <span>Use the wallet registered before the election.</span>
          </div>
          <div className="step-pill">
            <strong>02. Verify</strong>
            <span>Submit the NIC for a secure off-chain lookup.</span>
          </div>
          <div className="step-pill">
            <strong>03. Vote</strong>
            <span>Select a candidate and confirm the transaction.</span>
          </div>
          <div className="step-pill">
            <strong>04. Cancel Once</strong>
            <span>Cancellation is final and permanently ends eligibility.</span>
          </div>
        </div>
      </section>
      <VotingExperience />
    </main>
  );
}
