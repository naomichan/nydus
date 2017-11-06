export declare function Overmind(dir: string, version: number, shouldDownload?: boolean): Promise<NYDUS_PROTOCOL | null>;
export declare function Latest(dir: string): Promise<NYDUS_PROTOCOL | null>;
export declare function Generate(contents: string, version: number): string;
declare const _default: {
    Generate: (contents: string, version: number) => string;
    Overmind: (dir: string, version: number, shouldDownload?: boolean) => Promise<NYDUS_PROTOCOL | null>;
};
export default _default;
