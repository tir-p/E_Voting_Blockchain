import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAddress } from "ethers";

import { hashNic, normalizeWalletAddress } from "@/lib/crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const VOTERS_FILE = path.join(DATA_DIR, "voters.json");
const VOTE_RECORDS_FILE = path.join(DATA_DIR, "vote-records.json");

async function readJsonFile(filePath, fallbackValue) {
  try {
    const fileContents = await readFile(filePath, "utf8");
    const trimmed = fileContents.trim();

    if (!trimmed) {
      return fallbackValue;
    }

    return JSON.parse(fileContents);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return fallbackValue;
    }

    throw error;
  }
}

function normalizeVoterDataset(data) {
  if (Array.isArray(data)) {
    return { voters: data };
  }

  if (data && typeof data === "object" && Array.isArray(data.voters)) {
    return data;
  }

  return { voters: [] };
}

function normalizeVoteRecordDataset(data) {
  if (Array.isArray(data)) {
    return { records: data };
  }

  if (data && typeof data === "object" && Array.isArray(data.records)) {
    return data;
  }

  return { records: [] };
}

export async function findEligibleVoterByNic(nic) {
  const nicHash = hashNic(nic);
  const data = normalizeVoterDataset(await readJsonFile(VOTERS_FILE, { voters: [] }));
  const voter = data.voters.find((entry) => entry.nicHash === nicHash);

  if (!voter) {
    return null;
  }

  if (!isAddress(voter.walletAddress)) {
    throw new Error(`Invalid wallet address stored for NIC hash ${nicHash}.`);
  }

  return {
    nicHash,
    walletAddress: normalizeWalletAddress(voter.walletAddress),
    isEligible: Boolean(voter.isEligible),
    fullName: voter.fullName || "",
  };
}

export async function saveVoteRecord(record) {
  const data = normalizeVoteRecordDataset(
    await readJsonFile(VOTE_RECORDS_FILE, { records: [] }),
  );
  const walletAddress = normalizeWalletAddress(record.walletAddress);
  const timestamp = new Date().toISOString();
  const existingIndex = data.records.findIndex(
    (entry) => normalizeWalletAddress(entry.walletAddress) === walletAddress,
  );

  if (!isAddress(walletAddress)) {
    throw new Error("Vote record wallet address is not a valid Ethereum address.");
  }

  if (record.action === "vote") {
    const nextRecord = {
      walletAddress,
      votedCandidateId: record.candidateId ?? null,
      voteTransactionHash: record.transactionHash,
      cancelled: false,
      cancelTransactionHash: null,
      votedAt: timestamp,
      cancelledAt: null,
    };

    if (existingIndex >= 0) {
      data.records[existingIndex] = nextRecord;
    } else {
      data.records.push(nextRecord);
    }
  } else if (record.action === "cancel") {
    if (existingIndex === -1) {
      throw new Error("No vote record found for this wallet.");
    }

    data.records[existingIndex] = {
      ...data.records[existingIndex],
      cancelled: true,
      cancelTransactionHash: record.transactionHash,
      cancelledAt: timestamp,
    };
  } else {
    throw new Error("Unsupported vote record action.");
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(VOTE_RECORDS_FILE, `${JSON.stringify(data, null, 2)}\n`);
}
