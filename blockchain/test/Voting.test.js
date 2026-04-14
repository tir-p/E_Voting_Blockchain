import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Voting", function () {
  async function deployFixture() {
    const [owner, voterOne, voterTwo, outsider] = await ethers.getSigners();
    const voting = await ethers.deployContract("Voting");
    await voting.waitForDeployment();

    return {
      voting,
      owner,
      voterOne,
      voterTwo,
      outsider,
    };
  }

  it("allows a registered wallet with a matching candidate choice to vote", async function () {
    const { voting, voterOne } = await deployFixture();

    await voting.registerVoter(voterOne.address);
    await voting.openElection();
    await voting.connect(voterOne).castVote(1);

    const status = await voting.getVoterStatus(voterOne.address);
    const candidates = await voting.getCandidates();

    expect(status.voted).to.equal(true);
    expect(status.candidateId).to.equal(1n);
    expect(candidates[0].voteCount).to.equal(1n);
  });

  it("rejects voting for NIC-mapped wallets that are not registered on-chain", async function () {
    const { voting, outsider } = await deployFixture();

    await voting.openElection();

    await expect(voting.connect(outsider).castVote(1)).to.be.revertedWith(
      "Voter not registered",
    );
  });

  it("prevents double voting", async function () {
    const { voting, voterOne } = await deployFixture();

    await voting.registerVoter(voterOne.address);
    await voting.openElection();
    await voting.connect(voterOne).castVote(2);

    await expect(voting.connect(voterOne).castVote(2)).to.be.revertedWith(
      "Vote already cast",
    );
  });

  it("rejects cancellation before any vote exists", async function () {
    const { voting, voterOne } = await deployFixture();

    await voting.registerVoter(voterOne.address);
    await voting.openElection();

    await expect(voting.connect(voterOne).cancelVote()).to.be.revertedWith(
      "No vote to cancel",
    );
  });

  it("decrements the count and permanently blocks future voting after cancellation", async function () {
    const { voting, voterOne } = await deployFixture();

    await voting.registerVoter(voterOne.address);
    await voting.openElection();
    await voting.connect(voterOne).castVote(3);
    await voting.connect(voterOne).cancelVote();

    const status = await voting.getVoterStatus(voterOne.address);
    const candidates = await voting.getCandidates();

    expect(status.voted).to.equal(false);
    expect(status.cancelled).to.equal(true);
    expect(status.candidateId).to.equal(3n);
    expect(candidates[2].voteCount).to.equal(0n);

    await expect(voting.connect(voterOne).castVote(1)).to.be.revertedWith(
      "Vote was cancelled permanently",
    );
  });

  it("prevents cancelling twice", async function () {
    const { voting, voterOne } = await deployFixture();

    await voting.registerVoter(voterOne.address);
    await voting.openElection();
    await voting.connect(voterOne).castVote(1);
    await voting.connect(voterOne).cancelVote();

    await expect(voting.connect(voterOne).cancelVote()).to.be.revertedWith(
      "No vote to cancel",
    );
  });

  it("blocks voting when the election is closed", async function () {
    const { voting, voterTwo } = await deployFixture();

    await voting.registerVoter(voterTwo.address);

    await expect(voting.connect(voterTwo).castVote(1)).to.be.revertedWith(
      "Election is closed",
    );
  });

  it("returns result arrays for public tally screens", async function () {
    const { voting, voterOne, voterTwo } = await deployFixture();

    await voting.registerVoters([voterOne.address, voterTwo.address]);
    await voting.openElection();
    await voting.connect(voterOne).castVote(1);
    await voting.connect(voterTwo).castVote(2);

    const [names, parties, voteCounts] = await voting.getResults();

    expect(names).to.deep.equal(["PTR", "MMM", "MSM"]);
    expect(parties).to.deep.equal(["PTR", "MMM", "MSM"]);
    expect(voteCounts).to.deep.equal([1n, 1n, 0n]);
  });
});
