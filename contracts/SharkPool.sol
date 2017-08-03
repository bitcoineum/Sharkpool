pragma solidity ^0.4.13;

import './BitcoineumInterface.sol';
import 'zeppelin-solidity/contracts/ReentrancyGuard.sol';

contract SharkPool is ReentrancyGuard {

    uint256 constant public max_users = 256;

    // Track total users to switch to degraded case when contract is full
    uint256 public total_users = 0;

    uint256 public divisible_units = 100000;

    // How long will a payment event mine blocks for you
    uint256 public contract_period = 144;
    uint256 public mined_blocks = 1;
    uint256 public claimed_blocks = 1;
    uint256 public blockCreationRate = 0;

    BitcoineumInterface base_contract;

    struct user {
        uint256 start_block;
        uint256 end_block;
        uint256 proportional_contribution;
    }

    mapping (address => user) public users;
    mapping (uint256 => uint256) public attempts;
    uint8[] slots;
    address[256] public active_users; // Should equal max_users

    function allocate_slot(address who) {
       if(total_users < max_users) {
            // Just push into active_users
            active_users[total_users] = who;
            total_users += 1;
          } else {
            // The maximum users have been reached, can we allocate a free space?
            if (slots.length > 0) {
                // There isn't any room left
                revert();
            } else {
               uint8 location = slots[slots.length-1];
               active_users[location] = who;
               delete slots[slots.length-1];
            }
          }
    }

     function external_to_internal_block_number(uint256 _externalBlockNum) public constant returns (uint256) {
        // blockCreationRate is > 0
        return _externalBlockNum / blockCreationRate;
     }

     function available_slots() public constant returns (uint256) {
        if (total_users < max_users) {
            return max_users - total_users;
        } else {
          return slots.length;
        }
     }
  

    function get_bitcoineum_contract_address() public constant returns (address) {
       return 0x73dD069c299A5d691E9836243BcaeC9c8C1D8734;
    }

    // iterate over all account holders
    // and balance transfer proportional bte
    // balance should be 0 aftwards in a perfect world
    function distribute_reward(uint256 _totalAttempt, uint256 _balance) internal {
      uint256 remaining_balance = _balance;
      for (uint8 i = 0; i < total_users; i++) {
          address user_address = active_users[i];
          if (user_address > 0) {
              uint256 proportion = users[user_address].proportional_contribution;
              uint256 divided_portion = (proportion * divisible_units) / _totalAttempt;
              uint256 payout = (_balance * divided_portion) / divisible_units;
              if (payout > remaining_balance) {
                 payout = remaining_balance;
              }
              base_contract.transferFrom(this, user_address, payout);
              remaining_balance = remaining_balance - payout;
              if (remaining_balance == 0) {
                 return;
              }
          }
      }
    }

    function SharkPool() {
      blockCreationRate = 50; // match bte
      base_contract = BitcoineumInterface(get_bitcoineum_contract_address());
    }

    function () payable {
         // Did the user already contribute
         user storage current_user = users[msg.sender];

         // Does user exist already
         if (current_user.start_block > 0) {
            if (current_user.end_block > mined_blocks) {
                uint256 periods_left = current_user.end_block - mined_blocks;
                uint256 amount_remaining = current_user.proportional_contribution * periods_left;
                amount_remaining = amount_remaining + msg.value;
                amount_remaining = amount_remaining / contract_period;
                current_user.proportional_contribution = amount_remaining;
            } else {
               current_user.proportional_contribution = msg.value / contract_period;
            }
          } else {
               current_user.proportional_contribution = msg.value / contract_period;
               allocate_slot(msg.sender);
          }
          current_user.start_block = mined_blocks;
          current_user.end_block = mined_blocks + contract_period;
         }

    
    // Proxy mining to token
   function mine() external nonReentrant
   {
     // Did someone already try to mine this block?
     uint256 _blockNum = external_to_internal_block_number(block.number);
     require(!base_contract.checkMiningAttempt(_blockNum, this));

     // Alright nobody mined lets iterate over our active_users

     uint256 total_attempt = 0;

     for (uint8 i=0; i<max_users; i++) {
         if (active_users[i] > 0) {
             // This user exists
             user memory u = users[active_users[i]];
             if (u.end_block < mined_blocks) {
                // This user needs to be ejected, no more attempts left
                delete active_users[i];
                slots.push(i);
                delete users[active_users[i]];
             } else {
               // This user is still active
               total_attempt = total_attempt + u.proportional_contribution;
             }
         }
     }

     // Now we have a total contribution amount
     attempts[_blockNum] = total_attempt;
     base_contract.mine.value(total_attempt)();
     mined_blocks = mined_blocks + 1;
   }

   function claim(uint256 _blockNumber, address forCreditTo)
                  nonReentrant
                  external returns (bool) {
                  address a = forCreditTo; // Squelch compiler warning, we keep this for compat with bte tools
                  a = this;
                  
                  // Did we win the block in question
                  require(base_contract.checkWinning(_blockNumber));


                  // We won let's get our reward
                  base_contract.claim(_blockNumber, a);
                  
                  uint256 balance = base_contract.balanceOf(this);
                  uint256 total_attempt = attempts[_blockNumber];

                  distribute_reward(total_attempt, balance);
                  claimed_blocks = claimed_blocks + 1;
                  }


   function checkMiningAttempt(uint256 _blockNum, address _sender) constant public returns (bool) {
      return base_contract.checkMiningAttempt(_blockNum, _sender);
   }
   
   function checkWinning(uint256 _blockNum) constant public returns (bool) {
     return base_contract.checkWinning(_blockNum);
   }

}
