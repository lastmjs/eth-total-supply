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

const jsonRPCEndpoint: string = process.env.JSON_RPC_ENDPOINT || 'http://localhost:8545';

/**
 * Fetches all blocks and their uncle blocks between two block numbers inclusive.
 * First the blocks are fetched, which only include uncle hashes for each block (uncle block numbers are also needed).
 * The uncle blocks are then fetched with the above information.
 * Finally the blocks and uncle blocks are combined into one datastructure that has the blocks with the uncle blocks.
 */
export async function fetchBlocksWithUncleBlocks(startBlockNumber: number, endBlockNumber: number): Promise<ReadonlyArray<BlockWithUncleBlocks>> {
    const blocks: ReadonlyArray<Block> = await fetchBlocks(startBlockNumber, endBlockNumber);
    const uncleBlocks: ReadonlyArray<UncleBlock> = await fetchUncleBlocks(blocks);
    const blocksWithUncleBlocks: ReadonlyArray<BlockWithUncleBlocks> = combineBlocksWithUncleBlocks(blocks, uncleBlocks);

    return blocksWithUncleBlocks;
}

/**
 * Uses JSON-RPC with batching to fetch all blocks between two block numbers inclusive.
 * These blocks contain the block numbers and the uncle hashes, but not the uncle block numbers.
 * The uncle block numbers are necessary to perform the block reward calculation.
 */
async function fetchBlocks(startBlockNumber: number, endBlockNumber: number): Promise<ReadonlyArray<Block>> {
    try {
        // Creates a JSON-RPC batch request body
        // Essentially this is just an array of regular JSON-RPC request bodies
        // There are two params to eth_getBlockByNumber, the first is the block number in hex,
        // and the second is a boolean indicating whether full transaction bodies or just hashes should be returned
        // We do not need transactions at all, so we set the second parameter to false
        // More information: https://eth.wiki/json-rpc/API#eth_getblockbynumber
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
    
        const response: Readonly<Response> = await fetch(jsonRPCEndpoint, {
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
        // We catch all errors and retry after 10 seconds
        // Geth JSON-RPC requests seem to be very unstable at this load, lots of errors returned
        console.log('error', error);
        console.log('retrying in 10 seconds');

        await new Promise((resolve) => setTimeout(resolve, 10000));
        return await fetchBlocks(startBlockNumber, endBlockNumber);
    }
}

/**
 * Uses JSON-RPC with batching to fetch all uncle blocks for the blocks that are passed in.
 * These fetched blocks contain the uncle block numbers which are necessary to perform the block reward calculation.
 */
async function fetchUncleBlocks(blocks: ReadonlyArray<Block>): Promise<ReadonlyArray<UncleBlock>> {
    try {
        // Creates a JSON-RPC batch request body
        // Essentially this is just an array of regular JSON-RPC request bodies
        // There are two params to eth_getUncleByBlockNumberAndIndex, the first is the block number in hex and the second is the uncle index in hex
        // More information: https://eth.wiki/json-rpc/API#eth_getunclebyblocknumberandindex
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
    
        const response: Readonly<Response> = await fetch(jsonRPCEndpoint, {
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
        // We catch all errors and retry after 10 seconds
        // Geth JSON-RPC requests seem to be very unstable at this load, lots of errors returned
        console.log('error', error);
        console.log('retrying in 10 seconds');

        await new Promise((resolve) => setTimeout(resolve, 10000));
        return await fetchUncleBlocks(blocks);
    }
}

/**
 * Takes an array of blocks and an array of uncle blocks and returns one array of blocks with their uncle blocks.
 */
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

/**
 * Transforms an array of uncleBlocks into a mapping of uncle hash to uncle block number.
 * This is just a simple plain data JavaScript object with keys that are uncle hashes and values that are block numbers.
 * This data structure makes efficient lookups of uncle block numbers by hashes possible.
 */
function createUncleBlockMap(uncleBlocks: ReadonlyArray<UncleBlock>): Readonly<UncleBlockMap> {
    return uncleBlocks.reduce((uncleBlockMap: Readonly<UncleBlockMap>, uncleBlock: Readonly<UncleBlock>) => {
        return {
            ...uncleBlockMap,
            [uncleBlock.hash]: uncleBlock.number
        };
    }, {});
}

/**
 * Retrieves the latest synchronized block.
 */
export async function getLatestBlockNumber(): Promise<number> {
    // A normal JSON-RPC request without batching
    // More information: https://eth.wiki/json-rpc/API#eth_blocknumber
    const result: Readonly<Response> = await fetch(jsonRPCEndpoint, {
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