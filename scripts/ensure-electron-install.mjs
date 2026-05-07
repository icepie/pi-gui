import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function resolveElectronPackage() {
  try {
    return require.resolve("electron/package.json");
  } catch {
    return undefined;
  }
}

function getPlatformExecutablePath() {
  switch (process.platform) {
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "freebsd":
    case "openbsd":
    case "linux":
      return "electron";
    case "win32":
      return "electron.exe";
    default:
      throw new Error(`Electron builds are not available on platform: ${process.platform}`);
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function hasCompleteInstall(electronDir, version, executablePath) {
  const distDir = path.join(electronDir, "dist");
  const pathFile = path.join(electronDir, "path.txt");
  const versionFile = path.join(distDir, "version");
  const binaryPath = path.join(distDir, executablePath);
  const requiredRuntimeFile =
    process.platform === "darwin"
      ? path.join(
          distDir,
          "Electron.app",
          "Contents",
          "Frameworks",
          "Electron Framework.framework",
          "Resources",
          "icudtl.dat",
        )
      : path.join(distDir, "icudtl.dat");

  return (
    readText(pathFile) === executablePath &&
    readText(versionFile)?.replace(/^v/, "") === version &&
    fs.existsSync(binaryPath) &&
    fs.existsSync(requiredRuntimeFile)
  );
}

function runInstallScript(electronDir) {
  const installScript = path.join(electronDir, "install.js");
  if (!fs.existsSync(installScript)) {
    return false;
  }

  const result = childProcess.spawnSync(process.execPath, [installScript], {
    cwd: electronDir,
    stdio: "inherit",
    env: process.env,
  });

  return result.status === 0;
}

async function downloadElectronZip(electronDir, version) {
  const electronRequire = createRequire(path.join(electronDir, "package.json"));
  const { downloadArtifact } = electronRequire("@electron/get");
  const checksums = electronRequire("./checksums.json");

  return downloadArtifact({
    version,
    artifactName: "electron",
    platform: process.env.ELECTRON_INSTALL_PLATFORM ?? process.env.npm_config_platform ?? process.platform,
    arch: process.env.ELECTRON_INSTALL_ARCH ?? process.env.npm_config_arch ?? process.arch,
    cacheRoot: process.env.electron_config_cache,
    checksums:
      process.env.electron_use_remote_checksums || process.env.npm_config_electron_use_remote_checksums
        ? undefined
        : checksums,
  });
}

function findCommand(candidates) {
  for (const candidate of candidates) {
    const result = childProcess.spawnSync(candidate, ["--help"], {
      stdio: "ignore",
    });
    if (result.error?.code !== "ENOENT") {
      return candidate;
    }
  }
  return undefined;
}

async function extractZip(zipPath, electronDir, executablePath) {
  const distDir = path.join(electronDir, "dist");
  fs.mkdirSync(distDir, { recursive: true });

  if (process.platform === "win32") {
    const powershell = findCommand(["powershell.exe", "powershell", "pwsh"]);
    if (!powershell) {
      throw new Error("Unable to repair Electron install: PowerShell was not found to extract the Electron zip.");
    }

    const result = childProcess.spawnSync(
      powershell,
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
        zipPath,
        distDir,
      ],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw new Error(`Unable to repair Electron install: ${powershell} failed with status ${result.status}.`);
    }
  } else {
    const unzip = findCommand(["/usr/bin/unzip", "unzip"]);
    if (!unzip) {
      throw new Error("Unable to repair Electron install: unzip was not found to extract the Electron zip.");
    }

    const result = childProcess.spawnSync(unzip, ["-o", zipPath, "-d", distDir], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error(`Unable to repair Electron install: ${unzip} failed with status ${result.status}.`);
    }
  }

  fs.writeFileSync(path.join(electronDir, "path.txt"), executablePath);
}

async function main() {
  const packageJsonPath = resolveElectronPackage();
  if (!packageJsonPath) {
    return;
  }

  const electronDir = path.dirname(packageJsonPath);
  const { version } = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const executablePath = getPlatformExecutablePath();

  if (hasCompleteInstall(electronDir, version, executablePath)) {
    return;
  }

  runInstallScript(electronDir);
  if (hasCompleteInstall(electronDir, version, executablePath)) {
    return;
  }

  const zipPath = await downloadElectronZip(electronDir, version);
  await extractZip(zipPath, electronDir, executablePath);

  if (!hasCompleteInstall(electronDir, version, executablePath)) {
    throw new Error(`Electron ${version} is still incomplete after repair.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
