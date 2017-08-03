'use strict';

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

  it("should have correct default values", async function() {
  	  let miner = await setup_miner();
  	  let max_users = await miner.max_users();
  	  assert.equal(max_users, 256);
  	  let contract_period = await miner.contract_period();
  	  assert.equal(contract_period, 144);
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
  });


});

