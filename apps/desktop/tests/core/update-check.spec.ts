import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { desktopShortcut, launchDesktop, makeUserDataDir, makeWorkspace } from "../helpers/electron-app";

function assetNameForPlatform(): string {
  if (process.platform === "darwin") {
    return process.arch === "arm64" ? "pi-fit-9.9.9-arm64.dmg" : "pi-fit-9.9.9-x64.dmg";
  }
  if (process.platform === "win32") {
    return process.arch === "arm64" ? "pi-fit-9.9.9-arm64-setup.exe" : "pi-fit-9.9.9-x64-setup.exe";
  }
  return process.arch === "arm64" ? "pi-fit-9.9.9-arm64.AppImage" : "pi-fit-9.9.9-x64.AppImage";
}

async function readOpenExternalLog(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

test("checks for updates and opens the matching package download in the browser", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("update-check-workspace");
  const openExternalLogPath = join(userDataDir, "open-external.log");
  const assetName = assetNameForPlatform();
  const downloadUrl = `https://github.com/icepie/pi-gui/releases/download/v9.9.9/${assetName}`;

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
    envOverrides: {
      PI_APP_TEST_FAILED_PROXY_PREFIXES: "https://mirror.ghproxy.com/",
      PI_APP_TEST_OPEN_EXTERNAL_LOG_PATH: openExternalLogPath,
      PI_APP_TEST_RELEASES_JSON: JSON.stringify([
        {
          tag_name: "v9.9.9",
          html_url: "https://github.com/icepie/pi-gui/releases/tag/v9.9.9",
          draft: false,
          assets: [
            {
              name: "latest-mac.yml",
              browser_download_url: "https://github.com/icepie/pi-gui/releases/download/v9.9.9/latest-mac.yml",
            },
            {
              name: assetName,
              browser_download_url: downloadUrl,
            },
          ],
        },
      ]),
    },
  });

  try {
    const window = await harness.firstWindow();
    await window.keyboard.press(desktopShortcut(","));
    await expect(window.getByTestId("settings-surface")).toBeVisible();
    await window.getByRole("button", { name: "General", exact: true }).click();
    await window.getByRole("button", { name: "Check for Updates", exact: true }).click();

    await expect.poll(() => readOpenExternalLog(openExternalLogPath), { timeout: 5_000 }).toContain(downloadUrl);
  } finally {
    await harness.close();
  }
});

test("retries configured GitHub proxy prefixes before opening the update download", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("update-check-proxy-workspace");
  const openExternalLogPath = join(userDataDir, "open-external.log");
  const assetName = assetNameForPlatform();
  const downloadUrl = `https://github.com/icepie/pi-gui/releases/download/v9.9.9/${assetName}`;
  const failedProxy = "https://failed-gh-proxy.example/";
  const workingProxy = "https://working-gh-proxy.example/";

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
    envOverrides: {
      PI_APP_GITHUB_PROXY: `${failedProxy},${workingProxy}`,
      PI_APP_TEST_FAILED_PROXY_PREFIXES: failedProxy,
      PI_APP_TEST_OPEN_EXTERNAL_LOG_PATH: openExternalLogPath,
      PI_APP_TEST_RELEASES_JSON: JSON.stringify([
        {
          tag_name: "v9.9.9",
          html_url: "https://github.com/icepie/pi-gui/releases/tag/v9.9.9",
          draft: false,
          assets: [
            {
              name: assetName,
              browser_download_url: downloadUrl,
            },
          ],
        },
      ]),
    },
  });

  try {
    const window = await harness.firstWindow();
    await window.keyboard.press(desktopShortcut(","));
    await expect(window.getByTestId("settings-surface")).toBeVisible();
    await window.getByRole("button", { name: "General", exact: true }).click();
    await window.getByRole("button", { name: "Check for Updates", exact: true }).click();

    await expect.poll(() => readOpenExternalLog(openExternalLogPath), { timeout: 5_000 }).toContain(`${workingProxy}${downloadUrl}`);
  } finally {
    await harness.close();
  }
});

test("uses bundled GitHub proxy prefixes for update downloads by default", async () => {
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("update-check-default-proxy-workspace");
  const openExternalLogPath = join(userDataDir, "open-external.log");
  const assetName = assetNameForPlatform();
  const downloadUrl = `https://github.com/icepie/pi-gui/releases/download/v9.9.9/${assetName}`;
  const fallbackProxy = "https://mirror.ghproxy.com/";

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
    envOverrides: {
      PI_APP_TEST_FAILED_PROXY_PREFIXES: "https://gh-proxy.com/",
      PI_APP_TEST_OPEN_EXTERNAL_LOG_PATH: openExternalLogPath,
      PI_APP_TEST_RELEASES_JSON: JSON.stringify([
        {
          tag_name: "v9.9.9",
          html_url: "https://github.com/icepie/pi-gui/releases/tag/v9.9.9",
          draft: false,
          assets: [
            {
              name: assetName,
              browser_download_url: downloadUrl,
            },
          ],
        },
      ]),
    },
  });

  try {
    const window = await harness.firstWindow();
    await window.keyboard.press(desktopShortcut(","));
    await expect(window.getByTestId("settings-surface")).toBeVisible();
    await window.getByRole("button", { name: "General", exact: true }).click();
    await window.getByRole("button", { name: "Check for Updates", exact: true }).click();

    await expect.poll(() => readOpenExternalLog(openExternalLogPath), { timeout: 5_000 }).toContain(`${fallbackProxy}${downloadUrl}`);
  } finally {
    await harness.close();
  }
});
