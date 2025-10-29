import {
  headingsPlugin,
  imagePlugin,
  linkPlugin,
  listsPlugin,
  MDXEditor,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  InsertImage,
  InsertTable,
  ListsToggle,
  markdownShortcutPlugin,
  codeBlockPlugin,
  InsertCodeBlock,
  codeMirrorPlugin,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import { useTheme } from "@/components/theme-provider";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { githubLight as cmGithubLight } from "@fsegurai/codemirror-theme-github-light";
import { githubDark as cmGithubDark } from "@fsegurai/codemirror-theme-github-dark";
import ReactMarkdown, { type Components } from "react-markdown";
import { Button } from "@/components/ui/button";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { Input } from "@/components/ui/input";

const MARKDOWN_PATTERNS = {
  heading: /^#{1,6}\s/m,
  list: /^[\*\-\+]\s|^\d+\.\s/m,
  inline: /(\*\*.*\*\*|__.*__|`.*`|\[.*\]\(.*\))/m,
} as const;

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

function isMarkdownContent(text: string): boolean {
  return (
    MARKDOWN_PATTERNS.heading.test(text) ||
    MARKDOWN_PATTERNS.list.test(text) ||
    (MARKDOWN_PATTERNS.inline.test(text) && text.length > 20)
  );
}

interface CodeBlockProps {
  language: string;
  children: string;
  theme: any;
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

export default function CreateBlog() {
  const [mdText, setMdText] = useState("");
  const [savedMarkdown, setSavedMarkdown] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<MDXEditorMethods>(null);
  const previousMarkdownRef = useRef("");

  const resolvedTheme = useResolvedTheme();
  const cmTheme = useCodeMirrorTheme(resolvedTheme);
  const cmExtensions = useMemo(() => [cmTheme], [cmTheme]);

  useEffect(() => {
    previousMarkdownRef.current = mdText;
  }, [mdText]);

  useEffect(() => {
    setEditorKey((prev) => prev + 1);
  }, [resolvedTheme]);

  useEffect(() => {
    if (previousMarkdownRef.current && editorKey > 0) {
      setMdText(previousMarkdownRef.current);
    }
  }, [editorKey]);

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData("text/plain");
    if (!pastedText || !editorRef.current || !isMarkdownContent(pastedText))
      return;

    event.preventDefault();
    const current = editorRef.current.getMarkdown();
    editorRef.current.setMarkdown(
      current ? `${current}\n\n${pastedText}` : pastedText
    );
  }, []);

  const handleSave = useCallback(() => {
    const currentMarkdown = editorRef.current?.getMarkdown() || mdText;
    setSavedMarkdown(currentMarkdown);
    setMdText(currentMarkdown);
    setIsEditing(false);
  }, [mdText]);

  const handleEdit = useCallback(() => {
    setMdText(savedMarkdown);
    setIsEditing(true);
  }, [savedMarkdown]);

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

  const editorPlugins = useMemo(
    () => [
      headingsPlugin(),
      quotePlugin(),
      listsPlugin(),
      codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
      codeMirrorPlugin({
        codeBlockLanguages: {
          js: "JavaScript",
          css: "CSS",
          python: "Python",
          bash: "Bash",
        },
        codeMirrorExtensions: cmExtensions,
      }),
      diffSourcePlugin({
        viewMode: "rich-text",
        diffMarkdown: "",
        codeMirrorExtensions: cmExtensions,
      }),
      thematicBreakPlugin(),
      linkPlugin(),
      imagePlugin(),
      tablePlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: () => (
          <DiffSourceToggleWrapper>
            <BoldItalicUnderlineToggles />
            <BlockTypeSelect />
            <ListsToggle />
            <CreateLink />
            <InsertImage />
            <InsertTable />
            <ConditionalContents
              options={[
                {
                  when: (editor) => editor?.editorType === "codeblock",
                  contents: () => <ChangeCodeMirrorLanguage />,
                },
                {
                  fallback: () => <InsertCodeBlock />,
                },
              ]}
            />
          </DiffSourceToggleWrapper>
        ),
      }),
    ],
    [cmExtensions]
  );

  return (
    <div className="container mx-auto px-4 w-full">
      <div className="space-y-6">
        <Button onClick={isEditing ? handleSave : handleEdit}>
          {isEditing ? "Save" : "Edit"}
        </Button>
        <Input type="text" placeholder="Enter a subject" />
        <Input type="text" placeholder="Enter Tags" />
        {isEditing ? (
          <div onPaste={handlePaste}>
            <MDXEditor
              key={editorKey}
              ref={editorRef}
              className="focus:outline-none"
              contentEditableClassName="prose min-h-[700px] min-w-[90%]"
              markdown={mdText}
              onChange={setMdText}
              plugins={editorPlugins}
            />
          </div>
        ) : (
          <div className="prose min-h-[700px] min-w-[90%] border border-border rounded-lg p-4">
            <ReactMarkdown components={markdownComponents}>
              {savedMarkdown}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
