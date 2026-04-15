// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {

    // ─── State Variables ───────────────────────────────────────────

    address public owner;
    bool public electionOpen;
    uint256 public votingDuration;  // Added for test compatibility

    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
    }

    Candidate[] public candidates;

    // Per-wallet state
    mapping(address => bool) public isRegistered;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public hasCancelled;
    mapping(address => uint256) public votedFor;
    mapping(address => uint256) public voteTimestamp;  // Added for cancellation window

    // ─── Events ────────────────────────────────────────────────────

    event VoterRegistered(address indexed voter);
    event ElectionOpened();
    event ElectionClosed();
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VoteCancelled(address indexed voter, uint256 indexed candidateId);

    // ─── Modifiers ─────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorised");
        _;
    }

    modifier electionIsOpen() {
        require(electionOpen, "Election is not open");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        electionOpen = false;
        votingDuration = 600;  // 10 minutes cancellation window

        // Hardcode candidates here (using uint256 to match test expectations)
        candidates.push(Candidate(0, "Anand Boolell",   "PTR", 0));
        candidates.push(Candidate(1, "Kavita Foolchand", "MMM", 0));
        candidates.push(Candidate(2, "Jean-Marc Riviere","MSM", 0));
    }

    // ─── Admin Functions ───────────────────────────────────────────

    function registerVoter(address voter) external onlyOwner {
        require(!isRegistered[voter], "Already registered");
        isRegistered[voter] = true;
        emit VoterRegistered(voter);
    }

    function openElection() external onlyOwner {
        require(!electionOpen, "Election already open");
        electionOpen = true;
        emit ElectionOpened();
    }

    function closeElection() external onlyOwner {
        require(electionOpen, "Election already closed");
        electionOpen = false;
        emit ElectionClosed();
    }

    // ─── Voter Functions ───────────────────────────────────────────

    function castVote(uint256 candidateId) external electionIsOpen {
        require(isRegistered[msg.sender],  "Wallet not registered");
        require(!hasVoted[msg.sender],     "Already voted");
        require(!hasCancelled[msg.sender], "Cancelled wallets cannot vote again");
        require(candidateId < candidates.length, "Invalid candidate");

        candidates[candidateId].voteCount += 1;
        hasVoted[msg.sender] = true;
        votedFor[msg.sender] = candidateId;
        voteTimestamp[msg.sender] = block.timestamp;  // Store vote time for cancellation window

        emit VoteCast(msg.sender, candidateId);
    }

    function cancelVote() external electionIsOpen {
        require(hasVoted[msg.sender],      "No vote to cancel");
        require(!hasCancelled[msg.sender], "Already cancelled");
        require(block.timestamp <= voteTimestamp[msg.sender] + votingDuration, "Window expired");

        uint256 previousCandidate = votedFor[msg.sender];
        candidates[previousCandidate].voteCount -= 1;

        hasVoted[msg.sender] = false;
        hasCancelled[msg.sender] = true;

        emit VoteCancelled(msg.sender, previousCandidate);
    }

    // ─── View Functions ────────────────────────────────────────────

    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getResults() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getVoterStatus(address voter) external view returns (
        bool registered,
        bool voted,
        bool cancelled,
        uint256 candidateId
    ) {
        return (
            isRegistered[voter],
            hasVoted[voter],
            hasCancelled[voter],
            votedFor[voter]
        );
    }

    function getTotalVotes() external view returns (uint256 total) {
        for (uint256 i = 0; i < candidates.length; i++) {
            total += candidates[i].voteCount;
        }
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
    
    // Additional helper function for cancellation window (optional)
    function getRemainingCancelTime(address voter) external view returns (uint256) {
        if (!hasVoted[voter] || hasCancelled[voter]) {
            return 0;
        }
        
        uint256 expiryTime = voteTimestamp[voter] + votingDuration;
        if (block.timestamp >= expiryTime) {
            return 0;
        }
        
        return expiryTime - block.timestamp;
    }
}