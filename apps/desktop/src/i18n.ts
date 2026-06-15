export type AppLocale = "en-US" | "zh-CN";

type TranslationKey =
  | "common.cancel"
  | "common.save"
  | "common.refresh"
  | "common.path"
  | "common.source"
  | "common.remove"
  | "common.enabled"
  | "common.disabled"
  | "common.open_folder"
  | "common.back_to_app"
  | "common.working"
  | "common.working_seconds"
  | "common.working_minutes"
  | "common.loading_sessions"
  | "common.loading_sessions_description"
  | "common.select_workspace_first"
  | "common.workspace"
  | "common.open_folder_to_start"
  | "common.open_folder_to_start_description"
  | "common.open_folder_to_start_description_multi"
  | "common.create_thread_description"
  | "account.login_title"
  | "account.login_description"
  | "account.login_button"
  | "account.login_pending"
  | "account.required_note"
  | "composer.placeholder"
  | "composer.hint_running"
  | "composer.hint_idle"
  | "composer.steer"
  | "composer.edit"
  | "composer.delete"
  | "composer.editing_queued"
  | "composer.attach_files"
  | "composer.stop_run"
  | "composer.send_message"
  | "host_actions.title"
  | "host_actions.model"
  | "host_actions.model_description"
  | "host_actions.reasoning"
  | "host_actions.reasoning_description"
  | "host_actions.skill"
  | "host_actions.skill_description"
  | "host_actions.tree"
  | "host_actions.tree_description"
  | "host_actions.status"
  | "host_actions.status_description"
  | "host_actions.login"
  | "host_actions.login_description"
  | "host_actions.logout"
  | "host_actions.logout_description"
  | "host_actions.settings"
  | "host_actions.settings_description"
  | "host_actions.enabled_models"
  | "host_actions.enabled_models_description"
  | "host_actions.session"
  | "host_actions.session_description"
  | "host_actions.name"
  | "host_actions.name_description"
  | "host_actions.name_template_placeholder"
  | "host_actions.name_incomplete"
  | "host_actions.name_success"
  | "host_actions.compact"
  | "host_actions.compact_description"
  | "host_actions.reload"
  | "host_actions.reload_description"
  | "tree.eyebrow"
  | "tree.browse_branches"
  | "tree.switch_branch"
  | "tree.loading"
  | "tree.search_placeholder"
  | "tree.search_hint"
  | "tree.default_hint"
  | "tree.select_hint"
  | "tree.no_matches"
  | "tree.footer_hint"
  | "tree.already_here"
  | "tree.continue"
  | "tree.back"
  | "tree.summary_copy"
  | "tree.no_summary"
  | "tree.no_summary_description"
  | "tree.summarize"
  | "tree.summarize_description"
  | "tree.summarize_custom"
  | "tree.summarize_custom_description"
  | "tree.custom_placeholder"
  | "tree.switching"
  | "tree.switch_button"
  | "tree.hint_switching"
  | "tree.hint_no_summary"
  | "tree.hint_summary"
  | "timeline.new_activity_below"
  | "workspace_panel.title_changes"
  | "workspace_panel.title_files"
  | "workspace_panel.aria_label"
  | "workspace_panel.loading_changes"
  | "workspace_panel.no_changes"
  | "workspace_panel.uncommitted"
  | "workspace_panel.reviewed_count"
  | "workspace_panel.mark_reviewed"
  | "workspace_panel.new_badge"
  | "workspace_panel.deleted_badge"
  | "workspace_panel.expand_all"
  | "workspace_panel.collapse_all"
  | "workspace_panel.staged"
  | "workspace_panel.stage"
  | "workspace_panel.search_files"
  | "workspace_panel.files_count"
  | "workspace_panel.files_count_filtered"
  | "workspace_panel.loading_files"
  | "workspace_panel.no_files"
  | "workspace_panel.file_unavailable"
  | "workspace_panel.failed_read_file"
  | "workspace_panel.select_file_preview"
  | "workspace_panel.loading_preview"
  | "workspace_panel.no_preview"
  | "workspace_panel.binary_change_unavailable"
  | "workspace_panel.binary_preview_unavailable"
  | "workspace_panel.media_preview_alt"
  | "workspace_panel.media_preview_failed"
  | "workspace_panel.media_preview_unsupported"
  | "workspace_panel.preview_truncated"
  | "workspace_panel.copy_file_path"
  | "workspace_panel.sort_name"
  | "workspace_panel.sort_path"
  | "workspace_panel.sort_type"
  | "workspace_panel.resize_panel"
  | "skills.create_new_skill_prompt"
  | "skills.create_new_skill_description"
  | "topbar.open_a_folder_to_begin"
  | "topbar.local"
  | "topbar.unavailable"
  | "topbar.new_thread"
  | "topbar.toggle_terminal"
  | "topbar.toggle_changes"
  | "topbar.toggle_files"
  | "topbar.add_folder"
  | "topbar.toggle_sidebar"
  | "sidebar.new_thread"
  | "sidebar.threads"
  | "sidebar.sessions"
  | "sidebar.skills"
  | "sidebar.extensions"
  | "sidebar.settings"
  | "sidebar.no_folders_yet"
  | "sidebar.no_folders_description"
  | "sidebar.open_first_folder"
  | "sidebar.workspace_actions"
  | "sidebar.remove_worktree"
  | "sidebar.create_permanent_worktree"
  | "sidebar.edit_name"
  | "sidebar.remove_workspace"
  | "sidebar.archived"
  | "sidebar.worktree"
  | "sidebar.archive"
  | "sidebar.restore"
  | "sidebar.delete"
  | "sidebar.delete_confirm_title"
  | "sidebar.delete_confirm"
  | "dialog.cancel"
  | "dialog.delete"
  | "dialog.ok"
  | "workspace.remove_confirm_title"
  | "workspace.remove_confirm"
  | "worktree.remove_confirm_title"
  | "worktree.remove_confirm"
  | "sessions.title"
  | "sessions.page_description"
  | "sessions.search"
  | "sessions.empty"
  | "sessions.empty_state"
  | "sessions.archived_badge"
  | "sessions.running_badge"
  | "new_thread.title"
  | "new_thread.open_folder_to_begin"
  | "new_thread.empty_description"
  | "new_thread.lets_build"
  | "new_thread.workspace"
  | "new_thread.prompt_label"
  | "new_thread.prompt_placeholder"
  | "new_thread.local"
  | "new_thread.worktree"
  | "new_thread.attach_files"
  | "new_thread.start_thread"
  | "skills.title"
  | "skills.select_workspace"
  | "skills.empty_workspace_description"
  | "skills.page_description"
  | "skills.new_skill"
  | "skills.search"
  | "skills.catalog_title"
  | "skills.catalog_description"
  | "skills.catalog_search"
  | "skills.catalog_empty"
  | "skills.catalog_loading"
  | "skills.catalog_error"
  | "skills.catalog_refresh"
  | "skills.catalog_source"
  | "skills.catalog_sort"
  | "skills.catalog_sort_updated"
  | "skills.catalog_sort_newest"
  | "skills.catalog_sort_downloads"
  | "skills.catalog_sort_stars"
  | "skills.catalog_previous"
  | "skills.catalog_next"
  | "skills.catalog_page"
  | "skills.install"
  | "skills.update"
  | "skills.installed"
  | "skills.installing"
  | "skills.latest_version"
  | "skills.local_version"
  | "skills.update_available"
  | "skills.downloads"
  | "skills.stars"
  | "skills.empty"
  | "skills.empty_state_refresh"
  | "skills.empty_state_none_selected"
  | "skills.slash_only"
  | "skills.open_folder"
  | "skills.disable"
  | "skills.enable"
  | "skills.try"
  | "skills.delete"
  | "skills.delete_confirm_title"
  | "skills.delete_confirm"
  | "skills.create_new_skill_prompt"
  | "skills.create_new_skill_description"
  | "extensions.title"
  | "extensions.select_workspace"
  | "extensions.empty_workspace_description"
  | "extensions.page_description"
  | "extensions.search"
  | "extensions.empty"
  | "extensions.empty_state_refresh"
  | "extensions.empty_state_inspect"
  | "extensions.commands"
  | "extensions.tools"
  | "extensions.flags"
  | "extensions.shortcuts"
  | "extensions.scope"
  | "extensions.origin"
  | "extensions.base_dir"
  | "extensions.issues"
  | "extensions.no_commands"
  | "extensions.no_tools"
  | "extensions.no_flags"
  | "extensions.no_shortcuts"
  | "extensions.diagnostics"
  | "extensions.no_diagnostics"
  | "extensions.command_compatibility"
  | "extensions.command_compatibility_description"
  | "extensions.gui_compatible"
  | "extensions.terminal_only"
  | "extensions.unknown"
  | "settings.title"
  | "settings.select_workspace"
  | "settings.select_workspace_description"
  | "settings.profile"
  | "settings.profile_description"
  | "settings.profile.account"
  | "settings.profile.account_description"
  | "settings.profile.unknown_user"
  | "settings.profile.user_id"
  | "settings.profile.username"
  | "settings.profile.email"
  | "settings.profile.phone"
  | "settings.profile.logout"
  | "settings.profile.logout_description"
  | "settings.appearance"
  | "settings.appearance_description"
  | "settings.language"
  | "settings.language.en_us"
  | "settings.language.en_us_description"
  | "settings.language.zh_cn"
  | "settings.language.zh_cn_description"
  | "settings.providers"
  | "settings.providers_description"
  | "settings.models"
  | "settings.models_description"
  | "settings.notifications"
  | "settings.notifications_description"
  | "settings.general"
  | "settings.general_description"
  | "settings.theme"
  | "settings.theme.system"
  | "settings.theme.system_description"
  | "settings.theme.light"
  | "settings.theme.light_description"
  | "settings.theme.dark"
  | "settings.theme.dark_description"
  | "settings.connected_providers"
  | "settings.none"
  | "settings.discovered_skills"
  | "settings.updates"
  | "settings.updates_description"
  | "settings.check_for_updates"
  | "settings.model_scope"
  | "settings.model_scope_description"
  | "settings.model_scope.app_global"
  | "settings.model_scope.per_repo"
  | "settings.skill_slash_commands"
  | "settings.skill_slash_commands_description"
  | "settings.integrated_terminal_shell"
  | "settings.integrated_terminal_shell_description"
  | "settings.shortcuts"
  | "settings.shortcuts.new_thread"
  | "settings.shortcuts.open_settings"
  | "settings.shortcuts.toggle_terminal"
  | "settings.shortcuts.new_terminal_tab"
  | "settings.shortcuts.send_message"
  | "settings.shortcuts.new_line"
  | "settings.notifications.system"
  | "settings.notifications.system_description"
  | "settings.notifications.access"
  | "settings.notifications.turn_on"
  | "settings.notifications.ask_now"
  | "settings.notifications.denied_recovery"
  | "settings.notifications.ask_macos"
  | "settings.notifications.open_system_settings"
  | "settings.notifications.in_app_alerts"
  | "settings.notifications.in_app_alerts_description"
  | "settings.notifications.background_completion"
  | "settings.notifications.background_completion_description"
  | "settings.notifications.background_failures"
  | "settings.notifications.background_failures_description"
  | "settings.notifications.attention_needed"
  | "settings.notifications.attention_needed_description"
  | "settings.notifications.status.enabled"
  | "settings.notifications.status.turned_off"
  | "settings.notifications.status.not_enabled"
  | "settings.notifications.status.unavailable"
  | "settings.notifications.status.checking"
  | "settings.notifications.desc.granted"
  | "settings.notifications.desc.denied"
  | "settings.notifications.desc.default"
  | "settings.notifications.desc.unsupported"
  | "settings.notifications.desc.unknown"
  | "settings.providers.connected"
  | "settings.providers.connected_description"
  | "settings.providers.none_connected"
  | "settings.providers.custom"
  | "settings.providers.custom_description"
  | "settings.providers.definitions"
  | "settings.providers.definitions_description"
  | "settings.providers.new_custom"
  | "settings.providers.edit"
  | "settings.providers.delete"
  | "settings.providers.none_custom"
  | "settings.providers.edit_custom"
  | "settings.providers.add_custom"
  | "settings.providers.custom_id"
  | "settings.providers.custom_id_placeholder"
  | "settings.providers.custom_display_name"
  | "settings.providers.custom_display_name_placeholder"
  | "settings.providers.custom_api"
  | "settings.providers.custom_base_url"
  | "settings.providers.custom_base_url_placeholder"
  | "settings.providers.custom_api_key"
  | "settings.providers.custom_api_key_placeholder"
  | "settings.providers.custom_model_ids"
  | "settings.providers.custom_model_ids_placeholder"
  | "settings.providers.cancel_edit"
  | "settings.providers.save_provider"
  | "settings.providers.add_provider"
  | "settings.providers.sign_in"
  | "settings.providers.sign_in_description"
  | "settings.providers.all"
  | "settings.providers.all_description"
  | "settings.providers.browse_all"
  | "settings.providers.search"
  | "settings.providers.manage_api_key"
  | "settings.providers.set_api_key"
  | "settings.providers.replace_api_key"
  | "settings.providers.save_local_api_key"
  | "settings.providers.provider_api_url"
  | "settings.providers.provider_api_url_placeholder"
  | "settings.providers.provider_api_key"
  | "settings.providers.provider_api_key_placeholder"
  | "settings.providers.remove_saved_key"
  | "settings.providers.set"
  | "settings.provider_status.oauth_connected"
  | "settings.provider_status.api_key_connected"
  | "settings.provider_status.env_connected"
  | "settings.provider_status.external_connected"
  | "settings.provider_status.configure_externally"
  | "settings.provider_status.oauth"
  | "settings.provider_status.api_key"
  | "settings.provider_status.built_in"
  | "settings.provider_action.logout"
  | "settings.provider_action.login"
  | "settings.provider_action.manage"
  | "settings.provider_action.set_api_key"
  | "settings.provider_action.managed_externally"
  | "settings.models.default_model"
  | "settings.models.default_model_description"
  | "settings.models.choose_model"
  | "settings.models.reasoning"
  | "settings.models.reasoning_description"
  | "settings.models.enabled"
  | "settings.models.enabled_description"
  | "settings.models.none_connected"
  | "settings.models.none_enabled"
  | "settings.models.all_enabled"
  | "settings.models.default_not_enabled"
  | "settings.models.edit_enabled"
  | "settings.models.search_enabled"
  | "settings.models.must_keep_one"
  | "settings.models.all"
  | "settings.models.all_description"
  | "settings.models.browse_all"
  | "settings.models.search"
  | "settings.models.reasoning_badge"
  | "settings.models.images_badge"
  | "settings.models.not_logged_in_badge"
  | "settings.models.enable";

type TranslationTable = Record<TranslationKey, string>;

const EN_US: TranslationTable = {
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.refresh": "Refresh",
  "common.path": "Path",
  "common.source": "Source",
  "common.remove": "Remove",
  "common.enabled": "Enabled",
  "common.disabled": "Disabled",
  "common.open_folder": "Open folder",
  "common.back_to_app": "Back to app",
  "common.working": "Working…",
  "common.working_seconds": "Working for {seconds}s",
  "common.working_minutes": "Working for {minutes}m {remaining}s",
  "common.loading_sessions": "Loading sessions",
  "common.loading_sessions_description": "The desktop shell is restoring folder and thread state from the main process.",
  "common.select_workspace_first": "Select a workspace first.",
  "common.workspace": "Workspace",
  "common.open_folder_to_start": "Open a folder to start",
  "common.open_folder_to_start_description": "Add a project folder before creating a new thread.",
  "common.open_folder_to_start_description_multi": "Add project folders, group sessions under them, and jump between threads from the sidebar.",
  "common.create_thread_description": "Create a thread for this folder, then jump between sessions from the sidebar.",
  "account.login_title": "Sign in with DingTalk",
  "account.login_description": "飞度小派 uses your Feidu account to load available models and route requests through the internal AI service.",
  "account.login_button": "Sign in with DingTalk",
  "account.login_pending": "Waiting for DingTalk login...",
  "account.required_note": "Sign-in is required before using the desktop agent.",
  "composer.placeholder": "Ask pi to inspect the repo, run a fix, or continue the current thread...",
  "composer.hint_running": "{runningLabel} · Enter to queue · {modifierKey}+Enter to steer",
  "composer.hint_idle": "Enter to send · Shift+Enter for newline",
  "composer.steer": "Steer",
  "composer.edit": "Edit",
  "composer.delete": "Delete",
  "composer.editing_queued": "Editing queued message",
  "composer.attach_files": "Attach files",
  "composer.stop_run": "Stop run",
  "composer.send_message": "Send message",
  "host_actions.title": "Host Actions",
  "host_actions.model": "Model",
  "host_actions.model_description": "Choose the model for this session",
  "host_actions.reasoning": "Reasoning",
  "host_actions.reasoning_description": "Set thinking level for this session",
  "host_actions.skill": "Skill",
  "host_actions.skill_description": "Choose an enabled skill command",
  "host_actions.tree": "Tree",
  "host_actions.tree_description": "Browse and jump between branches in this session",
  "host_actions.status": "Status",
  "host_actions.status_description": "Show current session overrides in the timeline",
  "host_actions.login": "Login",
  "host_actions.login_description": "Authenticate a provider for this workspace",
  "host_actions.logout": "Logout",
  "host_actions.logout_description": "Remove a provider login from this workspace",
  "host_actions.settings": "Settings",
  "host_actions.settings_description": "Open model, skill, and notification settings",
  "host_actions.enabled_models": "Enabled models",
  "host_actions.enabled_models_description": "Choose which models appear in pickers",
  "host_actions.session": "Session",
  "host_actions.session_description": "Show current session details in the timeline",
  "host_actions.name": "Rename",
  "host_actions.name_description": "Rename the current session",
  "host_actions.name_template_placeholder": "New thread title",
  "host_actions.name_incomplete": "Add a thread title after /name.",
  "host_actions.name_success": "Session renamed to",
  "host_actions.compact": "Compact",
  "host_actions.compact_description": "Compact session context now",
  "host_actions.reload": "Reload",
  "host_actions.reload_description": "Reload prompts, skills, and session resources",
  "tree.eyebrow": "Session tree",
  "tree.browse_branches": "Browse branches",
  "tree.switch_branch": "Switch branch",
  "tree.loading": "Loading session tree…",
  "tree.search_placeholder": "Search visible tree entries",
  "tree.search_hint": "Search expands matching branches.",
  "tree.default_hint": "Tree opens at the most recent entries.",
  "tree.select_hint": "Select a node to branch from it.",
  "tree.no_matches": "No matching nodes.",
  "tree.footer_hint": "Selecting a user prompt reopens it in the composer. Selecting any other node jumps directly there.",
  "tree.already_here": "Already here",
  "tree.continue": "Continue",
  "tree.back": "Back",
  "tree.summary_copy": "You're leaving the current branch. Choose whether pi should summarize the abandoned path before switching.",
  "tree.no_summary": "No summary",
  "tree.no_summary_description": "Jump immediately with no branch summary.",
  "tree.summarize": "Summarize",
  "tree.summarize_description": "Generate a branch summary before switching.",
  "tree.summarize_custom": "Summarize with custom prompt",
  "tree.summarize_custom_description": "Provide extra instructions for the summary.",
  "tree.custom_placeholder": "Focus the summary on decisions, changed files, and unresolved risks.",
  "tree.switching": "Switching…",
  "tree.switch_button": "Switch branch",
  "tree.hint_switching": "Switching branches…",
  "tree.hint_no_summary": "The current branch will be left as-is.",
  "tree.hint_summary": "The summary will be attached to the branch you switch to.",
  "timeline.new_activity_below": "New activity below",
  "workspace_panel.title_changes": "Changes",
  "workspace_panel.title_files": "Files",
  "workspace_panel.aria_label": "Workspace panel",
  "workspace_panel.loading_changes": "Loading changes…",
  "workspace_panel.no_changes": "No changes",
  "workspace_panel.uncommitted": "Uncommitted",
  "workspace_panel.reviewed_count": "Reviewed {reviewed} of {total}",
  "workspace_panel.mark_reviewed": "Mark {path} reviewed",
  "workspace_panel.new_badge": "New",
  "workspace_panel.deleted_badge": "Deleted",
  "workspace_panel.expand_all": "Expand all",
  "workspace_panel.collapse_all": "Collapse all",
  "workspace_panel.staged": "Staged",
  "workspace_panel.stage": "Stage",
  "workspace_panel.search_files": "Search files",
  "workspace_panel.files_count": "{count} files",
  "workspace_panel.files_count_filtered": "{filtered} of {total}",
  "workspace_panel.loading_files": "Loading files…",
  "workspace_panel.no_files": "No files",
  "workspace_panel.file_unavailable": "File is unavailable",
  "workspace_panel.failed_read_file": "Failed to read file",
  "workspace_panel.select_file_preview": "Select a file to preview",
  "workspace_panel.loading_preview": "Loading preview…",
  "workspace_panel.no_preview": "No preview",
  "workspace_panel.binary_change_unavailable": "Binary changes are not previewed.",
  "workspace_panel.binary_preview_unavailable": "Binary file preview is not available.",
  "workspace_panel.media_preview_alt": "Media preview",
  "workspace_panel.media_preview_failed": "Could not load this media preview.",
  "workspace_panel.media_preview_unsupported": "Your system cannot preview this media file.",
  "workspace_panel.preview_truncated": "preview truncated",
  "workspace_panel.copy_file_path": "Copy {path}",
  "workspace_panel.sort_name": "Name",
  "workspace_panel.sort_path": "Path",
  "workspace_panel.sort_type": "Type",
  "workspace_panel.resize_panel": "Resize workspace panel",
  "topbar.open_a_folder_to_begin": "Open a folder to begin",
  "topbar.local": "Local",
  "topbar.unavailable": "unavailable",
  "topbar.new_thread": "New thread",
  "topbar.toggle_terminal": "Toggle terminal",
  "topbar.toggle_changes": "Toggle changes",
  "topbar.toggle_files": "Toggle files",
  "topbar.add_folder": "Add folder",
  "topbar.toggle_sidebar": "Toggle sidebar",
  "sidebar.new_thread": "New thread",
  "sidebar.threads": "Projects",
  "sidebar.sessions": "Sessions",
  "sidebar.skills": "Skills",
  "sidebar.extensions": "Extensions",
  "sidebar.settings": "Settings",
  "sidebar.no_folders_yet": "No folders yet",
  "sidebar.no_folders_description": "Open a project folder to start building a workspace and session list.",
  "sidebar.open_first_folder": "Open first folder",
  "sidebar.workspace_actions": "Workspace actions for {name}",
  "sidebar.remove_worktree": "Remove worktree",
  "sidebar.create_permanent_worktree": "Create permanent worktree",
  "sidebar.edit_name": "Edit name",
  "sidebar.remove_workspace": "Remove",
  "sidebar.archived": "Archived",
  "sidebar.worktree": "Worktree",
  "sidebar.archive": "Archive",
  "sidebar.restore": "Restore",
  "sidebar.delete": "Delete",
  "sidebar.delete_confirm_title": "Delete session",
  "sidebar.delete_confirm": "Delete session “{title}”? This cannot be undone.",
  "dialog.cancel": "Cancel",
  "dialog.delete": "Delete",
  "dialog.ok": "OK",
  "workspace.remove_confirm_title": "Remove workspace",
  "workspace.remove_confirm": "Remove “{name}” from 飞度小派? This will not delete any files.",
  "worktree.remove_confirm_title": "Remove worktree",
  "worktree.remove_confirm": "Remove worktree “{name}”? This removes the git worktree from disk.",
  "sessions.title": "Sessions",
  "sessions.page_description": "Browse recent and archived sessions across every workspace.",
  "sessions.search": "Search sessions",
  "sessions.empty": "No sessions found",
  "sessions.empty_state": "Start a new thread or adjust the search to see session history.",
  "sessions.archived_badge": "Archived",
  "sessions.running_badge": "Running",
  "new_thread.title": "New thread",
  "new_thread.open_folder_to_begin": "Open a folder to begin",
  "new_thread.empty_description": "Select a repository from the sidebar first, then start a local or worktree-backed thread.",
  "new_thread.lets_build": "Let's build",
  "new_thread.workspace": "Workspace",
  "new_thread.prompt_label": "New thread prompt",
  "new_thread.prompt_placeholder": "Ask pi anything, use / for commands and skills",
  "new_thread.local": "Local",
  "new_thread.worktree": "Worktree",
  "new_thread.attach_files": "Attach files",
  "new_thread.start_thread": "Start thread",
  "skills.title": "Skills",
  "skills.select_workspace": "Select a workspace",
  "skills.empty_workspace_description": "Skills are discovered from the selected workspace plus your user-level skill directories.",
  "skills.page_description": "Give pi workspace-specific capabilities and reusable workflows.",
  "skills.new_skill": "New skill",
  "skills.search": "Search skills",
  "skills.catalog_title": "SkillHub",
  "skills.catalog_description": "Browse installable skills from the built-in SkillHub source.",
  "skills.catalog_search": "Search SkillHub",
  "skills.catalog_empty": "No SkillHub skills found.",
  "skills.catalog_loading": "Loading SkillHub skills...",
  "skills.catalog_error": "Could not load SkillHub skills.",
  "skills.catalog_refresh": "Refresh SkillHub",
  "skills.catalog_source": "Source",
  "skills.catalog_sort": "Sort",
  "skills.catalog_sort_updated": "Recently updated",
  "skills.catalog_sort_newest": "Newest",
  "skills.catalog_sort_downloads": "Downloads",
  "skills.catalog_sort_stars": "Stars",
  "skills.catalog_previous": "Previous",
  "skills.catalog_next": "Next",
  "skills.catalog_page": "Page {page}",
  "skills.install": "Install",
  "skills.update": "Update",
  "skills.installed": "Installed",
  "skills.installing": "Installing...",
  "skills.latest_version": "Latest {version}",
  "skills.local_version": "Installed {version}",
  "skills.update_available": "Update available",
  "skills.downloads": "{count} downloads",
  "skills.stars": "{count} stars",
  "skills.empty": "No skills found",
  "skills.empty_state_refresh": "Refresh discovery or create a new skill for this workspace.",
  "skills.empty_state_none_selected": "Refresh runtime discovery to load workspace and user-level skills.",
  "skills.slash_only": "slash only",
  "skills.open_folder": "Open folder",
  "skills.disable": "Disable",
  "skills.enable": "Enable",
  "skills.try": "Try",
  "skills.delete": "Delete",
  "skills.delete_confirm_title": "Delete skill",
  "skills.delete_confirm": "Delete local skill “{name}”? This removes the skill files from disk.",
  "skills.create_new_skill_prompt": "Create a new skill for this workspace and explain which files you will add.",
  "skills.create_new_skill_description": "Create a new skill for this workspace",
  "extensions.title": "Extensions",
  "extensions.select_workspace": "Select a workspace",
  "extensions.empty_workspace_description": "Extensions are discovered from the selected workspace plus your user-level extension directories.",
  "extensions.page_description": "Inspect and manage first-class runtime extensions for this workspace.",
  "extensions.search": "Search extensions",
  "extensions.empty": "No extensions found",
  "extensions.empty_state_refresh": "Refresh runtime discovery to load workspace and user-level extensions.",
  "extensions.empty_state_inspect": "Refresh runtime discovery to inspect extension metadata and diagnostics.",
  "extensions.commands": "Commands",
  "extensions.tools": "Tools",
  "extensions.flags": "Flags",
  "extensions.shortcuts": "Shortcuts",
  "extensions.scope": "Scope",
  "extensions.origin": "Origin",
  "extensions.base_dir": "Base dir",
  "extensions.issues": "issues",
  "extensions.no_commands": "No commands contributed.",
  "extensions.no_tools": "No tools contributed.",
  "extensions.no_flags": "No flags contributed.",
  "extensions.no_shortcuts": "No shortcuts contributed.",
  "extensions.diagnostics": "Diagnostics",
  "extensions.no_diagnostics": "No diagnostics reported.",
  "extensions.command_compatibility": "Command compatibility",
  "extensions.command_compatibility_description": "Learned from real GUI execution. Unlisted commands remain unknown until exercised.",
  "extensions.gui_compatible": "GUI-compatible",
  "extensions.terminal_only": "Terminal-only",
  "extensions.unknown": "Unknown",
  "settings.title": "Settings",
  "settings.select_workspace": "Select a workspace",
  "settings.select_workspace_description": "Provider and skill settings need a selected workspace.",
  "settings.profile": "Profile",
  "settings.profile_description": "View your Feidu account and synced internal AI configuration.",
  "settings.profile.account": "Account",
  "settings.profile.account_description": "This account is used for model access and internal AI requests.",
  "settings.profile.unknown_user": "Feidu user",
  "settings.profile.user_id": "User ID",
  "settings.profile.username": "Username",
  "settings.profile.email": "Email",
  "settings.profile.phone": "Phone",
  "settings.profile.logout": "Log out",
  "settings.profile.logout_description": "Sign out of this Feidu account on this device.",
  "settings.appearance": "Appearance",
  "settings.appearance_description": "Choose between light, dark, or automatic system theme.",
  "settings.language": "Language",
  "settings.language.en_us": "English",
  "settings.language.en_us_description": "Use English interface",
  "settings.language.zh_cn": "简体中文",
  "settings.language.zh_cn_description": "使用简体中文界面",
  "settings.providers": "Providers",
  "settings.providers_description": "Connect providers and manage auth for {workspaceName}.",
  "settings.models": "Models",
  "settings.models_description": "Choose the default model and which models appear in pickers.",
  "settings.notifications": "Notifications",
  "settings.notifications_description": "Manage system notification access and which background events should alert you.",
  "settings.general": "General",
  "settings.general_description": "Keep the high-value app and runtime controls close to hand.",
  "settings.theme": "Theme",
  "settings.theme.system": "System",
  "settings.theme.system_description": "Follow your OS appearance setting",
  "settings.theme.light": "Light",
  "settings.theme.light_description": "Always use the light theme",
  "settings.theme.dark": "Dark",
  "settings.theme.dark_description": "Always use the dark theme",
  "settings.connected_providers": "Connected providers",
  "settings.none": "None",
  "settings.discovered_skills": "Discovered skills",
  "settings.updates": "Updates",
  "settings.updates_description": "Check GitHub Releases and open the matching package in your browser when a new version is available.",
  "settings.check_for_updates": "Check for Updates",
  "settings.model_scope": "Model settings scope",
  "settings.model_scope_description": "Choose whether model defaults apply everywhere or per repo.",
  "settings.model_scope.app_global": "App global",
  "settings.model_scope.per_repo": "Per repo",
  "settings.skill_slash_commands": "Enable skill slash commands",
  "settings.skill_slash_commands_description": "Keep skill slash commands available in the composer.",
  "settings.integrated_terminal_shell": "Shell of integrated terminal",
  "settings.integrated_terminal_shell_description": "Leave blank to use your default login shell.",
  "settings.shortcuts": "Shortcuts",
  "settings.shortcuts.new_thread": "New thread",
  "settings.shortcuts.open_settings": "Open settings",
  "settings.shortcuts.toggle_terminal": "Toggle terminal",
  "settings.shortcuts.new_terminal_tab": "New terminal tab",
  "settings.shortcuts.send_message": "Send message",
  "settings.shortcuts.new_line": "New line",
  "settings.notifications.system": "System",
  "settings.notifications.system_description": "{platformLabel} decides whether 飞度小派 can show desktop notifications at all.",
  "settings.notifications.access": "{platformLabel} notification access",
  "settings.notifications.turn_on": "Turn on notifications",
  "settings.notifications.ask_now": "飞度小派 asks {platformLabel} when active work first moves into the background. You can also ask now.",
  "settings.notifications.denied_recovery": "{platformLabel} notifications are already turned off for 飞度小派. Open {systemSettingsLabel} to enable them again.",
  "settings.notifications.ask_macos": "Ask {platformLabel}",
  "settings.notifications.open_system_settings": "Open {systemSettingsLabel}",
  "settings.notifications.in_app_alerts": "In-app alerts",
  "settings.notifications.in_app_alerts_description": "Choose which background events should try to notify once system access is enabled.",
  "settings.notifications.background_completion": "Background completion",
  "settings.notifications.background_completion_description": "Notify when a background session finishes.",
  "settings.notifications.background_failures": "Background failures",
  "settings.notifications.background_failures_description": "Notify when a background session fails.",
  "settings.notifications.attention_needed": "Needs input or approval",
  "settings.notifications.attention_needed_description": "Notify when input is needed to continue.",
  "settings.notifications.status.enabled": "Enabled",
  "settings.notifications.status.turned_off": "Turned off",
  "settings.notifications.status.not_enabled": "Not enabled yet",
  "settings.notifications.status.unavailable": "Unavailable",
  "settings.notifications.status.checking": "Checking…",
  "settings.notifications.desc.granted": "{platformLabel} will allow 飞度小派 to show desktop notifications for background thread updates.",
  "settings.notifications.desc.denied": "{platformLabel} notifications are turned off for 飞度小派. Enable them in {systemSettingsLabel} to receive background completion alerts.",
  "settings.notifications.desc.default": "飞度小派 has not asked {platformLabel} for desktop notification access yet.",
  "settings.notifications.desc.unsupported": "Desktop notifications are unavailable on this system.",
  "settings.notifications.desc.unknown": "Checking whether {platformLabel} notifications are available for 飞度小派.",
  "settings.providers.connected": "Connected",
  "settings.providers.connected_description": "Connected built-in providers are used first for picking models.",
  "settings.providers.none_connected": "No built-in providers connected yet.",
  "settings.providers.custom": "Custom providers",
  "settings.providers.custom_description": "Add OpenAI, Anthropic, or Google-compatible providers from your own endpoints.",
  "settings.providers.definitions": "Provider definitions",
  "settings.providers.definitions_description": "These entries are written to `models.json` and become available throughout the app.",
  "settings.providers.new_custom": "New custom provider",
  "settings.providers.edit": "Edit",
  "settings.providers.delete": "Delete",
  "settings.providers.none_custom": "No custom providers yet.",
  "settings.providers.edit_custom": "Edit custom provider",
  "settings.providers.add_custom": "Add custom provider",
  "settings.providers.custom_id": "Custom provider ID",
  "settings.providers.custom_id_placeholder": "Provider ID, for example my-proxy",
  "settings.providers.custom_display_name": "Custom provider display name",
  "settings.providers.custom_display_name_placeholder": "Optional display name",
  "settings.providers.custom_api": "Custom provider API",
  "settings.providers.custom_base_url": "Custom provider base URL",
  "settings.providers.custom_base_url_placeholder": "Base URL",
  "settings.providers.custom_api_key": "Custom provider API key",
  "settings.providers.custom_api_key_placeholder": "Optional API key",
  "settings.providers.custom_model_ids": "Custom provider model IDs",
  "settings.providers.custom_model_ids_placeholder": "One model ID per line\nfor example:\ngpt-4.1\ngpt-4o-mini",
  "settings.providers.cancel_edit": "Cancel edit",
  "settings.providers.save_provider": "Save provider",
  "settings.providers.add_provider": "Add provider",
  "settings.providers.sign_in": "Sign in",
  "settings.providers.sign_in_description": "OAuth-capable providers can sign in directly from the desktop app.",
  "settings.providers.all": "All providers",
  "settings.providers.all_description": "Browse the full provider inventory.",
  "settings.providers.browse_all": "Browse all providers",
  "settings.providers.search": "Search providers",
  "settings.providers.manage_api_key": "Manage API key",
  "settings.providers.set_api_key": "Set API key",
  "settings.providers.replace_api_key": "Replace the saved API key for {providerName}, and optionally override its API URL.",
  "settings.providers.save_local_api_key": "Save an API key locally for {providerName}, and optionally override its API URL.",
  "settings.providers.provider_api_url": "{providerName} API URL",
  "settings.providers.provider_api_url_placeholder": "Optional custom API URL",
  "settings.providers.provider_api_key": "{providerName} API key",
  "settings.providers.provider_api_key_placeholder": "Enter API key",
  "settings.providers.remove_saved_key": "Remove saved key",
  "settings.providers.set": "Set",
  "settings.provider_status.oauth_connected": "OAuth · connected",
  "settings.provider_status.api_key_connected": "API key · connected",
  "settings.provider_status.env_connected": "Environment variable · connected",
  "settings.provider_status.external_connected": "Configured externally · connected",
  "settings.provider_status.configure_externally": "Configure externally",
  "settings.provider_status.oauth": "OAuth",
  "settings.provider_status.api_key": "API key",
  "settings.provider_status.built_in": "Built in",
  "settings.provider_action.logout": "Logout",
  "settings.provider_action.login": "Login",
  "settings.provider_action.manage": "Manage",
  "settings.provider_action.set_api_key": "Set API key",
  "settings.provider_action.managed_externally": "Managed externally",
  "settings.models.default_model": "Default model",
  "settings.models.default_model_description": "Choose the default model for new sessions.",
  "settings.models.choose_model": "Choose a model",
  "settings.models.reasoning": "Reasoning",
  "settings.models.reasoning_description": "Set the default reasoning level for new sessions.",
  "settings.models.enabled": "Enabled models",
  "settings.models.enabled_description": "Choose which models appear in pickers throughout the app.",
  "settings.models.none_connected": "No connected models available yet.",
  "settings.models.none_enabled": "No available models are currently enabled.",
  "settings.models.all_enabled": "All available models enabled by default.",
  "settings.models.default_not_enabled": "Your default model ({provider}:{modelId}) is not enabled. Choose a new default above.",
  "settings.models.edit_enabled": "Edit enabled models",
  "settings.models.search_enabled": "Search enabled models",
  "settings.models.must_keep_one": "At least one model must be enabled",
  "settings.models.all": "All models",
  "settings.models.all_description": "Browse the full model catalog. Enable models above to use them.",
  "settings.models.browse_all": "Browse full model inventory",
  "settings.models.search": "Search models",
  "settings.models.reasoning_badge": "reasoning",
  "settings.models.images_badge": "images",
  "settings.models.not_logged_in_badge": "not logged in",
  "settings.models.enable": "Enable",
};

const ZH_CN: TranslationTable = {
  "common.cancel": "取消",
  "common.save": "保存",
  "common.refresh": "刷新",
  "common.path": "路径",
  "common.source": "来源",
  "common.remove": "移除",
  "common.enabled": "已启用",
  "common.disabled": "已禁用",
  "common.open_folder": "打开文件夹",
  "common.back_to_app": "返回应用",
  "common.working": "运行中…",
  "common.working_seconds": "已运行 {seconds} 秒",
  "common.working_minutes": "已运行 {minutes} 分 {remaining} 秒",
  "common.loading_sessions": "加载会话中",
  "common.loading_sessions_description": "桌面 Shell 正在从主进程恢复文件夹和会话状态。",
  "common.select_workspace_first": "请先选择一个工作区。",
  "common.workspace": "工作区",
  "common.open_folder_to_start": "先打开一个文件夹",
  "common.open_folder_to_start_description": "创建新会话前，请先添加一个项目文件夹。",
  "common.open_folder_to_start_description_multi": "添加项目文件夹，将会话分组管理，并从侧边栏切换会话。",
  "common.create_thread_description": "为此文件夹创建一个会话，然后从侧边栏切换会话。",
  "account.login_title": "使用钉钉登录",
  "account.login_description": "飞度小派会使用你的飞度账号加载可用模型，并通过内部 AI 服务发送请求。",
  "account.login_button": "钉钉登录",
  "account.login_pending": "等待钉钉登录中...",
  "account.required_note": "登录后才能继续使用桌面 Agent。",
  "composer.placeholder": "让 pi 检查仓库、修复问题，或继续当前会话...",
  "composer.hint_running": "{runningLabel} · Enter 排队 · {modifierKey}+Enter 引导",
  "composer.hint_idle": "Enter 发送 · Shift+Enter 换行",
  "composer.steer": "引导",
  "composer.edit": "编辑",
  "composer.delete": "删除",
  "composer.editing_queued": "正在编辑排队消息",
  "composer.attach_files": "附加文件",
  "composer.stop_run": "停止运行",
  "composer.send_message": "发送消息",
  "host_actions.title": "主机操作",
  "host_actions.model": "模型",
  "host_actions.model_description": "选择当前会话的模型",
  "host_actions.reasoning": "推理",
  "host_actions.reasoning_description": "设置当前会话的推理级别",
  "host_actions.skill": "技能",
  "host_actions.skill_description": "选择一个已启用的技能命令",
  "host_actions.tree": "分支树",
  "host_actions.tree_description": "浏览并跳转到当前会话的不同分支",
  "host_actions.status": "状态",
  "host_actions.status_description": "在时间线中显示当前会话的覆盖设置",
  "host_actions.login": "登录",
  "host_actions.login_description": "为当前工作区认证一个服务商",
  "host_actions.logout": "退出登录",
  "host_actions.logout_description": "移除当前工作区的服务商登录",
  "host_actions.settings": "设置",
  "host_actions.settings_description": "打开模型、技能和通知设置",
  "host_actions.enabled_models": "已启用模型",
  "host_actions.enabled_models_description": "选择在选择器中显示哪些模型",
  "host_actions.session": "会话",
  "host_actions.session_description": "在时间线中显示当前会话详情",
  "host_actions.name": "重命名",
  "host_actions.name_description": "重命名当前会话",
  "host_actions.name_template_placeholder": "新的会话标题",
  "host_actions.name_incomplete": "请在 /name 后输入会话标题。",
  "host_actions.name_success": "会话已重命名为",
  "host_actions.compact": "压缩",
  "host_actions.compact_description": "立即压缩会话上下文",
  "host_actions.reload": "重新加载",
  "host_actions.reload_description": "重新加载提示词、技能和会话资源",
  "tree.eyebrow": "会话树",
  "tree.browse_branches": "浏览分支",
  "tree.switch_branch": "切换分支",
  "tree.loading": "加载会话树中…",
  "tree.search_placeholder": "搜索可见的树节点",
  "tree.search_hint": "搜索会展开匹配的分支。",
  "tree.default_hint": "树从最近的条目打开。",
  "tree.select_hint": "选择一个节点以从此处分支。",
  "tree.no_matches": "没有匹配的节点。",
  "tree.footer_hint": "选择用户提示词会在输入框中重新打开它。选择其他节点会直接跳转到那里。",
  "tree.already_here": "已在此处",
  "tree.continue": "继续",
  "tree.back": "返回",
  "tree.summary_copy": "你即将离开当前分支。选择 pi 是否在切换前总结被放弃的路径。",
  "tree.no_summary": "不总结",
  "tree.no_summary_description": "直接跳转，不生成分支总结。",
  "tree.summarize": "总结",
  "tree.summarize_description": "切换前生成分支总结。",
  "tree.summarize_custom": "使用自定义提示词总结",
  "tree.summarize_custom_description": "为总结提供额外指令。",
  "tree.custom_placeholder": "重点总结决策、修改的文件和未解决的风险。",
  "tree.switching": "切换中…",
  "tree.switch_button": "切换分支",
  "tree.hint_switching": "正在切换分支…",
  "tree.hint_no_summary": "当前分支将保持原样。",
  "tree.hint_summary": "总结将附加到你切换到的分支。",
  "timeline.new_activity_below": "下方有新活动",
  "workspace_panel.title_changes": "变更",
  "workspace_panel.title_files": "文件",
  "workspace_panel.aria_label": "工作区面板",
  "workspace_panel.loading_changes": "正在加载变更…",
  "workspace_panel.no_changes": "没有变更",
  "workspace_panel.uncommitted": "未提交",
  "workspace_panel.reviewed_count": "已阅 {reviewed} / {total}",
  "workspace_panel.mark_reviewed": "标记 {path} 为已阅",
  "workspace_panel.new_badge": "新增",
  "workspace_panel.deleted_badge": "删除",
  "workspace_panel.expand_all": "全部展开",
  "workspace_panel.collapse_all": "全部折叠",
  "workspace_panel.staged": "已暂存",
  "workspace_panel.stage": "暂存",
  "workspace_panel.search_files": "搜索文件",
  "workspace_panel.files_count": "{count} 个文件",
  "workspace_panel.files_count_filtered": "{filtered} / {total}",
  "workspace_panel.loading_files": "正在加载文件…",
  "workspace_panel.no_files": "没有文件",
  "workspace_panel.file_unavailable": "文件不可用",
  "workspace_panel.failed_read_file": "读取文件失败",
  "workspace_panel.select_file_preview": "选择文件以预览",
  "workspace_panel.loading_preview": "正在加载预览…",
  "workspace_panel.no_preview": "没有预览",
  "workspace_panel.binary_change_unavailable": "二进制变更不加载预览。",
  "workspace_panel.binary_preview_unavailable": "二进制文件无法预览。",
  "workspace_panel.media_preview_alt": "媒体预览",
  "workspace_panel.media_preview_failed": "无法加载这个媒体预览。",
  "workspace_panel.media_preview_unsupported": "当前系统无法预览这个媒体文件。",
  "workspace_panel.preview_truncated": "预览已截断",
  "workspace_panel.copy_file_path": "复制 {path}",
  "workspace_panel.sort_name": "名称",
  "workspace_panel.sort_path": "路径",
  "workspace_panel.sort_type": "类型",
  "workspace_panel.resize_panel": "调整工作区面板宽度",
  "topbar.open_a_folder_to_begin": "先打开一个文件夹开始",
  "topbar.local": "本地",
  "topbar.unavailable": "不可用",
  "topbar.new_thread": "新会话",
  "topbar.toggle_terminal": "切换终端",
  "topbar.toggle_changes": "切换变更",
  "topbar.toggle_files": "切换文件",
  "topbar.add_folder": "添加文件夹",
  "topbar.toggle_sidebar": "切换侧边栏",
  "sidebar.new_thread": "新会话",
  "sidebar.threads": "项目",
  "sidebar.sessions": "会话",
  "sidebar.skills": "技能",
  "sidebar.extensions": "扩展",
  "sidebar.settings": "设置",
  "sidebar.no_folders_yet": "还没有文件夹",
  "sidebar.no_folders_description": "先打开一个项目文件夹，开始构建工作区和会话列表。",
  "sidebar.open_first_folder": "打开第一个文件夹",
  "sidebar.workspace_actions": "{name} 的工作区操作",
  "sidebar.remove_worktree": "移除工作树",
  "sidebar.create_permanent_worktree": "创建永久工作树",
  "sidebar.edit_name": "编辑名称",
  "sidebar.remove_workspace": "移除",
  "sidebar.archived": "已归档",
  "sidebar.worktree": "工作树",
  "sidebar.archive": "归档",
  "sidebar.restore": "恢复",
  "sidebar.delete": "删除",
  "sidebar.delete_confirm_title": "删除会话",
  "sidebar.delete_confirm": "确定删除会话“{title}”吗？此操作无法撤销。",
  "dialog.cancel": "取消",
  "dialog.delete": "删除",
  "dialog.ok": "确定",
  "workspace.remove_confirm_title": "移除工作区",
  "workspace.remove_confirm": "从飞度小派移除“{name}”吗？这不会删除任何文件。",
  "worktree.remove_confirm_title": "移除工作树",
  "worktree.remove_confirm": "移除工作树“{name}”吗？这会从磁盘删除 git worktree。",
  "sessions.title": "会话",
  "sessions.page_description": "查看所有工作区的最近会话和已归档会话。",
  "sessions.search": "搜索会话",
  "sessions.empty": "没有找到会话",
  "sessions.empty_state": "新建会话或调整搜索条件后再查看历史会话。",
  "sessions.archived_badge": "已归档",
  "sessions.running_badge": "运行中",
  "new_thread.title": "新会话",
  "new_thread.open_folder_to_begin": "先打开一个文件夹开始",
  "new_thread.empty_description": "先在侧边栏选择一个仓库，然后开始本地会话或基于工作树的会话。",
  "new_thread.lets_build": "开始构建",
  "new_thread.workspace": "工作区",
  "new_thread.prompt_label": "新会话提示词",
  "new_thread.prompt_placeholder": "向 pi 提任何问题，输入 / 使用命令和技能",
  "new_thread.local": "本地",
  "new_thread.worktree": "工作树",
  "new_thread.attach_files": "附加文件",
  "new_thread.start_thread": "开始会话",
  "skills.title": "技能",
  "skills.select_workspace": "选择工作区",
  "skills.empty_workspace_description": "技能会从当前工作区以及你的用户级技能目录中发现。",
  "skills.page_description": "为 pi 提供工作区专属能力和可复用工作流。",
  "skills.new_skill": "新建技能",
  "skills.search": "搜索技能",
  "skills.catalog_title": "SkillHub",
  "skills.catalog_description": "从内置 SkillHub 源浏览并安装技能。",
  "skills.catalog_search": "搜索 SkillHub",
  "skills.catalog_empty": "未找到 SkillHub 技能。",
  "skills.catalog_loading": "正在加载 SkillHub 技能...",
  "skills.catalog_error": "无法加载 SkillHub 技能。",
  "skills.catalog_refresh": "刷新 SkillHub",
  "skills.catalog_source": "来源",
  "skills.catalog_sort": "排序",
  "skills.catalog_sort_updated": "最近更新",
  "skills.catalog_sort_newest": "最新发布",
  "skills.catalog_sort_downloads": "下载量",
  "skills.catalog_sort_stars": "星标",
  "skills.catalog_previous": "上一页",
  "skills.catalog_next": "下一页",
  "skills.catalog_page": "第 {page} 页",
  "skills.install": "安装",
  "skills.update": "更新",
  "skills.installed": "已安装",
  "skills.installing": "安装中...",
  "skills.latest_version": "最新 {version}",
  "skills.local_version": "已安装 {version}",
  "skills.update_available": "可更新",
  "skills.downloads": "{count} 次下载",
  "skills.stars": "{count} 星标",
  "skills.empty": "未找到技能",
  "skills.empty_state_refresh": "刷新发现结果，或为当前工作区创建一个新技能。",
  "skills.empty_state_none_selected": "刷新运行时发现结果以加载工作区和用户级技能。",
  "skills.slash_only": "仅 slash",
  "skills.open_folder": "打开文件夹",
  "skills.disable": "禁用",
  "skills.enable": "启用",
  "skills.try": "试用",
  "skills.delete": "删除",
  "skills.delete_confirm_title": "删除技能",
  "skills.delete_confirm": "删除本地技能“{name}”吗？这会从磁盘移除该技能文件。",
  "skills.create_new_skill_prompt": "为当前工作区创建一个新技能，并说明你将添加哪些文件。",
  "skills.create_new_skill_description": "为当前工作区创建一个新技能",
  "extensions.title": "扩展",
  "extensions.select_workspace": "选择工作区",
  "extensions.empty_workspace_description": "扩展会从当前工作区以及你的用户级扩展目录中发现。",
  "extensions.page_description": "查看并管理当前工作区的一等运行时扩展。",
  "extensions.search": "搜索扩展",
  "extensions.empty": "未找到扩展",
  "extensions.empty_state_refresh": "刷新运行时发现结果以加载工作区和用户级扩展。",
  "extensions.empty_state_inspect": "刷新运行时发现结果以查看扩展元数据和诊断信息。",
  "extensions.commands": "命令",
  "extensions.tools": "工具",
  "extensions.flags": "标志",
  "extensions.shortcuts": "快捷键",
  "extensions.scope": "作用域",
  "extensions.origin": "来源",
  "extensions.base_dir": "基础目录",
  "extensions.issues": "个问题",
  "extensions.no_commands": "没有提供命令。",
  "extensions.no_tools": "没有提供工具。",
  "extensions.no_flags": "没有提供标志。",
  "extensions.no_shortcuts": "没有提供快捷键。",
  "extensions.diagnostics": "诊断",
  "extensions.no_diagnostics": "没有诊断信息。",
  "extensions.command_compatibility": "命令兼容性",
  "extensions.command_compatibility_description": "基于真实 GUI 执行学习得出。未列出的命令在实际运行前仍为未知。",
  "extensions.gui_compatible": "兼容 GUI",
  "extensions.terminal_only": "仅终端",
  "extensions.unknown": "未知",
  "settings.title": "设置",
  "settings.select_workspace": "选择工作区",
  "settings.select_workspace_description": "Provider 和技能设置需要先选中一个工作区。",
  "settings.profile": "个人中心",
  "settings.profile_description": "查看你的飞度账号和已同步的内部 AI 配置。",
  "settings.profile.account": "账号",
  "settings.profile.account_description": "此账号用于模型访问和内部 AI 请求。",
  "settings.profile.unknown_user": "飞度用户",
  "settings.profile.user_id": "用户 ID",
  "settings.profile.username": "用户名",
  "settings.profile.email": "邮箱",
  "settings.profile.phone": "手机号",
  "settings.profile.logout": "登出",
  "settings.profile.logout_description": "在此设备上退出当前飞度账号。",
  "settings.appearance": "外观",
  "settings.appearance_description": "选择浅色、深色或跟随系统主题。",
  "settings.language": "语言",
  "settings.language.en_us": "English",
  "settings.language.en_us_description": "Use English interface",
  "settings.language.zh_cn": "简体中文",
  "settings.language.zh_cn_description": "使用简体中文界面",
  "settings.providers": "服务商",
  "settings.providers_description": "连接服务商并管理 {workspaceName} 的鉴权。",
  "settings.models": "模型",
  "settings.models_description": "选择默认模型，以及在选择器中展示哪些模型。",
  "settings.notifications": "通知",
  "settings.notifications_description": "管理系统通知权限，以及哪些后台事件应该提醒你。",
  "settings.general": "通用",
  "settings.general_description": "把高价值的应用和运行时控制放在手边。",
  "settings.theme": "主题",
  "settings.theme.system": "跟随系统",
  "settings.theme.system_description": "跟随操作系统的外观设置",
  "settings.theme.light": "浅色",
  "settings.theme.light_description": "始终使用浅色主题",
  "settings.theme.dark": "深色",
  "settings.theme.dark_description": "始终使用深色主题",
  "settings.connected_providers": "已连接的服务商",
  "settings.none": "无",
  "settings.discovered_skills": "已发现技能",
  "settings.updates": "更新",
  "settings.updates_description": "检查 GitHub Releases；有新版本时在浏览器打开当前平台对应的安装包。",
  "settings.check_for_updates": "检查更新",
  "settings.model_scope": "模型设置范围",
  "settings.model_scope_description": "选择模型默认值是全局生效还是按仓库生效。",
  "settings.model_scope.app_global": "应用全局",
  "settings.model_scope.per_repo": "按仓库",
  "settings.skill_slash_commands": "启用技能 Slash 命令",
  "settings.skill_slash_commands_description": "让技能 Slash 命令在输入框中始终可用。",
  "settings.integrated_terminal_shell": "集成终端 Shell",
  "settings.integrated_terminal_shell_description": "留空则使用你的默认登录 Shell。",
  "settings.shortcuts": "快捷键",
  "settings.shortcuts.new_thread": "新会话",
  "settings.shortcuts.open_settings": "打开设置",
  "settings.shortcuts.toggle_terminal": "切换终端",
  "settings.shortcuts.new_terminal_tab": "新终端标签页",
  "settings.shortcuts.send_message": "发送消息",
  "settings.shortcuts.new_line": "换行",
  "settings.notifications.system": "系统",
  "settings.notifications.system_description": "是否允许飞度小派显示桌面通知，完全由 {platformLabel} 决定。",
  "settings.notifications.access": "{platformLabel} 通知权限",
  "settings.notifications.turn_on": "开启通知",
  "settings.notifications.ask_now": "当活动工作首次切到后台时，飞度小派会向 {platformLabel} 申请权限。你也可以现在就申请。",
  "settings.notifications.denied_recovery": "{platformLabel} 已为飞度小派关闭通知。打开{systemSettingsLabel}后可重新启用。",
  "settings.notifications.ask_macos": "向 {platformLabel} 申请",
  "settings.notifications.open_system_settings": "打开{systemSettingsLabel}",
  "settings.notifications.in_app_alerts": "应用内提醒",
  "settings.notifications.in_app_alerts_description": "选择在系统已授予权限后，哪些后台事件应该尝试通知你。",
  "settings.notifications.background_completion": "后台完成",
  "settings.notifications.background_completion_description": "后台会话完成时通知。",
  "settings.notifications.background_failures": "后台失败",
  "settings.notifications.background_failures_description": "后台会话失败时通知。",
  "settings.notifications.attention_needed": "需要输入或批准",
  "settings.notifications.attention_needed_description": "继续执行需要输入时通知。",
  "settings.notifications.status.enabled": "已开启",
  "settings.notifications.status.turned_off": "已关闭",
  "settings.notifications.status.not_enabled": "尚未开启",
  "settings.notifications.status.unavailable": "不可用",
  "settings.notifications.status.checking": "检查中…",
  "settings.notifications.desc.granted": "{platformLabel} 允许飞度小派为后台会话更新显示桌面通知。",
  "settings.notifications.desc.denied": "{platformLabel} 已为飞度小派关闭通知。请到{systemSettingsLabel}中重新开启，以接收后台完成提醒。",
  "settings.notifications.desc.default": "飞度小派还没有向 {platformLabel} 申请桌面通知权限。",
  "settings.notifications.desc.unsupported": "当前系统不支持桌面通知。",
  "settings.notifications.desc.unknown": "正在检查 {platformLabel} 是否允许飞度小派显示通知。",
  "settings.providers.connected": "已连接",
  "settings.providers.connected_description": "已连接的内置服务商会优先用于选择模型。",
  "settings.providers.none_connected": "还没有连接任何内置服务商。",
  "settings.providers.custom": "自定义服务商",
  "settings.providers.custom_description": "从你自己的端点添加兼容 OpenAI、Anthropic 或 Google 的服务商。",
  "settings.providers.definitions": "服务商定义",
  "settings.providers.definitions_description": "这些条目会写入 `models.json`，并在整个应用中可用。",
  "settings.providers.new_custom": "新建自定义服务商",
  "settings.providers.edit": "编辑",
  "settings.providers.delete": "删除",
  "settings.providers.none_custom": "还没有自定义服务商。",
  "settings.providers.edit_custom": "编辑自定义服务商",
  "settings.providers.add_custom": "添加自定义服务商",
  "settings.providers.custom_id": "自定义服务商 ID",
  "settings.providers.custom_id_placeholder": "服务商 ID，例如 my-proxy",
  "settings.providers.custom_display_name": "自定义服务商显示名",
  "settings.providers.custom_display_name_placeholder": "可选显示名",
  "settings.providers.custom_api": "自定义服务商 API",
  "settings.providers.custom_base_url": "自定义服务商 Base URL",
  "settings.providers.custom_base_url_placeholder": "Base URL",
  "settings.providers.custom_api_key": "自定义服务商 API Key",
  "settings.providers.custom_api_key_placeholder": "可选 API Key",
  "settings.providers.custom_model_ids": "自定义服务商模型 ID",
  "settings.providers.custom_model_ids_placeholder": "每行一个模型 ID\n例如：\ngpt-4.1\ngpt-4o-mini",
  "settings.providers.cancel_edit": "取消编辑",
  "settings.providers.save_provider": "保存服务商",
  "settings.providers.add_provider": "添加服务商",
  "settings.providers.sign_in": "登录",
  "settings.providers.sign_in_description": "支持 OAuth 的服务商可以直接在桌面应用中登录。",
  "settings.providers.all": "全部服务商",
  "settings.providers.all_description": "浏览完整的服务商清单。",
  "settings.providers.browse_all": "浏览全部服务商",
  "settings.providers.search": "搜索服务商",
  "settings.providers.manage_api_key": "管理 API Key",
  "settings.providers.set_api_key": "设置 API Key",
  "settings.providers.replace_api_key": "替换 {providerName} 已保存的 API Key，并可选覆盖其 API URL。",
  "settings.providers.save_local_api_key": "为 {providerName} 本地保存一个 API Key，并可选覆盖其 API URL。",
  "settings.providers.provider_api_url": "{providerName} API URL",
  "settings.providers.provider_api_url_placeholder": "可选自定义 API URL",
  "settings.providers.provider_api_key": "{providerName} API Key",
  "settings.providers.provider_api_key_placeholder": "输入 API Key",
  "settings.providers.remove_saved_key": "移除已保存的 Key",
  "settings.providers.set": "设置",
  "settings.provider_status.oauth_connected": "OAuth · 已连接",
  "settings.provider_status.api_key_connected": "API Key · 已连接",
  "settings.provider_status.env_connected": "环境变量 · 已连接",
  "settings.provider_status.external_connected": "外部配置 · 已连接",
  "settings.provider_status.configure_externally": "请在外部配置",
  "settings.provider_status.oauth": "OAuth",
  "settings.provider_status.api_key": "API Key",
  "settings.provider_status.built_in": "内置",
  "settings.provider_action.logout": "退出登录",
  "settings.provider_action.login": "登录",
  "settings.provider_action.manage": "管理",
  "settings.provider_action.set_api_key": "设置 API Key",
  "settings.provider_action.managed_externally": "由外部管理",
  "settings.models.default_model": "默认模型",
  "settings.models.default_model_description": "为新会话选择默认模型。",
  "settings.models.choose_model": "选择模型",
  "settings.models.reasoning": "推理强度",
  "settings.models.reasoning_description": "为新会话设置默认推理级别。",
  "settings.models.enabled": "已启用模型",
  "settings.models.enabled_description": "选择整个应用中的选择器里显示哪些模型。",
  "settings.models.none_connected": "还没有可用的已连接模型。",
  "settings.models.none_enabled": "当前没有已启用的可用模型。",
  "settings.models.all_enabled": "默认已启用所有可用模型。",
  "settings.models.default_not_enabled": "你的默认模型（{provider}:{modelId}）未启用。请在上方选择新的默认模型。",
  "settings.models.edit_enabled": "编辑已启用模型",
  "settings.models.search_enabled": "搜索已启用模型",
  "settings.models.must_keep_one": "至少必须启用一个模型",
  "settings.models.all": "全部模型",
  "settings.models.all_description": "浏览完整模型目录。要使用模型，请先在上方启用。",
  "settings.models.browse_all": "浏览完整模型清单",
  "settings.models.search": "搜索模型",
  "settings.models.reasoning_badge": "推理",
  "settings.models.images_badge": "图像",
  "settings.models.not_logged_in_badge": "未登录",
  "settings.models.enable": "启用",
};

const TRANSLATIONS: Record<AppLocale, TranslationTable> = {
  "en-US": EN_US,
  "zh-CN": ZH_CN,
};

let currentLocale: AppLocale = "zh-CN";

export function resolveLocale(input: string | undefined): AppLocale {
  return input === "en-US" ? "en-US" : "zh-CN";
}

export function setLocale(locale: AppLocale): void {
  currentLocale = locale;
}

export function getLocale(): AppLocale {
  return currentLocale;
}

export function t(key: TranslationKey, variables?: Record<string, string | number>): string {
  const template = TRANSLATIONS[currentLocale][key] ?? EN_US[key];
  if (!variables) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(variables[name] ?? ""));
}
