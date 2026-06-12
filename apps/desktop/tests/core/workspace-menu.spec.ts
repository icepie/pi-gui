import { basename, join } from "node:path";
import { expect, test } from "@playwright/test";
import {
  assertExists,
  getDesktopState,
  launchDesktop,
  makeUserDataDir,
  makeWorkspace,
  waitForWorkspaceByPath,
} from "../helpers/electron-app";

test("adds the default Documents pi-fit workspace on first real startup", async () => {
  test.setTimeout(60_000);
  const userDataDir = await makeUserDataDir();
  const documentsRoot = await makeUserDataDir("pi-gui-documents-");
  const defaultWorkspacePath = join(documentsRoot, "pi-fit");
  const harness = await launchDesktop(userDataDir, {
    useSystemDefaultWorkspace: true,
    defaultWorkspaceDocumentsDir: documentsRoot,
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, defaultWorkspacePath);
    const state = await getDesktopState(window);
    const workspace = state.workspaces.find((entry) => entry.path === defaultWorkspacePath);
    assertExists(workspace, "Expected default workspace");
    expect(workspace.name).toBe("pi-fit");
    expect(state.selectedWorkspaceId).toBe(workspace.id);
  } finally {
    await harness.close();
  }
});

test("supports workspace rename and remove from the sidebar menu", async () => {
  test.setTimeout(60_000);
  const userDataDir = await makeUserDataDir();
  const workspaceA = await makeWorkspace("workspace-menu-a");
  const workspaceB = await makeWorkspace("workspace-menu-b");
  const harness = await launchDesktop(userDataDir, {
    initialWorkspaces: [workspaceA, workspaceB],
    testMode: "background",
  });

  try {
    const window = await harness.firstWindow();
    await waitForWorkspaceByPath(window, workspaceA);
    await waitForWorkspaceByPath(window, workspaceB);

    const state = await getDesktopState(window);
    const workspace = state.workspaces.find((entry) => entry.path === workspaceA);
    assertExists(workspace, "Expected first workspace");

    await window.getByRole("button", { name: `Workspace actions for ${basename(workspaceA)}` }).click();
    await expect(window.getByText("Open folder")).toBeVisible();
    await expect(window.getByText("Edit name")).toBeVisible();
    await expect(window.getByText("Remove")).toBeVisible();

    await window.getByText("Edit name").click();
    const renameInput = window.getByLabel(`Rename ${basename(workspaceA)}`);
    await renameInput.fill("Renamed workspace");
    await window.getByRole("button", { name: "Save" }).click();

    await expect.poll(async () => {
      const latest = await getDesktopState(window);
      return latest.workspaces.find((entry) => entry.id === workspace.id)?.name;
    }).toBe("Renamed workspace");

    await window.getByRole("button", { name: "Workspace actions for Renamed workspace" }).click();
    await window.getByText("Remove").click();
    await window.getByTestId("confirm-dialog").getByRole("button", { name: "Remove" }).click();

    await expect.poll(async () => {
      const latest = await getDesktopState(window);
      return latest.workspaces.some((entry) => entry.id === workspace.id);
    }).toBe(false);
  } finally {
    await harness.close();
  }
});
