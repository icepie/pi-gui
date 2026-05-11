import { constants, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import asar from "@electron/asar";

const requiredPackages = [
  "@xterm/addon-clipboard",
  "@xterm/addon-fit",
  "@xterm/addon-web-links",
  "@xterm/xterm",
  "balanced-match",
  "brace-expansion",
  "chalk",
  "clawhub",
  "glob",
  "hosted-git-info",
  "lru-cache",
  "minimatch",
  "node-pty",
];
const clipboardNativePackagesByTarget = {
  "darwin-arm64": "@mariozechner/clipboard-darwin-arm64",
  "darwin-x64": "@mariozechner/clipboard-darwin-x64",
  "linux-arm64": "@mariozechner/clipboard-linux-arm64-gnu",
  "linux-x64": "@mariozechner/clipboard-linux-x64-gnu",
  "win32-arm64": "@mariozechner/clipboard-win32-arm64-msvc",
  "win32-x64": "@mariozechner/clipboard-win32-x64-msvc",
  "win-arm64": "@mariozechner/clipboard-win32-arm64-msvc",
  "win-x64": "@mariozechner/clipboard-win32-x64-msvc",
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const packagedMacAppName = "飞度小派.app";
const packagePlatform = (process.env.PI_APP_PACKAGE_PLATFORM ?? process.platform).trim().toLowerCase();
const packageArch = (process.env.PI_APP_PACKAGE_ARCH ?? process.arch).trim().toLowerCase();
const asarPath = resolveAsarPath(desktopDir, packagePlatform);
const notificationHelperPath =
  packagePlatform === "darwin"
    ? resolveMacAppFilePath(desktopDir, ["Contents", "MacOS", "pi-gui-notification-status-helper"], packagedMacAppName)
    : undefined;
const requiredPiCodingAgentVersion = resolveInstalledPackageVersion("@mariozechner/pi-coding-agent");

if (!existsSync(asarPath)) {
  throw new Error(`Packaged app.asar not found at ${asarPath}. Run the packaging step first.`);
}

if (notificationHelperPath && !existsSync(notificationHelperPath)) {
  throw new Error(`Packaged app is missing notification helper: ${notificationHelperPath}`);
}

const extractedDir = mkdtempSync(path.join(tmpdir(), "pi-gui-packaged-runtime-"));
try {
  verifyRequiredPackages(asarPath);
  await verifyPackagedPiRuntime(asarPath, extractedDir);
  await verifyNativeNodePty(asarPath);
  verifyNativeClipboard(asarPath);
  verifyPackagedWindowsGitBash(asarPath);
  await verifyPackagedElectronNodeProxy(asarPath);
  verifyPackagedWindowsManagedRuntime(asarPath);
} finally {
  rmSync(extractedDir, { recursive: true, force: true });
}

console.log(`Verified packaged runtime dependencies in ${asarPath}`);

function resolveAsarPath(desktopDir, packagePlatform) {
  if (packagePlatform === "darwin") {
    const targetScopedAsarPath = resolveMacAppFilePath(
      desktopDir,
      ["Contents", "Resources", "app.asar"],
      packagedMacAppName,
    );
    if (existsSync(targetScopedAsarPath)) {
      return targetScopedAsarPath;
    }

    return targetScopedAsarPath;
  }

  if (packagePlatform === "linux") {
    const releaseDir = path.join(desktopDir, "release");
    const dirReleaseDir = path.join(releaseDir, `linux-${packageArch}-dir`);
    const targetReleaseDirs = ["rpm", "deb", "appimage"].map((target) =>
      path.join(releaseDir, `linux-${packageArch}-${target}`),
    );
    const packagedReleaseDir = path.join(releaseDir, `linux-${packageArch}`);
    const scopedReleaseDirs = [dirReleaseDir, ...targetReleaseDirs, packagedReleaseDir].filter((candidatePath) =>
      existsSync(candidatePath),
    );
    const existingScopedReleaseDir = scopedReleaseDirs.find((candidatePath) => existsSync(candidatePath));
    const unpackedAsarPath = findFirstExistingPath([
      ...scopedReleaseDirs.map((releasePath) => path.join(releasePath, "linux-unpacked", "resources", "app.asar")),
      ...scopedReleaseDirs.map((releasePath) =>
        path.join(releasePath, `linux-${packageArch}-unpacked`, "resources", "app.asar"),
      ),
    ]);

    if (unpackedAsarPath) {
      return unpackedAsarPath;
    }
    if (existingScopedReleaseDir) {
      throw new Error(`Target-scoped Linux release exists but is missing app.asar: ${existingScopedReleaseDir}`);
    }

    const legacyAsarPath = findFirstExistingPath(listNestedUnpackedAsarPaths(releaseDir, /^linux(?:-[\w]+)?-unpacked$/));
    if (legacyAsarPath) {
      return legacyAsarPath;
    }

    return path.join(releaseDir, "linux-unpacked", "resources", "app.asar");
  }

  if (packagePlatform === "win32" || packagePlatform === "win") {
    const releaseDir = path.join(desktopDir, "release");
    const dirReleaseDir = path.join(releaseDir, `win32-${packageArch}-dir`);
    const packagedReleaseDir = path.join(releaseDir, `win32-${packageArch}`);
    const scopedReleaseDirs = [dirReleaseDir, packagedReleaseDir].filter((candidatePath) =>
      existsSync(candidatePath),
    );
    const existingScopedReleaseDir = scopedReleaseDirs.find((candidatePath) => existsSync(candidatePath));
    const unpackedAsarPath = findFirstExistingPath([
      ...scopedReleaseDirs.map((releasePath) => path.join(releasePath, "win-unpacked", "resources", "app.asar")),
      ...scopedReleaseDirs.map((releasePath) =>
        path.join(releasePath, `win-${packageArch}-unpacked`, "resources", "app.asar"),
      ),
    ]);

    if (unpackedAsarPath) {
      return unpackedAsarPath;
    }
    if (existingScopedReleaseDir) {
      throw new Error(`Target-scoped Windows release exists but is missing app.asar: ${existingScopedReleaseDir}`);
    }

    const legacyAsarPath = findFirstExistingPath(listNestedUnpackedAsarPaths(releaseDir, /^win(?:-[\w]+)?-unpacked$/));
    if (legacyAsarPath) {
      return legacyAsarPath;
    }

    return path.join(releaseDir, "win-unpacked", "resources", "app.asar");
  }

  throw new Error(`Unsupported packaged runtime dependency target: ${packagePlatform}`);
}

function resolveMacAppFilePath(desktopDir, relativeParts, preferredAppName) {
  const releaseDir = path.join(desktopDir, "release");
  const scopedReleaseDirs = [
    path.join(releaseDir, `darwin-${packageArch}-dir`),
    path.join(releaseDir, `darwin-${packageArch}`),
    path.join(releaseDir, "mac-arm64"),
  ].filter((candidatePath) => existsSync(candidatePath));
  const candidatePaths = [];

  for (const releasePath of scopedReleaseDirs) {
    const macDir = path.join(releasePath, `mac${packageArch === "arm64" ? "-arm64" : ""}`);
    candidatePaths.push(...listMacAppFilePaths(macDir, relativeParts, preferredAppName));
    candidatePaths.push(...listMacAppFilePaths(releasePath, relativeParts, preferredAppName));
  }

  return findFirstExistingPath(candidatePaths) ?? path.join(
    releaseDir,
    `darwin-${packageArch}-dir`,
    `mac${packageArch === "arm64" ? "-arm64" : ""}`,
    preferredAppName,
    ...relativeParts,
  );
}

function listMacAppFilePaths(parentDir, relativeParts, preferredAppName) {
  if (!existsSync(parentDir)) {
    return [];
  }

  return readdirSync(parentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(".app"))
    .sort((left, right) => Number(right.name === preferredAppName) - Number(left.name === preferredAppName))
    .map((entry) => path.join(parentDir, entry.name, ...relativeParts));
}

function findFirstExistingPath(candidatePaths) {
  return candidatePaths.find((candidatePath) => existsSync(candidatePath));
}

function resolveInstalledPackageVersion(packageName) {
  const packagePathParts = packageName.split("/");
  let currentDir = desktopDir;
  let packageJsonPath;
  while (currentDir !== path.dirname(currentDir)) {
    const candidatePath = path.join(currentDir, "node_modules", ...packagePathParts, "package.json");
    if (existsSync(candidatePath)) {
      packageJsonPath = candidatePath;
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  if (!packageJsonPath) {
    throw new Error(`Unable to resolve installed package.json for ${packageName}`);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  return packageJson.version;
}

function listNestedUnpackedAsarPaths(releaseDir, unpackedDirPattern) {
  if (!existsSync(releaseDir)) {
    return [];
  }

  const candidates = [];
  for (const entry of readdirSync(releaseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const firstLevelDir = path.join(releaseDir, entry.name);
    if (unpackedDirPattern.test(entry.name)) {
      candidates.push(path.join(firstLevelDir, "resources", "app.asar"));
      continue;
    }

    for (const nested of readdirSync(firstLevelDir, { withFileTypes: true })) {
      if (nested.isDirectory() && unpackedDirPattern.test(nested.name)) {
        candidates.push(path.join(firstLevelDir, nested.name, "resources", "app.asar"));
      }
    }
  }

  return candidates;
}

function verifyRequiredPackages(asarPath) {
  const packagedFiles = new Set(asar.listPackage(asarPath, { isPack: false }).map((entry) => entry.replace(/^\/+/, "")));
  const missingPackages = requiredPackages.filter(
    (packageName) => {
      const packagePath = `node_modules/${packageName}`;
      return !packagedFiles.has(`${packagePath}/package.json`) && ![...packagedFiles].some((entry) => entry.startsWith(`${packagePath}/`));
    },
  );

  if (missingPackages.length > 0) {
    throw new Error(`Packaged app is missing runtime dependencies: ${missingPackages.join(", ")}`);
  }
}

async function verifyPackagedPiRuntime(asarPath, extractedDir) {
  const packageJson = readAsarJson(asarPath, "node_modules/@mariozechner/pi-coding-agent/package.json");
  if (packageJson.version !== requiredPiCodingAgentVersion) {
    throw new Error(
      `Packaged app has @mariozechner/pi-coding-agent ${packageJson.version}; expected ${requiredPiCodingAgentVersion}.`,
    );
  }

  extractPackedFiles(asarPath, extractedDir);
  const runtimeEntry = path.join(extractedDir, "node_modules", "@mariozechner", "pi-coding-agent", "dist", "index.js");
  const { AuthStorage, ModelRegistry } = await import(pathToFileURL(runtimeEntry).href);
  const registry = ModelRegistry.inMemory(AuthStorage.inMemory());
  const codexModel = registry.getAll().find((model) => model.provider === "openai-codex" && model.id === "gpt-5.5");
  if (!codexModel?.reasoning || !codexModel.input.includes("image")) {
    throw new Error("Packaged Pi runtime does not expose openai-codex/gpt-5.5 with reasoning and image input.");
  }
}

function readAsarJson(asarPath, filePath) {
  return JSON.parse(asar.extractFile(asarPath, filePath).toString("utf8"));
}

function extractAsarFile(asarPath, extractedDir, filePath) {
  const targetPath = path.join(extractedDir, filePath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, asar.extractFile(asarPath, filePath));
  return targetPath;
}

function extractPackedFiles(asarPath, extractedDir) {
  for (const entry of asar.listPackage(asarPath, { isPack: false })) {
    const filePath = entry.replace(/^\/+/, "");
    const stat = asar.statFile(asarPath, filePath);
    if ("files" in stat || "link" in stat || stat.unpacked) {
      continue;
    }

    extractAsarFile(asarPath, extractedDir, filePath);
  }
}

async function verifyNativeNodePty(asarPath) {
  const unpackedResourcesDir = `${asarPath}.unpacked`;
  const nodePtyDir = path.join(unpackedResourcesDir, "node_modules", "node-pty");
  if (!existsSync(nodePtyDir) || !hasFileWithExtension(nodePtyDir, ".node")) {
    throw new Error(`Packaged app is missing unpacked node-pty native module under ${nodePtyDir}`);
  }
  if (packagePlatform !== "darwin") {
    return;
  }
  const helperPath = findFileNamed(nodePtyDir, "spawn-helper");
  if (!helperPath) {
    throw new Error(`Packaged app is missing unpacked node-pty spawn-helper under ${nodePtyDir}`);
  }
  await access(helperPath, constants.X_OK);
}

function verifyNativeClipboard(asarPath) {
  const expectedPackage = clipboardNativePackagesByTarget[`${packagePlatform}-${packageArch}`];
  if (!expectedPackage) {
    return;
  }

  const packagedFiles = new Set(asar.listPackage(asarPath, { isPack: false }).map((entry) => entry.replace(/^\/+/, "")));
  const unpackedResourcesDir = `${asarPath}.unpacked`;
  const expectedPackagePath = `node_modules/${expectedPackage}`;
  const expectedInAsar = packagedFiles.has(`${expectedPackagePath}/package.json`) || [...packagedFiles].some((entry) => entry.startsWith(`${expectedPackagePath}/`));
  const expectedUnpacked = existsSync(path.join(unpackedResourcesDir, ...expectedPackage.split("/")));
  if (!expectedInAsar && !expectedUnpacked) {
    throw new Error(`Packaged app is missing target clipboard native package: ${expectedPackage}`);
  }

  const wrongNativePackages = [
    ...packagedFiles,
    ...listUnpackedRelativeFiles(unpackedResourcesDir),
  ].filter((entry) => {
    if (!entry.startsWith("node_modules/@mariozechner/clipboard-")) {
      return false;
    }
    return entry !== expectedPackagePath && !entry.startsWith(`${expectedPackagePath}/`);
  });

  if (wrongNativePackages.length > 0) {
    throw new Error(
      `Packaged app includes clipboard native packages for the wrong target: ${[...new Set(wrongNativePackages.map(packageRootFromNodeModulesPath))].join(", ")}`,
    );
  }
}

function verifyPackagedWindowsGitBash(asarPath) {
  if (packagePlatform !== "win32" && packagePlatform !== "win") {
    return;
  }

  const resourcesDir = path.dirname(asarPath);
  const gitBashDir = path.join(resourcesDir, "git-bash");
  const bashPath = [
    path.join(gitBashDir, "usr", "bin", "bash.exe"),
    path.join(gitBashDir, "bin", "bash.exe"),
  ].find((candidatePath) => existsSync(candidatePath));

  if (!bashPath) {
    throw new Error(`Packaged Windows app is missing bundled Git Bash under ${gitBashDir}`);
  }

  const gitPath = [
    path.join(gitBashDir, "cmd", "git.exe"),
    path.join(gitBashDir, "mingw64", "bin", "git.exe"),
    path.join(gitBashDir, "mingw32", "bin", "git.exe"),
    path.join(gitBashDir, "usr", "bin", "git.exe"),
    path.join(gitBashDir, "bin", "git.exe"),
  ].find((candidatePath) => existsSync(candidatePath));

  if (!gitPath) {
    throw new Error(`Packaged Windows app has Git Bash but is missing git.exe under ${gitBashDir}`);
  }
}

async function verifyPackagedElectronNodeProxy(asarPath) {
  if (packagePlatform === "win32" || packagePlatform === "win") {
    verifyPackagedWindowsNodeProxy(asarPath);
    return;
  }

  const resourcesDir = path.dirname(asarPath);
  const nodePath = path.join(resourcesDir, "runtime", "node");
  if (!existsSync(nodePath)) {
    throw new Error(`Packaged app is missing Electron Node proxy: ${nodePath}`);
  }

  const nodeScript = readFileSync(nodePath, "utf8");
  if (!nodeScript.includes("ELECTRON_RUN_AS_NODE=1")) {
    throw new Error(`Packaged Electron Node proxy does not set ELECTRON_RUN_AS_NODE=1: ${nodePath}`);
  }
  await access(nodePath, constants.X_OK);
}

function verifyPackagedWindowsNodeProxy(asarPath) {
  if (packagePlatform !== "win32" && packagePlatform !== "win") {
    return;
  }

  const resourcesDir = path.dirname(asarPath);
  const runtimeDir = path.join(resourcesDir, "runtime");
  const nodeCmdPath = path.join(runtimeDir, "node.cmd");
  const nodeExePath = path.join(runtimeDir, "node.exe");
  const nodeShellPath = path.join(runtimeDir, "node");
  if (!existsSync(nodeCmdPath)) {
    throw new Error(`Packaged Windows app is missing Electron Node proxy: ${nodeCmdPath}`);
  }
  if (!existsSync(nodeExePath)) {
    throw new Error(`Packaged Windows app is missing direct-spawn Electron Node proxy: ${nodeExePath}`);
  }
  if (!existsSync(nodeShellPath)) {
    throw new Error(`Packaged Windows app is missing Git Bash Electron Node proxy: ${nodeShellPath}`);
  }

  const nodeCmd = readFileSync(nodeCmdPath, "utf8");
  const nodeShell = readFileSync(nodeShellPath, "utf8");
  if (!nodeCmd.includes("ELECTRON_RUN_AS_NODE=1") || !nodeShell.includes("ELECTRON_RUN_AS_NODE=1")) {
    throw new Error(`Packaged Windows Electron Node proxy does not set ELECTRON_RUN_AS_NODE=1 under ${runtimeDir}`);
  }

  const nodeExeSize = safeStatSize(nodeExePath);
  if (nodeExeSize > 1024 * 1024) {
    throw new Error(
      `Packaged Windows node.exe looks like a standalone Node binary, not a small Electron proxy: ${nodeExePath} (${nodeExeSize} bytes)`,
    );
  }
}

function verifyPackagedWindowsManagedRuntime(asarPath) {
  if (packagePlatform !== "win32" && packagePlatform !== "win") {
    return;
  }

  const resourcesDir = path.dirname(asarPath);
  const runtimeDir = path.join(resourcesDir, "runtime");
  const pythonDir = path.join(runtimeDir, "python");
  const uvDir = path.join(runtimeDir, "uv");
  const pythonExePath = path.join(pythonDir, "python.exe");
  const uvExePath = path.join(uvDir, "uv.exe");

  if (!existsSync(pythonExePath)) {
    throw new Error(`Packaged Windows app is missing bundled Python runtime: ${pythonExePath}`);
  }
  if (!existsSync(uvExePath)) {
    throw new Error(`Packaged Windows app is missing bundled uv runtime: ${uvExePath}`);
  }

  const pythonFiles = [
    "python.exe",
    "python3.dll",
    "python313.dll",
    "python313._pth",
  ].filter((name) => existsSync(path.join(pythonDir, name)));
  if (pythonFiles.length === 0) {
    throw new Error(`Packaged Windows app has bundled Python but no recognizable core files under ${pythonDir}`);
  }
}

function listUnpackedRelativeFiles(rootDir) {
  if (!existsSync(rootDir)) {
    return [];
  }

  const result = [];
  const queue = [rootDir];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(entryPath);
        continue;
      }
      if (entry.isFile()) {
        result.push(path.relative(rootDir, entryPath).split(path.sep).join("/"));
      }
    }
  }
  return result;
}

function packageRootFromNodeModulesPath(entry) {
  const parts = entry.split("/");
  if (parts[0] !== "node_modules" || !parts[1]) {
    return entry;
  }
  if (parts[1].startsWith("@") && parts[2]) {
    return `${parts[1]}/${parts[2]}`;
  }
  return parts[1];
}

function hasFileWithExtension(directoryPath, extension) {
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isFile() && entry.name.endsWith(extension)) {
      return true;
    }
    if (entry.isDirectory() && hasFileWithExtension(entryPath, extension)) {
      return true;
    }
  }
  return false;
}

function findFileNamed(directoryPath, fileName) {
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isFile() && entry.name === fileName) {
      return entryPath;
    }
    if (entry.isDirectory()) {
      const nestedMatch = findFileNamed(entryPath, fileName);
      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }
  return undefined;
}

function safeStatSize(filePath) {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}
