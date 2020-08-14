import { BigNumber } from 'bignumber.js';
import * as fs from 'fs';
import {
    WEI,
    OpenEthereumGenesisBlockDistribution,
    NethermindGenesisBlockDistribution
} from './types.d';

export function calculateGenesisSupply(): WEI {
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
    const configString: string = fs.readFileSync('./open-ethereum-foundation.json').toString();
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
    const configString: string = fs.readFileSync('./nethermind-foundation.json').toString();
    const configJSON: NethermindGenesisBlockDistribution = JSON.parse(configString).accounts;

    const weiValues: ReadonlyArray<WEI> = Object.values(configJSON).map((genesisBlockDistribution) => {
        return genesisBlockDistribution.balance === undefined ? new BigNumber(0) : new BigNumber(genesisBlockDistribution.balance, 16);
    });

    const weiSum: WEI = weiValues.reduce((sum: WEI, weiValue: WEI) => {
        return sum.plus(weiValue);
    }, new BigNumber(0));

    return weiSum;
}