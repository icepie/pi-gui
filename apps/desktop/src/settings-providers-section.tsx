import { useEffect, useMemo, useState } from "react";
import type {
  RuntimeCustomProviderConfig,
  RuntimeCustomProviderInput,
  RuntimeSnapshot,
} from "@pi-gui/session-driver/runtime-types";
import { filterProviders, ProviderRow, SettingsGroup } from "./settings-utils";
import { t } from "./i18n";

const CUSTOM_PROVIDER_APIS = [
  "openai-completions",
  "openai-responses",
  "anthropic-messages",
  "google-generative-ai",
] as const;

type CustomProviderApi = (typeof CUSTOM_PROVIDER_APIS)[number];

interface SettingsProvidersSectionProps {
  readonly runtime?: RuntimeSnapshot;
  readonly onLoginProvider: (providerId: string) => void;
  readonly onLogoutProvider: (providerId: string) => void;
  readonly onSetProviderApiKey: (
    providerId: string,
    config: {
      readonly apiKey: string;
      readonly baseUrl?: string;
    },
  ) => Promise<string | undefined>;
  readonly onRemoveProviderApiKey: (providerId: string) => Promise<string | undefined>;
  readonly onUpsertCustomProvider: (input: RuntimeCustomProviderInput) => Promise<string | undefined>;
  readonly onRemoveCustomProvider: (providerId: string) => Promise<string | undefined>;
}

interface CustomProviderDraft {
  readonly id: string;
  readonly displayName: string;
  readonly api: CustomProviderApi;
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly modelIds: string;
}

const EMPTY_CUSTOM_PROVIDER_DRAFT: CustomProviderDraft = {
  id: "",
  displayName: "",
  api: "openai-responses",
  baseUrl: "",
  apiKey: "",
  modelIds: "",
};

export function SettingsProvidersSection({
  runtime,
  onLoginProvider,
  onLogoutProvider,
  onSetProviderApiKey,
  onRemoveProviderApiKey,
  onUpsertCustomProvider,
  onRemoveCustomProvider,
}: SettingsProvidersSectionProps) {
  const [providerQuery, setProviderQuery] = useState("");
  const [apiKeyProviderId, setApiKeyProviderId] = useState<string | undefined>();
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [baseUrlDraft, setBaseUrlDraft] = useState("");
  const [apiKeyError, setApiKeyError] = useState<string | undefined>();
  const [apiKeyPending, setApiKeyPending] = useState(false);
  const [customProviderDraft, setCustomProviderDraft] = useState<CustomProviderDraft>(EMPTY_CUSTOM_PROVIDER_DRAFT);
  const [customProviderError, setCustomProviderError] = useState<string | undefined>();
  const [customProviderPending, setCustomProviderPending] = useState(false);
  const [editingCustomProviderId, setEditingCustomProviderId] = useState<string | undefined>();

  const providers = runtime?.providers ?? [];
  const connectedProviders = providers.filter((p) => p.hasAuth && !p.customProviderConfig);
  const oauthProviders = providers.filter((p) => p.oauthSupported);
  const customProviders = providers.filter((p) => p.customProviderConfig);
  const filteredProviders = filterProviders(providers, providerQuery);
  const apiKeyProvider = apiKeyProviderId ? providers.find((provider) => provider.id === apiKeyProviderId) : undefined;

  const customProviderMode = editingCustomProviderId ? "edit" : "create";
  const customProviderSubmitLabel =
    customProviderMode === "edit" ? t("settings.providers.save_provider") : t("settings.providers.add_provider");

  useEffect(() => {
    if (!apiKeyProvider) {
      setApiKeyDraft("");
      setBaseUrlDraft("");
      setApiKeyError(undefined);
      setApiKeyPending(false);
      return;
    }

    setApiKeyDraft("");
    setBaseUrlDraft(apiKeyProvider.customProviderConfig?.baseUrl ?? "");
    setApiKeyError(undefined);
    setApiKeyPending(false);
  }, [apiKeyProvider]);

  const customProviderById = useMemo(
    () => new Map(customProviders.map((provider) => [provider.id, provider] as const)),
    [customProviders],
  );

  const closeApiKeyDialog = () => {
    if (apiKeyPending) {
      return;
    }
    setApiKeyProviderId(undefined);
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyProvider) {
      return;
    }
    setApiKeyPending(true);
    setApiKeyError(undefined);
    const nextError = await onSetProviderApiKey(apiKeyProvider.id, {
      apiKey: apiKeyDraft.trim(),
      ...(baseUrlDraft.trim() ? { baseUrl: baseUrlDraft.trim() } : {}),
    });
    if (nextError) {
      setApiKeyPending(false);
      setApiKeyError(nextError);
      return;
    }
    setApiKeyProviderId(undefined);
  };

  const handleRemoveApiKey = async () => {
    if (!apiKeyProvider) {
      return;
    }
    setApiKeyPending(true);
    setApiKeyError(undefined);
    const nextError = await onRemoveProviderApiKey(apiKeyProvider.id);
    if (nextError) {
      setApiKeyPending(false);
      setApiKeyError(nextError);
      return;
    }
    setApiKeyProviderId(undefined);
  };

  const beginCreateCustomProvider = () => {
    setEditingCustomProviderId(undefined);
    setCustomProviderDraft(EMPTY_CUSTOM_PROVIDER_DRAFT);
    setCustomProviderError(undefined);
    setCustomProviderPending(false);
  };

  const beginEditCustomProvider = (providerId: string) => {
    const provider = customProviderById.get(providerId);
    const config = provider?.customProviderConfig;
    if (!provider || !config) {
      return;
    }
    setEditingCustomProviderId(providerId);
    setCustomProviderDraft({
      id: provider.id,
      displayName: config.displayName ?? "",
      api: config.api,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey ?? "",
      modelIds: config.modelIds.join("\n"),
    });
    setCustomProviderError(undefined);
    setCustomProviderPending(false);
  };

  const handleSaveCustomProvider = async () => {
    setCustomProviderPending(true);
    setCustomProviderError(undefined);
    const nextError = await onUpsertCustomProvider({
      id: customProviderDraft.id.trim(),
      displayName: customProviderDraft.displayName.trim() || undefined,
      api: customProviderDraft.api,
      baseUrl: customProviderDraft.baseUrl.trim(),
      apiKey: customProviderDraft.apiKey.trim() || undefined,
      modelIds: customProviderDraft.modelIds
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),
    });
    if (nextError) {
      setCustomProviderPending(false);
      setCustomProviderError(nextError);
      return;
    }
    beginCreateCustomProvider();
  };

  const handleRemoveCustomProvider = async (providerId: string) => {
    setCustomProviderPending(true);
    setCustomProviderError(undefined);
    const nextError = await onRemoveCustomProvider(providerId);
    if (nextError) {
      setCustomProviderPending(false);
      setCustomProviderError(nextError);
      return;
    }
    if (editingCustomProviderId === providerId) {
      beginCreateCustomProvider();
      return;
    }
    setCustomProviderPending(false);
  };

  return (
    <>
      <SettingsGroup title={t("settings.providers.connected")} description={t("settings.providers.connected_description")}>
        {connectedProviders.length > 0 ? (
          connectedProviders.map((provider) => (
            <ProviderRow
              key={provider.id}
              provider={provider}
              onLoginProvider={onLoginProvider}
              onLogoutProvider={onLogoutProvider}
              onConfigureApiKey={(entry) => setApiKeyProviderId(entry.id)}
            />
          ))
        ) : (
          <div className="settings-row">
            <span className="settings-row__description">{t("settings.providers.none_connected")}</span>
          </div>
        )}
      </SettingsGroup>

      <SettingsGroup title={t("settings.providers.custom")} description={t("settings.providers.custom_description")}>
        <div className="settings-row">
          <div className="settings-row__label">
            <div className="settings-row__title">{t("settings.providers.definitions")}</div>
            <div className="settings-row__description">{t("settings.providers.definitions_description")}</div>
          </div>
          <div className="settings-row__control">
            <button className="button button--secondary" type="button" onClick={beginCreateCustomProvider}>
              {t("settings.providers.new_custom")}
            </button>
          </div>
        </div>

        <div className="settings-list">
          {customProviders.length > 0 ? (
            customProviders.map((provider) => (
              <div className="settings-option" data-testid={`custom-provider-row-${provider.id}`} key={provider.id}>
                <span className="settings-option__title">{provider.customProviderConfig?.displayName ?? provider.id}</span>
                <span className="settings-option__meta">
                  {provider.id}
                  {provider.customProviderConfig ? ` · ${provider.customProviderConfig.api}` : ""}
                  {provider.customProviderConfig?.modelIds.length ? ` · ${provider.customProviderConfig.modelIds.join(", ")}` : ""}
                </span>
                <div className="settings-pill-row">
                  <button className="button button--secondary" type="button" onClick={() => beginEditCustomProvider(provider.id)}>
                    {t("settings.providers.edit")}
                  </button>
                  <button className="button button--secondary" type="button" onClick={() => void handleRemoveCustomProvider(provider.id)}>
                    {t("settings.providers.delete")}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="settings-row">
              <span className="settings-row__description">{t("settings.providers.none_custom")}</span>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3 className="settings-section__title">
            {customProviderMode === "edit" ? t("settings.providers.edit_custom") : t("settings.providers.add_custom")}
          </h3>
          <div className="settings-group">
            <input
              aria-label={t("settings.providers.custom_id")}
              className="settings-search"
              disabled={customProviderPending || customProviderMode === "edit"}
              placeholder={t("settings.providers.custom_id_placeholder")}
              value={customProviderDraft.id}
              onChange={(event) => setCustomProviderDraft((draft) => ({ ...draft, id: event.target.value }))}
            />
            <input
              aria-label={t("settings.providers.custom_display_name")}
              className="settings-search"
              disabled={customProviderPending}
              placeholder={t("settings.providers.custom_display_name_placeholder")}
              value={customProviderDraft.displayName}
              onChange={(event) => setCustomProviderDraft((draft) => ({ ...draft, displayName: event.target.value }))}
            />
            <select
              aria-label={t("settings.providers.custom_api")}
              className="settings-select"
              disabled={customProviderPending}
              value={customProviderDraft.api}
              onChange={(event) =>
                setCustomProviderDraft((draft) => ({ ...draft, api: event.target.value as CustomProviderApi }))
              }
            >
              {CUSTOM_PROVIDER_APIS.map((api) => (
                <option key={api} value={api}>
                  {api}
                </option>
              ))}
            </select>
            <input
              aria-label={t("settings.providers.custom_base_url")}
              className="settings-search"
              disabled={customProviderPending}
              placeholder={t("settings.providers.custom_base_url_placeholder")}
              type="url"
              value={customProviderDraft.baseUrl}
              onChange={(event) => setCustomProviderDraft((draft) => ({ ...draft, baseUrl: event.target.value }))}
            />
            <input
              aria-label={t("settings.providers.custom_api_key")}
              className="settings-search"
              disabled={customProviderPending}
              placeholder={t("settings.providers.custom_api_key_placeholder")}
              type="password"
              value={customProviderDraft.apiKey}
              onChange={(event) => setCustomProviderDraft((draft) => ({ ...draft, apiKey: event.target.value }))}
            />
            <textarea
              aria-label={t("settings.providers.custom_model_ids")}
              className="extension-dialog__editor"
              disabled={customProviderPending}
              placeholder={t("settings.providers.custom_model_ids_placeholder")}
              rows={6}
              value={customProviderDraft.modelIds}
              onChange={(event) => setCustomProviderDraft((draft) => ({ ...draft, modelIds: event.target.value }))}
            />
            {customProviderError ? <p className="extension-dialog__body settings-warning">{customProviderError}</p> : null}
            <div className="extension-dialog__actions">
              {customProviderMode === "edit" ? (
                <button className="button button--secondary" disabled={customProviderPending} type="button" onClick={beginCreateCustomProvider}>
                  {t("settings.providers.cancel_edit")}
                </button>
              ) : null}
              <button
                className="button"
                disabled={
                  customProviderPending
                  || !customProviderDraft.id.trim()
                  || !customProviderDraft.baseUrl.trim()
                  || !customProviderDraft.modelIds.trim()
                }
                type="button"
                onClick={() => void handleSaveCustomProvider()}
              >
                {customProviderSubmitLabel}
              </button>
            </div>
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title={t("settings.providers.sign_in")} description={t("settings.providers.sign_in_description")}>
        {oauthProviders.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            onLoginProvider={onLoginProvider}
            onLogoutProvider={onLogoutProvider}
            onConfigureApiKey={(entry) => setApiKeyProviderId(entry.id)}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title={t("settings.providers.all")} description={t("settings.providers.all_description")}>
        <details className="settings-disclosure">
          <summary className="settings-disclosure__summary">
            <span>{t("settings.providers.browse_all")}</span>
            <span>{filteredProviders.length}</span>
          </summary>
          <div className="settings-disclosure__body">
            <input
              aria-label={t("settings.providers.search")}
              className="settings-search"
              placeholder={t("settings.providers.search")}
              value={providerQuery}
              onChange={(event) => setProviderQuery(event.target.value)}
            />
            <div className="settings-list">
              {filteredProviders.map((provider) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  onLoginProvider={onLoginProvider}
                  onLogoutProvider={onLogoutProvider}
                  onConfigureApiKey={(entry) => setApiKeyProviderId(entry.id)}
                />
              ))}
            </div>
          </div>
        </details>
      </SettingsGroup>

      {apiKeyProvider ? (
        <ProviderApiKeyDialog
          provider={apiKeyProvider}
          draft={apiKeyDraft}
          baseUrlDraft={baseUrlDraft}
          error={apiKeyError}
          pending={apiKeyPending}
          onChangeDraft={setApiKeyDraft}
          onChangeBaseUrlDraft={setBaseUrlDraft}
          onClose={closeApiKeyDialog}
          onRemove={apiKeyProvider.authSource === "auth_file" ? handleRemoveApiKey : undefined}
          onSave={handleSaveApiKey}
        />
      ) : null}
    </>
  );
}

function ProviderApiKeyDialog({
  provider,
  draft,
  baseUrlDraft,
  error,
  pending,
  onChangeDraft,
  onChangeBaseUrlDraft,
  onClose,
  onRemove,
  onSave,
}: {
  readonly provider: RuntimeSnapshot["providers"][number];
  readonly draft: string;
  readonly baseUrlDraft: string;
  readonly error?: string;
  readonly pending: boolean;
  readonly onChangeDraft: (value: string) => void;
  readonly onChangeBaseUrlDraft: (value: string) => void;
  readonly onClose: () => void;
  readonly onRemove?: () => Promise<void>;
  readonly onSave: () => Promise<void>;
}) {
  const title = provider.authSource === "auth_file" ? t("settings.providers.manage_api_key") : t("settings.providers.set_api_key");
  const body =
    provider.authSource === "auth_file"
      ? t("settings.providers.replace_api_key", { providerName: provider.name })
      : t("settings.providers.save_local_api_key", { providerName: provider.name });

  return (
    <div className="extension-dialog-backdrop">
      <div className="extension-dialog" data-testid="provider-api-key-dialog">
        <div className="extension-dialog__title">{title}</div>
        <p className="extension-dialog__body">{body}</p>
        <input
          aria-label={t("settings.providers.provider_api_url", { providerName: provider.name })}
          className="settings-search"
          disabled={pending}
          placeholder={t("settings.providers.provider_api_url_placeholder")}
          type="url"
          value={baseUrlDraft}
          onChange={(event) => onChangeBaseUrlDraft(event.target.value)}
        />
        <input
          aria-label={t("settings.providers.provider_api_key", { providerName: provider.name })}
          autoFocus
          className="settings-search"
          disabled={pending}
          placeholder={t("settings.providers.provider_api_key_placeholder")}
          type="password"
          value={draft}
          onChange={(event) => onChangeDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
              return;
            }
            if (event.key === "Enter" && draft.trim()) {
              event.preventDefault();
              void onSave();
            }
          }}
        />
        {error ? <p className="extension-dialog__body settings-warning">{error}</p> : null}
        <div className="extension-dialog__actions">
          <button className="button button--secondary" disabled={pending} type="button" onClick={onClose}>
            {t("common.cancel")}
          </button>
          {onRemove ? (
            <button className="button button--secondary" disabled={pending} type="button" onClick={() => void onRemove()}>
              {t("settings.providers.remove_saved_key")}
            </button>
          ) : null}
          <button className="button" disabled={pending || draft.trim().length === 0} type="button" onClick={() => void onSave()}>
            {provider.authSource === "auth_file" ? t("common.save") : t("settings.providers.set")}
          </button>
        </div>
      </div>
    </div>
  );
}
