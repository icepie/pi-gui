import { useEffect, useState } from "react";
import type { RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { ModelSettingsScopeMode } from "./desktop-state";
import { SettingsGroup, SettingsInfoRow, SettingsRow } from "./settings-utils";
import { t } from "./i18n";

interface SettingsGeneralSectionProps {
  readonly runtime?: RuntimeSnapshot;
  readonly modelSettingsScopeMode: ModelSettingsScopeMode;
  readonly integratedTerminalShell: string;
  readonly onSetModelSettingsScopeMode: (mode: ModelSettingsScopeMode) => void;
  readonly onSetIntegratedTerminalShell: (shellPath: string) => void;
  readonly onToggleSkillCommands: (enabled: boolean) => void;
}

export function SettingsGeneralSection({
  runtime,
  modelSettingsScopeMode,
  integratedTerminalShell,
  onSetModelSettingsScopeMode,
  onSetIntegratedTerminalShell,
  onToggleSkillCommands,
}: SettingsGeneralSectionProps) {
  const connectedCount = runtime?.providers.filter((p) => p.hasAuth).length ?? 0;
  const [terminalShellDraft, setTerminalShellDraft] = useState(integratedTerminalShell);

  useEffect(() => {
    setTerminalShellDraft(integratedTerminalShell);
  }, [integratedTerminalShell]);

  const commitTerminalShellDraft = () => {
    if (terminalShellDraft !== integratedTerminalShell) {
      onSetIntegratedTerminalShell(terminalShellDraft);
    }
  };

  return (
    <>
      <SettingsGroup title={t("settings.general")}>
        <SettingsInfoRow
          label={t("settings.connected_providers")}
          value={connectedCount > 0 ? String(connectedCount) : t("settings.none")}
        />
        <SettingsInfoRow label={t("settings.discovered_skills")} value={String(runtime?.skills.length ?? 0)} />
        <SettingsRow title={t("settings.model_scope")} description={t("settings.model_scope_description")}>
          <div className="settings-pill-row">
            <button
              className={`settings-pill${modelSettingsScopeMode === "app-global" ? " settings-pill--active" : ""}`}
              type="button"
              aria-pressed={modelSettingsScopeMode === "app-global"}
              onClick={() => onSetModelSettingsScopeMode("app-global")}
            >
              {t("settings.model_scope.app_global")}
            </button>
            <button
              className={`settings-pill${modelSettingsScopeMode === "per-repo" ? " settings-pill--active" : ""}`}
              type="button"
              aria-pressed={modelSettingsScopeMode === "per-repo"}
              onClick={() => onSetModelSettingsScopeMode("per-repo")}
            >
              {t("settings.model_scope.per_repo")}
            </button>
          </div>
        </SettingsRow>
        <SettingsRow title={t("settings.skill_slash_commands")} description={t("settings.skill_slash_commands_description")}>
          <input
            aria-label={t("settings.skill_slash_commands")}
            checked={runtime?.settings.enableSkillCommands ?? true}
            type="checkbox"
            onChange={(event) => onToggleSkillCommands(event.target.checked)}
          />
        </SettingsRow>
        <SettingsRow title={t("settings.integrated_terminal_shell")} description={t("settings.integrated_terminal_shell_description")}>
          <input
            aria-label={t("settings.integrated_terminal_shell")}
            className="settings-text-input"
            placeholder="/bin/zsh"
            spellCheck={false}
            type="text"
            value={terminalShellDraft}
            onBlur={commitTerminalShellDraft}
            onChange={(event) => setTerminalShellDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title={t("settings.shortcuts")}>
        <SettingsInfoRow label={t("settings.shortcuts.new_thread")} value="Cmd+Shift+O" />
        <SettingsInfoRow label={t("settings.shortcuts.open_settings")} value="Cmd+," />
        <SettingsInfoRow label={t("settings.shortcuts.toggle_terminal")} value="Cmd+J" />
        <SettingsInfoRow label={t("settings.shortcuts.new_terminal_tab")} value="Cmd+T" />
        <SettingsInfoRow label={t("settings.shortcuts.send_message")} value="Enter" />
        <SettingsInfoRow label={t("settings.shortcuts.new_line")} value="Shift+Enter" />
      </SettingsGroup>
    </>
  );
}
