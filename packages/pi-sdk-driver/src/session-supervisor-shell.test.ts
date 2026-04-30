import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createSettingsManagerWithShellPath,
  normalizeShellPath,
} from "./session-supervisor.js";

test("normalizeShellPath trims and drops empty values", () => {
  assert.equal(normalizeShellPath(undefined), undefined);
  assert.equal(normalizeShellPath("   "), undefined);
  assert.equal(normalizeShellPath("  C:\\portable-git\\bin\\bash.exe  "), "C:\\portable-git\\bin\\bash.exe");
});

test("createSettingsManagerWithShellPath applies shellPath override without mutating files", () => {
  const workspacePath = mkdtempSync(path.join(tmpdir(), "pi-gui-shell-settings-"));
  const settingsManager = createSettingsManagerWithShellPath(workspacePath, "C:\\portable-git\\bin\\bash.exe");

  assert.equal(settingsManager.getShellPath(), "C:\\portable-git\\bin\\bash.exe");
  assert.equal(settingsManager.getGlobalSettings().shellPath, undefined);
  assert.equal(settingsManager.getProjectSettings().shellPath, undefined);
});
