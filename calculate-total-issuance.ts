import {
    WEI,
    ETH
} from './types';
import { calculateGenesisIssuance } from './calculate-genesis-issuance';
import { calculateBlockRewardIssuance } from './calculate-block-reward-issuance';
import { getLatestBlockNumber } from './fetch-blocks';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question(`Enter block number (leave blank for latest synchronized block):`, async (blockNumberString: string) => {
    const blockNumber: number = blockNumberString === '' ? await getLatestBlockNumber(): parseInt(blockNumberString);

    if (
        isNaN(blockNumber) ||
        blockNumber < 0
    ) {
        console.log(`That is not a valid block number`);
        return;
    }

    console.log(`Calculating issuance up to and including block ${blockNumber}...`);
    console.log();

    const genesisIssuance: WEI = calculateGenesisIssuance();
    const genesisIssuanceInETH: ETH = genesisIssuance.dividedBy(10**18);
    
    const blockRewardIssuance: WEI = await calculateBlockRewardIssuance(0, blockNumber, genesisIssuance);
    const blockRewardIssuanceInETH: ETH = blockRewardIssuance.dividedBy(10**18);
    
    const totalIssuance: WEI = genesisIssuance.plus(blockRewardIssuance);
    const totalIssuanceInETH: ETH = (genesisIssuance.plus(blockRewardIssuance)).dividedBy(10**18);
    
    console.log('genesis issuance in WEI:', genesisIssuance.toFixed());
    console.log('genesis issuance in ETH:', genesisIssuanceInETH.toString());
    console.log();
    
    console.log(`block reward issued in WEI at block ${blockNumber}:`, blockRewardIssuance.toFixed());
    console.log(`block reward issued in ETH at block ${blockNumber}:`, blockRewardIssuanceInETH.toString());
    console.log();
    
    console.log(`total issued WEI at block ${blockNumber}:`, totalIssuance.toFixed());
    console.log(`total issued ETH at block ${blockNumber}:`, totalIssuanceInETH.toString());
});