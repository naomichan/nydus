/// <reference types="node" />

// Goal: Main parser file
//

import { MPQArchive } from "mpyqjs/mpyq";
import { resolve } from "path";
import * as HERO from "../def/heroes";
import * as S2 from "../def/s2";
import { BitPackedDecoder } from "./bitbuffer";
import { Latest, Overmind } from "./tool/heroprotoc";
import { VersionedDecoder } from "./versioned";

export enum GameType {
  HERO = 0,
  S2 = 1,
  ANY = 0x1000,
}

export class Replay {
  public mpq: MPQArchive;
  public protocol: NYDUS_PROTOCOL;
  public attributes: NYDUS_ATTRIBUTES;
  public header: any;

  constructor(file: string, protocol: NYDUS_PROTOCOL, attrib: NYDUS_ATTRIBUTES) {
    this.mpq = new MPQArchive(file);
    const decoder = new VersionedDecoder(this.mpq.header.userDataHeader.content, protocol.TYPE_INFO);
    this.header = decoder.instance(protocol.REPLAY[2]);
  }

  public parseDetails(): any {
    return null;
  }
}

export class Parser {
  protected gameType: GameType;
  protected defDir: string = resolve(__dirname, "../def/");

  protected LATEST_PROTO: NYDUS_PROTOCOL | null;

  constructor(decl: GameType | string) {
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
    return new Replay(replayFile, this.LATEST_PROTO, attrib);
  }
}

export default { Parser };
