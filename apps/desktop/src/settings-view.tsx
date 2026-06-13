import type { RuntimeSettingsSnapshot, RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { ModelSettingsScopeMode, NotificationPreferences, PlatformAccountState, WorkspaceRecord, AppLocale } from "./desktop-state";
import type { DesktopNotificationPermissionStatus } from "./ipc";
import { SettingsAppearanceSection } from "./settings-appearance-section";
import { SettingsGeneralSection } from "./settings-general-section";
import { SettingsModelsSection } from "./settings-models-section";
import { SettingsNotificationsSection } from "./settings-notifications-section";
import { SettingsProfileSection } from "./settings-profile-section";
import { SettingsProvidersSection } from "./settings-providers-section";
import { type SettingsSection, sectionTitle, sectionDescription } from "./settings-utils";
import { t } from "./i18n";

export type { SettingsSection } from "./settings-utils";

interface SettingsViewProps {
  readonly platform: NodeJS.Platform;
  readonly workspace?: WorkspaceRecord;
  readonly runtime?: RuntimeSnapshot;
  readonly section: SettingsSection;
  readonly platformAccount: PlatformAccountState;
  readonly notificationPreferences: NotificationPreferences;
  readonly notificationPermissionStatus: DesktopNotificationPermissionStatus;
  readonly notificationPermissionPending: boolean;
  readonly modelSettingsScopeMode: ModelSettingsScopeMode;
  readonly integratedTerminalShell: string;
  readonly themeMode: "system" | "light" | "dark";
  readonly locale: AppLocale;
  readonly onLogoutPlatformAccount: () => void;
  readonly onSetModelSettingsScopeMode: (mode: ModelSettingsScopeMode) => void;
  readonly onSetDefaultModel: (provider: string, modelId: string) => void;
  readonly onSetThinkingLevel: (thinkingLevel: RuntimeSettingsSnapshot["defaultThinkingLevel"]) => void;
  readonly onToggleSkillCommands: (enabled: boolean) => void;
  readonly onSetScopedModelPatterns: (patterns: readonly string[]) => void;
  readonly onLoginProvider: (providerId: string) => void;
  readonly onLogoutProvider: (providerId: string) => void;
  readonly onSetProviderApiKey: (
    providerId: string,
    config: {
      readonly apiKey: string;
      readonly baseUrl?: string;
    },
  ) => Promise<string | undefined>;
  readonly onRemoveProviderApiKey: (providerId: string) => Promise<string | undefined>;
  readonly onUpsertCustomProvider: (input: {
    readonly id: string;
    readonly displayName?: string;
    readonly api: "openai-completions" | "openai-responses" | "anthropic-messages" | "google-generative-ai";
    readonly baseUrl: string;
    readonly apiKey?: string;
    readonly modelIds: readonly string[];
  }) => Promise<string | undefined>;
  readonly onRemoveCustomProvider: (providerId: string) => Promise<string | undefined>;
  readonly onSetNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  readonly onSetIntegratedTerminalShell: (shellPath: string) => void;
  readonly onCheckForUpdates: () => void;
  readonly onRequestNotificationPermission: () => void;
  readonly onOpenSystemNotificationSettings: () => void;
  readonly onSetThemeMode: (mode: "system" | "light" | "dark") => void;
  readonly onSetLocale: (locale: AppLocale) => void;
}

export function SettingsView({
  platform,
  workspace,
  runtime,
  section,
  platformAccount,
  notificationPreferences,
  notificationPermissionStatus,
  notificationPermissionPending,
  modelSettingsScopeMode,
  integratedTerminalShell,
  themeMode,
  locale,
  onLogoutPlatformAccount,
  onSetModelSettingsScopeMode,
  onSetDefaultModel,
  onSetThinkingLevel,
  onToggleSkillCommands,
  onSetScopedModelPatterns,
  onLoginProvider,
  onLogoutProvider,
  onSetProviderApiKey,
  onRemoveProviderApiKey,
  onUpsertCustomProvider,
  onRemoveCustomProvider,
  onSetNotificationPreferences,
  onSetIntegratedTerminalShell,
  onCheckForUpdates,
  onRequestNotificationPermission,
  onOpenSystemNotificationSettings,
  onSetThemeMode,
  onSetLocale,
}: SettingsViewProps) {
  if (!workspace && section !== "profile" && section !== "general" && section !== "notifications" && section !== "appearance") {
    return (
      <section className="canvas canvas--empty">
        <div className="empty-panel">
          <div className="session-header__eyebrow">{t("settings.title")}</div>
          <h1>{t("settings.select_workspace")}</h1>
          <p>{t("settings.select_workspace_description")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas">
      <div className="conversation settings-view">
        <header className="view-header">
          <div>
            <div className="chat-header__eyebrow">{t("settings.title")}</div>
            <h1 className="view-header__title">{sectionTitle(section)}</h1>
            <p className="view-header__body">
              {sectionDescription(section, workspace?.name ?? "this workspace")}
            </p>
          </div>
        </header>

        <div className="settings-grid">
          {section === "appearance" ? (
            <SettingsAppearanceSection
              themeMode={themeMode}
              onSetThemeMode={onSetThemeMode}
              locale={locale}
              onSetLocale={onSetLocale}
            />
          ) : null}

          {section === "profile" ? (
            <SettingsProfileSection platformAccount={platformAccount} onLogout={onLogoutPlatformAccount} />
          ) : null}

          {section === "general" ? (
            <SettingsGeneralSection
              runtime={runtime}
              platform={platform}
              modelSettingsScopeMode={modelSettingsScopeMode}
              integratedTerminalShell={integratedTerminalShell}
              onSetModelSettingsScopeMode={onSetModelSettingsScopeMode}
              onSetIntegratedTerminalShell={onSetIntegratedTerminalShell}
              onToggleSkillCommands={onToggleSkillCommands}
              onCheckForUpdates={onCheckForUpdates}
            />
          ) : null}

          {section === "providers" ? (
            <SettingsProvidersSection
              runtime={runtime}
              onLoginProvider={onLoginProvider}
              onLogoutProvider={onLogoutProvider}
              onSetProviderApiKey={onSetProviderApiKey}
              onRemoveProviderApiKey={onRemoveProviderApiKey}
              onUpsertCustomProvider={onUpsertCustomProvider}
              onRemoveCustomProvider={onRemoveCustomProvider}
            />
          ) : null}

          {section === "models" ? (
            <SettingsModelsSection
              runtime={runtime}
              onSetDefaultModel={onSetDefaultModel}
              onSetScopedModelPatterns={onSetScopedModelPatterns}
              onSetThinkingLevel={onSetThinkingLevel}
            />
          ) : null}

          {section === "notifications" ? (
            <SettingsNotificationsSection
              platform={platform}
              notificationPreferences={notificationPreferences}
              notificationPermissionStatus={notificationPermissionStatus}
              notificationPermissionPending={notificationPermissionPending}
              onSetNotificationPreferences={onSetNotificationPreferences}
              onRequestNotificationPermission={onRequestNotificationPermission}
              onOpenSystemNotificationSettings={onOpenSystemNotificationSettings}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
