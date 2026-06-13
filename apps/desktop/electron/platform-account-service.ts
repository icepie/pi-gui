import type { BrowserWindow } from "electron";
import { BrowserWindow as ElectronBrowserWindow, session as electronSession } from "electron";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { PlatformAccountState, PlatformAccountUser } from "../src/desktop-state";
import { fetchWithRetry } from "./fetch-retry";

const PLATFORM_PROVIDER_ID = "feidu" as const;
const PLATFORM_AI_BASE_URL = "https://ai-api.singzer.cn/v1";
const PLATFORM_PROVIDER_API = "openai-completions" as const;
const DEFAULT_PLATFORM_ORIGIN = "https://fd-one.singzer.cn";
const TEST_FIXTURE_ENABLED = process.env.PI_APP_TEST_PLATFORM_ACCOUNT_FIXTURE !== "0" && Boolean(process.env.PI_APP_TEST_MODE);
const TEST_INITIAL_AUTH_ENABLED = process.env.PI_APP_TEST_PLATFORM_ACCOUNT_INITIAL_AUTH !== "0";
const TEST_LINKED_DATA_FAILURES_ENV = "PI_APP_TEST_PLATFORM_ACCOUNT_LINKED_DATA_FAILURES";

const LOGIN_LINKED_DATA_ATTEMPTS = 8;
const LOGIN_LINKED_DATA_INITIAL_DELAY_MS = 500;
const LOGIN_LINKED_DATA_MAX_DELAY_MS = 2_000;
const PLATFORM_LINKED_DATA_STALE_MS = 5 * 60_000;

export interface PlatformProviderConfig {
  readonly id: typeof PLATFORM_PROVIDER_ID;
  readonly displayName: string;
  readonly api: typeof PLATFORM_PROVIDER_API;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly modelIds: readonly string[];
  readonly defaultModelId: string;
}

export interface PlatformAccountServiceOptions {
  readonly userDataDir: string;
  readonly getParentWindow?: () => BrowserWindow | null;
}

interface PersistedPlatformAccount {
  readonly platformOrigin?: string;
  readonly accessToken?: string;
  readonly expiresAt?: number;
  readonly user?: PlatformAccountUser;
  readonly provider?: PlatformProviderConfig;
  readonly lastSyncedAt?: string;
}

interface PlatformLoginToken {
  readonly access_token: string;
  readonly token_type?: string;
  readonly expires_at?: number;
}

interface DingTalkConfig {
  readonly app_key?: string;
  readonly corp_id?: string;
  readonly login_mode?: string;
}

interface PlatformModelConfig {
  readonly model_id?: string;
  readonly name?: string;
  readonly provider?: string;
  readonly enabled?: boolean;
  readonly sequence?: number;
}

export class PlatformAccountService {
  private readonly stateFilePath: string;
  private readonly getParentWindow: () => BrowserWindow | null;
  private testLinkedDataFailuresRemaining = parsePositiveInteger(process.env[TEST_LINKED_DATA_FAILURES_ENV]);
  private state: PersistedPlatformAccount = {};
  private loadPromise: Promise<void> | undefined;

  constructor(options: PlatformAccountServiceOptions) {
    this.stateFilePath = join(options.userDataDir, "platform-account.json");
    this.getParentWindow = options.getParentWindow ?? (() => null);
  }

  async getState(): Promise<PlatformAccountState> {
    await this.load();
    if (TEST_FIXTURE_ENABLED && TEST_INITIAL_AUTH_ENABLED && !this.state.accessToken) {
      await this.applyTestFixture();
    }
    if (this.state.accessToken && !this.state.provider) {
      try {
        await this.refreshLinkedDataWithRetry({
          attempts: LOGIN_LINKED_DATA_ATTEMPTS,
          initialDelayMs: LOGIN_LINKED_DATA_INITIAL_DELAY_MS,
          maxDelayMs: LOGIN_LINKED_DATA_MAX_DELAY_MS,
        });
      } catch (error) {
        return this.toPublicState(error instanceof Error ? error.message : String(error));
      }
    }
    if (this.state.accessToken && this.state.provider && this.shouldRefreshLinkedData()) {
      return this.refreshLinkedData({ preserveExistingOnError: true });
    }
    return this.toPublicState();
  }

  async getProviderConfig(): Promise<PlatformProviderConfig | undefined> {
    await this.load();
    return this.state.provider;
  }

  async login(): Promise<PlatformAccountState> {
    await this.load();
    if (TEST_FIXTURE_ENABLED) {
      this.state = {
        ...this.state,
        platformOrigin: this.platformOrigin(),
        accessToken: "test-platform-access-token",
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      };
      await this.save();
      await this.refreshLinkedDataWithRetry({
        attempts: LOGIN_LINKED_DATA_ATTEMPTS,
        initialDelayMs: LOGIN_LINKED_DATA_INITIAL_DELAY_MS,
        maxDelayMs: LOGIN_LINKED_DATA_MAX_DELAY_MS,
      });
      return this.toPublicState();
    }

    const origin = this.platformOrigin();
    const token = await this.loginWithDingTalkWindow(origin);
    this.state = {
      ...this.state,
      platformOrigin: origin,
      accessToken: token.access_token,
      ...(token.expires_at ? { expiresAt: token.expires_at } : {}),
    };
    await this.save();
    await this.refreshLinkedDataWithRetry({
      attempts: LOGIN_LINKED_DATA_ATTEMPTS,
      initialDelayMs: LOGIN_LINKED_DATA_INITIAL_DELAY_MS,
      maxDelayMs: LOGIN_LINKED_DATA_MAX_DELAY_MS,
    });
    return this.toPublicState();
  }

  async refreshLinkedData(options: { readonly preserveExistingOnError?: boolean } = {}): Promise<PlatformAccountState> {
    await this.load();
    this.consumeTestLinkedDataFailure();
    if (TEST_FIXTURE_ENABLED) {
      await this.applyTestFixture();
      return this.toPublicState();
    }
    const accessToken = this.state.accessToken?.trim();
    if (!accessToken) {
      throw new Error("Platform account is not logged in.");
    }

    let user: PlatformAccountUser;
    let aiToken: string;
    let models: PlatformModelConfig[];
    try {
      [user, aiToken, models] = await Promise.all([
        this.fetchUser(accessToken),
        this.fetchUserAiToken(accessToken),
        this.fetchModels(),
      ]);
    } catch (error) {
      if (options.preserveExistingOnError && this.state.provider) {
        return this.toPublicState(error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
    const modelIds = models
      .filter((model) => model.enabled !== false)
      .map((model) => model.model_id?.trim() ?? "")
      .filter(Boolean);
    const uniqueModelIds = [...new Set(modelIds)];
    if (uniqueModelIds.length === 0) {
      throw new Error("Platform returned no enabled models.");
    }

    this.state = {
      ...this.state,
      user,
      provider: {
        id: PLATFORM_PROVIDER_ID,
        displayName: "feidu",
        api: PLATFORM_PROVIDER_API,
        baseUrl: PLATFORM_AI_BASE_URL,
        apiKey: aiToken,
        modelIds: uniqueModelIds,
        defaultModelId: uniqueModelIds[0] as string,
      },
      lastSyncedAt: new Date().toISOString(),
    };
    await this.save();
    return this.toPublicState();
  }

  private async refreshLinkedDataWithRetry(options: {
    readonly attempts: number;
    readonly initialDelayMs: number;
    readonly maxDelayMs: number;
  }): Promise<PlatformAccountState> {
    const attempts = Math.max(1, options.attempts);
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.refreshLinkedData();
      } catch (error) {
        lastError = error;
        if (attempt === attempts || !isRetryableLinkedDataError(error)) {
          throw error;
        }
        await delay(backoffDelayMs(attempt, options.initialDelayMs, options.maxDelayMs));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  async logout(): Promise<PlatformAccountState> {
    await this.load();
    this.state = {};
    await this.save();
    await electronSession.fromPartition(platformLoginPartition()).clearStorageData();
    return this.toPublicState();
  }

  private async load(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.loadFromDisk();
    }
    await this.loadPromise;
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const raw = await readFile(this.stateFilePath, "utf8");
      const parsed = JSON.parse(raw);
      this.state = parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as PersistedPlatformAccount
        : {};
    } catch {
      this.state = {};
    }
  }

  private async save(): Promise<void> {
    await mkdir(dirname(this.stateFilePath), { recursive: true });
    await writeFile(this.stateFilePath, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
  }

  private async applyTestFixture(): Promise<void> {
    this.state = {
      platformOrigin: this.platformOrigin(),
      accessToken: "test-platform-access-token",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: "d6lrrpbo2bn49oog13eg",
        name: "icepie",
        username: "icepie",
        avatar: "https://example.com/avatar.png",
        email: "icepie.dev@gmail.com",
        phone: "16670151612",
      },
      provider: {
        id: PLATFORM_PROVIDER_ID,
        displayName: "feidu",
        api: PLATFORM_PROVIDER_API,
        baseUrl: PLATFORM_AI_BASE_URL,
        apiKey: "sk-test-platform-user-token",
        modelIds: ["feidu-chat", "feidu-coder"],
        defaultModelId: "feidu-chat",
      },
      lastSyncedAt: new Date().toISOString(),
    };
    await this.save();
  }

  private consumeTestLinkedDataFailure(): void {
    if (!TEST_FIXTURE_ENABLED || this.testLinkedDataFailuresRemaining <= 0) {
      return;
    }
    this.testLinkedDataFailuresRemaining -= 1;
    throw new Error("Test platform linked data is not ready yet.");
  }

  private platformOrigin(): string {
    return (process.env.PI_APP_PLATFORM_ORIGIN?.trim() || DEFAULT_PLATFORM_ORIGIN).replace(/\/+$/, "");
  }

  private shouldRefreshLinkedData(): boolean {
    const lastSyncedAt = this.state.lastSyncedAt;
    if (!lastSyncedAt) {
      return true;
    }
    const lastSyncedMs = Date.parse(lastSyncedAt);
    if (!Number.isFinite(lastSyncedMs)) {
      return true;
    }
    return Date.now() - lastSyncedMs >= PLATFORM_LINKED_DATA_STALE_MS;
  }

  private toPublicState(lastError?: string): PlatformAccountState {
    return {
      authenticated: Boolean(this.state.accessToken && this.state.provider),
      providerId: PLATFORM_PROVIDER_ID,
      baseUrl: PLATFORM_AI_BASE_URL,
      ...(this.state.user ? { user: this.state.user } : {}),
      modelIds: this.state.provider?.modelIds ?? [],
      ...(this.state.provider?.defaultModelId ? { defaultModelId: this.state.provider.defaultModelId } : {}),
      ...(this.state.lastSyncedAt ? { lastSyncedAt: this.state.lastSyncedAt } : {}),
      ...(lastError ? { lastError } : {}),
    };
  }

  private async fetchUser(accessToken: string): Promise<PlatformAccountUser> {
    const data = await this.fetchPlatformData<Record<string, unknown>>("/api/v1/current/user", {
      headers: this.authHeaders(accessToken),
    });
    const id = typeof data.id === "string" ? data.id : "";
    const name =
      (typeof data.name === "string" && data.name.trim()) ||
      (typeof data.username === "string" && data.username.trim()) ||
      id;
    if (!id || !name) {
      throw new Error("Platform current user response is missing id or name.");
    }
    return {
      id,
      name,
      ...(typeof data.username === "string" && data.username.trim() ? { username: data.username.trim() } : {}),
      ...(typeof data.avatar === "string" && data.avatar.trim() ? { avatar: data.avatar.trim() } : {}),
      ...(typeof data.email === "string" && data.email.trim() ? { email: data.email.trim() } : {}),
      ...(typeof data.phone === "string" && data.phone.trim() ? { phone: data.phone.trim() } : {}),
    };
  }

  private async fetchUserAiToken(accessToken: string): Promise<string> {
    const data = await this.fetchPlatformData<Record<string, unknown>>("/api/v1/current/token", {
      headers: this.authHeaders(accessToken),
    });
    const key = typeof data.key === "string" ? data.key.trim() : "";
    if (!key) {
      throw new Error("Platform current token response is missing key.");
    }
    return key;
  }

  private fetchModels(): Promise<PlatformModelConfig[]> {
    return this.fetchPlatformData<PlatformModelConfig[]>("/api/v1/public/models");
  }

  private fetchDingTalkConfig(): Promise<DingTalkConfig> {
    return this.fetchPlatformData<DingTalkConfig>("/api/v1/dingtalk/config");
  }

  private authHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  private async fetchPlatformData<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.platformOrigin()}${path}`;
    let response: Response;
    try {
      response = await fetchWithRetry(url, init);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Platform request failed for ${url}: ${reason}`);
    }
    const payload = await response.json().catch(() => undefined) as
      | { readonly success?: boolean; readonly data?: unknown; readonly error?: { readonly detail?: string; readonly message?: string } }
      | undefined;
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error?.detail ?? payload?.error?.message ?? `Platform request failed for ${url}: ${response.status}`);
    }
    return payload?.data as T;
  }

  private async loginWithDingTalkWindow(origin: string): Promise<PlatformLoginToken> {
    const config = await this.fetchDingTalkConfig();
    const appKey = config.app_key?.trim();
    if (!appKey) {
      throw new Error("Platform DingTalk config is missing app_key.");
    }
    const callbackUrl = `${origin}/`;
    const authUrl = new URL("https://login.dingtalk.com/oauth2/auth");
    authUrl.searchParams.set("client_id", appKey);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid");
    authUrl.searchParams.set("state", "dingtalk");
    authUrl.searchParams.set("prompt", "consent");

    return new Promise((resolve, reject) => {
      const parent = this.getParentWindow();
      const loginWindow = new ElectronBrowserWindow({
        width: 520,
        height: 720,
        minWidth: 480,
        minHeight: 620,
        title: "钉钉登录",
        parent: parent ?? undefined,
        modal: Boolean(parent),
        show: false,
        webPreferences: {
          partition: platformLoginPartition(),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
        },
      });

      let settled = false;
      const settle = (callback: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        if (!loginWindow.isDestroyed()) {
          loginWindow.close();
        }
        callback();
      };
      const cleanup = () => {
        loginWindow.webContents.off("did-navigate", handleNavigate);
        loginWindow.webContents.off("did-navigate-in-page", handleNavigate);
        loginWindow.webContents.off("did-fail-load", handleFailLoad);
        loginWindow.off("closed", handleClosed);
      };
      const handleClosed = () => {
        settle(() => reject(new Error("DingTalk login cancelled.")));
      };
      const handleFailLoad = (_event: Electron.Event, _code: number, description: string) => {
        settle(() => reject(new Error(description || "DingTalk login window failed to load.")));
      };
      const handleNavigate = (_event: Electron.Event, url: string) => {
        const parsed = safeParseUrl(url);
        if (!parsed) {
          return;
        }
        const code = parsed.searchParams.get("code");
        const state = parsed.searchParams.get("state");
        if (!code || state !== "dingtalk") {
          return;
        }
        settle(() => {
          void this.exchangeDingTalkCode(code)
            .then(resolve)
            .catch(reject);
        });
      };

      loginWindow.webContents.on("did-navigate", handleNavigate);
      loginWindow.webContents.on("did-navigate-in-page", handleNavigate);
      loginWindow.webContents.on("did-fail-load", handleFailLoad);
      loginWindow.once("ready-to-show", () => loginWindow.show());
      loginWindow.once("closed", handleClosed);
      void loginWindow.loadURL(authUrl.toString());
    });
  }

  private async exchangeDingTalkCode(code: string): Promise<PlatformLoginToken> {
    return this.fetchPlatformData<PlatformLoginToken>("/api/v1/dingtalk/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
  }
}

function platformLoginPartition(): string {
  return "persist:fit-one-platform-login";
}

function safeParseUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function parsePositiveInteger(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isRetryableLinkedDataError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return !/\b(401|403)\b/.test(message);
}

function backoffDelayMs(attempt: number, initialDelayMs: number, maxDelayMs: number): number {
  return Math.min(Math.max(0, maxDelayMs), Math.max(0, initialDelayMs) * (2 ** (attempt - 1)));
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
