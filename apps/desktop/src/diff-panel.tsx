import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from "react";
import type { PiDesktopApi, WorkspaceFilePreview } from "./ipc";
import { InlineDiff } from "./diff-inline";
import { ChevronRightIcon, CopyIcon, DiffIcon, FileIcon, FolderIcon, RefreshIcon } from "./icons";
import { UICheckbox } from "./ui";
import { extensionToLanguage, highlightLine, type HighlightTokenChild } from "./syntax-highlight";
import { loadReviewed, pruneReviewed, saveReviewed } from "./reviewed-files-store";
import { t } from "./i18n";
import { getMaterialFileIconUrl, getMaterialFolderIconUrl } from "./material-file-icons";

type Translate = typeof t;

interface ChangedFile {
  readonly path: string;
  readonly status: "added" | "modified" | "deleted" | "untracked";
  readonly staged: boolean;
  readonly additions: number;
  readonly deletions: number;
  readonly binary: boolean;
}

export interface DiffPanelFileRequest {
  readonly path: string;
  readonly nonce: number;
}

export type WorkspacePanelTab = "changes" | "files";
type FileSortOption = "name" | "path" | "type";

interface DiffPanelProps {
  readonly workspaceId: string;
  readonly workspacePath: string;
  readonly sessionId: string;
  readonly api: PiDesktopApi;
  readonly sessionStatus: string | undefined;
  readonly fileRequest?: DiffPanelFileRequest | null;
  readonly activeTab: WorkspacePanelTab;
  readonly onSelectTab: (tab: WorkspacePanelTab) => void;
  readonly onWidthChange?: (width: number) => void;
}

export function DiffPanel({
  workspaceId,
  workspacePath,
  sessionId,
  api,
  sessionStatus,
  fileRequest,
  activeTab,
  onSelectTab,
  onWidthChange,
}: DiffPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [files, setFiles] = useState<readonly ChangedFile[]>([]);
  const [workspaceFiles, setWorkspaceFiles] = useState<readonly string[]>([]);
  const [workspaceFileQuery, setWorkspaceFileQuery] = useState("");
  const [workspaceFileSort, setWorkspaceFileSort] = useState<FileSortOption>("name");
  const [expandedFilePaths, setExpandedFilePaths] = useState<ReadonlySet<string>>(() => new Set([""]));
  const [selectedWorkspaceFile, setSelectedWorkspaceFile] = useState<string | null>(null);
  const [workspaceFilePreview, setWorkspaceFilePreview] = useState<WorkspaceFilePreview | null>(null);
  const [workspaceFilePreviewError, setWorkspaceFilePreviewError] = useState<string | null>(null);
  const [workspaceFilePreviewLoading, setWorkspaceFilePreviewLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diffTexts, setDiffTexts] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [loading, setLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [reviewed, setReviewed] = useState<ReadonlySet<string>>(() =>
    loadReviewed(workspaceId, sessionId),
  );

  useEffect(() => {
    setReviewed(loadReviewed(workspaceId, sessionId));
  }, [workspaceId, sessionId]);

  const refresh = useCallback(() => {
    setLoading(true);
    void api.getChangedFiles(workspaceId).then((result) => {
      setFiles(result);
      setSelectedFile((current) =>
        current && !result.some((f) => f.path === current) ? null : current,
      );
      setReviewed((current) => {
        const pruned = pruneReviewed(current, result.map((f) => f.path));
        if (pruned !== current) {
          saveReviewed(workspaceId, sessionId, pruned);
        }
        return pruned;
      });
      setLoading(false);
    });
  }, [api, workspaceId, sessionId]);

  const refreshWorkspaceFiles = useCallback(() => {
    setFilesLoading(true);
    void api
      .listWorkspaceFiles(workspaceId)
      .then(setWorkspaceFiles)
      .catch(() => setWorkspaceFiles([]))
      .finally(() => setFilesLoading(false));
  }, [api, workspaceId]);

  const prevStatusRef = useRef(sessionStatus);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = sessionStatus;
    if (prev === "running" && sessionStatus !== "running") {
      refresh();
    }
  }, [sessionStatus, refresh]);

  useEffect(() => {
    refresh();
  }, [workspaceId, sessionId]);

  useEffect(() => {
    refreshWorkspaceFiles();
  }, [refreshWorkspaceFiles]);

  useEffect(() => {
    if (!selectedWorkspaceFile) {
      setWorkspaceFilePreview(null);
      setWorkspaceFilePreviewError(null);
      setWorkspaceFilePreviewLoading(false);
      return;
    }

    let cancelled = false;
    setWorkspaceFilePreviewLoading(true);
    setWorkspaceFilePreviewError(null);
    void api
      .readWorkspaceFile(workspaceId, selectedWorkspaceFile)
      .then((preview) => {
        if (cancelled) {
          return;
        }
        setWorkspaceFilePreview(preview);
        setWorkspaceFilePreviewError(preview ? null : t("workspace_panel.file_unavailable"));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setWorkspaceFilePreview(null);
        setWorkspaceFilePreviewError(t("workspace_panel.failed_read_file"));
      })
      .finally(() => {
        if (!cancelled) {
          setWorkspaceFilePreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api, workspaceId, selectedWorkspaceFile]);

  useEffect(() => {
    if (!fileRequest) return;
    onSelectTab("changes");
    setSelectedFile(fileRequest.path);
  }, [fileRequest, onSelectTab]);

  useEffect(() => {
    setDiffTexts(new Map());
  }, [workspaceId]);

  const fileListRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selectedFile) return;
    const row = fileListRef.current?.querySelector<HTMLElement>(
      `[data-file-path="${CSS.escape(selectedFile)}"]`,
    );
    row?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [selectedFile, files]);

  const handleStage = (filePath: string) => {
    void api.stageFile(workspaceId, filePath).then(refresh);
  };

  const toggleReviewed = useCallback(
    (filePath: string) => {
      setReviewed((current) => {
        const next = new Set(current);
        if (next.has(filePath)) {
          next.delete(filePath);
        } else {
          next.add(filePath);
        }
        saveReviewed(workspaceId, sessionId, next);
        return next;
      });
    },
    [workspaceId, sessionId],
  );

  const reviewedCount = useMemo(
    () => files.reduce((acc, f) => acc + (reviewed.has(f.path) ? 1 : 0), 0),
    [files, reviewed],
  );
  const filteredWorkspaceFiles = useMemo(
    () => filterWorkspaceFiles(workspaceFiles, workspaceFileQuery),
    [workspaceFiles, workspaceFileQuery],
  );
  const fileTree = useMemo(
    () => buildFileTree(filteredWorkspaceFiles, workspaceFileSort),
    [filteredWorkspaceFiles, workspaceFileSort],
  );
  const visibleFileRows = useMemo(
    () => flattenFileTree(fileTree, expandedFilePaths),
    [expandedFilePaths, fileTree],
  );

  useEffect(() => {
    if (workspaceFileQuery.trim().length === 0) {
      return;
    }
    setExpandedFilePaths(expandAllDirectories(fileTree));
  }, [fileTree, workspaceFileQuery]);

  const handleToggleFileDirectory = useCallback((path: string) => {
    setExpandedFilePaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleCopyWorkspaceFilePath = useCallback(
    (filePath: string) => {
      void navigator.clipboard.writeText(resolveAbsoluteWorkspacePath(workspacePath, filePath));
    },
    [workspacePath],
  );

  const handleResizePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!onWidthChange || !panelRef.current) {
        return;
      }
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = panelRef.current.getBoundingClientRect().width;
      const pointerId = event.pointerId;
      event.currentTarget.setPointerCapture(pointerId);

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        onWidthChange(startWidth + startX - moveEvent.clientX);
      };
      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [onWidthChange],
  );

  return (
    <aside className="diff-panel" ref={panelRef}>
      <div
        className="diff-panel__resize-handle"
        role="separator"
        aria-label={t("workspace_panel.resize_panel")}
        aria-orientation="vertical"
        onPointerDown={handleResizePointerDown}
      />
      <div className="diff-panel__header">
        <div className="diff-panel__title-row">
          <span className="diff-panel__title-icon" aria-hidden="true">
            {activeTab === "changes" ? <DiffIcon /> : <FolderIcon />}
          </span>
          <h2 className="diff-panel__title">
            {activeTab === "changes" ? t("workspace_panel.title_changes") : t("workspace_panel.title_files")}
          </h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={activeTab === "changes" ? refresh : refreshWorkspaceFiles}
          aria-label={t("common.refresh")}
          disabled={activeTab === "changes" ? loading : filesLoading}
        >
          <RefreshIcon />
        </button>
      </div>

      <div className="diff-panel__tabs" role="tablist" aria-label={t("workspace_panel.aria_label")}>
        <button
          className={`diff-panel__tab ${activeTab === "changes" ? "diff-panel__tab--active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "changes"}
          onClick={() => onSelectTab("changes")}
        >
          <DiffIcon />
          <span>{t("workspace_panel.title_changes")}</span>
          {files.length > 0 ? <span className="diff-panel__tab-count">{files.length}</span> : null}
        </button>
        <button
          className={`diff-panel__tab ${activeTab === "files" ? "diff-panel__tab--active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "files"}
          onClick={() => onSelectTab("files")}
        >
          <FolderIcon />
          <span>{t("workspace_panel.title_files")}</span>
          {workspaceFiles.length > 0 ? <span className="diff-panel__tab-count">{workspaceFiles.length}</span> : null}
        </button>
      </div>

      {activeTab === "changes" ? (
        <ChangesPanel
          api={api}
          diffTexts={diffTexts}
          files={files}
          fileListRef={fileListRef}
          loading={loading}
          reviewed={reviewed}
          reviewedCount={reviewedCount}
          selectedFile={selectedFile}
          t={t}
          workspaceId={workspaceId}
          onDiffLoaded={(path, diff) => {
            setDiffTexts((current) => {
              const next = new Map(current);
              next.set(path, diff);
              return next;
            });
          }}
          onSelectFile={(path) => setSelectedFile(path === selectedFile ? null : path)}
          onStage={handleStage}
          onToggleReviewed={toggleReviewed}
        />
      ) : (
        <FilesPanel
          allFileCount={workspaceFiles.length}
          expandedPaths={expandedFilePaths}
          filteredFileCount={filteredWorkspaceFiles.length}
          loading={filesLoading}
          preview={workspaceFilePreview}
          previewError={workspaceFilePreviewError}
          previewLoading={workspaceFilePreviewLoading}
          query={workspaceFileQuery}
          rootPath={workspacePath}
          selectedFile={selectedWorkspaceFile}
          sort={workspaceFileSort}
          tree={fileTree}
          visibleRows={visibleFileRows}
          onCopyPath={handleCopyWorkspaceFilePath}
          onQueryChange={setWorkspaceFileQuery}
          onSelectFile={setSelectedWorkspaceFile}
          onSetSort={setWorkspaceFileSort}
          onToggleDirectory={handleToggleFileDirectory}
          t={t}
          workspaceId={workspaceId}
        />
      )}
    </aside>
  );
}

function ChangesPanel({
  api,
  diffTexts,
  files,
  fileListRef,
  loading,
  reviewed,
  reviewedCount,
  selectedFile,
  t,
  workspaceId,
  onDiffLoaded,
  onSelectFile,
  onStage,
  onToggleReviewed,
}: {
  readonly api: PiDesktopApi;
  readonly diffTexts: ReadonlyMap<string, string>;
  readonly files: readonly ChangedFile[];
  readonly fileListRef: RefObject<HTMLDivElement | null>;
  readonly loading: boolean;
  readonly reviewed: ReadonlySet<string>;
  readonly reviewedCount: number;
  readonly selectedFile: string | null;
  readonly t: Translate;
  readonly workspaceId: string;
  readonly onDiffLoaded: (path: string, diff: string) => void;
  readonly onSelectFile: (path: string) => void;
  readonly onStage: (path: string) => void;
  readonly onToggleReviewed: (path: string) => void;
}) {
  const [expandedPaths, setExpandedPaths] = useState<ReadonlySet<string>>(() => new Set());
  const allExpanded = files.length > 0 && expandedPaths.size === files.length;

  useEffect(() => {
    setExpandedPaths((current) => {
      const validPaths = new Set(files.map((file) => file.path));
      const next = new Set([...current].filter((path) => validPaths.has(path)));
      return next.size === current.size ? current : next;
    });
  }, [files]);

  useEffect(() => {
    const pathsToLoad = new Set(expandedPaths);
    if (selectedFile) {
      pathsToLoad.add(selectedFile);
    }
    for (const path of pathsToLoad) {
      if (diffTexts.has(path)) {
        continue;
      }
      const file = files.find((candidate) => candidate.path === path);
      if (file?.binary) {
        continue;
      }
      void api.getFileDiff(workspaceId, path).then((diff) => onDiffLoaded(path, diff));
    }
  }, [api, diffTexts, expandedPaths, files, onDiffLoaded, selectedFile, workspaceId]);

  if (files.length === 0) {
    return (
      <div className="diff-panel__empty">
        {loading ? t("workspace_panel.loading_changes") : t("workspace_panel.no_changes")}
      </div>
    );
  }

  return (
    <>
      <div className="diff-panel__statusbar">
        <button className="diff-panel__mode" type="button">
          <span>{t("workspace_panel.uncommitted")}</span>
        </button>
        <span className="diff-panel__counter" data-testid="diff-panel-counter">
          {t("workspace_panel.reviewed_count", { reviewed: reviewedCount, total: files.length })}
        </span>
        <button
          className="diff-panel__toolbar-button"
          type="button"
          onClick={() => {
            setExpandedPaths(allExpanded ? new Set() : new Set(files.map((file) => file.path)));
          }}
        >
          {allExpanded ? t("workspace_panel.collapse_all") : t("workspace_panel.expand_all")}
        </button>
      </div>
      <div className="diff-panel__file-list" ref={fileListRef}>
        {files.map((file) => {
          const isReviewed = reviewed.has(file.path);
          const isSelected = expandedPaths.has(file.path) || selectedFile === file.path;
          const diffText = diffTexts.get(file.path) ?? "";
          const fileName = getBaseName(file.path);
          const directory = getDirectoryName(file.path);
          const className = [
            "diff-panel__file",
            isSelected ? "diff-panel__file--selected" : "",
            isReviewed ? "diff-panel__file--reviewed" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div className={className} key={file.path} data-file-path={file.path}>
              <button
                className="diff-panel__file-name"
                type="button"
                onClick={() => {
                  setExpandedPaths((current) => {
                    const next = new Set(current);
                    if (next.has(file.path)) {
                      next.delete(file.path);
                    } else {
                      next.add(file.path);
                    }
                    return next;
                  });
                  onSelectFile(file.path);
                }}
                aria-expanded={isSelected}
              >
                <span className="diff-panel__file-main">
                  <span className={`diff-panel__file-chevron ${isSelected ? "diff-panel__file-chevron--expanded" : ""}`} aria-hidden="true">
                    <ChevronRightIcon />
                  </span>
                  <span className={`diff-panel__status-dot diff-panel__status-dot--${file.status}`} />
                  <span className="diff-panel__file-title">{fileName}</span>
                  {directory ? <span className="diff-panel__file-dir"> {directory}</span> : null}
                  {file.status === "added" || file.status === "untracked" ? (
                    <span className="diff-panel__badge diff-panel__badge--new">{t("workspace_panel.new_badge")}</span>
                  ) : null}
                  {file.status === "deleted" ? (
                    <span className="diff-panel__badge diff-panel__badge--deleted">{t("workspace_panel.deleted_badge")}</span>
                  ) : null}
                </span>
                <DiffStat additions={file.additions} deletions={file.deletions} />
              </button>
              <div className="diff-panel__file-actions">
                <UICheckbox
                  aria-label={t("workspace_panel.mark_reviewed", { path: file.path })}
                  checked={isReviewed}
                  onChange={() => onToggleReviewed(file.path)}
                />
                <button
                  className="diff-panel__stage-btn"
                  type="button"
                  onClick={() => onStage(file.path)}
                  disabled={file.staged}
                >
                  {file.staged ? t("workspace_panel.staged") : t("workspace_panel.stage")}
                </button>
              </div>
              {isSelected ? (
                <div className="diff-panel__file-body">
                  {file.binary ? (
                    <div className="diff-panel__preview-note">{t("workspace_panel.binary_change_unavailable")}</div>
                  ) : diffText ? (
                    <InlineDiff diff={diffText} language={extensionToLanguage(file.path)} />
                  ) : (
                    <div className="diff-panel__preview-note">{t("workspace_panel.loading_preview")}</div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}

interface FileTreeNode {
  readonly name: string;
  readonly path: string;
  readonly kind: "directory" | "file";
  readonly children: FileTreeNode[];
}

interface FileTreeRowModel {
  readonly node: FileTreeNode;
  readonly depth: number;
}

function FilesPanel({
  allFileCount,
  expandedPaths,
  filteredFileCount,
  loading,
  preview,
  previewError,
  previewLoading,
  query,
  rootPath,
  selectedFile,
  sort,
  tree,
  visibleRows,
  onCopyPath,
  onQueryChange,
  onSelectFile,
  onSetSort,
  onToggleDirectory,
  t,
  workspaceId,
}: {
  readonly allFileCount: number;
  readonly expandedPaths: ReadonlySet<string>;
  readonly filteredFileCount: number;
  readonly loading: boolean;
  readonly preview: WorkspaceFilePreview | null;
  readonly previewError: string | null;
  readonly previewLoading: boolean;
  readonly query: string;
  readonly rootPath: string;
  readonly selectedFile: string | null;
  readonly sort: FileSortOption;
  readonly tree: readonly FileTreeNode[];
  readonly visibleRows: readonly FileTreeRowModel[];
  readonly onCopyPath: (path: string) => void;
  readonly onQueryChange: (value: string) => void;
  readonly onSelectFile: (path: string) => void;
  readonly onSetSort: (sort: FileSortOption) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly t: Translate;
  readonly workspaceId: string;
}) {
  return (
    <div className="diff-panel__files">
      <div className="diff-panel__files-root">
        <FolderIcon />
        <span>{rootPath}</span>
      </div>
      <div className="diff-panel__files-toolbar">
        <input
          className="diff-panel__files-search"
          placeholder={t("workspace_panel.search_files")}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <button className="diff-panel__sort" type="button" onClick={() => onSetSort(nextFileSort(sort))}>
          {fileSortLabel(sort, t)}
        </button>
      </div>
      <div className="diff-panel__files-meta">
        <span>
          {filteredFileCount === allFileCount
            ? t("workspace_panel.files_count", { count: allFileCount })
            : t("workspace_panel.files_count_filtered", { filtered: filteredFileCount, total: allFileCount })}
        </span>
      </div>
      <div className="diff-panel__files-body">
        {tree.length === 0 && (loading || allFileCount > 0) ? (
          <div className="diff-panel__empty">
            {loading ? t("workspace_panel.loading_files") : t("workspace_panel.no_files")}
          </div>
        ) : (
          <div className="diff-panel__tree" role="tree">
            {visibleRows.map((row) => (
              <FileTreeRow
                expanded={expandedPaths.has(row.node.path)}
                key={row.node.path}
                node={row.node}
                depth={row.depth}
                selected={selectedFile === row.node.path}
                onCopyPath={onCopyPath}
                onSelectFile={onSelectFile}
                onToggleDirectory={onToggleDirectory}
                t={t}
              />
            ))}
          </div>
        )}
        <FilePreview
          preview={preview}
          previewError={previewError}
          previewLoading={previewLoading}
          selectedFile={selectedFile}
          t={t}
          workspaceId={workspaceId}
        />
      </div>
    </div>
  );
}

function FilePreview({
  preview,
  previewError,
  previewLoading,
  selectedFile,
  t,
  workspaceId,
}: {
  readonly preview: WorkspaceFilePreview | null;
  readonly previewError: string | null;
  readonly previewLoading: boolean;
  readonly selectedFile: string | null;
  readonly t: Translate;
  readonly workspaceId: string;
}) {
  if (!selectedFile) {
    return (
      <div className="diff-panel__preview diff-panel__preview--empty">
        <FileIcon />
        <span>{t("workspace_panel.select_file_preview")}</span>
      </div>
    );
  }

  if (previewLoading) {
    return <div className="diff-panel__preview diff-panel__preview--empty">{t("workspace_panel.loading_preview")}</div>;
  }

  if (previewError) {
    return <div className="diff-panel__preview diff-panel__preview--empty">{previewError}</div>;
  }

  if (!preview) {
    return <div className="diff-panel__preview diff-panel__preview--empty">{t("workspace_panel.no_preview")}</div>;
  }

  const mediaUrl = preview.media
    ? buildWorkspaceMediaUrl(workspaceId, preview.path)
    : null;

  return (
    <div className="diff-panel__preview">
      <div className="diff-panel__preview-header">
        <span>{preview.path}</span>
        <span>{formatFileSize(preview.size)}</span>
      </div>
      {preview.media && mediaUrl ? (
        <MediaPreview kind={preview.media.kind} src={mediaUrl} t={t} />
      ) : preview.binary ? (
        <div className="diff-panel__preview-note">{t("workspace_panel.binary_preview_unavailable")}</div>
      ) : (
        <CodePreview
          content={preview.content}
          filePath={preview.path}
          truncated={preview.truncated}
          t={t}
        />
      )}
    </div>
  );
}

function CodePreview({
  content,
  filePath,
  truncated,
  t,
}: {
  readonly content: string;
  readonly filePath: string;
  readonly truncated: boolean;
  readonly t: Translate;
}) {
  const language = extensionToLanguage(filePath);
  const lines = content.split("\n");
  const canHighlight = Boolean(language);

  return (
    <pre className="diff-panel__preview-code" data-language={language}>
      {lines.map((line, index) => (
        <span className="diff-panel__preview-code-line" key={index}>
          {canHighlight ? renderHighlightTokens(highlightLine(line, language!)) : line}
          {index < lines.length - 1 ? "\n" : null}
        </span>
      ))}
      {truncated ? `\n\n... ${t("workspace_panel.preview_truncated")}` : ""}
    </pre>
  );
}

function renderHighlightTokens(tokens: readonly HighlightTokenChild[]): ReactNode[] {
  return tokens.map((token, index) =>
    typeof token === "string" ? (
      token
    ) : (
      <span className={token.className} key={index}>
        {renderHighlightTokens(token.children)}
      </span>
    ),
  );
}

function MediaPreview({
  kind,
  src,
  t,
}: {
  readonly kind: "image" | "audio" | "video";
  readonly src: string;
  readonly t: Translate;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className="diff-panel__preview diff-panel__preview--empty">
        {t("workspace_panel.media_preview_failed")}
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="diff-panel__media-preview diff-panel__media-preview--image">
        <img
          src={src}
          alt={t("workspace_panel.media_preview_alt")}
          draggable={false}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  if (kind === "audio") {
    return (
      <div className="diff-panel__media-preview diff-panel__media-preview--audio">
        <audio controls src={src} onError={() => setFailed(true)}>
          {t("workspace_panel.media_preview_unsupported")}
        </audio>
      </div>
    );
  }
  return (
    <div className="diff-panel__media-preview diff-panel__media-preview--video">
      <video controls src={src} onError={() => setFailed(true)}>
        {t("workspace_panel.media_preview_unsupported")}
      </video>
    </div>
  );
}

function FileTreeRow({
  depth,
  expanded,
  node,
  selected,
  onCopyPath,
  onSelectFile,
  onToggleDirectory,
  t,
}: {
  readonly depth: number;
  readonly expanded: boolean;
  readonly node: FileTreeNode;
  readonly selected: boolean;
  readonly onCopyPath: (path: string) => void;
  readonly onSelectFile: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly t: Translate;
}) {
  const isDirectory = node.kind === "directory";
  const iconUrl = isDirectory ? getMaterialFolderIconUrl(expanded) : getMaterialFileIconUrl(node.name);
  const className = [
    "diff-panel__tree-row",
    selected ? "diff-panel__tree-row--selected" : "",
    isDirectory ? "diff-panel__tree-row--directory" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handlePress = () => {
    if (isDirectory) {
      onToggleDirectory(node.path);
      return;
    }
    onSelectFile(node.path);
  };

  return (
    <div
      className={className}
      role="treeitem"
      aria-expanded={isDirectory ? expanded : undefined}
      aria-selected={!isDirectory ? selected : undefined}
      style={{ "--tree-depth": depth } as CSSProperties}
    >
      <button className="diff-panel__tree-main" type="button" onClick={handlePress}>
        <span className={`diff-panel__tree-chevron ${expanded ? "diff-panel__tree-chevron--expanded" : ""}`} aria-hidden="true">
          {isDirectory ? <ChevronRightIcon /> : null}
        </span>
        <span className="diff-panel__tree-icon" aria-hidden="true">
          <MaterialFileIcon fallback={isDirectory ? <FolderIcon /> : <FileIcon />} src={iconUrl} />
        </span>
        <span className="diff-panel__tree-name">{node.name}</span>
      </button>
      {!isDirectory ? (
        <button className="diff-panel__tree-action" type="button" aria-label={t("workspace_panel.copy_file_path", { path: node.path })} onClick={() => onCopyPath(node.path)}>
          <CopyIcon />
        </button>
      ) : null}
    </div>
  );
}

function MaterialFileIcon({ fallback, src }: { readonly fallback: ReactNode; readonly src: string | undefined }) {
  if (!src) {
    return fallback;
  }
  return <img className="diff-panel__material-icon" src={src} alt="" draggable={false} />;
}

function DiffStat({ additions, deletions }: { readonly additions: number; readonly deletions: number }) {
  return (
    <span className="diff-panel__diff-stat" aria-hidden={additions === 0 && deletions === 0}>
      {additions > 0 ? <span className="diff-panel__diff-stat-additions">+{additions}</span> : null}
      {deletions > 0 ? <span className="diff-panel__diff-stat-deletions">-{deletions}</span> : null}
    </span>
  );
}

function getBaseName(filePath: string): string {
  const index = filePath.lastIndexOf("/");
  return index >= 0 ? filePath.slice(index + 1) : filePath;
}

function getDirectoryName(filePath: string): string {
  const index = filePath.lastIndexOf("/");
  return index >= 0 ? filePath.slice(0, index) : "";
}

function filterWorkspaceFiles(paths: readonly string[], query: string): readonly string[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return paths;
  }
  return paths.filter((path) => path.toLowerCase().includes(normalizedQuery));
}

function nextFileSort(sort: FileSortOption): FileSortOption {
  if (sort === "name") return "path";
  if (sort === "path") return "type";
  return "name";
}

function fileSortLabel(sort: FileSortOption, translate: Translate): string {
  if (sort === "path") return translate("workspace_panel.sort_path");
  if (sort === "type") return translate("workspace_panel.sort_type");
  return translate("workspace_panel.sort_name");
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveAbsoluteWorkspacePath(workspacePath: string, filePath: string): string {
  const trimmedRoot = workspacePath.replace(/[\\/]+$/, "");
  return `${trimmedRoot}/${filePath}`;
}

function buildWorkspaceMediaUrl(workspaceId: string, filePath: string): string {
  const params = new URLSearchParams({ workspaceId, path: filePath });
  return `pi-gui-media://preview/?${params.toString()}`;
}

function flattenFileTree(
  nodes: readonly FileTreeNode[],
  expandedPaths: ReadonlySet<string>,
  depth = 0,
): readonly FileTreeRowModel[] {
  const rows: FileTreeRowModel[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    if (node.kind === "directory" && expandedPaths.has(node.path)) {
      rows.push(...flattenFileTree(node.children, expandedPaths, depth + 1));
    }
  }
  return rows;
}

function expandAllDirectories(nodes: readonly FileTreeNode[]): ReadonlySet<string> {
  const expanded = new Set<string>([""]);
  const visit = (node: FileTreeNode) => {
    if (node.kind !== "directory") {
      return;
    }
    expanded.add(node.path);
    node.children.forEach(visit);
  };
  nodes.forEach(visit);
  return expanded;
}

function compareFileTreeNodes(sort: FileSortOption, left: FileTreeNode, right: FileTreeNode): number {
  if (left.kind !== right.kind) {
    return left.kind === "directory" ? -1 : 1;
  }
  if (sort === "path") {
    return left.path.localeCompare(right.path);
  }
  if (sort === "type") {
    const extensionCompare = getFileExtension(left.name).localeCompare(getFileExtension(right.name));
    if (extensionCompare !== 0) {
      return extensionCompare;
    }
  }
  return left.name.localeCompare(right.name);
}

function getFileExtension(name: string): string {
  const index = name.lastIndexOf(".");
  if (index <= 0 || index === name.length - 1) {
    return "";
  }
  return name.slice(index + 1).toLowerCase();
}

function buildFileTree(paths: readonly string[], sort: FileSortOption): readonly FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const directories = new Map<string, FileTreeNode>();

  for (const path of paths) {
    const parts = path.split("/").filter(Boolean);
    let siblings = root;
    let currentPath = "";
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      if (!isFile) {
        let directory = directories.get(currentPath);
        if (!directory) {
          directory = { name: part, path: currentPath, kind: "directory", children: [] };
          directories.set(currentPath, directory);
          siblings.push(directory);
        }
        siblings = directory.children;
        return;
      }

      siblings.push({ name: part, path: currentPath, kind: "file", children: [] });
    });
  }

  return sortFileTree(root, sort);
}

function sortFileTree(nodes: readonly FileTreeNode[], sort: FileSortOption): readonly FileTreeNode[] {
  return [...nodes]
    .sort((left, right) => compareFileTreeNodes(sort, left, right))
    .map((node) => ({ ...node, children: sortFileTree(node.children, sort) as FileTreeNode[] }));
}
