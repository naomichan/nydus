"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const NydusError = require("./errors");
class BitPackedBuffer {
    constructor(contents, endianness = "big") {
        this.data = contents || new Buffer(0);
        this.used = 0;
        this.next = 0;
        this.nextBits = 0;
        this.be = (endianness === "big");
    }
    toString() {
        return `buffer(${(this.nextBits && this.next).toString(16)}/${this.nextBits}, [${this.used}]=${this.used < this.data.length ? this.data[this.used] : "--"}`;
    }
    done() {
        return this.nextBits === 0 && this.used >= this.data.length;
    }
    usedBits() {
        return this.used * 8 - this.nextBits;
    }
    byteAlign() {
        this.nextBits = 0;
    }
    readAlignedBytes(bytes) {
        this.byteAlign();
        const data = this.data.slice(this.used, this.used + bytes);
        this.used += bytes;
        if (data.length !== bytes) {
            throw new NydusError.TruncatedError();
        }
        return data;
    }
    readBits(bits) {
        let result = 0;
        let resultbits = 0;
        while (resultbits !== bits) {
            if (this.nextBits === 0) {
                if (this.done()) {
                    throw new NydusError.TruncatedError();
                }
                this.next = this.data[this.used];
                this.used += 1;
                this.nextBits = 8;
            }
            const copybits = Math.min(bits - resultbits, this.nextBits);
            const copy = (this.next & ((1 << copybits) - 1));
            if (this.be) {
                result |= copy << (bits - resultbits - copybits);
            }
            else {
                result |= copy << resultbits;
            }
            this.next >>= copybits;
            this.nextBits -= copybits;
            resultbits += copybits;
        }
        return result;
    }
    readUnalignedBytes(bytes) {
        const buffer = new Buffer(bytes);
        for (let i = 0; i < bytes; ++i) {
            buffer[i] = this.readBits(8);
        }
        return buffer;
    }
}
exports.BitPackedBuffer = BitPackedBuffer;
class BitPackedDecoder {
    constructor(contents, typeInfos) {
        this.buffer = new BitPackedBuffer(contents);
        this.typeInfos = typeInfos;
    }
    toString() {
        return this.buffer.toString();
    }
    instance(typeId) {
        if (typeId >= this.typeInfos.length) {
            throw new NydusError.CorruptedError();
        }
        const typeInfo = this.typeInfos[typeId];
        return this[typeInfo[0]](...typeInfo[1]);
    }
    byteAlign() {
        this.buffer.byteAlign();
    }
    done() {
        return this.buffer.done();
    }
    usedBits() {
        return this.buffer.usedBits();
    }
    _array(bounds, typeId) {
        const length = this._int(bounds);
        const ret = [];
        for (let i = 0; i < length; ++i) {
            ret[i] = this.instance(typeId);
        }
        return ret;
    }
    _bitarray(bounds) {
        const length = this._int(bounds);
        return [length, this.buffer.readBits(length)];
    }
    _blob(bounds) {
        const length = this._int(bounds);
        return this.buffer.readAlignedBytes(length);
    }
    _bool() {
        return this._int([0, 1]) !== 0;
    }
    _choice(bounds, fields) {
        const tag = this._int(bounds);
        if (!(tag in fields)) {
            throw new NydusError.CorruptedError();
        }
        const field = fields[tag];
        const ret = {};
        ret[field[0]] = this.instance(field[1]);
        return ret;
    }
    _fourcc() {
        return this.buffer.readUnalignedBytes(4);
    }
    _int(bounds) {
        return bounds[0] + this.buffer.readBits(bounds[1]);
    }
    _null() {
        return null;
    }
    _optional(typeId) {
        const exists = this._bool();
        if (exists) {
            return this.instance(typeId);
        }
        return this._null();
    }
    _real32() {
        return this.buffer.readUnalignedBytes(4).readFloatBE(0);
    }
    _real64() {
        return this.buffer.readUnalignedBytes(8).readDoubleBE(0);
    }
    _struct(fields) {
        let result = {};
        for (const field of fields) {
            if (field[0] === "__parent") {
                const parent = this.instance(field[1]);
                if (typeof parent === "object" && !util_1.isArray(parent)) {
                    for (const key in parent) {
                        if (key in parent) {
                            result[key] = parent[key];
                        }
                    }
                }
                else if (fields.length === 1) {
                    result = parent;
                }
                else {
                    result[field[0]] = parent;
                }
            }
            else {
                result[field[0]] = this.instance(field[1]);
            }
        }
        return result;
    }
}
exports.BitPackedDecoder = BitPackedDecoder;
//# sourceMappingURL=bitbuffer.js.map