import { Contract } from "ethers";
import { network } from "hardhat";

import { loadFrontendArtifact } from "./shared.js";

async function main() {
  const { ethers } = await network.connect();
  const [owner] = await ethers.getSigners();
  const contractArtifact = await loadFrontendArtifact();

  if (!contractArtifact.address) {
    throw new Error("contracts/Voting.json does not contain a deployed contract address.");
  }

  const voting = new Contract(contractArtifact.address, contractArtifact.abi, owner);
  const tx = await voting.closeElection();
  await tx.wait();

  console.log("Election closed.");
  console.log(`Transaction hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
