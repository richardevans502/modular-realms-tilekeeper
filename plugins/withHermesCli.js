const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin: patch the generated Android app/build.gradle so that
 * local release builds use the hermes-engine-cli binary instead of the
 * react-native/hermes-compiler npm package's missing %OS-BIN% path.
 */
function withHermesCli(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }
    const original = config.modResults.contents;

    const hermesCommandPath =
      'hermesCommand = file("../../node_modules/hermes-engine-cli/linux64-bin/hermesc").absolutePath';

    // Match either the old Expo path or the current hermes-compiler path.
    const fixed = original.replace(
      /hermesCommand\s*=\s*(?:file\("\.\.\/\.\.\/node_modules\/react-native\/sdks\/hermesc\/%OS-BIN%\/hermesc"\)\.absolutePath|new File\(\["node",\s*"--print",\s*"require\.resolve\('hermes-compiler\/package\.json',\s*\{\s*paths:\s*\[require\.resolve\('react-native\/package\.json'\)\]\s*\}\)"\]\.execute\(null,\s*rootDir\)\.text\.trim\(\)\)\.getParentFile\(\)\.getAbsolutePath\(\)\s*\+\s*"\/hermesc\/%OS-BIN%\/hermesc")/,
      hermesCommandPath
    );

    if (fixed !== original) {
      config.modResults.contents = fixed;
    }
    return config;
  });
}

module.exports = withHermesCli;
