import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const resourcesDir = path.join(desktopDir, "resources");

const pngPath = path.join(resourcesDir, "icon.png");
const icnsPath = path.join(resourcesDir, "icon.icns");
const icoPath = path.join(resourcesDir, "icon.ico");

await verifyPngIcon(pngPath);
await verifyIcnsIcon(icnsPath);
await verifyIcoIcon(icoPath);

console.log("[pi-gui] App icon resources are valid.");

async function verifyPngIcon(filePath) {
  const buffer = await readIconFile(filePath, "PNG icon");
  if (!buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error(`Invalid PNG icon header: ${filePath}`);
  }
  if (buffer.length < 24) {
    throw new Error(`Truncated PNG icon: ${filePath}`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width < 256 || height < 256) {
    throw new Error(`PNG icon must be at least 256x256. Got ${width}x${height} in ${filePath}`);
  }
}

async function verifyIcnsIcon(filePath) {
  const buffer = await readIconFile(filePath, "macOS ICNS icon");
  if (buffer.subarray(0, 4).toString("ascii") !== "icns") {
    throw new Error(`Invalid ICNS header: ${filePath}`);
  }
  const declaredSize = buffer.readUInt32BE(4);
  if (declaredSize !== buffer.length) {
    throw new Error(`ICNS declared size ${declaredSize} does not match file size ${buffer.length}: ${filePath}`);
  }
}

async function verifyIcoIcon(filePath) {
  const entries = await readIcoEntries(filePath);
  if (!entries.some((entry) => entry.width >= 256 && entry.height >= 256)) {
    const largest = entries.reduce(
      (best, entry) => (entry.width * entry.height > best.width * best.height ? entry : best),
      { width: 0, height: 0 },
    );
    throw new Error(
      `Windows ICO icon must include at least one 256x256 image. ` +
        `Largest image is ${largest.width}x${largest.height} in ${filePath}.`,
    );
  }
}

async function readIconFile(filePath, label) {
  const fileStat = await stat(filePath).catch((error) => {
    throw new Error(`Missing ${label}: ${filePath} (${error.message})`);
  });
  if (!fileStat.isFile() || fileStat.size <= 0) {
    throw new Error(`${label} must be a non-empty file: ${filePath}`);
  }
  return readFile(filePath);
}

async function readIcoEntries(filePath) {
  const buffer = await readIconFile(filePath, "Windows ICO icon");
  if (buffer.length < 6) {
    throw new Error(`Invalid ICO file: ${filePath}`);
  }

  const reserved = buffer.readUInt16LE(0);
  const type = buffer.readUInt16LE(2);
  const count = buffer.readUInt16LE(4);
  if (reserved !== 0 || type !== 1 || count < 1) {
    throw new Error(`Invalid ICO header in ${filePath}`);
  }

  const directoryLength = 6 + count * 16;
  if (buffer.length < directoryLength) {
    throw new Error(`Truncated ICO directory in ${filePath}`);
  }

  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return {
      width: icoDimension(buffer[offset]),
      height: icoDimension(buffer[offset + 1]),
    };
  });
}

function icoDimension(value) {
  return value === 0 ? 256 : value;
}
