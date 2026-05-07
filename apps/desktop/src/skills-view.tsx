import { useMemo, useState } from "react";
import type { RuntimeSkillRecord, RuntimeSnapshot } from "@pi-gui/session-driver/runtime-types";
import type { WorkspaceRecord } from "./desktop-state";
import { RefreshIcon } from "./icons";
import { titleCase } from "./string-utils";
import { t } from "./i18n";

interface SkillsViewProps {
  readonly workspace?: WorkspaceRecord;
  readonly runtime?: RuntimeSnapshot;
  readonly onRefresh: () => void;
  readonly onOpenSkillFolder: (filePath: string) => void;
  readonly onToggleSkill: (filePath: string, enabled: boolean) => void;
  readonly onTrySkill: (skill: RuntimeSkillRecord) => void;
}

export function SkillsView({
  workspace,
  runtime,
  onRefresh,
  onOpenSkillFolder,
  onToggleSkill,
  onTrySkill,
}: SkillsViewProps) {
  const [query, setQuery] = useState("");
  const [selectedSkillPath, setSelectedSkillPath] = useState<string | undefined>();
  const skills = runtime?.skills ?? [];
  const filteredSkills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return skills;
    }

    return skills.filter((skill) =>
      [skill.name, skill.description, skill.source, skill.slashCommand].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query, skills]);
  const selectedSkill =
    filteredSkills.find((skill) => skill.filePath === selectedSkillPath) ?? filteredSkills[0];
  const enabledSkillCount = skills.filter((skill) => skill.enabled).length;
  const slashOnlySkillCount = skills.filter((skill) => skill.disableModelInvocation).length;

  if (!workspace) {
    return (
      <section className="canvas canvas--empty">
        <div className="empty-panel">
          <div className="session-header__eyebrow">{t("skills.title")}</div>
          <h1>{t("skills.select_workspace")}</h1>
          <p>{t("skills.empty_workspace_description")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="canvas">
      <div className="conversation skills-view">
        <header className="view-header">
          <div>
            <div className="chat-header__eyebrow">{t("skills.title")}</div>
            <h1 className="view-header__title">{t("skills.title")}</h1>
            <p className="view-header__body">{t("skills.page_description")}</p>
          </div>
          <div className="view-header__actions">
            <button className="button button--secondary" type="button" onClick={onRefresh}>
              <RefreshIcon />
              <span>{t("common.refresh")}</span>
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() =>
                onTrySkill({
                  name: "new-skill",
                  description: t("skills.create_new_skill_description"),
                  filePath: "",
                  baseDir: workspace.path,
                  source: "project",
                  enabled: true,
                  disableModelInvocation: false,
                  slashCommand: "/skill:new-skill",
                })
              }
            >
              {t("skills.new_skill")}
            </button>
          </div>
        </header>

        <div className="skills-toolbar">
          <input
            aria-label={t("skills.search")}
            className="skills-search"
            placeholder={t("skills.search")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <div className="skills-toolbar__stats" aria-label="Skill summary">
            <span>{filteredSkills.length} / {skills.length}</span>
            <span>{enabledSkillCount} {t("common.enabled")}</span>
            {slashOnlySkillCount > 0 ? <span>{slashOnlySkillCount} {t("skills.slash_only")}</span> : null}
          </div>
        </div>

        <div className="skills-layout">
          <div className="skills-grid" data-testid="skills-list">
            {filteredSkills.length === 0 ? (
              <SkillsEmptyState message={t("skills.empty_state_refresh")} />
            ) : (
              filteredSkills.map((skill) => (
                <button
                  className={`skill-card ${selectedSkill?.filePath === skill.filePath ? "skill-card--active" : ""}`}
                  key={skill.filePath}
                  type="button"
                  onClick={() => {
                    setSelectedSkillPath(skill.filePath);
                  }}
                >
                  <span className="skill-card__title-row">
                    <span className="skill-card__title">{titleCase(skill.name)}</span>
                    <span className={`skill-card__badge ${skill.enabled ? "skill-card__badge--enabled" : ""}`}>
                      {skill.enabled ? t("common.enabled") : t("common.disabled")}
                    </span>
                  </span>
                  <span className="skill-card__description">{skill.description}</span>
                  <span className="skill-card__meta">
                    <span>{skill.source}</span>
                    <span>{skill.slashCommand}</span>
                    {skill.disableModelInvocation ? <span>{t("skills.slash_only")}</span> : null}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="skill-detail">
            {selectedSkill ? (
              <>
                <div className="skill-detail__header">
                  <div>
                    <h2>{titleCase(selectedSkill.name)}</h2>
                    <div className="skill-detail__slash">{selectedSkill.slashCommand}</div>
                  </div>
                  <span className={`skill-detail__status ${selectedSkill.enabled ? "skill-detail__status--enabled" : ""}`}>
                    {selectedSkill.enabled ? t("common.enabled") : t("common.disabled")}
                  </span>
                </div>
                <p className="skill-detail__description">{selectedSkill.description}</p>
                <div className="skill-detail__meta-list">
                  <div>
                    <div className="skill-detail__meta-label">{t("common.source")}</div>
                    <div className="skill-detail__description">{selectedSkill.source}</div>
                  </div>
                  <div>
                    <div className="skill-detail__meta-label">{t("common.path")}</div>
                    <div className="skill-detail__path">{selectedSkill.filePath}</div>
                  </div>
                </div>
                <div className="skill-detail__actions">
                  <button className="button button--secondary" type="button" onClick={() => onOpenSkillFolder(selectedSkill.filePath)}>
                    {t("skills.open_folder")}
                  </button>
                  <button
                    className="button button--secondary"
                    type="button"
                    onClick={() => onToggleSkill(selectedSkill.filePath, !selectedSkill.enabled)}
                  >
                    {selectedSkill.enabled ? t("skills.disable") : t("skills.enable")}
                  </button>
                  <button className="button button--primary" type="button" onClick={() => onTrySkill(selectedSkill)}>
                    {t("skills.try")}
                  </button>
                </div>
              </>
            ) : (
              <SkillsEmptyState message={t("skills.empty_state_none_selected")} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SkillsEmptyState({ message }: { readonly message: string }) {
  return (
    <div className="empty-state">
      <h2>{t("skills.empty")}</h2>
      <p>{message}</p>
    </div>
  );
}
