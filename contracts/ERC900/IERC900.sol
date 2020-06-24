// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;


/**
 * @dev Interface of the ERC900 standard as defined in the EIP.
 */

interface IERC900 {

    event Staked(address indexed user, uint256 amount, uint256 total, bytes data);
    event Unstaked(address indexed user, uint256 amount, uint256 total, bytes data);

    function stake(uint256 amount, bytes calldata data) external;
    function unstake(uint256 amount, bytes calldata data) external;
    function stakeFor(address user, uint256 amount, bytes calldata data) external;
    function totalStakedFor(address addr) external view returns (uint256);
    function totalStaked() external view returns (uint256);
    function token() external view returns (address);
    function supportsHistory() external pure returns (bool);

    function enableStaking(bytes calldata data) external;
    function disableStaking(bytes calldata data) external;
    function totalStakedOn(bytes calldata data) external view returns (uint256);
    function totalStakedForOn(address addr, bytes calldata data) external view returns (uint256);

}