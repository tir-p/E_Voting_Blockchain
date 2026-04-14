import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchersPlugin from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatMochaPlugin from "@nomicfoundation/hardhat-mocha";
import { defineConfig } from "hardhat/config";

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
});
