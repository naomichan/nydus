"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
const bitbuffer_1 = require("./bitbuffer");
const NydusError = require("./errors");
class VersionedDecoder {
    constructor(contents, typeInfos) {
        this.buffer = new bitbuffer_1.BitPackedBuffer(contents);
        this.typeInfos = typeInfos;
    }
    toString() {
        return this.buffer.toString();
    }
    instance(typeId) {
        if (typeId >= this.typeInfos.length) {
            throw new NydusError.CorruptedError(`typeId ${typeId} is outside of typeInfo range ${this.typeInfos.length}`);
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
    _expect_skip(expected) {
        const bits = this.buffer.readBits(8);
        if (bits !== expected) {
            throw new NydusError.CorruptedError(`Expected ${expected}, got ${bits}`);
        }
    }
    _vint() {
        let b = this.buffer.readBits(8);
        const negative = (b & 1) > 0;
        let result = (b >> 1) & 0x3F;
        let bits = 6;
        while ((b & 0x80) !== 0) {
            b = this.buffer.readBits(8);
            result |= (b & 0x7F) << bits;
            bits += 7;
        }
        if (negative) {
            return -result;
        }
        else {
            return result;
        }
    }
    _array(bounds, typeId) {
        this._expect_skip(0);
        const length = this._vint();
        const ret = [];
        for (let i = 0; i < length; ++i) {
            ret[i] = this.instance(typeId);
        }
        return ret;
    }
    _bitarray(bounds) {
        this._expect_skip(1);
        const length = this._vint();
        return [length, this.buffer.readAlignedBytes((length + 7) / 8)];
    }
    _blob(bounds) {
        this._expect_skip(2);
        const length = this._vint();
        return this.buffer.readAlignedBytes(length);
    }
    _bool() {
        this._expect_skip(6);
        return this.buffer.readBits(8) !== 0;
    }
    _choice(bounds, fields) {
        this._expect_skip(3);
        const tag = this._vint();
        if (!(tag in fields)) {
            this._skip_instance();
            return {};
        }
        const field = fields[tag];
        const ret = {};
        ret[field[0]] = this.instance(field[1]);
        return ret;
    }
    _fourcc() {
        this._expect_skip(7);
        return this.buffer.readAlignedBytes(4);
    }
    _int(bounds) {
        this._expect_skip(9);
        return this._vint();
    }
    _null() {
        return null;
    }
    _optional(typeId) {
        this._expect_skip(4);
        const exists = this.buffer.readBits(8) !== 0;
        if (exists) {
            return this.instance(typeId);
        }
        return this._null();
    }
    _real32() {
        this._expect_skip(7);
        return this.buffer.readAlignedBytes(4).readFloatBE(0);
    }
    _real64() {
        this._expect_skip(8);
        return this.buffer.readAlignedBytes(8).readDoubleBE(0);
    }
    _struct(fields) {
        this._expect_skip(5);
        let result = {};
        const length = this._vint();
        for (let i = 0; i < length; ++i) {
            const tag = this._vint();
            let field = null;
            for (const f of fields) {
                if (f[2] === tag) {
                    field = f;
                    break;
                }
            }
            if (field === null) {
                this._skip_instance();
                continue;
            }
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
    _skip_instance() {
        const skip = this.buffer.readBits(8);
        switch (skip) {
            case 0: {
                const length = this._vint();
                for (let i = 0; i < length; ++i) {
                    this._skip_instance();
                }
                break;
            }
            case 1: {
                const length = this._vint();
                this.buffer.readAlignedBytes((length + 7) / 8);
                break;
            }
            case 2: {
                const length = this._vint();
                this.buffer.readAlignedBytes(length);
                break;
            }
            case 3: {
                this._vint();
                this._skip_instance();
                break;
            }
            case 4: {
                const exists = this.buffer.readBits(8) !== 0;
                if (exists) {
                    this._skip_instance();
                }
                break;
            }
            case 5: {
                const length = this._vint();
                for (let i = 0; i < length; ++i) {
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
exports.VersionedDecoder = VersionedDecoder;
//# sourceMappingURL=versioned.js.map