// TODO go through the block reward code in Geth, Open Ethereum, and Nethermind. Ensure everything looks correct

// similar scripts:
// https://github.com/madumas/ethsupply
// https://github.com/CurrencyTycoon/mysupplyaudit TODO I think I might need to use the latest version of go...seems my dependencies keep failing
// https://github.com/NethermindEth/nethermind/pull/2193/files
// https://docs.nethermind.io/nethermind/guides-and-helpers/custom-analytic-tools

// TODO another way to verify the supply would be to walk all accounts and add up their balances
// TODO one caveat to this is selfdestructed contracts who send the balances to themselves...would have to account for that somehow

// TODO add really good comments to all functions and maybe variables...really comment this thing up
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

// TODO here is the Nethermind rewards verifier: https://github.com/NethermindEth/nethermind/blob/3e81fb7a05de1b7122d0ca1aff6b57dbb88c3841/src/Nethermind/Nethermind.Blockchain/Visitors/RewardsVerifier.cs

import {
    WEI,
    ETH
} from './types.d';
import { calculateGenesisSupply } from './calculate-genesis-supply';
import { calculateBlockRewardSupply } from './calculate-block-reward-supply';
import { getLatestBlockNumber } from './fetch-blocks';

(async () => {
    const genesisSupply: WEI = calculateGenesisSupply();
    const genesisSupplyInETH: ETH = genesisSupply.dividedBy(10**18);
    
    const latestBlockNumber: number = 6912; // should be 72049306.59375 or 72049306.59323
    // const latestBlockNumber: number = await getLatestBlockNumber();
    const blockRewardSupply: WEI = await calculateBlockRewardSupply(0, latestBlockNumber, genesisSupply);
    const blockRewardSupplyInETH: ETH = blockRewardSupply.dividedBy(10**18);
    
    const totalSupply: WEI = genesisSupply.plus(blockRewardSupply);
    const totalSupplyInETH: ETH = (genesisSupply.plus(blockRewardSupply)).dividedBy(10**18);

    console.log('genesis supply in WEI:', genesisSupply.toFixed());
    console.log('genesis supply in ETH:', genesisSupplyInETH.toString());
    console.log();

    console.log('latest block number:', latestBlockNumber);
    console.log();

    console.log('block reward supply in WEI:', blockRewardSupply.toFixed());
    console.log('block reward supply in ETH:', blockRewardSupplyInETH.toString());
    console.log();

    console.log(`total supply in WEI at block ${latestBlockNumber}:`, totalSupply.toFixed());
    console.log(`total supply in ETH at block ${latestBlockNumber}:`, totalSupplyInETH.toString());
})();