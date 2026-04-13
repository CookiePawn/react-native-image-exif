export async function getExifFromPath(
  _path: string
): Promise<Record<string, string | number>> {
  throw new Error(
    'react-native-image-exif: getExifFromPath is only available on native (iOS/Android)'
  );
}
