pragma solidity 0.6.8;

import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Sender.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract TokenBalances is IERC777Recipient, IERC777Sender {
  using SafeMath for uint;

  IERC1820Registry erc1820Contract = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
  bytes32 constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
  bytes32 constant public TOKENS_SENDER_INTERFACE_HASH = keccak256("ERC777TokensSender");


  IERC777 tokenContract;
  address owner;
  mapping(address => uint) public balances;

  event TokensReceived(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData);
  event TokensSent(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData);

  constructor(
      address _tokenAddress,
      address _owner
  )
      public
  {
      owner = _owner;
      tokenContract = IERC777(_tokenAddress);
      erc1820Contract.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
  }

  function tokensReceived(
    address operator,
    address from,
    address to,
    uint256 amount,
    bytes calldata userData,
    bytes calldata operatorData
  ) external override {
    require(msg.sender == address(tokenContract), "Simple777Recipient: Invalid token");

    balances[from] = balances[from].add(amount);

    emit TokensReceived(operator, from, to, amount, userData, operatorData);
  }

  function tokensToSend(
    address operator,
    address from,
    address to,
    uint256 amount,
    bytes calldata userData,
    bytes calldata operatorData
  ) external override {

      emit TokensSent(operator, from, to, amount, userData, operatorData);
  }

  function withdraw(
    uint amount
  ) public {
    require(balances[msg.sender] >= amount, "Insufficeient funds");
    balances[msg.sender] = balances[msg.sender].sub(amount);
    tokenContract.send(msg.sender, amount, "");
  }
}