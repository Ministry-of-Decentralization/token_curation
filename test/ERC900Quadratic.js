// Based on https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/examples/SimpleToken.test.js
const { accounts, contract } = require('@openzeppelin/test-environment');

const { expect } = require('chai');
require('chai').should();

const { expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
const utils = require('../utils/index')

const GTCRToken = contract.fromArtifact('GTCRToken');
const ERC900 =  contract.fromArtifact('ERC900Quadratic')

const STAKE_TARGET_ID = 284
const STAKE_AMOUNT = 100

describe('ERC900Quadratic', function () {
  const [registryFunder, creator, operator, staker] = accounts;

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await GTCRToken.new("1000000000000000000", [], { from: creator });
    this.erc900 = await ERC900.new(this.token.address, creator, {from: creator});
    await this.token.authorizeOperator(this.erc900.address, {from: creator})

    // send token from the creator address into the staking contract address
    await this.token.send(this.erc900.address, "1000000000000000000", [], {from: creator})


  });

  it('stake amount is equal to square root of weighted stake amount', async function () {
    await this.erc900.enableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    const stakeTx = await this.erc900.stake(STAKE_AMOUNT, utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});


    expectEvent(stakeTx, 'WeightedStaked', {
      "user": creator,
      "amount": STAKE_AMOUNT.toString(),
      "weightedAmount": "10",
      "total": STAKE_AMOUNT.toString(),
      "weightedTotal": "10",
      "data": utils.getIntAsByteString(STAKE_TARGET_ID)
    })

    const totalStakedOn = await this.erc900.totalStakedOn(utils.getIntAsBytes(STAKE_TARGET_ID))
    totalStakedOn["0"].should.be.bignumber.equal(STAKE_AMOUNT.toString())

  })


});