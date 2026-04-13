import ImageExif from './NativeImageExif';

export function getExifFromPath(
  path: string
): Promise<Record<string, string | number>> {
  return ImageExif.getExifFromPath(path) as Promise<
    Record<string, string | number>
  >;
}
