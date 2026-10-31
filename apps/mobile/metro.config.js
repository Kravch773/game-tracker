// The app installs its own dependencies (it is not one of the root workspaces, so the site's lockfile stays as it
// is) and reads @gametracker/shared from the repository as TypeScript source.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, "../../packages/shared")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
// The repository root has the site's own React; the app must only ever see the copy in its node_modules.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
