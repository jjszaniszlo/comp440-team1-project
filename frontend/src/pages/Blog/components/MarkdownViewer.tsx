import { useTheme } from "@/components/theme-provider";
import { useMemo, useEffect, useRef } from "react";
import { githubLight as cmGithubLight } from "@fsegurai/codemirror-theme-github-light";
import { githubDark as cmGithubDark } from "@fsegurai/codemirror-theme-github-dark";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { EditorView } from "@codemirror/view";
import { EditorState, type Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";

const CODE_MIRROR_THEME = EditorView.theme({
  "&": { outline: "none", border: "none" },
  ".cm-scroller": { outline: "none", border: "none" },
});

function useResolvedTheme() {
  const { theme } = useTheme();
  return useMemo(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);
}

function useCodeMirrorTheme(resolvedTheme: string) {
  return useMemo(
    () => (resolvedTheme === "dark" ? cmGithubDark : cmGithubLight),
    [resolvedTheme]
  );
}

function getLanguageSupport(lang: string) {
  switch (lang) {
    case "javascript":
    case "js":
      return javascript();
    case "python":
      return python();
    case "css":
      return css();
    default:
      return javascript();
  }
}

interface CodeBlockProps {
  language: string;
  children: string;
  theme: Extension;
}

function CodeBlock({ language, children, theme }: CodeBlockProps) {
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!codeRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: children,
        extensions: [
          EditorView.editable.of(false),
          theme,
          getLanguageSupport(language),
          CODE_MIRROR_THEME,
        ],
      }),
      parent: codeRef.current,
    });

    return () => view.destroy();
  }, [children, language, theme]);

  return (
    <div
      ref={codeRef}
      className="rounded-lg overflow-hidden my-4 border-none"
    />
  );
}

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const resolvedTheme = useResolvedTheme();
  const cmTheme = useCodeMirrorTheme(resolvedTheme);

  const markdownComponents = useMemo<Components>(
    () => ({
      pre: (props) => <div className="not-prose">{props.children}</div>,
      code: (props) => {
        const { children, className } = props;
        const match = /language-(\w+)/.exec(className || "");

        if (!match) {
          return <code className={className}>{children}</code>;
        }

        return (
          <CodeBlock language={match[1]} theme={cmTheme}>
            {String(children)}
          </CodeBlock>
        );
      },
    }),
    [cmTheme]
  );

  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
