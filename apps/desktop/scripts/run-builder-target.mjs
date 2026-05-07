import { access, rm } from "node:fs/promises";
import { constants, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(desktopDir, "..", "..");
const electronBuilderCollectorPatch = path.join(scriptDir, "patch-electron-builder-collector.cjs");

const options = parseArgs(process.argv.slice(2));
const outputDir = path.join("release", buildOutputDirName(options));
const targetArgs = buildElectronBuilderArgs(options, outputDir);
const absoluteOutputDir = path.join(desktopDir, outputDir);
const legacyUnscopedOutputDir = path.join(desktopDir, "release", defaultUnscopedUnpackedDirName(options.platform));

await removeOutputDir(absoluteOutputDir);
await removeOutputDir(legacyUnscopedOutputDir);
await removeReleaseScratchFiles();
await spawnChecked(await resolveNodeBinary(), [resolveElectronBuilderCli(), ...targetArgs], {
  cwd: desktopDir,
  env: buildBuilderEnv(options),
});

if (!hasPackagedAppPayload(absoluteOutputDir, options)) {
  console.warn(`[pi-gui] electron-builder exited without app payload in ${absoluteOutputDir}; retrying with debug-safe task scheduling.`);
  await removeOutputDir(absoluteOutputDir);
  await removeOutputDir(legacyUnscopedOutputDir);
  await removeReleaseScratchFiles();
  await spawnChecked(await resolveNodeBinary(), [resolveElectronBuilderCli(), ...targetArgs], {
    cwd: desktopDir,
    env: buildBuilderEnv(options, { forceDebug: true }),
  });
}

if (!hasPackagedAppPayload(absoluteOutputDir, options)) {
  throw new Error(`electron-builder did not produce app payload under ${absoluteOutputDir}`);
}

await removeOutputDir(legacyUnscopedOutputDir);
await removeReleaseScratchFiles();

async function removeOutputDir(outputPath) {
  if (!existsSync(outputPath)) {
    return;
  }

  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await rm(outputPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      console.warn(`[pi-gui] Removed stale output directory ${outputPath}`);
      return;
    } catch (error) {
      if (error?.code === "ENOENT") {
        return;
      }
      lastError = error;
      await sleep(150 * attempt);
    }
  }

  if (process.platform !== "win32" && removeOutputDirWithSystemRm(outputPath)) {
    console.warn(`[pi-gui] Removed stale output directory ${outputPath}`);
    return;
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function removeOutputDirWithSystemRm(outputPath) {
  const result = spawnSync("rm", ["-rf", "--", outputPath], {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return !result.error && result.status === 0 && !existsSync(outputPath);
}

async function removeReleaseScratchFiles() {
  const releaseDir = path.join(desktopDir, "release");
  await Promise.all([
    rm(path.join(releaseDir, "builder-debug.yml"), { force: true }),
    rm(path.join(releaseDir, "builder-effective-config.yaml"), { force: true }),
    rm(path.join(releaseDir, ".icon-ico"), { recursive: true, force: true }),
  ]);
}

function buildBuilderEnv(options, { forceDebug = false } = {}) {
  const env = sanitizeBuilderEnv(process.env);
  Object.assign(env, {
    npm_config_user_agent: process.env.npm_config_user_agent || "pnpm/10.25.0",
    npm_execpath: process.env.npm_execpath || "/usr/bin/pnpm",
    PI_APP_PACKAGE_PLATFORM: options.platform,
    PI_APP_PACKAGE_ARCH: options.arch,
    PI_APP_ELECTRON_BUILDER_USE_TRAVERSAL: "1",
  });

  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_EXEC_PATH;
  env.NODE_OPTIONS = appendNodeRequire(env.NODE_OPTIONS, electronBuilderCollectorPatch);

  if (process.platform !== "win32") {
    const pathEntries = (env.PATH ?? "").split(path.delimiter).filter(Boolean);
    env.PATH = ["/usr/bin", "/usr/local/bin", ...pathEntries.filter((entry) => entry !== "/usr/bin" && entry !== "/usr/local/bin")].join(path.delimiter);
  }
  if (forceDebug) {
    env.DEBUG = appendDebugNamespace(env.DEBUG, "electron-builder");
    env.DEBUG = appendDebugNamespace(env.DEBUG, "electron-builder:*");
  }

  return env;
}

function appendDebugNamespace(debugValue, namespace) {
  const parts = (debugValue ?? "").split(",").map((entry) => entry.trim()).filter(Boolean);
  if (!parts.includes(namespace)) {
    parts.push(namespace);
  }
  return parts.join(",");
}

function sanitizeBuilderEnv(sourceEnv) {
  const env = {};
  for (const [key, value] of Object.entries(sourceEnv)) {
    if (key === "INIT_CWD" || key === "PNPM_HOME" || key.startsWith("npm_") || key.startsWith("PNPM_")) {
      continue;
    }
    env[key] = value;
  }
  return env;
}

function appendNodeRequire(nodeOptions, preloadPath) {
  const existing = nodeOptions?.trim();
  const requireArg = `--require=${preloadPath}`;
  if (!existing) {
    return requireArg;
  }
  if (existing.includes(preloadPath)) {
    return existing;
  }
  return `${existing} ${requireArg}`;
}

function parseArgs(argv) {
  const parsed = {
    platform: "",
    arch: "",
    dir: false,
    target: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--platform") {
      parsed.platform = argv[++index] ?? "";
      continue;
    }
    if (arg === "--arch") {
      parsed.arch = argv[++index] ?? "";
      continue;
    }
    if (arg === "--dir") {
      parsed.dir = true;
      continue;
    }
    if (arg === "--target") {
      parsed.target = argv[++index] ?? "";
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!["darwin", "win32", "linux"].includes(parsed.platform)) {
    throw new Error(`--platform must be darwin, win32, or linux. Got: ${parsed.platform || "<empty>"}`);
  }
  if (!["x64", "arm64"].includes(parsed.arch)) {
    throw new Error(`--arch must be x64 or arm64. Got: ${parsed.arch || "<empty>"}`);
  }
  if (parsed.target && parsed.dir) {
    throw new Error("--target cannot be combined with --dir.");
  }
  if (parsed.target && parsed.platform !== "linux") {
    throw new Error("--target is currently only supported for Linux packaging.");
  }
  if (parsed.target && !["appimage", "deb", "rpm"].includes(parsed.target.toLowerCase())) {
    throw new Error(`--target must be appimage, deb, or rpm. Got: ${parsed.target}`);
  }

  return parsed;
}

function buildOutputDirName(options) {
  const targetSuffix = options.target ? `-${options.target.toLowerCase()}` : "";
  return `${options.platform}-${options.arch}${options.dir ? "-dir" : targetSuffix}`;
}

function buildElectronBuilderArgs(options, outputDir) {
  const args = [];

  if (options.platform === "darwin") {
    args.push("--mac");
  } else if (options.platform === "win32") {
    args.push("--win");
  } else {
    args.push("--linux");
    if (options.target) {
      args.push(options.target.toLowerCase());
    }
  }

  args.push(`--${options.arch}`);
  if (options.dir) {
    args.push("--dir");
  }
  args.push(`-c.directories.output=${outputDir}`);
  if (shouldSkipWindowsExecutableEditing(options)) {
    args.push("-c.win.signAndEditExecutable=false");
  }
  args.push("--publish", "never");

  return args;
}

function shouldSkipWindowsExecutableEditing(options) {
  if (process.env.PI_APP_WIN_SIGN_AND_EDIT_EXECUTABLE != null) {
    return process.env.PI_APP_WIN_SIGN_AND_EDIT_EXECUTABLE === "0";
  }
  return options.platform === "win32" && options.dir && process.platform !== "win32";
}

function defaultUnscopedUnpackedDirName(platform) {
  if (platform === "darwin") {
    return "mac";
  }
  if (platform === "win32") {
    return "win-unpacked";
  }
  return "linux-unpacked";
}

function hasPackagedAppPayload(outputDir, options) {
  return candidatePayloadPaths(outputDir, options).some((candidatePath) => existsSync(candidatePath));
}

function candidatePayloadPaths(outputDir, options) {
  if (options.platform === "darwin") {
    return [
      path.join(outputDir, `mac${options.arch === "arm64" ? "-arm64" : ""}`, "pi-gui.app", "Contents", "Resources", "app.asar"),
    ];
  }
  if (options.platform === "win32") {
    return [
      path.join(outputDir, "win-unpacked", "resources", "app.asar"),
      path.join(outputDir, `win-${options.arch}-unpacked`, "resources", "app.asar"),
    ];
  }
  return [
    path.join(outputDir, "linux-unpacked", "resources", "app.asar"),
    path.join(outputDir, `linux-${options.arch}-unpacked`, "resources", "app.asar"),
  ];
}

function resolveElectronBuilderCli() {
  return path.join(repoRoot, "node_modules", "electron-builder", "cli.js");
}

async function resolveNodeBinary() {
  const explicit = process.env.PI_APP_NODE_BINARY?.trim();
  if (explicit) {
    await assertExecutable(explicit);
    return explicit;
  }

  const candidates = [
    "/usr/bin/node",
    "/usr/local/bin/node",
    process.execPath,
  ];
  for (const candidate of candidates) {
    if (!candidate || candidate.includes("NiceClaw") || candidate.includes(".openclaw")) {
      continue;
    }
    if (await isExecutable(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to find a real Node.js binary. Set PI_APP_NODE_BINARY=/absolute/path/to/node.");
}

async function assertExecutable(filePath) {
  if (!(await isExecutable(filePath))) {
    throw new Error(`Node binary is not executable: ${filePath}`);
  }
}

async function isExecutable(filePath) {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function spawnChecked(command, args, options) {
  await new Promise((resolve, reject) => {
    console.log(`[pi-gui] ${command} ${args.join(" ")}`);
    const child = spawn(command, args, {
      ...options,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited with signal ${signal}`));
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}
