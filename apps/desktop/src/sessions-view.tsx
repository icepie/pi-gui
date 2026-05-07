import { useMemo, useState } from "react";
import { formatRelativeTime } from "./string-utils";
import type { ThreadGroup, ThreadListEntry } from "./thread-groups";
import { t } from "./i18n";

interface SessionsViewProps {
  readonly threadGroups: readonly ThreadGroup[];
  readonly selectedWorkspaceId?: string;
  readonly selectedSessionId?: string;
  readonly onSelectSession: (target: { workspaceId: string; sessionId: string }) => void;
}

interface SessionHistoryEntry extends ThreadListEntry {
  readonly rootWorkspaceName: string;
  readonly archived: boolean;
}

export function SessionsView({
  threadGroups,
  selectedWorkspaceId,
  selectedSessionId,
  onSelectSession,
}: SessionsViewProps) {
  const [query, setQuery] = useState("");
  const sessions = useMemo(() => flattenThreadGroups(threadGroups), [threadGroups]);
  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return sessions;
    }
    return sessions.filter((entry) =>
      [
        entry.session.title,
        entry.session.preview,
        entry.rootWorkspaceName,
        entry.environment.label,
        entry.environment.branchName ?? "",
      ].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, sessions]);

  return (
    <section className="canvas">
      <div className="conversation sessions-view">
        <header className="view-header">
          <div>
            <div className="chat-header__eyebrow">{t("sessions.title")}</div>
            <h1 className="view-header__title">{t("sessions.title")}</h1>
            <p className="view-header__body">{t("sessions.page_description")}</p>
          </div>
        </header>

        <div className="sessions-toolbar">
          <input
            aria-label={t("sessions.search")}
            className="sessions-search"
            placeholder={t("sessions.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="sessions-list" data-testid="sessions-history-list">
          {filteredSessions.length === 0 ? (
            <div className="sessions-empty">
              <h2>{t("sessions.empty")}</h2>
              <p>{t("sessions.empty_state")}</p>
            </div>
          ) : (
            filteredSessions.map((entry) => {
              const active = entry.workspaceId === selectedWorkspaceId && entry.session.id === selectedSessionId;
              return (
                <button
                  className={`sessions-row ${active ? "sessions-row--active" : ""}`}
                  key={`${entry.workspaceId}:${entry.session.id}`}
                  type="button"
                  onClick={() => onSelectSession({ workspaceId: entry.workspaceId, sessionId: entry.session.id })}
                >
                  <span className="sessions-row__body">
                    <span className="sessions-row__title-line">
                      <span className="sessions-row__title">{entry.session.title}</span>
                      {entry.session.status === "running" ? (
                        <span className="sessions-row__badge sessions-row__badge--running">{t("sessions.running_badge")}</span>
                      ) : null}
                      {entry.archived ? (
                        <span className="sessions-row__badge">{t("sessions.archived_badge")}</span>
                      ) : null}
                    </span>
                    <span className="sessions-row__meta">
                      {entry.rootWorkspaceName} · {entry.environment.label}
                    </span>
                    {entry.session.preview ? (
                      <span className="sessions-row__preview">{entry.session.preview}</span>
                    ) : null}
                  </span>
                  <span className="sessions-row__time">{formatRelativeTime(entry.session.updatedAt)}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function flattenThreadGroups(threadGroups: readonly ThreadGroup[]): readonly SessionHistoryEntry[] {
  const entries = threadGroups.flatMap((group) => [
    ...group.threads.map((thread) => ({
      ...thread,
      rootWorkspaceName: group.rootWorkspace.name,
      archived: false,
    })),
    ...group.archivedThreads.map((thread) => ({
      ...thread,
      rootWorkspaceName: group.rootWorkspace.name,
      archived: true,
    })),
  ]);

  return entries.sort((left, right) => {
    if (left.session.updatedAt !== right.session.updatedAt) {
      return right.session.updatedAt.localeCompare(left.session.updatedAt);
    }
    return left.session.title.localeCompare(right.session.title);
  });
}
