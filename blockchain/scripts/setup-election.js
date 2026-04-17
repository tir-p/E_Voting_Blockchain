import { network } from "hardhat";

import { loadEligibleWallets, writeFrontendArtifact } from "./shared.js";

async function main() {
  const { ethers } = await network.connect();
  const eligibleWallets = await loadEligibleWallets();
  const voting = await ethers.deployContract("Voting");
  await voting.waitForDeployment();

  const address = await writeFrontendArtifact(voting);

  if (eligibleWallets.length > 0) {
    const registerTx = await voting.registerVoters(eligibleWallets);
    await registerTx.wait();
    console.log(`Registered ${eligibleWallets.length} eligible voter wallets.`);
    console.log(`Registration transaction: ${registerTx.hash}`);
  } else {
    console.log("No eligible wallets found to register.");
  }

  const openElection = true;

  if (openElection) {
    const openTx = await voting.openElection();
    await openTx.wait();
    console.log("Election opened.");
    console.log(`Open transaction: ${openTx.hash}`);
  } else {
    console.log("Election left closed because OPEN_ELECTION=false.");
  }

  console.log(`Voting deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
