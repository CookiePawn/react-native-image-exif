import type { ImageMetadata } from './types';

export async function getExifFromPath(
  _path: string
): Promise<ImageMetadata> {
  throw new Error(
    'react-native-image-exif: getExifFromPath is only available on native (iOS/Android)'
  );
}
