/**
 * A single EXIF field value after normalization (strings, numbers, or small tuples).
 * Unknown or platform-specific tags still match this shape.
 *
 * @see README.md — Field Support Matrix
 */
type ExifValue = string | number | Array<string | number>;

/**
 * Metadata returned by `getExifFromPath`.
 *
 * Combines **shared** keys (iOS ✅ & Android ✅), platform-only keys, and any other tag
 * via the index signature. Runtime availability depends on the image and OS.
 */
export type ExifData = {
  /** iOS ✅ · Android ✅ — normalized decimal degrees */
  latitude?: number;
  /** iOS ✅ · Android ✅ — normalized decimal degrees */
  longitude?: number;
  /** iOS ✅ · Android ✅ — meters */
  altitude?: number;

  RotationDegrees?: number;
  FNumber?: ExifValue;
  ExposureTime?: ExifValue;
  ISOSpeedRatings?: ExifValue;
  ApertureValue?: ExifValue;
  FocalLength?: ExifValue;
  ExposureProgram?: ExifValue;
  MeteringMode?: ExifValue;
  Flash?: ExifValue;
  SceneCaptureType?: ExifValue;
  ExifVersion?: ExifValue;
  ColorSpace?: ExifValue;
  ComponentsConfiguration?: ExifValue;

  DateTimeOriginal?: ExifValue;
  DateTimeDigitized?: ExifValue;
  SubSecTimeOriginal?: ExifValue;
  SubSecTimeDigitized?: ExifValue;
} & ExifDataForAndroid &
  ExifDataForIOS &
  Record<string, ExifValue>;

/**
 * Tags that README lists as **Android ✅ · iOS ❌** (raw GPS/device/dimensions, etc.).
 */
type ExifDataForAndroid = {
  FocalLengthIn35mmFilm?: ExifValue;
  LightSource?: ExifValue;
  MaxApertureValue?: ExifValue;

  /** Android ✅ · iOS ❌ — raw EXIF (often rational string) */
  GPSLatitude?: ExifValue;
  GPSLongitude?: ExifValue;
  GPSLatitudeRef?: ExifValue;
  GPSLongitudeRef?: ExifValue;
  GPSAltitude?: ExifValue;
  GPSTimeStamp?: ExifValue;
  GPSDateStamp?: ExifValue;
  GPSSpeed?: ExifValue;
  GPSSpeedRef?: ExifValue;
  GPSProcessingMethod?: ExifValue;

  Make?: ExifValue;
  Model?: ExifValue;
  Software?: ExifValue;
  ImageUniqueID?: ExifValue;

  ImageWidth?: ExifValue;
  ImageLength?: ExifValue;
  /** Android ✅ · iOS ❌ — EXIF orientation tag (distinct from `RotationDegrees`) */
  Orientation?: ExifValue;

  Compression?: ExifValue;
  ResolutionUnit?: ExifValue;
  XResolution?: ExifValue;
  YResolution?: ExifValue;
  YCbCrPositioning?: ExifValue;

  DateTime?: ExifValue;
  SubSecTime?: ExifValue;
};

/**
 * Tags that README lists as **iOS ✅ · Android ❌** (alternate names, IPTC-like, etc.).
 */
type ExifDataForIOS = {
  /** iOS ✅ · Android ❌ — same semantics as Android’s `FocalLengthIn35mmFilm` */
  FocalLenIn35mmFilm?: ExifValue;

  LensModel?: ExifValue;
  LensMake?: ExifValue;
  LensSpecification?: ExifValue;

  ExposureMode?: ExifValue;
  ExposureBiasValue?: ExifValue;
  BrightnessValue?: ExifValue;

  PixelXDimension?: ExifValue;
  PixelYDimension?: ExifValue;

  OffsetTime?: ExifValue;
  OffsetTimeOriginal?: ExifValue;
  OffsetTimeDigitized?: ExifValue;

  SceneType?: ExifValue;
  SensingMethod?: ExifValue;
  SubjectArea?: ExifValue;
  CustomRendered?: ExifValue;
  UserComment?: ExifValue;
  FlashPixVersion?: ExifValue;
};
