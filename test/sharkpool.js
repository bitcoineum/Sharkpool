'use strict';

var SharkPool = artifacts.require("./SharkPool.sol");
var SharkPoolMock = artifacts.require("./helpers/SharkPoolMock.sol");
const assertJump = require('zeppelin-solidity/test/helpers/assertJump');
var BitcoineumMock = artifacts.require('./helpers/BitcoineumMock.sol');

var BigNumber = require("bignumber.js");

// Helper functions

function awaitEvent(event, handler) {
  return new Promise((resolve, reject) => {
    function wrappedHandler(...args) {
      Promise.resolve(handler(...args)).then(resolve).catch(reject);
    }
  
    event.watch(wrappedHandler);
  });
}

function minimumWei() {
	return web3.toWei('100', 'szabo')
}

function calcTotalWei(val) {
	  return new BigNumber(val).times(2016).toString(); 
}

async function setup_miner() {
	let bte = await BitcoineumMock.new();
	let miner = await SharkPoolMock.new();
	await miner.set_bitcoineum_contract_address(bte.address);
	return miner;
}


// Testing

contract('SharkPoolTest', function(accounts) {


  // Maxint in Ether
  var maxint = new BigNumber(2).toPower(256).minus(1);

  // Starts with static element testing for constants and setup

  it("should correctly deploy a miner and an attached bte contract", async function() {
  	  let miner = await setup_miner();
  });


  it("should return the correct bte contract", async function() {
      let bte = await BitcoineumMock.new();
      let miner = await SharkPoolMock.new();
      let real_miner = await SharkPool.new();
      let addr = await real_miner.get_bitcoineum_contract_address();
      assert.equal(addr, "0x73dd069c299a5d691e9836243bcaec9c8c1d8734");
      await miner.set_bitcoineum_contract_address(bte.address);
      addr = await miner.get_bitcoineum_contract_address();
      assert.equal(addr, bte.address);
  });

  it("should have correct default values", async function() {
  	  let miner = await setup_miner();
  	  let max_users = await miner.max_users();
  	  assert.equal(max_users, 256);
  	  let contract_period = await miner.contract_period();
  	  assert.equal(contract_period, 100);
  	  let mined_blocks = await miner.mined_blocks();
  	  assert.equal(mined_blocks, 1);
  	  let claimed_blocks = await miner.claimed_blocks();
  	  assert.equal(claimed_blocks, 1);
  	  let blockCreationRate = await miner.blockCreationRate();
  	  assert.equal(blockCreationRate, 50);
  });

  it("Should not let us call internal allocate_slot", async function() {
  	  let miner = await setup_miner();
  	  let caught = false;
  	  try {
  	  	    await miner.allocate_slot(accounts[0]);
		} catch(error) {
			caught = true;
		}	
	  assert.isTrue(caught);
  });

  it("Should not allocate slots by default", async function() {
  	  let miner = await setup_miner();
  	  for (var i=0; i<256; i++) {
  	      await miner.do_allocate_slot(accounts[0])
      }
      let total_users = await miner.total_users();
      assert.equal(total_users.valueOf(), 256);
      let available_slots = await miner.available_slots();
      assert.equal(available_slots.valueOf(), 0);
  });

  it("Should throw if there are no available slots and max users is reached", async function() {
      let miner = await setup_miner();
      await miner.set_total_users(255);

      try {
          await miner.do_allocate_slot(accounts[0]);
      } catch(error) {
          return assertJump(error);
      }
  })


  it("Should calculate available slots correctly", async function() {
      let miner = await setup_miner();
      let available_slots = await miner.available_slots();
      assert.equal(available_slots.valueOf(), 256);
      for (var i=0; i<256; i++) {
          await miner.do_allocate_slot(accounts[0]);
          let available_slots = await miner.available_slots();
          assert.equal(available_slots.valueOf(), 255-i);
      }
      available_slots = await miner.available_slots();
      assert.equal(available_slots.valueOf(), 0);
  });


  // Blatantly copied from Bitcoineum tests to ensure compat
  it("should calculate the block window based on the external ethereum block", async function() {
  	  let miner = await setup_miner();
  	  let res = await miner.external_to_internal_block_number(0);
  	  assert.equal(res.valueOf(), 0, "External block 0 should be window 0");
  	  res = await miner.external_to_internal_block_number(100);
  	  assert.equal(res.valueOf(), 2, "External block 100 should be window 2");
  	  for (var i=0; i < 50; i++) {
  	    assert.equal(Math.trunc((1000+i) / 50), 20);
  	    res = await miner.external_to_internal_block_number(1000+i);
  	    assert.equal(res.valueOf(), 20, "External block 1000 to 1049 should be window 20");
      }
  	  res = await miner.external_to_internal_block_number(maxint);
  	  assert.equal(res.toString(), maxint.dividedToIntegerBy(50).toString(), "External block maxint should be window maxint divided by 50");
  });


  // This is the minimum block contribution amount multiplied by the total number of blocks in the contract period
  it("should calculate the minimum contribution based on the attached bte contract", async function() {
      let miner = await setup_miner();
      let contribution = await miner.calculate_minimum_contribution();
      assert.equal(contribution.toString(), '1000000000');
  });

  it("should not allow me to add a contribution under the minimum to the pool", async function() {
      let miner = await setup_miner();
      try {
         await miner.sendTransaction({value: '100000000', from: accounts[0], gas: '125000'});
      } catch(error) {
          assertJump(error);
      }
  });

  it("should fail on default gas", async function() {
      let miner = await setup_miner();
      try {
        await miner.sendTransaction({value: '1000000000', from: accounts[0]});
      } catch(error) {
          assertJump(error);
      }
  });



  it("should allow me to add a contribution to the pool", async function() {
      let miner = await setup_miner();
      await miner.sendTransaction({value: '1000000000', from: accounts[0], gas: '125000'});
      let res = await miner.find_contribution(accounts[0]);
      assert.equal(res[2].toString(), '10000000');
      assert.equal(res[3].toString(), '1000000000');
  });

  it("should return zeros when a contribution does not exist", async function() {
      let miner = await setup_miner();
      let res = await miner.find_contribution(accounts[0]);
      assert.equal(res[0].toString(), '0');
      assert.equal(res[1].toString(), '0');
      assert.equal(res[2].toString(), '0');
      assert.equal(res[3].toString(), '0');
  });




});

