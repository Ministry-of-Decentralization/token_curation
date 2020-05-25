pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract GTCRToken is ERC777 {
    constructor(
        uint256 initialSupply,
        address[] memory defaultOperators
    )
        ERC777("GTCRToken", "GTCR", defaultOperators)
        public
    {
        _mint(msg.sender, initialSupply, "", "");
    }
}