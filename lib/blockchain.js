import { ethers } from "ethers";

import contractArtifact from "@/contracts/Voting.json";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractArtifact.address;
const CHAIN_ID = BigInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "";
const LOCAL_RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_TRANSACTION_GAS_LIMIT = "0x493e0";
let contractCodeVerified = false;
let contractCodeVerificationPromise = null;

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

function getChainIdHex(chainId) {
  return `0x${chainId.toString(16)}`;
}

function getBrowserRpcUrl(chainId = CHAIN_ID) {
  if (chainId === 31337n) {
    return LOCAL_RPC_URL;
  }

  return RPC_URL;
}

async function getBrowserProvider() {
  return new ethers.BrowserProvider(getEthereum());
}

function getErrorCode(error) {
  return error?.code ?? error?.error?.code ?? error?.info?.error?.code;
}

function getNestedErrorMessage(error) {
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.error?.message ||
    error?.info?.error?.message ||
    error?.data?.message ||
    error?.message ||
    ""
  );
}

async function walletRequest(method, params = []) {
  return getEthereum().request({
    method,
    params,
  });
}

async function getBrowserChainId() {
  return BigInt(await walletRequest("eth_chainId"));
}

async function requestWalletAccounts({ forceAccountSelection = false } = {}) {
  if (forceAccountSelection) {
    try {
      await walletRequest("wallet_requestPermissions", [
        {
          eth_accounts: {},
        },
      ]);
    } catch (error) {
      const errorCode = getErrorCode(error);

      if (errorCode === 4001) {
        throw error;
      }

      if (errorCode !== -32601 && errorCode !== 4200) {
        throw error;
      }
    }
  }

  return walletRequest("eth_requestAccounts");
}

async function switchToConfiguredNetwork() {
  const currentChainId = await getBrowserChainId();

  if (currentChainId === CHAIN_ID) {
    return currentChainId;
  }

  const chainId = getChainIdHex(CHAIN_ID);

  try {
    await walletRequest("wallet_switchEthereumChain", [{ chainId }]);
  } catch (error) {
    if (getErrorCode(error) !== 4902) {
      throw error;
    }

    const rpcUrl = getBrowserRpcUrl();

    if (!rpcUrl) {
      throw new Error(`Add ${getNetworkLabel(CHAIN_ID)} to MetaMask before voting.`);
    }

    await walletRequest("wallet_addEthereumChain", [
      {
        chainId,
        chainName: getNetworkLabel(CHAIN_ID),
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: [rpcUrl],
      },
    ]);
  }

  return getBrowserChainId();
}

async function getReadProvider() {
  if (RPC_URL) {
    return new ethers.JsonRpcProvider(RPC_URL);
  }

  if (typeof window !== "undefined" && window.ethereum) {
    return getBrowserProvider();
  }

  throw new Error(
    "No blockchain provider is available. Connect MetaMask or set NEXT_PUBLIC_RPC_URL.",
  );
}

async function getContract({ withSigner = false } = {}) {
  const address = ensureContractAddress();
  const readProvider = await getReadProvider();
  await verifyContractDeployment(readProvider, address);

  if (withSigner) {
    const browserProvider = await getBrowserProvider();
    const signer = await browserProvider.getSigner();
    return new ethers.Contract(address, contractArtifact.abi, signer);
  }

  return new ethers.Contract(address, contractArtifact.abi, readProvider);
}

async function verifyContractDeployment(provider, address = ensureContractAddress()) {
  if (contractCodeVerified) {
    return;
  }

  contractCodeVerificationPromise ??= provider.getCode(address).then((deployedCode) => {
    if (!deployedCode || deployedCode === "0x") {
      throw new Error(
        `No contract was found at ${address}. Confirm the deployed contract address and network configuration.`,
      );
    }

    contractCodeVerified = true;
  });

  try {
    await contractCodeVerificationPromise;
  } catch (error) {
    contractCodeVerificationPromise = null;
    throw error;
  }
}

async function sendContractTransaction(functionName, args = []) {
  await checkNetwork();

  const address = ensureContractAddress();
  const readProvider = await getReadProvider();
  await verifyContractDeployment(readProvider, address);

  const accounts = await walletRequest("eth_accounts");
  const from = accounts[0]?.toLowerCase();

  if (!from) {
    throw new Error("Connect MetaMask before submitting a transaction.");
  }

  const contractInterface = new ethers.Interface(contractArtifact.abi);
  const data = contractInterface.encodeFunctionData(functionName, args);
  const transactionHash = await walletRequest("eth_sendTransaction", [
    {
      from,
      to: address,
      data,
      gas: CONTRACT_TRANSACTION_GAS_LIMIT,
      value: "0x0",
    },
  ]);
  const receipt = await readProvider.waitForTransaction(transactionHash);

  if (!receipt || receipt.status !== 1) {
    throw new Error("Transaction failed on-chain.");
  }

  return {
    transactionHash,
    receipt,
  };
}

function toFiniteNumber(value, fallback = 0) {
  try {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  } catch {
    return fallback;
  }
}

function isFiniteNumberLike(value) {
  try {
    return value != null && Number.isFinite(Number(value));
  } catch {
    return false;
  }
}

function readResultField(result, fieldName, fieldIndex) {
  return result?.[fieldName] ?? result?.[fieldIndex];
}

function toText(value) {
  return value == null ? "" : String(value);
}

function mapCandidate(candidate, index) {
  return {
    id: toFiniteNumber(readResultField(candidate, "id", 0), index + 1),
    name: toText(readResultField(candidate, "name", 1)),
    party: toText(readResultField(candidate, "party", 2)),
    voteCount: toFiniteNumber(readResultField(candidate, "voteCount", 3)),
  };
}

function mapCandidates(rawCandidates) {
  return rawCandidates.map(mapCandidate);
}

function isResultsColumnShape(rawCandidates) {
  if (
    rawCandidates.length !== 3 ||
    !Array.isArray(rawCandidates[0]) ||
    !Array.isArray(rawCandidates[1]) ||
    !Array.isArray(rawCandidates[2])
  ) {
    return false;
  }

  const [names, parties, voteCounts] = rawCandidates;

  return (
    names.every((name) => typeof name === "string") &&
    parties.every((party) => typeof party === "string") &&
    voteCounts.every(isFiniteNumberLike)
  );
}

function normalizeRawCandidates(rawCandidates) {
  if (!Array.isArray(rawCandidates)) {
    throw new Error("Unexpected candidate result shape.");
  }

  if (rawCandidates.length === 0) {
    return [];
  }

  if (isResultsColumnShape(rawCandidates)) {
    const [names, parties, voteCounts] = rawCandidates;

    return names.map((name, index) => ({
      id: index + 1,
      name: toText(name),
      party: toText(parties[index]),
      voteCount: toFiniteNumber(voteCounts[index]),
    }));
  }

  return mapCandidates(rawCandidates);
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
  const message = getNestedErrorMessage(error);

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

  if (
    message.includes("could not decode result data") ||
    message.includes("invalid arrayify value") ||
    message.includes("transaction returned no data")
  ) {
    return (
      "Blockchain call failed because the deployed contract does not match the expected ABI or address. " +
      "Check that the contract is deployed to the configured RPC network and that NEXT_PUBLIC_CONTRACT_ADDRESS is correct."
    );
  }

  if (message.includes("user rejected")) {
    return "The MetaMask transaction was rejected.";
  }

  if (
    message.includes("Already processing eth_requestAccounts") ||
    message.includes("Request of type 'wallet_requestPermissions' already pending") ||
    message.includes("Request of type 'wallet_switchEthereumChain' already pending") ||
    message.includes("request already pending")
  ) {
    return "MetaMask already has a pending request. Open MetaMask and approve or reject it, then try again.";
  }

  if (message.includes("could not coalesce error")) {
    return "MetaMask returned an unreadable RPC error. Open MetaMask, clear any pending request, confirm it is on Localhost 8545 (chain 31337), then try again.";
  }

  if (message.includes("MetaMask is not installed")) {
    return "MetaMask is not installed.";
  }

  return message || "Blockchain request failed. Please try again.";
}

export async function getWalletState() {
  const accounts = await walletRequest("eth_accounts");
  const chainId = await getBrowserChainId();

  return {
    address: accounts[0]?.toLowerCase() || "",
    chainId,
    networkLabel: getNetworkLabel(chainId),
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

export async function connectWallet({ forceAccountSelection = false } = {}) {
  try {
    const accounts = await requestWalletAccounts({
      forceAccountSelection,
    });
    const chainId = await switchToConfiguredNetwork();

    return {
      address: accounts[0]?.toLowerCase() || "",
      chainId,
      networkLabel: getNetworkLabel(chainId),
    };
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function checkNetwork() {
  const chainId = await switchToConfiguredNetwork();

  if (chainId !== CHAIN_ID) {
    throw new Error(`Please switch MetaMask to ${getNetworkLabel(CHAIN_ID)}.`);
  }
}

export async function getCandidates() {
  try {
    const contract = await getContract();
    const rawCandidates = await contract.getCandidates();
    return normalizeRawCandidates(rawCandidates);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("could not decode result data") || message.includes("invalid arrayify value")) {
      try {
        const contract = await getContract();
        const rawCandidates = await contract.getResults();
        return normalizeRawCandidates(rawCandidates);
      } catch (innerError) {
        throw new Error(formatContractError(innerError));
      }
    }

    throw new Error(formatContractError(error));
  }
}

export async function castVote(candidateId) {
  try {
    return await sendContractTransaction("castVote", [candidateId]);
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function cancelVote() {
  try {
    return await sendContractTransaction("cancelVote");
  } catch (error) {
    throw new Error(formatContractError(error));
  }
}

export async function getResults() {
  try {
    const candidates = await getCandidates();
    return candidates;
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

export async function getElectionSummary(knownCandidates = null) {
  try {
    const contract = await getContract();
    const [electionOpen, candidates] = await Promise.all([
      contract.electionOpen(),
      knownCandidates ? Promise.resolve(knownCandidates) : getCandidates(),
    ]);
    const totalVotes = candidates.reduce((sum, candidate) => sum + toFiniteNumber(candidate.voteCount), 0);

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
