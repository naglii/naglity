// Metro config tuned for this pnpm monorepo.
// Watches the workspace root so Metro can resolve hoisted/symlinked deps,
// and pins resolution to the repo's node_modules folders.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Keep Expo's defaults; add the workspace root so Metro can resolve hoisted deps.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
