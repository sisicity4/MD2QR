import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { liveMarkdown, liveMarkdownTheme } from "../editor/liveMarkdown";
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

- Headings, **bold**, *italic*
- Lists and \`inline code\`
- Links: https://example.com

> Markdown in. QR out.`;

export function MarkdownEditor({
  value,
  onChange,
  charCount,
  usage,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
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
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown(),
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

  // 外部から value が変わったら（サンプル挿入・クリア）エディタへ反映する
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

  return (
    <section className="pane editor-pane">
      <div className="pane-header">
        <h2>Markdown</h2>
        <div className="pane-actions">
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
      <div className="editor-host" ref={hostRef} />
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
