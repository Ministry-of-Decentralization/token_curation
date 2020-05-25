// Based on https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/examples/SimpleToken.test.js
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { expect } = require('chai');
require('chai').should();

const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const GTCRToken = contract.fromArtifact('GTCRToken');
const Grading =  contract.fromArtifact('Grading')

describe('GTCRToken', function () {
  const [registryFunder, creator, operator, receiver] = accounts;

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await GTCRToken.new(10000, [], { from: creator });
    console.log(`this token is ${this.token.address}`)
    this.grading = await Grading.new(this.token.address, creator, {from: creator});
    console.log(`Token Address :: ${this.token.address}\nGrading Address :: ${this.grading.address}`)
    await this.token.authorizeOperator(this.grading.address, {from: creator})

  });

  it('has a name', async function () {
    const name = await this.token.name()
    console.log('name in test', name)
    name.should.equal('GTCRToken');
  });

  it('has a symbol', async function () {
    (await this.token.symbol()).should.equal('GTCR');
  });

  it('assigns the initial total supply to the creator', async function () {
    const totalSupply = await this.token.totalSupply();
    const creatorBalance = await this.token.balanceOf(creator);

    creatorBalance.should.be.bignumber.equal(totalSupply);

    await expectEvent.inConstruction(this.token, 'Transfer', {
      from: ZERO_ADDRESS,
      to: creator,
      value: totalSupply,
    });
  });

  it('can transfer tokens to an external address', async function () {
    const TRANSFER_AMOUNT = 150;
    const totalSupply = await this.token.totalSupply();
    const creatorBalance = await this.token.balanceOf(creator);
    const receiverBalance =  await this.token.balanceOf(receiver);

    creatorBalance.should.be.bignumber.equal(totalSupply);
    receiverBalance.should.be.bignumber.equal("0");

    const transferReceipt = await this.token.send(receiver, TRANSFER_AMOUNT, [], {from: creator})

    const creatorBalanceAfter = await this.token.balanceOf(creator);
    const receiverBalanceAfter =  await this.token.balanceOf(receiver);

    const expectedCreatorBalance = parseInt(totalSupply) - TRANSFER_AMOUNT
    creatorBalanceAfter.should.be.bignumber.equal(expectedCreatorBalance.toString());
    receiverBalanceAfter.should.be.bignumber.equal(TRANSFER_AMOUNT.toString());
    await expectEvent(transferReceipt, 'Transfer', {
      from: creator,
      to: receiver,
      value: TRANSFER_AMOUNT.toString()
    });
  });

  it('can transfer tokens to a contract address', async function () {
    const TRANSFER_AMOUNT = 150;
    const totalSupply = await this.token.totalSupply();
    const creatorBalance = await this.token.balanceOf(creator);
    const gradingBalance =  await this.token.balanceOf(this.grading.address);
    const creatorGradingBalance = await this.grading.balances(creator);
    creatorGradingBalance.should.be.bignumber.equal("0");

    creatorBalance.should.be.bignumber.equal(totalSupply);
    gradingBalance.should.be.bignumber.equal("0");

    const transferReceipt = await this.token.send(this.grading.address, TRANSFER_AMOUNT, [], {from: creator})

    const creatorBalanceAfter = await this.token.balanceOf(creator);
    const gradingBalanceAfter =  await this.token.balanceOf(this.grading.address);

    const expectedCreatorBalance = parseInt(totalSupply) - TRANSFER_AMOUNT
    creatorBalanceAfter.should.be.bignumber.equal(expectedCreatorBalance.toString());
    gradingBalanceAfter.should.be.bignumber.equal(TRANSFER_AMOUNT.toString());

    const creatorGradingBalanceAfter = await this.grading.balances(creator);
    creatorGradingBalanceAfter.should.be.bignumber.equal(TRANSFER_AMOUNT.toString());
    await expectEvent(transferReceipt, 'Transfer', {
      from: creator,
      to: this.grading.address,
      value: TRANSFER_AMOUNT.toString()
    });

    const withdrawReceipt =  await this.grading.withdraw(TRANSFER_AMOUNT, {from: creator})

    const creatorBalanceAfterWD = await this.token.balanceOf(creator);
    const gradingBalanceAfterWD =  await this.token.balanceOf(this.grading.address);

    creatorBalanceAfterWD.should.be.bignumber.equal(totalSupply);
    gradingBalanceAfterWD.should.be.bignumber.equal("0");

    console.log(`withdraw receipt ${JSON.stringify(withdrawReceipt, null, 2)}`)
    /*
    await expectEvent(transferReceipt, 'TokensReceived', {
      from: creator,
      to: this.grading.address,
      value: TRANSFER_AMOUNT.toString()
      TokensReceived(operator, from, to, amount, userData, operatorData)
    });
    */
  });


});
