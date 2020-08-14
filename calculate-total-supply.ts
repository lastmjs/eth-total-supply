// similar scripts:
// https://github.com/madumas/ethsupply
// https://github.com/CurrencyTycoon/mysupplyaudit TODO I think I might need to use the latest version of go...seems my dependencies keep failing
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

// TODO allow overriding the jsonrpc endpoint

// TODO change all wording to issued, issuance, to indicate that this is a calculation of the issued supply according to the rules of the protocol
// TODO the actual total supply will have to be calculated by walking account balances
// TODO theoretically, if done correctly, walking the account balances should match the calculated supply issuance

// TODO add persistent cache for batches...this thing takes forever to run

import {
    WEI,
    ETH
} from './types.d';
import { calculateGenesisSupply } from './calculate-genesis-supply';
import { calculateBlockRewardSupply } from './calculate-block-reward-supply';
import { getLatestBlockNumber } from './fetch-blocks';

(async () => {
    const genesisSupply: WEI = calculateGenesisSupply();

    console.log('genesis supply in WEI:', genesisSupply.toFixed());

    const genesisSupplyInETH: ETH = genesisSupply.dividedBy(10**18);

    console.log('genesis supply in ETH:', genesisSupplyInETH.toString());
    console.log();

    // // const latestBlockNumber: number = await getLatestBlockNumber();
    // const latestBlockNumber: number = 5000000;
    const latestBlockNumber: number = 6912; // should be 72049306.59375 or 72049306.59323
    // const latestBlockNumber: number = 10619692; // should be 112095482.21875
    // const latestBlockNumber: number = 1000000;

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