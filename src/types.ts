/**
 * A single EXIF field value after normalization (strings, numbers, or small tuples).
 * Unknown or platform-specific tags still match this shape.
 *
 * @see README.md — Returned data
 */
export type ExifValue = string | number | Array<string | number>;

/**
 * Raw metadata returned by the native platform reader.
 *
 * Combines **shared** keys (iOS ✅ & Android ✅), platform-only keys, and any other tag
 * via the index signature. Runtime availability depends on the image and OS.
 */
export type RawExifData = {
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
  /** Camera metadata; commonly sourced from iOS TIFF metadata. */
  Make?: ExifValue;
  Model?: ExifValue;
  Software?: ExifValue;

  DateTimeOriginal?: ExifValue;
  DateTimeDigitized?: ExifValue;
  SubSecTimeOriginal?: ExifValue;
  SubSecTimeDigitized?: ExifValue;
} & ExifDataForAndroid &
  ExifDataForIOS &
  Record<string, ExifValue>;

export type ImageMetadata = {
  /** Increment when the normalized-data contract makes a breaking change. */
  schemaVersion: 1;
  platform: 'ios' | 'android';
  /** Values with a consistent meaning across platforms. Every field is optional. */
  normalized: {
    camera?: {
      make?: string;
      model?: string;
      software?: string;
    };
    capture?: {
      /** Original EXIF timestamp; it is not converted because a timezone may be absent. */
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
  /** Platform-provided tags, retained without changing their key names. */
  raw: RawExifData;
};

/** Metadata returned by `getExifFromPath`. */
export type ExifData = ImageMetadata;

/**
 * Android-specific or Android-only raw tags.
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
 * iOS-specific raw tags and alternate key names.
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
