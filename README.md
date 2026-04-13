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

## 📊 Example Output

### 🤖 Android

```json
{
  "ApertureValue": 1.169925,
  "BrightnessValue": 3.958998,
  "DateTimeOriginal": "2026:04:13 16:19:20",
  "FNumber": 1.5,
  "FocalLength": 5.7,
  "ISOSpeedRatings": [50],
  "LensModel": "iPhone 13 Pro back camera 5.7mm f/1.5",
  "PixelXDimension": 4224,
  "PixelYDimension": 2376,
  "RotationDegrees": 90,
  "latitude": 37.342178,
  "longitude": 127.107992,
  "altitude": 70.842955
}
```

---

### 🍏 iOS

```json
{
  "ApertureValue": "169/100",
  "DateTimeOriginal": "2026:04:13 16:17:55",
  "FNumber": 1.8,
  "FocalLength": "425/100",
  "GPSLatitude": "37/1,20/1,313136520/10000000",
  "GPSLatitudeRef": "N",
  "GPSLongitude": "127/1,6/1,290196720/10000000",
  "GPSLongitudeRef": "E",
  "GPSAltitude": "855839/10000",
  "RotationDegrees": 90
}
```

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
