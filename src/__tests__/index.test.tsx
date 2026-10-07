import { describe, expect, it } from '@jest/globals';

import { createImageMetadata } from '../imageMetadata';

describe('createImageMetadata', () => {
  it('keeps native tags while deriving stable fields', () => {
    const metadata = createImageMetadata(
      {
        Make: 'Apple',
        Model: 'iPhone 16 Pro',
        ImageWidth: 4032,
        ImageLength: '3024',
        FNumber: '28/10',
        ExposureTime: '1/125',
        ISOSpeedRatings: [50],
        latitude: 37.5665,
        longitude: 126.978,
        RotationDegrees: 90,
      },
      'android'
    );

    expect(metadata).toMatchObject({
      schemaVersion: 1,
      platform: 'android',
      normalized: {
        camera: { make: 'Apple', model: 'iPhone 16 Pro' },
        image: { width: 4032, height: 3024, rotationDegrees: 90 },
        location: { latitude: 37.5665, longitude: 126.978 },
        exposure: { iso: 50, fNumber: 2.8, exposureTimeSeconds: 0.008 },
      },
      raw: { FNumber: '28/10' },
    });
  });

  it('does not invent normalized values for malformed tags', () => {
    const metadata = createImageMetadata(
      { ExposureTime: 'not-a-number', RotationDegrees: 45 },
      'ios'
    );

    expect(metadata.normalized.exposure).toBeUndefined();
    expect(metadata.normalized.image).toBeUndefined();
    expect(metadata.raw).toEqual({
      ExposureTime: 'not-a-number',
    });
  });
});
