pragma solidity ^0.4.13;

// Minimal Bitcoineum interface for proxy mining
contract BitcoineumInterface {
   function mine() payable;
   function claim(uint256 _blockNumber, address forCreditTo);
   function checkMiningAttempt(uint256 _blockNum, address _sender) constant public returns (bool);
   function checkWinning(uint256 _blockNum) constant public returns (bool);
   function transferFrom(address _from, address _to, uint256 _value);
   function balanceOf(address _owner) constant returns (uint256 balance);
   }
