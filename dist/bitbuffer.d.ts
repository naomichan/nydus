/// <reference types="node" />
export declare class BitPackedBuffer {
    protected data: Buffer;
    protected used: number;
    protected next: number;
    protected nextBits: number;
    protected be: boolean;
    constructor(contents?: Buffer, endianness?: string);
    toString(): string;
    done(): boolean;
    usedBits(): number;
    byteAlign(): void;
    readAlignedBytes(bytes: number): Buffer;
    readBits(bits: number): number;
    readUnalignedBytes(bytes: number): Buffer;
}
export declare class BitPackedDecoder {
    [key: string]: any;
    protected typeInfos: Array<[string, any[]]>;
    protected buffer: BitPackedBuffer;
    constructor(contents: Buffer, typeInfos: Array<[string, any[]]>);
    toString(): string;
    instance(typeId: number): any;
    byteAlign(): void;
    done(): boolean;
    usedBits(): number;
    _array(bounds: [number, number], typeId: number): any[];
    _bitarray(bounds: [number, number]): [number, number];
    _blob(bounds: [number, number]): Buffer;
    _bool(): boolean;
    _choice(bounds: [number, number], fields: {
        [key: number]: any;
    }): any;
    _fourcc(): Buffer;
    _int(bounds: [number, number]): number;
    _null(): null;
    _optional(typeId: number): any;
    _real32(): number;
    _real64(): number;
    _struct(fields: any[]): any;
}
