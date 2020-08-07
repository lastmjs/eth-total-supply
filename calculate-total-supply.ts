import * as fetch from 'node-fetch';
import * as fs from 'fs';
import { BigNumber } from 'bignumber.js';

type WEI = BigNumber;
type ETH = BigNumber;

type GenesisBlockDistribution = {
    [ethAddress: string]: {
        wei: string;
    };
}

(async () => {
    // const provider: Readonly<ethers.providers.BaseProvider> = ethers.getDefaultProvider('homestead');

    // const block = await provider.getBlockWithTransactions(0);

    // console.log(block);

    // const provider: Readonly<ethers.providers.JsonRpcProvider> = new ethers.providers.JsonRpcProvider('http://localhost:8545');

    // const result = await provider.send('eth_getBlockByNumber', [0, true]);

    // console.log('result', result);

    // const result = await fetch('http://localhost:8545', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         id: 1,
    //         jsonrpc: '2.0',
    //         method: 'eth_getBlockByNumber',
    //         params: [
    //             `0x${new Number(0).toString(16)}`,
    //             true
    //         ]
    //     })
    // });

    // const resultJSON = await result.json();

    // console.log('resultJSON', resultJSON);

    const genesisSupply: WEI = await calculateGenesisSupply();

    const genesisSupplyInETH: ETH = genesisSupply.dividedBy(10**18);

    console.log(genesisSupplyInETH.toString());
})();

async function calculateGenesisSupply(): Promise<WEI> {
    // await getGenesisBlock();
    const genesisSupplyFromConfig: WEI = calculateGenesisSupplyFromConfig();

    console.log(genesisSupplyFromConfig);

    return genesisSupplyFromConfig;
}

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