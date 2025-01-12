require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");

const projectId = process.env.INFURA_PROJECT_ID;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337, //config standard
    },
    amoy: {
      url: `https://polygon-amoy.infura.io/v3/${projectId}`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
    },
  },
  etherscan : {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
