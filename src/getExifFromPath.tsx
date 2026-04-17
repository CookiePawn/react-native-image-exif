import type { ExifData } from './types';

export async function getExifFromPath(
  _path: string
): Promise<ExifData> {
  throw new Error(
    'react-native-image-exif: getExifFromPath is only available on native (iOS/Android)'
  );
}
