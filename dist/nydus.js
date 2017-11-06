"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mpyq_1 = require("mpyqjs/mpyq");
const path_1 = require("path");
const HERO = require("./attrib/heroes");
const S2 = require("./attrib/s2");
const bitbuffer_1 = require("./bitbuffer");
const heroprotoc_1 = require("./tool/heroprotoc");
const versioned_1 = require("./versioned");
var GameType;
(function (GameType) {
    GameType[GameType["HERO"] = 0] = "HERO";
    GameType[GameType["S2"] = 1] = "S2";
    GameType[GameType["ANY"] = 4096] = "ANY";
})(GameType = exports.GameType || (exports.GameType = {}));
class Replay {
    constructor(file, protocol, attrib, parent) {
        this.attributes = attrib;
        this.mpq = new mpyq_1.MPQArchive(file);
        const decoder = new versioned_1.VersionedDecoder(this.mpq.header.userDataHeader.content, protocol.TYPE_INFO);
        this.header = decoder.instance(protocol.REPLAY[2]);
        this.protocol = null;
        this.parent = parent;
    }
    loadProtocol() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.parent.loadProtocol(this.header.m_version.m_baseBuild);
            }
            catch (_a) {
                return false;
            }
            return true;
        });
    }
    ready() {
        return this.protocol != null;
    }
    parseDetails() {
        if (!this.ready()) {
            throw new Error("Call loadProtocol()");
        }
        if (this.protocol != null) {
            const decoder = new versioned_1.VersionedDecoder(this.mpq.readFile("replay.details", false), this.protocol.TYPE_INFO);
            return decoder.instance(this.protocol.REPLAY[3]);
        }
        return null;
    }
    parseInitData() {
        if (!this.ready()) {
            throw new Error("Wait until ready()");
        }
        if (this.protocol != null) {
            const decoder = new versioned_1.VersionedDecoder(this.mpq.readFile("replay.initData", false), this.protocol.TYPE_INFO);
            return decoder.instance(this.protocol.REPLAY[4]);
        }
        return null;
    }
    parseGameEvents(onEvent) {
        if (!this.ready()) {
            throw new Error("Wait until ready()");
        }
        if (this.protocol != null) {
            const decoder = new bitbuffer_1.BitPackedDecoder(this.mpq.readFile("replay.game.events", false), this.protocol.TYPE_INFO);
            return this.decodeEventStream(decoder, onEvent, this.protocol.GAME_EVENT[0], this.protocol.GAME_EVENT[1], true);
        }
        return null;
    }
    parseMessageEvents(onEvent) {
        if (!this.ready()) {
            throw new Error("Wait until ready()");
        }
        if (this.protocol != null) {
            const decoder = new bitbuffer_1.BitPackedDecoder(this.mpq.readFile("replay.message.events", false), this.protocol.TYPE_INFO);
            return this.decodeEventStream(decoder, onEvent, this.protocol.MESSAGE_EVENT[0], this.protocol.MESSAGE_EVENT[1], true);
        }
        return null;
    }
    parseTrackerEvents(onEvent) {
        if (!this.ready()) {
            throw new Error("Wait until ready()");
        }
        if (this.protocol != null) {
            const decoder = new bitbuffer_1.BitPackedDecoder(this.mpq.readFile("replay.tracker.events", false), this.protocol.TYPE_INFO);
            return this.decodeEventStream(decoder, onEvent, this.protocol.TRACKER_EVENT[0], this.protocol.TRACKER_EVENT[1], false);
        }
        return null;
    }
    parseAttributeEvents() {
        if (!this.ready()) {
            throw new Error("Wait until ready()");
        }
        if (this.protocol != null) {
            const buffer = new bitbuffer_1.BitPackedBuffer(this.mpq.readFile("replay.attribute.events", false), "little");
            const attributes = {};
            if (!buffer.done()) {
                attributes.source = buffer.readBits(8);
                attributes.mapNamespace = buffer.readBits(32);
                const count = buffer.readBits(32);
                attributes.scopes = {};
                while (!buffer.done()) {
                    const value = {};
                    value.namespace = buffer.readBits(32);
                    value.attrid = buffer.readBits(32);
                    const scope = buffer.readBits(8);
                    value.value = buffer.readAlignedBytes(4).reverse();
                    if (!(scope in attributes.scopes)) {
                        attributes.scopes[scope] = {};
                    }
                    if (!(value.attrid in attributes.scopes[scope])) {
                        attributes.scopes[scope][value.attrid] = [];
                    }
                    attributes.scopes[scope][value.attrid].push(value);
                }
            }
            return attributes;
        }
        return null;
    }
    varInt(decoder) {
        if (this.protocol == null) {
            return 0;
        }
        const deltaObj = decoder.instance(this.protocol.REPLAY[0]);
        if (Object.keys(deltaObj).length > 0) {
            return deltaObj[Object.keys(deltaObj)[0]];
        }
        return 0;
    }
    decodeEventStream(decoder, onEvent, eventidTypeid, eventTypes, decodeUserId) {
        if (this.protocol == null) {
            return;
        }
        let gameloop = 0;
        while (!decoder.done()) {
            const startBits = decoder.usedBits();
            const delta = this.varInt(decoder);
            gameloop += delta;
            let userId = 0;
            if (decodeUserId) {
                userId = decoder.instance(this.protocol.REPLAY[1]);
            }
            const eventId = decoder.instance(eventidTypeid);
            const typeInfo = eventTypes[eventId];
            if (typeInfo == null) {
                throw new Error(`eventid(${eventId}) at ${decoder} is broken`);
            }
            const typeId = typeInfo[0];
            const typeName = typeInfo[1];
            const event = decoder.instance(typeId);
            event._event = typeName;
            event._eventid = eventId;
            event._gameloop = gameloop;
            if (decodeUserId) {
                event._usedId = userId;
            }
            decoder.byteAlign();
            event._bits = decoder.usedBits() - startBits;
            onEvent(event);
        }
    }
}
exports.Replay = Replay;
class Parser {
    constructor(decl, shouldDownload = true) {
        this.defDir = path_1.resolve(__dirname, "../def/");
        if (typeof decl === "string") {
            this.defDir = decl;
            this.gameType = GameType.ANY;
        }
        else {
            this.gameType = decl;
            if (this.gameType === GameType.HERO) {
                this.defDir = path_1.resolve(this.defDir, "heroes");
            }
            else if (this.gameType === GameType.S2) {
                this.defDir = path_1.resolve(this.defDir, "s2");
            }
        }
        this.shouldDownloadProtocol = shouldDownload;
    }
    setGameType(gameType) {
        this.gameType = gameType;
    }
    setDefinitionDirectory(defDir) {
        this.defDir = defDir;
    }
    reload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.LATEST_PROTO = yield heroprotoc_1.Latest(this.defDir);
            if (this.LATEST_PROTO == null) {
                throw new Error("Missing base protocol info");
            }
            return;
        });
    }
    loadReplay(replayFile, attrib = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.LATEST_PROTO == null) {
                throw new Error("Missing base protocol info, call reload first.");
            }
            if (this.gameType === GameType.HERO) {
                attrib = HERO.ATTRIBUTES;
            }
            else if (this.gameType === GameType.S2) {
                attrib = S2.ATTRIBUTES;
            }
            return new Replay(replayFile, this.LATEST_PROTO, attrib, this);
        });
    }
    loadProtocol(version) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield heroprotoc_1.Overmind(this.defDir, version, this.shouldDownloadProtocol);
        });
    }
}
exports.Parser = Parser;
exports.default = { Parser };
//# sourceMappingURL=nydus.js.map