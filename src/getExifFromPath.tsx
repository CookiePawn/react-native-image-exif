export type ExifValue = string | number | Array<string | number>;
export type ExifData = Record<string, ExifValue>;

export async function getExifFromPath(
  _path: string
): Promise<ExifData> {
  throw new Error(
    'react-native-image-exif: getExifFromPath is only available on native (iOS/Android)'
  );
}
