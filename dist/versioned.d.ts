/// <reference types="node" />
import { BitPackedBuffer } from "./bitbuffer";
export declare class VersionedDecoder {
    [key: string]: any;
    protected typeInfos: Array<[string, any[]]>;
    protected buffer: BitPackedBuffer;
    constructor(contents: Buffer, typeInfos: Array<[string, any[]]>);
    toString(): string;
    instance(typeId: number): any;
    byteAlign(): void;
    done(): boolean;
    usedBits(): number;
    _expect_skip(expected: number): void;
    _vint(): number;
    _array(bounds: [number, number], typeId: number): any[];
    _bitarray(bounds: [number, number]): [number, Buffer];
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
    _skip_instance(): void;
}
