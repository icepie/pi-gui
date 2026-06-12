"use strict";

const childProcess = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const originalLoad = Module._load;
const CLIPBOARD_NATIVE_PACKAGES = {
  "darwin-arm64": "@mariozechner/clipboard-darwin-arm64",
  "darwin-x64": "@mariozechner/clipboard-darwin-x64",
  "linux-arm64": "@mariozechner/clipboard-linux-arm64-gnu",
  "linux-x64": "@mariozechner/clipboard-linux-x64-gnu",
  "win32-arm64": "@mariozechner/clipboard-win32-arm64-msvc",
  "win32-x64": "@mariozechner/clipboard-win32-x64-msvc",
};
const CLIPBOARD_NATIVE_PACKAGE_PREFIX = "@mariozechner/clipboard-";

Module._load = function patchedLoad(request, parent, isMain) {
  const exports = originalLoad.apply(this, arguments);
  patchNodeModuleCollectorIndex(exports);
  patchNodeModulesCollector(exports);
  return exports;
};

function patchNodeModuleCollectorIndex(exports) {
  if (!exports?.PM || !exports.getCollectorByPackageManager || exports.__piGuiCollectorIndexPatched) {
    return;
  }

  const originalGetCollectorByPackageManager = exports.getCollectorByPackageManager;
  exports.getCollectorByPackageManager = function patchedGetCollectorByPackageManager(pm, rootDir, tempDirManager) {
    if (pm === exports.PM.PNPM && process.env.PI_APP_ELECTRON_BUILDER_USE_TRAVERSAL === "1") {
      return originalGetCollectorByPackageManager.call(this, exports.PM.TRAVERSAL, rootDir, tempDirManager);
    }
    return originalGetCollectorByPackageManager.call(this, pm, rootDir, tempDirManager);
  };
  exports.__piGuiCollectorIndexPatched = true;
}

function patchNodeModulesCollector(exports) {
  const collector = exports?.NodeModulesCollector;
  if (!collector?.prototype || collector.prototype.__piGuiCollectorPatched) {
    return;
  }

  collector.prototype.__piGuiCollectorPatched = true;
  const originalGetNodeModules = collector.prototype.getNodeModules;
  const originalStreamCollectorCommandToFile = collector.prototype.streamCollectorCommandToFile;

  collector.prototype.getNodeModules = async function patchedGetNodeModules(options) {
    const result = await originalGetNodeModules.call(this, options);
    pruneTargetNativeOptionalPackages(result?.nodeModules);
    return result;
  };

  collector.prototype.streamCollectorCommandToFile = async function patchedStreamCollectorCommandToFile(
    command,
    args,
    cwd,
    tempOutputFile,
  ) {
    if (!shouldUsePatchedCollector(command, args)) {
      return originalStreamCollectorCommandToFile.call(this, command, args, cwd, tempOutputFile);
    }

    return streamCommandToFile(command, args, cwd, tempOutputFile);
  };
}

patchAsyncTaskManager(require("builder-util/out/asyncTaskManager"));

function shouldUsePatchedCollector(command, args) {
  const commandName = String(command).split(/[\\/]/).pop();
  return commandName === "pnpm" && args.includes("list") && args.includes("--json");
}

function pruneTargetNativeOptionalPackages(nodeModules) {
  if (!Array.isArray(nodeModules)) {
    return;
  }

  const keepClipboardPackage = CLIPBOARD_NATIVE_PACKAGES[`${process.env.PI_APP_PACKAGE_PLATFORM}-${process.env.PI_APP_PACKAGE_ARCH}`];
  if (!keepClipboardPackage) {
    return;
  }

  pruneDependencyList(nodeModules, (dependency) => {
    if (!dependency?.name?.startsWith(CLIPBOARD_NATIVE_PACKAGE_PREFIX)) {
      return true;
    }
    return dependency.name === keepClipboardPackage;
  });
}

function pruneDependencyList(dependencies, shouldKeep) {
  for (let index = dependencies.length - 1; index >= 0; index -= 1) {
    const dependency = dependencies[index];
    if (!shouldKeep(dependency)) {
      dependencies.splice(index, 1);
      continue;
    }
    if (Array.isArray(dependency.dependencies)) {
      pruneDependencyList(dependency.dependencies, shouldKeep);
    }
  }
}

async function streamCommandToFile(command, args, cwd, tempOutputFile) {
  const outStream = fs.createWriteStream(tempOutputFile);
  const child = childProcess.spawn(command, args, {
    cwd,
    env: { COREPACK_ENABLE_STRICT: "0", ...process.env },
    shell: process.platform === "win32",
  });

  let stderr = "";
  child.stdout.pipe(outStream);
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const [code] = await Promise.race([
    once(child, "close"),
    once(child, "error").then(([error]) => {
      throw error;
    }),
  ]);

  if (code !== 0) {
    outStream.destroy();
    throw new Error(`Node module collector process exited with code ${code}:\n${stderr}`);
  }

  await Promise.race([
    once(outStream, "finish"),
    once(outStream, "error").then(([error]) => {
      throw error;
    }),
  ]);

  const file = await fs.promises.readFile(tempOutputFile, "utf8");
  if (file.trim().length === 0) {
    throw new Error(`Node module collector produced an empty output file: ${tempOutputFile}`);
  }
  try {
    JSON.parse(file);
  } catch (error) {
    throw new Error(`Node module collector produced invalid JSON at ${path.basename(tempOutputFile)}: ${error.message}`);
  }
}

function patchAsyncTaskManager(exports) {
  const AsyncTaskManager = exports?.AsyncTaskManager;
  if (!AsyncTaskManager?.prototype || AsyncTaskManager.prototype.__piGuiAwaitPatched) {
    return;
  }

  AsyncTaskManager.prototype.__piGuiAwaitPatched = true;
  const originalAwaitTasks = AsyncTaskManager.prototype.awaitTasks;
  AsyncTaskManager.prototype.awaitTasks = async function patchedAwaitTasks() {
    let result = await originalAwaitTasks.call(this);
    await new Promise((resolve) => setImmediate(resolve));

    // electron-builder 26.x can enqueue follow-up work just after an awaitTasks
    // pass observes an empty queue. Give those continuations one tick to attach.
    for (let index = 0; index < 4 && this.tasks?.length > 0; index += 1) {
      const nextResult = await originalAwaitTasks.call(this);
      if (Array.isArray(result) && Array.isArray(nextResult)) {
        result = result.concat(nextResult);
      } else {
        result = nextResult;
      }
      await new Promise((resolve) => setImmediate(resolve));
    }

    return result;
  };
}
