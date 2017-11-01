import { MPQArchive } from "mpyqjs/mpyq";
export declare enum GameType {
    HERO = 0,
    S2 = 1,
    ANY = 4096,
}
export declare class Replay {
    mpq: MPQArchive;
    protocol: NYDUS_PROTOCOL;
    attributes: NYDUS_ATTRIBUTES;
    header: any;
    constructor(file: string, protocol: NYDUS_PROTOCOL, attrib: NYDUS_ATTRIBUTES);
    parseDetails(): any;
}
export declare class Parser {
    protected gameType: GameType;
    protected defDir: string;
    protected LATEST_PROTO: NYDUS_PROTOCOL | null;
    constructor(decl: GameType | string);
    setGameType(gameType: GameType): void;
    setDefinitionDirectory(defDir: string): void;
    reload(): Promise<void>;
    loadReplay(replayFile: string, attrib?: NYDUS_ATTRIBUTES): Promise<Replay>;
}
declare const _default: {
    Parser: typeof Parser;
};
export default _default;
