import { BigNumber } from 'bignumber.js';
import * as fs from 'fs';
import {
    WEI,
    OpenEthereumGenesisBlockDistribution,
    NethermindGenesisBlockDistribution
} from './types';

/**
 * Calculates the genesis issuance of WEI from the configuration files of multiple Ethereum clients.
 * If the calculated genesis issuances of each Ethereum client match, then the calculated issuance is returned.
 * If the calculated genesis issuances of each Ethereum client do not match, then an error is thrown.
 * Currently, Open Ethereum's and Nethermind's genesis configuration files are being used.
 * Geth can be added as well, but the format (RLP) is more difficult to parse than Open Ethereum's and Nethermind's JSON files (so I haven't got to it yet).
 * The configuration files contain all of the initial accounts and balances included at the genesis block.
 * The genesis block did not have transactions, and no mining reward was given, thus each client must hard-code these values to independently generate the initial balances.
 */
export function calculateGenesisIssuance(): WEI {
    // const genesisIssuanceFromGethConfig: WEI = calculateGenesisIssuanceFromGethConfig();
    const genesisIssuanceFromOpenEthereumConfig: WEI = calculateGenesisIssuanceFromOpenEthereumConfig();
    const genesisIssuanceFromNethermindConfig: WEI = calculateGenesisIssuanceFromNethermindConfig();

    if (!genesisIssuanceFromNethermindConfig.eq(genesisIssuanceFromOpenEthereumConfig)) {
        throw new Error(`Genesis supplies do not match between client configs`);
    }

    return genesisIssuanceFromOpenEthereumConfig;
}

// TODO calculating the genesis issuance from geth requires decoding an RLP-encoded list of (address, balance) tuples
// TODO the RLP-encoded gensis information can be found here: https://github.com/ethereum/go-ethereum/blob/48b484c5ac537d1759c9903ce81302c298f03a84/core/genesis_alloc.go
// function calculateGenesisIssuanceFromGethConfig(): WEI {
//     return new BigNumber(0);
// }

/**
 * Calculates the genesis issuance of WEI from Open Ethereum's configuration file.
 * The configuration file is statically included in this repository, but was taken from here: https://github.com/openethereum/openethereum/blob/master/ethcore/res/ethereum/foundation.json
 */
function calculateGenesisIssuanceFromOpenEthereumConfig(): WEI {
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

/**
 * Calculates the genesis issuance of WEI from Nethermind's configuration file.
 * The configuration file is statically included in this repository, but was taken from here: https://github.com/NethermindEth/nethermind/blob/master/src/Nethermind/Chains/foundation.json
 */
function calculateGenesisIssuanceFromNethermindConfig(): WEI {
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