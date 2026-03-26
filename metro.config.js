const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// In Expo Go, react-native-maps native module is unavailable.
// Redirect to a mock that renders a placeholder UI.
// When using a dev build (EAS / local Xcode build), remove this resolver
// so the real react-native-maps is used with full GPS map support.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-maps') {
    return {
      filePath: path.resolve(__dirname, 'mocks/react-native-maps.tsx'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'react-native-health') {
    return {
      filePath: path.resolve(__dirname, 'mocks/react-native-health.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
