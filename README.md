# E-Voting Using Blockchain V2

Blockchain-based e-voting system built with Next.js 16 App Router, Solidity,
Hardhat 3, ethers, and MetaMask.

## Architecture

- `data/voters.json` stores eligible wallet addresses and registration flags.
- `data/vote-records.json` stores off-chain vote and cancellation metadata.
- `Next.js` renders the landing page, voting flow, and App Router APIs.
- `Ethereum` is the source of truth for voter registration, vote state,
  cancellation state, and live results.

## Main Features

- Landing page with live on-chain bar chart and pie chart results
- Wallet-based voting through MetaMask and on-chain registration checks
- One wallet per eligible voter address
- MetaMask voting and one-time cancellation
- On-chain vote totals that decrease after cancellation
- Cancelled wallets cannot vote again

## Data Files

- `data/voters.json`
  Contains wallet addresses and eligibility flags for voters.
- `data/vote-records.json`
  Stores the latest vote or cancellation transaction hash for each wallet.

## Sepolia Deployment

This repository now hardcodes the Sepolia RPC URL and contract settings, so no `.env` file is required.

1. Deploy the contract from the `blockchain` folder:
   `cd blockchain && npx hardhat run scripts/setup-election.js --network sepolia`
2. Open MetaMask, switch to Sepolia, and connect your wallet.
3. Open the app at `http://localhost:3000`.

## Local Demo Voters

These are standard Hardhat local development accounts. Use them only for local
testing.

- `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  Private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  Private key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
  Private key: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

The contract owner for local setup uses:

- `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

## Production-Like Setup

Use the Sepolia Deployment section above to configure your Sepolia RPC URL, private key, and contract address. Then deploy with `cd blockchain && npx hardhat run scripts/setup-election.js --network sepolia`.

## Verification

- Root app: `npm run lint`
- Root app: `npm run build`
- Contract suite: `cd blockchain && npm test`
