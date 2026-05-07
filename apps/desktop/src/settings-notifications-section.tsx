import type { DesktopNotificationPermissionStatus } from "./ipc";
import type { NotificationPreferences } from "./desktop-state";
import { SettingsGroup, SettingsRow } from "./settings-utils";
import { UICheckbox } from "./ui";
import { t } from "./i18n";

interface SettingsNotificationsSectionProps {
  readonly notificationPreferences: NotificationPreferences;
  readonly notificationPermissionStatus: DesktopNotificationPermissionStatus;
  readonly notificationPermissionPending: boolean;
  readonly onSetNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  readonly onRequestNotificationPermission: () => void;
  readonly onOpenSystemNotificationSettings: () => void;
}

export function SettingsNotificationsSection({
  notificationPreferences,
  notificationPermissionStatus,
  notificationPermissionPending,
  onSetNotificationPreferences,
  onRequestNotificationPermission,
  onOpenSystemNotificationSettings,
}: SettingsNotificationsSectionProps) {
  const statusLabel = labelForPermissionStatus(notificationPermissionStatus);
  const statusDescription = descriptionForPermissionStatus(notificationPermissionStatus);
  const showAskMacOs = notificationPermissionStatus === "default";
  const showOpenSystemSettings = notificationPermissionStatus === "denied";
  const showRecoveryActions = showAskMacOs || showOpenSystemSettings;

  return (
    <>
      <SettingsGroup title={t("settings.notifications.system")} description={t("settings.notifications.system_description")}>
        <SettingsRow title={t("settings.notifications.access")} description={statusDescription}>
          <span className="settings-row__value">{statusLabel}</span>
        </SettingsRow>
        {showRecoveryActions ? (
          <SettingsRow
            title={t("settings.notifications.turn_on")}
            description={
              showAskMacOs
                ? t("settings.notifications.ask_now")
                : t("settings.notifications.denied_recovery")
            }
          >
            <div className="settings-row__actions">
              {showAskMacOs ? (
                <button
                  className="button button--secondary"
                  disabled={notificationPermissionPending}
                  type="button"
                  onClick={onRequestNotificationPermission}
                >
                  {t("settings.notifications.ask_macos")}
                </button>
              ) : null}
              {showOpenSystemSettings ? (
                <button
                  className="button button--secondary"
                  disabled={notificationPermissionPending}
                  type="button"
                  onClick={onOpenSystemNotificationSettings}
                >
                  {t("settings.notifications.open_system_settings")}
                </button>
              ) : null}
            </div>
          </SettingsRow>
        ) : null}
      </SettingsGroup>

      <SettingsGroup title={t("settings.notifications.in_app_alerts")} description={t("settings.notifications.in_app_alerts_description")}>
        <SettingsRow title={t("settings.notifications.background_completion")} description={t("settings.notifications.background_completion_description")}>
          <UICheckbox
            aria-label={t("settings.notifications.background_completion")}
            checked={notificationPreferences.backgroundCompletion}
            onChange={(checked) => onSetNotificationPreferences({ backgroundCompletion: checked })}
          />
        </SettingsRow>
        <SettingsRow title={t("settings.notifications.background_failures")} description={t("settings.notifications.background_failures_description")}>
          <UICheckbox
            aria-label={t("settings.notifications.background_failures")}
            checked={notificationPreferences.backgroundFailure}
            onChange={(checked) => onSetNotificationPreferences({ backgroundFailure: checked })}
          />
        </SettingsRow>
        <SettingsRow title={t("settings.notifications.attention_needed")} description={t("settings.notifications.attention_needed_description")}>
          <UICheckbox
            aria-label={t("settings.notifications.attention_needed")}
            checked={notificationPreferences.attentionNeeded}
            onChange={(checked) => onSetNotificationPreferences({ attentionNeeded: checked })}
          />
        </SettingsRow>
      </SettingsGroup>
    </>
  );
}

function labelForPermissionStatus(status: DesktopNotificationPermissionStatus): string {
  switch (status) {
    case "granted":
      return t("settings.notifications.status.enabled");
    case "denied":
      return t("settings.notifications.status.turned_off");
    case "default":
      return t("settings.notifications.status.not_enabled");
    case "unsupported":
      return t("settings.notifications.status.unavailable");
    default:
      return t("settings.notifications.status.checking");
  }
}

function descriptionForPermissionStatus(status: DesktopNotificationPermissionStatus): string {
  switch (status) {
    case "granted":
      return t("settings.notifications.desc.granted");
    case "denied":
      return t("settings.notifications.desc.denied");
    case "default":
      return t("settings.notifications.desc.default");
    case "unsupported":
      return t("settings.notifications.desc.unsupported");
    default:
      return t("settings.notifications.desc.unknown");
  }
}
