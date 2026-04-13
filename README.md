# react-native-image-exif

Extract EXIF metadata from images using native modules on iOS and Android.

---

## ✨ Features

* 📸 Read EXIF metadata from local image files
* ⚡ Native performance (Swift + Kotlin)
* 🌍 GPS (latitude, longitude, altitude) support
* 🔄 Cross-platform API (iOS & Android)
* 🧩 Raw EXIF data included

---

## 📦 Installation

```bash
yarn add react-native-image-exif
```

---

## 🚀 Usage

```ts
import { getExifFromPath } from 'react-native-image-exif';

const exif = await getExifFromPath(photo.path);

console.log(exif);
```

---

## 📊 Platform Data Comparison

### Field Support Matrix

| Category | Tag Name | iOS | Android |
| :--- | :--- | :---: | :---: |
| **Camera** | `FNumber` | ✅ | ✅ |
| | `ExposureTime` | ✅ | ✅ |
| | `ISOSpeedRatings` | ✅ | ✅ |
| | `ApertureValue` | ✅ | ✅ |
| | `FocalLength` | ✅ | ✅ |
| | `FocalLengthIn35mmFilm` | ❌ | ✅ |
| | `FocalLenIn35mmFilm` | ✅ | ❌ |
| | `ExposureProgram` | ✅ | ✅ |
| | `MeteringMode` | ✅ | ✅ |
| | `Flash` | ✅ | ✅ |
| | `LensModel` | ✅ | ❌ |
| | `LensMake` | ✅ | ❌ |
| | `LensSpecification` | ✅ | ❌ |
| | `ExposureMode` | ✅ | ❌ |
| | `ExposureBiasValue` | ✅ | ❌ |
| | `BrightnessValue` | ✅ | ❌ |
| | `LightSource` | ❌ | ✅ |
| | `MaxApertureValue` | ❌ | ✅ |
| **Location** | `latitude` | ✅ | ✅ |
| | `longitude` | ✅ | ✅ |
| | `altitude` | ✅ | ✅ |
| | `GPSLatitude` | ❌ | ✅ |
| | `GPSLongitude` | ❌ | ✅ |
| | `GPSLatitudeRef` | ❌ | ✅ |
| | `GPSLongitudeRef` | ❌ | ✅ |
| | `GPSAltitude` | ❌ | ✅ |
| | `GPSTimeStamp` | ❌ | ✅ |
| | `GPSDateStamp` | ❌ | ✅ |
| | `GPSSpeed` | ❌ | ✅ |
| | `GPSSpeedRef` | ❌ | ✅ |
| | `GPSProcessingMethod` | ❌ | ✅ |
| **Device** | `Make` | ✅ | ✅ |
| | `Model` | ✅ | ✅ |
| | `Software` | ✅ | ✅ |
| | `ImageUniqueID` | ✅ | ✅ |
| **Image** | `PixelXDimension` | ✅ | ❌ |
| | `PixelYDimension` | ✅ | ❌ |
| | `ImageWidth` | ❌ | ✅ |
| | `ImageLength` | ❌ | ✅ |
| | `Orientation` | ❌ | ✅ |
| | `RotationDegrees` | ✅ | ✅ |
| | `ColorSpace` | ✅ | ✅ |
| | `ComponentsConfiguration` | ✅ | ✅ |
| | `Compression` | ❌ | ✅ |
| | `ResolutionUnit` | ❌ | ✅ |
| | `XResolution` | ❌ | ✅ |
| | `YResolution` | ❌ | ✅ |
| | `YCbCrPositioning` | ❌ | ✅ |
| **Time** | `DateTimeOriginal` | ✅ | ✅ |
| | `DateTimeDigitized` | ✅ | ✅ |
| | `DateTime` | ❌ | ✅ |
| | `SubSecTimeOriginal` | ✅ | ✅ |
| | `SubSecTimeDigitized` | ✅ | ✅ |
| | `SubSecTime` | ❌ | ✅ |
| | `OffsetTime` | ✅ | ❌ |
| | `OffsetTimeOriginal` | ✅ | ❌ |
| | `OffsetTimeDigitized` | ✅ | ❌ |
| **Advanced** | `SceneCaptureType` | ✅ | ✅ |
| | `SceneType` | ✅ | ❌ |
| | `SensingMethod` | ✅ | ❌ |
| | `SubjectArea` | ✅ | ❌ |
| | `CustomRendered` | ✅ | ❌ |
| | `UserComment` | ✅ | ❌ |
| | `FlashPixVersion` | ✅ | ❌ |
| | `ExifVersion` | ✅ | ✅ |

> [!NOTE]  
> - On iOS, some EXIF fields may differ in naming or structure compared to Android.  
> - Device information such as `Make` and `Model` is often not directly exposed and may instead appear in fields like `LensMake` or `LensModel`, depending on the capture library.  
> - GPS-related EXIF fields (`GPSLatitude`, `GPSLongitude`, etc.) are typically not included in raw form on iOS, and are instead provided as normalized values (`latitude`, `longitude`, `altitude`).  
> - Field availability can vary based on the camera library (e.g., VisionCamera) and OS-level privacy or processing behavior.

---

## ⚠️ Platform Differences

EXIF data is handled differently on each platform:

### Android

* Returns **parsed numeric values**
* GPS is already converted to decimal format

```ts
latitude: 37.342178
longitude: 127.107992
```

---

### iOS

* Returns **raw EXIF values**
* Many fields are **fractions (e.g. "169/100")**
* GPS is returned in **DMS format**

```ts
GPSLatitude: "37/1,20/1,313136520/10000000"
```

---

## 💡 Recommended: Normalize EXIF Data

To ensure consistent results across platforms, you should normalize the output.

### Example

```ts
function parseFraction(value?: string | number): number | undefined {
  if (typeof value === 'number') return value;
  if (!value) return undefined;

  if (value.includes('/')) {
    const [num, den] = value.split('/').map(Number);
    return den ? num / den : undefined;
  }

  return Number(value);
}

function parseDMS(dms?: string, ref?: string): number | undefined {
  if (!dms) return undefined;

  const parts = dms.split(',').map(part => {
    const [num, den] = part.split('/').map(Number);
    return den ? num / den : 0;
  });

  const [deg, min, sec] = parts;
  let result = deg + min / 60 + sec / 3600;

  if (ref === 'S' || ref === 'W') result *= -1;

  return result;
}
```

---

## 📌 Notes

* `file://` paths are supported
* Android supports `content://` URIs
* Some EXIF fields may be missing depending on the image source

---

## 📄 License

MIT
