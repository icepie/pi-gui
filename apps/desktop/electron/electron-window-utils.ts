import type { BrowserWindow } from "electron";

export function canUseWindow(window: BrowserWindow | null | undefined): window is BrowserWindow {
  return Boolean(window) && !window!.isDestroyed();
}

export function canUseWebContents(window: BrowserWindow | null | undefined): window is BrowserWindow {
  return canUseWindow(window) && !window.webContents.isDestroyed() && !window.webContents.isCrashed();
}

export function showAndFocusWindow(window: BrowserWindow | null | undefined): void {
  if (!canUseWindow(window)) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }
  window.show();
  window.focus();
}
