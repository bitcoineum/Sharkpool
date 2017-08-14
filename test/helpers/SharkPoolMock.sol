pragma solidity ^0.4.13;

import '../../contracts/SharkPool.sol';

/**
 * @title Bitcoineum Mocking framework
 * @dev exposes functionality for tests
 * @dev specifically playing with block advancement
 */


contract SharkPoolMock is SharkPool {

  address public bitcoineum_contract_address;
  uint256 public current_block = 1;

  function current_external_block() public constant returns (uint256) {
     return current_block;
  }

  function set_block(uint256 _blockNumber) {
     current_block = _blockNumber;
  }

  function get_bitcoineum_contract_address() public constant returns (address) {
     return bitcoineum_contract_address;
  }

  function set_bitcoineum_contract_address(address _addr) public {
    bitcoineum_contract_address = _addr;
    base_contract = BitcoineumInterface(get_bitcoineum_contract_address());
  }

  function set_allocated_users(uint256 _totalUsers) public {
    total_users = _totalUsers;
  }

  function set_max_users(uint256 _maxUsers) public {
     max_users = _maxUsers;
     }

  // Directly mock internal functions

  function do_allocate_slot(address _who) public {
     allocate_slot(_who);
  }

  function next_block() {
     current_block += 50;
  }

  function bte_block() public constant returns (uint256) {
     return external_to_internal_block_number(current_external_block());
  }

}


