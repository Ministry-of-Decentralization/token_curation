// Based on https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/examples/SimpleToken.test.js
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { expect } = require('chai');
require('chai').should();

const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const GTCRToken = contract.fromArtifact('GTCRToken');
const TokenBalances =  contract.fromArtifact('TokenBalances')

describe('GTCRToken', function () {
  const [registryFunder, creator, operator, receiver] = accounts;

  beforeEach(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await GTCRToken.new(10000, [], { from: creator });
    this.tokenBalances = await TokenBalances.new(this.token.address, creator, {from: creator});
    await this.token.authorizeOperator(this.tokenBalances.address, {from: creator})

  });

  it('has a name', async function () {
    const name = await this.token.name()
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
    const tokenBalancesBalance =  await this.token.balanceOf(this.tokenBalances.address);
    const creatorTokenBalancesBalance = await this.tokenBalances.balances(creator);
    creatorTokenBalancesBalance.should.be.bignumber.equal("0");

    creatorBalance.should.be.bignumber.equal(totalSupply);
    tokenBalancesBalance.should.be.bignumber.equal("0");

    const transferReceipt = await this.token.send(this.tokenBalances.address, TRANSFER_AMOUNT, [], {from: creator})

    const creatorBalanceAfter = await this.token.balanceOf(creator);
    const tokenBalancesBalanceAfter =  await this.token.balanceOf(this.tokenBalances.address);

    const expectedCreatorBalance = parseInt(totalSupply) - TRANSFER_AMOUNT
    creatorBalanceAfter.should.be.bignumber.equal(expectedCreatorBalance.toString());
    tokenBalancesBalanceAfter.should.be.bignumber.equal(TRANSFER_AMOUNT.toString());

    const creatorTokenBalancesBalanceAfter = await this.tokenBalances.balances(creator);
    creatorTokenBalancesBalanceAfter.should.be.bignumber.equal(TRANSFER_AMOUNT.toString());
    await expectEvent(transferReceipt, 'Transfer', {
      from: creator,
      to: this.tokenBalances.address,
      value: TRANSFER_AMOUNT.toString()
    });

    await this.tokenBalances.withdraw(TRANSFER_AMOUNT, {from: creator})

    const creatorBalanceAfterWD = await this.token.balanceOf(creator);
    const tokenBalancesBalanceAfterWD =  await this.token.balanceOf(this.tokenBalances.address);

    creatorBalanceAfterWD.should.be.bignumber.equal(totalSupply);
    tokenBalancesBalanceAfterWD.should.be.bignumber.equal("0");

    /*
    await expectEvent(transferReceipt, 'TokensReceived', {
      from: creator,
      to: this.tokenBalances.address,
      value: TRANSFER_AMOUNT.toString(),
    });
   */
  });


});
