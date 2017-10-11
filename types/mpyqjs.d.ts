declare class MPQFileHeader {
  public magic: string;
  public headerSize: number;
  public archiveSize: number;
  public formatVersion: number;
  public sectorSizeShift: number;
  public hashTableOffset: number;
  public blockTableOffset: number;
  public hashTableEntries: number;
  public blockTableEntries: number;
}

declare class MPQFileHeaderExt {
  public extendedBlockTableOffset: number;
  public hashTableOffsetHigh: number;
  public blockTableOffsetHigh: number;
}

declare class MPQUserDataHeader {
	public magic: string;
	public userDataSize: number;
	public mpqHeaderOffset: number;
	public userDataHeaderSize: number;
}

declare class MPQHashTableEntry {
	public hashA: number;
	public hashB: number;
	public locale: number;
	public platform: number;
	public blockTableIndex: number;
}

declare class MPQBlockTableEntry {
	public offset: number;
	public archivedSize: number;
	public size: number;
	public flags: number;
}

export class MPQArchive {
  constructor(filename: string, listfile?: boolean);

  public readHeader(): MPQFileHeader | MPQFileHeaderExt | MPQUserDataHeader;
  public readMPQHeader(): MPQFileHeader | MPQFileHeaderExt;
  public readMPQUserDataHeader(): MPQUserDataHeader;
  public readTable(): MPQHashTableEntry[] | MPQHashTableEntry[];
  
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
}

export const version: string;
