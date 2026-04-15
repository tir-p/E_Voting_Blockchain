import { network } from "hardhat";

import { writeFrontendArtifact } from "./shared.js";

async function main() {
  const { ethers } = await network.connect();
  const voting = await ethers.deployContract("Voting");
  await voting.waitForDeployment();

  const address = await writeFrontendArtifact(voting);

  console.log(`Voting deployed to: ${address}`);
  console.log("Frontend contract artifact updated.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
