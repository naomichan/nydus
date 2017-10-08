/// <reference types="node" />

// Goal: Convert https://github.com/Blizzard/heroprotocol/blob/ffb1e5d53cce1a90a46febf44614c9c11bd3ed12/decoders.py#L32 to TypeScript
// Goal: Convert https://github.com/Blizzard/heroprotocol/blob/ffb1e5d53cce1a90a46febf44614c9c11bd3ed12/decoders.py#L87 to TypeScript
//

import { isArray } from "util";
import * as NydusError from "./errors";

export class BitPackedBuffer {
  protected data: Buffer;
  protected used: number;
  protected next: number;
  protected nextBits: number;
  protected be: boolean;

  constructor(contents?: Buffer, endianness: string = "big") {
    this.data = contents || new Buffer(0);
    this.used = 0;
    this.next = 0;
    this.nextBits = 0;
    this.be = (endianness === "big");
  }

  public toString(): string {
    return `buffer(${(this.nextBits && this.next).toString(16)}/${this.nextBits}, [${this.used}]=${this.used < this.data.length ? this.data[this.used] : "--"}`;
  }

  public done(): boolean {
    return this.nextBits === 0 && this.used >= this.data.length;
  }

  public usedBits(): number {
    return this.used * 8 - this.nextBits;
  }

  public byteAlign(): void {
    this.nextBits = 0;
  }

  public readAlignedBytes(bytes: number): Buffer {
    this.byteAlign();
    const data: Buffer = this.data.slice(this.used, this.used + bytes);
    this.used += bytes;
    if(data.length !== bytes) {
      throw new NydusError.TruncatedError();
    }
    return data;
  }

  public readBits(bits: number): number {
    let result: number = 0;
    let resultbits: number = 0;
    while(resultbits !== bits) {
      if(this.nextBits === 0) {
        if(this.done()) {
          throw new NydusError.TruncatedError();
        }
        this.next = this.data[this.used];
        this.used += 1;
        this.nextBits = 8;
      }
      const copybits: number = Math.min(bits - resultbits, this.nextBits);
      const copy: number = (this.next & ((1 << copybits) - 1));
      if(this.be) {
        result |= copy << (bits - resultbits - copybits);
      } else {
        result |= copy << resultbits;
      }
      this.next >>= copybits;
      this.nextBits -= copybits;
      resultbits += copybits;
    }
    return result;
  }

  public readUnalignedBytes(bytes: number): Buffer {
    const buffer: Buffer = new Buffer(bytes);
    for(let i = 0; i < bytes; ++i) {
      buffer[i] = this.readBits(8);
    }
    return buffer;
  }
}

export class BitPackedDecoder {
  [key: string]: any;
  protected typeInfos: Array<[string, any[]]>;
  protected buffer: BitPackedBuffer;

  constructor(contents: Buffer, typeInfos: Array<[string, any[]]>) {
    this.buffer = new BitPackedBuffer(contents);
    this.typeInfos = typeInfos;
  }

  public toString(): string {
    return this.buffer.toString();
  }

  public instance(typeId: number): any {
    if(typeId >= this.typeInfos.length) {
      throw new NydusError.CorruptedError();
    }
    const typeInfo: [string, any[]] = this.typeInfos[typeId];

    return this[typeInfo[0]](...typeInfo[1]);
  }

  public byteAlign(): void {
    this.buffer.byteAlign();
  }

  public done(): boolean {
    return this.buffer.done();
  }

  public usedBits(): number {
    return this.buffer.usedBits();
  }

  public _array(bounds: [number, number], typeId: number): any[] {
    const length: number = this._int(bounds);
    const ret: any[] = [];
    for(let i = 0; i < length; ++i) {
      ret[i] = this.instance(typeId);
    }
    return ret;
  }

  public _bitarray(bounds: [number, number]): [number, number] {
    const length: number = this._int(bounds);
    return [length, this.buffer.readBits(length)];
  }

  public _blob(bounds: [number, number]): Buffer {
    const length = this._int(bounds);
    return this.buffer.readAlignedBytes(length);
  }

  public _bool(): boolean {
    return this._int([0, 1]) !== 0;
  }

  public _choice(bounds: [number, number], fields: {[key: number]: any}): any {
    const tag: number = this._int(bounds);
    if(!(tag in fields)) {
      throw new NydusError.CorruptedError();
    }
    const field: any = fields[tag];
    const ret: any = {};
    ret[field[0]] = this.instance(field[1]);
    return ret;
  }

  public _fourcc(): Buffer {
    return this.buffer.readUnalignedBytes(4);
  }

  public _int(bounds: [number, number]): number {
    return bounds[0] + this.buffer.readBits(bounds[1]);
  }

  public _null(): null {
    return null;
  }

  public _optional(typeId: number): any {
    const exists = this._bool();
    if(exists) {
      return this.instance(typeId);
    }
    return this._null();
  }

  public _real32(): number {
    return this.buffer.readUnalignedBytes(4).readFloatBE(0);
  }

  public _real64(): number {
    return this.buffer.readUnalignedBytes(8).readDoubleBE(0);
  }

  public _struct(fields: any[]): any {
    let result: any = {};
    for(const field of fields) {
      if(field[0] === "__parent") {
        const parent: any = this.instance(field[1]);
        if(typeof parent === "object" && !isArray(parent)) {
          for(const key in parent) {
            if(key in parent) {
              result[key] = parent[key];
            }
          }
        } else if(fields.length === 1) {
          result = parent;
        } else {
          result[field[0]] = parent;
        }
      } else {
        result[field[0]] = this.instance(field[1]);
      }
    }
    return result;
  }
}
