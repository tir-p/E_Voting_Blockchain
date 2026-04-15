import { readFile } from "node:fs/promises";
import path from "node:path";
import { ethers } from "ethers";

const ARTIFACT_PATH = path.join(process.cwd(), "contracts", "Voting.json");
const POLL_INTERVAL_MS = 1000;
const MAX_RETRIES = Number(process.env.WAIT_FOR_CONTRACT_ARTIFACT_RETRIES ?? 60);
const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "http://hardhat-node:8545";

async function readContractArtifact() {
  const raw = await readFile(ARTIFACT_PATH, "utf8");
  return JSON.parse(raw);
}

async function resolveAddress() {
  const artifact = await readContractArtifact();
  return String(artifact.address || "").trim();
}

async function hasDeployedCode(address) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const code = await provider.getCode(address);
  return code && code !== "0x";
}

async function waitForArtifact() {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt += 1;

    try {
      const address = await resolveAddress();

      if (!address) {
        console.log(`Waiting for contract artifact: no address found (attempt ${attempt}/${MAX_RETRIES})`);
      } else {
        console.log(`Found contract address ${address}. Validating on RPC ${RPC_URL}...`);

        if (await hasDeployedCode(address)) {
          console.log("Contract code confirmed at deployed address. Proceeding.");
          return;
        }

        console.log(
          `No deployed contract code found at ${address}. Waiting for deployment to complete... (attempt ${attempt}/${MAX_RETRIES})`,
        );
      }
    } catch (error) {
      console.log(`Waiting for contract artifact: ${error instanceof Error ? error.message : String(error)} (attempt ${attempt}/${MAX_RETRIES})`);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Timeout waiting for deployed contract artifact. Check that the deployment service has completed and that ${ARTIFACT_PATH} contains a valid deployed address.`,
  );
}

await waitForArtifact();
