// Based on https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/examples/SimpleToken.test.js
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { expect } = require('chai');
require('chai').should();

const { expectEvent, expectRevert, singletons, constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const BN = require('bn.js');

const GTCRToken = contract.fromArtifact('GTCRToken');
const ERC900 =  contract.fromArtifact('ERC900')

const STAKE_TARGET_ID = 284
const STAKE_TARGET_STR = parseInt('0x'+STAKE_TARGET_ID).toString()// new BN(STAKE_TARGET_ID, 16)
const STAKE_AMOUNT = 123
const getIntPairs = (ints) => {
  const pairs = []

  while (ints.length) {
    const pair = ints.splice(ints.length - 2)
    pairs.unshift(pair.length === 2 ? pair : [0,pair[0]])
  }

  return pairs
}

const getIntAsBytes = (int) => {
  const intPairs = getIntPairs(int.toString().split(""))

  const intBytes = new Array(32 - intPairs.length).fill("0x00")
    .concat(intPairs.map((pair) => "0x" + pair.join('')))
  return intBytes
}

const getIntAsByteString = (int) => {
  const intPairs = getIntPairs(int.toString().split(""))

  const intBytes = new Array(32 - intPairs.length).fill("00")
    .concat(intPairs.map((pair) => pair.join('')))
  return '0x' + intBytes.join('')
}

describe('ERC900', function () {
  const [registryFunder, creator, operator, receiver] = accounts;

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await GTCRToken.new(10000, [], { from: creator });
    this.erc900 = await ERC900.new(this.token.address, creator, {from: creator});
    await this.token.authorizeOperator(this.erc900.address, {from: creator})

    await this.token.send(this.erc900.address, 1000, [], {from: creator})
    const creatorBal = await this.erc900.balances(creator)
    console.log(`token balance for creator on erc900 ${creatorBal}`)

  });

  it('can enable staking', async function () {
    const enableStakeTx = await this.erc900.enableStaking(getIntAsBytes(STAKE_TARGET_ID), {from: creator});

    expectEvent(enableStakeTx, 'StakingEnabled', {
      id: STAKE_TARGET_STR
    })
    // const stakingEnabled = await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    // expect(stakingEnabled).to.be.true
  })

  it('can disable staking', async function () {
    await this.erc900.enableStaking(getIntAsBytes(STAKE_TARGET_ID), {from: creator});

    const disableStakeTx = await this.erc900.disableStaking(getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    expectEvent(disableStakeTx, 'StakingDisabled', {
      id: STAKE_TARGET_STR
    })
    const stakingEnabled = await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    console.log(`staking is enabled ${stakingEnabled}`)
    // expect(stakingEnabled).to.be.true
  })

  it('cannot stake if staking disabled', async function () {
    await expectRevert(
      this.erc900.stake(123, getIntAsBytes(STAKE_TARGET_ID), {from: creator}),
      'Staking is not enabled for target'
    )
  })

  it('can stake if staking enabled', async function () {
    await this.erc900.enableStaking(getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    const stakeTx = await this.erc900.stake(STAKE_AMOUNT, getIntAsBytes(STAKE_TARGET_ID), {from: creator});

    expectEvent(stakeTx, 'Staked', {
      "user": creator,
      "amount": STAKE_AMOUNT.toString(),
      "total": STAKE_AMOUNT.toString(),
      "data": getIntAsByteString(STAKE_TARGET_ID)
    })

    const totalStakedOn = await this.erc900.totalStakedOn(getIntAsBytes(STAKE_TARGET_ID))
    totalStakedOn.should.be.bignumber.equal(STAKE_AMOUNT.toString())

    // expect(stakingEnabled).to.be.true
  })


});