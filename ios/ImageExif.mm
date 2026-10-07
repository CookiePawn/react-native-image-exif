#import "ImageExif.h"
#import <ImageIO/ImageIO.h>
#import <React/RCTBridgeModule.h>

@implementation ImageExif

static const NSUInteger kMaximumInputBytes = 25 * 1024 * 1024;
static const NSUInteger kMaximumBase64PayloadCharacters = (kMaximumInputBytes * 4 / 3) + 4;

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

static void addNormalizedMetadata(NSMutableDictionary *result, NSDictionary *metadata)
{
  for (NSString *key in metadata) {
    // EXIF values are added before TIFF values and take precedence on a collision.
    if (result[key] != nil) {
      continue;
    }
    id normalized = normalizeExifValue(metadata[key]);
    if (normalized != nil) {
      result[key] = normalized;
    }
  }
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

// Takes ownership of source and always releases it before returning.
- (void)resolveExifFromImageSource:(CGImageSourceRef)source
                            resolve:(RCTPromiseResolveBlock)resolve
                             reject:(RCTPromiseRejectBlock)reject
{
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
      addNormalizedMetadata(result, exif);
    }

    // Camera make, model, and software normally live in the TIFF dictionary,
    // rather than the EXIF dictionary.
    NSDictionary *tiff = props[(NSString *)kCGImagePropertyTIFFDictionary];
    if (tiff) {
      addNormalizedMetadata(result, tiff);
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

- (void)readRemoteURL:(NSURL *)url
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
  NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration ephemeralSessionConfiguration];
  configuration.timeoutIntervalForRequest = 15.0;
  configuration.timeoutIntervalForResource = 15.0;
  NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];
  [[session downloadTaskWithURL:url
          completionHandler:^(NSURL *location, NSURLResponse *response, NSError *error) {
            if (error != nil) {
              reject(@"E_REMOTE_FETCH", error.localizedDescription, error);
              return;
            }
            NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
            if (![response isKindOfClass:[NSHTTPURLResponse class]] ||
                httpResponse.statusCode < 200 || httpResponse.statusCode >= 300) {
              NSString *message = [NSString stringWithFormat:@"Could not fetch image (HTTP %ld)",
                                                           (long)httpResponse.statusCode];
              reject(@"E_REMOTE_FETCH", message, nil);
              return;
            }
            if (response.expectedContentLength > kMaximumInputBytes) {
              reject(@"E_INPUT_TOO_LARGE", @"Remote image exceeds 26214400 bytes", nil);
              return;
            }
            if (location == nil) {
              reject(@"E_REMOTE_FETCH", @"Remote image response is empty", nil);
              return;
            }
            NSDictionary *attributes =
                [[NSFileManager defaultManager] attributesOfItemAtPath:location.path error:nil];
            NSNumber *fileSize = attributes[NSFileSize];
            if (fileSize.unsignedLongLongValue > kMaximumInputBytes) {
              reject(@"E_INPUT_TOO_LARGE", @"Remote image exceeds 26214400 bytes", nil);
              return;
            }
            CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)location, NULL);
            if (!source) {
              reject(@"E_EXIF_READ", @"Could not open remote image", nil);
              return;
            }
            [self resolveExifFromImageSource:source resolve:resolve reject:reject];
          }] resume];
}

- (void)getExifFromPath:(NSString *)path
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  NSString *sourceString =
      [path stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if (sourceString.length == 0) {
    reject(@"E_INVALID_PATH", @"Empty path", nil);
    return;
  }

  if ([sourceString hasPrefix:@"data:"]) {
    NSRange separator = [sourceString rangeOfString:@","];
    if (separator.location == NSNotFound) {
      reject(@"E_INVALID_DATA_URI", @"Data URI is missing a payload", nil);
      return;
    }
    NSString *metadata = [sourceString substringToIndex:separator.location];
    if ([metadata rangeOfString:@";base64" options:NSCaseInsensitiveSearch].location == NSNotFound) {
      reject(@"E_INVALID_DATA_URI", @"Only base64-encoded data URIs are supported", nil);
      return;
    }
    NSString *payload = [sourceString substringFromIndex:separator.location + 1];
    if (payload.length > kMaximumBase64PayloadCharacters) {
      reject(@"E_INPUT_TOO_LARGE", @"Base64 image exceeds 26214400 bytes", nil);
      return;
    }
    NSData *data = [[NSData alloc] initWithBase64EncodedString:payload
                                                        options:0];
    if (data.length == 0) {
      reject(@"E_INVALID_DATA_URI", @"Invalid or empty base64 image data", nil);
      return;
    }
    if (data.length > kMaximumInputBytes) {
      reject(@"E_INPUT_TOO_LARGE", @"Base64 image exceeds 26214400 bytes", nil);
      return;
    }
    CGImageSourceRef imageSource = CGImageSourceCreateWithData((__bridge CFDataRef)data, NULL);
    if (!imageSource) {
      reject(@"E_EXIF_READ", @"Could not open base64 image", nil);
      return;
    }
    [self resolveExifFromImageSource:imageSource resolve:resolve reject:reject];
    return;
  }

  NSURL *url = [NSURL URLWithString:sourceString];
  NSString *scheme = url.scheme.lowercaseString;
  if ([scheme isEqualToString:@"http"] || [scheme isEqualToString:@"https"]) {
    [self readRemoteURL:url resolve:resolve reject:reject];
    return;
  }
  if ([scheme isEqualToString:@"content"]) {
    reject(@"E_UNSUPPORTED_URI", @"content:// URIs are only supported on Android", nil);
    return;
  }
  if (scheme != nil && ![scheme isEqualToString:@"file"]) {
    reject(@"E_UNSUPPORTED_URI",
           [NSString stringWithFormat:@"Unsupported image URI scheme: %@", scheme], nil);
    return;
  }

  NSString *filePath = [scheme isEqualToString:@"file"] ? url.path : sourceString;
  BOOL isDir = NO;
  if (![[NSFileManager defaultManager] fileExistsAtPath:filePath isDirectory:&isDir] || isDir) {
    reject(@"E_FILE_NOT_FOUND", [NSString stringWithFormat:@"File not found: %@", sourceString], nil);
    return;
  }
  NSURL *fileURL = [NSURL fileURLWithPath:filePath];
  CGImageSourceRef imageSource = CGImageSourceCreateWithURL((__bridge CFURLRef)fileURL, NULL);
  if (!imageSource) {
    reject(@"E_EXIF_READ", @"Could not open image", nil);
    return;
  }
  [self resolveExifFromImageSource:imageSource resolve:resolve reject:reject];
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
