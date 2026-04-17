import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { isAddress } from "ethers";
import { artifacts } from "hardhat";

const ROOT_DIR = path.resolve(process.cwd(), "..");
const FRONTEND_CONTRACT_PATH = path.join(ROOT_DIR, "contracts", "Voting.json");
const VOTERS_PATH = path.join(ROOT_DIR, "data", "voters.json");

export async function loadEligibleWallets() {
  const raw = await readFile(VOTERS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const voters = Array.isArray(parsed) ? parsed : parsed.voters || [];
  const wallets = [];
  const seen = new Set();

  for (const voter of voters) {
    if (!voter?.isEligible) {
      continue;
    }

    if (!isAddress(voter.walletAddress)) {
      throw new Error(`Invalid wallet address in voter data: ${voter.walletAddress}`);
    }

    const normalized = voter.walletAddress.toLowerCase();

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    wallets.push(normalized);
  }

  return wallets;
}

export async function writeFrontendArtifact(contract) {
  const artifact = await artifacts.readArtifact("Voting");
  const address = await contract.getAddress();

  await writeFile(
    FRONTEND_CONTRACT_PATH,
    `${JSON.stringify(
      {
        contractName: artifact.contractName,
        address,
        abi: artifact.abi,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return address;
}

export async function loadFrontendArtifact() {
  const raw = await readFile(FRONTEND_CONTRACT_PATH, "utf8");
  return JSON.parse(raw);
}
