import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  markdown,
  markdownKeymap,
  pasteURLAsLink,
} from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { liveMarkdown, liveMarkdownTheme } from "../editor/liveMarkdown";
import {
  addBullet,
  addHeading,
  addQuote,
  addTask,
  insertLink,
  toggleBold,
  toggleInlineCode,
  toggleItalic,
  toggleStrike,
} from "../editor/commands";
import { UsageRing } from "./UsageRing";
import type { UsageInfo } from "../qr";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  charCount: number;
  usage: UsageInfo;
}

const SAMPLE = `# MarkQR

Write **Markdown** on the left.
It renders *as you type* — and turns into a QR code below.

- Headings, **bold**, *italic*, ~~strikethrough~~
- Lists and \`inline code\`
- [ ] a task to do
- [x] a task that's done

| Feature | Status |
| --- | --- |
| Live preview | ✅ |
| QR export | ✅ |

> Markdown in. QR out.`;

export function MarkdownEditor({
  value,
  onChange,
  charCount,
  usage,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  // onChange は再生成せずに最新を参照する
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // エディタは一度だけ生成する
  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([
            { key: "Mod-b", run: toggleBold },
            { key: "Mod-i", run: toggleItalic },
            { key: "Mod-k", run: insertLink },
            { key: "Mod-Shift-x", run: toggleStrike },
            ...markdownKeymap,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          markdown({ extensions: GFM }),
          pasteURLAsLink,
          EditorView.lineWrapping,
          placeholderExt("Start writing in Markdown…"),
          liveMarkdown,
          liveMarkdownTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // 初回マウント時のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部から value が変わったら（サンプル挿入・クリア・読み込み）反映する
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  const run = (cmd: (view: EditorView) => boolean) => {
    if (viewRef.current) cmd(viewRef.current);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // クリップボード不可時は無視
    }
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "markqr.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const readFile = (file: File) => {
    file.text().then((text) => onChange(text));
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && /\.(md|markdown|txt)$/i.test(file.name)) readFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (event.dataTransfer.types.includes("Files")) {
      event.preventDefault();
      setDragOver(true);
    }
  };

  return (
    <section className="pane editor-pane">
      <div className="pane-header">
        <h2>Markdown</h2>
        <div className="pane-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            onChange={handleFileInput}
            hidden
          />
          <button
            type="button"
            className="ghost-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Open
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={handleCopy}
            disabled={value.length === 0}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={handleDownload}
            disabled={value.length === 0}
          >
            .md
          </button>
          {value.length === 0 ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => onChange(SAMPLE)}
            >
              Sample
            </button>
          ) : (
            <button
              type="button"
              className="ghost-button"
              onClick={() => onChange("")}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="md-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" title="Bold (⌘B)" onClick={() => run(toggleBold)}>
          <b>B</b>
        </button>
        <button type="button" title="Italic (⌘I)" onClick={() => run(toggleItalic)}>
          <i>I</i>
        </button>
        <button
          type="button"
          title="Strikethrough (⌘⇧X)"
          onClick={() => run(toggleStrike)}
        >
          <s>S</s>
        </button>
        <button
          type="button"
          title="Inline code"
          onClick={() => run(toggleInlineCode)}
        >
          {"<>"}
        </button>
        <span className="md-toolbar-sep" />
        <button type="button" title="Heading" onClick={() => run(addHeading)}>
          H
        </button>
        <button type="button" title="List" onClick={() => run(addBullet)}>
          •
        </button>
        <button type="button" title="Task" onClick={() => run(addTask)}>
          ☐
        </button>
        <button type="button" title="Quote" onClick={() => run(addQuote)}>
          ❝
        </button>
        <button type="button" title="Link (⌘K)" onClick={() => run(insertLink)}>
          🔗
        </button>
      </div>

      <div
        className={`editor-host${dragOver ? " drag-over" : ""}`}
        ref={hostRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
      />
      <div className="editor-meta">
        <span className={`usage-text usage-${usage.level}`}>
          <span className="nowrap">{charCount.toLocaleString()} chars ·</span>{" "}
          <span className="nowrap">
            {usage.bytes.toLocaleString()} / {usage.max.toLocaleString()} bytes
          </span>
        </span>
        <UsageRing usage={usage} />
      </div>
    </section>
  );
}
