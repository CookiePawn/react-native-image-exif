const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// The library package lives at the workspace root while this app is the Metro
// project root. Watching the workspace makes the linked package resolvable
// without replacing Metro's standard entry-file resolver.
config.watchFolders = [root];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-image-exif': root,
};

module.exports = config;
