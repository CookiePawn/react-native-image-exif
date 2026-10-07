# react-native-image-exif

Read image EXIF metadata in React Native with `androidx.exifinterface` on Android and `ImageIO` on iOS.

## Features

- Read metadata from local files, remote URLs, and base64 Data URIs
- Normalize GPS coordinates to decimal `latitude`, `longitude`, and `altitude`
- Return image rotation as `RotationDegrees`
- Support Android `content://` URIs

## Installation

```sh
yarn add react-native-image-exif
cd ios && pod install
```

## Usage

```ts
import { getExifFromPath, type ExifData } from 'react-native-image-exif';

const exif: ExifData = await getExifFromPath('file:///path/to/photo.jpg');

console.log(exif.DateTimeOriginal);
console.log(exif.latitude, exif.longitude);
```

The function name is retained for compatibility, but its argument is an image **source**, not only a filesystem path.

## Supported sources

| Source | Android | iOS | Example |
| --- | :---: | :---: | --- |
| Absolute local path | ✅ | ✅ | `/path/to/photo.jpg` |
| File URI | ✅ | ✅ | `file:///path/to/photo.jpg` |
| Content URI | ✅ | — | `content://media/...` |
| HTTPS URL | ✅ | ✅ | `https://example.com/photo.jpg` |
| HTTP URL | ✅* | ✅* | `http://example.com/photo.jpg` |
| Base64 Data URI | ✅ | ✅ | `data:image/jpeg;base64,/9j/...` |

`content://` is an Android ContentProvider mechanism and cannot be opened on iOS. On Android, access to a `content://` URI must still have been granted to the app by its provider.

Remote requests have a 15-second timeout. The Android library manifest declares `INTERNET`; HTTP can still be blocked by the host app's network-security policy. On iOS, HTTP can be blocked by the host app's App Transport Security policy; prefer HTTPS.

Only base64-encoded Data URIs are supported. If you have a raw base64 string, add a media type and prefix before passing it to the library:

```ts
const source = `data:image/jpeg;base64,${rawBase64}`;
const exif = await getExifFromPath(source);
```

## Returned data

`getExifFromPath` resolves to `ExifData`. Every EXIF tag is optional: cameras, image editors, transcoding, and privacy settings can remove or alter metadata.

The stable, cross-platform fields exposed by this library are:

| Field | Type | Meaning |
| --- | --- | --- |
| `latitude` | `number` | Decimal degrees; present only when both latitude and longitude are available |
| `longitude` | `number` | Decimal degrees; present only when both latitude and longitude are available |
| `altitude` | `number` | Metres; negative when GPS altitude reference indicates below sea level |
| `RotationDegrees` | `number` | Clockwise rotation derived from image orientation (`0`, `90`, `180`, or `270`) |

Common EXIF keys such as `DateTimeOriginal`, `FNumber`, `ExposureTime`, `ISOSpeedRatings`, `FocalLength`, `Flash`, and `ColorSpace` are returned when the underlying platform exposes them. `ExifData` also has an index signature, so platform- or image-specific tags can be accessed without a separate type.

```ts
const exif = await getExifFromPath(uri);

if (exif.latitude !== undefined && exif.longitude !== undefined) {
  console.log(`${exif.latitude}, ${exif.longitude}`);
}

console.log(exif.DateTimeOriginal);
console.log(exif.Make); // Available when the image contains camera metadata.
```

### Platform differences

The two native APIs do not expose an identical tag set or representation.

- **Android** enumerates the tags available through `ExifInterface`. Plain numeric values are returned as numbers; rational values such as `1/125` stay strings. A small set of multi-value tags, including `ISOSpeedRatings` and `ComponentsConfiguration`, is returned as arrays.
- **iOS** returns the ImageIO EXIF and TIFF dictionaries, plus normalized GPS coordinates and `RotationDegrees`. Camera fields such as `Make`, `Model`, and `Software` commonly come from TIFF. IPTC and XMP dictionaries are not currently returned.
- iOS does not return raw `GPSLatitude` or `GPSLongitude`; use the normalized `latitude` and `longitude` fields instead.
- `RotationDegrees` is always present on Android (including `0`). On iOS it is present only when the image contains an orientation property.

Do not rely on an individual vendor tag being present on both platforms. If your application needs a particular tag, test it with representative images on every target platform.

## Errors

The promise rejects with one of these error codes when applicable:

| Code | Meaning |
| --- | --- |
| `E_INVALID_PATH` | The supplied source is empty. |
| `E_FILE_NOT_FOUND` | The local path does not refer to a readable file. |
| `E_UNSUPPORTED_URI` | The URI scheme is unsupported on that platform. |
| `E_SOURCE_UNREADABLE` | Android could not open the supplied `content://` URI. |
| `E_INVALID_DATA_URI` | The Data URI is malformed, empty, or is not base64-encoded. |
| `E_REMOTE_FETCH` | Downloading a remote image failed or returned a non-2xx response. |
| `E_EXIF_READ` | The image could not be opened or its metadata could not be read. |

## Notes

- The image format must be supported by the operating system's EXIF reader.
- An image may be valid but contain no EXIF metadata; in that case the returned object can be empty (aside from Android's `RotationDegrees`).
- Read EXIF before stripping metadata or re-encoding a selected image if you need capture-time or location information.

## License

MIT
