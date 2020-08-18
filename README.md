# ETH Total Supply

* Total ETH issued as of block 10600000 (August 5th 2020):
* Total ETH in account balances as of block 10600000 (August 5th 2020):

The purpose of this repository is to prove beyond reasonable doubt what the total supply of ETH is on Earth.

## Some Background

I recently found myself caught up in a (hopefully friendly) skirmish with Bitcoiners (https://twitter.com/lastmjs/status/1291741769932005381?s=20). They are very concerned about being able to calculate the total supply of ETH. I think this is important as well, though we probably disagree on the absolute vital nature of knowing the total supply perfectly. Nonetheless, this repo is an attempt at calculating the supply of ETH as accurately as possible.

## Running the Code

* Install Node.js: https://github.com/nvm-sh/nvm
* [Sync up an Ethereum client](#syncing-an-ethereum-client)
* git clone https://github.com/lastmjs/eth-total-supply.git
* cd eth-total-supply
* npm install
* npm start
* The script will then prompt you for a block number. It will calculate the total ETH issued up to and including that block.

The default JSON-RPC endpoint is `http://localhost:8545`. If you need to change it, use the `JSON_RPC_ENDPOINT` environment variable. `npm start` then becomes `JSON_RPC_ENDPOINT=http://localhost:8545 npm start`, replacing `http://localhost:8545` with the origin of your JSON-RPC endpoint.

## Methodology

There seem to be three main methods for calculating the total supply of ETH. The first is by calculating the total issuance according to the issuance algorithm. The second is by summing Ethereum account balances, including accounting for destroyed ETH. A third method (as in TrueBlock) is to query an Ethereum archive node for each miner's account balance prior to the block, add in the minerRewards and uncleRewards calculated at that block, and then querying the balance of each miner at the end of the block reconciling the balances.

The code in this repository is currently focused on calculating total issued ETH. It may evolve to sum account balances as well, but currently it does not. There are other resources listed in this repository that can help you to sum account balances.

### Total ETH Issued

ETH issuance is specified in the Ethereum Yellow Paper, and is implemented in Ethereum clients. At each block, ETH is not issued to miners through transactions. The account balances of each miner who deserves a block reward are updated directly by the client implementations.
ETH issuance is well-documented in multiple locations, and the block reward calculations can be independently verified:

* Ethereum Yellow Paper: https://ethereum.github.io/yellowpaper/paper.pdf 11.3. Reward Application.
* Geth: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L621
* Open Ethereum: https://github.com/openethereum/openethereum/blob/master/ethcore/engines/ethash/src/lib.rs#L248
* Nethermind: https://github.com/NethermindEth/nethermind/blob/f5c249445452177873372f905ab65ba366a29713/src/Nethermind/Nethermind.Blockchain/Rewards/RewardCalculator.cs#L43

ETH issuance works as follows:

For each block, a base reward is applied. This reward varies based on hard forks. The base rewards are as follows:

* From blocks 0-4369999: 5 ETH
* From blocks 4370000-7279999: 3 ETH
* From blocks 7280000-present: 2 ETH

The above rewards can be verified by looking at the client implementations:

* Geth block reward definitions: https://github.com/ethereum/go-ethereum/blob/master/consensus/ethash/consensus.go#L40
* Geth hard fork block number definitions: https://github.com/ethereum/go-ethereum/blob/master/params/config.go#L55
* Open Ethereum block reward and hard fork block number definitions: https://github.com/openethereum/openethereum/blob/master/ethcore/res/ethereum/foundation.json, look at engine.Ethash.params.blockReward
* Nethermind block reward and hard fork block number definitions: https://github.com/NethermindEth/nethermind/blob/master/src/Nethermind/Chains/foundation.json, look at engine.Ethash.params.blockReward

```
baseBlockReward = 5 ETH, 3 ETH, or 2 ETH depending on block number
```

Once the base block reward is determined, a reward for including uncle blocks is calculated. This reward is equal to the base block reward multiplied by the number of uncles included in the block, and divided by 32. Essentially there is a 1/32nd of the block reward included for each uncle.

```
blockRewardForUncles = baseBlockReward * numUncles / 32
```

In addition to the reward for including uncles, there is a reward given to each uncle block. This reward is the base block reward multiplied by the uncle block number plus 8 minus the block number, all of that divided by 8.

```
For each uncle block:
   uncleBlockReward = (baseBlockReward * (uncleBlockNumber + 8 - blockNumber)) / 8
```

Summing up the base block reward, the block reward for uncle blocks, and the uncle block rewards gives you the total ETH rewards for that block.

By walking through each block with each block's uncle blocks, the totality of ETH issued can be calculated. Assuming the Ethereum clients have implemented the algorithms correctly from the beginning, and there are no other confounding bugs, the total ETH in existence should not exceed this number. Most major Ethereum client implementations, as far as I know, are open source, and thus the code can be manually reviewed by interested parties.

You can verify that the algorithm used in this repository is correct by using the above information and looking over the code here: https://github.com/lastmjs/eth-total-supply/blob/master/calculate-block-reward-issuance.ts#L67

#### Known Open Source ETH Issuance Calculators

* https://github.com/lastmjs/eth-total-supply
* https://github.com/madumas/ethsupply
* https://github.com/CurrencyTycoon/mysupplyaudit
* https://github.com/Great-Hill-Corporation/trueblocks-core/tree/develop/src/other/issuance

### Total ETH Account Balances

Another way to find the total supply of ETH is to look at the account balances at a given block, and sum up those account balances. In theory this should be even more accurate than the issuance, since it will account for destroyed ETH and potentially unknown bugs in issuance. This library does not perform this calculation, but the following resources may do so:

#### Known Open Source ETH Account Balance Calculators

* Geth
  * `geth dump --iterative --nocode --nostorage --incompletes 0| jq ".balance" |  tr -d \" | paste -sd+ | bc`
  * Source is this Tweet: https://twitter.com/mhswende/status/1292730179777974273?s=20
* Turbo-Geth
  * https://github.com/ledgerwatch/turbo-geth/pull/926/files
  * More information: https://twitter.com/quickblocks/status/1294634704017264641?s=20
* Nethermind
  * https://github.com/NethermindEth/nethermind/blob/3e81fb7a05de1b7122d0ca1aff6b57dbb88c3841/src/Nethermind/Nethermind.Blockchain/Visitors/RewardsVerifier.cs

## Reconciliation

If all scripts and Ethereum client implementations follow the same issuance and account balance rules, then all methods should have identical results. Let's see if our theories work in practice.

Please help fill out these tables with pull requests (or contact me with your results @lastmjs on Twitter and Telegram).

### Total ETH Issued

| Block Number | Ethereum Client (sync type) | [eth-total-supply](https://github.com/lastmjs/eth-total-supply) | [ethsupply](https://github.com/madumas/ethsupply) | [TrueBlocks<br/>(fix pending)](https://github.com/Great-Hill-Corporation/trueblocks-core/tree/develop/src/other/issuance) | [Google Bigquery Public ETH dataset](https://gist.github.com/jo-tud/5078ee865ad212e80dac3aa37523a6ec) | [CurrencyTycoom](https://github.com/CurrencyTycoon/mysupplyaudit) |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Geth (fast sync) | 72009990.49948 | 72009990.49948 | 72009990.49948 | 72009990499480000000000000 |
| 1000000 | Geth (fast sync) | 77311912.99948 | 77311912.99948 | 77311905.18698 | 77311912999480000000000000 |
| 2000000 | Geth (fast sync) | 82594620.18698 | 82594620.18698 | 82594612.37448 | 82594620184980000000000000 |
| 3000000 | Geth (fast sync) | 87918591.90573 | 87918591.90573 | 87918584.09323 | 87918591903729999999999997 |
| 4000000 | Geth (fast sync) | 93163545.49948 | 93163545.49948 | 93163537.68698 | 93163545497479999999999997 |
| 5000000 | Geth (fast sync) | 97303827.65573 | 97303827.65573 | 97303819.84323 | 97303827553729999999999997 |
| 6000000 | Geth (fast sync) |                | 100813970.71823 | 100813962.90573 | 100813970487171071999999954 |
| 7000000 | Geth (fast sync) |                | 104160558.46823 | 104160550.65573 | 104160558230204627920942204 |
| 8000000 | Geth (fast sync) |                | 106578031.28073 | 106578023.46823 | 106578030929497390795594961 |
| 9000000 | Geth (fast sync) |                | 108691156.40573 | 108691148.59323 | 108691155838851536895834904 |
| 9193265 (the last block in 2019 UTC) | Geth (fast sync) | | 109094014.21823 | | 109094013651351536895834904 |
| 10000000 | Geth (fast sync) | | | 110787755.7807300 | 110787763026351536895834903 |

### Total ETH Account Balances

| Block Number | Ethereum Client (sync type) |
| --- | --- |
| 0 |
| 1000000 |
| 2000000 |
| 3000000 |
| 4000000 |
| 5000000 |
| 6000000 |
| 7000000 |
| 8000000 |
| 9000000 |
| 9193265 (the last block in 2019 UTC) |

## Syncing an Ethereum Client

If you have never run an Ethereum client, this repository can help you. Follow these steps:

* Install Node.js: https://github.com/nvm-sh/nvm
* Install Docker: https://docs.docker.com/install/linux/docker-ce/ubuntu/
* Clone and navigate to this repository with the following two commands:
* git clone https://github.com/lastmjs/eth-total-supply.git
* cd eth-total-supply
* npm run geth-docker-pull
* npm run geth-main-fast-sync
* A rough estimate of how long it will take is in the 10s of hours
