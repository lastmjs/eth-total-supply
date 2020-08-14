import { BigNumber } from 'bignumber.js';
import {
    WEI,
    BlockWithUncleBlocks,
    UncleBlock
} from './types.d';
import { fetchBlocksWithUncleBlocks } from './fetch-blocks';

export async function calculateBlockRewardSupply(
    startBlockNumber: number,
    endBlockNumber: number,
    genesisSupply: WEI,
    skip: number = 10000
): Promise<WEI> {

    if (startBlockNumber === 0) {
        return calculateBlockRewardSupply(startBlockNumber + 1, endBlockNumber, genesisSupply, skip);
    }

    let blockRewardSupply: WEI = new BigNumber(0);

    for (let i=startBlockNumber; i <= endBlockNumber; i += skip) {
        const currentStartBlockNumber: number = i === startBlockNumber ? startBlockNumber : startBlockNumber + i - 1;
        const currentEndBlockNumber: number = currentStartBlockNumber + skip - 1 < endBlockNumber ? currentStartBlockNumber + skip - 1 : endBlockNumber;

        console.log(`fetching blocks ${currentStartBlockNumber}-${currentEndBlockNumber}`);

        const blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks> = await fetchBlocksWithUncleBlocks(currentStartBlockNumber, currentEndBlockNumber);
        const blockRewardForBlocksWithUnclesBlocks: WEI = calculateBlockRewardForBlocksWithUncleBlocks(blocksWithUncleBlocks);
    
        blockRewardSupply = blockRewardSupply.plus(blockRewardForBlocksWithUnclesBlocks);
    
        console.log(`block reward supply at block ${currentEndBlockNumber}: ${blockRewardSupply.dividedBy(10**18)} ETH`);
        console.log(`total supply at block ${currentEndBlockNumber}: ${genesisSupply.plus(blockRewardSupply).dividedBy(10**18)} ETH`);
        console.log();
    }

    return blockRewardSupply;
}

function calculateBlockRewardForBlocksWithUncleBlocks(blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks>): WEI {
    return blocksWithUncleBlocks.reduce((blockRewardSupply: WEI, blockWithUncleBlocks: Readonly<BlockWithUncleBlocks>) => {
        return blockRewardSupply.plus(calculateBlockRewardForBlockWithUncleBlocks(blockWithUncleBlocks));
    }, new BigNumber(0));
}

// Ethereum Yellow Paper: https://ethereum.github.io/yellowpaper/paper.pdf 11.3. Reward Application.
// Geth implementation: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L621
// Open Ethereum implementation: 
// Nethermind implementation: 
function calculateBlockRewardForBlockWithUncleBlocks(blockWithUncleBlocks: Readonly<BlockWithUncleBlocks>): WEI {
    const blockNumber: number = parseInt(blockWithUncleBlocks.number, 16);
    const baseBlockReward: WEI = getBaseBlockReward(blockNumber);
    const blockRewardForUncles: WEI = baseBlockReward.multipliedBy(blockWithUncleBlocks.uncles.length).dividedBy(32);
    const uncleBlockRewards: WEI = blockWithUncleBlocks.uncles.reduce((result: WEI, uncleBlock: Readonly<UncleBlock>) => {
        const uncleBlockNumber: number = parseInt(uncleBlock.number, 16);
        return result.plus(baseBlockReward.multipliedBy(new BigNumber(uncleBlockNumber).plus(8).minus(blockNumber)).dividedBy(8));
    }, new BigNumber(0));
    
    return baseBlockReward.plus(blockRewardForUncles).plus(uncleBlockRewards);
}

// Geth block reward definitions: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L40
// Geth hard fork block number definitions: https://github.com/ethereum/go-ethereum/blob/master/params/config.go#L55
// Open Ethereum block reward definitions: https://github.com/openethereum/openethereum/blob/master/ethcore/block-reward/src/lib.rs??
// Open Ethereum hard fork block number definitions: https://github.com/openethereum/openethereum/blob/master/ethcore/block-reward/src/lib.rs??
// Nethermind block reward definitions:
// Nethermind hard fork block number definitions:
function getBaseBlockReward(blockNumber: number): WEI {
    if (
        blockNumber >= 1 &&
        blockNumber < 4370000
    ) {
        return new BigNumber(5).times(10**18);
    }

    if (
        blockNumber >= 4370000 &&
        blockNumber < 7280000
    ) {
        return new BigNumber(3).times(10**18);
    }

    return new BigNumber(2).times(10**18);
}