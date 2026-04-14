# E-Voting Using Blockchain V2

Blockchain-based e-voting system built with Next.js 16 App Router, Firebase
Admin, Solidity, Hardhat 3, ethers, and MetaMask.

## Architecture

- `Firebase` stores the pre-registered NIC-hash to wallet mapping and optional vote metadata.
- `Next.js` renders the landing page, voting flow, and secure server APIs for NIC verification.
- `Ethereum` is the source of truth for registration, vote state, cancellation state, and results.

## Project Structure

- `app/` App Router pages and route handlers
- `components/` Landing page and voting flow UI
- `lib/` Blockchain, Firebase, and crypto helpers
- `contracts/` Frontend ABI artifact
- `blockchain/` Hardhat contract, deploy script, and tests

## Main Features

- No login, registration, or session handling
- NIC verification through a server-side Firestore lookup
- Wallet-to-NIC matching before the ballot is shown
- On-chain vote casting with MetaMask authorization
- One-time vote cancellation that permanently blocks re-voting
- Public landing page with live on-chain results

## Setup

1. Run `npm install` in the project root.
2. Run `npm install` in `blockchain/`.
3. Copy `.env.local.example` to `.env.local` and fill in the Firebase and contract values.
4. Run `npm run dev` in the project root.
5. Run `npm test` inside `blockchain/` to execute the smart contract test suite.

## Verification

- Root app: `npm run lint`
- Root app: `npm run build`
- Contract suite: `npm test` in `blockchain/`
