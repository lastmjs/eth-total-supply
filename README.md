# ETH Total Supply

ETH issued as of block 10600000 (August 5th 2020):
ETH in account balances as of block 10600000 (August 5th 2020):

I recently found myself caught up in a (hopefully friendly) skirmish with Bitcoiners (https://twitter.com/lastmjs/status/1291741769932005381?s=20). They are very concerned about being able to calculate the total supply of ETH. I think this is important as well, though we probably disagree on the absolute vital nature of knowing the total supply perfectly. Nonetheless, this repo is an attempt at calculating the supply of ETH as accurately as possible.

## Running the code

* Install Node.js
* [Sync up an Ethereum client](#syncing-an-ethereum-client)
* git clone https://github.com/lastmjs/eth-total-supply.git
* cd eth-total-supply
* npm install
* npm start
* The script will then prompt you for a block number. It will calculate the total ETH issued up to and including that block.

The default JSON-RPC endpoint is `http://localhost:8545`. If you need to change it, use the `JSON_RPC_ENDPOINT` environment variable. `npm start` then becomes `JSON_RPC_ENDPOINT=http://localhost:8545`, replacing `http://localhost:8545` with the origin of your JSON-RPC endpoint.

## Methodology

There seem to be two main methods for calculating the total supply of ETH. The first is by calculating the total issuance according to the issuance algorithm. The second is by summing Ethereum account balances, including accounting for destroyed ETH. The code in this repository is currently focused on calculating total issued ETH. It may evolve to sum account balances as well, but currently it does not. There are other resources listed in this repository that can help you to sum account balances.

### Total ETH Issued

ETH issuance is specified in the Ethereum Yellow Paper, and is implemented in Ethereum clients. At each block, ETH is not issued to miners through transactions. The account balances of each miner who deserves a block reward are updated directly by the client implementations.
ETH issuance is well-documented in multiple locations. The block reward calculations can be independently verified in multiple locations:

* Ethereum Yellow Paper:
* This repository: https://github.com/lastmjs/eth-total-supply/blob/master/calculate-block-reward-supply.ts#L67
* Geth: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L621
* Open Ethereum: https://github.com/openethereum/openethereum/blob/master/ethcore/engines/ethash/src/lib.rs#L248
* Nethermind: https://github.com/NethermindEth/nethermind/blob/f5c249445452177873372f905ab65ba366a29713/src/Nethermind/Nethermind.Blockchain/Rewards/RewardCalculator.cs#L43

ETH issuance works as follows:

For each block, a base reward is applied. This reward varies based on hard forks. The base rewards are as follows:

From blocks 0-4369999: 5 ETH
From blocks 4370000-727999: 3 ETH
From blocks 7280000-present: 2 ETH

The above rewards can be verified by looking at the client implementations:

* Geth block reward definitions: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L40
* Geth hard fork block number definitions: https://github.com/ethereum/go-ethereum/blob/master/params/config.go#L55
* Open Ethereum block reward and hard fork block number definitions: https://github.com/openethereum/openethereum/blob/master/ethcore/res/ethereum/foundation.json, look at engine.Ethash.params.blockReward
* Nethermind block reward and hard fork block number definitions: https://github.com/NethermindEth/nethermind/blob/master/src/Nethermind/Chains/foundation.json, look at engine.Ethash.params.blockReward

Once the base block reward is determined, a reward for including uncle blocks is calculated. This reward is requal to the base block reward multiplied by the number of uncles included in the block, and divided by 32. Essentially there is a 1/32 of the block reward included for each uncle.

TODO put in simple math algorithm.

In addition to the reward for including uncles, there is a reward given to each uncle block. This reward is the base block reward multiplied by the uncle block number plus 8 minues the block number, all of that divided by 8.

TODO put in simple math algorithm.

This is the entirety of the block rewards algorithm.

By walking through each block with each block's uncle blocks, the totality of ETH issued can be calculated. Assuming the Ethereum clients have implemented the algorithms correctly from the beginning, and there are no other major bugs in ETH account balances and transfers, the total ETH in existence should not exceed this number. Each Ethereum client implementation, as far as I know, is open source, and thus the code can be manually reviewed by interested parties.

#### Known ETH Issuance Calculators

* https://github.com/lastmjs/eth-total-supply
* https://github.com/madumas/ethsupply
* https://github.com/CurrencyTycoon/mysupplyaudit

### Total ETH Account Balances

Another way to find the total supply of ETH is to look at the account balances at a given block, and sum up those account balances. In theory this should be even more accurate than the issuance, since it will account for potentially unknown bugs in issuance. This library does not perform this calculation, but the following resources do:

#### Known ETH Account Balance Calculators

* https://github.com/NethermindEth/nethermind/blob/3e81fb7a05de1b7122d0ca1aff6b57dbb88c3841/src/Nethermind/Nethermind.Blockchain/Visitors/RewardsVerifier.cs
* https://twitter.com/mhswende/status/1292730179777974273?s=20
* https://github.com/ledgerwatch/turbo-geth/pull/926/files
* https://twitter.com/quickblocks/status/1294634704017264641?s=20
* `geth dump --iterative --nocode --nostorage --incompletes 0| jq ".balance" |  tr -d \" | paste -sd+ | bc`

## Reconciliation

If all scripts and Ethereum client implementations follow the same issuance and account balance rules, then all methods should have identical results. Let's see if our theories work in practice.

Please help fill out this table with pull requests (or contact me with your results @lastmjs on Twitter and Telegram).

| Block Number | Ethereum Client (sync type) | https://github.com/lastmjs/eth-total-supply | https://github.com/madumas/ethsupply | https://github.com/CurrencyTycoon/mysupplyaudit
| --- | --- | --- | --- | --- |
| 0 | Geth (fast sync) | 72009990.49948 | 72009990.5 |
| 1000000 | Geth (fast sync) | 77311912.99948 | 77311913 |
| 2000000 | Geth (fast sync) | 82594620.18698 | 82594620.1875 |
| 3000000 | Geth (fast sync) | 87918591.90573 | 87918591.90625 |
| 4000000 | Geth (fast sync) | 93163545.49948 | 93163545.5 |
| 5000000 | Geth (fast sync) | 97303827.65573 | 97303829.65625 |
| 6000000 | Geth (fast sync) |
| 7000000 | Geth (fast sync) |
| 8000000 | Geth (fast sync) |
| 9000000 | Geth (fast sync) |
| 10000000 | Geth (fast sync) |
| 10600000 (August 5th 2020) |

## All Known Supply Verification Scripts

* (Issuance) https://github.com/lastmjs/eth-total-supply
* (Issuance) https://github.com/madumas/ethsupply
* (Issuance) https://github.com/CurrencyTycoon/mysupplyaudit
* (Account balances) https://github.com/NethermindEth/nethermind/blob/3e81fb7a05de1b7122d0ca1aff6b57dbb88c3841/src/Nethermind/Nethermind.Blockchain/Visitors/RewardsVerifier.cs
* (Account balances) https://twitter.com/mhswende/status/1292730179777974273?s=20
* (Account balances) https://github.com/ledgerwatch/turbo-geth/pull/926/files
* (Account balances) https://twitter.com/quickblocks/status/1294634704017264641?s=20
* (Account balances) `geth dump --iterative --nocode --nostorage --incompletes 0| jq ".balance" |  tr -d \" | paste -sd+ | bc`

## Syncing an Ethereum Client

If you have never run an Ethereum client, this repository can help you. Follow these steps:

* Install Docker: https://docs.docker.com/install/linux/docker-ce/ubuntu/
* Clone and navigate to this repository with the following two commands:
* git clone https://github.com/lastmjs/eth-total-supply.git
* cd eth-total-supply
* npm run geth-docker-pull
* npm run geth-main-fast-sync
* A rough estimate of how long it will take is in the 10s of hours