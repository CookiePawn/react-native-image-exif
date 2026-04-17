import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type { ExifData } from './types';

export interface Spec extends TurboModule {
  getExifFromPath(path: string): Promise<ExifData>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageExif');
