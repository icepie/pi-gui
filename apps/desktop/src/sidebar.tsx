import { useCallback, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AppView, SessionRecord, WorkspaceRecord, WorktreeRecord } from "./desktop-state";
import { ArchiveIcon, ChevronDownIcon, ExtensionIcon, FileIcon, FolderIcon, PlusIcon, RestoreIcon, SettingsIcon, SidebarToggleIcon, SkillIcon, TrashIcon, WorktreeIcon } from "./icons";
import type { PiDesktopApi } from "./ipc";
import { formatRelativeTime } from "./string-utils";
import type { WorkspaceMenuState } from "./hooks/use-workspace-menu";
import { UIMenu } from "./ui";
import type { ThreadGroup, ThreadListEntry } from "./thread-groups";
import type { Dispatch, SetStateAction } from "react";
import type { DesktopAppState } from "./desktop-state";
import { t } from "./i18n";

const DEFAULT_SIDEBAR_WIDTH = 260;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 380;

interface SidebarProps {
  readonly activeView: AppView;
  readonly selectedWorkspace: WorkspaceRecord | undefined;
  readonly selectedSession: SessionRecord | undefined;
  readonly visibleWorkspaces: readonly WorkspaceRecord[];
  readonly threadGroups: readonly ThreadGroup[];
  readonly linkedWorktreeByWorkspaceId: Map<string, WorktreeRecord>;
  readonly wsMenu: WorkspaceMenuState;
  readonly api: PiDesktopApi;
  readonly setSnapshot: Dispatch<SetStateAction<DesktopAppState | null>>;
  readonly updateSnapshot: (
    api: PiDesktopApi,
    setSnapshot: Dispatch<SetStateAction<DesktopAppState | null>>,
    action: () => Promise<DesktopAppState>,
  ) => Promise<DesktopAppState>;
  readonly onNewThread: () => void;
  readonly onSetActiveView: (view: AppView) => void;
  readonly onOpenSkills: (workspaceId?: string) => void;
  readonly onOpenExtensions: (workspaceId?: string) => void;
  readonly onOpenSettings: (workspaceId?: string) => void;
  readonly onArchiveSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onSelectSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onUnarchiveSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onDeleteSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onConfirm: (request: {
    readonly title: string;
    readonly body: string;
    readonly confirmLabel: string;
    readonly cancelLabel: string;
    readonly tone?: "default" | "danger";
    readonly onConfirm: () => void;
  }) => void;
}

export function Sidebar(props: SidebarProps) {
  const {
    activeView,
    selectedWorkspace,
    selectedSession,
    visibleWorkspaces,
    threadGroups,
    linkedWorktreeByWorkspaceId,
    wsMenu,
    api,
    setSnapshot,
    updateSnapshot,
    onNewThread,
    onSetActiveView,
    onOpenSkills,
    onOpenExtensions,
    onOpenSettings,
    onArchiveSession,
    onSelectSession,
    onUnarchiveSession,
    onDeleteSession,
    onConfirm,
  } = props;

  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Collision detection based on workspace row headers only (~30px top of each group),
  // not the full group height including all sessions.
  const headerCollision: CollisionDetection = (args) => {
    const pointerY = args.pointerCoordinates?.y;
    if (pointerY == null) return [];

    let closest: { id: string; distance: number } | null = null;
    for (const container of args.droppableContainers) {
      const rect = container.rect.current;
      if (!rect) continue;
      const headerCenter = rect.top + 15; // center of the ~30px workspace row header
      const distance = Math.abs(pointerY - headerCenter);
      if (!closest || distance < closest.distance) {
        closest = { id: String(container.id), distance };
      }
    }
    return closest ? [{ id: closest.id, data: { droppableContainer: args.droppableContainers.find((c) => String(c.id) === closest!.id)! } }] : [];
  };

  const rootGroups = threadGroups.filter((g) => g.rootWorkspace.kind === "primary");
  const orphanGroups = threadGroups.filter((g) => g.rootWorkspace.kind !== "primary");
  const rootGroupIds = rootGroups.map((g) => g.rootWorkspace.id);
  const canDrag = rootGroups.length > 1;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rootGroupIds.indexOf(String(active.id));
    const newIndex = rootGroupIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const newOrder = arrayMove(rootGroupIds, oldIndex, newIndex);
    // Optimistically update local state to avoid snap-back animation
    setSnapshot((prev) => prev ? { ...prev, workspaceOrder: newOrder } : prev);
    void api.reorderWorkspaces(newOrder);
  }

  const activeGroup = activeId ? rootGroups.find((g) => g.rootWorkspace.id === activeId) : undefined;

  const handleCloseSidebar = () => {
    void updateSnapshot(api, setSnapshot, () => api.setSidebarCollapsed(true));
  };

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (window.matchMedia("(max-width: 980px)").matches) {
        return;
      }

      const startX = event.clientX;
      const startWidth = sidebarWidth;
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, startWidth + moveEvent.clientX - startX),
        );
        setSidebarWidth(nextWidth);
      };

      const cleanup = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", cleanup);
        window.removeEventListener("pointercancel", cleanup);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", cleanup);
      window.addEventListener("pointercancel", cleanup);
    },
    [sidebarWidth],
  );

  return (
    <>
      <button
        aria-label={t("topbar.toggle_sidebar")}
        className="sidebar__scrim"
        type="button"
        onClick={handleCloseSidebar}
      />
      <aside className="sidebar" style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
        <div className="sidebar__top">
          <div className="sidebar__mobile-head">
            <span>{t("sidebar.threads")}</span>
            <button
              aria-label={t("topbar.toggle_sidebar")}
              className="icon-button sidebar__mobile-close"
              type="button"
              onClick={handleCloseSidebar}
            >
              <SidebarToggleIcon />
            </button>
          </div>
          <button
            className="sidebar__new"
            type="button"
            disabled={!selectedWorkspace}
            onClick={onNewThread}
          >
            <PlusIcon />
            <span>{t("sidebar.new_thread")}</span>
          </button>

          <div className="sidebar__nav">
            <button
              className={`sidebar__nav-item ${activeView === "threads" ? "sidebar__nav-item--active" : ""}`}
              type="button"
              onClick={() => onSetActiveView("threads")}
            >
              <FolderIcon />
              <span>{t("sidebar.threads")}</span>
            </button>
            <button
              className={`sidebar__nav-item ${activeView === "sessions" ? "sidebar__nav-item--active" : ""}`}
              type="button"
              onClick={() => onSetActiveView("sessions")}
            >
              <FileIcon />
              <span>{t("sidebar.sessions")}</span>
            </button>
            <button
              className={`sidebar__nav-item ${activeView === "skills" ? "sidebar__nav-item--active" : ""}`}
              type="button"
              onClick={() => onOpenSkills(selectedWorkspace?.rootWorkspaceId ?? selectedWorkspace?.id)}
            >
              <SkillIcon />
              <span>{t("sidebar.skills")}</span>
            </button>
            <button
              className={`sidebar__nav-item ${activeView === "extensions" ? "sidebar__nav-item--active" : ""}`}
              type="button"
              onClick={() => onOpenExtensions(selectedWorkspace?.rootWorkspaceId ?? selectedWorkspace?.id)}
            >
              <ExtensionIcon />
              <span>{t("sidebar.extensions")}</span>
            </button>
          </div>
        </div>

        <div className="sidebar__section">
          {visibleWorkspaces.length === 0 ? (
            <div className="empty-state" data-testid="empty-state">
              <h2>{t("sidebar.no_folders_yet")}</h2>
              <p>{t("sidebar.no_folders_description")}</p>
              <button
                className="button button--primary"
                type="button"
                onClick={() => {
                  void updateSnapshot(api, setSnapshot, () => api.pickWorkspace());
                }}
              >
                {t("sidebar.open_first_folder")}
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={headerCollision} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="section__head">
                <span>{t("sidebar.threads")}</span>
                <div className="section__tools">
                  <button
                    aria-label={t("common.open_folder")}
                    className="icon-button"
                    type="button"
                    onClick={() => {
                      void updateSnapshot(api, setSnapshot, () => api.pickWorkspace());
                    }}
                  >
                    <FolderIcon />
                  </button>
                </div>
              </div>
              <SortableContext items={rootGroupIds} strategy={verticalListSortingStrategy}>
                <div className="workspace-list" data-testid="workspace-list">
                  {rootGroups.map((group) => (
                    <SortableWorkspaceGroup
                      key={group.rootWorkspace.id}
                      group={group}
                      canDrag={canDrag}
                      selectedWorkspace={selectedWorkspace}
                      selectedSession={selectedSession}
                      linkedWorktreeByWorkspaceId={linkedWorktreeByWorkspaceId}
                      wsMenu={wsMenu}
                      api={api}
                      onArchiveSession={onArchiveSession}
                      onSelectSession={onSelectSession}
                        onUnarchiveSession={onUnarchiveSession}
                        onDeleteSession={onDeleteSession}
                        onConfirm={onConfirm}
                      />
                  ))}
                  {orphanGroups.map((group) => (
                    <WorkspaceGroupContent
                      key={group.rootWorkspace.id}
                      group={group}
                      canDrag={false}
                      selectedWorkspace={selectedWorkspace}
                      selectedSession={selectedSession}
                      linkedWorktreeByWorkspaceId={linkedWorktreeByWorkspaceId}
                      wsMenu={wsMenu}
                      api={api}
                      onArchiveSession={onArchiveSession}
                      onSelectSession={onSelectSession}
                        onUnarchiveSession={onUnarchiveSession}
                        onDeleteSession={onDeleteSession}
                        onConfirm={onConfirm}
                      />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeGroup ? (
                  <div className="workspace-group workspace-group--overlay">
                    <WorkspaceGroupContent
                      group={activeGroup}
                      canDrag={false}
                      selectedWorkspace={selectedWorkspace}
                      selectedSession={selectedSession}
                      linkedWorktreeByWorkspaceId={linkedWorktreeByWorkspaceId}
                      wsMenu={wsMenu}
                      api={api}
                      onArchiveSession={onArchiveSession}
                      onSelectSession={onSelectSession}
                        onUnarchiveSession={onUnarchiveSession}
                        onDeleteSession={onDeleteSession}
                        onConfirm={onConfirm}
                      />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
        <div className="sidebar__footer">
          <button
            className={`sidebar__settings ${activeView === "settings" ? "sidebar__settings--active" : ""}`}
            type="button"
            onClick={() => onOpenSettings(selectedWorkspace?.rootWorkspaceId ?? selectedWorkspace?.id)}
          >
            <SettingsIcon />
            <span>{t("sidebar.settings")}</span>
          </button>
        </div>
        <div
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          className="sidebar__resize-handle"
          role="separator"
          onPointerDown={handleResizePointerDown}
        />
      </aside>
    </>
  );
}

/* ── Sortable workspace group wrapper ──────────────────── */

interface WorkspaceGroupProps {
  readonly group: ThreadGroup;
  readonly canDrag: boolean;
  readonly selectedWorkspace: WorkspaceRecord | undefined;
  readonly selectedSession: SessionRecord | undefined;
  readonly linkedWorktreeByWorkspaceId: Map<string, WorktreeRecord>;
  readonly wsMenu: WorkspaceMenuState;
  readonly api: PiDesktopApi;
  readonly onArchiveSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onSelectSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onUnarchiveSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onDeleteSession: (target: { workspaceId: string; sessionId: string }) => void;
  readonly onConfirm: SidebarProps["onConfirm"];
}

function SortableWorkspaceGroup(props: WorkspaceGroupProps) {
  const { group, wsMenu } = props;
  const isRenaming = wsMenu.workspaceRenameId === group.rootWorkspace.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.rootWorkspace.id,
    disabled: isRenaming,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : undefined,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`workspace-group ${isDragging ? "workspace-group--dragging" : ""}`}
    >
      <WorkspaceGroupContent
        {...props}
        dragHandleProps={props.canDrag && !isRenaming ? { attributes, listeners } : undefined}
      />
    </section>
  );
}

/* ── Workspace group content (used both inline and in overlay) ──── */

interface DragHandleProps {
  readonly attributes: DraggableAttributes;
  readonly listeners: DraggableSyntheticListeners;
}

function WorkspaceGroupContent(
  props: WorkspaceGroupProps & { readonly dragHandleProps?: DragHandleProps },
) {
  const {
    group: { rootWorkspace, threads, archivedThreads },
    selectedWorkspace,
    selectedSession,
    linkedWorktreeByWorkspaceId,
    wsMenu,
    api,
    onArchiveSession,
    onSelectSession,
    onUnarchiveSession,
    onDeleteSession,
    onConfirm,
    dragHandleProps,
  } = props;

  const workspaceActive =
    rootWorkspace.id === selectedWorkspace?.id ||
    rootWorkspace.id === selectedWorkspace?.rootWorkspaceId;
  const linkedWorktree = linkedWorktreeByWorkspaceId.get(rootWorkspace.id);
  const archivedSectionOpen = wsMenu.expandedArchivedByWorkspace[rootWorkspace.id] ?? false;
  const isCollapsed = wsMenu.collapsedWorkspaces[rootWorkspace.id] ?? false;

  return (
    <>
      <div className={`workspace-row ${workspaceActive ? "workspace-row--active" : ""}`}>
        <button
          className={`workspace-row__select ${dragHandleProps ? "workspace-row__select--draggable" : ""}`}
          onClick={() => wsMenu.toggleWorkspaceCollapsed(rootWorkspace.id)}
          type="button"
          {...(dragHandleProps ? { ...dragHandleProps.attributes, ...dragHandleProps.listeners } : {})}
        >
          <span className="workspace-row__icon" aria-hidden="true" data-collapsed={isCollapsed || undefined}>
            <span className="workspace-row__icon-folder"><FolderIcon /></span>
            <span className="workspace-row__icon-chevron"><ChevronDownIcon /></span>
          </span>
          <span className="workspace-row__name">{rootWorkspace.name}</span>
        </button>
        <span className="workspace-row__menu-wrap">
          <UIMenu
            trigger={<span>…</span>}
            triggerClassName="icon-button workspace-row__menu-button"
            aria-label={t("sidebar.workspace_actions", { name: rootWorkspace.name })}
            items={[
              { key: "open", label: t("common.open_folder"), onClick: () => { void api.openWorkspaceInFinder(rootWorkspace.id); } },
              ...(linkedWorktree
                ? [{ key: "remove-worktree", label: t("sidebar.remove_worktree"), danger: true, onClick: () => wsMenu.removeWorktree(linkedWorktree.rootWorkspaceId || rootWorkspace.id, linkedWorktree) }]
                : [{ key: "create-worktree", label: t("sidebar.create_permanent_worktree"), onClick: () => wsMenu.createWorktree(rootWorkspace.id) }]
              ),
              { key: "rename", label: t("sidebar.edit_name"), onClick: () => wsMenu.startRename(rootWorkspace) },
              { key: "remove", label: t("common.remove"), danger: true, onClick: () => wsMenu.removeWorkspace(rootWorkspace) },
            ]}
          />
        </span>
      </div>
      {wsMenu.workspaceRenameId === rootWorkspace.id ? (
        <form
          className="workspace-rename"
          ref={wsMenu.workspaceRenamePanelRef}
          onSubmit={(event) => {
            event.preventDefault();
            wsMenu.submitRename(rootWorkspace);
          }}
        >
          <input
            aria-label={`Rename ${rootWorkspace.name}`}
            className="workspace-rename__input"
            ref={wsMenu.workspaceRenameInputRef}
            value={wsMenu.workspaceRenameDraft}
            onChange={(event) => {
              wsMenu.setWorkspaceRenameDraft(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                wsMenu.cancelRename();
              }
            }}
          />
          <div className="workspace-rename__actions">
            <button className="workspace-rename__button" type="button" onClick={wsMenu.cancelRename}>
              {t("common.cancel")}
            </button>
            <button className="workspace-rename__button workspace-rename__button--primary" type="submit">
              {t("common.save")}
            </button>
          </div>
        </form>
      ) : null}
      {!isCollapsed ? (
        <>
          <div className="session-list">
            {threads.map((thread) => {
              const active = thread.workspaceId === selectedWorkspace?.id && thread.session.id === selectedSession?.id;
              return (
                <ThreadSessionRow
                  key={`${thread.workspaceId}:${thread.session.id}`}
                  active={active}
                  thread={thread}
                  onAction={() =>
                    onArchiveSession({
                      workspaceId: thread.workspaceId,
                      sessionId: thread.session.id,
                    })
                  }
                  onDelete={() =>
                    onConfirm({
                      title: t("sidebar.delete_confirm_title"),
                      body: t("sidebar.delete_confirm", { title: thread.session.title }),
                      confirmLabel: t("dialog.delete"),
                      cancelLabel: t("dialog.cancel"),
                      tone: "danger",
                      onConfirm: () => {
                        onDeleteSession({
                          workspaceId: thread.workspaceId,
                          sessionId: thread.session.id,
                        });
                      },
                    })
                  }
                  onSelect={() => onSelectSession({ workspaceId: thread.workspaceId, sessionId: thread.session.id })}
                />
              );
            })}
          </div>
          {archivedThreads.length > 0 ? (
            <div className="archived-thread-group">
              <button
                aria-expanded={archivedSectionOpen}
                className="archived-thread-group__toggle"
                type="button"
                onClick={() => wsMenu.toggleArchived(rootWorkspace.id, !archivedSectionOpen)}
              >
                <span
                  aria-hidden="true"
                  className={`archived-thread-group__chevron ${archivedSectionOpen ? "archived-thread-group__chevron--open" : ""}`}
                >
                  <ChevronDownIcon />
                </span>
                <span>{t("sidebar.archived")}</span>
                <span className="archived-thread-group__count">{archivedThreads.length}</span>
              </button>
              {archivedSectionOpen ? (
                <div className="session-list session-list--archived">
                  {archivedThreads.map((thread) => {
                    const active =
                      thread.workspaceId === selectedWorkspace?.id && thread.session.id === selectedSession?.id;
                    return (
                      <ThreadSessionRow
                        key={`${thread.workspaceId}:${thread.session.id}`}
                        active={active}
                        archived
                        thread={thread}
                        onAction={() =>
                          onUnarchiveSession({
                            workspaceId: thread.workspaceId,
                            sessionId: thread.session.id,
                          })
                        }
                        onDelete={() =>
                          onConfirm({
                            title: t("sidebar.delete_confirm_title"),
                            body: t("sidebar.delete_confirm", { title: thread.session.title }),
                            confirmLabel: t("dialog.delete"),
                            cancelLabel: t("dialog.cancel"),
                            tone: "danger",
                            onConfirm: () => {
                              onDeleteSession({
                                workspaceId: thread.workspaceId,
                                sessionId: thread.session.id,
                              });
                            },
                          })
                        }
                        onSelect={() => onSelectSession({ workspaceId: thread.workspaceId, sessionId: thread.session.id })}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/* ── Thread session row ────────────────────────────────── */

function sessionIndicatorVariant(thread: ThreadListEntry): "running" | "unseen" | "none" {
  if (thread.session.status === "running") {
    return "running";
  }
  if (thread.session.hasUnseenUpdate) {
    return "unseen";
  }
  return "none";
}

function ThreadSessionRow({
  active,
  archived = false,
  thread,
  onAction,
  onDelete,
  onSelect,
}: {
  readonly active: boolean;
  readonly archived?: boolean;
  readonly thread: ThreadListEntry;
  readonly onAction: () => void;
  readonly onDelete: () => void;
  readonly onSelect: () => void;
}) {
  const indicatorVariant = sessionIndicatorVariant(thread);
  const archiveLabel = `${archived ? t("sidebar.restore") : t("sidebar.archive")} ${thread.session.title}`;
  const deleteLabel = `${t("sidebar.delete")} ${thread.session.title}`;
  return (
    <div
      className={`session-row ${active ? "session-row--active" : ""}`}
      data-sidebar-indicator={indicatorVariant}
      data-session-id={thread.session.id}
    >
      <button className="session-row__select" onClick={onSelect} type="button">
        <span className="session-row__leading" aria-hidden="true">
          {indicatorVariant === "running" ? <span className="session-row__status session-row__status--running" /> : null}
          {indicatorVariant === "unseen" ? <span className="session-row__status session-row__status--unseen" /> : null}
        </span>
        <span className="session-row__body">
          <span className="session-row__title-line">
            <span className="session-row__title">{thread.session.title}</span>
          </span>
          {thread.session.preview ? <span className="session-row__preview">{thread.session.preview}</span> : null}
        </span>
      </button>
      <span className="session-row__trailing">
        {thread.environment.kind === "worktree" ? (
          <span className="session-row__workspace-icon" aria-hidden="true" title={t("sidebar.worktree")}>
            <WorktreeIcon />
          </span>
        ) : null}
        <span className="session-row__time">{formatRelativeTime(thread.session.updatedAt)}</span>
        <span className="session-row__actions">
          <button
            aria-label={archiveLabel}
            className="icon-button session-row__action"
            type="button"
            onClick={onAction}
          >
            {archived ? <RestoreIcon /> : <ArchiveIcon />}
          </button>
          <button
            aria-label={deleteLabel}
            className="icon-button session-row__action session-row__action--danger"
            type="button"
            onClick={onDelete}
          >
            <TrashIcon />
          </button>
        </span>
      </span>
    </div>
  );
}
