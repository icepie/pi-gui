import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createNamedThread, launchDesktop, makeUserDataDir, makeWorkspace } from "../helpers/electron-app";

test("shows skills and settings surfaces from runtime data", async () => {
  test.setTimeout(60_000);
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("skills-settings-workspace");
  await mkdir(join(workspacePath, ".agents", "skills", "demo-skill"), { recursive: true });
  await writeFile(
    join(workspacePath, ".agents", "skills", "demo-skill", "SKILL.md"),
    `# Demo Skill

Use this skill when the user wants a short demo workflow.

## Workflow

1. Inspect the repo.
2. Summarize what changed.
`,
    "utf8",
  );

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await createNamedThread(window, "Skill test session");

    await window.getByRole("button", { name: "Skills", exact: true }).click();
    await expect(window.locator(".skills-view")).toBeVisible();
    await expect(window.getByTestId("skills-list")).toContainText("Demo Skill");
    await window.getByRole("button", { name: /Demo Skill/i }).click();
    await expect(window.locator(".skill-detail")).toContainText("/skill:demo-skill");

    await window.getByRole("button", { name: "Try", exact: true }).click();
    await expect(window.getByRole("button", { name: "Threads", exact: true })).toBeVisible();
    await expect(window.getByTestId("composer")).toHaveValue("/skill:demo-skill ");

    await window.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(window.locator(".settings-view")).toBeVisible();
    await expect(window.getByText("Notifications", { exact: true })).toBeVisible();
    await expect(window.locator(".settings-view")).toContainText("Enable skill slash commands");
    const skillCommandsToggle = window.getByRole("checkbox", { name: "Enable skill slash commands" });
    await expect(skillCommandsToggle).toBeChecked();
    await skillCommandsToggle.click();

    await window.getByRole("button", { name: "Back to app", exact: true }).click();
    const composer = window.getByTestId("composer");
    await composer.fill("/skill");
    await expect(window.getByTestId("slash-menu")).toHaveCount(0);

    await window.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(skillCommandsToggle).not.toBeChecked();
    await skillCommandsToggle.click();
    await window.getByRole("button", { name: "Back to app", exact: true }).click();
    await composer.fill("/skill");
    const skillOptionsMenu = window.getByTestId("slash-options-menu");
    await expect(skillOptionsMenu).toContainText("Skill");
    await expect(skillOptionsMenu).toContainText("Demo Skill");
    await composer.press("Enter");
    await expect(composer).toHaveValue("/skill:demo-skill ");
  } finally {
    await harness.close();
  }
});

test("installs a skill from the built-in SkillHub source", async () => {
  test.setTimeout(60_000);
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("skillhub-install-workspace");

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
    envOverrides: {
      PI_APP_TEST_SKILLHUB_FIXTURE: "1",
    },
  });

  try {
    const window = await harness.firstWindow();
    await createNamedThread(window, "SkillHub install session");

    await window.getByRole("button", { name: "Skills", exact: true }).click();
    await expect(window.locator(".skills-view")).toBeVisible();
    await expect(window.getByTestId("skillhub-list")).toContainText("Hub Demo");

    await window.getByRole("button", { name: "Install", exact: true }).click();
    await expect(window.getByTestId("skills-list")).toContainText("Hub Demo");
    await window.getByRole("button", { name: /Hub Demo/i }).click();
    await expect(window.locator(".skill-detail")).toContainText("/skill:hub-demo");
  } finally {
    await harness.close();
  }
});

test("matches skill slash commands by skill name aliases", async () => {
  test.setTimeout(60_000);
  const userDataDir = await makeUserDataDir();
  const workspacePath = await makeWorkspace("skills-alias-workspace");
  await mkdir(join(workspacePath, ".agents", "skills", "plan-loop"), { recursive: true });
  await writeFile(
    join(workspacePath, ".agents", "skills", "plan-loop", "SKILL.md"),
    `# Plan Loop

Use this skill for complex or high-risk implementation work that needs plan-first execution.
`,
    "utf8",
  );

  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspacePath],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await createNamedThread(window, "Skill alias session");

    const composer = window.getByTestId("composer");
    const slashMenu = window.getByTestId("slash-menu");

    await composer.fill("/plan");
    await expect(slashMenu).toContainText("Plan Loop");
    await expect(slashMenu).toContainText("/skill:plan-loop");

    await composer.fill("/plan-loop");
    await expect(slashMenu).toContainText("Plan Loop");

    await composer.fill("/skill:plan-loop");
    await expect(slashMenu).toContainText("Plan Loop");
  } finally {
    await harness.close();
  }
});
