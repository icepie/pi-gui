import { createWriteStream } from "node:fs";
import {
  access,
  constants,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const DEFAULT_GIT_BASH_URLS = {
  x64: "https://github.com/git-for-windows/git/releases/download/v2.54.0.windows.1/PortableGit-2.54.0-64-bit.7z.exe",
  arm64: "https://github.com/git-for-windows/git/releases/download/v2.54.0.windows.1/PortableGit-2.54.0-arm64.7z.exe",
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const gitBashRoot = path.join(desktopDir, "resources", "git-bash");
const targetArch = normalizeWindowsArch(process.env.PI_APP_WINDOWS_ARCH);
const archRuntimeDir = path.join(gitBashRoot, "runtime", targetArch);
const currentRuntimeDir = path.join(gitBashRoot, "runtime", "current");
const markerFile = path.join(archRuntimeDir, ".pi-gui-source.json");
const defaultCacheDir = path.join(process.env.HOME ?? tmpdir(), ".cache", "pi-gui", "git-bash");
const cacheDir = path.resolve(process.env.PI_APP_GIT_BASH_CACHE_DIR?.trim() || defaultCacheDir);
const githubProxy = normalizeGithubProxy(process.env.PI_APP_GITHUB_PROXY);
const downloadSource = await resolveDownloadSource(targetArch, githubProxy);
const cacheArchivePath = path.join(cacheDir, `git-bash-portable-${targetArch}${archiveSuffixForUrl(downloadSource.url)}`);

await mkdir(gitBashRoot, { recursive: true });

if (await hasBundledBash(archRuntimeDir)) {
  await refreshCurrentRuntime(archRuntimeDir, currentRuntimeDir);
  console.log(`[pi-gui] Reusing bundled Git Bash runtime at ${archRuntimeDir}`);
  process.exit(0);
}

if (!downloadSource) {
  throw new Error(
    `Windows packaging requires a Git Bash runtime for ${targetArch}. Set PI_APP_GIT_BASH_URL_${targetArch.toUpperCase()} or PI_APP_GIT_BASH_URL to a portable Git for Windows archive, or pre-populate apps/desktop/resources/git-bash/runtime/${targetArch}/usr/bin/bash.exe.`,
  );
}

await mkdir(cacheDir, { recursive: true });

if (!(await fileExists(cacheArchivePath))) {
  console.log(`[pi-gui] Downloading portable Git Bash from ${downloadSource.url}`);
  await downloadToFile(downloadSource.url, cacheArchivePath);
} else {
  console.log(`[pi-gui] Reusing cached Git Bash archive at ${cacheArchivePath}`);
}

const tempDir = await mkdtemp(path.join(tmpdir(), "pi-gui-git-bash-"));
try {
  await extractArchive(cacheArchivePath, tempDir);
  const extractedRuntimeDir = await findGitBashRuntimeRoot(tempDir);
  if (!extractedRuntimeDir) {
    throw new Error(`Downloaded archive does not contain bin/bash.exe: ${cacheArchivePath}`);
  }

  await rm(archRuntimeDir, { recursive: true, force: true });
  await copyDirectory(extractedRuntimeDir, archRuntimeDir);

  if (!(await hasBundledBash(archRuntimeDir))) {
    throw new Error(`Extracted Git Bash runtime is missing bin/bash.exe: ${archRuntimeDir}`);
  }

  await refreshCurrentRuntime(archRuntimeDir, currentRuntimeDir);

  await writeFile(
    markerFile,
    `${JSON.stringify(
      {
        ...downloadSource,
        archive: cacheArchivePath,
        preparedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`[pi-gui] Prepared bundled Git Bash runtime at ${archRuntimeDir}`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

function normalizeWindowsArch(value) {
  const normalized = String(value ?? "x64").trim().toLowerCase();
  if (normalized === "x64" || normalized === "arm64") {
    return normalized;
  }
  throw new Error(`Unsupported Windows packaging architecture: ${value}`);
}

async function resolveDownloadSource(arch, proxyPrefix) {
  const archSpecific = process.env[`PI_APP_GIT_BASH_URL_${arch.toUpperCase()}`]?.trim();
  if (archSpecific) {
    return { kind: "env", url: archSpecific };
  }
  const generic = process.env.PI_APP_GIT_BASH_URL?.trim();
  if (generic) {
    return { kind: "env", url: generic };
  }

  const latest = await resolveLatestGithubReleaseUrl(arch, proxyPrefix);
  if (latest) {
    return latest;
  }

  return {
    kind: "fallback",
    url: applyGithubProxy(DEFAULT_GIT_BASH_URLS[arch], proxyPrefix),
  };
}

function normalizeGithubProxy(value) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function applyGithubProxy(url, proxyPrefix) {
  if (!proxyPrefix) {
    return url;
  }
  return `${proxyPrefix}${url}`;
}

async function resolveLatestGithubReleaseUrl(arch, proxyPrefix) {
  const ghPath = process.env.PI_APP_GH_PATH?.trim() || "gh";
  try {
    const tagName = (await captureCommand(ghPath, [
      "release",
      "view",
      "--repo",
      "git-for-windows/git",
      "--json",
      "tagName",
      "--jq",
      ".tagName",
    ])).trim();
    if (!tagName) {
      return undefined;
    }

    const version = gitForWindowsVersionFromTag(tagName);
    const assetName = portableGitAssetName(version, arch);
    return {
      kind: "gh-release-view",
      tagName,
      assetName,
      url: applyGithubProxy(
        `https://github.com/git-for-windows/git/releases/download/${tagName}/${assetName}`,
        proxyPrefix,
      ),
    };
  } catch {
    return undefined;
  }
}

function gitForWindowsVersionFromTag(tagName) {
  const match = /^v(\d+\.\d+\.\d+)/.exec(tagName.trim());
  if (!match) {
    throw new Error(`Unexpected Git for Windows tag format: ${tagName}`);
  }
  return match[1];
}

function portableGitAssetName(version, arch) {
  return arch === "arm64"
    ? `PortableGit-${version}-arm64.7z.exe`
    : `PortableGit-${version}-64-bit.7z.exe`;
}

function archiveSuffixForUrl(url) {
  if (!url) {
    return ".archive";
  }
  const lower = url.toLowerCase();
  if (lower.endsWith(".7z.exe")) {
    return ".7z.exe";
  }
  if (lower.endsWith(".zip")) {
    return ".zip";
  }
  return ".archive";
}

async function hasBundledBash(rootDir) {
  return (await fileExists(path.join(rootDir, "usr", "bin", "bash.exe"))) || fileExists(path.join(rootDir, "bin", "bash.exe"));
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function downloadToFile(url, targetPath) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download Git Bash runtime: ${response.status} ${response.statusText}`);
  }

  const tempPath = `${targetPath}.tmp`;
  await rm(tempPath, { force: true });

  await new Promise((resolve, reject) => {
    const file = createWriteStream(tempPath);
    const body = Readable.fromWeb(response.body);
    body.on("error", reject);
    file.on("error", reject);
    file.on("finish", resolve);
    body.pipe(file);
  });

  await rm(targetPath, { force: true });
  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(tempPath, targetPath);
  await rm(tempPath, { force: true });
}

async function extractArchive(archivePath, outputDir) {
  const lower = archivePath.toLowerCase();
  if (lower.endsWith(".zip")) {
    if (process.platform === "win32") {
      await spawnChecked(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `Expand-Archive -LiteralPath '${escapePowerShell(archivePath)}' -DestinationPath '${escapePowerShell(outputDir)}' -Force`,
        ],
        desktopDir,
      );
      return;
    }
    await spawnChecked("unzip", ["-oq", archivePath, "-d", outputDir], desktopDir);
    return;
  }

  if (lower.endsWith(".7z.exe")) {
    const extracted = await tryExtractSevenZipSfx(archivePath, outputDir);
    if (extracted) {
      return;
    }
    if (process.platform === "win32") {
      await spawnChecked(archivePath, [`-o${outputDir}`, "-y"], desktopDir);
      return;
    }
    throw new Error(
      `Portable Git self-extracting archives require a 7z-compatible extractor when packaging on ${process.platform}: ${archivePath}`,
    );
  }

  throw new Error(`Unsupported Git Bash archive format: ${archivePath}`);
}

async function tryExtractSevenZipSfx(archivePath, outputDir) {
  const sevenZip = await findAvailableCommand(["7z", "7zz"]);
  if (sevenZip) {
    await spawnChecked(sevenZip, ["x", archivePath, `-o${outputDir}`, "-y"], desktopDir);
    return true;
  }

  const bsdtar = await findAvailableCommand(["bsdtar"]);
  if (bsdtar) {
    await spawnChecked(bsdtar, ["-xf", archivePath, "-C", outputDir], desktopDir);
    return true;
  }

  return false;
}

async function findGitBashRuntimeRoot(searchRoot) {
  const directCandidates = [
    path.join(searchRoot, "usr", "bin", "bash.exe"),
    path.join(searchRoot, "bin", "bash.exe"),
  ];
  if (await anyFileExists(directCandidates)) {
    return searchRoot;
  }

  const entries = await readdir(searchRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidateRoot = path.join(searchRoot, entry.name);
    if (
      await anyFileExists([
        path.join(candidateRoot, "usr", "bin", "bash.exe"),
        path.join(candidateRoot, "bin", "bash.exe"),
      ])
    ) {
      return candidateRoot;
    }
  }

  return undefined;
}

async function anyFileExists(paths) {
  for (const candidate of paths) {
    if (await fileExists(candidate)) {
      return true;
    }
  }
  return false;
}

async function copyDirectory(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
      continue;
    }
    if (entry.isSymbolicLink()) {
      throw new Error(`Symbolic links are not supported in bundled Git Bash runtime: ${sourcePath}`);
    }
    if (entry.isFile()) {
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, await readFile(sourcePath));
    }
  }
}

async function refreshCurrentRuntime(sourceDir, targetDir) {
  await rm(targetDir, { recursive: true, force: true });
  await copyDirectory(sourceDir, targetDir);
}

async function spawnChecked(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function captureCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: desktopDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}${stderr ? `: ${stderr}` : ""}`));
    });
  });
}

async function findAvailableCommand(candidates) {
  for (const candidate of candidates) {
    try {
      const resolved = (
        await captureCommand(process.env.SHELL || "/bin/zsh", ["-lc", `command -v ${shellQuote(candidate)}`])
      ).trim();
      if (resolved) {
        return resolved;
      }
    } catch {
      // Try the next extractor.
    }
  }
  return undefined;
}

function escapePowerShell(value) {
  return value.replace(/'/g, "''");
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
