import { execFile } from "node:child_process";
import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";

const fileCache = new Map<string, { files: string[]; timestamp: number }>();
const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 20;
const MAX_TEXT_PREVIEW_BYTES = 512 * 1024;
const MAX_FILESYSTEM_LIST_ENTRIES = 20_000;
const MEDIA_PREVIEW_EXTENSIONS: Record<string, WorkspaceFilePreviewMedia["kind"]> = {
  avif: "image",
  bmp: "image",
  gif: "image",
  jpeg: "image",
  jpg: "image",
  png: "image",
  svg: "image",
  webp: "image",
  aac: "audio",
  flac: "audio",
  m4a: "audio",
  mp3: "audio",
  oga: "audio",
  ogg: "audio",
  wav: "audio",
  weba: "audio",
  m4v: "video",
  mkv: "video",
  mov: "video",
  mp4: "video",
  ogv: "video",
  webm: "video",
};
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "out",
  "release",
  "target",
  ".next",
  ".turbo",
  ".cache",
]);

export interface WorkspaceFilePreview {
  readonly path: string;
  readonly content: string;
  readonly size: number;
  readonly truncated: boolean;
  readonly binary: boolean;
  readonly media?: WorkspaceFilePreviewMedia;
}

export interface WorkspaceFilePreviewMedia {
  readonly kind: "image" | "audio" | "video";
}

function resolveWorkspaceFile(workspacePath: string, filePath: string): string {
  const resolvedWorkspacePath = path.resolve(workspacePath);
  const resolved = path.resolve(resolvedWorkspacePath, filePath);
  if (!resolved.startsWith(resolvedWorkspacePath + path.sep) && resolved !== resolvedWorkspacePath) {
    throw new Error("Path escapes workspace");
  }
  return resolved;
}

export function listWorkspaceFiles(workspacePath: string): Promise<string[]> {
  const cached = fileCache.get(workspacePath);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return Promise.resolve(cached.files);
  }

  return new Promise((resolve) => {
    execFile(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard"],
      { cwd: workspacePath, maxBuffer: 5 * 1024 * 1024 },
      (error, stdout) => {
        const files = stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .sort();
        if (error || files.length === 0) {
          void listFilesystemFiles(workspacePath).then((fallbackFiles) => {
            setCachedWorkspaceFiles(workspacePath, fallbackFiles);
            resolve(fallbackFiles);
          });
          return;
        }
        setCachedWorkspaceFiles(workspacePath, files);
        resolve(files);
      },
    );
  });
}

function setCachedWorkspaceFiles(workspacePath: string, files: string[]): void {
  if (fileCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = fileCache.keys().next().value;
    if (oldest !== undefined) {
      fileCache.delete(oldest);
    }
  }
  fileCache.set(workspacePath, { files, timestamp: Date.now() });
}

async function listFilesystemFiles(workspacePath: string): Promise<string[]> {
  const files: string[] = [];
  const root = path.resolve(workspacePath);

  async function visit(directory: string, relativeDirectory: string): Promise<void> {
    if (files.length >= MAX_FILESYSTEM_LIST_ENTRIES) {
      return;
    }

    let entries: Dirent<string>[];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILESYSTEM_LIST_ENTRIES) {
        return;
      }
      if (entry.name.startsWith(".") && entry.name !== ".env") {
        continue;
      }
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      const absolutePath = path.join(root, relativePath);
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath);
        continue;
      }
      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  await visit(root, "");
  return files.sort();
}

export async function readWorkspaceFile(workspacePath: string, filePath: string): Promise<WorkspaceFilePreview> {
  const resolved = resolveWorkspaceFile(workspacePath, filePath);
  const fileStat = await stat(resolved);
  if (!fileStat.isFile()) {
    throw new Error("Path is not a file");
  }

  const mediaKind = resolveMediaPreviewKind(filePath);
  if (mediaKind) {
    return {
      path: filePath,
      content: "",
      size: fileStat.size,
      truncated: false,
      binary: true,
      media: { kind: mediaKind },
    };
  }

  const bytesToRead = Math.min(fileStat.size, MAX_TEXT_PREVIEW_BYTES);
  const buffer = Buffer.alloc(bytesToRead);
  const fileHandle = await open(resolved, "r");
  try {
    await fileHandle.read(buffer, 0, bytesToRead, 0);
  } finally {
    await fileHandle.close();
  }
  const previewBuffer = buffer.subarray(0, bytesToRead);
  const binary = previewBuffer.includes(0);

  return {
    path: filePath,
    content: binary ? "" : previewBuffer.toString("utf8"),
    size: fileStat.size,
    truncated: fileStat.size > MAX_TEXT_PREVIEW_BYTES,
    binary,
  };
}

export function resolveMediaPreviewKind(filePath: string): WorkspaceFilePreviewMedia["kind"] | undefined {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return MEDIA_PREVIEW_EXTENSIONS[extension];
}

export function resolveWorkspaceMediaFile(workspacePath: string, filePath: string): string | null {
  if (!resolveMediaPreviewKind(filePath)) {
    return null;
  }
  return resolveWorkspaceFile(workspacePath, filePath);
}
