import type { ThemeMode } from "./desktop-state";
import { SettingsGroup, SettingsRow } from "./settings-utils";
import { t } from "./i18n";

interface SettingsAppearanceSectionProps {
  readonly themeMode: ThemeMode;
  readonly onSetThemeMode: (mode: ThemeMode) => void;
}

export function SettingsAppearanceSection({ themeMode, onSetThemeMode }: SettingsAppearanceSectionProps) {
  const themeOptions: { mode: ThemeMode; label: string; description: string }[] = [
    { mode: "system", label: t("settings.theme.system"), description: t("settings.theme.system_description") },
    { mode: "light", label: t("settings.theme.light"), description: t("settings.theme.light_description") },
    { mode: "dark", label: t("settings.theme.dark"), description: t("settings.theme.dark_description") },
  ];

  return (
    <SettingsGroup title={t("settings.theme")}>
      {themeOptions.map((option) => (
        <SettingsRow key={option.mode} title={option.label} description={option.description}>
          <input
            checked={themeMode === option.mode}
            name="theme"
            type="radio"
            onChange={() => onSetThemeMode(option.mode)}
          />
        </SettingsRow>
      ))}
    </SettingsGroup>
  );
}
