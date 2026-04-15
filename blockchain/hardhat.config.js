import "dotenv/config";

import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchersPlugin from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMochaPlugin from "@nomicfoundation/hardhat-mocha";
import { defineConfig } from "hardhat/config";

const DEFAULT_LOCAL_RPC_URL = "http://127.0.0.1:8545";
const DEFAULT_LOCAL_OWNER_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export default defineConfig({
  plugins: [
    hardhatEthersPlugin,
    hardhatMochaPlugin,
    hardhatEthersChaiMatchersPlugin,
  ],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 31337,
      accounts: [
        {
          privateKey:
            "0x0000000000000000000000000000000000000000000000000000000000000001",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x0000000000000000000000000000000000000000000000000000000000000002",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x0000000000000000000000000000000000000000000000000000000000000003",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x0000000000000000000000000000000000000000000000000000000000000004",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x0000000000000000000000000000000000000000000000000000000000000005",
          balance: "10000000000000000000000",
        },
        {
          privateKey:
            "0x0000000000000000000000000000000000000000000000000000000000000006",
          balance: "10000000000000000000000",
        },
      ],
    },
    "hardhat-node": {
      type: "http",
      url: "http://hardhat-node:8545",
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
  },
});
