import type { ThemeMode } from "./desktop-state";
import { SettingsGroup, SettingsRow } from "./settings-utils";
import { Radio, UIRadioGroup } from "./ui";
import { t, type AppLocale } from "./i18n";

interface SettingsAppearanceSectionProps {
  readonly themeMode: ThemeMode;
  readonly onSetThemeMode: (mode: ThemeMode) => void;
  readonly locale: AppLocale;
  readonly onSetLocale: (locale: AppLocale) => void;
}

export function SettingsAppearanceSection({ themeMode, onSetThemeMode, locale, onSetLocale }: SettingsAppearanceSectionProps) {
  const themeOptions: { mode: ThemeMode; label: string; description: string }[] = [
    { mode: "system", label: t("settings.theme.system"), description: t("settings.theme.system_description") },
    { mode: "light", label: t("settings.theme.light"), description: t("settings.theme.light_description") },
    { mode: "dark", label: t("settings.theme.dark"), description: t("settings.theme.dark_description") },
  ];

  const languageOptions: { locale: AppLocale; label: string; description: string }[] = [
    { locale: "en-US", label: t("settings.language.en_us"), description: t("settings.language.en_us_description") },
    { locale: "zh-CN", label: t("settings.language.zh_cn"), description: t("settings.language.zh_cn_description") },
  ];

  return (
    <>
      <SettingsGroup title={t("settings.theme")}>
        <UIRadioGroup value={themeMode} onChange={onSetThemeMode} aria-label={t("settings.theme")}>
          {themeOptions.map((option) => (
            <SettingsRow key={option.mode} title={option.label} description={option.description}>
              <Radio value={option.mode} className="ui-radio-dot" />
            </SettingsRow>
          ))}
        </UIRadioGroup>
      </SettingsGroup>
      <SettingsGroup title={t("settings.language")}>
        <UIRadioGroup value={locale} onChange={onSetLocale} aria-label={t("settings.language")}>
          {languageOptions.map((option) => (
            <SettingsRow key={option.locale} title={option.label} description={option.description}>
              <Radio value={option.locale} className="ui-radio-dot" />
            </SettingsRow>
          ))}
        </UIRadioGroup>
      </SettingsGroup>
    </>
  );
}
