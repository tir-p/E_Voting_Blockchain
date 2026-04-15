import Link from "next/link";

import "./globals.css";

export const metadata = {
  title: "E-Voting Using Blockchain V2",
  description:
    "Blockchain-based e-voting with MetaMask authorization and public on-chain results.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-frame">
          <header className="site-header">
            <div className="site-header-inner">
              <Link className="brand-link" href="/">
                <span className="brand-mark">EV</span>
                <span className="brand-copy">
                  <strong>E-Voting Blockchain</strong>
                  <span>Wallet registration with on-chain finality</span>
                </span>
              </Link>
              <nav className="site-nav" aria-label="Primary">
                <Link href="/">Home</Link>
                <Link href="/voter">Vote</Link>
              </nav>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <p>
              Ethereum remains the authoritative election ledger. MetaMask proves
              that the connected wallet is eligible to vote.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
