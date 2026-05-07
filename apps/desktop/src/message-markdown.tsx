import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlightLine, type HighlightTokenChild } from "./syntax-highlight";

const REMARK_PLUGINS = [remarkGfm];

function renderTokenChildren(children: readonly HighlightTokenChild[], keyPrefix: string): React.ReactNode[] {
  return children.map((child, i) => {
    if (typeof child === "string") {
      return child;
    }
    return (
      <span key={`${keyPrefix}-${i}`} className={child.className}>
        {renderTokenChildren(child.children, `${keyPrefix}-${i}`)}
      </span>
    );
  });
}

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const tokens = highlightLine(line, language);
        return (
          <span key={i}>
            {renderTokenChildren(tokens, `l${i}`)}
            {i < lines.length - 1 ? "\n" : null}
          </span>
        );
      })}
    </>
  );
}

const SUPPORTED_LANGUAGES = new Set([
  "typescript", "javascript", "json", "python", "bash",
  "go", "rust", "java", "css", "sql", "yaml", "xml", "html", "markdown",
  "c", "cpp",
  "ts", "tsx", "js", "jsx", "sh", "zsh",
]);

function resolveLanguage(lang: string | undefined): string | undefined {
  if (!lang) return undefined;
  const aliases: Record<string, string> = {
    ts: "typescript", tsx: "typescript",
    js: "javascript", jsx: "javascript",
    sh: "bash", zsh: "bash",
    yml: "yaml", htm: "html",
  };
  const resolved = aliases[lang] ?? lang;
  return SUPPORTED_LANGUAGES.has(resolved) ? resolved : undefined;
}

const MARKDOWN_COMPONENTS = {
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const langRaw = className?.replace(/^language-/, "");
    const code = String(children).replace(/\n$/, "");
    if (!className) {
      return <code>{code}</code>;
    }
    const language = resolveLanguage(langRaw);
    return (
      <code className={className}>
        {language ? <HighlightedCode code={code} language={language} /> : code}
      </code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => {
    return <pre>{children}</pre>;
  },
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  ),
} as const;

export function MessageMarkdown({ text }: { readonly text: string }) {
  return (
    <div className="message__content">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MARKDOWN_COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
