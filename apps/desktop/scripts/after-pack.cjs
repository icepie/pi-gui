"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ELECTRON_BUILDER_ARCH_NAMES = {
  0: "ia32",
  1: "x64",
  2: "armv7l",
  3: "arm64",
  4: "universal",
};

const KEEP_ELECTRON_LOCALES = new Set(["en-US.pak", "zh-CN.pak"]);
const KOFFI_PLATFORM_DIRS = {
  "darwin-arm64": "darwin_arm64",
  "darwin-x64": "darwin_x64",
  "linux-arm64": "linux_arm64",
  "linux-x64": "linux_x64",
  "win32-arm64": "win32_arm64",
  "win32-x64": "win32_x64",
};
const CLIPBOARD_NATIVE_PACKAGES = {
  "darwin-arm64": "@mariozechner/clipboard-darwin-arm64",
  "darwin-x64": "@mariozechner/clipboard-darwin-x64",
  "linux-arm64": "@mariozechner/clipboard-linux-arm64-gnu",
  "linux-x64": "@mariozechner/clipboard-linux-x64-gnu",
  "win32-arm64": "@mariozechner/clipboard-win32-arm64-msvc",
  "win32-x64": "@mariozechner/clipboard-win32-x64-msvc",
};
const BUNDLED_PI_MCP_ADAPTER_PACKAGE = "pi-mcp-adapter";
const CLIPBOARD_NATIVE_PACKAGE_PREFIX = "@mariozechner/clipboard-";
const JUNK_DIR_NAMES = new Set([
  ".github",
  ".vscode",
  "__tests__",
  "benchmark",
  "benchmarks",
  "coverage",
  "docs",
  "examples",
  "test",
  "tests",
]);
const JUNK_DOC_BASE_NAMES = new Set([
  "authors",
  "changelog",
  "contributing",
  "contributors",
  "history",
  "license",
  "licence",
  "readme",
]);
const JUNK_DOC_EXTENSIONS = new Set(["", ".markdown", ".md", ".rst", ".txt"]);

exports.default = async function afterPack(context) {
  const platform = context.electronPlatformName;
  const arch = resolveArchName(context.arch);
  const resourcesDir = resolvePackagedResourcesDir(context, platform);

  injectWindowsGitBashRuntime(platform, arch, resourcesDir);
  injectElectronNodeProxyRuntime(context, platform, arch, resourcesDir);
  injectWindowsManagedRuntime(platform, arch, resourcesDir);
  injectBundledPiPackages(resourcesDir);
  pruneElectronLocales(context.appOutDir);
  prunePackagedNodeModules(resourcesDir);
  pruneNodePtyUnpackedArtifacts(resourcesDir, platform, arch);
  pruneKoffiUnpackedArtifacts(resourcesDir, platform, arch);
  pruneClipboardNativeArtifacts(resourcesDir, platform, arch);
  pruneBundledWindowsGitBash(resourcesDir, platform);
};

function resolveArchName(arch) {
  if (typeof arch === "string") {
    return arch;
  }
  const resolved = ELECTRON_BUILDER_ARCH_NAMES[arch];
  if (resolved) {
    return resolved;
  }
  throw new Error(`[afterPack] Unsupported electron-builder arch value: ${String(arch)}`);
}

function resolvePackagedResourcesDir(context, platform) {
  if (platform !== "darwin") {
    return path.join(context.appOutDir, "resources");
  }

  return path.join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
    "Contents",
    "Resources",
  );
}

function injectWindowsGitBashRuntime(platform, arch, resourcesDir) {
  if (platform !== "win32") {
    return;
  }

  const sourceDir = path.join(__dirname, "..", "resources", "git-bash", "runtime", arch);
  if (!hasWindowsBash(sourceDir)) {
    throw new Error(
      `[afterPack] Missing prepared Git Bash runtime for ${arch}: ${sourceDir}. ` +
        `Run pnpm --dir apps/desktop run prepare:git-bash:win with PI_APP_WINDOWS_ARCH=${arch}.`,
    );
  }

  const targetDir = path.join(resourcesDir, "git-bash");
  fs.rmSync(targetDir, { recursive: true, force: true });
  copyDirSync(sourceDir, targetDir);
  console.log(`[afterPack] injected Git Bash runtime ${arch} -> ${path.relative(process.cwd(), targetDir)}`);
}

function injectElectronNodeProxyRuntime(context, platform, arch, resourcesDir) {
  const executableName = resolveExecutableName(context);
  const productFilename = resolveProductFilename(context);
  const runtimeDir = path.join(resourcesDir, "runtime");
  fs.mkdirSync(runtimeDir, { recursive: true });

  if (platform === "win32") {
    const nodeCmdPath = path.join(runtimeDir, "node.cmd");
    fs.writeFileSync(nodeCmdPath, buildWindowsElectronNodeCmd(executableName), "utf-8");

    compileWindowsElectronNodeProxyExe(runtimeDir, arch, executableName);

    const nodeShellPath = path.join(runtimeDir, "node");
    fs.writeFileSync(nodeShellPath, buildWindowsElectronNodeShell(executableName), "utf-8");
    fs.chmodSync(nodeShellPath, 0o755);
  } else {
    const nodePath = path.join(runtimeDir, "node");
    fs.writeFileSync(nodePath, buildUnixElectronNodeShell(platform, executableName, productFilename), "utf-8");
    fs.chmodSync(nodePath, 0o755);
  }

  console.log(`[afterPack] injected Electron Node proxy -> ${path.relative(process.cwd(), runtimeDir)}`);
}

function injectWindowsManagedRuntime(platform, arch, resourcesDir) {
  if (platform !== "win32") {
    return;
  }

  const sourceDir = path.join(__dirname, "..", "resources", "runtime", arch);
  if (!hasWindowsManagedRuntime(sourceDir)) {
    throw new Error(
      `[afterPack] Missing prepared runtime payload for ${arch}: ${sourceDir}. ` +
        `Run pnpm --dir apps/desktop run prepare:runtime:win with PI_APP_WINDOWS_ARCH=${arch}.`,
    );
  }

  const targetDir = path.join(resourcesDir, "runtime");
  fs.mkdirSync(targetDir, { recursive: true });
  copyWindowsManagedRuntimeDirectory(sourceDir, targetDir);
  console.log(`[afterPack] injected managed Python/uv runtime ${arch} -> ${path.relative(process.cwd(), targetDir)}`);
}

function injectBundledPiPackages(resourcesDir) {
  const sourceNodeModulesDir = path.join(__dirname, "..", "..", "..", "node_modules");
  const targetPiPackagesDir = path.join(resourcesDir, "pi-packages");
  const targetNodeModulesDir = path.join(targetPiPackagesDir, "node_modules");
  const seen = new Set();

  copyBundledPiPackageRoot(BUNDLED_PI_MCP_ADAPTER_PACKAGE, sourceNodeModulesDir, targetPiPackagesDir);
  copyBundledPiPackageDependencies(BUNDLED_PI_MCP_ADAPTER_PACKAGE, sourceNodeModulesDir, targetNodeModulesDir, seen);
  console.log(
    `[afterPack] injected bundled Pi package ${BUNDLED_PI_MCP_ADAPTER_PACKAGE} -> ${path.relative(process.cwd(), path.join(targetPiPackagesDir, BUNDLED_PI_MCP_ADAPTER_PACKAGE))}`,
  );
}

function copyBundledPiPackageRoot(packageName, sourceNodeModulesDir, targetPiPackagesDir) {
  const sourceDir = resolveNodeModulesPackageDir(sourceNodeModulesDir, packageName);
  const targetDir = path.join(targetPiPackagesDir, packageName);
  fs.rmSync(targetDir, { recursive: true, force: true });
  copyPackageDirSync(sourceDir, targetDir);
}

function copyBundledPiPackageDependencies(packageName, sourceNodeModulesDir, targetNodeModulesDir, seen) {
  if (seen.has(packageName)) {
    return;
  }
  seen.add(packageName);

  const sourceDir = resolveNodeModulesPackageDir(sourceNodeModulesDir, packageName);
  const packageJsonPath = path.join(sourceDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.peerDependencies ?? {}),
  };
  const optionalPeerDependencies = new Set(
    Object.entries(packageJson.peerDependenciesMeta ?? {})
      .filter(([, meta]) => meta && typeof meta === "object" && meta.optional === true)
      .map(([name]) => name),
  );

  for (const dependencyName of Object.keys(dependencies)) {
    if (!dependencyName || optionalPeerDependencies.has(dependencyName)) {
      continue;
    }
    const dependencySourceDir = resolveNodeModulesPackageDir(sourceNodeModulesDir, dependencyName);
    const dependencyTargetDir = path.join(targetNodeModulesDir, ...dependencyName.split("/"));
    fs.rmSync(dependencyTargetDir, { recursive: true, force: true });
    copyPackageDirSync(dependencySourceDir, dependencyTargetDir);
    copyBundledPiPackageDependencies(dependencyName, sourceNodeModulesDir, targetNodeModulesDir, seen);
  }
}

function resolveNodeModulesPackageDir(sourceNodeModulesDir, packageName) {
  const packageDir = path.join(sourceNodeModulesDir, ...packageName.split("/"));
  if (!fs.existsSync(packageDir)) {
    throw new Error(`[afterPack] Missing bundled Pi package dependency: ${packageDir}`);
  }
  return packageDir;
}

function resolveExecutableName(context) {
  const executableName = context.packager?.executableName;
  if (typeof executableName === "string" && executableName.trim()) {
    return executableName.trim();
  }

  const productFilename = context.packager?.appInfo?.productFilename;
  if (typeof productFilename === "string" && productFilename.trim()) {
    return productFilename.trim();
  }

  throw new Error("[afterPack] Unable to resolve packaged executable name for Electron Node proxy.");
}

function resolveProductFilename(context) {
  const productFilename = context.packager?.appInfo?.productFilename;
  if (typeof productFilename === "string" && productFilename.trim()) {
    return productFilename.trim();
  }

  return resolveExecutableName(context);
}

function buildWindowsElectronNodeCmd(executableName) {
  return [
    "@echo off",
    "setlocal",
    "set \"ELECTRON_RUN_AS_NODE=1\"",
    `"%~dp0..\\..\\${executableName}.exe" %*`,
    "exit /b %ERRORLEVEL%",
    "",
  ].join("\r\n");
}

function buildWindowsElectronNodeShell(executableName) {
  return [
    "#!/usr/bin/env sh",
    "DIR=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd)",
    "export ELECTRON_RUN_AS_NODE=1",
    `exec "$DIR/../../${executableName}.exe" "$@"`,
    "",
  ].join("\n");
}

function buildUnixElectronNodeShell(platform, executableName, productFilename) {
  if (platform === "darwin") {
    const helperName = `${productFilename} Helper`;
    return [
      "#!/bin/sh",
      "DIR=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd)",
      "export ELECTRON_RUN_AS_NODE=1",
      `HELPER="$DIR/../../Frameworks/${helperName}.app/Contents/MacOS/${helperName}"`,
      `MAIN="$DIR/../../MacOS/${executableName}"`,
      "if [ -x \"$HELPER\" ]; then",
      "  exec \"$HELPER\" \"$@\"",
      "fi",
      "exec \"$MAIN\" \"$@\"",
      "",
    ].join("\n");
  }

  return [
    "#!/bin/sh",
    "DIR=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd)",
    "export ELECTRON_RUN_AS_NODE=1",
    `exec "$DIR/../../${executableName}" "$@"`,
    "",
  ].join("\n");
}

function compileWindowsElectronNodeProxyExe(runtimeDir, arch, executableName) {
  const targetPath = path.join(runtimeDir, "node.exe");
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-gui-node-proxy-"));
  const sourcePath = path.join(sourceDir, "node-proxy.c");
  fs.writeFileSync(sourcePath, buildWindowsElectronNodeProxySource(`${executableName}.exe`), "utf-8");

  try {
    const compiler = resolveWindowsNodeProxyCompiler(arch);
    const result = spawnSync(compiler.command, [...compiler.args, sourcePath, "-o", targetPath], {
      cwd: sourceDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.error || result.status !== 0) {
      throw new Error(result.error?.message || result.stderr || result.stdout || `exit code ${result.status}`);
    }
  } catch (error) {
    fs.rmSync(targetPath, { force: true });
    throw new Error(
      `[afterPack] Failed to build Windows Electron Node proxy for ${arch}: ${
        error instanceof Error ? error.message : String(error)
      }. Install mingw-w64 or zig for Windows cross-packaging.`,
    );
  } finally {
    fs.rmSync(sourceDir, { recursive: true, force: true });
  }
}

function resolveWindowsNodeProxyCompiler(arch) {
  const candidates =
    arch === "arm64"
      ? [
          { command: "aarch64-w64-mingw32-gcc", args: ["-municode", "-Os", "-s"], probeArgs: ["--version"] },
          { command: "zig", args: ["cc", "-target", "aarch64-windows-gnu", "-municode", "-Os", "-s"], probeArgs: ["version"] },
        ]
      : [
          { command: "x86_64-w64-mingw32-gcc", args: ["-municode", "-Os", "-s"], probeArgs: ["--version"] },
          { command: "zig", args: ["cc", "-target", "x86_64-windows-gnu", "-municode", "-Os", "-s"], probeArgs: ["version"] },
        ];

  for (const candidate of candidates) {
    const command = resolveWindowsCompilerCommand(candidate.command);
    const probe = spawnSync(command, candidate.probeArgs, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (!probe.error && probe.status === 0) {
      console.log(`[afterPack] using Windows Node proxy compiler for ${arch}: ${command}`);
      return { ...candidate, command };
    }
    const detail = probe.error?.message || probe.stderr?.trim() || probe.stdout?.trim() || `exit code ${probe.status}`;
    console.warn(`[afterPack] compiler probe failed for ${arch}: ${command} (${detail})`);
  }

  throw new Error(`no compiler found for ${arch}`);
}

function resolveWindowsCompilerCommand(command) {
  if (path.isAbsolute(command) || process.platform !== "win32") {
    return command;
  }

  for (const candidatePath of windowsCompilerFallbackPaths(command)) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return command;
}

function windowsCompilerFallbackPaths(command) {
  const chocolateyInstall = process.env.ChocolateyInstall || "C:\\ProgramData\\chocolatey";
  const localAppData = process.env.LOCALAPPDATA;
  return [
    path.join(chocolateyInstall, "bin", command),
    path.join(chocolateyInstall, "lib", "zig", "tools", command),
    localAppData ? path.join(localAppData, "Microsoft", "WinGet", "Packages", "zig.zig_Microsoft.Winget.Source_8wekyb3d8bbwe", command) : "",
  ].filter(Boolean);
}

function buildWindowsElectronNodeProxySource(electronExeName) {
  const escapedExeName = electronExeName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return String.raw`
#include <windows.h>
#include <wchar.h>
#include <stdlib.h>
#include <string.h>

#define ELECTRON_EXE_NAME L"${escapedExeName}"

static wchar_t *quote_arg(const wchar_t *arg) {
  size_t len = wcslen(arg);
  size_t capacity = (len * 2) + 3;
  wchar_t *out = (wchar_t *)malloc(capacity * sizeof(wchar_t));
  size_t pos = 0;
  size_t slash_count = 0;
  if (!out) return NULL;
  out[pos++] = L'"';
  for (size_t i = 0; i < len; i++) {
    wchar_t ch = arg[i];
    if (ch == L'\\') {
      slash_count++;
      continue;
    }
    if (ch == L'"') {
      for (size_t j = 0; j < (slash_count * 2) + 1; j++) out[pos++] = L'\\';
      out[pos++] = ch;
      slash_count = 0;
      continue;
    }
    for (size_t j = 0; j < slash_count; j++) out[pos++] = L'\\';
    slash_count = 0;
    out[pos++] = ch;
  }
  for (size_t j = 0; j < slash_count * 2; j++) out[pos++] = L'\\';
  out[pos++] = L'"';
  out[pos] = L'\0';
  return out;
}

static int append_arg(wchar_t **buffer, size_t *length, size_t *capacity, const wchar_t *arg) {
  wchar_t *quoted = quote_arg(arg);
  if (!quoted) return 0;
  size_t quoted_len = wcslen(quoted);
  size_t needed = *length + quoted_len + 2;
  if (needed > *capacity) {
    size_t next_capacity = needed * 2;
    wchar_t *next = (wchar_t *)realloc(*buffer, next_capacity * sizeof(wchar_t));
    if (!next) {
      free(quoted);
      return 0;
    }
    *buffer = next;
    *capacity = next_capacity;
  }
  if (*length > 0) (*buffer)[(*length)++] = L' ';
  memcpy(*buffer + *length, quoted, (quoted_len + 1) * sizeof(wchar_t));
  *length += quoted_len;
  free(quoted);
  return 1;
}

int wmain(int argc, wchar_t **argv) {
  wchar_t module_path[MAX_PATH];
  wchar_t runtime_dir[MAX_PATH];
  wchar_t target_relative[MAX_PATH];
  wchar_t target_path[MAX_PATH];
  DWORD exit_code = 1;

  DWORD module_len = GetModuleFileNameW(NULL, module_path, MAX_PATH);
  if (module_len == 0 || module_len >= MAX_PATH) {
    fwprintf(stderr, L"node proxy: failed to resolve module path\n");
    return 1;
  }

  wcscpy(runtime_dir, module_path);
  wchar_t *last_slash = wcsrchr(runtime_dir, L'\\');
  if (!last_slash) {
    fwprintf(stderr, L"node proxy: invalid module path\n");
    return 1;
  }
  *last_slash = L'\0';
  swprintf(target_relative, MAX_PATH, L"%ls\\..\\..\\%ls", runtime_dir, ELECTRON_EXE_NAME);
  if (GetFullPathNameW(target_relative, MAX_PATH, target_path, NULL) == 0) {
    fwprintf(stderr, L"node proxy: failed to resolve Electron path\n");
    return 1;
  }

  size_t capacity = 32768;
  size_t length = 0;
  wchar_t *command_line = (wchar_t *)calloc(capacity, sizeof(wchar_t));
  if (!command_line) return 1;
  if (!append_arg(&command_line, &length, &capacity, target_path)) return 1;
  for (int i = 1; i < argc; i++) {
    if (!append_arg(&command_line, &length, &capacity, argv[i])) return 1;
  }

  SetEnvironmentVariableW(L"ELECTRON_RUN_AS_NODE", L"1");

  STARTUPINFOW si;
  PROCESS_INFORMATION pi;
  ZeroMemory(&si, sizeof(si));
  ZeroMemory(&pi, sizeof(pi));
  si.cb = sizeof(si);
  if (!CreateProcessW(target_path, command_line, NULL, NULL, TRUE, 0, NULL, NULL, &si, &pi)) {
    fwprintf(stderr, L"node proxy: failed to start %ls (%lu)\n", target_path, GetLastError());
    free(command_line);
    return 1;
  }

  WaitForSingleObject(pi.hProcess, INFINITE);
  GetExitCodeProcess(pi.hProcess, &exit_code);
  CloseHandle(pi.hProcess);
  CloseHandle(pi.hThread);
  free(command_line);
  return (int)exit_code;
}
`.trimStart();
}

function hasWindowsBash(rootDir) {
  return (
    fs.existsSync(path.join(rootDir, "usr", "bin", "bash.exe")) ||
    fs.existsSync(path.join(rootDir, "bin", "bash.exe"))
  );
}

function hasWindowsManagedRuntime(rootDir) {
  return (
    fs.existsSync(path.join(rootDir, "python", "python.exe")) &&
    fs.existsSync(path.join(rootDir, "uv", "uv.exe"))
  );
}

function pruneElectronLocales(appOutDir) {
  const localesDir = path.join(appOutDir, "locales");
  if (!fs.existsSync(localesDir)) {
    return;
  }

  let removedBytes = 0;
  let removedCount = 0;
  for (const entry of fs.readdirSync(localesDir, { withFileTypes: true })) {
    if (!entry.isFile() || KEEP_ELECTRON_LOCALES.has(entry.name)) {
      continue;
    }
    const filePath = path.join(localesDir, entry.name);
    removedBytes += safeStatSize(filePath);
    fs.rmSync(filePath, { force: true });
    removedCount++;
  }

  logSavings("electron locales", removedCount, removedBytes);
}

function pruneNodePtyUnpackedArtifacts(resourcesDir, platform, arch) {
  const asarUnpackedDir = path.join(resourcesDir, "app.asar.unpacked");
  const nodePtyRoots = findPackageRoots(path.join(asarUnpackedDir, "node_modules"), "node-pty");
  if (nodePtyRoots.length === 0) {
    return;
  }

  let removedBytes = 0;
  let removedCount = 0;
  const keepPrebuildFragments = new Set([
    `${platform}-${arch}`,
    platform === "win32" && arch === "x64" ? "win32-x64-msvc" : "",
    platform === "win32" && arch === "arm64" ? "win32-arm64-msvc" : "",
    platform === "darwin" && arch === "x64" ? "darwin-x64" : "",
    platform === "darwin" && arch === "arm64" ? "darwin-arm64" : "",
    platform === "linux" && arch === "x64" ? "linux-x64" : "",
    platform === "linux" && arch === "arm64" ? "linux-arm64" : "",
  ].filter(Boolean));

  for (const nodePtyDir of nodePtyRoots) {
    const prebuildsDir = path.join(nodePtyDir, "prebuilds");
    if (fs.existsSync(prebuildsDir)) {
      for (const entry of fs.readdirSync(prebuildsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || keepPrebuildFragments.has(entry.name)) {
          continue;
        }
        const dirPath = path.join(prebuildsDir, entry.name);
        const stats = countFiles(dirPath);
        fs.rmSync(dirPath, { recursive: true, force: true });
        removedBytes += stats.bytes;
        removedCount += stats.count;
      }
    }

    if (platform === "win32") {
      const keepConptyArch = arch === "arm64" ? "win10-arm64" : "win10-x64";
      const conptyDir = path.join(nodePtyDir, "third_party", "conpty");
      if (fs.existsSync(conptyDir)) {
        for (const versionEntry of fs.readdirSync(conptyDir, { withFileTypes: true })) {
          if (!versionEntry.isDirectory()) {
            continue;
          }
          const versionDir = path.join(conptyDir, versionEntry.name);
          for (const archEntry of fs.readdirSync(versionDir, { withFileTypes: true })) {
            if (!archEntry.isDirectory() || archEntry.name === keepConptyArch) {
              continue;
            }
            const dirPath = path.join(versionDir, archEntry.name);
            const stats = countFiles(dirPath);
            fs.rmSync(dirPath, { recursive: true, force: true });
            removedBytes += stats.bytes;
            removedCount += stats.count;
          }
        }
      }
    }
  }

  logSavings("node-pty cross-target artifacts", removedCount, removedBytes);
}

function pruneKoffiUnpackedArtifacts(resourcesDir, platform, arch) {
  const keepDir = KOFFI_PLATFORM_DIRS[`${platform}-${arch}`];
  if (!keepDir) {
    return;
  }

  const asarUnpackedDir = path.join(resourcesDir, "app.asar.unpacked");
  const koffiRoots = findPackageRoots(path.join(asarUnpackedDir, "node_modules"), "koffi");
  if (koffiRoots.length === 0) {
    return;
  }

  let removedBytes = 0;
  let removedCount = 0;
  for (const koffiDir of koffiRoots) {
    const buildDir = path.join(koffiDir, "build", "koffi");
    if (!fs.existsSync(buildDir)) {
      continue;
    }
    for (const entry of fs.readdirSync(buildDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === keepDir) {
        continue;
      }
      const dirPath = path.join(buildDir, entry.name);
      const stats = countFiles(dirPath);
      fs.rmSync(dirPath, { recursive: true, force: true });
      removedBytes += stats.bytes;
      removedCount += stats.count;
    }
  }

  logSavings("koffi cross-target artifacts", removedCount, removedBytes);
}

function pruneClipboardNativeArtifacts(resourcesDir, platform, arch) {
  const keepPackage = CLIPBOARD_NATIVE_PACKAGES[`${platform}-${arch}`];
  if (!keepPackage) {
    return;
  }

  const packageRoots = [
    path.join(resourcesDir, "app.asar.unpacked", "node_modules"),
  ].filter((candidatePath) => fs.existsSync(candidatePath));

  let removedBytes = 0;
  let removedCount = 0;
  for (const modulesRoot of packageRoots) {
    const scopeDir = path.join(modulesRoot, "@mariozechner");
    if (!fs.existsSync(scopeDir)) {
      continue;
    }

    const keepPackageDir = path.join(modulesRoot, ...keepPackage.split("/"));
    if (!fs.existsSync(keepPackageDir)) {
      throw new Error(
        `[afterPack] Missing target clipboard native package ${keepPackage}. ` +
          "Run pnpm install after updating supportedArchitectures before cross-packaging.",
      );
    }

    for (const entry of fs.readdirSync(scopeDir, { withFileTypes: true })) {
      const packageName = `@mariozechner/${entry.name}`;
      if (!entry.isDirectory() || !packageName.startsWith(CLIPBOARD_NATIVE_PACKAGE_PREFIX) || packageName === keepPackage) {
        continue;
      }
      if (packageName === "@mariozechner/clipboard") {
        continue;
      }
      const dirPath = path.join(scopeDir, entry.name);
      const stats = countFiles(dirPath);
      fs.rmSync(dirPath, { recursive: true, force: true });
      removedBytes += stats.bytes;
      removedCount += stats.count;
    }
  }

  logSavings("clipboard cross-target artifacts", removedCount, removedBytes);
}

function prunePackagedNodeModules(resourcesDir) {
  const modulesRoots = [
    path.join(resourcesDir, "app", "node_modules"),
    path.join(resourcesDir, "app.asar.unpacked", "node_modules"),
  ].filter((candidatePath) => fs.existsSync(candidatePath));

  let removedBytes = 0;
  let removedCount = 0;
  for (const modulesRoot of modulesRoots) {
    const stats = pruneJunkFiles(modulesRoot);
    removedBytes += stats.bytes;
    removedCount += stats.count;
  }

  logSavings("node_modules junk files", removedCount, removedBytes);
}

function pruneBundledWindowsGitBash(resourcesDir, platform) {
  if (platform !== "win32") {
    return;
  }

  const gitBashDir = path.join(resourcesDir, "git-bash");
  if (!fs.existsSync(gitBashDir)) {
    return;
  }

  const relativePruneDirs = [
    path.join("usr", "share", "doc"),
    path.join("usr", "share", "man"),
    path.join("usr", "share", "info"),
    path.join("usr", "share", "gtk-doc"),
    path.join("usr", "share", "vim"),
    path.join("usr", "share", "perl5"),
    path.join("usr", "share", "misc"),
    path.join("usr", "lib", "perl5"),
    path.join("usr", "bin", "core_perl"),
    path.join("usr", "bin", "site_perl"),
    path.join("usr", "bin", "vendor_perl"),
    path.join("mingw64", "share", "doc"),
    path.join("mingw64", "share", "man"),
    path.join("mingw64", "share", "info"),
    path.join("mingw64", "share", "gtk-doc"),
    path.join("mingw64", "share", "git-gui"),
    path.join("mingw64", "share", "zoneinfo"),
    path.join("mingw64", "share", "bash-completion"),
    path.join("mingw64", "share", "perl5"),
    path.join("mingw32", "share", "doc"),
    path.join("mingw32", "share", "man"),
    path.join("mingw32", "share", "info"),
    path.join("mingw32", "share", "gtk-doc"),
    path.join("mingw32", "share", "git-gui"),
    path.join("mingw32", "share", "zoneinfo"),
    path.join("mingw32", "share", "bash-completion"),
    path.join("mingw32", "share", "perl5"),
  ];
  const relativePruneFiles = [
    path.join("git-bash.exe"),
    path.join("git-cmd.exe"),
    path.join("post-install.bat"),
    path.join("usr", "bin", "ex.exe"),
    path.join("usr", "bin", "nano.exe"),
    path.join("usr", "bin", "rnano.exe"),
    path.join("usr", "bin", "rview.exe"),
    path.join("usr", "bin", "rvim.exe"),
    path.join("usr", "bin", "view.exe"),
    path.join("usr", "bin", "vim.exe"),
    path.join("usr", "bin", "vimdiff.exe"),
    path.join("usr", "bin", "msys-perl5_42.dll"),
    path.join("etc", "vimrc"),
    path.join("etc", "nanorc"),
    path.join("etc", "profile.d", "perlbin.sh"),
    path.join("etc", "profile.d", "perlbin.csh"),
  ];
  const prunedBaseNamePatterns = [
    /^Avalonia\./i,
    /^SkiaSharp\.dll$/i,
    /^libSkiaSharp\.dll$/i,
    /^libHarfBuzzSharp\.dll$/i,
    /^Microsoft\.Identity\.Client\.dll$/i,
    /^msalruntime(?:_x86)?\.dll$/i,
    /^av_libglesv2\.dll$/i,
    /^gcm/i,
    /^git-credential-manager/i,
    /^git-gui/i,
    /^gitk$/i,
    /^scalar\.exe$/i,
  ];

  let removedBytes = 0;
  let removedCount = 0;
  for (const relativeDir of relativePruneDirs) {
    const dirPath = path.join(gitBashDir, relativeDir);
    if (!fs.existsSync(dirPath)) {
      continue;
    }
    const stats = countFiles(dirPath);
    fs.rmSync(dirPath, { recursive: true, force: true });
    removedBytes += stats.bytes;
    removedCount += stats.count;
  }

  for (const relativeFile of relativePruneFiles) {
    const filePath = path.join(gitBashDir, relativeFile);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    removedBytes += safeStatSize(filePath);
    fs.rmSync(filePath, { force: true });
    removedCount++;
  }

  for (const dirPath of [
    path.join(gitBashDir, "mingw64", "bin"),
    path.join(gitBashDir, "mingw64", "libexec", "git-core"),
    path.join(gitBashDir, "mingw32", "bin"),
    path.join(gitBashDir, "mingw32", "libexec", "git-core"),
  ]) {
    if (!fs.existsSync(dirPath)) {
      continue;
    }
    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (!entry.isFile() || !prunedBaseNamePatterns.some((pattern) => pattern.test(entry.name))) {
        continue;
      }
      const filePath = path.join(dirPath, entry.name);
      removedBytes += safeStatSize(filePath);
      fs.rmSync(filePath, { force: true });
      removedCount++;
    }
  }

  logSavings("Git Bash docs", removedCount, removedBytes);
}

function pruneJunkFiles(rootDir) {
  let removedBytes = 0;
  let removedCount = 0;
  const queue = [rootDir];

  while (queue.length > 0) {
    const current = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (JUNK_DIR_NAMES.has(entry.name) || entry.name === ".ignored" || entry.name.startsWith(".ignored_")) {
          const stats = countFiles(entryPath);
          fs.rmSync(entryPath, { recursive: true, force: true });
          removedBytes += stats.bytes;
          removedCount += stats.count;
          continue;
        }
        queue.push(entryPath);
        continue;
      }

      if (!entry.isFile() || !isJunkFileName(entry.name)) {
        continue;
      }

      removedBytes += safeStatSize(entryPath);
      fs.rmSync(entryPath, { force: true });
      removedCount++;
    }
  }

  return { count: removedCount, bytes: removedBytes };
}

function isJunkFileName(fileName) {
  const lower = fileName.toLowerCase();
  if (
    lower.endsWith(".map") ||
    lower.endsWith(".d.ts") ||
    lower.endsWith(".d.mts") ||
    lower.endsWith(".d.cts") ||
    lower.endsWith(".tsbuildinfo") ||
    lower.includes(".test.") ||
    lower.includes(".spec.")
  ) {
    return true;
  }

  const parsed = path.parse(lower);
  return JUNK_DOC_BASE_NAMES.has(parsed.name) && JUNK_DOC_EXTENSIONS.has(parsed.ext);
}

function findPackageRoots(startDir, packageName) {
  if (!fs.existsSync(startDir)) {
    return [];
  }

  const roots = [];
  const queue = [startDir];
  while (queue.length > 0) {
    const current = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    if (path.basename(current) === packageName && fs.existsSync(path.join(current, "package.json"))) {
      roots.push(current);
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (entry.name === ".bin") {
        continue;
      }
      queue.push(path.join(current, entry.name));
    }
  }

  return roots;
}

function copyDirSync(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(sourcePath, targetPath);
      continue;
    }
    if (entry.isSymbolicLink()) {
      throw new Error(`[afterPack] Refusing to copy symlink in packaged resources: ${sourcePath}`);
    }
    if (entry.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, fs.statSync(sourcePath).mode);
    }
  }
}

function copyPackageDirSync(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === "node_modules") {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyPackageDirSync(sourcePath, targetPath);
      continue;
    }
    if (entry.isSymbolicLink()) {
      throw new Error(`[afterPack] Refusing to copy symlink in bundled Pi package: ${sourcePath}`);
    }
    if (entry.isFile()) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, fs.statSync(sourcePath).mode);
    }
  }
}

function copyWindowsManagedRuntimeDirectory(sourceDir, targetDir) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(sourcePath, targetPath);
      continue;
    }
    if (entry.isSymbolicLink()) {
      throw new Error(`[afterPack] Refusing to copy symlink in packaged runtime payload: ${sourcePath}`);
    }
    if (entry.isFile()) {
      if (entry.name === ".python-stamp" || entry.name === ".uv-stamp") {
        continue;
      }
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, fs.statSync(sourcePath).mode);
    }
  }
}

function countFiles(rootDir) {
  let count = 0;
  let bytes = 0;
  const queue = [rootDir];
  while (queue.length > 0) {
    const current = queue.shift();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(entryPath);
        continue;
      }
      if (entry.isFile()) {
        count++;
        bytes += safeStatSize(entryPath);
      }
    }
  }
  return { count, bytes };
}

function safeStatSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function logSavings(label, removedCount, removedBytes) {
  if (removedCount <= 0 && removedBytes <= 0) {
    return;
  }
  console.log(`[afterPack] pruned ${label}: ${removedCount} files, ${(removedBytes / 1048576).toFixed(1)} MB`);
}
