import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyManagedPythonProcessEnv } from "./managed-python-env.js";

const DEFAULT_INDEX = "https://mirrors.aliyun.com/pypi/simple";

test("applyManagedPythonProcessEnv configures domestic Python and uv defaults", () => {
  const previousEnv = snapshotEnv();
  try {
    const root = mkdtempSync(path.join(tmpdir(), "pi-gui-managed-python-"));
    const resourcesPath = path.join(root, "resources");
    const stateDir = path.join(root, "state");
    const pythonBin = process.platform === "win32"
      ? path.join(resourcesPath, "runtime", "python", "python.exe")
      : path.join(resourcesPath, "runtime", "python", "bin", "python3");
    const uvBin = process.platform === "win32"
      ? path.join(resourcesPath, "runtime", "uv", "uv.exe")
      : path.join(resourcesPath, "runtime", "uv", "uv");
    mkdirSync(path.dirname(pythonBin), { recursive: true });
    mkdirSync(path.dirname(uvBin), { recursive: true });
    writeFileSync(pythonBin, "");
    writeFileSync(uvBin, "");

    process.env.PIP_INDEX_URL = "https://pypi.org/simple";
    process.env.UV_DEFAULT_INDEX = "https://pypi.org/simple";
    applyManagedPythonProcessEnv({ resourcesPath, stateDir });

    assert.equal(process.env.PIP_INDEX_URL, DEFAULT_INDEX);
    assert.equal(process.env.UV_DEFAULT_INDEX, DEFAULT_INDEX);
    assert.equal(process.env.PIP_DISABLE_PIP_VERSION_CHECK, "1");
    assert.equal(process.env.PIP_USER, "1");
    assert.equal(process.env.PYTHON, pythonBin);
    assert.equal(process.env.UV_PYTHON, pythonBin);
    assert.equal(process.env.PI_APP_UV_BIN, uvBin);
    assert.equal(process.env.PYTHONUSERBASE, path.join(stateDir, "python-user"));
    assert.equal(process.env.UV_TOOL_DIR, path.join(stateDir, "uv", "tools"));
    assert.equal(process.env.UV_TOOL_BIN_DIR, path.join(stateDir, "uv", "bin"));
    assertPathStartsWith([path.dirname(pythonBin), path.dirname(uvBin), process.env.UV_TOOL_BIN_DIR]);
  } finally {
    restoreEnv(previousEnv);
  }
});

test("applyManagedPythonProcessEnv allows explicit mirror override", () => {
  const previousEnv = snapshotEnv();
  try {
    const stateDir = mkdtempSync(path.join(tmpdir(), "pi-gui-managed-python-state-"));
    process.env.PI_APP_PYTHON_PACKAGE_INDEX = "https://example.test/simple";

    applyManagedPythonProcessEnv({ stateDir });

    assert.equal(process.env.PIP_INDEX_URL, "https://example.test/simple");
    assert.equal(process.env.UV_DEFAULT_INDEX, "https://example.test/simple");
  } finally {
    restoreEnv(previousEnv);
  }
});

function assertPathStartsWith(expectedEntries: readonly (string | undefined)[]): void {
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  const entries = (process.env[pathKey] ?? "").split(process.platform === "win32" ? ";" : path.delimiter);
  for (const [index, expected] of expectedEntries.entries()) {
    assert.equal(entries[index], expected);
  }
}

function snapshotEnv(): NodeJS.ProcessEnv {
  return { ...process.env };
}

function restoreEnv(snapshot: NodeJS.ProcessEnv): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }
  for (const [key, value] of Object.entries(snapshot)) {
    process.env[key] = value;
  }
}
