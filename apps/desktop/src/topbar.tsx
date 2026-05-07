import type { MouseEvent as ReactMouseEvent } from "react";
import type { AppView, SessionRecord, WorkspaceRecord, WorktreeRecord } from "./desktop-state";
import { DiffIcon, FolderIcon, TerminalIcon } from "./icons";
import { getDesktopShortcutLabel, type PiDesktopApi } from "./ipc";
import type { WorkspaceMenuState } from "./hooks/use-workspace-menu";
import { SidebarToggleButton } from "./sidebar-toggle-button";
import { t } from "./i18n";

interface TopbarProps {
  readonly activeView: AppView;
  readonly rootWorkspace: WorkspaceRecord | undefined;
  readonly selectedWorkspace: WorkspaceRecord | undefined;
  readonly selectedSession: SessionRecord | undefined;
  readonly selectedSessionTitle: string | undefined;
  readonly selectedWorktree: WorktreeRecord | undefined;
  readonly activeWorktrees: readonly WorktreeRecord[];
  readonly workspaces: readonly WorkspaceRecord[];
  readonly wsMenu: WorkspaceMenuState;
  readonly api: PiDesktopApi;
  readonly terminalAvailable: boolean;
  readonly terminalVisible: boolean;
  readonly onToggleTerminal: () => void;
  readonly workspacePanelTab: "changes" | "files" | null;
  readonly onToggleChangesPanel: () => void;
  readonly onToggleFilesPanel: () => void;
  readonly showSidebarToggle: boolean;
  readonly sidebarCollapsed: boolean;
  readonly sidebarToggleShortcutLabel: string;
  readonly onToggleSidebar: () => void;
}

export function Topbar(props: TopbarProps) {
  const {
    activeView,
    rootWorkspace,
    selectedWorkspace,
    selectedSession,
    selectedSessionTitle,
    selectedWorktree,
    activeWorktrees,
    workspaces,
    wsMenu,
    api,
    terminalAvailable,
    terminalVisible,
    onToggleTerminal,
    workspacePanelTab,
    onToggleChangesPanel,
    onToggleFilesPanel,
    showSidebarToggle,
    sidebarCollapsed,
    sidebarToggleShortcutLabel,
    onToggleSidebar,
  } = props;
  const terminalShortcut = getDesktopShortcutLabel(api.platform, "J");
  const diffShortcut = getDesktopShortcutLabel(api.platform, "D");

  const handleDoubleClick = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest(".topbar__actions")) {
      return;
    }

    void api.toggleWindowMaximize();
  };

  return (
    <header className="topbar" data-testid="topbar" onDoubleClick={handleDoubleClick}>
      {showSidebarToggle ? (
        <div className="topbar__leading">
          <SidebarToggleButton
            collapsed={sidebarCollapsed}
            shortcutLabel={sidebarToggleShortcutLabel}
            onToggle={onToggleSidebar}
          />
        </div>
      ) : null}
      <div className="topbar__title">
        <span className="topbar__workspace">
          {rootWorkspace ? rootWorkspace.name : t("topbar.open_a_folder_to_begin")}
        </span>
        {selectedWorkspace && activeView === "threads" ? (
          <>
            <span className="topbar__separator">/</span>
            <div className="environment-picker" ref={wsMenu.environmentMenuRef}>
              <button
                aria-expanded={wsMenu.environmentMenuOpen}
                aria-haspopup="menu"
                className="environment-picker__button"
                type="button"
                onClick={() => wsMenu.setEnvironmentMenuOpen((current) => !current)}
              >
                {selectedWorkspace.kind === "worktree" ? selectedWorktree?.name ?? selectedWorkspace.name : t("topbar.local")}
              </button>
              {wsMenu.environmentMenuOpen && rootWorkspace ? (
                <div className="workspace-menu environment-picker__menu">
                  <button
                    className="workspace-menu__item"
                    type="button"
                    onClick={() => wsMenu.selectWorkspace(rootWorkspace.id)}
                  >
                    {t("topbar.local")}
                  </button>
                  {activeWorktrees.map((worktree) => {
                    const linkedWorkspace = workspaces.find(
                      (workspace) => workspace.id === worktree.linkedWorkspaceId,
                    );
                    const worktreeSelectable = Boolean(linkedWorkspace) && worktree.status === "ready";
                    return (
                      <button
                        className="workspace-menu__item"
                        key={worktree.id}
                        type="button"
                        disabled={!worktreeSelectable}
                        onClick={() => {
                          if (worktreeSelectable && linkedWorkspace) {
                            wsMenu.selectWorkspace(linkedWorkspace.id);
                          }
                        }}
                      >
                        {worktree.name}
                        {!worktreeSelectable ? ` (${worktree.status !== "ready" ? worktree.status : t("topbar.unavailable")})` : ""}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {selectedWorkspace && activeView === "threads" && selectedSession ? (
          <>
            <span className="topbar__separator">/</span>
            <span className="topbar__session">{selectedSessionTitle ?? selectedSession.title}</span>
          </>
        ) : activeView === "new-thread" && rootWorkspace ? (
          <>
            <span className="topbar__separator">/</span>
            <span className="topbar__session">{t("topbar.new_thread")}</span>
          </>
        ) : null}
      </div>

      <div className="topbar__actions">
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label={t("topbar.toggle_terminal")}
            className={`icon-button topbar__icon ${terminalVisible ? "icon-button--active" : ""}`}
            type="button"
            disabled={!terminalAvailable}
            onClick={onToggleTerminal}
          >
            <TerminalIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>{t("topbar.toggle_terminal")}</span>
            <kbd>{terminalShortcut}</kbd>
          </span>
        </div>
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label={t("topbar.toggle_changes")}
            className={`icon-button topbar__icon ${workspacePanelTab === "changes" ? "icon-button--active" : ""}`}
            type="button"
            onClick={onToggleChangesPanel}
          >
            <DiffIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>{t("topbar.toggle_changes")}</span>
            <kbd>{diffShortcut}</kbd>
          </span>
        </div>
        <div className="shortcut-tooltip-wrap topbar__tooltip-wrap">
          <button
            aria-label={t("topbar.toggle_files")}
            className={`icon-button topbar__icon ${workspacePanelTab === "files" ? "icon-button--active" : ""}`}
            type="button"
            onClick={onToggleFilesPanel}
          >
            <FolderIcon />
          </button>
          <span className="shortcut-tooltip topbar__tooltip" role="tooltip">
            <span>{t("topbar.toggle_files")}</span>
            <kbd>{diffShortcut}</kbd>
          </span>
        </div>
      </div>
    </header>
  );
}
