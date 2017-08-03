pragma solidity ^0.4.13;

import '../../contracts/SharkPool.sol';

/**
 * @title Bitcoineum Mocking framework
 * @dev exposes functionality for tests
 * @dev specifically playing with block advancement
 */


contract SharkPoolMock is SharkPool {

  address bitcoineum_contract_address;

  function get_bitcoineum_contract_address() public constant returns (address) {
     return bitcoineum_contract_address;
  }

  function set_bitcoineum_contract_address(address _addr) public {
    bitcoineum_contract_address = _addr;
  }

  function set_total_users(uint256 _totalUsers) public {
    total_users = _totalUsers;
  }

  // Directly mock internal functions

  function do_allocate_slot(address _who) public {
     allocate_slot(_who);
  }

}


