# react-native-image-exif

Read image metadata in React Native with native platform readers: `androidx.exifinterface` on Android and `ImageIO` on iOS.

`getExifFromPath()` returns one predictable result on both platforms: a small set of normalized fields for application code, and the native tags for device- or format-specific use.

## Installation

```sh
yarn add react-native-image-exif
cd ios && pod install
```

## Usage

```ts
import { getExifFromPath, type ImageMetadata } from 'react-native-image-exif';

const metadata: ImageMetadata = await getExifFromPath(
  'file:///path/to/photo.jpg'
);

console.log(metadata.normalized.camera?.model);
console.log(metadata.normalized.location?.latitude);
console.log(metadata.raw.DateTimeOriginal);
```

## Result shape

```ts
type ImageMetadata = {
  schemaVersion: 1;
  platform: 'ios' | 'android';
  normalized: {
    camera?: {
      make?: string;
      model?: string;
      software?: string;
    };
    capture?: {
      dateTimeOriginal?: string;
      dateTimeDigitized?: string;
    };
    image?: {
      width?: number;
      height?: number;
      rotationDegrees?: 0 | 90 | 180 | 270;
    };
    location?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
    exposure?: {
      iso?: number;
      exposureTimeSeconds?: number;
      fNumber?: number;
      focalLengthMm?: number;
    };
  };
  raw: Record<string, string | number | Array<string | number>>;
};
```

### `normalized`

Use `normalized` for product features. These fields have a stable meaning regardless of platform:

- GPS coordinates are decimal degrees and altitude is metres.
- Exposure fractions such as `1/125` and `28/10` are converted to numbers only when their meaning is unambiguous.
- `rotationDegrees` is `0`, `90`, `180`, or `270` when the platform supplies a valid image orientation.
- EXIF capture timestamps remain strings. The library does not invent a timezone when the source image has none.

Every field is optional. A missing value means the image or platform did not provide a value that can safely be normalized.

### `raw`

Use `raw` when your application needs a camera-vendor, OS, or image-format-specific tag. Keys retain the tag names provided by the native reader, such as `Make`, `Model`, `DateTimeOriginal`, `FNumber`, or `GPSLatitude`.

Raw tags are intentionally not a cross-platform contract. Their presence, names, and representations can differ by camera, image editor, image format, operating-system version, and native metadata library version. Always check whether a key exists before using it.

```ts
const { normalized, raw } = await getExifFromPath(uri);

// Preferred for normal app logic
const latitude = normalized.location?.latitude;

// Use only when a platform-specific tag is needed
const originalTimestamp = raw.DateTimeOriginal;
```

`schemaVersion` changes only when the normalized-data contract makes a breaking change. It allows consumers to version their own handling safely.

## Supported sources

| Source | Android | iOS | Example |
| --- | :---: | :---: | --- |
| Absolute local path | ✅ | ✅ | `/path/to/photo.jpg` |
| File URI | ✅ | ✅ | `file:///path/to/photo.jpg` |
| Content URI | ✅ | — | `content://media/...` |
| HTTPS URL | ✅ | ✅ | `https://example.com/photo.jpg` |
| HTTP URL | ✅* | ✅* | `http://example.com/photo.jpg` |
| Base64 Data URI | ✅ | ✅ | `data:image/jpeg;base64,/9j/...` |

`content://` is an Android ContentProvider mechanism and cannot be opened on iOS. Android access to a `content://` URI must still have been granted by its provider.

Remote requests use 15-second timeout settings. Remote and base64 inputs are limited to 25 MiB; oversized inputs reject with `E_INPUT_TOO_LARGE`. The Android library manifest declares `INTERNET`; HTTP can still be blocked by the host app's network-security policy. On iOS, HTTP can be blocked by the host app's App Transport Security policy; prefer HTTPS.

Only base64-encoded Data URIs are supported. Prefix a raw base64 string before passing it to the library:

```ts
const source = `data:image/jpeg;base64,${rawBase64}`;
const metadata = await getExifFromPath(source);
```

## Platform metadata

- **Android** obtains tags exposed by `ExifInterface`. It also derives decimal GPS values and `RotationDegrees`.
- **iOS** obtains EXIF and TIFF dictionaries through ImageIO. TIFF commonly provides `Make`, `Model`, and `Software`. iOS derives decimal GPS values but does not include raw GPS tags in `raw`.
- IPTC and XMP are not currently returned on iOS.
- Android includes `RotationDegrees` even when it is `0`; iOS includes it only if the source image has an orientation property.

The image must be supported by the operating system's metadata reader. A valid image can have no metadata, producing an empty `normalized` object and a sparse `raw` object.

## Migrating from 0.1.0

This is a breaking API change. `getExifFromPath()` no longer returns tags at the top level.

```ts
// Before
const exif = await getExifFromPath(uri);
console.log(exif.DateTimeOriginal);

// Now
const metadata = await getExifFromPath(uri);
console.log(metadata.raw.DateTimeOriginal);
console.log(metadata.normalized.capture?.dateTimeOriginal);
```

## Errors

The promise rejects with one of these error codes when applicable:

| Code | Meaning |
| --- | --- |
| `E_INVALID_PATH` | The supplied source is empty. |
| `E_FILE_NOT_FOUND` | The local path does not refer to a readable file. |
| `E_UNSUPPORTED_URI` | The URI scheme is unsupported on that platform. |
| `E_SOURCE_UNREADABLE` | Android could not open the supplied `content://` URI. |
| `E_INVALID_DATA_URI` | The Data URI is malformed, empty, or is not base64-encoded. |
| `E_INPUT_TOO_LARGE` | The base64 or remote image exceeds the 25 MiB input limit. |
| `E_REMOTE_FETCH` | Downloading a remote image failed or returned a non-2xx response. |
| `E_EXIF_READ` | The image could not be opened or its metadata could not be read. |

## License

MIT
