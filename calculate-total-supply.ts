// TODO another way to verify the supply would be to walk all accounts and add up their balances
// TODO one caveat to this is selfdestructed contracts who send the balances to themselves...would have to account for that somehow

// TODO make sure everything is perfectly declarative
// TODO I think I should keep this all in one file so that it is extremely simple
// TODO add really good comments to all functions and maybe variables...really comment this thing up
// TODO get rid of all typescript errors

// TODO check my work here: https://github.com/madumas/ethsupply
// TODO check against etherscan and various others

// TODO the genesis data is here for geth: https://github.com/ethereum/go-ethereum/blob/48b484c5ac537d1759c9903ce81302c298f03a84/core/genesis_alloc.go
// TODO the genesis data is here for openethereum: https://raw.githubusercontent.com/openethereum/openethereum/master/ethcore/res/ethereum/foundation.json
// TODO the genesis data for Nethermind: https://raw.githubusercontent.com/NethermindEth/nethermind/master/src/Nethermind/Chains/foundation.json
// TODO it would be great to find out parity's information as well

// TODO more work checking by Nethermind: https://github.com/NethermindEth/nethermind/pull/2193/files
// TODO https://docs.nethermind.io/nethermind/guides-and-helpers/custom-analytic-tools

import * as fetch from 'node-fetch';
import * as fs from 'fs';
import { BigNumber } from 'bignumber.js';

type WEI = BigNumber;
type ETH = BigNumber;

type GenesisBlockDistribution = {
    [ethAddress: string]: {
        wei: string;
    };
};

type NethermindGenesisBlockDistribution = {
    [ethAddress: string]: {
        balance?: string;
    };
};

type OpenEthereumGenesisBlockDistribution = {
    [ethAddress: string]: {
        balance?: string;
    };
};

(async () => {
    const genesisSupply: WEI = calculateGenesisSupply();

    console.log('genesisSupply', genesisSupply.toString());

    const genesisSupplyInETH: ETH = genesisSupply.dividedBy(10**18);

    console.log('genesisSupplyInETH', genesisSupplyInETH.toString());

    // // const latestBlockNumber: number = await getLatestBlockNumber();
    const latestBlockNumber: number = 1778436;

    console.log('latestBlockNumber', latestBlockNumber);

    // const blockRewardSupply: WEI = calculateBlockRewardSupply(latestBlockNumber);

    // console.log('blockRewardSupply', blockRewardSupply.toString());

    // const blockRewardSupplyInETH: ETH = blockRewardSupply.dividedBy(10**18);

    // console.log('blockRewardSupplyInETH', blockRewardSupplyInETH.toString());

    // const uncleRewardSupply: WEI = await calculateUncleRewardSupply(latestBlockNumber);

    // console.log('uncleRewardSupply', uncleRewardSupply.toString());

    // const uncleRewardSupplyInETH: ETH = uncleRewardSupply.dividedBy(10**18);

    // console.log('uncleRewardSupplyInETH', uncleRewardSupplyInETH.toString());

    // const totalSupply: WEI = genesisSupply.plus(blockRewardSupply).plus(uncleRewardSupply);

    // console.log('totalSupply', totalSupply.toString());

    // const totalSupplyInETH: ETH = (genesisSupply.plus(blockRewardSupply).plus(uncleRewardSupply)).dividedBy(10**18);

    // console.log('totalSupplyInETH', totalSupplyInETH.toString());
})();

// TODO add in the config information from parity-ethereum
function calculateGenesisSupply(): WEI {
    // const genesisSupplyFromGethConfig: WEI = calculateGenesisSupplyFromGethConfig();
    // const genesisSupplyFromParityConfig: WEI = calculateGenesisSupplyFromParityConfig();
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

// TODO Parity might be Open Ethereum now
function calculateGenesisSupplyFromParityConfig(): WEI {
    return new BigNumber(0);
}

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

// TODO we might need to get this information from the blockchain directly for ultimate assurance
function getBlockReward(blockNumber: number): WEI {
    if (
        blockNumber >= 0 &&
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

// TODO we might need to get this information from the blockchain directly for ultimate assurance
function getUncleReward(blockNumber: number): WEI {
    if (
        blockNumber >= 0 &&
        blockNumber < 4370000
    ) {
        return new BigNumber(4.375).times(10**18);
    }

    if (
        blockNumber >= 4370000 &&
        blockNumber < 7280000
    ) {
        return new BigNumber(2.625).times(10**18);
    }

    return new BigNumber(1.75).times(10**18);
}

// TODO figure out how to pageinate the uncle thing here
async function getNumUnclesForBlocks(
    startBlockNumber: number,
    endBlockNumber: number,
    currentBlockNumber: number = 0,
    skip: number = 10000
): Promise<Array<number>> {

    // const startIndex =

    const body = new Array(endBlockNumber - startBlockNumber).fill(0).map((_, index) => {
        return {
            id: 1,
            jsonrpc: '2.0',
            method: 'eth_getUncleCountByBlockNumber',
            params: [
                `0x${new Number(startBlockNumber + index).toString(16)}`
            ]
        };
    });

    const result = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const resultJSON = await result.json();

    console.log(resultJSON);

    return resultJSON.map((result: any) => {
        return parseInt(resultJSON.result);
    });
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

function calculateBlockRewardSupply(latestBlockNumber: number): WEI {
    const blockRewardSupplyFrom0To4369999: WEI = new BigNumber(4370000).times(getBlockReward(0));
    const blockRewardSupplyFrom437000To7280000: WEI = new BigNumber(2910000).times(getBlockReward(4370000));
    const blockRewardSupplyRemaining: WEI = new BigNumber(latestBlockNumber - 7280000).times(getBlockReward(7280000));

    return blockRewardSupplyFrom0To4369999.plus(blockRewardSupplyFrom437000To7280000).plus(blockRewardSupplyRemaining);
}

// TODO I think the uncle reward calculations might be more complicated than I thought
async function calculateUncleRewardSupply(latestBlockNumber: number): Promise<WEI> {
    const numUnclesForBlocks: Array<number> = await getNumUnclesForBlocks(1, latestBlockNumber);
    return numUnclesForBlocks.reduce((sum: WEI, numUncles: number, index: number) => {
        return sum.plus(getUncleReward(index).times(numUncles));
    }, new BigNumber(0));
}