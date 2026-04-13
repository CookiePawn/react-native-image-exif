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

There are subtle differences in how iOS and Android represent EXIF data. Below is a comparison based on the same photo properties.

### Data Format Differences

| Tag Name | iOS Example | Android Example | Format Note |
| :--- | :--- | :--- | :--- |
| **ApertureValue** | `1.169925` (Number) | `"169/100"` (String) | Android returns rational strings. |
| **FocalLength** | `5.7` (Number) | `"425/100"` (String) | Android returns rational strings. |
| **GPS Latitude** | `37.342178` (Number) | `"37/1,20/1,313.../1000"` | iOS is decimal, Android is DMS. |
| **GPS Longitude** | `127.107992` (Number) | `"127/1,6/1,290.../1000"` | iOS is decimal, Android is DMS. |
| **ExifVersion** | `[2, 3, 2]` (Array) | `[2, 2, 0]` (Array) | Consistent as Array. |
| **DateTime** | `"2026:04:13 16:37:31"` | `"2026:04:13 16:17:55"` | Consistent as String. |

---

### Field Support Matrix

| Category | Tag Name | iOS | Android |
| :--- | :--- | :---: | :---: |
| **Camera** | `FNumber` | ✅ | ✅ |
| | `ExposureTime` | ✅ | ✅ |
| | `ISOSpeedRatings` | ✅ | ✅ |
| | `LensModel` | ✅ | ❌ |
| | `Flash` | ✅ | ✅ |
| **Location** | `latitude` / `longitude` | ✅ | ✅ |
| | `altitude` | ✅ | ✅ |
| | `GPSLatitudeRef` / `GPSLongitudeRef` | ❌ | ✅ |
| **Device** | `Make` / `Model` | ❌* | ✅ |
| | `Software` | ❌ | ✅ |
| **Image** | `PixelXDimension` / `PixelYDimension` | ✅ | ❌ |
| | `ImageWidth` / `ImageLength` | ❌ | ✅ |
| | `RotationDegrees` | ✅ | ✅ |

> [!NOTE]  
> \* On iOS, `Make` and `Model` are often encapsulated within the `LensModel` or `LensMake` fields depending on the capture library used.

---

## 🛠 Usage Tips

### Handling Rational Numbers (Android)
Android often returns strings for numeric values (e.g., `"169/100"`). You can convert them to decimals like this:

```javascript
const parseRational = (rational) => {
  if (typeof rational !== 'string') return rational;
  const [num, den] = rational.split('/').map(Number);
  return num / den;
};

const aperture = parseRational(exif.ApertureValue); // 1.69

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
