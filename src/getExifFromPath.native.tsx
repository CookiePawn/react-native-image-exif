import ImageExif from './NativeImageExif';

export type ExifValue = string | number | Array<string | number>;
export type ExifData = Record<string, ExifValue>;

export function getExifFromPath(
  path: string
): Promise<ExifData> {
  return ImageExif.getExifFromPath(path) as Promise<ExifData>;
}
