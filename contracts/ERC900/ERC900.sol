// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;

import "./IERC900.sol";
import "../TokenBalances.sol";

contract ERC900 is IERC900, TokenBalances {

    // the target for staking is a uin256

    // stake target id => boolean inidcating if staking is enabled for the target id
    mapping(uint256 => bool) public stakingEnabled;
    // this mapping is the stake target id -> total amount staked
    mapping(uint256 => uint256) public stakeTotals;

    // total staked
    uint256 public totalStakedAmount = 0;

    // total staked by user
    mapping(address => uint256) public totalStakedForUser;

    // user -> stake target id -> user amount staked to target
    mapping(address => mapping(uint256 => uint256)) public userStakes;

    event Staked(address indexed user, uint256 amount, uint256 total, bytes data);
    event Unstaked(address indexed user, uint256 amount, uint256 total, bytes data);
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

    function getLen(bytes memory data) internal pure returns (uint256) {
      return data.length;
    }

    function getBytesLength(bytes memory data) public view returns (uint256) {
      return getLen(data);
    }

    function totalStakedOn(bytes calldata data) external view override returns (uint256) {
      uint256 targetId = dataToTargetId(data);

      return stakeTotals[targetId];
    }

    function totalStakedFor(address addr) external view override returns (uint256) {
      return totalStakedForUser[addr];
    }

    function stake(uint256 amount, bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(balances[msg.sender] >= amount, "Stake amount exceeds user balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].sub(amount);

      // add the stake amount to the user -> target stake total
      userStakes[msg.sender][targetId] = userStakes[msg.sender][targetId].add(amount);

      // add the stake amount to the target stake total
      stakeTotals[targetId] = stakeTotals[targetId].add(amount);

      // update the total staked
      totalStakedAmount = totalStakedAmount.add(amount);

      // update the users total stake
      totalStakedForUser[msg.sender] = totalStakedForUser[msg.sender].add(amount);

      emit Staked(msg.sender, amount, totalStakedForUser[msg.sender], data);
    }

    function stakeFor(address user, uint256 amount, bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(balances[msg.sender] >= amount, "Stake amount exceeds user balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].sub(amount);

      // add the stake amount to the user -> target stake total
      userStakes[user][targetId] = userStakes[msg.sender][targetId].add(amount);

      // add the stake amount to the target stake total
      stakeTotals[targetId] = stakeTotals[targetId].add(amount);

      // update the total staked
      totalStakedAmount = totalStakedAmount.add(amount);

      // update the users total stake
      totalStakedForUser[user] = totalStakedForUser[user].add(amount);

      emit Staked(user, amount, totalStakedForUser[user], data);
    }

    function unstake(uint256 amount, bytes calldata data) external override {
      uint256 targetId = dataToTargetId(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(userStakes[msg.sender][targetId] >= amount, "Stake amount exceeds user balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].add(amount);

      // add the stake amount to the user -> target stake total
      userStakes[msg.sender][targetId] = userStakes[msg.sender][targetId].sub(amount);

      // add the stake amount to the target stake total
      stakeTotals[targetId] = stakeTotals[targetId].sub(amount);

      // update the total staked
      totalStakedAmount = totalStakedAmount.sub(amount);

      // update the users total stake
      totalStakedForUser[msg.sender] = totalStakedForUser[msg.sender].sub(amount);

      emit Unstaked(msg.sender, amount, totalStakedForUser[msg.sender], data);

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

    function token() external view override returns (address) {
      return address(tokenContract);
    }
    function supportsHistory() external pure override returns (bool) {
      return false;
    }

    function totalStakedForOn(address addr, bytes calldata data) external view override returns (uint256) {
      uint256 targetId = dataToTargetId(data);
      return userStakes[addr][targetId];
    }
}