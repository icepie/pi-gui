import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { getRealAuthConfig, launchDesktop, makeUserDataDir, seedAgentDir } from "../helpers/electron-app";

test.skip(process.env.PI_APP_REAL_AUTH === "1", "This contract covers the default non-real-auth path.");

test("default desktop launches keep real-auth mode disabled and seed fake auth in a temp agent dir", async () => {
  const realAuth = getRealAuthConfig();
  expect(realAuth.enabled).toBe(false);
  expect(realAuth.skipReason).toContain("PI_APP_REAL_AUTH=1");
  expect(realAuth.skipReason).toContain("PI_APP_REAL_AUTH_SOURCE_DIR");

  const userDataDir = await makeUserDataDir();
  const harness = await launchDesktop(userDataDir, {
    testMode: "background",
    envOverrides: {
      PI_OFFLINE: "1",
      PI_APP_DISABLE_BUILTIN_MCP_ADAPTER: "0",
    },
  });

  try {
    await harness.firstWindow();

    const agentDir = await harness.electronApp.evaluate(() => process.env.PI_CODING_AGENT_DIR ?? "");
    expect(agentDir).toBe(join(userDataDir, "agent"));

    const auth = JSON.parse(await readFile(join(agentDir, "auth.json"), "utf8")) as {
      openai?: { key?: string };
    };
    expect(auth.openai?.key).toBe("test-openai-key");

    const settings = JSON.parse(await readFile(join(agentDir, "settings.json"), "utf8")) as {
      defaultProvider?: string;
      defaultModel?: string;
      packages?: readonly unknown[];
    };
    expect(settings).toMatchObject({
      defaultProvider: "openai",
      defaultModel: "gpt-5",
    });
    expect(settings.packages?.some(isBundledMcpAdapterPackage)).toBe(true);

    const mcp = JSON.parse(await readFile(join(agentDir, "mcp.json"), "utf8")) as {
      mcpServers?: Record<string, unknown>;
    };
    expect(mcp.mcpServers?.["chrome-devtools"]).toEqual({
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    });
  } finally {
    await harness.close();
  }
});

test("seeded agent dir keeps existing package settings and appends the built-in MCP adapter once", async () => {
  const userDataDir = await makeUserDataDir();
  const agentDir = join(userDataDir, "agent");
  const customPackage = "npm:@example/custom-extension";
  await seedAgentDir(agentDir);
  await writeFile(
    join(agentDir, "settings.json"),
    `${JSON.stringify(
      {
        packages: [customPackage],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const harness = await launchDesktop(userDataDir, {
    agentDir,
    testMode: "background",
    envOverrides: {
      PI_OFFLINE: "1",
      PI_APP_DISABLE_BUILTIN_MCP_ADAPTER: "0",
    },
  });

  try {
    await harness.firstWindow();
    const settings = JSON.parse(await readFile(join(agentDir, "settings.json"), "utf8")) as {
      packages?: readonly unknown[];
    };
    expect(settings.packages?.[0]).toBe(customPackage);
    expect(settings.packages?.slice(1).some(isBundledMcpAdapterPackage)).toBe(true);
  } finally {
    await harness.close();
  }
});

test("seeded agent dir migrates the legacy npm MCP adapter source to the bundled package", async () => {
  const userDataDir = await makeUserDataDir();
  const agentDir = join(userDataDir, "agent");
  await seedAgentDir(agentDir);
  await writeFile(
    join(agentDir, "settings.json"),
    `${JSON.stringify(
      {
        packages: ["npm:pi-mcp-adapter"],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const harness = await launchDesktop(userDataDir, {
    agentDir,
    testMode: "background",
    envOverrides: {
      PI_OFFLINE: "1",
      PI_APP_DISABLE_BUILTIN_MCP_ADAPTER: "0",
    },
  });

  try {
    await harness.firstWindow();
    const settings = JSON.parse(await readFile(join(agentDir, "settings.json"), "utf8")) as {
      packages?: readonly unknown[];
    };
    expect(settings.packages?.filter(isBundledMcpAdapterPackage)).toHaveLength(1);
    expect(settings.packages).not.toContain("npm:pi-mcp-adapter");
  } finally {
    await harness.close();
  }
});

test("seeded agent dir keeps a custom chrome-devtools MCP server definition", async () => {
  const userDataDir = await makeUserDataDir();
  const agentDir = join(userDataDir, "agent");
  const customChromeDevtoolsServer = {
    command: "custom-chrome-devtools",
    args: ["--remote-debugging-port=9222"],
  };
  await seedAgentDir(agentDir);
  await writeFile(
    join(agentDir, "mcp.json"),
    `${JSON.stringify(
      {
        mcpServers: {
          "chrome-devtools": customChromeDevtoolsServer,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const harness = await launchDesktop(userDataDir, {
    agentDir,
    testMode: "background",
    envOverrides: {
      PI_OFFLINE: "1",
      PI_APP_DISABLE_BUILTIN_MCP_ADAPTER: "0",
    },
  });

  try {
    await harness.firstWindow();
    const mcp = JSON.parse(await readFile(join(agentDir, "mcp.json"), "utf8")) as {
      mcpServers?: Record<string, unknown>;
    };
    expect(mcp.mcpServers?.["chrome-devtools"]).toEqual(customChromeDevtoolsServer);
  } finally {
    await harness.close();
  }
});

test("can disable the built-in chrome-devtools MCP server seed", async () => {
  const userDataDir = await makeUserDataDir();
  const agentDir = join(userDataDir, "agent");
  await seedAgentDir(agentDir);

  const harness = await launchDesktop(userDataDir, {
    agentDir,
    testMode: "background",
    envOverrides: {
      PI_OFFLINE: "1",
      PI_APP_DISABLE_BUILTIN_MCP_ADAPTER: "0",
      PI_APP_DISABLE_BUILTIN_CHROME_DEVTOOLS_MCP: "1",
    },
  });

  try {
    await harness.firstWindow();
    const mcp = await readOptionalJsonFileRecord(join(agentDir, "mcp.json"));
    expect(mcp.mcpServers?.["chrome-devtools"]).toBeUndefined();
  } finally {
    await harness.close();
  }
});

function isBundledMcpAdapterPackage(entry: unknown): boolean {
  if (typeof entry !== "string") {
    return false;
  }
  const source = entry.replace(/\\/g, "/");
  return source.endsWith("/pi-packages/pi-mcp-adapter") || source.endsWith("/node_modules/pi-mcp-adapter");
}

async function readOptionalJsonFileRecord(filePath: string): Promise<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8"));
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
