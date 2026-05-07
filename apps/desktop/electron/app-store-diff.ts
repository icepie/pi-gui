import { execFile } from "node:child_process";
import { open } from "node:fs/promises";
import path from "node:path";

function validateFilePath(workspacePath: string, filePath: string): string {
  const resolved = path.resolve(workspacePath, filePath);
  if (!resolved.startsWith(workspacePath + path.sep) && resolved !== workspacePath) {
    throw new Error("Path escapes workspace");
  }
  return filePath;
}

export interface ChangedFileEntry {
  readonly path: string;
  readonly status: "added" | "modified" | "deleted" | "untracked";
  readonly staged: boolean;
  readonly additions: number;
  readonly deletions: number;
  readonly binary: boolean;
}

export async function getChangedFiles(workspacePath: string): Promise<ChangedFileEntry[]> {
  const entries = await new Promise<ChangedFileEntry[]>((resolve) => {
    execFile(
      "git",
      ["status", "--porcelain"],
      { cwd: workspacePath, maxBuffer: 2 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }
        const entries: ChangedFileEntry[] = [];
        for (const line of stdout.split("\n")) {
          if (!line.trim()) {
            continue;
          }
          const xy = line.slice(0, 2);
          let filePath = line.slice(3).trim();
          // Renames show as "old -> new"; use the new path
          const renameArrow = filePath.indexOf(" -> ");
          if (renameArrow >= 0) {
            filePath = filePath.slice(renameArrow + 4);
          }
          entries.push({
            path: filePath,
            status: parseStatus(xy),
            staged: isFullyStaged(xy),
            additions: 0,
            deletions: 0,
            binary: false,
          });
        }
        resolve(entries);
      },
    );
  });

  if (entries.length === 0) {
    return entries;
  }

  const [stats, binaryPaths] = await Promise.all([
    getDiffStats(workspacePath),
    detectBinaryEntries(workspacePath, entries),
  ]);
  return entries.map((entry) => ({
    ...entry,
    additions: stats.get(entry.path)?.additions ?? 0,
    deletions: stats.get(entry.path)?.deletions ?? 0,
    binary: Boolean(stats.get(entry.path)?.binary || binaryPaths.has(entry.path)),
  }));
}

export function getFileDiff(workspacePath: string, filePath: string): Promise<string> {
  validateFilePath(workspacePath, filePath);
  return new Promise((resolve) => {
    execFile(
      "git",
      ["diff", "--", filePath],
      { cwd: workspacePath, maxBuffer: 5 * 1024 * 1024 },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          // Try staged diff
          execFile(
            "git",
            ["diff", "--cached", "--", filePath],
            { cwd: workspacePath, maxBuffer: 5 * 1024 * 1024 },
            (error2, stdout2) => {
              if (!error2 && stdout2.trim()) {
                resolve(stdout2);
                return;
              }
              // Untracked file — show content as all-additions diff
              execFile(
                "git",
                ["diff", "--no-index", "--", "/dev/null", filePath],
                { cwd: workspacePath, maxBuffer: 5 * 1024 * 1024 },
                (_error3, stdout3) => {
                  // git diff --no-index exits 1 when files differ, which is expected
                  resolve(stdout3 || "");
                },
              );
            },
          );
          return;
        }
        resolve(stdout);
      },
    );
  });
}

export function stageFile(workspacePath: string, filePath: string): Promise<void> {
  validateFilePath(workspacePath, filePath);
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      ["add", "--", filePath],
      { cwd: workspacePath },
      (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      },
    );
  });
}

function parseStatus(xy: string): ChangedFileEntry["status"] {
  const x = xy[0] ?? " ";
  const y = xy[1] ?? " ";

  if (x === "?" && y === "?") {
    return "untracked";
  }
  if (x === "A" || y === "A") {
    return "added";
  }
  if (x === "D" || y === "D") {
    return "deleted";
  }
  return "modified";
}

function isFullyStaged(xy: string): boolean {
  const x = xy[0] ?? " ";
  const y = xy[1] ?? " ";
  if (x === "?" || x === " ") return false;
  return y === " ";
}

interface DiffStatEntry {
  additions: number;
  deletions: number;
  binary: boolean;
}

async function getDiffStats(workspacePath: string): Promise<Map<string, DiffStatEntry>> {
  const stats = new Map<string, DiffStatEntry>();
  const [unstaged, staged] = await Promise.all([
    runGitNumstat(workspacePath, ["diff", "--numstat"]),
    runGitNumstat(workspacePath, ["diff", "--cached", "--numstat"]),
  ]);
  mergeStats(stats, unstaged);
  mergeStats(stats, staged);
  return stats;
}

function runGitNumstat(workspacePath: string, args: readonly string[]): Promise<Map<string, DiffStatEntry>> {
  return new Promise((resolve) => {
    execFile(
      "git",
      [...args],
      { cwd: workspacePath, maxBuffer: 2 * 1024 * 1024 },
      (error, stdout) => {
        if (error) {
          resolve(new Map());
          return;
        }
        resolve(parseNumstat(stdout));
      },
    );
  });
}

function parseNumstat(stdout: string): Map<string, DiffStatEntry> {
  const stats = new Map<string, DiffStatEntry>();
  for (const line of stdout.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const [additionsText, deletionsText, ...pathParts] = line.split("\t");
    const filePath = normalizeNumstatPath(pathParts.join("\t"));
    if (!filePath) {
      continue;
    }
    stats.set(filePath, {
      additions: parseStatCount(additionsText),
      deletions: parseStatCount(deletionsText),
      binary: additionsText === "-" || deletionsText === "-",
    });
  }
  return stats;
}

function normalizeNumstatPath(filePath: string): string {
  const renameMatch = filePath.match(/^(.*) => (.*)$/);
  if (!renameMatch) {
    return filePath;
  }
  const [, oldPath, newPath] = renameMatch;
  if (!oldPath || !newPath) {
    return filePath;
  }
  return resolveBraceRename(oldPath, newPath);
}

function resolveBraceRename(oldPath: string, newPath: string): string {
  const openIndex = oldPath.indexOf("{");
  const closeIndex = newPath.indexOf("}");
  if (openIndex < 0 || closeIndex < 0) {
    return newPath;
  }
  return `${oldPath.slice(0, openIndex)}${newPath.slice(closeIndex + 1)}`;
}

function parseStatCount(value: string | undefined): number {
  if (!value || value === "-") {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeStats(target: Map<string, DiffStatEntry>, source: Map<string, DiffStatEntry>): void {
  for (const [filePath, stat] of source) {
    const current = target.get(filePath);
    target.set(filePath, {
      additions: (current?.additions ?? 0) + stat.additions,
      deletions: (current?.deletions ?? 0) + stat.deletions,
      binary: Boolean(current?.binary || stat.binary),
    });
  }
}

async function detectBinaryEntries(
  workspacePath: string,
  entries: readonly ChangedFileEntry[],
): Promise<ReadonlySet<string>> {
  const binaryPaths = new Set<string>();
  await Promise.all(entries.map(async (entry) => {
    if (entry.status === "deleted") {
      return;
    }
    if (entry.binary) {
      binaryPaths.add(entry.path);
      return;
    }
    if (await isBinaryWorkspaceFile(workspacePath, entry.path)) {
      binaryPaths.add(entry.path);
    }
  }));
  return binaryPaths;
}

async function isBinaryWorkspaceFile(workspacePath: string, filePath: string): Promise<boolean> {
  const resolved = path.resolve(workspacePath, filePath);
  if (!resolved.startsWith(path.resolve(workspacePath) + path.sep)) {
    return true;
  }
  const buffer = Buffer.alloc(8192);
  let fileHandle;
  try {
    fileHandle = await open(resolved, "r");
    const result = await fileHandle.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, result.bytesRead).includes(0);
  } catch {
    return false;
  } finally {
    await fileHandle?.close();
  }
}
