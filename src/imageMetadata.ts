import type { ExifValue, ImageMetadata, RawExifData } from './types';

function firstValue(value: ExifValue | undefined): string | number | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function asString(value: ExifValue | undefined): string | undefined {
  const first = firstValue(value);
  if (typeof first === 'string') return first;
  if (typeof first === 'number' && Number.isFinite(first)) return String(first);
  return undefined;
}

function asNumber(value: ExifValue | undefined): number | undefined {
  const first = firstValue(value);
  if (typeof first === 'number')
    return Number.isFinite(first) ? first : undefined;
  if (typeof first !== 'string') return undefined;

  const text = first.trim();
  const fraction = /^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/.exec(
    text
  );
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (denominator === 0) return undefined;
    const result = numerator / denominator;
    return Number.isFinite(result) ? result : undefined;
  }

  const result = Number(text);
  return Number.isFinite(result) ? result : undefined;
}

function hasValues(value: object): boolean {
  return Object.values(value).some((item) => item !== undefined);
}

/**
 * Builds the stable JavaScript API from native tags without mutating those tags.
 * Keep parsing here deliberately conservative: ambiguous values remain in `raw`.
 */
export function createImageMetadata(
  raw: RawExifData,
  platform: ImageMetadata['platform']
): ImageMetadata {
  const rawTags = { ...raw };
  delete rawTags.latitude;
  delete rawTags.longitude;
  delete rawTags.altitude;
  delete rawTags.RotationDegrees;
  const camera = {
    make: asString(raw.Make),
    model: asString(raw.Model),
    software: asString(raw.Software),
  };
  const capture = {
    dateTimeOriginal: asString(raw.DateTimeOriginal),
    dateTimeDigitized: asString(raw.DateTimeDigitized),
  };
  const rotation = asNumber(raw.RotationDegrees);
  const rotationDegrees: 0 | 90 | 180 | 270 | undefined =
    rotation === 0 || rotation === 90 || rotation === 180 || rotation === 270
      ? rotation
      : undefined;
  const image = {
    width: asNumber(raw.ImageWidth) ?? asNumber(raw.PixelXDimension),
    height: asNumber(raw.ImageLength) ?? asNumber(raw.PixelYDimension),
    rotationDegrees,
  };
  const location = {
    latitude: asNumber(raw.latitude),
    longitude: asNumber(raw.longitude),
    altitude: asNumber(raw.altitude),
  };
  const exposure = {
    iso: asNumber(raw.ISOSpeedRatings),
    exposureTimeSeconds: asNumber(raw.ExposureTime),
    fNumber: asNumber(raw.FNumber),
    focalLengthMm: asNumber(raw.FocalLength),
  };

  return {
    schemaVersion: 1,
    platform,
    normalized: {
      ...(hasValues(camera) ? { camera } : {}),
      ...(hasValues(capture) ? { capture } : {}),
      ...(hasValues(image) ? { image } : {}),
      ...(hasValues(location) ? { location } : {}),
      ...(hasValues(exposure) ? { exposure } : {}),
    },
    raw: rawTags,
  };
}
