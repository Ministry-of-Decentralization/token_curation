pragma solidity 0.6.8;

contract Words {
  string[] public words;

  event WordAdded(string word, uint id);

  function addWord(string memory word) public {
    words.push(word);
    emit WordAdded(word, words.length-1);
  }

  function getWordCount() public view returns (uint) {
    return words.length;
  }
}