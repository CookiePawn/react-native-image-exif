#import "ImageExif.h"
#import <ImageIO/ImageIO.h>
#import <React/RCTBridgeModule.h>

@implementation ImageExif

static NSInteger rotationDegreesFromOrientation(NSInteger orientation)
{
  switch (orientation) {
    case 1:
      return 0;
    case 3:
      return 180;
    case 6:
      return 90;
    case 8:
      return 270;
    case 2:
      return 0;
    case 4:
      return 180;
    case 5:
      return 90;
    case 7:
      return 270;
    default:
      return 0;
  }
}

static NSString *stringifyExifValue(id value)
{
  if (value == nil || value == [NSNull null]) {
    return nil;
  }
  if ([value isKindOfClass:[NSString class]]) {
    return (NSString *)value;
  }
  if ([value isKindOfClass:[NSNumber class]]) {
    return [(NSNumber *)value stringValue];
  }
  if ([value isKindOfClass:[NSDate class]]) {
    return [NSString stringWithFormat:@"%@", value];
  }
  if ([value isKindOfClass:[NSData class]]) {
    return [(NSData *)value base64EncodedStringWithOptions:0];
  }
  return [value description];
}

static id normalizeExifValue(id value)
{
  if (value == nil || value == [NSNull null]) {
    return nil;
  }

  if ([value isKindOfClass:[NSNumber class]]) {
    return value;
  }

  if ([value isKindOfClass:[NSString class]]) {
    NSString *s = (NSString *)value;
    NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];
    formatter.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
    NSNumber *n = [formatter numberFromString:s];
    return n != nil ? n : s;
  }

  if ([value isKindOfClass:[NSArray class]]) {
    NSArray *arr = (NSArray *)value;
    NSMutableArray *out = [NSMutableArray arrayWithCapacity:arr.count];
    for (id item in arr) {
      id normalized = normalizeExifValue(item);
      if (normalized != nil) {
        [out addObject:normalized];
      }
    }
    return out;
  }

  if ([value isKindOfClass:[NSDate class]] || [value isKindOfClass:[NSData class]]) {
    NSString *s = stringifyExifValue(value);
    return s.length > 0 ? s : nil;
  }

  NSString *fallback = [value description];
  return fallback.length > 0 ? fallback : nil;
}

static double coordinateFromEXIFValue(id value, NSString *ref, BOOL isLatitude)
{
  double coord = NAN;
  if ([value isKindOfClass:[NSNumber class]]) {
    coord = [(NSNumber *)value doubleValue];
  } else if ([value isKindOfClass:[NSArray class]]) {
    NSArray *parts = (NSArray *)value;
    if (parts.count >= 3) {
      coord = [parts[0] doubleValue] + [parts[1] doubleValue] / 60.0 +
              [parts[2] doubleValue] / 3600.0;
    }
  }
  if (isnan(coord)) {
    return NAN;
  }
  if (isLatitude) {
    if ([ref isEqualToString:@"S"]) {
      coord = -coord;
    }
  } else {
    if ([ref isEqualToString:@"W"]) {
      coord = -coord;
    }
  }
  return coord;
}

- (void)getExifFromPath:(NSString *)path
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  NSString *cleanPath = path;
  if ([cleanPath hasPrefix:@"file://"]) {
    cleanPath = [cleanPath substringFromIndex:7];
  }
  cleanPath = [cleanPath stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if (cleanPath.length == 0) {
    reject(@"E_INVALID_PATH", @"Empty path", nil);
    return;
  }
  BOOL isDir = NO;
  if (![[NSFileManager defaultManager] fileExistsAtPath:cleanPath isDirectory:&isDir] || isDir) {
    reject(@"E_FILE_NOT_FOUND", [NSString stringWithFormat:@"File not found: %@", cleanPath], nil);
    return;
  }

  NSURL *url = [NSURL fileURLWithPath:cleanPath];
  CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
  if (!source) {
    reject(@"E_EXIF_READ", @"Could not open image", nil);
    return;
  }

  @try {
    NSDictionary *props =
        (__bridge_transfer NSDictionary *)CGImageSourceCopyPropertiesAtIndex(source, 0, NULL);
    CFRelease(source);

    if (!props) {
      resolve(@{});
      return;
    }

    NSMutableDictionary *result = [NSMutableDictionary dictionary];

    NSDictionary *exif = props[(NSString *)kCGImagePropertyExifDictionary];
    if (exif) {
      for (NSString *key in exif) {
        id raw = exif[key];
        id normalized = normalizeExifValue(raw);
        if (normalized != nil) {
          result[key] = normalized;
        }
      }
    }

    NSNumber *orientation = props[(NSString *)kCGImagePropertyOrientation];
    if (orientation != nil) {
      NSInteger deg = rotationDegreesFromOrientation([orientation integerValue]);
      result[@"RotationDegrees"] = @(deg);
    }

    NSDictionary *gps = props[(NSString *)kCGImagePropertyGPSDictionary];
    if (gps) {
      NSString *latRef = gps[(NSString *)kCGImagePropertyGPSLatitudeRef];
      NSString *lonRef = gps[(NSString *)kCGImagePropertyGPSLongitudeRef];
      id latVal = gps[(NSString *)kCGImagePropertyGPSLatitude];
      id lonVal = gps[(NSString *)kCGImagePropertyGPSLongitude];
      double lat = coordinateFromEXIFValue(latVal, latRef, YES);
      double lon = coordinateFromEXIFValue(lonVal, lonRef, NO);
      if (!isnan(lat) && !isnan(lon)) {
        result[@"latitude"] = @(lat);
        result[@"longitude"] = @(lon);
      }

      NSNumber *alt = gps[(NSString *)kCGImagePropertyGPSAltitude];
      NSNumber *altRef = gps[(NSString *)kCGImagePropertyGPSAltitudeRef];
      if (alt != nil) {
        double altVal = [alt doubleValue];
        if (altRef != nil && [altRef integerValue] == 1) {
          altVal = -altVal;
        }
        result[@"altitude"] = @(altVal);
      }
    }

    resolve(result);
  } @catch (NSException *exception) {
    reject(@"E_EXIF_READ", exception.reason, nil);
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeImageExifSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"ImageExif";
}

@end
