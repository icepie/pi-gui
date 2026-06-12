// Build a standards-compliant macOS .icns from the squircle source SVG.
//
// Apple's modern .icns uses PNG-encoded frames with these type codes:
//   icp4=16, icp5=32, ic07=128, ic08=256, ic09=512, ic10=1024(512@2x),
//   ic11=32(16@2x), ic12=64(32@2x), ic13=256(128@2x), ic14=512(256@2x)
// We emit the full set so Finder/Dock/Launchpad always find a native frame
// and never fall back to a blank icon.
//
// Usage: node scripts/build-mac-icns.mjs
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const resourcesDir = path.resolve(scriptDir, "..", "resources");
const sourceSvg = path.join(resourcesDir, "icon-mac.svg");
const outputIcns = path.join(resourcesDir, "icon.icns");

// type code -> rendered pixel size
const FRAMES = {
  icp4: 16,
  icp5: 32,
  ic07: 128,
  ic08: 256,
  ic09: 512,
  ic10: 1024,
  ic11: 32,
  ic12: 64,
  ic13: 256,
  ic14: 512,
};

async function main() {
  const tmp = mkdtempSync(path.join(tmpdir(), "pi-gui-icns-"));
  try {
    const chunks = [];
    for (const [type, size] of Object.entries(FRAMES)) {
      const png = await sharp(sourceSvg, { density: 600 })
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toBuffer();
      const header = Buffer.alloc(8);
      header.write(type, 0, "ascii");
      header.writeUInt32BE(png.length + 8, 4);
      chunks.push(header, png);
    }

    const body = Buffer.concat(chunks);
    const fileHeader = Buffer.alloc(8);
    fileHeader.write("icns", 0, "ascii");
    fileHeader.writeUInt32BE(body.length + 8, 4);
    writeFileSync(outputIcns, Buffer.concat([fileHeader, body]));

    console.log(
      `[pi-gui] wrote ${path.relative(resourcesDir, outputIcns)} with frames: ${Object.keys(FRAMES).join(", ")}`,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
