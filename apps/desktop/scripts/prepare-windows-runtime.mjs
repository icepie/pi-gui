import { createWriteStream } from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
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
import tls from "node:tls";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const DEFAULT_PYTHON_VERSION = "3.13.5";
const DEFAULT_PYTHON_RELEASE = "20250708";
const DEFAULT_UV_VERSION = "0.11.6";
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_DOWNLOAD_REDIRECTS = 5;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const targetArch = normalizeWindowsArch(process.env.PI_APP_WINDOWS_ARCH);
const runtimeDir = path.join(desktopDir, "resources", "runtime", targetArch);
const pythonCacheDir = path.resolve(process.env.PI_APP_PYTHON_CACHE_DIR?.trim() || path.join(process.env.HOME ?? tmpdir(), ".cache", "pi-gui", "python"));
const uvCacheDir = path.resolve(process.env.PI_APP_UV_CACHE_DIR?.trim() || path.join(process.env.HOME ?? tmpdir(), ".cache", "pi-gui", "uv"));

async function prepareBundledPython(arch) {
  const release = process.env.PI_APP_BUNDLED_PYTHON_RELEASE?.trim() || DEFAULT_PYTHON_RELEASE;
  const version = process.env.PI_APP_BUNDLED_PYTHON_VERSION?.trim() || DEFAULT_PYTHON_VERSION;
  const triple = windowsTriple(arch);
  const assetNames = [
    `cpython-${version}+${release}-${triple}-install_only_stripped.tar.gz`,
    `cpython-${version}+${release}-${triple}-shared-install_only_stripped.tar.gz`,
  ];
  const stampValue = `${version}+${release}-win32-${arch}`;
  const pythonDir = path.join(runtimeDir, "python");
  const stampPath = path.join(runtimeDir, ".python-stamp");
  const pythonExe = path.join(pythonDir, "python.exe");
  if (await hasCurrentRuntime(stampPath, stampValue, pythonExe)) {
    console.log(`[pi-gui] Reusing bundled Python ${stampValue} at ${pythonDir}`);
    return;
  }

  await mkdir(pythonCacheDir, { recursive: true });
  const source = await downloadFirstAvailableAsset({
    cacheDir: pythonCacheDir,
    assetNames,
    urlsForAsset: (assetName) => bundledPythonUrls(release, assetName),
  });

  const tempDir = await mkdtemp(path.join(tmpdir(), "pi-gui-python-"));
  try {
    await extractTarGz(source.path, tempDir);
    const extractedPythonExe = await findFileRecursive(tempDir, "python.exe");
    if (!extractedPythonExe) {
      throw new Error(`Bundled Python archive does not contain python.exe: ${source.assetName}`);
    }
    await rm(pythonDir, { recursive: true, force: true });
    await copyDirectory(path.dirname(extractedPythonExe), pythonDir);
    if (!(await fileExists(pythonExe))) {
      throw new Error(`Extracted bundled Python is missing ${pythonExe}`);
    }
    await writeFile(stampPath, `${stampValue}\n`, "utf8");
    console.log(`[pi-gui] Prepared bundled Python ${stampValue} -> ${path.relative(desktopDir, pythonDir)}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function prepareBundledUv(arch) {
  const version = process.env.PI_APP_BUNDLED_UV_VERSION?.trim() || DEFAULT_UV_VERSION;
  const assetName = `uv-${windowsTriple(arch)}.zip`;
  const stampValue = `${version}-win32-${arch}`;
  const uvDir = path.join(runtimeDir, "uv");
  const stampPath = path.join(runtimeDir, ".uv-stamp");
  const uvExe = path.join(uvDir, "uv.exe");
  if (await hasCurrentRuntime(stampPath, stampValue, uvExe)) {
    console.log(`[pi-gui] Reusing bundled uv ${stampValue} at ${uvDir}`);
    return;
  }

  await mkdir(uvCacheDir, { recursive: true });
  const source = await downloadFirstAvailableAsset({
    cacheDir: uvCacheDir,
    assetNames: [assetName],
    urlsForAsset: (asset) => bundledUvUrls(version, asset),
  });

  const tempDir = await mkdtemp(path.join(tmpdir(), "pi-gui-uv-"));
  try {
    await assertZipHasCentralDirectory(source.path);
    await extractZip(source.path, tempDir);
    const extractedUvExe = await findFileRecursive(tempDir, "uv.exe");
    if (!extractedUvExe) {
      throw new Error(`Bundled uv archive does not contain uv.exe: ${source.assetName}`);
    }
    await rm(uvDir, { recursive: true, force: true });
    await mkdir(uvDir, { recursive: true });
    await copyFile(extractedUvExe, uvExe);
    await writeFile(stampPath, `${stampValue}\n`, "utf8");
    console.log(`[pi-gui] Prepared bundled uv ${stampValue} -> ${path.relative(desktopDir, uvExe)}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function bundledPythonUrls(release, assetName) {
  const override = process.env.PI_APP_BUNDLED_PYTHON_URL?.trim();
  if (override) {
    return [override];
  }
  const encodedAssetName = encodeURIComponent(assetName);
  return [
    `https://registry.npmmirror.com/-/binary/python-build-standalone/${release}/${encodedAssetName}`,
    `https://github.com/astral-sh/python-build-standalone/releases/download/${release}/${assetName}`,
  ];
}

function bundledUvUrls(version, assetName) {
  const override = process.env.PI_APP_BUNDLED_UV_URL?.trim();
  if (override) {
    return [override];
  }
  return [
    `https://sourceforge.net/projects/uv-project-manager.mirror/files/${version}/${assetName}/download`,
    `https://github.com/astral-sh/uv/releases/download/${version}/${assetName}`,
  ];
}

async function downloadFirstAvailableAsset({ cacheDir, assetNames, urlsForAsset }) {
  const errors = [];
  for (const assetName of assetNames) {
    const cachePath = path.join(cacheDir, assetName);
    if (await fileExists(cachePath)) {
      console.log(`[pi-gui] Reusing cached runtime archive at ${cachePath}`);
      return { assetName, path: cachePath };
    }
    for (const url of urlsForAsset(assetName)) {
      try {
        console.log(`[pi-gui] Downloading runtime archive from ${redactUrlForLog(url)}`);
        await downloadToFile(url, cachePath);
        return { assetName, path: cachePath };
      } catch (error) {
        await rm(cachePath, { force: true });
        errors.push(`${url} -> ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  throw new Error(`Unable to download bundled runtime archive:\n${errors.join("\n")}`);
}

async function downloadToFile(url, targetPath) {
  const tempPath = `${targetPath}.tmp`;
  await rm(tempPath, { force: true });
  await mkdir(path.dirname(targetPath), { recursive: true });
  await downloadUrlToFile(url, tempPath);

  await rm(targetPath, { force: true });
  await copyFile(tempPath, targetPath);
  await rm(tempPath, { force: true });
}

async function downloadUrlToFile(url, targetPath, redirectCount = 0) {
  await new Promise((resolve, reject) => {
    const request = createDownloadRequest(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        if (redirectCount >= MAX_DOWNLOAD_REDIRECTS) {
          reject(new Error(`Too many redirects: ${url}`));
          return;
        }
        const nextUrl = new URL(response.headers.location, url).toString();
        downloadUrlToFile(nextUrl, targetPath, redirectCount + 1).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode ?? "unknown"} — ${url}`));
        return;
      }

      const file = createWriteStream(targetPath);
      let settled = false;
      const fail = (error) => {
        if (settled) {
          return;
        }
        settled = true;
        response.destroy();
        file.destroy();
        reject(error);
      };
      response.on("error", fail);
      file.on("error", fail);
      file.on("finish", () => {
        file.close((error) => {
          if (settled) {
            return;
          }
          settled = true;
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      response.pipe(file);
    });
    request.on("error", reject);
    request.setTimeout(DOWNLOAD_TIMEOUT_MS, () => {
      request.destroy(new Error(`Download timed out: ${url}`));
    });
  });
}

function createDownloadRequest(rawUrl, onResponse) {
  const target = new URL(rawUrl);
  const proxyUrl = resolveProxyUrl(target);
  if (proxyUrl && target.protocol === "https:") {
    console.log(`[pi-gui] Download proxy ${redactUrlForLog(proxyUrl.toString())}`);
    return https.get(target, { agent: new HttpsTunnelProxyAgent(proxyUrl) }, onResponse);
  }
  if (proxyUrl && target.protocol === "http:") {
    console.log(`[pi-gui] Download proxy ${redactUrlForLog(proxyUrl.toString())}`);
    return http.get({
      protocol: proxyUrl.protocol,
      hostname: proxyUrl.hostname,
      port: proxyUrl.port || (proxyUrl.protocol === "https:" ? 443 : 80),
      path: target.toString(),
      headers: {
        Host: target.host,
      },
    }, onResponse);
  }
  return target.protocol === "https:" ? https.get(target, onResponse) : http.get(target, onResponse);
}

function resolveProxyUrl(target) {
  if (shouldBypassProxy(target)) {
    return undefined;
  }
  const raw = target.protocol === "https:"
    ? envText("HTTPS_PROXY") || envText("HTTP_PROXY") || envText("ALL_PROXY")
    : envText("HTTP_PROXY") || envText("HTTPS_PROXY") || envText("ALL_PROXY");
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function shouldBypassProxy(target) {
  const noProxy = envText("NO_PROXY");
  if (!noProxy) {
    return false;
  }
  const hostname = target.hostname.toLowerCase();
  return noProxy.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean).some((entry) => {
    if (entry === "*") {
      return true;
    }
    const normalized = entry.replace(/^\*\./, "").replace(/^\./, "");
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  });
}

class HttpsTunnelProxyAgent extends https.Agent {
  constructor(proxyUrl) {
    super({ keepAlive: false });
    this.proxyUrl = proxyUrl;
  }

  createConnection(options, callback) {
    const proxyPort = Number(this.proxyUrl.port || (this.proxyUrl.protocol === "https:" ? 443 : 80));
    const targetHost = String(options.host || options.hostname || "");
    const targetPort = Number(options.port || 443);
    const proxySocket = this.proxyUrl.protocol === "https:"
      ? tls.connect({ host: this.proxyUrl.hostname, port: proxyPort, servername: this.proxyUrl.hostname })
      : net.connect({ host: this.proxyUrl.hostname, port: proxyPort });

    let settled = false;
    const finish = (error, socket) => {
      if (settled) {
        return;
      }
      settled = true;
      callback(error ?? null, socket);
    };
    const fail = (message, error) => {
      proxySocket.destroy();
      finish(new Error(error?.message ? `${message}: ${error.message}` : message));
    };

    proxySocket.setTimeout(DOWNLOAD_TIMEOUT_MS, () => fail(`Proxy connection timed out: ${this.proxyUrl.origin}`));
    proxySocket.once("error", (error) => fail(`Proxy connection failed: ${this.proxyUrl.origin}`, error));

    const sendConnect = () => {
      const headers = [
        `CONNECT ${targetHost}:${targetPort} HTTP/1.1`,
        `Host: ${targetHost}:${targetPort}`,
        "Proxy-Connection: Keep-Alive",
      ];
      if (this.proxyUrl.username || this.proxyUrl.password) {
        const auth = `${decodeURIComponent(this.proxyUrl.username)}:${decodeURIComponent(this.proxyUrl.password)}`;
        headers.push(`Proxy-Authorization: Basic ${Buffer.from(auth).toString("base64")}`);
      }
      headers.push("", "");
      proxySocket.write(headers.join("\r\n"));
    };

    if (this.proxyUrl.protocol === "https:") {
      proxySocket.once("secureConnect", sendConnect);
    } else {
      proxySocket.once("connect", sendConnect);
    }

    const chunks = [];
    let byteLength = 0;
    proxySocket.on("data", function onProxyData(chunk) {
      chunks.push(chunk);
      byteLength += chunk.length;
      const buffer = Buffer.concat(chunks, byteLength);
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }
      proxySocket.removeListener("data", onProxyData);
      const headerText = buffer.subarray(0, headerEnd).toString("latin1");
      const statusCode = Number.parseInt(headerText.match(/^HTTP\/1\.[01]\s+(\d+)/i)?.[1] ?? "", 10);
      if (statusCode !== 200) {
        fail(`Proxy CONNECT failed: HTTP ${statusCode || "unknown"} — ${this.proxyUrl.origin}`);
        return;
      }
      const rest = buffer.subarray(headerEnd + 4);
      if (rest.length > 0) {
        proxySocket.unshift(rest);
      }
      const tlsSocket = tls.connect({ socket: proxySocket, servername: String(options.servername || targetHost) });
      tlsSocket.once("error", (error) => finish(error));
      tlsSocket.once("secureConnect", () => finish(undefined, tlsSocket));
    });
  }
}

async function extractTarGz(archivePath, outputDir) {
  await spawnChecked(resolveTarCommand(), ["xzf", archivePath, "-C", outputDir]);
}

async function extractZip(archivePath, outputDir) {
  if (process.platform === "win32") {
    await spawnChecked("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${escapePowerShell(archivePath)}' -DestinationPath '${escapePowerShell(outputDir)}' -Force`,
    ]);
    return;
  }
  await spawnChecked("unzip", ["-oq", archivePath, "-d", outputDir]);
}

function resolveTarCommand() {
  if (process.platform !== "win32") {
    return "tar";
  }
  return path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe");
}

async function assertZipHasCentralDirectory(zipPath) {
  const handle = await import("node:fs/promises").then((fs) => fs.open(zipPath, "r"));
  try {
    const stat = await handle.stat();
    if (stat.size < 22) {
      throw new Error(`zip file is too small: ${zipPath}`);
    }
    const readSize = Math.min(stat.size, 128 * 1024);
    const buffer = Buffer.alloc(readSize);
    await handle.read(buffer, 0, readSize, stat.size - readSize);
    if (buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) === -1) {
      throw new Error(`zip is missing end-of-central-directory signature: ${zipPath}`);
    }
  } finally {
    await handle.close();
  }
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
      throw new Error(`Symbolic links are not supported in bundled runtime: ${sourcePath}`);
    }
    if (entry.isFile()) {
      await mkdir(path.dirname(targetPath), { recursive: true });
      await writeFile(targetPath, await readFile(sourcePath));
    }
  }
}

async function findFileRecursive(rootDir, fileName) {
  const wanted = fileName.toLowerCase();
  const queue = [rootDir];
  while (queue.length > 0) {
    const current = queue.shift();
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase() === wanted) {
        return entryPath;
      }
    }
  }
  return undefined;
}

async function hasCurrentRuntime(stampPath, stampValue, executablePath) {
  if (!(await fileExists(executablePath)) || !(await fileExists(stampPath))) {
    return false;
  }
  return (await readFile(stampPath, "utf8")).trim() === stampValue;
}

function normalizeWindowsArch(value) {
  const normalized = String(value ?? "x64").trim().toLowerCase();
  if (normalized === "x64" || normalized === "arm64") {
    return normalized;
  }
  throw new Error(`Unsupported Windows packaging architecture: ${value}`);
}

function windowsTriple(arch) {
  return arch === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc";
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function redactUrlForLog(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = "***";
    }
    if (parsed.username && !parsed.password) {
      parsed.username = "***";
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function envText(name) {
  return String(process.env[name] ?? process.env[name.toLowerCase()] ?? "").trim();
}

function escapePowerShell(value) {
  return value.replace(/'/g, "''");
}

async function spawnChecked(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: desktopDir,
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

await mkdir(runtimeDir, { recursive: true });
await prepareBundledPython(targetArch);
await prepareBundledUv(targetArch);
