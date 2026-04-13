import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getExifFromPath(path: string): Promise<Object>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ImageExif');
