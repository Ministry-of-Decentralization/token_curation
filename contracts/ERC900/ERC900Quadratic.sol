// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;

import "./IERC900.sol";
import "./QuadraticVoting.sol";
import "../TokenBalances.sol";

contract ERC900Quadratic is IERC900, QuadraticVoting, TokenBalances {

    // a Stake is an absolute amount and a weighted amount
    struct Stake {
      uint256 amount;
      uint256 weightedAmount;
    }

    // stake target id => boolean inidcating if staking is enabled for the target id
    mapping(uint256 => bool) public stakingEnabled;
    // this mapping is the stake target id -> total amount staked
    mapping(uint256 => Stake) public stakeTotals;

    // total staked
    uint256 public totalStakedAmount = 0;
    uint256 totalWeightedStakedAmount = 0;

    // total staked by user
    mapping(address => Stake) public totalStakedForUser;

    // user -> stake target id -> user amount staked to target
    mapping(address => mapping(uint256 => Stake)) public userStakes;

    event Staked(address indexed user, uint256 amount, uint256 total, bytes data);
    event Unstaked(address indexed user, uint256 amount, uint256 total, bytes data);
    event WeightedStaked(address indexed user, uint256 amount, uint256 total, uint256 weightedAmount, uint256 weightedTotal, bytes data);
    event WeightedUnstaked(address indexed user, uint256 amount, uint256 total, uint256 weightedAmount, uint256 weightedTotal, bytes data);
    event StakingEnabled(uint256 id);
    event StakingDisabled(uint256 id);

    constructor(
      address _tokenAddress,
      address _owner
    ) public TokenBalances(_tokenAddress, _owner) {}

    function dataToTargetId(bytes memory data) private pure returns (uint256) {
        // bytes memory targetIdb = bytes(data);

      uint x;
      assembly {
        x := mload(add(data, add(0x20, 0)))
      }
      return x;
    }

    function totalStakedOn(bytes calldata data) external view override returns (uint256, uint256) {
      uint256 targetId = dataToTargetId(data);

      return (stakeTotals[targetId].amount, stakeTotals[targetId].weightedAmount);
    }

    function totalStakedFor(address addr) external view override returns (uint256) {
      return totalStakedForUser[addr].amount;
    }

    function updateStake(address addr, uint256 amount,uint256 targetId, bytes memory data) internal {
      Stake storage userStake = userStakes[addr][targetId];
      // add the stake amount to the user -> target stake total
      userStake.amount = userStake.amount.add(amount);

      uint256 weightedAmount = getWeightedAmount(amount);
      userStake.weightedAmount = userStake.weightedAmount.add(weightedAmount);

      Stake storage totalStake = stakeTotals[targetId];
      // add the stake amount to the target stake total
      totalStake.amount = totalStake.amount.add(amount);

      totalStake.weightedAmount = totalStake.weightedAmount.add(weightedAmount);

      // update the total staked
      totalStakedAmount = totalStakedAmount.add(amount);
      totalWeightedStakedAmount = totalWeightedStakedAmount.add(weightedAmount);

      // update the users total stake
      Stake storage userTotalStake = totalStakedForUser[addr];
      userTotalStake.amount = userTotalStake.amount.add(amount);
      userTotalStake.weightedAmount = userTotalStake.weightedAmount.add(weightedAmount);

      emit Staked(addr, amount, userTotalStake.amount, data);
      emit WeightedStaked(addr, amount, userTotalStake.amount, weightedAmount, totalStake.weightedAmount, data);
    }

    function stake(uint256 amount, bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(balances[msg.sender] >= amount, "Stake amount exceeds user balance");
      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].sub(amount);

      updateStake(msg.sender, amount, targetId, data);
    }

    function stakeFor(address user, uint256 amount, bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(balances[msg.sender] >= amount, "Stake amount exceeds user balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].sub(amount);

      updateStake(user, amount, targetId, data);
    }

    function unstake(uint256 amount, bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(userStakes[msg.sender][targetId].amount >= amount, "Unstake amount exceeds user's staked balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].add(amount);

      Stake storage userStake = userStakes[msg.sender][targetId];
      // add the stake amount to the user -> target stake total
      userStake.amount = userStake.amount.sub(amount);

      uint256 weightedAmount = getWeightedAmount(amount);
      userStake.weightedAmount = userStake.weightedAmount.sub(weightedAmount);

      Stake storage totalStake = stakeTotals[targetId];
      // add the stake amount to the target stake total
      totalStake.amount = totalStake.amount.sub(amount);

      totalStake.weightedAmount = totalStake.weightedAmount.sub(weightedAmount);

      // update the total staked
      totalStakedAmount = totalStakedAmount.sub(amount);
      totalWeightedStakedAmount = totalWeightedStakedAmount.sub(weightedAmount);

      // update the users total stake
      Stake storage userTotalStake = totalStakedForUser[msg.sender];
      userTotalStake.amount = userTotalStake.amount.sub(amount);
      userTotalStake.weightedAmount = userTotalStake.weightedAmount.sub(weightedAmount);

      emit Unstaked(msg.sender, amount, userTotalStake.amount, data);
      emit WeightedUnstaked(msg.sender, amount, userTotalStake.amount, weightedAmount, totalStake.weightedAmount, data);

    }

    function enableStaking(bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId] == false, "Staking is already enabled for target");
      stakingEnabled[targetId] = true;
      emit StakingEnabled(targetId);
    }

    function disableStaking(bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId] == true, "Staking is already disabled for target");
      stakingEnabled[targetId] = false;
      emit StakingDisabled(targetId);
    }

    function totalStaked() external view override returns (uint256) {
      return totalStakedAmount;
    }

    function totalWeightedStaked() external view override returns (uint256) {
      return totalWeightedStakedAmount;
    }

    function token() external view override returns (address) {
      return address(tokenContract);
    }
    function supportsHistory() external pure override returns (bool) {
      return false;
    }

    function totalStakedForOn(address addr, bytes calldata data) external view override returns (uint256, uint256) {
      uint256 targetId = dataToTargetId(data);
      return (userStakes[addr][targetId].amount, userStakes[addr][targetId].weightedAmount);
    }

    function totalWeightedStakedFor(address addr) external view override returns (uint256, uint256) {
      return (totalStakedForUser[addr].amount, totalStakedForUser[addr].weightedAmount);
    }
}