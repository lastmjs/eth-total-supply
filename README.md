THIS README IS OUT OF DATE. DON'T ASSUME ALL OF WHAT IT SAYS IS ACCURATE. PROJECT METHODOLOGY HAS CHANGED RECENTLY

# ETH Total Supply

The total supply as of August 7 2020: 

I recently found myself caught up in a (hopefully friendly) skirmish with Bitcoiners (https://twitter.com/lastmjs/status/1291741769932005381?s=20). They are very concerned about being able to calculate the total supply of ETH. I think this is important as well, though we probably disagree on the absolute vital nature of knowing the total supply perfectly. Nonetheless, this repo is an attempt at calculating the supply of ETH as accurately as feasible.

## Methodology

* I will be using Ethers.js as a convenience library to accessing Ethereum clients. I will be using Infura and Etherscan. If you want to run your own full node to independently verify the results, you can.
* The script must be able to run against any ethereum node...no going to as STL'd SQL database or The Graph or some other indexing service that already exists
* Get genesis ETH distribution
  * I might have to manually copy in multiple of these configs...can I hash to verify it?
  * Figure out verification here better
* Ignore the genesis block's block reward (block 0 reward went to nobody I believe)
* Download all block information (include the block reward)
* Download all uncle block information (include the block reward)
* Sum up the block rewards of all blocks retrieved
* Add the block rewards to the genesis ETH distribution
* Account for irregular state changes
* Manually input the block reward for blocks and uncles

## Running this code

* Put in all instructions...detail exact instructions on Linux, and general instructions for all other operating systems
* You need Node.js installed on your system
* Clone the repo
* cd into the repo
* npm install
* npm start

## What now?

Well, this repo is open source and freely available on the internet. Anyone who claims to care about the total supply of ETH can independently verify the validity of the code, and execute the scripts themselves against an Ethereum node of their choice.

I do think it would be useful for this functionality to be built into the main Ethereum clients...I will search through the issues and perhaps open some of my own to get the opinions of the client developers. If this functionality is incorporate into Ethereum clients, it will be one less argument against the Ethereum blockchain, and will provide important information about the total supply of ETH to many more people.

Consider opening an EIP to make this an important issue in the Ethereum community.

## Comparisons with other scripts

Pull requests are welcome for other scripts, clients, and sync types.

Block Number | Ethereum Client | My Script | https://github.com/madumas/ethsupply | https://github.com/CurrencyTycoon/mysupplyaudit
0 | Geth | 72009990.49948 | 72009990.5 |
1000000 | Geth (fast sync) | 77311912.99948 | 77311913 |
2000000 | Geth (fast sync) | 82594620.18698 | 82594620.1875 |
3000000 | Geth (fast sync) | 87918591.90573 | 87918591.90625
4000000 | Geth (fast sync) | 93163545.49948 | 93163545.5
5000000 | Geth (fast sync) | 97303827.65573 | 97303829.65625
6000000 | Geth (fast sync) |
7000000 | Geth (fast sync) |
8000000 | Geth (fast sync) |
9000000 | Geth (fast sync) |
10000000 | Geth (fast sync) |
Do one from August | |