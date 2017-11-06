import { MPQArchive } from "mpyqjs/mpyq";
export declare enum GameType {
    HERO = 0,
    S2 = 1,
    ANY = 4096,
}
export declare class Replay {
    mpq: MPQArchive;
    protocol: NYDUS_PROTOCOL | null;
    attributes: NYDUS_ATTRIBUTES;
    header: any;
    constructor(file: string, protocol: NYDUS_PROTOCOL, attrib: NYDUS_ATTRIBUTES, parent: Parser);
    ready(): boolean;
    parseDetails(): any;
    parseInitData(): any;
    parseGameEvents(onEvent: Function): any;
    parseMessageEvents(onEvent: Function): any;
    parseTrackerEvents(onEvent: Function): any;
    parseAttributeEvents(): any;
    private varInt(decoder);
    private decodeEventStream(decoder, onEvent, eventidTypeid, eventTypes, decodeUserId);
}
export declare class Parser {
    protected gameType: GameType;
    protected defDir: string;
    protected LATEST_PROTO: NYDUS_PROTOCOL | null;
    protected shouldDownloadProtocol: boolean;
    constructor(decl: GameType | string, shouldDownload?: boolean);
    setGameType(gameType: GameType): void;
    setDefinitionDirectory(defDir: string): void;
    reload(): Promise<void>;
    loadReplay(replayFile: string, attrib?: NYDUS_ATTRIBUTES): Promise<Replay>;
    loadProtocol(version: number): Promise<NYDUS_PROTOCOL | null>;
}
declare const _default: {
    Parser: typeof Parser;
};
export default _default;
