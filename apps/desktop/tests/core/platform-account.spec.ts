import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  desktopShortcut,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
  seedAgentDir,
} from "../helpers/electron-app";

test("platform account login gates app usage and provisions feidu provider defaults", async () => {
  test.setTimeout(60_000);
  const userDataDir = await makeUserDataDir();
  const agentDir = join(userDataDir, "agent");
  const workspacePath = await makeWorkspace("platform-account-workspace");
  await seedAgentDir(agentDir, {
    withOpenAiAuth: false,
    withDefaultModel: false,
    enabledModels: [],
  });

  const harness = await launchDesktop(userDataDir, {
    agentDir,
    initialWorkspaces: [workspacePath],
    scrubProviderEnv: true,
    testMode: "background",
    envOverrides: {
      PI_APP_TEST_PLATFORM_ACCOUNT_INITIAL_AUTH: "0",
    },
  });

  try {
    const window = await harness.firstWindow();
    await expect(window.getByTestId("platform-login-gate")).toBeVisible();
    await expect(window.getByTestId("new-thread-composer")).toHaveCount(0);

    await window.getByRole("button", { name: "Sign in with DingTalk" }).click();
    await expect(window.getByTestId("platform-login-gate")).toHaveCount(0);

    await window.getByRole("button", { name: "New thread", exact: true }).first().click();
    await expect(window.getByTestId("new-thread-composer")).toBeVisible();

    await expect(window.getByTestId("platform-account-avatar")).toBeVisible();
    await window.getByTestId("platform-account-avatar").click();
    await expect(window.getByTestId("settings-surface")).toBeVisible();
    await expect(window.locator(".view-header__title")).toHaveText("Profile");
    await expect(window.getByText("icepie", { exact: true })).toHaveCount(2);
    await expect(window.getByText("d6lrrpbo2bn49oog13eg", { exact: true })).toBeVisible();
    await expect(window.getByText("icepie.dev@gmail.com", { exact: true })).toBeVisible();
    await expect(window.getByText("16670151612", { exact: true })).toBeVisible();
    await expect(window.getByRole("button", { name: "Log out" })).toBeVisible();

    await window.keyboard.press(desktopShortcut(","));
    await expect(window.getByTestId("settings-surface")).toBeVisible();
    await window.getByRole("button", { name: "Providers", exact: true }).click();
    await expect(window.locator(".view-header__title")).toHaveText("Providers");
    await expect(window.getByTestId("custom-provider-row-feidu")).toContainText("openai-completions");
    await expect(window.getByTestId("custom-provider-row-feidu")).toContainText("feidu-chat");

    await window.getByRole("button", { name: "Models", exact: true }).click();
    await expect(window.locator(".view-header__title")).toHaveText("Models");
    await expect(window.getByLabel("Default model")).toContainText("feidu · feidu-chat");

    const modelsJson = JSON.parse(await readFile(join(agentDir, "models.json"), "utf8"));
    expect(modelsJson).toMatchObject({
      providers: {
        feidu: {
          api: "openai-completions",
          baseUrl: "https://ai-api.singzer.cn/v1",
          apiKey: "sk-test-platform-user-token",
          models: [{ id: "feidu-chat" }, { id: "feidu-coder" }],
        },
      },
    });
    const settingsJson = JSON.parse(await readFile(join(agentDir, "settings.json"), "utf8"));
    expect(settingsJson).toMatchObject({
      defaultProvider: "feidu",
      defaultModel: "feidu-chat",
      enabledModels: ["feidu/feidu-chat", "feidu/feidu-coder"],
    });
  } finally {
    await harness.close();
  }
});
