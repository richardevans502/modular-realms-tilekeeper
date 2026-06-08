const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'wasm'])];

/** Prevent Metro from bundling Node-only libraries. */
config.resolver.blockList = [...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []), /node_modules[\/\\\\]pngjs[\/\\\\].*/];

module.exports = config;
