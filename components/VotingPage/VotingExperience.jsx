"use client";

import { useEffect, useState } from "react";

import CancelModal from "@/components/VotingPage/CancelModal";
import CandidateList from "@/components/VotingPage/CandidateList";
import ConnectWallet from "@/components/VotingPage/ConnectWallet";
import NICVerifyCard from "@/components/VotingPage/NICVerifyCard";
import PostVoteCard from "@/components/VotingPage/PostVoteCard";
import VoteModal from "@/components/VotingPage/VoteModal";
import {
  cancelVote,
  castVote,
  connectWallet,
  formatContractError,
  getCandidates,
  getVoterStatus,
  getWalletState,
  subscribeToWalletEvents,
  trackVoteRecord,
} from "@/lib/blockchain";

function buildVerificationMessage(assignedWallet, connectedWallet) {
  return `NIC verified. Firestore returned ${assignedWallet}, which matches the connected wallet ${connectedWallet}.`;
}

export default function VotingExperience() {
  const [walletAddress, setWalletAddress] = useState("");
  const [networkLabel, setNetworkLabel] = useState("");
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [nicValue, setNicValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationState, setVerificationState] = useState({
    verified: false,
    type: "info",
    message: "",
    assignedWallet: "",
  });
  const [candidates, setCandidates] = useState([]);
  const [ballotLoading, setBallotLoading] = useState(false);
  const [status, setStatus] = useState({
    isRegistered: false,
    hasVoted: false,
    hasCancelled: false,
    votedFor: 0,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState("neutral");
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  useEffect(() => {
    let active = true;

    async function syncWallet() {
      try {
        const wallet = await getWalletState();

        if (!active) {
          return;
        }

        setWalletAddress(wallet.address);
        setNetworkLabel(wallet.networkLabel);
      } catch (error) {
        if (!active) {
          return;
        }

        setWalletError(
          error instanceof Error ? error.message : "Unable to read wallet state.",
        );
      }
    }

    syncWallet();

    const unsubscribe = subscribeToWalletEvents({
      onAccountsChanged: (nextWalletAddress) => {
        setWalletAddress(nextWalletAddress);
        setVerificationState({
          verified: false,
          type: "info",
          message:
            "Wallet changed. Re-run NIC verification to confirm the new address.",
          assignedWallet: "",
        });
        setStatus({
          isRegistered: false,
          hasVoted: false,
          hasCancelled: false,
          votedFor: 0,
        });
        setSelectedCandidateId(null);
        setActionError("");
      },
      onChainChanged: async () => {
        try {
          const wallet = await getWalletState();
          setNetworkLabel(wallet.networkLabel);
        } catch (error) {
          setWalletError(
            error instanceof Error ? error.message : "Unable to refresh network.",
          );
        }
      },
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!verificationState.verified || !walletAddress) {
      return;
    }

    let active = true;

    async function syncOnChainData() {
      setBallotLoading(true);

      try {
        const [nextCandidates, nextStatus] = await Promise.all([
          getCandidates(),
          getVoterStatus(walletAddress),
        ]);

        if (!active) {
          return;
        }

        setCandidates(nextCandidates);
        setStatus(nextStatus);
        setSelectedCandidateId(nextStatus.votedFor || null);

        if (!nextStatus.isRegistered) {
          setStatusTone("warning");
          setStatusMessage(
            "The NIC matches this wallet, but the address has not been registered on-chain by the election authority yet.",
          );
          return;
        }

        if (nextStatus.hasCancelled) {
          setStatusTone("error");
          setStatusMessage(
            "This wallet previously cancelled its vote. The contract now treats it as permanently ineligible to vote again.",
          );
          return;
        }

        if (nextStatus.hasVoted) {
          setStatusTone("success");
          setStatusMessage(
            "A vote is already recorded on-chain for this wallet. You may review it below or use the one-time cancellation option.",
          );
          return;
        }

        setStatusTone("success");
        setStatusMessage(
          "Verification complete. Select a candidate and confirm the MetaMask transaction.",
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setStatusTone("error");
        setActionError(formatContractError(error));
      } finally {
        if (active) {
          setBallotLoading(false);
        }
      }
    }

    syncOnChainData();

    return () => {
      active = false;
    };
  }, [verificationState.verified, walletAddress, transactionHash]);

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) || null;

  const ballotDisabled =
    !verificationState.verified ||
    !status.isRegistered ||
    status.hasVoted ||
    status.hasCancelled;

  async function handleConnectWallet() {
    setWalletLoading(true);
    setWalletError("");

    try {
      const wallet = await connectWallet();
      setWalletAddress(wallet.address);
      setNetworkLabel(wallet.networkLabel);
      setVerificationState({
        verified: false,
        type: "info",
        message: "Wallet connected. Enter the NIC linked to this address.",
        assignedWallet: "",
      });
      setStatusTone("neutral");
      setStatusMessage("Connect complete. Verify the NIC bound to this wallet to unlock the ballot.");
    } catch (error) {
      setWalletError(formatContractError(error));
    } finally {
      setWalletLoading(false);
    }
  }

  async function handleVerifyNic() {
    if (!walletAddress) {
      setVerificationState({
        verified: false,
        type: "error",
        message: "Connect the registered MetaMask wallet before verifying a NIC.",
        assignedWallet: "",
      });
      return;
    }

    setVerifying(true);
    setActionError("");
    setStatusTone("neutral");

    try {
      const response = await fetch("/api/verify-nic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nic: nicValue }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "NIC verification failed.");
      }

      const assignedWallet = payload.walletAddress;
      const matches = assignedWallet.toLowerCase() === walletAddress.toLowerCase();

      if (!matches) {
        setVerificationState({
          verified: false,
          type: "error",
          message:
            "This NIC is not linked to the currently connected wallet. Switch MetaMask to the assigned wallet and verify again.",
          assignedWallet,
        });
        return;
      }

      setVerificationState({
        verified: true,
        type: "success",
        message: buildVerificationMessage(assignedWallet, walletAddress),
        assignedWallet,
      });
      setStatusMessage("NIC verified. Reading the wallet status and candidate list from the contract.");
    } catch (error) {
      setVerificationState({
        verified: false,
        type: "error",
        message:
          error instanceof Error ? error.message : "NIC verification failed.",
        assignedWallet: "",
      });
      setStatusTone("error");
    } finally {
      setVerifying(false);
    }
  }

  async function handleConfirmVote() {
    if (!selectedCandidateId) {
      setActionError("Select a candidate before attempting to vote.");
      return;
    }

    setVoteLoading(true);
    setActionError("");

    try {
      const result = await castVote(selectedCandidateId);
      setTransactionHash(result.transactionHash);
      setVoteModalOpen(false);
      await trackVoteRecord({
        action: "vote",
        candidateId: selectedCandidateId,
        transactionHash: result.transactionHash,
        walletAddress,
      });
      setStatusTone("success");
      setStatusMessage(
        "Vote confirmed on-chain. The selected candidate and transaction hash are shown below.",
      );
    } catch (error) {
      setActionError(formatContractError(error));
    } finally {
      setVoteLoading(false);
    }
  }

  async function handleConfirmCancel() {
    setCancelLoading(true);
    setActionError("");

    try {
      const result = await cancelVote();
      setTransactionHash(result.transactionHash);
      setCancelModalOpen(false);
      await trackVoteRecord({
        action: "cancel",
        candidateId: status.votedFor || selectedCandidateId,
        transactionHash: result.transactionHash,
        walletAddress,
      });
      setStatusTone("error");
      setStatusMessage(
        "Cancellation confirmed on-chain. This wallet can no longer vote again in this election.",
      );
    } catch (error) {
      setActionError(formatContractError(error));
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <>
      <section className="voter-grid">
        <div className="voter-main">
          <ConnectWallet
            loading={walletLoading}
            networkLabel={networkLabel}
            onConnect={handleConnectWallet}
            walletAddress={walletAddress}
            walletError={walletError}
          />
          <NICVerifyCard
            nicValue={nicValue}
            onNicChange={setNicValue}
            onVerify={handleVerifyNic}
            verifying={verifying}
            verificationState={verificationState}
            walletAddress={walletAddress}
          />
          {verificationState.verified ? (
            <CandidateList
              candidates={candidates}
              disabled={ballotDisabled}
              loading={ballotLoading}
              note={statusMessage}
              noteTone={statusTone}
              onOpenVoteModal={() => setVoteModalOpen(true)}
              onSelect={setSelectedCandidateId}
              selectedCandidateId={selectedCandidateId}
            />
          ) : null}
          {verificationState.verified ? (
            <PostVoteCard
              canCancel={status.hasVoted && !status.hasCancelled}
              cancelled={status.hasCancelled}
              loading={cancelLoading}
              onCancel={() => setCancelModalOpen(true)}
              selectedCandidate={selectedCandidate}
              transactionHash={transactionHash}
            />
          ) : null}
        </div>

        <aside className="voter-sidebar">
          <section className="glass-card status-card sticky-card">
            <div className="split-header">
              <div>
                <span className="eyebrow">Flow Status</span>
                <h3>Current checkpoint</h3>
              </div>
            </div>
            <div className="checkpoint-list">
              <div className={`checkpoint ${walletAddress ? "is-complete" : ""}`}>
                <strong>1. Wallet</strong>
                <span>{walletAddress ? "Connected" : "Waiting for MetaMask connection"}</span>
              </div>
              <div className={`checkpoint ${verificationState.verified ? "is-complete" : ""}`}>
                <strong>2. NIC</strong>
                <span>
                  {verificationState.verified
                    ? "Verified against the assigned wallet"
                    : "Pending NIC verification"}
                </span>
              </div>
              <div
                className={`checkpoint ${
                  status.hasCancelled ? "is-closed" : status.hasVoted ? "is-complete" : ""
                }`}
              >
                <strong>3. Ballot</strong>
                <span>
                  {status.hasCancelled
                    ? "Vote cancelled permanently"
                    : status.hasVoted
                      ? "Vote recorded on-chain"
                      : "No recorded ballot yet"}
                </span>
              </div>
            </div>
          </section>

          <section className="glass-card status-card">
            <div className="split-header">
              <div>
                <span className="eyebrow">On-chain Status</span>
                <h3>Wallet state</h3>
              </div>
              <span
                className={`status-badge ${
                  status.hasCancelled
                    ? "is-closed"
                    : status.hasVoted
                      ? "is-live"
                      : "is-neutral"
                }`}
              >
                {status.hasCancelled
                  ? "Cancelled"
                  : status.hasVoted
                    ? "Vote recorded"
                    : "No ballot yet"}
              </span>
            </div>
            <div className="summary-grid">
              <div className="summary-row">
                <strong>Registered on-chain</strong>
                <span>{status.isRegistered ? "Yes" : "No"}</span>
              </div>
              <div className="summary-row">
                <strong>Has voted</strong>
                <span>{status.hasVoted ? "Yes" : "No"}</span>
              </div>
              <div className="summary-row">
                <strong>Has cancelled</strong>
                <span>{status.hasCancelled ? "Yes" : "No"}</span>
              </div>
              <div className="summary-row">
                <strong>Selected candidate ID</strong>
                <span>{status.votedFor || "None"}</span>
              </div>
            </div>
          </section>

          <section className="glass-card status-card">
            <div className="split-header">
              <div>
                <span className="eyebrow">Rules Snapshot</span>
                <h3>What the contract checks</h3>
              </div>
            </div>
            <ul className="feature-list">
              <li>The election must be open.</li>
              <li>The wallet must be registered by the owner.</li>
              <li>The wallet cannot vote twice.</li>
              <li>The wallet cannot vote again after cancellation.</li>
            </ul>
          </section>

          {actionError ? <div className="message-box is-error">{actionError}</div> : null}
          {statusMessage && !verificationState.verified ? (
            <div className={`message-box ${statusTone ? `is-${statusTone}` : ""}`}>
              {statusMessage}
            </div>
          ) : null}
        </aside>
      </section>

      <VoteModal
        candidate={selectedCandidate}
        loading={voteLoading}
        onClose={() => setVoteModalOpen(false)}
        onConfirm={handleConfirmVote}
        open={voteModalOpen}
      />
      <CancelModal
        loading={cancelLoading}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        open={cancelModalOpen}
      />
    </>
  );
}
