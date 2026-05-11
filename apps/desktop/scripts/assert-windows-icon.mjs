import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(scriptDir, "..");
const iconPath = path.join(desktopDir, "resources", "icon.ico");

const entries = await readIcoEntries(iconPath);
const largest = entries.reduce(
  (best, entry) => (entry.width * entry.height > best.width * best.height ? entry : best),
  { width: 0, height: 0 },
);

if (!entries.some((entry) => entry.width >= 256 && entry.height >= 256)) {
  throw new Error(
    `Windows installer icon must include at least one 256x256 image. ` +
      `Largest image in ${path.relative(desktopDir, iconPath)} is ${largest.width}x${largest.height}.`,
  );
}

console.log(`[pi-gui] Windows icon includes ${formatEntries(entries)}.`);

async function readIcoEntries(filePath) {
  const buffer = await readFile(filePath);
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
      bitDepth: buffer.readUInt16LE(offset + 6),
    };
  });
}

function icoDimension(value) {
  return value === 0 ? 256 : value;
}

function formatEntries(entries) {
  return entries
    .map((entry) => `${entry.width}x${entry.height}${entry.bitDepth ? `@${entry.bitDepth}` : ""}`)
    .join(", ");
}
