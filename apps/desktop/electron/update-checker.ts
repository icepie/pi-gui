import { app, net, Notification, shell } from "electron";

const RELEASES_URL =
  "https://api.github.com/repos/icepie/pi-gui/releases?per_page=10";
const RELEASES_PAGE =
  "https://github.com/icepie/pi-gui/releases/latest";

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const INITIAL_DELAY_MS = 15_000; // 15 seconds after launch
const GITHUB_PROXY_ENV = "PI_APP_GITHUB_PROXY";
const GITHUB_PROXIES_ENV = "PI_APP_GITHUB_PROXIES";
const DEFAULT_GITHUB_PROXY_PREFIXES = [
  "https://ghproxy.it/",
  "https://gh.ddlc.top/",
  "https://github.ednovas.xyz/",
  "https://raw.ihtw.moe/",
] as const;
const TEST_RELEASES_JSON_ENV = "PI_APP_TEST_RELEASES_JSON";
const TEST_OPEN_EXTERNAL_LOG_PATH_ENV = "PI_APP_TEST_OPEN_EXTERNAL_LOG_PATH";
const TEST_FAILED_PROXY_PREFIXES_ENV = "PI_APP_TEST_FAILED_PROXY_PREFIXES";
const APP_DISPLAY_NAME = "飞度小派";

export type UpdateCheckResult =
  | { status: "up-to-date"; currentVersion: string; latestVersion: string }
  | {
      status: "update-available";
      currentVersion: string;
      latestVersion: string;
      releaseUrl: string;
      downloadUrl: string;
      assetName: string;
    }
  | { status: "error"; message: string };

interface GitHubReleaseAsset {
  readonly name?: string;
  readonly browser_download_url?: string;
}

interface GitHubRelease {
  readonly tag_name?: string;
  readonly html_url?: string;
  readonly draft?: boolean;
  readonly prerelease?: boolean;
  readonly assets?: readonly GitHubReleaseAsset[];
}

function showUpdateNotification(result: Extract<UpdateCheckResult, { status: "update-available" }>): void {
  const notification = new Notification({
    title: `${APP_DISPLAY_NAME} update available`,
    body: `Version ${result.latestVersion} is available (you have ${result.currentVersion}). Click to download ${result.assetName}.`,
  });
  notification.on("click", () => {
    void openUpdateDownload(result).catch((error) => {
      console.warn("Failed to open update download:", error instanceof Error ? error.message : error);
    });
  });
  notification.show();
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  let releases: GitHubRelease[];
  try {
    releases = await fetchReleases();
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "GitHub Releases could not be loaded.",
    };
  }
  const release = releases.find((candidate) => !candidate.draft && candidate.tag_name);
  if (!release?.tag_name) {
    return {
      status: "error",
      message: "GitHub Releases did not return any published versions.",
    };
  }

  const latest = release.tag_name.replace(/^v/, "");
  const current = app.getVersion();

  if (compareVersions(latest, current) > 0) {
    const asset = selectDownloadAsset(release.assets ?? []);
    if (!asset?.browser_download_url || !asset.name) {
      return {
        status: "error",
        message: `Version ${latest} is available, but no ${process.platform}/${process.arch} package was found on the release.`,
      };
    }

    const result = {
      status: "update-available",
      currentVersion: current,
      latestVersion: latest,
      releaseUrl: release.html_url ?? RELEASES_PAGE,
      downloadUrl: asset.browser_download_url,
      assetName: asset.name,
    } as const;
    showUpdateNotification(result);
    return {
      ...result,
    };
  }

  return {
    status: "up-to-date",
    currentVersion: current,
    latestVersion: latest,
  };
}

export async function openUpdateDownload(result: Extract<UpdateCheckResult, { status: "update-available" }>): Promise<void> {
  await openExternal(await resolveDownloadUrl(result.downloadUrl || result.releaseUrl));
}

async function fetchReleases(): Promise<GitHubRelease[]> {
  const testReleasesJson = process.env[TEST_RELEASES_JSON_ENV]?.trim();
  if (testReleasesJson) {
    return JSON.parse(testReleasesJson) as GitHubRelease[];
  }

  const errors: string[] = [];
  for (const url of githubUrlCandidates(RELEASES_URL)) {
    try {
      const res = await net.fetch(url, {
        headers: { Accept: "application/vnd.github.v3+json" },
      });
      if (res.ok) {
        return (await res.json()) as GitHubRelease[];
      }
      errors.push(`${url} returned ${res.status}`);
    } catch (error) {
      errors.push(`${url} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`GitHub Releases could not be loaded. Tried ${errors.join("; ")}.`);
}

async function openExternal(url: string): Promise<void> {
  const testLogPath = process.env[TEST_OPEN_EXTERNAL_LOG_PATH_ENV]?.trim();
  if (testLogPath) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(testLogPath, `${url}\n`, "utf8");
    return;
  }
  await shell.openExternal(url);
}

async function resolveDownloadUrl(url: string): Promise<string> {
  const candidates = githubUrlCandidates(url);
  if (candidates.length === 1) {
    return url;
  }

  for (const candidate of candidates) {
    if (await isReachableUrl(candidate)) {
      return candidate;
    }
  }

  return url;
}

async function isReachableUrl(url: string): Promise<boolean> {
  const failedTestPrefixes = splitEnvList(process.env[TEST_FAILED_PROXY_PREFIXES_ENV] ?? "");
  if (failedTestPrefixes.length > 0) {
    return !failedTestPrefixes.some((prefix) => url.startsWith(prefix));
  }

  try {
    const head = await net.fetch(url, { method: "HEAD" });
    if (head.ok) {
      return true;
    }
    if (![403, 405, 501].includes(head.status)) {
      return false;
    }
  } catch {
    // Some GitHub proxy services do not implement HEAD reliably.
  }

  try {
    const partialGet = await net.fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
    });
    return partialGet.ok;
  } catch {
    return false;
  }
}

function githubUrlCandidates(url: string): string[] {
  const candidates = githubProxyPrefixes().map((prefix) => applyGithubProxy(url, prefix));
  candidates.push(url);
  return Array.from(new Set(candidates));
}

function githubProxyPrefixes(): string[] {
  return Array.from(
    new Set([
      ...splitEnvList(process.env[GITHUB_PROXY_ENV] ?? ""),
      ...splitEnvList(process.env[GITHUB_PROXIES_ENV] ?? ""),
      ...DEFAULT_GITHUB_PROXY_PREFIXES,
    ].map(normalizeGithubProxyPrefix).filter((prefix): prefix is string => Boolean(prefix))),
  );
}

function splitEnvList(value: string): string[] {
  return value
    .split(/[,\s;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeGithubProxyPrefix(prefix: string): string | undefined {
  const trimmed = prefix.trim();
  if (!trimmed) {
    return undefined;
  }
  return /[/?#&=]$/.test(trimmed) ? trimmed : `${trimmed}/`;
}

function applyGithubProxy(url: string, prefix: string): string {
  if (prefix === "https://raw.ihtw.moe/") {
    return `${prefix}${url.replace(/^https?:\/\//, "")}`;
  }
  return `${prefix}${url}`;
}

function selectDownloadAsset(assets: readonly GitHubReleaseAsset[]): GitHubReleaseAsset | undefined {
  const candidates = assets.filter((asset) => asset.name && asset.browser_download_url && isDownloadPackage(asset.name));
  const platformMatches = candidates.filter((asset) => isCurrentPlatformAsset(asset.name ?? ""));
  const platformPool = platformMatches.length > 0 ? platformMatches : candidates;
  const archMatches = platformPool.filter((asset) => isCurrentArchAsset(asset.name ?? ""));
  const pool = archMatches.length > 0 ? archMatches : platformPool;
  return [...pool].sort((left, right) => assetPriority(left.name ?? "") - assetPriority(right.name ?? ""))[0];
}

function isDownloadPackage(name: string): boolean {
  return /\.(dmg|zip|appimage|deb|rpm|exe)$/i.test(name) && !/^latest[-.]/i.test(name);
}

function isCurrentPlatformAsset(name: string): boolean {
  const normalized = name.toLowerCase();
  if (process.platform === "darwin") {
    return /\.(dmg|zip)$/i.test(name);
  }
  if (process.platform === "win32") {
    return normalized.endsWith(".exe");
  }
  if (process.platform === "linux") {
    return /\.(appimage|deb|rpm)$/i.test(name);
  }
  return true;
}

function isCurrentArchAsset(name: string): boolean {
  const normalized = name.toLowerCase();
  if (process.arch === "arm64") {
    return normalized.includes("arm64") || normalized.includes("aarch64");
  }
  if (process.arch === "x64") {
    return normalized.includes("x64") || normalized.includes("amd64") || !normalized.includes("arm64");
  }
  return true;
}

function assetPriority(name: string): number {
  const normalized = name.toLowerCase();
  if (process.platform === "darwin") {
    if (normalized.endsWith(".dmg")) return 0;
    if (normalized.endsWith(".zip")) return 1;
  }
  if (process.platform === "win32" && normalized.endsWith(".exe")) {
    return 0;
  }
  if (process.platform === "linux") {
    if (normalized.endsWith(".appimage")) return 0;
    if (normalized.endsWith(".deb")) return 1;
    if (normalized.endsWith(".rpm")) return 2;
  }
  return 10;
}

function compareVersions(left: string, right: string): number {
  const leftParts = parseVersionParts(left);
  const rightParts = parseVersionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return left.localeCompare(right);
}

function parseVersionParts(value: string): number[] {
  return value
    .replace(/^[^\d]*/, "")
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

export function initUpdateChecker(): () => void {
  const noop = (e: Error) =>
    console.warn("Update check failed:", e.message);

  const timeout = setTimeout(() => {
    void checkForUpdate().catch(noop);
  }, INITIAL_DELAY_MS);
  const interval = setInterval(() => {
    void checkForUpdate().catch(noop);
  }, CHECK_INTERVAL_MS);

  return () => {
    clearTimeout(timeout);
    clearInterval(interval);
  };
}
