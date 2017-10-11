/// <reference types="node" />

// Goal: Main parser file
//

import { MPQArchive } from "mpyqjs";
import { resolve } from "path";
import * as HERO from "../def/heroes";
import * as S2 from "../def/s2";
import { Latest, Overmind } from "./tool/heroprotoc";

export enum GameType {
  HERO = 0,
  S2 = 1,
  ANY = 0x1000,
}

export class Replay {
  public mpq: MPQArchive;
  public protocol: NYDUS_PROTOCOL;
  public attributes: NYDUS_ATTRIBUTES;

  constructor(file: string, protocol: NYDUS_PROTOCOL, attrib: NYDUS_ATTRIBUTES) {
    this.mpq = new MPQArchive(file);
  }
}

export class Parser {
  protected gameType: GameType;
  protected defDir: string = resolve(__dirname, "../def/");
  protected attrFile: string = resolve(__dirname, "../def/");

  protected LATEST_PROTO: NYDUS_PROTOCOL | null;

  constructor(decl: GameType | string) {
    if(typeof decl === "string") {
      this.defDir = decl;
      this.gameType = GameType.ANY;
    } else {
      this.gameType = decl;
      if(this.gameType === GameType.HERO) {
        this.defDir = resolve(this.defDir, "heroes");
        this.attrFile = resolve(this.defDir, "heroes.js");
      } else if(this.gameType === GameType.S2) {
        this.defDir = resolve(this.defDir, "s2");
        this.attrFile = resolve(this.defDir, "s2.js");
      }
    }
  }

  public setGameType(gameType: GameType): void {
    this.gameType = gameType;
  }

  public setDefinitionDirectory(defDir: string): void {
    this.defDir = defDir;
  }

  public setAttributeFile(attrFile: string): void {
    this.attrFile = attrFile;
  }

  public async reload(): Promise<void> {
    this.LATEST_PROTO = await Latest(this.defDir);
    if(this.LATEST_PROTO == null) {
      throw new Error("Missing base protocol info");
    }
    return;
  }

  public async loadReplay(replayFile: string): Promise<Replay> {
    if(this.LATEST_PROTO == null) {
      throw new Error("Missing base protocol info, call reload first.");
    }
    let attrib: NYDUS_ATTRIBUTES = {};
    if(this.gameType === GameType.HERO) {
      attrib = HERO.ATTRIBUTES;
    } else if(this.gameType === GameType.S2) {
      attrib = S2.ATTRIBUTES;
    }
    return new Replay(replayFile, this.LATEST_PROTO, attrib);
  }
}

export default { Parser };
