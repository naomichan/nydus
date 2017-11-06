/// <reference types="node" />

// Goal: Main parser file
//

import { MPQArchive } from "mpyqjs/mpyq";
import { resolve } from "path";
import * as HERO from "./attrib/heroes";
import * as S2 from "./attrib/s2";
import { BitPackedBuffer, BitPackedDecoder } from "./bitbuffer";
import { Latest, Overmind } from "./tool/heroprotoc";
import { VersionedDecoder } from "./versioned";

export enum GameType {
  HERO = 0,
  S2 = 1,
  ANY = 0x1000,
}

export class Replay {
  public mpq: MPQArchive;
  public protocol: NYDUS_PROTOCOL | null;
  public attributes: NYDUS_ATTRIBUTES;
  public header: any;
  public parent: Parser;

  constructor(file: string, protocol: NYDUS_PROTOCOL, attrib: NYDUS_ATTRIBUTES, parent: Parser) {
    this.attributes = attrib;
    this.mpq = new MPQArchive(file);
    const decoder = new VersionedDecoder(this.mpq.header.userDataHeader.content, protocol.TYPE_INFO);
    this.header = decoder.instance(protocol.REPLAY[2]);
    this.protocol = null;
    this.parent = parent;
  }

  public async loadProtocol(): Promise<boolean> {
    try {
      await this.parent.loadProtocol(this.header.m_version.m_baseBuild);
    } catch {
      return false;
    }
    return true;
  }

  public ready(): boolean {
    return this.protocol != null;
  }

  public parseDetails(): any {
    if(!this.ready()) {
      throw new Error("Call loadProtocol()");
    }
    if(this.protocol != null) {
      const decoder = new VersionedDecoder(this.mpq.readFile("replay.details", false), this.protocol.TYPE_INFO);
      return decoder.instance(this.protocol.REPLAY[3]);
    }
    return null;
  }

  public parseInitData(): any {
    if(!this.ready()) {
      throw new Error("Wait until ready()");
    }
    if(this.protocol != null) {
      const decoder = new VersionedDecoder(this.mpq.readFile("replay.initData", false), this.protocol.TYPE_INFO);
      return decoder.instance(this.protocol.REPLAY[4]);
    }
    return null;
  }

  public parseGameEvents(onEvent: Function): any {
    if(!this.ready()) {
      throw new Error("Wait until ready()");
    }
    if(this.protocol != null) {
      const decoder = new BitPackedDecoder(this.mpq.readFile("replay.game.events", false), this.protocol.TYPE_INFO);
      return this.decodeEventStream(decoder, onEvent, this.protocol.GAME_EVENT[0], this.protocol.GAME_EVENT[1], true);
    }
    return null;
  }

  public parseMessageEvents(onEvent: Function): any {
    if(!this.ready()) {
      throw new Error("Wait until ready()");
    }
    if(this.protocol != null) {
      const decoder = new BitPackedDecoder(this.mpq.readFile("replay.message.events", false), this.protocol.TYPE_INFO);
      return this.decodeEventStream(decoder, onEvent, this.protocol.MESSAGE_EVENT[0], this.protocol.MESSAGE_EVENT[1], true);
    }
    return null;
  }

  public parseTrackerEvents(onEvent: Function): any {
    if(!this.ready()) {
      throw new Error("Wait until ready()");
    }
    if(this.protocol != null) {
      const decoder = new BitPackedDecoder(this.mpq.readFile("replay.tracker.events", false), this.protocol.TYPE_INFO);
      return this.decodeEventStream(decoder, onEvent, this.protocol.TRACKER_EVENT[0], this.protocol.TRACKER_EVENT[1], false);
    }
    return null;
  }

  public parseAttributeEvents(): any {
    if(!this.ready()) {
      throw new Error("Wait until ready()");
    }
    if(this.protocol != null) {
      const buffer = new BitPackedBuffer(this.mpq.readFile("replay.attribute.events", false), "little");
      const attributes: any = {};
      if(!buffer.done()) {
        attributes.source = buffer.readBits(8);
        attributes.mapNamespace = buffer.readBits(32);
        const count = buffer.readBits(32);
        attributes.scopes = {};
        while(!buffer.done()) {
          const value: any = {};
          value.namespace = buffer.readBits(32);
          value.attrid = buffer.readBits(32);
          const scope = buffer.readBits(8);
          value.value = buffer.readAlignedBytes(4).reverse();
          if(!(scope in attributes.scopes)) {
            attributes.scopes[scope] = {};
          }
          if(!(value.attrid in attributes.scopes[scope])) {
            attributes.scopes[scope][value.attrid] = [];
          }
          attributes.scopes[scope][value.attrid].push(value);
        }
      }
      return attributes;
    }
    return null;
  }

  private varInt(decoder: BitPackedDecoder): number {
    if(this.protocol == null) {
      return 0;
    }
    const deltaObj = decoder.instance(this.protocol.REPLAY[0]);
    if(Object.keys(deltaObj).length > 0) {
      return deltaObj[Object.keys(deltaObj)[0]];
    }
    return 0;
  }

  private decodeEventStream(decoder: BitPackedDecoder, onEvent: Function, eventidTypeid: number, eventTypes: { [key: string]: any[] }, decodeUserId: boolean): void {
    if(this.protocol == null) {
      return;
    }
    let gameloop = 0;
    while(!decoder.done()) {
      const startBits = decoder.usedBits();

      const delta = this.varInt(decoder);
      gameloop += delta;

      let userId = 0;
      if(decodeUserId) {
        userId = decoder.instance(this.protocol.REPLAY[1]);
      }

      const eventId = decoder.instance(eventidTypeid);
      const typeInfo = eventTypes[eventId];
      if(typeInfo == null) {
        throw new Error(`eventid(${eventId}) at ${decoder} is broken`);
      }
      const typeId = typeInfo[0];
      const typeName = typeInfo[1];

      const event = decoder.instance(typeId);
      event._event = typeName;
      event._eventid = eventId;
      event._gameloop = gameloop;
      if(decodeUserId) {
        event._usedId = userId;
      }
      decoder.byteAlign();
      event._bits = decoder.usedBits() - startBits;
      onEvent(event);
    }
  }
}

export class Parser {
  protected gameType: GameType;
  protected defDir: string = resolve(__dirname, "../def/");

  protected LATEST_PROTO: NYDUS_PROTOCOL | null;

  protected shouldDownloadProtocol: boolean;

  constructor(decl: GameType | string, shouldDownload: boolean = true) {
    if(typeof decl === "string") {
      this.defDir = decl;
      this.gameType = GameType.ANY;
    } else {
      this.gameType = decl;
      if(this.gameType === GameType.HERO) {
        this.defDir = resolve(this.defDir, "heroes");
      } else if(this.gameType === GameType.S2) {
        this.defDir = resolve(this.defDir, "s2");
      }
    }
    this.shouldDownloadProtocol = shouldDownload;
  }

  public setGameType(gameType: GameType): void {
    this.gameType = gameType;
  }

  public setDefinitionDirectory(defDir: string): void {
    this.defDir = defDir;
  }

  public async reload(): Promise<void> {
    this.LATEST_PROTO = await Latest(this.defDir);
    if(this.LATEST_PROTO == null) {
      throw new Error("Missing base protocol info");
    }
    return;
  }

  public async loadReplay(replayFile: string, attrib: NYDUS_ATTRIBUTES = {}): Promise<Replay> {
    if(this.LATEST_PROTO == null) {
      throw new Error("Missing base protocol info, call reload first.");
    }
    if(this.gameType === GameType.HERO) {
      attrib = HERO.ATTRIBUTES;
    } else if(this.gameType === GameType.S2) {
      attrib = S2.ATTRIBUTES;
    }
    return new Replay(replayFile, this.LATEST_PROTO, attrib, this);
  }

  public async loadProtocol(version: number): Promise<NYDUS_PROTOCOL | null> {
    return await Overmind(this.defDir, version, this.shouldDownloadProtocol);
  }
}

export default { Parser };
