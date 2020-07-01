// Based on https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/examples/SimpleToken.test.js
const { accounts, contract } = require('@openzeppelin/test-environment');

const { expect } = require('chai');
require('chai').should();

const { expectEvent, expectRevert, singletons } = require('@openzeppelin/test-helpers');
const utils = require('../utils/index')

const GTCRToken = contract.fromArtifact('GTCRToken');
const ERC900 =  contract.fromArtifact('ERC900')

const STAKE_TARGET_ID = 284
const STAKE_TARGET_STR = parseInt('0x'+STAKE_TARGET_ID).toString()
const STAKE_AMOUNT = 124

describe('ERC900', function () {
  const [registryFunder, creator, operator, staker] = accounts;

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await GTCRToken.new(10000, [], { from: creator });
    this.erc900 = await ERC900.new(this.token.address, creator, {from: creator});
    await this.token.authorizeOperator(this.erc900.address, {from: creator})

    // send token from the creator address into the staking contract address
    await this.token.send(this.erc900.address, 1000, [], {from: creator})

    // send token from the creator address to thes taker address
    // and then  into the staking contract address
    await this.token.send(staker, 1000, [], {from: creator})
    await this.token.send(this.erc900.address, 1000, [], {from: staker})

  });

  it('can enable staking', async function () {
    const enableStakeTx = await this.erc900.enableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});

    expectEvent(enableStakeTx, 'StakingEnabled', {
      id: STAKE_TARGET_STR
    })
    // const stakingEnabled = await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    // expect(stakingEnabled).to.be.true
  })

  it('can disable staking', async function () {
    await this.erc900.enableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});

    const disableStakeTx = await this.erc900.disableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    expectEvent(disableStakeTx, 'StakingDisabled', {
      id: STAKE_TARGET_STR
    })
    const stakingEnabled = await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    expect(stakingEnabled).to.be.false
  })

  it('cannot stake if staking disabled', async function () {
    await expectRevert(
      this.erc900.stake(123, utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator}),
      'Staking is not enabled for target'
    )
  })

  it('can stake if staking enabled', async function () {
    await this.erc900.enableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    const stakeTx = await this.erc900.stake(STAKE_AMOUNT, utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});

    expectEvent(stakeTx, 'Staked', {
      "user": creator,
      "amount": STAKE_AMOUNT.toString(),
      "total": STAKE_AMOUNT.toString(),
      "data": utils.getIntAsByteString(STAKE_TARGET_ID)
    })

    const totalStakedOn = await this.erc900.totalStakedOn(utils.getIntAsBytes(STAKE_TARGET_ID))
    totalStakedOn["0"].should.be.bignumber.equal(STAKE_AMOUNT.toString())

  })

  it('stake amount is equal to weighted stake amount', async function () {
    await this.erc900.enableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    const stakeTx = await this.erc900.stake(STAKE_AMOUNT, utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});


    expectEvent(stakeTx, 'WeightedStaked', {
      "user": creator,
      "amount": STAKE_AMOUNT.toString(),
      "weightedAmount": STAKE_AMOUNT.toString(),
      "total": STAKE_AMOUNT.toString(),
      "weightedTotal": STAKE_AMOUNT.toString(),
      "data": utils.getIntAsByteString(STAKE_TARGET_ID)
    })

    const totalStakedOn = await this.erc900.totalStakedOn(utils.getIntAsBytes(STAKE_TARGET_ID))
    totalStakedOn["0"].should.be.bignumber.equal(STAKE_AMOUNT.toString())

  })

  it('can unstake', async function () {
    await this.erc900.enableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    await this.erc900.stakingEnabled(STAKE_TARGET_ID);
    await this.erc900.stake(STAKE_AMOUNT, utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});

    const totalStakedOn = await this.erc900.totalStakedOn(utils.getIntAsBytes(STAKE_TARGET_ID))
    totalStakedOn["0"].should.be.bignumber.equal(STAKE_AMOUNT.toString())
    await this.erc900.unstake(STAKE_AMOUNT/2, utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    const totalStakedAfterUnstake = await this.erc900.totalStakedOn(utils.getIntAsBytes(STAKE_TARGET_ID))
    totalStakedAfterUnstake["0"].should.be.bignumber.equal((STAKE_AMOUNT / 2).toString())

  })

  it('multiple stakes are cumulative', async function () {
    const creatorStakeAmount = STAKE_AMOUNT
    const stakerStakerAmount = STAKE_AMOUNT / 2

    await this.erc900.enableStaking(utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    await this.erc900.stake(creatorStakeAmount, utils.getIntAsBytes(STAKE_TARGET_ID), {from: creator});
    await this.erc900.stake(stakerStakerAmount, utils.getIntAsBytes(STAKE_TARGET_ID), {from: staker});

    const totalStakedOn = await this.erc900.totalStakedOn(utils.getIntAsBytes(STAKE_TARGET_ID))
    totalStakedOn["0"].should.be.bignumber.equal(( creatorStakeAmount + stakerStakerAmount).toString())

  })


});