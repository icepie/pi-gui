import { UIDialog } from "./ui";
import type { AppNoticeRequest } from "./ipc";
import { t } from "./i18n";

export interface ConfirmDialogRequest {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly tone?: "default" | "danger";
  readonly onConfirm: () => void;
}

interface ConfirmDialogProps {
  readonly request: ConfirmDialogRequest | null;
  readonly onClose: () => void;
}

export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  if (!request) {
    return null;
  }

  const handleConfirm = () => {
    onClose();
    request.onConfirm();
  };

  return (
    <UIDialog open onClose={onClose} title={request.title} testId="confirm-dialog">
      <p className="confirm-dialog__body">{request.body}</p>
      <div className="confirm-dialog__actions">
        <button className="button button--secondary" type="button" onClick={onClose}>
          {request.cancelLabel}
        </button>
        <button
          className={`button ${request.tone === "danger" ? "button--danger" : "button--primary"}`}
          type="button"
          onClick={handleConfirm}
        >
          {request.confirmLabel}
        </button>
      </div>
    </UIDialog>
  );
}

interface NoticeDialogProps {
  readonly request: AppNoticeRequest | null;
  readonly onClose: (requestId: string) => void;
}

export function NoticeDialog({ request, onClose }: NoticeDialogProps) {
  if (!request) {
    return null;
  }

  return (
    <UIDialog open onClose={() => onClose(request.requestId)} title={request.title} testId="notice-dialog">
      <p className="confirm-dialog__body">{request.message}</p>
      {request.detail ? <p className="confirm-dialog__detail">{request.detail}</p> : null}
      <div className="confirm-dialog__actions">
        <button className="button button--primary" type="button" onClick={() => onClose(request.requestId)}>
          {t("dialog.ok")}
        </button>
      </div>
    </UIDialog>
  );
}
