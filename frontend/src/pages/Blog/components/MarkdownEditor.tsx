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

const MARKDOWN_PATTERNS = {
  heading: /^#{1,6}\s/m,
  list: /^[*+-]\s|^\d+\.\s/m,
  inline: /(\*\*.*\*\*|__.*__|`.*`|\[.*\]\(.*\))/m,
} as const;

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

function isMarkdownContent(text: string): boolean {
  return (
    MARKDOWN_PATTERNS.heading.test(text) ||
    MARKDOWN_PATTERNS.list.test(text) ||
    (MARKDOWN_PATTERNS.inline.test(text) && text.length > 20)
  );
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<MDXEditorMethods>(null);
  const previousMarkdownRef = useRef("");

  const resolvedTheme = useResolvedTheme();
  const cmTheme = useCodeMirrorTheme(resolvedTheme);
  const cmExtensions = useMemo(() => [cmTheme], [cmTheme]);

  useEffect(() => {
    previousMarkdownRef.current = value;
  }, [value]);

  useEffect(() => {
    setEditorKey((prev) => prev + 1);
  }, [resolvedTheme]);

  useEffect(() => {
    if (previousMarkdownRef.current && editorKey > 0) {
      onChange(previousMarkdownRef.current);
    }
  }, [editorKey, onChange]);

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
    <div onPaste={handlePaste}>
      <MDXEditor
        key={editorKey}
        ref={editorRef}
        className="focus:outline-none"
        contentEditableClassName="prose min-h-[700px] min-w-[90%]"
        markdown={value}
        onChange={onChange}
        plugins={editorPlugins}
      />
    </div>
  );
}
