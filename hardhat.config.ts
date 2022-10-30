require('dotenv').config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
   networks: {
    hardhat: {
    },
    ...(process.env.GOERLI_ACC_ADDRESS && { goerli: {
      url: 'https://eth-goerli.g.alchemy.com/v2/VCXR6lySOjh1qpLGW5bw_aHODHJlcDzY',
      chainId: 5,
      from: process.env.GOERLI_ACC_ADDRESS,
      accounts: [process.env.GOERLI_ACC_PRIV_KEY] as string[]
    } }),
  },
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
};

export default config;
