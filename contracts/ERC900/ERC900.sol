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
    uint256 public totalStaked = 0;

    // total staked by user
    mapping(address => uint256) public totalStakedByUser;

    // user -> stake target id -> user amount staked to target
    mapping(address => mapping(uint256 => uint256)) public userStakes;

    event Staked(address indexed user, uint256 amount, uint256 total, bytes data);
    event Unstaked(address indexed user, uint256 amount, uint256 total, bytes data);

    function stake(uint256 amount, bytes calldata data) external {
      uint256 targetId = uint256(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(balances[msg.sender] >= amount, "Stake amount exceeds user balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].sub(amount);

      // add the stake amount to the user -> target stake total
      userStakes[msg.sender][target.id] = userStakes[msg.sender][target.id].add(amount);

      // add the stake amount to the target stake total
      stakeTotals[targetId] = stakeTotals[targetId].add(amount);

      // update the total staked
      totalStaked = totalStaked.add(amount);

      // update the users total stake
      totalStakedByUser[msg.sender] = totalStakedByUser[msg.sender].add(amount);

      emit Staked(msg.sender, amount, totalStakedFor(msg.sender), data);
    }

    function stakeFor(address user, uint256 amount, bytes calldata data) external{
      uint256 targetId = uint256(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(balances[msg.sender] >= amount, "Stake amount exceeds user balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].sub(amount);

      // add the stake amount to the user -> target stake total
      userStakes[user][target.id] = userStakes[msg.sender][target.id].add(amount);

      // add the stake amount to the target stake total
      stakeTotals[targetId] = stakeTotals[targetId].add(amount);

      // update the total staked
      totalStaked = totalStaked.add(amount);

      // update the users total stake
      totalStakedByUser[user] = totalStakedByUser[user].add(amount);

      emit Staked(user, amount, totalStakedFor(user), data);
    }

    function unstake(uint256 amount, bytes calldata data) external {
      uint256 targetId = uint256(data);
      require(stakingEnabled[targetId], "Staking is not enabled for target");
      require(userStakes[user][target.id] >= amount, "Stake amount exceeds user balance");

      // subtract the stake amount the user balance
      balances[msg.sender] = balances[msg.sender].add(amount);

      // add the stake amount to the user -> target stake total
      userStakes[msg.sender][target.id] = userStakes[msg.sender][target.id].sub(amount);

      // add the stake amount to the target stake total
      stakeTotals[targetId] = stakeTotals[targetId].sub(amount);

      // update the total staked
      totalStaked = totalStaked.sub(amount);

      // update the users total stake
      totalStakedByUser[msg.sender] = totalStakedByUser[msg.sender].sub(amount);

      emit Unstaked(msg.sender, amount, totalStakedFor(msg.sender), data);

    }

    function totalStakedFor(address addr) external view returns (uint256) {
      return totalStakedByUser(addr);
    }

    function totalStaked() external view returns (uint256) {
      return totalStaked;
    }

    function token() external view returns (address) {
      return tokenContract;
    }
    function supportsHistory() external pure returns (bool) {
      return false;
    }

    function totalStakedOn(bytes calldata data) external view returns (uint) {
      uint256 targetId = uint256(data);
      return stakeTotals[targetId];
    }

    function totalStakedForOn(address addr, bytes calldata data) external view returns (uint256) {
      uint256 targetId = uint256(data);
      return userStakes[addr][targetId];
    }
}