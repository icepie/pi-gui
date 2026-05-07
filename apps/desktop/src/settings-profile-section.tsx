import type { PlatformAccountState } from "./desktop-state";
import { SettingsGroup, SettingsInfoRow } from "./settings-utils";
import { t } from "./i18n";

interface SettingsProfileSectionProps {
  readonly platformAccount: PlatformAccountState;
  readonly onLogout: () => void;
}

export function SettingsProfileSection({ platformAccount, onLogout }: SettingsProfileSectionProps) {
  const user = platformAccount.user;
  const displayName = user?.username || user?.name || t("settings.profile.unknown_user");

  return (
    <SettingsGroup title={t("settings.profile.account")} description={t("settings.profile.account_description")}>
      <SettingsInfoRow label={t("settings.profile.user_id")} value={user?.id || t("settings.none")} />
      <SettingsInfoRow label={t("settings.profile.username")} value={user?.username || t("settings.none")} />
      <SettingsInfoRow label={t("settings.profile.email")} value={user?.email || t("settings.none")} />
      <SettingsInfoRow label={t("settings.profile.phone")} value={user?.phone || t("settings.none")} />
      <div className="settings-row">
        <div className="settings-row__label">
          <div className="settings-row__title">{displayName}</div>
          <div className="settings-row__description">{t("settings.profile.logout_description")}</div>
        </div>
        <div className="settings-row__control">
          <button className="button button--secondary" type="button" onClick={onLogout}>
            {t("settings.profile.logout")}
          </button>
        </div>
      </div>
    </SettingsGroup>
  );
}
