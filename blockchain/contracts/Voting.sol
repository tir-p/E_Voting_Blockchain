// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    address public owner;
    bool public electionOpen;

    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
    }

    Candidate[] private candidates;

    mapping(address => bool) public isRegistered;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public hasCancelled;
    mapping(address => uint256) public votedFor;

    event ElectionStatusUpdated(bool isOpen);
    event VoteCast(address indexed voter, uint256 indexed candidateId);
    event VoteCancelled(address indexed voter, uint256 indexed candidateId);
    event VoterRegistered(address indexed voter);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyWhenOpen() {
        require(electionOpen, "Election is closed");
        _;
    }

    constructor() {
        owner = msg.sender;
        candidates.push(Candidate(1, "PTR", "PTR", 0));
        candidates.push(Candidate(2, "MMM", "MMM", 0));
        candidates.push(Candidate(3, "MSM", "MSM", 0));
    }

    function registerVoter(address voter) external onlyOwner {
        require(voter != address(0), "Invalid voter address");
        require(!isRegistered[voter], "Voter already registered");

        isRegistered[voter] = true;
        emit VoterRegistered(voter);
    }

    function registerVoters(address[] calldata voters) external onlyOwner {
        for (uint256 index = 0; index < voters.length; index++) {
            address voter = voters[index];

            if (voter != address(0) && !isRegistered[voter]) {
                isRegistered[voter] = true;
                emit VoterRegistered(voter);
            }
        }
    }

    function openElection() external onlyOwner {
        electionOpen = true;
        emit ElectionStatusUpdated(true);
    }

    function closeElection() external onlyOwner {
        electionOpen = false;
        emit ElectionStatusUpdated(false);
    }

    function castVote(uint256 candidateId) external onlyWhenOpen {
        require(isRegistered[msg.sender], "Voter not registered");
        require(!hasVoted[msg.sender], "Vote already cast");
        require(!hasCancelled[msg.sender], "Vote was cancelled permanently");
        require(candidateId > 0 && candidateId <= candidates.length, "Invalid candidate");

        candidates[candidateId - 1].voteCount += 1;
        hasVoted[msg.sender] = true;
        votedFor[msg.sender] = candidateId;

        emit VoteCast(msg.sender, candidateId);
    }

    function cancelVote() external onlyWhenOpen {
        require(hasVoted[msg.sender], "No vote to cancel");
        require(!hasCancelled[msg.sender], "Vote already cancelled");

        uint256 candidateId = votedFor[msg.sender];
        require(candidateId > 0 && candidateId <= candidates.length, "Invalid candidate");
        require(candidates[candidateId - 1].voteCount > 0, "Candidate has no votes");

        candidates[candidateId - 1].voteCount -= 1;
        hasVoted[msg.sender] = false;
        hasCancelled[msg.sender] = true;

        emit VoteCancelled(msg.sender, candidateId);
    }

    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getResults()
        external
        view
        returns (string[] memory names, string[] memory parties, uint256[] memory voteCounts)
    {
        names = new string[](candidates.length);
        parties = new string[](candidates.length);
        voteCounts = new uint256[](candidates.length);

        for (uint256 index = 0; index < candidates.length; index++) {
            Candidate memory candidate = candidates[index];
            names[index] = candidate.name;
            parties[index] = candidate.party;
            voteCounts[index] = candidate.voteCount;
        }
    }

    function getVoterStatus(address voter)
        external
        view
        returns (
            bool registered,
            bool voted,
            bool cancelled,
            uint256 candidateId
        )
    {
        registered = isRegistered[voter];
        voted = hasVoted[voter];
        cancelled = hasCancelled[voter];
        candidateId = votedFor[voter];
    }
}
