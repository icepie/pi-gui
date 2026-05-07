import materialIcons from "material-icon-theme/dist/material-icons.json";
import astroIconUrl from "material-icon-theme/icons/astro.svg?url";
import cIconUrl from "material-icon-theme/icons/c.svg?url";
import consoleIconUrl from "material-icon-theme/icons/console.svg?url";
import cppIconUrl from "material-icon-theme/icons/cpp.svg?url";
import csharpIconUrl from "material-icon-theme/icons/csharp.svg?url";
import cssIconUrl from "material-icon-theme/icons/css.svg?url";
import databaseIconUrl from "material-icon-theme/icons/database.svg?url";
import dockerIconUrl from "material-icon-theme/icons/docker.svg?url";
import fileIconUrl from "material-icon-theme/icons/file.svg?url";
import folderIconUrl from "material-icon-theme/icons/folder.svg?url";
import folderOpenIconUrl from "material-icon-theme/icons/folder-open.svg?url";
import goIconUrl from "material-icon-theme/icons/go.svg?url";
import hIconUrl from "material-icon-theme/icons/h.svg?url";
import hppIconUrl from "material-icon-theme/icons/hpp.svg?url";
import htmlIconUrl from "material-icon-theme/icons/html.svg?url";
import imageIconUrl from "material-icon-theme/icons/image.svg?url";
import javaIconUrl from "material-icon-theme/icons/java.svg?url";
import javascriptIconUrl from "material-icon-theme/icons/javascript.svg?url";
import jsonIconUrl from "material-icon-theme/icons/json.svg?url";
import kotlinIconUrl from "material-icon-theme/icons/kotlin.svg?url";
import lessIconUrl from "material-icon-theme/icons/less.svg?url";
import lockIconUrl from "material-icon-theme/icons/lock.svg?url";
import markdownIconUrl from "material-icon-theme/icons/markdown.svg?url";
import nixIconUrl from "material-icon-theme/icons/nix.svg?url";
import nodejsIconUrl from "material-icon-theme/icons/nodejs.svg?url";
import phpIconUrl from "material-icon-theme/icons/php.svg?url";
import pythonIconUrl from "material-icon-theme/icons/python.svg?url";
import reactIconUrl from "material-icon-theme/icons/react.svg?url";
import reactTsIconUrl from "material-icon-theme/icons/react_ts.svg?url";
import rubyIconUrl from "material-icon-theme/icons/ruby.svg?url";
import rustIconUrl from "material-icon-theme/icons/rust.svg?url";
import sassIconUrl from "material-icon-theme/icons/sass.svg?url";
import settingsIconUrl from "material-icon-theme/icons/settings.svg?url";
import svelteIconUrl from "material-icon-theme/icons/svelte.svg?url";
import svgIconUrl from "material-icon-theme/icons/svg.svg?url";
import terraformIconUrl from "material-icon-theme/icons/terraform.svg?url";
import tomlIconUrl from "material-icon-theme/icons/toml.svg?url";
import tsconfigIconUrl from "material-icon-theme/icons/tsconfig.svg?url";
import tuneIconUrl from "material-icon-theme/icons/tune.svg?url";
import typescriptIconUrl from "material-icon-theme/icons/typescript.svg?url";
import viteIconUrl from "material-icon-theme/icons/vite.svg?url";
import vueIconUrl from "material-icon-theme/icons/vue.svg?url";
import xmlIconUrl from "material-icon-theme/icons/xml.svg?url";
import yamlIconUrl from "material-icon-theme/icons/yaml.svg?url";
import zigIconUrl from "material-icon-theme/icons/zig.svg?url";

interface MaterialIconDefinition {
  readonly iconPath?: string;
}

interface MaterialIconTheme {
  readonly iconDefinitions: Record<string, MaterialIconDefinition>;
  readonly fileExtensions: Record<string, string>;
  readonly fileNames: Record<string, string>;
  readonly file: string;
  readonly folder: string;
  readonly folderExpanded: string;
}

const theme = materialIcons as MaterialIconTheme;

const iconUrls: Record<string, string> = {
  astro: astroIconUrl,
  c: cIconUrl,
  console: consoleIconUrl,
  cpp: cppIconUrl,
  csharp: csharpIconUrl,
  css: cssIconUrl,
  database: databaseIconUrl,
  docker: dockerIconUrl,
  file: fileIconUrl,
  folder: folderIconUrl,
  "folder-open": folderOpenIconUrl,
  go: goIconUrl,
  h: hIconUrl,
  hpp: hppIconUrl,
  html: htmlIconUrl,
  image: imageIconUrl,
  java: javaIconUrl,
  javascript: javascriptIconUrl,
  json: jsonIconUrl,
  kotlin: kotlinIconUrl,
  less: lessIconUrl,
  lock: lockIconUrl,
  markdown: markdownIconUrl,
  nix: nixIconUrl,
  nodejs: nodejsIconUrl,
  php: phpIconUrl,
  python: pythonIconUrl,
  react: reactIconUrl,
  react_ts: reactTsIconUrl,
  ruby: rubyIconUrl,
  rust: rustIconUrl,
  sass: sassIconUrl,
  settings: settingsIconUrl,
  svelte: svelteIconUrl,
  svg: svgIconUrl,
  terraform: terraformIconUrl,
  toml: tomlIconUrl,
  tsconfig: tsconfigIconUrl,
  tune: tuneIconUrl,
  typescript: typescriptIconUrl,
  vite: viteIconUrl,
  vue: vueIconUrl,
  xml: xmlIconUrl,
  yaml: yamlIconUrl,
  zig: zigIconUrl,
};

export function getMaterialFileIconUrl(fileName: string): string | undefined {
  const normalizedName = fileName.toLowerCase();
  const iconName =
    theme.fileNames[normalizedName] ??
    getExtensionCandidates(normalizedName)
      .map((extension) => theme.fileExtensions[extension])
      .find((candidate): candidate is string => Boolean(candidate)) ??
    theme.file;

  return getIconUrl(iconName);
}

export function getMaterialFolderIconUrl(expanded: boolean): string | undefined {
  return getIconUrl(expanded ? theme.folderExpanded : theme.folder);
}

function getExtensionCandidates(fileName: string): string[] {
  const parts = fileName.split(".");
  if (parts.length < 2) {
    return [fileName];
  }

  const candidates: string[] = [];
  for (let index = 1; index < parts.length; index += 1) {
    candidates.push(parts.slice(index).join("."));
  }
  return candidates;
}

function getIconUrl(iconName: string): string | undefined {
  const iconPath = theme.iconDefinitions[iconName]?.iconPath;
  if (!iconPath) {
    return undefined;
  }

  const iconFile = iconPath.split("/").pop();
  if (!iconFile) {
    return undefined;
  }

  return iconUrls[iconFile.replace(/\.svg$/, "")] ?? iconUrls.file;
}
