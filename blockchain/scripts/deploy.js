import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { artifacts, network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const voting = await ethers.deployContract("Voting");
  await voting.waitForDeployment();

  const artifact = await artifacts.readArtifact("Voting");
  const address = await voting.getAddress();
  const outputPath = path.resolve(process.cwd(), "..", "contracts", "Voting.json");

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        contractName: artifact.contractName,
        address,
        abi: artifact.abi,
      },
      null,
      2,
    ),
  );

  console.log(`Voting deployed to: ${address}`);
  console.log(`ABI written to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
