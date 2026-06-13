import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { forcePersistSession } from "./session-supervisor-utils.js";

// Regression for the "EEXIST: file already exists" failure when sending the first
// message in a freshly created session. createSession() eagerly persists via
// forcePersistSession(); the runtime's lazy-flush _persist() would then exclusive-
// create (open flag "wx") the already-written session file on the first assistant
// message. forcePersistSession() must mark the manager flushed so the next persist
// appends instead.
test("forcePersistSession lets the first turn persist without EEXIST", () => {
  const sessionDir = mkdtempSync(path.join(tmpdir(), "pi-gui-persist-sessions-"));
  const cwd = mkdtempSync(path.join(tmpdir(), "pi-gui-persist-cwd-"));
  try {
    const sessionManager = SessionManager.create(cwd, sessionDir);
    sessionManager.appendSessionInfo("Regression session");
    forcePersistSession(sessionManager);

    // Shapes are cast to the appendMessage parameter type: the runtime only reads
    // `role` for its flush logic, and the test targets the fs persistence path.
    type AppendMessageArg = Parameters<SessionManager["appendMessage"]>[0];
    const userMessage = {
      role: "user",
      content: [{ type: "text", text: "1" }],
      timestamp: Date.now(),
    } as unknown as AppendMessageArg;
    const assistantMessage = {
      role: "assistant",
      content: [{ type: "text", text: "ok" }],
      timestamp: Date.now(),
    } as unknown as AppendMessageArg;

    assert.doesNotThrow(() => {
      sessionManager.appendMessage(userMessage);
      sessionManager.appendMessage(assistantMessage);
    });
  } finally {
    rmSync(sessionDir, { recursive: true, force: true });
    rmSync(cwd, { recursive: true, force: true });
  }
});
