import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAddress } from "ethers";

function normalizeNic(nic) {
  return String(nic || "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeWalletAddress(address) {
  return String(address || "").trim().toLowerCase();
}

function hashNic(nic) {
  const normalized = normalizeNic(nic);

  if (!normalized) {
    throw new Error("NIC number is required for every record.");
  }

  return createHash("sha256").update(normalized).digest("hex");
}

function buildVoterRecord(record) {
  const walletAddress = normalizeWalletAddress(record.walletAddress);

  if (!walletAddress) {
    throw new Error(`Missing walletAddress for NIC "${record.nic ?? ""}".`);
  }

  if (!isAddress(walletAddress)) {
    throw new Error(`Invalid Ethereum wallet address "${record.walletAddress}".`);
  }

  const nicHash = hashNic(record.nic);

  return {
    docId: nicHash,
    nicHash,
    walletAddress,
    isEligible: record.isEligible ?? true,
    fullName: record.fullName ?? "",
  };
}

async function main() {
  const inputPath = process.argv[2];
  const outputPath =
    process.argv[3] || path.resolve(process.cwd(), "voters.hashed.json");

  if (!inputPath) {
    console.error(
      "Usage: node scripts/generate-voter-hashes.mjs <input.json> [output.json]",
    );
    process.exit(1);
  }

  const source = await readFile(path.resolve(process.cwd(), inputPath), "utf8");
  const records = JSON.parse(source);

  if (!Array.isArray(records)) {
    throw new Error("Input file must contain a JSON array.");
  }

  const output = {
    voters: records.map(buildVoterRecord),
  };

  await writeFile(
    path.resolve(process.cwd(), outputPath),
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );

  console.log(`Generated ${output.voters.length} hashed voter records.`);
  console.log(`Output written to ${path.resolve(process.cwd(), outputPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
