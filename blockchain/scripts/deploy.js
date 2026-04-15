import { network } from "hardhat";

import { writeFrontendArtifact } from "./shared.js";

async function main() {
  const connection = await network.connect();
  const { ethers, networkConfig, networkName } = connection;

  console.log(`Deploying to network: ${networkName}`);
  console.log(`Network config:`, networkConfig);

  console.log("Deploying Voting contract...");
  const voting = await ethers.deployContract("Voting");
  console.log("Contract deployed, waiting for receipt...");

  const deploymentTx = await voting.deploymentTransaction();
  console.log(`Deployment transaction: ${deploymentTx?.hash}`);

  await voting.waitForDeployment();
  console.log("Deployment receipt confirmed");

  const address = await writeFrontendArtifact(voting);
  console.log(`Voting deployed to: ${address}`);

  // Verify that the deployed address is backed by contract code on the
  // active connection instead of assuming a top-level network.config.url.
  const rpcUrl =
    "url" in networkConfig && typeof networkConfig.url?.getUrl === "function"
      ? await networkConfig.url.getUrl()
      : undefined;
  console.log(
    `Verifying deployment on ${rpcUrl ?? "the active Hardhat connection"}...`,
  );

  const code = await ethers.provider.getCode(address);
  if (!code || code === "0x") {
    throw new Error(
      `Deployment failed: No contract code found at ${address}. Deployment may not have persisted.`,
    );
  }

  console.log("Contract code verified at deployed address.");
  console.log("Frontend contract artifact updated.");
}

main().catch((error) => {
  console.error("Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});
