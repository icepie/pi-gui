import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import type {
  SkillCatalogEntry,
  SkillCatalogInstallInput,
  SkillCatalogInstalledState,
  SkillCatalogQuery,
  SkillCatalogSource,
} from "../src/ipc";
import { fetchWithRetry } from "./fetch-retry";

const execFileAsync = promisify(execFile);
const requireFromHere = createRequire(__filename);

export const SKILLHUB_FEIDU_REGISTRY = "https://skillhub.singzer.cn";
export const DEFAULT_CHINA_NPM_REGISTRY = "https://registry.npmmirror.com";
const SKILLHUB_SOURCE_ID = "skillhub-singzer";
const TEST_FIXTURE_ENABLED = process.env.PI_APP_TEST_SKILLHUB_FIXTURE === "1";

const skillCatalogSources: readonly SkillCatalogSource[] = [
  {
    id: SKILLHUB_SOURCE_ID,
    label: "SkillHub",
    registryUrl: SKILLHUB_FEIDU_REGISTRY,
    npmRegistryUrl: DEFAULT_CHINA_NPM_REGISTRY,
  },
];

export function configureChinaNpmRegistryDefaults(): void {
  process.env.npm_config_registry = process.env.npm_config_registry || DEFAULT_CHINA_NPM_REGISTRY;
  process.env.NPM_CONFIG_REGISTRY = process.env.NPM_CONFIG_REGISTRY || DEFAULT_CHINA_NPM_REGISTRY;
  process.env.COREPACK_NPM_REGISTRY = process.env.COREPACK_NPM_REGISTRY || DEFAULT_CHINA_NPM_REGISTRY;
}

export function listSkillCatalogSources(): readonly SkillCatalogSource[] {
  return skillCatalogSources;
}

export async function listSkillCatalog(
  input: SkillCatalogQuery,
  agentDir?: string,
): Promise<readonly SkillCatalogEntry[]> {
  const source = resolveSkillCatalogSource(input.sourceId);
  const entries = TEST_FIXTURE_ENABLED
    ? filterFixtureEntries(input)
    : await fetchSkillCatalogEntries(source, input);
  const entriesWithState = agentDir
    ? await attachInstalledSkillCatalogState(agentDir, source, entries)
    : entries;

  const query = input.q?.trim();
  if (!query) {
    return entriesWithState;
  }
  const normalizedQuery = query.toLowerCase();
  return entriesWithState.filter((entry) =>
    [entry.displayName, entry.slug, entry.summary, entry.namespace, entry.installKey].some((value) =>
      (value ?? "").toLowerCase().includes(normalizedQuery),
    ),
  );
}

async function fetchSkillCatalogEntries(
  source: SkillCatalogSource,
  input: SkillCatalogQuery,
): Promise<readonly SkillCatalogEntry[]> {
  const url = new URL("/api/v1/skills", source.registryUrl);
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", input.sort ?? "updated");
  url.searchParams.set("offset", String(offset));
  const query = input.q?.trim();
  if (query) {
    url.searchParams.set("q", query);
  }

  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`SkillHub returned ${response.status} while listing skills.`);
  }
  const data = await response.json() as unknown;
  return extractSkillCatalogItems(data)
    .map((item) => normalizeSkillCatalogEntry(source.id, item))
    .filter((entry): entry is SkillCatalogEntry => Boolean(entry));
}

export async function installSkillFromCatalog(
  agentDir: string,
  input: SkillCatalogInstallInput,
): Promise<void> {
  const source = resolveSkillCatalogSource(input.sourceId);
  if (TEST_FIXTURE_ENABLED) {
    await installFixtureSkill(agentDir, input);
    return;
  }

  const installKey = input.installKey || input.slug;
  if (source.id === SKILLHUB_SOURCE_ID) {
    await installSkillHubDownload(agentDir, source, input, installKey);
    return;
  }

  const clawhubBinPath = requireFromHere.resolve("clawhub/bin/clawdhub.js");
  const args = [
    clawhubBinPath,
    "--workdir",
    agentDir,
    "--dir",
    join(agentDir, "skills"),
    "--registry",
    source.registryUrl,
    "--no-input",
    "install",
    installKey,
    "--force",
  ];
  if (input.version) {
    args.push("--version", input.version);
  }

  try {
    await execFileAsync(process.execPath, args, {
      cwd: agentDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        npm_config_registry: source.npmRegistryUrl,
        NPM_CONFIG_REGISTRY: source.npmRegistryUrl,
        COREPACK_NPM_REGISTRY: source.npmRegistryUrl,
        CLAWHUB_REGISTRY: source.registryUrl,
        CLAWDHUB_REGISTRY: source.registryUrl,
        CI: "1",
        NO_COLOR: "1",
      },
      maxBuffer: 1024 * 1024 * 8,
    });
  } catch (error) {
    const execError = error as Error & { stdout?: string; stderr?: string };
    const detail = [execError.stderr, execError.stdout].filter(Boolean).join("\n").trim();
    throw new Error(detail ? `Failed to install ${installKey}: ${detail}` : `Failed to install ${installKey}: ${execError.message}`);
  }
}

export async function deleteLocalSkill(agentDir: string, workspacePath: string, filePath: string): Promise<void> {
  const skillDir = resolveSkillDirectory(filePath);
  const allowedRoots = [
    join(agentDir, "skills"),
    join(workspacePath, ".agents", "skills"),
    join(workspacePath, ".codex", "skills"),
  ];
  if (!allowedRoots.some((root) => isPathInside(skillDir, root))) {
    throw new Error(`Refusing to delete a skill outside known skill directories: ${skillDir}`);
  }

  const origin = await readSkillOriginFromDir(skillDir);
  await rm(skillDir, { recursive: true, force: true });
  await removeSkillFromLockfile(agentDir, skillDir, origin);
}

async function installSkillHubDownload(
  agentDir: string,
  source: SkillCatalogSource,
  input: SkillCatalogInstallInput,
  installKey: string,
): Promise<void> {
  const version = input.version?.trim();
  if (!version) {
    throw new Error(`Cannot install ${installKey}: missing SkillHub version.`);
  }
  const skillsDir = join(agentDir, "skills");
  const targetDir = join(skillsDir, installKey);
  const zip = await downloadSkillHubZip(source.registryUrl, installKey, version);
  const clawhubSkills = await loadClawhubSkillsModule();
  await mkdir(skillsDir, { recursive: true });
  await rm(targetDir, { recursive: true, force: true });
  await clawhubSkills.extractZipToDir(zip, targetDir);
  await clawhubSkills.writeSkillOrigin(targetDir, {
    version: 1,
    registry: source.registryUrl,
    slug: installKey,
    installedVersion: version,
    installedAt: Date.now(),
  });
  const lock = await clawhubSkills.readLockfile(agentDir);
  lock.skills[installKey] = {
    version,
    installedAt: Date.now(),
  };
  await clawhubSkills.writeLockfile(agentDir, lock);
}

async function downloadSkillHubZip(
  registryUrl: string,
  slug: string,
  version: string,
): Promise<Uint8Array> {
  const url = new URL("/api/v1/download", registryUrl);
  url.searchParams.set("slug", slug);
  url.searchParams.set("version", version);
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body.trim() || `SkillHub download returned ${response.status}.`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

interface ClawhubSkillsModule {
  extractZipToDir(zipBytes: Uint8Array, targetDir: string): Promise<void>;
  readSkillOrigin(
    skillFolder: string,
  ): Promise<{
    version: 1;
    registry: string;
    slug: string;
    installedVersion: string;
    installedAt: number;
  } | null>;
  readLockfile(workdir: string): Promise<{ version: 1; skills: Record<string, { version: string; installedAt: number }> }>;
  writeLockfile(workdir: string, lock: { version: 1; skills: Record<string, { version: string; installedAt: number }> }): Promise<void>;
  writeSkillOrigin(
    skillFolder: string,
    origin: {
      version: 1;
      registry: string;
      slug: string;
      installedVersion: string;
      installedAt: number;
    },
  ): Promise<void>;
}

async function loadClawhubSkillsModule(): Promise<ClawhubSkillsModule> {
  const modulePath = requireFromHere.resolve("clawhub/dist/skills.js");
  return await import(pathToFileURL(modulePath).toString()) as ClawhubSkillsModule;
}

async function attachInstalledSkillCatalogState(
  agentDir: string,
  source: SkillCatalogSource,
  entries: readonly SkillCatalogEntry[],
): Promise<readonly SkillCatalogEntry[]> {
  const installedBySlug = await readInstalledSkillStates(agentDir, source.registryUrl);
  return entries.map((entry) => {
    const installed = installedBySlug.get(entry.installKey) ?? installedBySlug.get(entry.slug);
    if (!installed) {
      return entry;
    }
    return {
      ...entry,
      installed: {
        ...installed,
        updatable: Boolean(entry.latestVersion && compareVersions(entry.latestVersion, installed.version) > 0),
      },
    };
  });
}

async function readInstalledSkillStates(
  agentDir: string,
  registryUrl: string,
): Promise<Map<string, SkillCatalogInstalledState>> {
  const lock = await readSkillLockfile(agentDir);
  const installed = new Map<string, SkillCatalogInstalledState>();
  const registry = normalizeRegistryUrl(registryUrl);
  for (const [slug, entry] of Object.entries(lock.skills)) {
    installed.set(slug, {
      version: entry.version,
      installedAt: entry.installedAt,
      filePath: join(agentDir, "skills", slug, "SKILL.md"),
      updatable: false,
    });
  }

  for (const slug of Object.keys(lock.skills)) {
    const skillDir = join(agentDir, "skills", slug);
    const origin = await readSkillOriginFile(skillDir);
    if (!origin || normalizeRegistryUrl(origin.registry) !== registry) {
      continue;
    }
    installed.set(origin.slug, {
      version: origin.installedVersion,
      installedAt: origin.installedAt,
      filePath: join(skillDir, "SKILL.md"),
      updatable: false,
    });
  }

  return installed;
}

async function readSkillLockfile(agentDir: string): Promise<{
  version: 1;
  skills: Record<string, { version: string; installedAt: number }>;
}> {
  const clawhubSkills = await loadClawhubSkillsModule();
  return clawhubSkills.readLockfile(agentDir);
}

async function readSkillOriginFile(skillDir: string): Promise<{
  version: 1;
  registry: string;
  slug: string;
  installedVersion: string;
  installedAt: number;
} | null> {
  const clawhubSkills = await loadClawhubSkillsModule();
  return clawhubSkills.readSkillOrigin(skillDir);
}

async function removeSkillFromLockfile(
  agentDir: string,
  skillDir: string,
  origin: { slug?: string } | null,
): Promise<void> {
  const lock = await readSkillLockfile(agentDir);
  const skillSlug = relative(join(agentDir, "skills"), skillDir).split(sep).join("/");
  if (!skillSlug.startsWith("..") && !skillSlug.startsWith(sep)) {
    delete lock.skills[skillSlug];
  }
  if (origin?.slug) {
    delete lock.skills[origin.slug];
  }
  const clawhubSkills = await loadClawhubSkillsModule();
  await clawhubSkills.writeLockfile(agentDir, lock);
}

async function readSkillOriginFromDir(skillDir: string): Promise<{ slug?: string } | null> {
  for (const originPath of [
    join(skillDir, ".clawhub", "origin.json"),
    join(skillDir, ".clawdhub", "origin.json"),
  ]) {
    try {
      const raw = await readFile(originPath, "utf8");
      const parsed = JSON.parse(raw) as { slug?: unknown };
      return typeof parsed.slug === "string" ? { slug: parsed.slug } : null;
    } catch {
      // Try the next origin file location.
    }
  }
  return null;
}

function resolveSkillDirectory(filePath: string): string {
  const absolute = resolve(filePath);
  return absolute.toLowerCase().endsWith("skill.md") ? dirname(absolute) : absolute;
}

function isPathInside(candidatePath: string, rootPath: string): boolean {
  const relativePath = relative(resolve(rootPath), resolve(candidatePath));
  return Boolean(relativePath) && !relativePath.startsWith("..") && !relativePath.startsWith(sep);
}

function normalizeRegistryUrl(value: string): string {
  return value.replace(/\/+$/, "").toLowerCase();
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

function resolveSkillCatalogSource(sourceId: string): SkillCatalogSource {
  const source = skillCatalogSources.find((entry) => entry.id === sourceId);
  if (!source) {
    throw new Error(`Unknown skill source: ${sourceId}`);
  }
  return source;
}

function extractSkillCatalogItems(data: unknown): readonly unknown[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (!data || typeof data !== "object") {
    return [];
  }
  const record = data as Record<string, unknown>;
  for (const key of ["items", "skills", "data", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function normalizeSkillCatalogEntry(sourceId: string, item: unknown): SkillCatalogEntry | undefined {
  if (!item || typeof item !== "object") {
    return undefined;
  }
  const record = item as Record<string, unknown>;
  const slug = stringValue(record.slug) || stringValue(record.name) || stringValue(record.id);
  if (!slug) {
    return undefined;
  }
  const namespace = stringValue(record.namespace) || stringValue(record.owner) || stringValue(record.scope);
  const displayName = stringValue(record.displayName) || stringValue(record.title) || titleFromSlug(slug);
  const summary = stringValue(record.summary) || stringValue(record.description) || "";
  const latestVersion = normalizeVersion(record.latestVersion) || normalizeVersion(record.version);
  const stats = record.stats && typeof record.stats === "object" ? record.stats as Record<string, unknown> : {};
  const installKey = namespace && namespace !== "global" ? `${namespace}--${slug}` : slug;

  return {
    sourceId,
    slug,
    ...(namespace ? { namespace } : {}),
    displayName,
    summary,
    ...(latestVersion ? { latestVersion } : {}),
    downloads: numberValue(record.downloads) ?? numberValue(stats.downloads),
    stars: numberValue(record.stars) ?? numberValue(stats.stars),
    updatedAt: timestampValue(record.updatedAt) ?? timestampValue(record.updated_at),
    installKey,
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function timestampValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function normalizeVersion(value: unknown): string | undefined {
  if (typeof value === "string") {
    return stringValue(value);
  }
  if (value && typeof value === "object") {
    return stringValue((value as Record<string, unknown>).version);
  }
  return undefined;
}

function titleFromSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function filterFixtureEntries(input: SkillCatalogQuery): readonly SkillCatalogEntry[] {
  const entries: readonly SkillCatalogEntry[] = [
    {
      sourceId: SKILLHUB_SOURCE_ID,
      slug: "hub-demo",
      namespace: "global",
      displayName: "Hub Demo",
      summary: "A deterministic SkillHub fixture used by the desktop Skills surface.",
      latestVersion: "2.0.0",
      downloads: 12,
      stars: 3,
      updatedAt: Date.UTC(2026, 0, 1),
      installKey: "hub-demo",
    },
  ];
  const query = input.q?.trim().toLowerCase();
  if (!query) {
    return entries;
  }
  return entries.filter((entry) =>
    [entry.displayName, entry.slug, entry.summary, entry.installKey].some((value) =>
      value.toLowerCase().includes(query),
    ),
  );
}

async function installFixtureSkill(agentDir: string, input: SkillCatalogInstallInput): Promise<void> {
  if (input.slug !== "hub-demo" && input.installKey !== "hub-demo") {
    throw new Error(`Unknown fixture skill: ${input.slug}`);
  }
  const skillDir = join(agentDir, "skills", "hub-demo");
  await mkdir(skillDir, { recursive: true });
  await writeFile(
    join(skillDir, "SKILL.md"),
    `# Hub Demo

Use this skill when validating SkillHub installs from the desktop Skills surface.

## Workflow

1. Confirm the installed skill is visible.
2. Run the requested demo workflow.
`,
    "utf8",
  );
  const clawhubSkills = await loadClawhubSkillsModule();
  await clawhubSkills.writeSkillOrigin(skillDir, {
    version: 1,
    registry: SKILLHUB_FEIDU_REGISTRY,
    slug: "hub-demo",
    installedVersion: input.version || "2.0.0",
    installedAt: Date.now(),
  });
  const lock = await clawhubSkills.readLockfile(agentDir);
  lock.skills["hub-demo"] = {
    version: input.version || "2.0.0",
    installedAt: Date.now(),
  };
  await clawhubSkills.writeLockfile(agentDir, lock);
}
