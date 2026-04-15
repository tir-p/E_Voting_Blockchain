import { Contract } from "ethers";
import { network } from "hardhat";

import { loadEligibleWallets, loadFrontendArtifact } from "./shared.js";

async function main() {
  const { ethers } = await network.connect();
  const [owner] = await ethers.getSigners();
  const contractArtifact = await loadFrontendArtifact();
  const eligibleWallets = await loadEligibleWallets();

  if (!contractArtifact.address) {
    throw new Error("contracts/Voting.json does not contain a deployed contract address.");
  }

  if (eligibleWallets.length === 0) {
    console.log("No eligible voter wallets found in data/voters.json.");
    return;
  }

  const voting = new Contract(contractArtifact.address, contractArtifact.abi, owner);
  const tx = await voting.registerVoters(eligibleWallets);
  await tx.wait();

  console.log(`Registered ${eligibleWallets.length} eligible voter wallets.`);
  console.log(`Transaction hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
