import {
    Block,
    BlockWithUncleBlocks,
    UncleBlock,
    UncleBlockMap,
    HexString,
    UncleBlockResult,
    BlockResult,
    JSONRPCBatchRequestBody
} from './types.d';
import fetch, { Response } from 'node-fetch';

export async function fetchBlocksWithUncleBlocks(startBlockNumber: number, endBlockNumber: number): Promise<ReadonlyArray<BlockWithUncleBlocks>> {
    const blocks: ReadonlyArray<Block> = await fetchBlocks(startBlockNumber, endBlockNumber);
    const uncleBlocks: ReadonlyArray<UncleBlock> = await fetchUncleBlocks(blocks);
    const blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks> = combineBlocksWithUncleBlocks(blocks, uncleBlocks);

    return blocksWithUncleBlocks;
}

async function fetchBlocks(startBlockNumber: number, endBlockNumber: number): Promise<ReadonlyArray<Block>> {
    try {
        const requestBody: Readonly<JSONRPCBatchRequestBody> = new Array(endBlockNumber - startBlockNumber + 1).fill(0).map((_, index: number) => {
            return {
                id: 1,
                jsonrpc: '2.0',
                method: 'eth_getBlockByNumber',
                params: [
                    `0x${new Number(startBlockNumber + index).toString(16)}`,
                    false
                ]
            };
        });
    
        const response: Readonly<Response> = await fetch('http://localhost:8545', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
    
        const responseJSON = await response.json();
    
        const retrievedBlocks: ReadonlyArray<Block> = responseJSON.map((blockResult: Readonly<BlockResult>) => {
            return blockResult.result;
        });
    
        return retrievedBlocks;
    }
    catch(error) {
        console.log('error', error);
        console.log('retrying in 10 seconds');

        await new Promise((resolve) => setTimeout(resolve, 10000));
        return await fetchBlocks(startBlockNumber, endBlockNumber);
    }
}

async function fetchUncleBlocks(blocks: ReadonlyArray<Block>): Promise<ReadonlyArray<UncleBlock>> {
    try {
        const requestBody: Readonly<JSONRPCBatchRequestBody> = blocks.map((block: Readonly<Block>) => {
            return [...block.uncles.map((uncleHash: string, index: number) => {
                return {
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'eth_getUncleByBlockNumberAndIndex',
                    params: [
                        block.number,
                        `0x${new Number(index).toString(16)}`
                    ]
                };
            })];
        }).flat();
    
        if (requestBody.length === 0) {
            return [];
        }
    
        const response: Readonly<Response> = await fetch('http://localhost:8545', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
    
        const responseJSON = await response.json();
    
        const retrievedUncleBlocks: ReadonlyArray<UncleBlock> = responseJSON.map((uncleBlockResult: Readonly<UncleBlockResult>) => {
            return uncleBlockResult.result;
        });
    
        return retrievedUncleBlocks;    
    }
    catch(error) {
        console.log('error', error);
        console.log('retrying in 10 seconds');

        await new Promise((resolve) => setTimeout(resolve, 10000));
        return await fetchUncleBlocks(blocks);
    }
}

function combineBlocksWithUncleBlocks(
    blocks: ReadonlyArray<Block>,
    uncleBlocks: ReadonlyArray<UncleBlock>
): ReadonlyArray<BlockWithUncleBlocks> {
    const uncleBlocksMap: Readonly<UncleBlockMap> = createUncleBlockMap(uncleBlocks);
    const blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks> = blocks.map((block: Readonly<Block>) => {
        const blockWithUncleBlocks: Readonly<BlockWithUncleBlocks> = {
            ...block,
            uncles: block.uncles.map((uncleHash: HexString) => {
                return {
                    hash: uncleHash,
                    number: uncleBlocksMap[uncleHash]
                };
            })
        };
        return blockWithUncleBlocks;
    });

    return blocksWithUncleBlocks;
}

function createUncleBlockMap(uncleBlocks: ReadonlyArray<UncleBlock>): Readonly<UncleBlockMap> {
    return uncleBlocks.reduce((uncleBlockMap: Readonly<UncleBlockMap>, uncleBlock: Readonly<UncleBlock>) => {
        return {
            ...uncleBlockMap,
            [uncleBlock.hash]: uncleBlock.number
        };
    }, {});
}

// TODO put retry logic in here...perhaps a linear or exponential backoff, make sure to log it well
export async function getLatestBlockNumber(): Promise<number> {
    const result: Readonly<Response> = await fetch('http://localhost:8545', {
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