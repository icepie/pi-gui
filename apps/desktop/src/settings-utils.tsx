import type { ReactNode } from "react";
import type { RuntimeSettingsSnapshot, RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import { t } from "./i18n";

export type SettingsSection = "profile" | "appearance" | "general" | "providers" | "models" | "notifications";

export const THINKING_LEVELS: NonNullable<RuntimeSettingsSnapshot["defaultThinkingLevel"]>[] = [
  "low",
  "medium",
  "high",
  "xhigh",
];

export function settingsPill(active: boolean): string {
  return `settings-pill${active ? " settings-pill--active" : ""}`;
}

export function labelForThinking(level: NonNullable<RuntimeSettingsSnapshot["defaultThinkingLevel"]>): string {
  if (level === "xhigh") {
    return "Extra High";
  }
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function sectionTitle(section: SettingsSection): string {
  switch (section) {
    case "profile":
      return t("settings.profile");
    case "appearance":
      return t("settings.appearance");
    case "providers":
      return t("settings.providers");
    case "models":
      return t("settings.models");
    case "notifications":
      return t("settings.notifications");
    default:
      return t("settings.general");
  }
}

export function sectionDescription(section: SettingsSection, workspaceName: string): string {
  switch (section) {
    case "profile":
      return t("settings.profile_description");
    case "appearance":
      return t("settings.appearance_description");
    case "providers":
      return t("settings.providers_description", { workspaceName });
    case "models":
      return t("settings.models_description");
    case "notifications":
      return t("settings.notifications_description");
    default:
      return t("settings.general_description");
  }
}

export function filterProviders(
  providers: readonly RuntimeSnapshot["providers"][number][],
  query: string,
): readonly RuntimeSnapshot["providers"][number][] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return providers;
  }
  return providers.filter((provider) =>
    [provider.id, provider.name, provider.authType].some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function filterModels(
  models: readonly RuntimeSnapshot["models"][number][],
  query: string,
): readonly RuntimeSnapshot["models"][number][] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return models;
  }
  return models.filter((model) =>
    [model.providerId, model.providerName, model.modelId, model.label].some((value) =>
      value.toLowerCase().includes(normalized),
    ),
  );
}

/* ── Layout components ────────────────────────────────── */

export function SettingsGroup({
  title,
  description,
  children,
}: {
  readonly title?: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="settings-section">
      {title ? <h3 className="settings-section__title">{title}</h3> : null}
      {description ? <p className="settings-section__description">{description}</p> : null}
      <div className="settings-group">{children}</div>
    </div>
  );
}

export function SettingsRow({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row__label">
        <div className="settings-row__title">{title}</div>
        {description ? <div className="settings-row__description">{description}</div> : null}
      </div>
      {children ? <div className="settings-row__control">{children}</div> : null}
    </div>
  );
}

export function SettingsInfoRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="settings-row">
      <div className="settings-row__label">
        <div className="settings-row__title">{label}</div>
      </div>
      <div className="settings-row__control">
        <span className="settings-row__value">{value}</span>
      </div>
    </div>
  );
}

export function ProviderRow({
  provider,
  onLoginProvider,
  onLogoutProvider,
  onConfigureApiKey,
}: {
  readonly provider: RuntimeSnapshot["providers"][number];
  readonly onLoginProvider: (providerId: string) => void;
  readonly onLogoutProvider: (providerId: string) => void;
  readonly onConfigureApiKey: (provider: RuntimeSnapshot["providers"][number]) => void;
}) {
  const action = resolveProviderAction(provider, onLoginProvider, onLogoutProvider, onConfigureApiKey);
  return (
    <div className="settings-row">
      <div className="settings-row__label">
        <div className="settings-row__title">{provider.name}</div>
        <div className="settings-row__description">{describeProviderStatus(provider)}</div>
      </div>
      <div className="settings-row__control">
        <button
          className="button button--secondary"
          disabled={action.disabled}
          type="button"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      </div>
    </div>
  );
}

function describeProviderStatus(provider: RuntimeSnapshot["providers"][number]): string {
  switch (provider.authSource) {
    case "oauth":
      return t("settings.provider_status.oauth_connected");
    case "auth_file":
      return t("settings.provider_status.api_key_connected");
    case "env":
      return t("settings.provider_status.env_connected");
    case "external":
      return provider.hasAuth ? t("settings.provider_status.external_connected") : t("settings.provider_status.configure_externally");
    default:
      if (provider.oauthSupported) {
        return t("settings.provider_status.oauth");
      }
      if (provider.apiKeySetupSupported) {
        return t("settings.provider_status.api_key");
      }
      return provider.authType === "api_key" ? t("settings.provider_status.api_key") : t("settings.provider_status.built_in");
  }
}

function resolveProviderAction(
  provider: RuntimeSnapshot["providers"][number],
  onLoginProvider: (providerId: string) => void,
  onLogoutProvider: (providerId: string) => void,
  onConfigureApiKey: (provider: RuntimeSnapshot["providers"][number]) => void,
): {
  readonly disabled: boolean;
  readonly label: string;
  readonly onClick?: () => void;
} {
  if (provider.authSource === "oauth") {
    return {
      disabled: false,
      label: t("settings.provider_action.logout"),
      onClick: () => onLogoutProvider(provider.id),
    };
  }

  if (provider.oauthSupported && provider.authSource === "none") {
    return {
      disabled: false,
      label: t("settings.provider_action.login"),
      onClick: () => onLoginProvider(provider.id),
    };
  }

  if (provider.apiKeySetupSupported && (provider.authSource === "none" || provider.authSource === "auth_file")) {
    return {
      disabled: false,
      label: provider.authSource === "auth_file" ? t("settings.provider_action.manage") : t("settings.provider_action.set_api_key"),
      onClick: () => onConfigureApiKey(provider),
    };
  }

  return {
    disabled: true,
    label:
      provider.authSource === "env" || provider.authSource === "external"
        ? t("settings.provider_action.managed_externally")
        : t("settings.provider_status.configure_externally"),
  };
}
