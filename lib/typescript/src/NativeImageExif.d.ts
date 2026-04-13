import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    getExifFromPath(path: string): Promise<Object>;
}
declare const _default: Spec;
export default _default;
//# sourceMappingURL=NativeImageExif.d.ts.map