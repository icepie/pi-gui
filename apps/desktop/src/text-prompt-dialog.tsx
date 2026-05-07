import { useEffect, useState } from "react";
import type { TextPromptRequest } from "./ipc";
import { UIDialog } from "./ui";
import { t } from "./i18n";

interface TextPromptDialogProps {
  readonly request: TextPromptRequest | null;
  readonly onRespond: (requestId: string, value: string | null) => void;
}

export function TextPromptDialog({ request, onRespond }: TextPromptDialogProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(request?.placeholder ?? "");
  }, [request]);

  if (!request) {
    return null;
  }

  const handleSubmit = () => {
    onRespond(request.requestId, value);
  };

  return (
    <UIDialog open onClose={() => onRespond(request.requestId, null)} title={request.message} testId="text-prompt-dialog">
      <input
        autoFocus
        className="settings-search text-prompt-dialog__input"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="confirm-dialog__actions">
        <button className="button button--secondary" type="button" onClick={() => onRespond(request.requestId, null)}>
          {t("dialog.cancel")}
        </button>
        <button className="button button--primary" type="button" onClick={handleSubmit}>
          {t("common.save")}
        </button>
      </div>
    </UIDialog>
  );
}
