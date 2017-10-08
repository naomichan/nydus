// Goal: Convert https://github.com/Blizzard/heroprotocol/blob/ffb1e5d53cce1a90a46febf44614c9c11bd3ed12/decoders.py#L168 to TypeScript
//

import { isArray } from "util";
import { BitPackedBuffer } from "./bitbuffer";
import * as NydusError from "./errors";

export class VersionedDecoder {
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

  public _expect_skip(expected: number): void {
    if(this.buffer.readBits(8) !== expected) {
      throw new NydusError.CorruptedError();
    }
  }

  public _vint(): number {
    let b: number = this.buffer.readBits(8);
    const negative: boolean = (b & 1) > 0;
    let result: number = (b >> 1) & 0x3F;
    let bits = 6;
    while((b & 0x80) !== 0) {
      b = this.buffer.readBits(8);
      result |= (b & 0x7F) << bits;
      bits += 7;
    }
    if(negative) {
      return -result;
    } else {
      return result;
    }
  }

  public _array(bounds: [number, number], typeId: number) {
    this._expect_skip(0);
    const length: number = this._vint();
    const ret: any[] = [];
    for(let i = 0; i < length; ++i) {
      ret[i] = this.instance(typeId);
    }
    return ret;
  }

  public _bitarray(bounds: [number, number]): [number, Buffer] {
    this._expect_skip(1);
    const length: number = this._vint();
    return [length, this.buffer.readAlignedBytes((length + 7) / 8)];
  }

  public _blob(bounds: [number, number]): Buffer {
    this._expect_skip(2);
    const length: number = this._vint();
    return this.buffer.readAlignedBytes(length);
  }

  public _bool(): boolean {
    this._expect_skip(6);
    return this.buffer.readBits(8) !== 0;
  }

  public _choice(bounds: [number, number], fields: {[key: number]: any}): any {
    this._expect_skip(3);
    const tag: number = this._vint();
    if(!(tag in fields)) {
      this._skip_instance();
      return {};
    }
    const field: any = fields[tag];
    const ret: any = {};
    ret[field[0]] = this.instance(field[1]);
    return ret;
  }

  public _fourcc(): Buffer {
    this._expect_skip(7);
    return this.buffer.readAlignedBytes(4);
  }

  public _int(bounds:[number, number]): number {
    this._expect_skip(9);
    return this._vint();
  }

  public _null(): null {
    return null;
  }

  public _optional(typeId: number): any {
    this._expect_skip(4);
    const exists = this.buffer.readBits(8) !== 0;
    if(exists) {
      return this.instance(typeId);
    }
    return this._null();
  }

  public _real32(): number {
    this._expect_skip(7);
    return this.buffer.readAlignedBytes(4).readFloatBE(0);
  }

  public _real64(): number {
    this._expect_skip(8);
    return this.buffer.readAlignedBytes(8).readDoubleBE(0);
  }

  public _struct(fields: any[]): any {
    this._expect_skip(5);
    let result: any = {};
    const length: number = this._vint();
    for(let i = 0; i < length; ++i) {
      const tag: number = this._vint();
      let field: any[] | null = null;
      for(const f of fields) {
        if(f[2] === tag) {
          field = f;
          break;
        }
      }
      if(field === null) {
        this._skip_instance();
        continue;
      }
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

  public _skip_instance(): void {
    const skip: number = this.buffer.readBits(8);
    switch(skip) {
      case 0: {
        const length: number = this._vint();
        for(let i = 0; i < length; ++i) {
          this._skip_instance();
        }
        break;
      }
      case 1: {
        const length: number = this._vint();
        this.buffer.readAlignedBytes((length + 7) / 8);
        break;
      }
      case 2: {
        const length: number = this._vint();
        this.buffer.readAlignedBytes(length);
        break;
      }
      case 3: {
        this._vint();
        this._skip_instance();
        break;
      }
      case 4: {
        const exists: boolean = this.buffer.readBits(8) !== 0;
        if(exists) {
          this._skip_instance();
        }
        break;
      }
      case 5: {
        const length: number = this._vint();
        for(let i = 0; i < length; ++i) {
          this._vint();
          this._skip_instance();
        }
        break;
      }
      case 6: {
        this.buffer.readAlignedBytes(1);
      }
      case 7: {
        this.buffer.readAlignedBytes(4);
      }
      case 8: {
        this.buffer.readAlignedBytes(8);
      }
      case 9: {
        this._vint();
      }
    }
  }
}
