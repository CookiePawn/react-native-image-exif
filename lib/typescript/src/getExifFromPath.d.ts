export type ExifValue = string | number | Array<string | number>;
export type ExifData = Record<string, ExifValue>;
export declare function getExifFromPath(_path: string): Promise<ExifData>;
//# sourceMappingURL=getExifFromPath.d.ts.map