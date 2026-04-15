# E-Voting Using Blockchain V2

Blockchain-based e-voting system built with Next.js 16 App Router, local JSON
data storage, Solidity, Hardhat 3, ethers, and MetaMask.

## Architecture

- `data/voters.json` stores the hashed NIC to wallet mapping.
- `data/vote-records.json` stores off-chain vote and cancellation metadata.
- `Next.js` renders the landing page, voting flow, and App Router APIs.
- `Ethereum` is the source of truth for voter registration, vote state,
  cancellation state, and live results.

## Main Features

- Landing page with live on-chain bar chart and pie chart results
- NIC verification through a server-side JSON lookup
- One NIC bound to one wallet address
- MetaMask voting and one-time cancellation
- On-chain vote totals that decrease after cancellation
- Cancelled wallets cannot vote again

## Data Files

- `data/voters.json`
  Contains hashed NICs and the wallet assigned to each voter.
- `data/vote-records.json`
  Stores the latest vote or cancellation transaction hash for each wallet.
- `scripts/voters.raw.example.json`
  Editable source file for raw NIC values and wallet assignments before hashing.

## Local Demo Order

1. Install dependencies in both folders:
   `npm install`
   `cd blockchain && npm install`
2. Generate hashed voter data:
   `npm run data:generate`
3. Reset vote metadata:
   `npm run data:reset-records`
4. Start a local Ethereum node:
   `cd blockchain && npm run node`
5. In a second terminal, deploy the contract, register every eligible wallet
   from `data/voters.json`, and open the election:
   `cd blockchain && npm run setup:localhost`
6. Copy `.env.local.example` to `.env.local`.
7. Start the Next.js app:
   `npm run dev`
8. Open MetaMask, add the local network `http://127.0.0.1:8545` with chain ID
   `31337`, then import one of the demo voter private keys below.

## Local Demo Voters

These are standard Hardhat local development accounts. Use them only for local
testing.

- `A123456789012` -> `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
  Private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- `B987654321098` -> `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
  Private key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- `C456123789654` -> `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
  Private key: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

The contract owner for local setup uses:

- `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
  Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

## Production-Like Setup

If you later move from localhost to Sepolia:

1. Replace the wallets in `scripts/voters.raw.example.json` with the real voter
   wallets.
2. Run `npm run data:generate`.
3. Configure `.env.local` and the blockchain environment with your Sepolia RPC
   URL and deployer private key.
4. Run:
   `cd blockchain && npx hardhat run scripts/setup-election.js --network sepolia`

## Verification

- Root app: `npm run lint`
- Root app: `npm run build`
- Contract suite: `cd blockchain && npm test`
