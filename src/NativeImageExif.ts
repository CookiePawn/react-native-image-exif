import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

import type { RawExifData } from './types';

export interface Spec extends TurboModule {
  getExifFromPath(path: string): Promise<RawExifData>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageExif');
