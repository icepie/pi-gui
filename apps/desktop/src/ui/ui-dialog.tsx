import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import type { KeyboardEventHandler, ReactNode, Ref } from "react";

interface UIDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly eyebrow?: string;
  readonly children: ReactNode;
  readonly testId?: string;
  readonly className?: string;
  readonly panelRef?: Ref<HTMLDivElement>;
  readonly onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  readonly "aria-label"?: string;
}

export function UIDialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  testId,
  className,
  panelRef,
  onKeyDown,
  ...rest
}: UIDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="ui-dialog-root" aria-label={rest["aria-label"]}>
      <DialogBackdrop transition className="ui-dialog-backdrop" />
      <div className="ui-dialog-container">
        <DialogPanel
          transition
          className={`ui-dialog ${className ?? ""}`}
          data-testid={testId}
          ref={panelRef}
          onKeyDown={onKeyDown}
        >
          {eyebrow || title ? (
            <div className="ui-dialog__header">
              {eyebrow ? <div className="ui-dialog__eyebrow">{eyebrow}</div> : null}
              {title ? <DialogTitle className="ui-dialog__title">{title}</DialogTitle> : null}
            </div>
          ) : null}
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
