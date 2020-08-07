// TODO make sure everything is perfectly declarative
// TODO I think I should keep this all in one file so that it is extremely simple
// TODO add really good comments to all functions and maybe variables...really comment this thing up
// TODO get rid of all typescript errors

import * as fetch from 'node-fetch';
import * as fs from 'fs';
import { BigNumber } from 'bignumber.js';

const genesisSupplyToFoundation: WEI = new BigNumber('11901484239480000000000000');

type WEI = BigNumber;
type ETH = BigNumber;

type GenesisBlockDistribution = {
    [ethAddress: string]: {
        wei: string;
    };
};

(async () => {
    const genesisSupply: WEI = calculateGenesisSupply();

    console.log('genesisSupply', genesisSupply.toString());

    const genesisSupplyInETH: ETH = genesisSupply.dividedBy(10**18);

    console.log('genesisSupplyInETH', genesisSupplyInETH.toString());

    const latestBlockNumber: number = await getLatestBlockNumber();

    console.log('latestBlockNumber', latestBlockNumber);

    const blockRewardSupply: WEI = calculateBlockRewardSupply(latestBlockNumber);

    console.log('blockRewardSupply', blockRewardSupply.toString());

    const blockRewardSupplyInETH: ETH = blockRewardSupply.dividedBy(10**18);

    console.log('blockRewardSupplyInETH', blockRewardSupplyInETH.toString());

    const uncleRewardSupply: WEI = await calculateUncleRewardSupply(latestBlockNumber);

    console.log('uncleRewardSupply', uncleRewardSupply.toString());

    const uncleRewardSupplyInETH: ETH = uncleRewardSupply.dividedBy(10**18);

    console.log('uncleRewardSupplyInETH', uncleRewardSupplyInETH.toString());

    const totalSupply: WEI = genesisSupply.plus(blockRewardSupply).plus(uncleRewardSupply);

    console.log('totalSupply', totalSupply.toString());

    const totalSupplyInETH: ETH = (genesisSupply.plus(blockRewardSupply).plus(uncleRewardSupply)).dividedBy(10**18);

    console.log('totalSupplyInETH', totalSupplyInETH.toString());
})();

function calculateGenesisSupply(): WEI {
    const genesisSupplyFromConfig: WEI = calculateGenesisSupplyFromConfig();
    return genesisSupplyFromConfig.plus(genesisSupplyToFoundation);
}

// TODO I took the genesis config from here...I'm not sure how to get the configs from the clients, for example
// I am not sure how geth is getting its genesis config
// TODO to get the seemingly accurate config, I had to go to this pull request https://github.com/ethereum/pyethsaletool/blob/cab1c9d8ca27f5e86a9eb36a2a56915f5f7830d1/genesis_block.json
function calculateGenesisSupplyFromConfig(): WEI {
    const genesisBlockString: string = fs.readFileSync('./genesis-block.json');
    const genesisBlockJSON: GenesisBlockDistribution = JSON.parse(genesisBlockString); 

    const weiValues: ReadonlyArray<WEI> = Object.values(genesisBlockJSON).map((temp) => {
        return new BigNumber(temp.wei);
    });

    console.log('weiValues.length', weiValues.length);

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

async function getNumUnclesForBlock(blockNumber: number) {
    const result = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'eth_getUncleCountByBlockNumber',
            params: [
                `0x${new Number(blockNumber).toString(16)}`
            ]
        })
    });

    const resultJSON = await result.json();

    return parseInt(resultJSON.result);
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

// TODO this part is what will take forever
// TODO see if there is an easy way to batch this information...ethereum etl might really help here. We might want to avoid that to keep things simple though
// TODO do we want to persist this information so that we don't have to start over every time?
async function calculateUncleRewardSupply(latestBlockNumber: number): Promise<WEI> {

    console.log('calculateUncleRewardSupply');

    let uncleRewardSupply: WEI = new BigNumber(0);

    for (let i=1; i <= latestBlockNumber; i++) {
        const blockNumber: number = i;

        console.log('blockNumber', blockNumber);

        const uncleReward = getUncleReward(blockNumber);
        const numUncles = await getNumUnclesForBlock(blockNumber);

        console.log('uncleReward', uncleReward);
        console.log('numUncles', numUncles);

        uncleRewardSupply = uncleRewardSupply.plus(uncleReward.times(numUncles));

        console.log('uncleRewardSupply', uncleRewardSupply);
        console.log();
    }

    return uncleRewardSupply;
}