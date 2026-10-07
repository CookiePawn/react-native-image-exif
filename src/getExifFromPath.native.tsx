import ImageExif from './NativeImageExif';
import { Platform } from 'react-native';

import { createImageMetadata } from './imageMetadata';
import type { ImageMetadata } from './types';

export async function getExifFromPath(path: string): Promise<ImageMetadata> {
  const raw = await ImageExif.getExifFromPath(path);
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  return createImageMetadata(raw, platform);
}
