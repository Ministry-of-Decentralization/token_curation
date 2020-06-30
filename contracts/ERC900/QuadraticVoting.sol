// SPDX-License-Identifier: MIT

pragma solidity 0.6.8;

contract QuadraticVoting {

  function sqrt(uint x) internal pure returns (uint) {
    if (x == 0) return 0;
    uint z = (x + 1) / 2;
    uint y = x;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }
    return y;
  }

  function getWeightedAmount(uint256 amount) internal pure returns (uint256) {
    return sqrt(amount);
  }

}