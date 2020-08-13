// similar scripts:
// https://github.com/madumas/ethsupply
// https://github.com/CurrencyTycoon/mysupplyaudit
// https://github.com/NethermindEth/nethermind/pull/2193/files
// https://docs.nethermind.io/nethermind/guides-and-helpers/custom-analytic-tools

// TODO another way to verify the supply would be to walk all accounts and add up their balances
// TODO one caveat to this is selfdestructed contracts who send the balances to themselves...would have to account for that somehow

// TODO document the block rewards by hard forks

// TODO make sure everything is perfectly declarative
// TODO add really good comments to all functions and maybe variables...really comment this thing up
// TODO get rid of all typescript errors
// TODO add really good readme with methodology
// TODO add command-line options to choose block that you want to verify for, or default to the latest synced block

// TODO check my work here: https://github.com/madumas/ethsupply
// TODO check my work against: https://github.com/CurrencyTycoon/mysupplyaudit
// TODO check against etherscan and various others

// TODO trying to get memory under control

// TODO change all wording to issued, issuance, to indicate that this is a calculation of the issued supply according to the rules of the protocol
// TODO the actual total supply will have to be calculated by walking account balances
// TODO theoretically, if done correctly, walking the account balances should match the calculated supply issuance

// geth cache 2048
// 5696753 at 2020-08-13T15:24:56.210Z
// 5715955 at 2020-08-13T15:34:28.311Z
// (5715955 - 5696753) / 10 min = 1920.2 blocks per minute

// geth cache 4096
// 

import * as fetch from 'node-fetch';
import * as fs from 'fs';
import { BigNumber } from 'bignumber.js';

type WEI = BigNumber;
type ETH = BigNumber;
type HexString = string;

type NethermindGenesisBlockDistribution = {
    [ethAddress: string]: {
        readonly balance?: string;
    };
};

type OpenEthereumGenesisBlockDistribution = {
    [ethAddress: string]: {
        readonly balance?: string;
    };
};

type BlockResult = {
    readonly result: Readonly<Block>;
};

type UncleBlockResult = {
    readonly result: Readonly<UncleBlock>;
};

type Block = {
    readonly number: HexString;
    readonly uncles: Array<HexString>;
};

type BlockWithUncleBlocks = {
    readonly number: HexString;
    readonly uncles: ReadonlyArray<UncleBlock>;
};

type UncleBlock = {
    readonly number: HexString;
    readonly hash: HexString;
};

type UncleBlockMap = {
    [uncleHash: string]: HexString;
};

(async () => {
    const genesisSupply: WEI = calculateGenesisSupply();

    console.log('genesis supply in WEI:', genesisSupply.toFixed());

    const genesisSupplyInETH: ETH = genesisSupply.dividedBy(10**18);

    console.log('genesis supply in ETH:', genesisSupplyInETH.toString());
    console.log();

    // // const latestBlockNumber: number = await getLatestBlockNumber();
    // const latestBlockNumber: number = 6912; // should be 72049306.59375 or 72049306.59323
    // const latestBlockNumber: number = 10619692; // should be 112095482.21875
    const latestBlockNumber: number = 1000000;

    console.log('latest block number:', latestBlockNumber);
    console.log();

    const blockRewardSupply: WEI = await calculateBlockRewardSupply(0, latestBlockNumber, genesisSupply);

    console.log('block reward supply in WEI:', blockRewardSupply.toFixed());

    const blockRewardSupplyInETH: ETH = blockRewardSupply.dividedBy(10**18);

    console.log('block reward supply in ETH:', blockRewardSupplyInETH.toString());
    console.log();

    const totalSupply: WEI = genesisSupply.plus(blockRewardSupply);

    console.log(`total supply in WEI at block ${latestBlockNumber}:`, totalSupply.toFixed());

    const totalSupplyInETH: ETH = (genesisSupply.plus(blockRewardSupply)).dividedBy(10**18);

    console.log(`total supply in ETH at block ${latestBlockNumber}:`, totalSupplyInETH.toString());
})();

function calculateGenesisSupply(): WEI {
    // const genesisSupplyFromGethConfig: WEI = calculateGenesisSupplyFromGethConfig();
    const genesisSupplyFromOpenEthereumConfig: WEI = calculateGenesisSupplyFromOpenEthereumConfig();
    const genesisSupplyFromNethermindConfig: WEI = calculateGenesisSupplyFromNethermindConfig();

    if (!genesisSupplyFromNethermindConfig.eq(genesisSupplyFromOpenEthereumConfig)) {
        throw new Error(`Genesis supplies do not match between client configs`);
    }

    return genesisSupplyFromOpenEthereumConfig;
}

// TODO calculating the genesis supply from geth requires decoding an RLP-encoded list of (address, balance) tuples
// TODO the RLP-encoded gensis information can be found here: https://github.com/ethereum/go-ethereum/blob/48b484c5ac537d1759c9903ce81302c298f03a84/core/genesis_alloc.go
// function calculateGenesisSupplyFromGethConfig(): WEI {
//     return new BigNumber(0);
// }

function calculateGenesisSupplyFromOpenEthereumConfig(): WEI {
    // The open-ethereum-foundation.json file was taken from the Open Ethereum GitHub repository
    // The file can be found here: https://github.com/openethereum/openethereum/blob/master/ethcore/res/ethereum/foundation.json
    const configString: string = fs.readFileSync('./open-ethereum-foundation.json');
    const configJSON: OpenEthereumGenesisBlockDistribution = JSON.parse(configString).accounts;

    const weiValues: ReadonlyArray<WEI> = Object.values(configJSON).map((genesisBlockDistribution) => {
        return genesisBlockDistribution.balance === undefined ? new BigNumber(0) : new BigNumber(genesisBlockDistribution.balance, 16);
    });

    const weiSum: WEI = weiValues.reduce((sum: WEI, weiValue: WEI) => {
        return sum.plus(weiValue);
    }, new BigNumber(0));

    return weiSum;
}

function calculateGenesisSupplyFromNethermindConfig(): WEI {
    // The nethermind-foundation.json file was taken from the Nethermind GitHub repository
    // The file can be found here: https://github.com/NethermindEth/nethermind/blob/master/src/Nethermind/Chains/foundation.json
    const configString: string = fs.readFileSync('./nethermind-foundation.json');
    const configJSON: NethermindGenesisBlockDistribution = JSON.parse(configString).accounts;

    const weiValues: ReadonlyArray<WEI> = Object.values(configJSON).map((genesisBlockDistribution) => {
        return genesisBlockDistribution.balance === undefined ? new BigNumber(0) : new BigNumber(genesisBlockDistribution.balance, 16);
    });

    const weiSum: WEI = weiValues.reduce((sum: WEI, weiValue: WEI) => {
        return sum.plus(weiValue);
    }, new BigNumber(0));

    return weiSum;
}

// Geth block reward definitions: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L40
// Geth hard fork block number definitions: https://github.com/ethereum/go-ethereum/blob/master/params/config.go#L55
// Open Ethereum block reward definitions: https://github.com/openethereum/openethereum/blob/master/ethcore/block-reward/src/lib.rs??
// Open Ethereum hard fork block number definitions: https://github.com/openethereum/openethereum/blob/master/ethcore/block-reward/src/lib.rs??
// Nethermind block reward definitions:
// Nethermind hard fork block number definitions:
function getBlockReward(blockNumber: number): WEI {
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

async function calculateBlockRewardSupply(
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
    
        const partialSupply: WEI = calculateBlockReward(blocksWithUncleBlocks);
    
        blockRewardSupply = blockRewardSupply.plus(partialSupply);
    
        console.log(`total supply at block ${currentEndBlockNumber}: ${genesisSupply.plus(blockRewardSupply).dividedBy(10**18)} ETH`);
        console.log();
    }

    return blockRewardSupply;
}

async function fetchBlocksWithUncleBlocks(startBlockNumber: number, endBlockNumber: number): Promise<ReadonlyArray<BlockWithUncleBlocks>> {
    const blocks: ReadonlyArray<Block> = await fetchBlocks(startBlockNumber, endBlockNumber);
    const uncleBlocks: ReadonlyArray<UncleBlock> = await fetchUncleBlocks(blocks);
    const blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks> = combineBlocksWithUncleBlocks(blocks, uncleBlocks);

    return blocksWithUncleBlocks;
}

async function fetchBlocks(startBlockNumber: number, endBlockNumber: number): Promise<ReadonlyArray<Block>> {
    const requestBody = new Array(endBlockNumber - startBlockNumber + 1).fill(0).map((_, index) => {
        return {
            id: 1,
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [
                `0x${new Number(startBlockNumber + index).toString(16)}`,
                false
            ]
        };
    });

    const response = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const responseJSON = await response.json();

    const retrievedBlocks: ReadonlyArray<Block> = responseJSON.map((blockResult: Readonly<BlockResult>) => {
        return blockResult.result;
    });

    return retrievedBlocks;
}

async function fetchUncleBlocks(blocks: ReadonlyArray<Block>): Promise<ReadonlyArray<UncleBlock>> {

    const requestBody = blocks.map((block: Readonly<Block>) => {
        return [...block.uncles.map((uncleHash: string, index: number) => {
            return {
                id: 1,
                jsonrpc: '2.0',
                method: 'eth_getUncleByBlockNumberAndIndex',
                params: [
                    block.number,
                    `0x${new Number(index).toString(16)}`
                ]
            };
        })];
    }).flat(); // TODO add the TypeScript config to get rid of this error

    if (requestBody.length === 0) {
        return [];
    }

    const response = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const responseJSON = await response.json();

    const retrievedUncleBlocks: ReadonlyArray<UncleBlock> = responseJSON.map((uncleBlockResult: Readonly<UncleBlockResult>) => {
        return uncleBlockResult.result;
    });

    return retrievedUncleBlocks;
}

function combineBlocksWithUncleBlocks(
    blocks: ReadonlyArray<Block>,
    uncleBlocks: ReadonlyArray<UncleBlock>
): ReadonlyArray<BlockWithUncleBlocks> {
    const uncleBlocksMap: Readonly<UncleBlockMap> = createUncleBlockMap(uncleBlocks);
    const blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks> = blocks.map((block: Readonly<Block>) => {
        const blockWithUncleBlocks: Readonly<BlockWithUncleBlocks> = {
            ...block,
            uncles: block.uncles.map((uncleHash: HexString) => {
                return {
                    hash: uncleHash,
                    number: uncleBlocksMap[uncleHash]
                };
            })
        };
        return blockWithUncleBlocks;
    });

    return blocksWithUncleBlocks;
}

function createUncleBlockMap(uncleBlocks: ReadonlyArray<UncleBlock>): Readonly<UncleBlockMap> {
    return uncleBlocks.reduce((uncleBlockMap: Readonly<UncleBlockMap>, uncleBlock: Readonly<UncleBlock>) => {
        return {
            ...uncleBlockMap,
            [uncleBlock.hash]: uncleBlock.number
        };
    }, {});
}

async function getLatestBlockNumber(): Promise<number> {
    const result = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'eth_blockNumber'
        })
    });

    const resultJSON = await result.json();

    return parseInt(resultJSON.result);
}

function calculateBlockReward(blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks>): WEI {
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
    const baseBlockReward: WEI = getBlockReward(blockNumber);
    const blockRewardForUncles: WEI = baseBlockReward.multipliedBy(blockWithUncleBlocks.uncles.length).dividedBy(32);
    const uncleBlockRewards: WEI = blockWithUncleBlocks.uncles.reduce((result: WEI, uncleBlock: Readonly<UncleBlock>) => {
        const uncleBlockNumber: number = parseInt(uncleBlock.number, 16);
        return result.plus(baseBlockReward.multipliedBy(new BigNumber(uncleBlockNumber).plus(8).minus(blockNumber)).dividedBy(8));
    }, new BigNumber(0));
    
    return baseBlockReward.plus(blockRewardForUncles).plus(uncleBlockRewards);
}