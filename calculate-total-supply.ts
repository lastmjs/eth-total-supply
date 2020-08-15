// TODO add really good readme with methodology

// TODO change all wording to issued, issuance, to indicate that this is a calculation of the issued supply according to the rules of the protocol
// TODO the actual total supply will have to be calculated by walking account balances
// TODO theoretically, if done correctly, walking the account balances should match the calculated supply issuance

import {
    WEI,
    ETH
} from './types.d';
import { calculateGenesisSupply } from './calculate-genesis-supply';
import { calculateBlockRewardSupply } from './calculate-block-reward-supply';
import { getLatestBlockNumber } from './fetch-blocks';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(`Enter block number (leave blank for latest synchronized block):`, async (blockNumberString: string) => {
    const blockNumber: number = blockNumberString === '' ? await getLatestBlockNumber(): parseInt(blockNumberString);
    // const blockNumber: number = 6912; // should be 72049306.59375 or 72049306.59323

    if (
        isNaN(blockNumber) ||
        blockNumber < 0
    ) {
        console.log(`That is not a valid block number`);
        return;
    }

    console.log(`Calculating issuance up to and including block ${blockNumber}...`);
    console.log();

    const genesisSupply: WEI = calculateGenesisSupply();
    const genesisSupplyInETH: ETH = genesisSupply.dividedBy(10**18);
    
    const blockRewardSupply: WEI = await calculateBlockRewardSupply(0, blockNumber, genesisSupply);
    const blockRewardSupplyInETH: ETH = blockRewardSupply.dividedBy(10**18);
    
    const totalSupply: WEI = genesisSupply.plus(blockRewardSupply);
    const totalSupplyInETH: ETH = (genesisSupply.plus(blockRewardSupply)).dividedBy(10**18);
    
    console.log('genesis supply in WEI:', genesisSupply.toFixed());
    console.log('genesis supply in ETH:', genesisSupplyInETH.toString());
    console.log();
    
    console.log(`block reward supply in WEI at block ${blockNumber}:`, blockRewardSupply.toFixed());
    console.log(`block reward supply in ETH at block ${blockNumber}:`, blockRewardSupplyInETH.toString());
    console.log();
    
    console.log(`total supply in WEI at block ${blockNumber}:`, totalSupply.toFixed());
    console.log(`total supply in ETH at block ${blockNumber}:`, totalSupplyInETH.toString());
});