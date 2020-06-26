const GTCRToken = artifacts.require("GTCRToken");
const ERC900 = artifacts.require("ERC900")

require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' });

const { singletons } = require('@openzeppelin/test-helpers');

module.exports = async function(deployer, network, accounts) {
  if (network === 'development') {
    // In a test environment an ERC777 token requires deploying an ERC1820 registry
    await singletons.ERC1820Registry(accounts[0]);
  }

  await deployer.deploy(GTCRToken, 10000, []);
  const token = await GTCRToken.deployed()

  
  await deployer.deploy(ERC900, token.address, accounts[0])

};
