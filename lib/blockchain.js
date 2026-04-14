import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";

import votingArtifact from "@/contracts/Voting.json";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || "";
const EXPECTED_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
  ? Number(process.env.NEXT_PUBLIC_CHAIN_ID)
  : null;
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "";

function assertContractConfigured() {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS is not configured. Add the deployed contract address before using blockchain features.",
    );
  }
}

function getAbi() {
  return votingArtifact.abi || [];
}

function hasWindowEthereum() {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

async function getReadProvider() {
  assertContractConfigured();

  if (hasWindowEthereum()) {
    return new BrowserProvider(window.ethereum, "any");
  }

  if (RPC_URL) {
    return new JsonRpcProvider(RPC_URL);
  }

  throw new Error(
    "No blockchain provider is available. Install MetaMask in the browser or set NEXT_PUBLIC_RPC_URL for public reads.",
  );
}

async function getBrowserProvider() {
  assertContractConfigured();

  if (!hasWindowEthereum()) {
    throw new Error("MetaMask is not installed in this browser.");
  }

  return new BrowserProvider(window.ethereum, "any");
}

async function getContract({ writable = false } = {}) {
  const provider = writable ? await getBrowserProvider() : await getReadProvider();

  if (writable) {
    const signer = await provider.getSigner();
    return new Contract(CONTRACT_ADDRESS, getAbi(), signer);
  }

  return new Contract(CONTRACT_ADDRESS, getAbi(), provider);
}

function normalizeCandidate(candidate) {
  return {
    id: Number(candidate.id),
    name: candidate.name,
    party: candidate.party,
    voteCount: Number(candidate.voteCount),
  };
}

function normalizeVoterStatus(status) {
  return {
    isRegistered: Boolean(status.registered ?? status.isRegistered),
    hasVoted: Boolean(status.voted ?? status.hasVoted),
    hasCancelled: Boolean(status.cancelled ?? status.hasCancelled),
    votedFor: Number(status.candidateId ?? status.votedFor ?? 0),
  };
}

export async function connectWallet() {
  const provider = await getBrowserProvider();
  const accounts = await provider.send("eth_requestAccounts", []);

  if (!accounts.length) {
    throw new Error("No wallet account was returned by MetaMask.");
  }

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  if (EXPECTED_CHAIN_ID && chainId !== EXPECTED_CHAIN_ID) {
    throw new Error(
      `Wrong network selected. Expected chain ID ${EXPECTED_CHAIN_ID}, received ${chainId}.`,
    );
  }

  return {
    address: accounts[0],
    chainId,
    networkLabel: `${network.name} (${chainId})`,
  };
}

export async function getWalletState() {
  if (!hasWindowEthereum()) {
    return {
      address: "",
      chainId: 0,
      networkLabel: "MetaMask not detected",
    };
  }

  const provider = await getBrowserProvider();
  const accounts = await provider.send("eth_accounts", []);
  const network = await provider.getNetwork();

  return {
    address: accounts[0] || "",
    chainId: Number(network.chainId),
    networkLabel: `${network.name} (${Number(network.chainId)})`,
  };
}

export function subscribeToWalletEvents({ onAccountsChanged, onChainChanged }) {
  if (!hasWindowEthereum()) {
    return () => {};
  }

  const handleAccountsChanged = (accounts) => {
    onAccountsChanged(accounts[0] || "");
  };
  const handleChainChanged = () => {
    onChainChanged();
  };

  window.ethereum.on("accountsChanged", handleAccountsChanged);
  window.ethereum.on("chainChanged", handleChainChanged);

  return () => {
    if (!hasWindowEthereum()) {
      return;
    }

    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    window.ethereum.removeListener("chainChanged", handleChainChanged);
  };
}

export async function getCandidates() {
  const contract = await getContract();
  const candidates = await contract.getCandidates();
  return candidates.map(normalizeCandidate);
}

export async function getResults() {
  return getCandidates();
}

export async function getElectionSummary() {
  const contract = await getContract();
  const [candidates, electionOpen] = await Promise.all([
    contract.getCandidates(),
    contract.electionOpen(),
  ]);

  return {
    contractAddress: CONTRACT_ADDRESS,
    electionOpen: Boolean(electionOpen),
    totalVotes: candidates.reduce(
      (sum, candidate) => sum + Number(candidate.voteCount),
      0,
    ),
  };
}

export async function getVoterStatus(walletAddress) {
  if (!walletAddress) {
    return {
      isRegistered: false,
      hasVoted: false,
      hasCancelled: false,
      votedFor: 0,
    };
  }

  const contract = await getContract();
  const status = await contract.getVoterStatus(walletAddress);
  return normalizeVoterStatus(status);
}

export async function castVote(candidateId) {
  const contract = await getContract({ writable: true });
  const transaction = await contract.castVote(candidateId);
  const receipt = await transaction.wait();

  return {
    transactionHash: receipt.hash,
  };
}

export async function cancelVote() {
  const contract = await getContract({ writable: true });
  const transaction = await contract.cancelVote();
  const receipt = await transaction.wait();

  return {
    transactionHash: receipt.hash,
  };
}

export async function trackVoteRecord(record) {
  try {
    const response = await fetch("/api/vote-record", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function extractErrorMessage(error) {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.shortMessage) {
    return error.shortMessage;
  }

  if (error.reason) {
    return error.reason;
  }

  if (error.info?.error?.message) {
    return error.info.error.message;
  }

  if (error.data?.message) {
    return error.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "";
}

export function formatContractError(error) {
  const message = extractErrorMessage(error);

  if (!message) {
    return "An unexpected blockchain error occurred.";
  }

  return message
    .replace(/^execution reverted:\s*/i, "")
    .replace(/^Error:\s*/i, "");
}

export function shortAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
