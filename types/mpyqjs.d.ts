declare module 'mpyqjs/mpyq' {
  export class MPQFileHeader {
    public magic: string;
    public headerSize: number;
    public archiveSize: number;
    public formatVersion: number;
    public sectorSizeShift: number;
    public hashTableOffset: number;
    public blockTableOffset: number;
    public hashTableEntries: number;
    public blockTableEntries: number;
    public extendedBlockTableOffset: number;
    public hashTableOffsetHigh: number;
    public blockTableOffsetHigh: number;
    public userDataHeader: MPQUserDataHeader;
  }

  export class MPQUserDataHeader {
    public magic: string;
    public userDataSize: number;
    public mpqHeaderOffset: number;
    public userDataHeaderSize: number;
    public content: Buffer;
  }

  export class MPQHashTableEntry {
    public hashA: number;
    public hashB: number;
    public locale: number;
    public platform: number;
    public blockTableIndex: number;
  }

  export class MPQBlockTableEntry {
    public offset: number;
    public archivedSize: number;
    public size: number;
    public flags: number;
  }

  export class MPQArchive {
    constructor(filename: string, listfile?: boolean);

    public readHeader(): MPQFileHeader;
    public readMPQHeader(): MPQFileHeader;
    public readMPQUserDataHeader(): MPQUserDataHeader;
    public readTable():  MPQHashTableEntry[];
    
    public getHashTableEntry(filename: string): MPQHashTableEntry;
    
    public readFile(filename: string, forceDecompress: boolean): Buffer;

    public extract(): Array<[string, Buffer]>;
    public extractToDisk(): void;
    public extractFiles(filenames: string[]): void;

    public printHeaders(): void;
    public printHashTable(): void;
    public printBlockTable(): void;
    public printFiles(): void;

    public _hash(string: string, hashType: string): number;
    public _decrypt(data: Buffer, key: string): Buffer;

    public encryptionTable: {[key: number]: number};
    public file: Buffer;
    public header: MPQFileHeader;
    public hashTable: MPQHashTableEntry[];
    public blockTable: MPQBlockTableEntry[];
    public files: string[];
  }

  export const version: string;
}
