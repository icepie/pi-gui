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
  | "topbar.open_a_folder_to_begin"
  | "topbar.local"
  | "topbar.unavailable"
  | "topbar.new_thread"
  | "topbar.toggle_terminal"
  | "topbar.toggle_changes"
  | "topbar.add_folder"
  | "topbar.toggle_sidebar"
  | "sidebar.new_thread"
  | "sidebar.threads"
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
  | "sidebar.delete_confirm"
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
  | "skills.empty"
  | "skills.empty_state_refresh"
  | "skills.empty_state_none_selected"
  | "skills.slash_only"
  | "skills.open_folder"
  | "skills.disable"
  | "skills.enable"
  | "skills.try"
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
  | "settings.appearance"
  | "settings.appearance_description"
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
  "topbar.open_a_folder_to_begin": "Open a folder to begin",
  "topbar.local": "Local",
  "topbar.unavailable": "unavailable",
  "topbar.new_thread": "New thread",
  "topbar.toggle_terminal": "Toggle terminal",
  "topbar.toggle_changes": "Toggle changes",
  "topbar.add_folder": "Add folder",
  "topbar.toggle_sidebar": "Toggle sidebar",
  "sidebar.new_thread": "New thread",
  "sidebar.threads": "Threads",
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
  "sidebar.delete_confirm": "Delete session “{title}”? This cannot be undone.",
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
  "skills.empty": "No skills found",
  "skills.empty_state_refresh": "Refresh discovery or create a new skill for this workspace.",
  "skills.empty_state_none_selected": "Refresh runtime discovery to load workspace and user-level skills.",
  "skills.slash_only": "slash only",
  "skills.open_folder": "Open folder",
  "skills.disable": "Disable",
  "skills.enable": "Enable",
  "skills.try": "Try",
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
  "settings.appearance": "Appearance",
  "settings.appearance_description": "Choose between light, dark, or automatic system theme.",
  "settings.providers": "Providers",
  "settings.providers_description": "Connect providers and manage auth for {workspaceName}.",
  "settings.models": "Models",
  "settings.models_description": "Choose the default model and which models appear in pickers.",
  "settings.notifications": "Notifications",
  "settings.notifications_description": "Manage both macOS notification access and which background events should alert you.",
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
  "settings.notifications.system_description": "macOS decides whether pi-gui can show desktop notifications at all.",
  "settings.notifications.access": "macOS notification access",
  "settings.notifications.turn_on": "Turn on notifications",
  "settings.notifications.ask_now": "pi-gui asks macOS when active work first moves into the background. You can also ask now.",
  "settings.notifications.denied_recovery": "macOS notifications are already turned off for pi-gui. Open System Settings to enable them again.",
  "settings.notifications.ask_macos": "Ask macOS",
  "settings.notifications.open_system_settings": "Open System Settings",
  "settings.notifications.in_app_alerts": "In-app alerts",
  "settings.notifications.in_app_alerts_description": "Choose which background events should try to notify once macOS access is enabled.",
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
  "settings.notifications.desc.granted": "macOS will allow pi-gui to show desktop notifications for background thread updates.",
  "settings.notifications.desc.denied": "macOS notifications are turned off for pi-gui. Enable them in System Settings to receive background completion alerts.",
  "settings.notifications.desc.default": "pi-gui has not asked macOS for desktop notification access yet.",
  "settings.notifications.desc.unsupported": "Desktop notifications are unavailable on this system.",
  "settings.notifications.desc.unknown": "Checking whether macOS notifications are available for pi-gui.",
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
  "topbar.open_a_folder_to_begin": "先打开一个文件夹开始",
  "topbar.local": "本地",
  "topbar.unavailable": "不可用",
  "topbar.new_thread": "新线程",
  "topbar.toggle_terminal": "切换终端",
  "topbar.toggle_changes": "切换变更",
  "topbar.add_folder": "添加文件夹",
  "topbar.toggle_sidebar": "切换侧边栏",
  "sidebar.new_thread": "新线程",
  "sidebar.threads": "线程",
  "sidebar.skills": "技能",
  "sidebar.extensions": "扩展",
  "sidebar.settings": "设置",
  "sidebar.no_folders_yet": "还没有文件夹",
  "sidebar.no_folders_description": "先打开一个项目文件夹，开始构建工作区和会话列表。",
  "sidebar.open_first_folder": "打开第一个文件夹",
  "sidebar.workspace_actions": "{name} 的工作区操作",
  "sidebar.remove_worktree": "移除 worktree",
  "sidebar.create_permanent_worktree": "创建永久 worktree",
  "sidebar.edit_name": "编辑名称",
  "sidebar.remove_workspace": "移除",
  "sidebar.archived": "已归档",
  "sidebar.worktree": "Worktree",
  "sidebar.archive": "归档",
  "sidebar.restore": "恢复",
  "sidebar.delete": "删除",
  "sidebar.delete_confirm": "确定删除会话“{title}”吗？此操作无法撤销。",
  "new_thread.title": "新线程",
  "new_thread.open_folder_to_begin": "先打开一个文件夹开始",
  "new_thread.empty_description": "先在侧边栏选择一个仓库，然后开始本地线程或基于 worktree 的线程。",
  "new_thread.lets_build": "开始构建",
  "new_thread.workspace": "工作区",
  "new_thread.prompt_label": "新线程提示词",
  "new_thread.prompt_placeholder": "向 pi 提任何问题，输入 / 使用命令和技能",
  "new_thread.local": "本地",
  "new_thread.worktree": "Worktree",
  "new_thread.attach_files": "附加文件",
  "new_thread.start_thread": "开始线程",
  "skills.title": "技能",
  "skills.select_workspace": "选择工作区",
  "skills.empty_workspace_description": "技能会从当前工作区以及你的用户级技能目录中发现。",
  "skills.page_description": "为 pi 提供工作区专属能力和可复用工作流。",
  "skills.new_skill": "新建技能",
  "skills.search": "搜索技能",
  "skills.empty": "未找到技能",
  "skills.empty_state_refresh": "刷新发现结果，或为当前工作区创建一个新技能。",
  "skills.empty_state_none_selected": "刷新运行时发现结果以加载工作区和用户级技能。",
  "skills.slash_only": "仅 slash",
  "skills.open_folder": "打开文件夹",
  "skills.disable": "禁用",
  "skills.enable": "启用",
  "skills.try": "试用",
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
  "settings.appearance": "外观",
  "settings.appearance_description": "选择浅色、深色或跟随系统主题。",
  "settings.providers": "Providers",
  "settings.providers_description": "连接 provider 并管理 {workspaceName} 的鉴权。",
  "settings.models": "模型",
  "settings.models_description": "选择默认模型，以及在选择器中展示哪些模型。",
  "settings.notifications": "通知",
  "settings.notifications_description": "管理 macOS 通知权限，以及哪些后台事件应该提醒你。",
  "settings.general": "通用",
  "settings.general_description": "把高价值的应用和运行时控制放在手边。",
  "settings.theme": "主题",
  "settings.theme.system": "跟随系统",
  "settings.theme.system_description": "跟随操作系统的外观设置",
  "settings.theme.light": "浅色",
  "settings.theme.light_description": "始终使用浅色主题",
  "settings.theme.dark": "深色",
  "settings.theme.dark_description": "始终使用深色主题",
  "settings.connected_providers": "已连接的 Providers",
  "settings.none": "无",
  "settings.discovered_skills": "已发现技能",
  "settings.model_scope": "模型设置范围",
  "settings.model_scope_description": "选择模型默认值是全局生效还是按仓库生效。",
  "settings.model_scope.app_global": "应用全局",
  "settings.model_scope.per_repo": "按仓库",
  "settings.skill_slash_commands": "启用技能 Slash 命令",
  "settings.skill_slash_commands_description": "让技能 Slash 命令在输入框中始终可用。",
  "settings.integrated_terminal_shell": "集成终端 Shell",
  "settings.integrated_terminal_shell_description": "留空则使用你的默认登录 Shell。",
  "settings.shortcuts": "快捷键",
  "settings.shortcuts.new_thread": "新线程",
  "settings.shortcuts.open_settings": "打开设置",
  "settings.shortcuts.toggle_terminal": "切换终端",
  "settings.shortcuts.new_terminal_tab": "新终端标签页",
  "settings.shortcuts.send_message": "发送消息",
  "settings.shortcuts.new_line": "换行",
  "settings.notifications.system": "系统",
  "settings.notifications.system_description": "是否允许 pi-gui 显示桌面通知，完全由 macOS 决定。",
  "settings.notifications.access": "macOS 通知权限",
  "settings.notifications.turn_on": "开启通知",
  "settings.notifications.ask_now": "当活动工作首次切到后台时，pi-gui 会向 macOS 申请权限。你也可以现在就申请。",
  "settings.notifications.denied_recovery": "macOS 已为 pi-gui 关闭通知。打开系统设置后可重新启用。",
  "settings.notifications.ask_macos": "向 macOS 申请",
  "settings.notifications.open_system_settings": "打开系统设置",
  "settings.notifications.in_app_alerts": "应用内提醒",
  "settings.notifications.in_app_alerts_description": "选择在 macOS 已授予权限后，哪些后台事件应该尝试通知你。",
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
  "settings.notifications.desc.granted": "macOS 允许 pi-gui 为后台线程更新显示桌面通知。",
  "settings.notifications.desc.denied": "macOS 已为 pi-gui 关闭通知。请到系统设置中重新开启，以接收后台完成提醒。",
  "settings.notifications.desc.default": "pi-gui 还没有向 macOS 申请桌面通知权限。",
  "settings.notifications.desc.unsupported": "当前系统不支持桌面通知。",
  "settings.notifications.desc.unknown": "正在检查 macOS 是否允许 pi-gui 显示通知。",
  "settings.providers.connected": "已连接",
  "settings.providers.connected_description": "已连接的内置 provider 会优先用于选择模型。",
  "settings.providers.none_connected": "还没有连接任何内置 provider。",
  "settings.providers.custom": "自定义 Providers",
  "settings.providers.custom_description": "从你自己的端点添加兼容 OpenAI、Anthropic 或 Google 的 provider。",
  "settings.providers.definitions": "Provider 定义",
  "settings.providers.definitions_description": "这些条目会写入 `models.json`，并在整个应用中可用。",
  "settings.providers.new_custom": "新建自定义 Provider",
  "settings.providers.edit": "编辑",
  "settings.providers.delete": "删除",
  "settings.providers.none_custom": "还没有自定义 provider。",
  "settings.providers.edit_custom": "编辑自定义 Provider",
  "settings.providers.add_custom": "添加自定义 Provider",
  "settings.providers.custom_id": "自定义 Provider ID",
  "settings.providers.custom_id_placeholder": "Provider ID，例如 my-proxy",
  "settings.providers.custom_display_name": "自定义 Provider 显示名",
  "settings.providers.custom_display_name_placeholder": "可选显示名",
  "settings.providers.custom_api": "自定义 Provider API",
  "settings.providers.custom_base_url": "自定义 Provider Base URL",
  "settings.providers.custom_base_url_placeholder": "Base URL",
  "settings.providers.custom_api_key": "自定义 Provider API Key",
  "settings.providers.custom_api_key_placeholder": "可选 API Key",
  "settings.providers.custom_model_ids": "自定义 Provider 模型 ID",
  "settings.providers.custom_model_ids_placeholder": "每行一个模型 ID\n例如：\ngpt-4.1\ngpt-4o-mini",
  "settings.providers.cancel_edit": "取消编辑",
  "settings.providers.save_provider": "保存 Provider",
  "settings.providers.add_provider": "添加 Provider",
  "settings.providers.sign_in": "登录",
  "settings.providers.sign_in_description": "支持 OAuth 的 provider 可以直接在桌面应用中登录。",
  "settings.providers.all": "全部 Providers",
  "settings.providers.all_description": "浏览完整的 provider 清单。",
  "settings.providers.browse_all": "浏览全部 Providers",
  "settings.providers.search": "搜索 Providers",
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
