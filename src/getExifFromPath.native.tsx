import ImageExif from './NativeImageExif';
import type { ExifData } from './types';

export function getExifFromPath(path: string): Promise<ExifData> {
  return ImageExif.getExifFromPath(path);
}
