import { BigNumber } from 'bignumber.js';
import {
    WEI,
    BlockWithUncleBlocks,
    UncleBlock
} from './types.d';
import { fetchBlocksWithUncleBlocks } from './fetch-blocks';

/**
 * Calculates the total issued supply between two block numbers inclusive.
 * Logs the cumulative issued supply as it progresses through the blockchain.
 * Batching can be configured with the skip parameter, somewhere between 1000 and 10000 seems to work alright on Geth.
 */
export async function calculateBlockRewardSupply(
    startBlockNumber: number,
    endBlockNumber: number,
    genesisSupply: WEI,
    skip: number = 10000
): Promise<WEI> {

    // There was no block reward for block 0, so skip to block 1 if block 0 is provided as the startBlockNumber
    if (startBlockNumber === 0) {
        return calculateBlockRewardSupply(startBlockNumber + 1, endBlockNumber, genesisSupply, skip);
    }

    let blockRewardSupply: WEI = new BigNumber(0);

    for (let i=startBlockNumber; i <= endBlockNumber; i += skip) {
        const currentStartBlockNumber: number = i === startBlockNumber ? startBlockNumber : startBlockNumber + i - 1;
        const currentEndBlockNumber: number = currentStartBlockNumber + skip - 1 < endBlockNumber ? currentStartBlockNumber + skip - 1 : endBlockNumber;

        console.log(`fetching blocks ${currentStartBlockNumber}-${currentEndBlockNumber}`);

        // Blocks and their uncle blocks must be fetched in order to calculate the block rewards correctly
        const blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks> = await fetchBlocksWithUncleBlocks(currentStartBlockNumber, currentEndBlockNumber);
        const blockRewardForBlocksWithUnclesBlocks: WEI = calculateBlockRewardForBlocksWithUncleBlocks(blocksWithUncleBlocks);
    
        blockRewardSupply = blockRewardSupply.plus(blockRewardForBlocksWithUnclesBlocks);
    
        console.log(`block reward supply at block ${currentEndBlockNumber}: ${blockRewardSupply.dividedBy(10**18)} ETH`);
        console.log(`total supply at block ${currentEndBlockNumber}: ${genesisSupply.plus(blockRewardSupply).dividedBy(10**18)} ETH`);
        console.log();
    }

    return blockRewardSupply;
}

/**
 * Calculates the sum of all block rewards for passed in blocks with their uncle blocks.
 */
function calculateBlockRewardForBlocksWithUncleBlocks(blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks>): WEI {
    return blocksWithUncleBlocks.reduce((blockRewardSupply: WEI, blockWithUncleBlocks: Readonly<BlockWithUncleBlocks>) => {
        return blockRewardSupply.plus(calculateBlockRewardForBlockWithUncleBlocks(blockWithUncleBlocks));
    }, new BigNumber(0));
}

/**
 * Calculates the block reward for a block and its uncle blocks.
 * This is the main block rewards algorithm.
 * This algorithm can be verified in the Ethereum Yellow Paper and Ethereum client implementations.
 * Some of these resources are included below:
 * Ethereum Yellow Paper: https://ethereum.github.io/yellowpaper/paper.pdf 11.3. Reward Application.
 * Geth implementation: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L621
 * Open Ethereum implementation: https://github.com/openethereum/openethereum/blob/master/ethcore/engines/ethash/src/lib.rs#L248
 * Nethermind implementation: https://github.com/NethermindEth/nethermind/blob/f5c249445452177873372f905ab65ba366a29713/src/Nethermind/Nethermind.Blockchain/Rewards/RewardCalculator.cs#L43
 */
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

/**
 * Returns the base block reward for a block based on block number.
 * The rewards started at 5 ETH per block, and have been changed twice with hard forks.
 * These rewards can be verified in the Ethereum client implementations.
 * Some of these resources are included below:
 * Geth block reward definitions: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L40
 * Geth hard fork block number definitions: https://github.com/ethereum/go-ethereum/blob/master/params/config.go#L55
 * Open Ethereum block reward and hard fork block number definitions: https://github.com/openethereum/openethereum/blob/master/ethcore/res/ethereum/foundation.json, look at engine.Ethash.params.blockReward
 * Nethermind block reward and hard fork block number definitions: https://github.com/NethermindEth/nethermind/blob/master/src/Nethermind/Chains/foundation.json, look at engine.Ethash.params.blockReward
 */
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