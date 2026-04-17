# Blockchain Package

This Hardhat 3 package controls deployment and election administration for the
voting contract.

## Available Commands

- `npm run compile`
  Compile the contract.
- `npm test`
  Run the contract test suite.
- `npm run node`
  Start a local JSON-RPC node for MetaMask and local frontend testing.
- `npm run deploy:local`
  Deploy only the contract to the local node and update `../contracts/Voting.json`.
- `npm run setup:localhost`
  Deploy the contract, register every eligible wallet from `../data/voters.json`,
  and open the election.
- `npm run register:voters:localhost`
  Register every eligible wallet in `../data/voters.json` against the already
  deployed contract.
- `npm run open:election:localhost`
  Open the deployed election.
- `npm run close:election:localhost`
  Close the deployed election.
- `npm run setup:sepolia`
  Deploy the contract, register eligible wallets, and open the election on Sepolia.

## Files

- `contracts/Voting.sol`
  The smart contract.
- `scripts/deploy.js`
  Deploys the contract and updates the frontend ABI artifact.
- `scripts/setup-election.js`
  Deploys, bulk-registers voters from JSON, and opens the election.
- `scripts/register-voters.js`
  Bulk-registers wallets from `../data/voters.json`.
