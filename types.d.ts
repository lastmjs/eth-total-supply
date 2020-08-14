import { BigNumber } from 'bignumber.js';

export type WEI = BigNumber;
export type ETH = BigNumber;
export type HexString = string;

export type NethermindGenesisBlockDistribution = {
    [ethAddress: string]: {
        readonly balance?: string;
    };
};

export type OpenEthereumGenesisBlockDistribution = {
    [ethAddress: string]: {
        readonly balance?: string;
    };
};

export type BlockResult = {
    readonly result: Readonly<Block>;
};

export type UncleBlockResult = {
    readonly result: Readonly<UncleBlock>;
};

export type Block = {
    readonly number: HexString;
    readonly uncles: Array<HexString>;
};

export type BlockWithUncleBlocks = {
    readonly number: HexString;
    readonly uncles: ReadonlyArray<UncleBlock>;
};

export type UncleBlock = {
    readonly number: HexString;
    readonly hash: HexString;
};

export type UncleBlockMap = {
    [uncleHash: string]: HexString;
};

export type JSONRPCBatchRequestBody = ReadonlyArray<{
    readonly id: number;
    readonly jsonrpc: string;
    readonly method: string;
    readonly params: Array<string | boolean>;
}>;