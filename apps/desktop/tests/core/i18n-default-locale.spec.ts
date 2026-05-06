import { expect, test } from "@playwright/test";
import { launchDesktop, makeUserDataDir, makeWorkspace, waitForWorkspaceByPath } from "../helpers/electron-app";

test("defaults the desktop UI to Chinese when no English override is provided", async () => {
  test.setTimeout(60_000);
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("i18n-default-locale-workspace");
  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
    envOverrides: {
      PI_APP_LOCALE: "zh-CN",
    },
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspacePath);

    await expect(window.getByRole("button", { name: "新线程", exact: true })).toBeVisible();
    await expect(window.getByRole("button", { name: "技能", exact: true })).toBeVisible();
    await expect(window.getByRole("button", { name: "设置", exact: true })).toBeVisible();
  } finally {
    await harness.close();
  }
});
