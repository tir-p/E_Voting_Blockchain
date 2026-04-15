"use client";

import { useEffect, useState } from "react";

import CancelModal from "@/components/VotingPage/CancelModal";
import CandidateList from "@/components/VotingPage/CandidateList";
import ConnectWallet from "@/components/VotingPage/ConnectWallet";
import PostVoteCard from "@/components/VotingPage/PostVoteCard";
import VoteModal from "@/components/VotingPage/VoteModal";
import {
  cancelVote,
  castVote,
  connectWallet,
  formatContractError,
  getCandidates,
  getElectionSummary,
  getTransactionUrl,
  getVoterStatus,
  getWalletState,
  subscribeToWalletEvents,
  trackVoteRecord,
} from "@/lib/blockchain";

export default function VotingExperience() {
  const [walletAddress, setWalletAddress] = useState("");
  const [networkLabel, setNetworkLabel] = useState("");
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
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
  const [electionOpen, setElectionOpen] = useState(false);

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
    if (!walletAddress) {
      return;
    }

    let active = true;

    async function syncOnChainData() {
      setBallotLoading(true);

      try {
        const [nextCandidates, nextStatus, nextElectionSummary] = await Promise.all([
          getCandidates(),
          getVoterStatus(walletAddress),
          getElectionSummary(),
        ]);

        if (!active) {
          return;
        }

        setCandidates(nextCandidates);
        setStatus(nextStatus);
        setElectionOpen(nextElectionSummary.electionOpen);
        setSelectedCandidateId(nextStatus.votedFor || null);

        if (!nextStatus.isRegistered) {
          setStatusTone("warning");
          setStatusMessage(
            "This wallet is not registered on-chain by the election authority.",
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

        if (!nextElectionSummary.electionOpen) {
          setStatusTone("warning");
          setStatusMessage(
            "The election contract is currently closed. You can review the ballot, but voting and cancellation are locked until the owner opens it.",
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
  }, [walletAddress, transactionHash]);

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) || null;

  const ballotDisabled =
    !walletAddress ||
    !electionOpen ||
    !status.isRegistered ||
    status.hasVoted ||
    status.hasCancelled;
  const transactionUrl = getTransactionUrl(transactionHash);

  async function handleConnectWallet() {
    setWalletLoading(true);
    setWalletError("");

    try {
      const wallet = await connectWallet();
      setWalletAddress(wallet.address);
      setNetworkLabel(wallet.networkLabel);
      setStatusTone("neutral");
      setStatusMessage("Wallet connected. Reading the wallet status and candidate list from the contract.");
    } catch (error) {
      setWalletError(formatContractError(error));
    } finally {
      setWalletLoading(false);
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
          {walletAddress ? (
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
          {walletAddress ? (
            <PostVoteCard
              canCancel={status.hasVoted && !status.hasCancelled}
              cancelled={status.hasCancelled}
              loading={cancelLoading}
              onCancel={() => setCancelModalOpen(true)}
              selectedCandidate={selectedCandidate}
              transactionHash={transactionHash}
              transactionUrl={transactionUrl}
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
              <div className={`checkpoint ${walletAddress ? "is-complete" : ""}`}>
                <strong>2. Wallet status</strong>
                <span>
                  {walletAddress
                    ? "Connected and checked on-chain"
                    : "Waiting for MetaMask connection"}
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
                <strong>Election open</strong>
                <span>{electionOpen ? "Yes" : "No"}</span>
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
          {statusMessage ? (
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
