// JS seam so tsc does not typecheck agent-bundle-src. The package build
// follows these imports and bundles the install API into cargo-hauler-install.
export { formatInstallResult, formatUninstallResult } from '../node_modules/agent-bundle-src/packages/agent-bundle/src/install/format.ts';
export { installBundle } from '../node_modules/agent-bundle-src/packages/agent-bundle/src/install/install.ts';
export { uninstallBundle } from '../node_modules/agent-bundle-src/packages/agent-bundle/src/install/uninstall.ts';
