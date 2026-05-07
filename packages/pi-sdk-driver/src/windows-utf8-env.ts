import { existsSync } from "node:fs";
import path from "node:path";

export function applyWindowsUtf8ProcessEnv(): void {
  prependPackagedElectronNodeProxyToPath();

  if (process.platform === "win32") {
    process.env.PYTHONUTF8 = "1";
    process.env.LANG = "C.UTF-8";
    process.env.LC_ALL = "C.UTF-8";
    process.env.PYTHONIOENCODING = "utf-8";
    ensureWindowsCmdPathExt();
  }
}

function prependPackagedElectronNodeProxyToPath(): void {
  const resourcesPath = resolvePackagedResourcesPath();
  if (!resourcesPath) {
    return;
  }

  const runtimeDir = path.join(resourcesPath, "runtime");
  if (!hasPackagedNodeProxy(runtimeDir)) {
    return;
  }

  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  const delimiter = process.platform === "win32" ? ";" : path.delimiter;
  const currentEntries = (process.env[pathKey] ?? "").split(delimiter).filter(Boolean);
  const normalizedRuntimeDir = path.resolve(runtimeDir).toLowerCase();
  const nextEntries = [
    runtimeDir,
    ...currentEntries.filter((entry) => path.resolve(entry).toLowerCase() !== normalizedRuntimeDir),
  ];
  process.env[pathKey] = nextEntries.join(delimiter);
}

function hasPackagedNodeProxy(runtimeDir: string): boolean {
  if (process.platform === "win32") {
    return existsSync(path.join(runtimeDir, "node.exe")) || existsSync(path.join(runtimeDir, "node.cmd"));
  }

  return existsSync(path.join(runtimeDir, "node"));
}

function resolvePackagedResourcesPath(): string | undefined {
  const maybeProcessWithResources = process as typeof process & { resourcesPath?: string };
  const resourcesPath = maybeProcessWithResources.resourcesPath;
  if (typeof resourcesPath === "string" && resourcesPath.trim()) {
    return resourcesPath;
  }

  return undefined;
}

function ensureWindowsCmdPathExt(): void {
  const pathExtKey = Object.keys(process.env).find((key) => key.toLowerCase() === "pathext") ?? "PATHEXT";
  const currentEntries = (process.env[pathExtKey] ?? "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const seen = new Set(currentEntries.map((entry) => entry.toUpperCase()));
  for (const extension of [".COM", ".EXE", ".BAT", ".CMD"]) {
    if (!seen.has(extension)) {
      currentEntries.push(extension);
      seen.add(extension);
    }
  }
  process.env[pathExtKey] = currentEntries.join(";");
}
