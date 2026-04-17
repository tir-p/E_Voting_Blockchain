#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ethers } from "ethers";

const ARTIFACT_PATH = path.join(process.cwd(), "contracts", "Voting.json");
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/O_fVS_sndGg1Ro5J0XO1Z";

async function diagnose() {
  console.log("=== E-Voting Blockchain Deployment Diagnostics ===\n");

  // Check 1: Contract Artifact File
  console.log("1. Checking contract artifact file...");
  try {
    const raw = await readFile(ARTIFACT_PATH, "utf8");
    const artifact = JSON.parse(raw);
    
    if (artifact.address) {
      console.log(`   ✓ Artifact file exists at: ${ARTIFACT_PATH}`);
      console.log(`   ✓ Contract address: ${artifact.address}`);
      console.log(`   ✓ Contract name: ${artifact.contractName}`);
      console.log(`   ✓ ABI entries: ${artifact.abi?.length || 0}`);
    } else {
      console.log(`   ✗ ERROR: Artifact file exists but contains no address`);
      console.log(`   Content: ${JSON.stringify(artifact, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ✗ ERROR: Failed to read artifact file: ${error.message}`);
    return;
  }

  // Check 2: RPC Connection
  console.log("\n2. Checking RPC connection...");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    const chainId = await provider.getNetwork();
    
    console.log(`   ✓ Connected to RPC at: ${RPC_URL}`);
    console.log(`   ✓ Current block number: ${blockNumber}`);
    console.log(`   ✓ Chain ID: ${chainId.chainId}`);
  } catch (error) {
    console.log(`   ✗ ERROR: Failed to connect to RPC: ${error.message}`);
    console.log(`   Make sure the RPC endpoint is available at ${RPC_URL}`);
    return;
  }

  // Check 3: Contract Deployment
  console.log("\n3. Checking contract deployment...");
  try {
    const raw = await readFile(ARTIFACT_PATH, "utf8");
    const artifact = JSON.parse(raw);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    const address = artifact.address;
    const code = await provider.getCode(address);
    const balance = await provider.getBalance(address);
    
    if (code && code !== "0x") {
      console.log(`   ✓ Contract is deployed at: ${address}`);
      console.log(`   ✓ Code size: ${(code.length - 2) / 2} bytes`);
      console.log(`   ✓ Contract balance: ${balance.toString()} wei`);
    } else {
      console.log(`   ✗ ERROR: No contract code found at: ${address}`);
      console.log(`   This means the deployment was not successful or did not persist.`);
      console.log(`   Possible causes:`);
      console.log(`     - The deployment script failed silently`);
      console.log(`     - The contract wasn't persisted to the blockchain`);
      console.log(`     - The hardhat node restarted after deployment`);
    }
  } catch (error) {
    console.log(`   ✗ ERROR: ${error.message}`);
  }

  // Check 4: Account Information
  console.log("\n4. Checking accounts...");
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const accounts = await provider.send("eth_accounts", []);
    
    console.log(`   ✓ Available accounts: ${accounts.length}`);
    for (let i = 0; i < Math.min(3, accounts.length); i++) {
      const balance = await provider.getBalance(accounts[i]);
      console.log(`     [${i}] ${accounts[i]} (${ethers.formatEther(balance)} ETH)`);
    }
  } catch (error) {
    console.log(`   ✗ ERROR: ${error.message}`);
  }

  console.log("\n=== End Diagnostics ===\n");
  console.log("If the contract is not deployed:");
  console.log("1. Confirm the hardcoded RPC URL is correct for Sepolia.");
  console.log("2. Verify your deployment script ran without errors.");
  console.log("3. Re-run the deployment with a valid Sepolia RPC endpoint.");
}

diagnose().catch((error) => {
  console.error("Diagnostic failed:", error);
  process.exitCode = 1;
});
