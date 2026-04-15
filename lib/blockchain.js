import { ethers } from "ethers";

import contractArtifact from "@/contracts/Voting.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractArtifact.address;
const CHAIN_ID = BigInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";
function ensureContractAddress() {
  if (!CONTRACT_ADDRESS || !ethers.isAddress(CONTRACT_ADDRESS)) {
    throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS to a deployed Voting contract address.");
  }

  return CONTRACT_ADDRESS;
}

function getEthereum() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  return window.ethereum;
}

function getNetworkLabel(chainId) {
  if (chainId === 31337n) {
    return "Localhost 8545";
  }

  if (chainId === 11155111n) {
    return "Sepolia";
  }

  if (chainId === 1n) {
    return "Ethereum Mainnet";
  }

  return `Chain ${chainId.toString()}`;
}

function getExplorerBaseUrl(chainId) {
  if (chainId === 11155111n) {
    return "https://sepolia.etherscan.io";
  }

  if (chainId === 1n) {
    return "https://etherscan.io";
  }

  return "";
}

async function getBrowserProvider() {
  return new ethers.BrowserProvider(getEthereum());
}

async function getReadProvider() {
  if (typeof window !== "undefined" && window.ethereum) {
    return getBrowserProvider();
  }

  if (RPC_URL) {
    return new ethers.JsonRpcProvider(RPC_URL);
  }

  throw new Error(
    "No blockchain provider is available. Connect MetaMask or set NEXT_PUBLIC_RPC_URL.",
  );
}

async function getContract({ withSigner = false } = {}) {
  const address = ensureContractAddress();
  const provider = await getReadProvider();

  if (withSigner) {
    if (!(provider instanceof ethers.BrowserProvider)) {
      throw new Error("A browser wallet is required to sign transactions.");
    }

    const signer = await provider.getSigner();
    return new ethers.Contract(address, contractArtifact.abi, signer);
  }

  return new ethers.Contract(address, contractArtifact.abi, provider);
}

function mapCandidates(rawCandidates) {
  return rawCandidates.map((candidate) => ({
    id: Number(candidate.id),
    name: candidate.name,
    party: candidate.party,
    voteCount: Number(candidate.voteCount),
  }));
}

export function shortAddress(address) {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getAddressUrl(address, chainId = CHAIN_ID) {
  const baseUrl = getExplorerBaseUrl(chainId);

  if (!baseUrl || !address) {
    return "";
  }

  return `${baseUrl}/address/${address}`;
}

export function getTransactionUrl(hash, chainId = CHAIN_ID) {
  const baseUrl = getExplorerBaseUrl(chainId);

  if (!baseUrl || !hash) {
    return "";
  }

  return `${baseUrl}/tx/${hash}`;
}

export function formatContractError(error) {
  const message =
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    "";

  if (message.includes("Voter not registered")) {
    return "This wallet is not registered to vote on-chain.";
  }

  if (message.includes("Vote already cast")) {
    return "This wallet has already cast a vote.";
  }

  if (message.includes("Election is closed")) {
    return "The election is currently closed on-chain.";
  }

  if (message.includes("Vote was cancelled permanently")) {
    return "This wallet cancelled its vote and cannot vote again.";
  }

  if (message.includes("No vote to cancel")) {
    return "No recorded vote was found for this wallet.";
  }

  if (message.includes("Invalid candidate")) {
    return "The selected candidate is invalid.";
  }

  if (message.includes("user rejected")) {
    return "The MetaMask transaction was rejected.";
  }

  if (message.includes("MetaMask is not installed")) {
    return "MetaMask is not installed.";
  }

  return message || "Blockchain request failed. Please try again.";
}

export async function getWalletState() {
  const provider = await getBrowserProvider();
  const accounts = await provider.send("eth_accounts", []);
  const network = await provider.getNetwork();

  return {
    address: accounts[0]?.toLowerCase() || "",
    chainId: network.chainId,
    networkLabel: getNetworkLabel(network.chainId),
  };
}

export function subscribeToWalletEvents({ onAccountsChanged, onChainChanged }) {
  if (typeof window === "undefined" || !window.ethereum) {
    return () => {};
  }

  const handleAccountsChanged = (accounts) => {
    onAccountsChanged?.(accounts[0]?.toLowerCase() || "");
  };
  const handleChainChanged = () => {
    onChainChanged?.();
  };

  window.ethereum.on("accountsChanged", handleAccountsChanged);
  window.ethereum.on("chainChanged", handleChainChanged);

  return () => {
    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    window.ethereum.removeListener("chainChanged", handleChainChanged);
  };
}

export async function connectWallet() {
  try {
    const provider = await getBrowserProvider();
    const accounts = await provider.send("eth_requestAccounts", []);
    const network = await provider.getNetwork();

    return {
      address: accounts[0]?.toLowerCase() || "",
      chainId: network.chainId,
      networkLabel: getNetworkLabel(network.chainId),
    };
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function checkNetwork() {
  const { chainId } = await getWalletState();

  if (chainId !== CHAIN_ID) {
    throw new Error(`Please switch MetaMask to ${getNetworkLabel(CHAIN_ID)}.`);
  }
}

export async function getCandidates() {
  try {
    const contract = await getContract();
    const candidates = await contract.getCandidates();
    return mapCandidates(candidates);
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function castVote(candidateId) {
  try {
    await checkNetwork();
    const contract = await getContract({ withSigner: true });
    const tx = await contract.castVote(candidateId);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      receipt,
    };
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function cancelVote() {
  try {
    await checkNetwork();
    const contract = await getContract({ withSigner: true });
    const tx = await contract.cancelVote();
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      receipt,
    };
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function getResults() {
  try {
    const contract = await getContract();
    const [names, parties, voteCounts] = await contract.getResults();

    return names.map((name, index) => ({
      id: index + 1,
      name,
      party: parties[index],
      voteCount: Number(voteCounts[index]),
    }));
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function getVoterStatus(walletAddress) {
  try {
    const contract = await getContract();
    const status = await contract.getVoterStatus(walletAddress);

    return {
      isRegistered: status.registered,
      hasVoted: status.voted,
      hasCancelled: status.cancelled,
      votedFor: Number(status.candidateId),
    };
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function getElectionSummary() {
  try {
    const contract = await getContract();
    const [electionOpen, results] = await Promise.all([
      contract.electionOpen(),
      contract.getResults(),
    ]);
    const totalVotes = results[2].reduce((sum, value) => sum + Number(value), 0);

    return {
      contractAddress: ensureContractAddress(),
      electionOpen,
      totalVotes,
    };
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function trackVoteRecord(record) {
  const response = await fetch("/api/vote-record", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to store vote metadata.");
  }

  return payload;
}
