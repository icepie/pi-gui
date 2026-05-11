import { existsSync, mkdirSync } from "node:fs";
import { join, delimiter, dirname, resolve } from "node:path";

const DEFAULT_PYTHON_PACKAGE_INDEX = "https://mirrors.aliyun.com/pypi/simple";

export interface ManagedPythonEnvOptions {
  readonly resourcesPath?: string;
  readonly stateDir?: string;
}

interface ManagedPythonResolution {
  readonly pythonBin?: string;
  readonly uvBin?: string;
  readonly prependedDirs: readonly string[];
}

export function applyManagedPythonProcessEnv(options: ManagedPythonEnvOptions = {}): void {
  const env = process.env as Record<string, string | undefined>;
  const stateDir = resolveManagedStateDir(options.stateDir);
  const resolution = resolveManagedPythonRuntime(options.resourcesPath);
  const pythonPackageIndex = process.env.PI_APP_PYTHON_PACKAGE_INDEX?.trim() || DEFAULT_PYTHON_PACKAGE_INDEX;

  env.PIP_INDEX_URL = pythonPackageIndex;
  env.PIP_DISABLE_PIP_VERSION_CHECK = "1";
  env.PIP_USER = "1";
  env.PYTHONUSERBASE = join(stateDir, "python-user");
  env.UV_DEFAULT_INDEX = pythonPackageIndex;
  env.UV_TOOL_DIR = join(stateDir, "uv", "tools");
  env.UV_TOOL_BIN_DIR = join(stateDir, "uv", "bin");
  mkdirSync(env.PYTHONUSERBASE, { recursive: true });
  mkdirSync(env.UV_TOOL_DIR, { recursive: true });
  mkdirSync(env.UV_TOOL_BIN_DIR, { recursive: true });

  if (resolution.pythonBin) {
    env.PI_APP_PYTHON_BIN = resolution.pythonBin;
    env.PYTHON = resolution.pythonBin;
    env.UV_PYTHON = resolution.pythonBin;
  }
  if (resolution.uvBin) {
    env.PI_APP_UV_BIN = resolution.uvBin;
  }

  prependPathEntries([
    ...resolution.prependedDirs,
    env.UV_TOOL_BIN_DIR,
    pipUserBinDir(env.PYTHONUSERBASE),
  ]);

  if (process.platform === "win32") {
    env.PYTHONUTF8 ??= "1";
    env.PYTHONIOENCODING ??= "utf-8";
    env.LANG ??= "C.UTF-8";
    env.LC_ALL ??= "C.UTF-8";
  }
}

function resolveManagedPythonRuntime(resourcesPath: string | undefined): ManagedPythonResolution {
  const pythonBin = resolveBundledPythonBin(resourcesPath) ?? resolveCommand(["python3", "python"]);
  const uvBin = resolveBundledUvBin(resourcesPath) ?? resolveCommand(["uv"]);
  return {
    ...(pythonBin ? { pythonBin } : {}),
    ...(uvBin ? { uvBin } : {}),
    prependedDirs: uniqueExistingDirs([pythonBin, uvBin].map((bin) => bin ? dirname(bin) : undefined)),
  };
}

function resolveBundledPythonBin(resourcesPath: string | undefined): string | undefined {
  const runtimeDir = resolveRuntimeDir(resourcesPath);
  const candidates = process.platform === "win32"
    ? [join(runtimeDir, "python", "python.exe")]
    : [
        join(runtimeDir, "python", "bin", "python3"),
        join(runtimeDir, "python", "bin", "python"),
      ];
  return candidates.find((candidate) => existsSync(candidate));
}

function resolveBundledUvBin(resourcesPath: string | undefined): string | undefined {
  const runtimeDir = resolveRuntimeDir(resourcesPath);
  const candidate = process.platform === "win32"
    ? join(runtimeDir, "uv", "uv.exe")
    : join(runtimeDir, "uv", "uv");
  return existsSync(candidate) ? candidate : undefined;
}

function resolveRuntimeDir(resourcesPath: string | undefined): string {
  if (resourcesPath?.trim()) {
    return join(resourcesPath, "runtime");
  }
  return join(process.cwd(), "resources", "runtime");
}

function resolveManagedStateDir(stateDir: string | undefined): string {
  if (stateDir?.trim()) {
    return resolve(stateDir);
  }
  return resolve(process.env.PI_APP_MANAGED_TOOLS_DIR ?? join(process.env.HOME ?? process.env.USERPROFILE ?? process.cwd(), ".pi-fit", "tools"));
}

function resolveCommand(commands: readonly string[]): string | undefined {
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  const entries = (process.env[pathKey] ?? "").split(process.platform === "win32" ? ";" : delimiter).filter(Boolean);
  const suffixes = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
  for (const directory of entries) {
    for (const command of commands) {
      for (const suffix of suffixes) {
        const candidate = join(directory, `${command}${suffix}`);
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }
  return undefined;
}

function pipUserBinDir(pythonUserBase: string): string {
  if (process.platform === "win32") {
    return join(pythonUserBase, "Scripts");
  }
  return join(pythonUserBase, "bin");
}

function uniqueExistingDirs(directories: readonly (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const directory of directories) {
    if (!directory || !existsSync(directory)) {
      continue;
    }
    const key = process.platform === "win32" ? resolve(directory).toLowerCase() : resolve(directory);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(directory);
  }
  return result;
}

function prependPathEntries(entries: readonly (string | undefined)[]): void {
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  const pathDelimiter = process.platform === "win32" ? ";" : delimiter;
  const currentEntries = (process.env[pathKey] ?? "").split(pathDelimiter).filter(Boolean);
  const nextEntries = [...entries.filter((entry): entry is string => Boolean(entry)), ...currentEntries];
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const entry of nextEntries) {
    const key = process.platform === "win32" ? resolve(entry).toLowerCase() : resolve(entry);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }
  process.env[pathKey] = deduped.join(pathDelimiter);
}
