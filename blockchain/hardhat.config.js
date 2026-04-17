import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchersPlugin from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMochaPlugin from "@nomicfoundation/hardhat-mocha";
import { defineConfig } from "hardhat/config";

const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/O_fVS_sndGg1Ro5J0XO1Z";
const SEPOLIA_PRIVATE_KEY = "f615f7ec63641175ad373533b993ad6138e5f06689f6a5d54210b11a478438c3";

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
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: SEPOLIA_PRIVATE_KEY ? [SEPOLIA_PRIVATE_KEY] : [],
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
  },
});
