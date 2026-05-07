import { expect, test } from "@playwright/test";
import {
  createNamedThread,
  getDesktopState,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
} from "../helpers/electron-app";

test("deletes a hovered thread from the sidebar and removes it from persisted state", async () => {
  const userDataDir = await makeUserDataDir("pi-app-user-data-");
  const workspacePath = await makeWorkspace("delete-session-workspace");
  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await createNamedThread(window, "Thread one");
    await createNamedThread(window, "Thread two");
    await expect(window.locator(".topbar__session")).toHaveText("Thread two");

    const activeRow = window.locator(".session-list > .session-row").filter({ hasText: "Thread two" }).first();
    const deleteButton = activeRow.getByRole("button", { name: "Delete Thread two" });

    await activeRow.hover();
    await deleteButton.click();
    await window.getByTestId("confirm-dialog").getByRole("button", { name: "Delete" }).click();

    await expect(window.locator(".topbar__session")).toHaveText("Thread one");
    await expect(window.locator(".session-row", { hasText: "Thread two" })).toHaveCount(0);

    await expect
      .poll(async () => {
        const state = await getDesktopState(window);
        return state.workspaces[0]?.sessions.some((session) => session.title === "Thread two") ?? false;
      })
      .toBe(false);
  } finally {
    await harness.close();
  }
});
