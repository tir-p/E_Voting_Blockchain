"use client";

import { useEffect, useState } from "react";

import LoadingSpinner from "@/components/shared/LoadingSpinner";
import {
  getAddressUrl,
  getElectionSummary,
  getResults,
  shortAddress,
} from "@/lib/blockchain";

const CANDIDATE_COLORS = ["#d95d39", "#2a7f62", "#c89b2f", "#5b79c8"];

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getPieSegments(candidates) {
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  if (totalVotes === 0) {
    return [];
  }

  let startAngle = -90;

  return candidates.map((candidate, index) => {
    const angle = (candidate.voteCount / totalVotes) * 360;
    const endAngle = startAngle + angle;
    const largeArcFlag = angle > 180 ? 1 : 0;
    const radius = 74;
    const center = 90;
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const path = [
      `M ${center} ${center}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");

    startAngle = endAngle;

    return {
      id: candidate.id,
      path,
      color: CANDIDATE_COLORS[index % CANDIDATE_COLORS.length],
    };
  });
}

export default function ResultsChart() {
  const [refreshTick, setRefreshTick] = useState(0);
  const [state, setState] = useState({
    loading: true,
    candidates: [],
    totalVotes: 0,
    electionOpen: false,
    contractAddress: "",
    error: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [summary, candidates] = await Promise.all([
          getElectionSummary(),
          getResults(),
        ]);

        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          candidates,
          totalVotes: summary.totalVotes,
          electionOpen: summary.electionOpen,
          contractAddress: summary.contractAddress,
          error: "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          loading: false,
          candidates: [],
          totalVotes: 0,
          electionOpen: false,
          contractAddress: "",
          error:
            error instanceof Error
              ? error.message
              : "Unable to read contract results.",
        });
      }
    }

    load();
    const intervalId = window.setInterval(load, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [refreshTick]);

  const highestVote = state.candidates.reduce(
    (max, candidate) => Math.max(max, candidate.voteCount),
    0,
  );
  const pieSegments = getPieSegments(state.candidates);
  const contractUrl = getAddressUrl(state.contractAddress);

  return (
    <section className="glass-card results-shell">
      <div className="results-header">
        <div>
          <span className="eyebrow">Public Ledger View</span>
          <h2>Live blockchain tally</h2>
        </div>
        <span
          className={`status-badge ${state.electionOpen ? "is-live" : "is-closed"}`}
        >
          {state.electionOpen ? "Election Open" : "Election Closed"}
        </span>
      </div>
      <p>
        The chart below reads from the deployed contract. If public RPC access
        or the contract address is missing, the page explains what is not
        configured instead of falling back to private data.
      </p>

      {state.loading ? (
        <div className="chart-shell">
          <div className="skeleton" />
        </div>
      ) : state.error ? (
        <div className="message-box is-error">{state.error}</div>
      ) : (
        <>
          <div className="mini-stats">
            <div className="mini-stat">
              <strong>{state.totalVotes}</strong>
              <span>Total votes recorded</span>
            </div>
            <div className="mini-stat">
              <strong>{state.candidates.length}</strong>
              <span>Candidates</span>
            </div>
            <div className="mini-stat">
              {contractUrl ? (
                <a href={contractUrl} rel="noreferrer" target="_blank">
                  <strong>{shortAddress(state.contractAddress) || "Not set"}</strong>
                </a>
              ) : (
                <strong>{shortAddress(state.contractAddress) || "Not set"}</strong>
              )}
              <span>Contract address</span>
            </div>
          </div>

          <div className="chart-grid">
            <div className="chart-shell">
              <div className="bar-chart" aria-label="Vote totals bar chart">
                {state.candidates.map((candidate, index) => {
                  const fillHeight = highestVote
                    ? Math.max((candidate.voteCount / highestVote) * 100, candidate.voteCount ? 12 : 6)
                    : 6;

                  return (
                    <div className="bar-column" key={candidate.id}>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            height: `${fillHeight}%`,
                            backgroundColor:
                              CANDIDATE_COLORS[index % CANDIDATE_COLORS.length],
                          }}
                        />
                      </div>
                      <strong>{candidate.party || candidate.name}</strong>
                      <span>{candidate.voteCount} votes</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pie-shell">
              <div className="chart-shell">
                {pieSegments.length ? (
                  <svg
                    className="pie-chart"
                    viewBox="0 0 180 180"
                    role="img"
                    aria-label="Vote share pie chart"
                  >
                    {pieSegments.map((segment) => (
                      <path
                        key={segment.id}
                        d={segment.path}
                        fill={segment.color}
                        stroke="#f8f3ea"
                        strokeWidth="2"
                      />
                    ))}
                    <circle cx="90" cy="90" r="34" fill="#f8f3ea" />
                    <text
                      x="90"
                      y="86"
                      textAnchor="middle"
                      style={{ fontSize: "14px", fill: "#496171", fontWeight: 700 }}
                    >
                      Total
                    </text>
                    <text
                      x="90"
                      y="106"
                      textAnchor="middle"
                      style={{ fontSize: "22px", fill: "#10212d", fontWeight: 700 }}
                    >
                      {state.totalVotes}
                    </text>
                  </svg>
                ) : (
                  <div className="message-box">
                    No ballots have been recorded yet. The chart will populate as
                    soon as votes reach the contract.
                  </div>
                )}
              </div>

              <div className="legend">
                {state.candidates.map((candidate, index) => {
                  const share = state.totalVotes
                    ? Math.round((candidate.voteCount / state.totalVotes) * 100)
                    : 0;

                  return (
                    <div className="legend-item" key={candidate.id}>
                      <span className="legend-meta">
                        <span
                          className="legend-swatch"
                          style={{
                            backgroundColor:
                              CANDIDATE_COLORS[index % CANDIDATE_COLORS.length],
                          }}
                        />
                        <span>{candidate.party || candidate.name}</span>
                      </span>
                      <span>
                        {candidate.voteCount} votes ({share}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="results-actions">
        <button
          className="secondary-button"
          disabled={state.loading}
          onClick={() => {
            setState((current) => ({
              ...current,
              loading: true,
            }));
            setRefreshTick((current) => current + 1);
          }}
          type="button"
        >
          {state.loading ? (
            <span className="button-with-spinner">
              <LoadingSpinner />
              Refreshing results
            </span>
          ) : (
            "Refresh Now"
          )}
        </button>
      </div>
    </section>
  );
}
