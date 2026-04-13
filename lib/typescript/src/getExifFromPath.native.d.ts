export type ExifValue = string | number | Array<string | number>;
export type ExifData = Record<string, ExifValue>;
export declare function getExifFromPath(path: string): Promise<ExifData>;
//# sourceMappingURL=getExifFromPath.native.d.ts.map