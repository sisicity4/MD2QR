import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { type Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";

/**
 * Obsidian風「ライブプレビュー」のための装飾拡張。
 *
 * 別ペインでプレビューする代わりに、エディタの中で書いた行をその場で整形表示する:
 * - 見出し・太字・斜体・インラインコード・引用に整形スタイルを当てる
 * - カーソルがない行では `#` `**` `` ` `` などの記号を隠す（編集中の行では表示）
 * - 箇条書きの `-` `*` `+` を中黒（•）に置き換える
 */

/** カーソル/選択が乗っている行では記号を隠さず生のmdを見せる（編集しやすさのため）。 */
class BulletWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-md-bullet";
    span.textContent = "•";
    return span;
  }
  ignoreEvent() {
    return false;
  }
}

const hide = Decoration.replace({});
const bullet = Decoration.replace({ widget: new BulletWidget() });

/** 隠すだけの記号ノード（直後スペースは保持）。 */
const INLINE_MARK_NODES = new Set(["EmphasisMark", "CodeMark"]);
/** 行頭記号ノード（直後の空白1つも一緒に隠す）。 */
const PREFIX_MARK_NODES = new Set(["HeaderMark", "QuoteMark"]);

function buildDecorations(view: EditorView): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const { state } = view;

  // カーソル/選択がかかっている行番号の集合（その行は生のmdを表示）
  const activeLines = new Set<number>();
  for (const range of state.selection.ranges) {
    const start = state.doc.lineAt(range.from).number;
    const end = state.doc.lineAt(range.to).number;
    for (let n = start; n <= end; n++) activeLines.add(n);
  }

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name;
        const line = state.doc.lineAt(node.from);
        const isActive = activeLines.has(line.number);

        const heading = /^(?:ATX|Setext)Heading([1-6])$/.exec(name);
        if (heading) {
          decos.push(
            Decoration.line({ class: `cm-md-h${heading[1]}` }).range(line.from),
          );
          return;
        }

        if (name === "Blockquote") {
          decos.push(Decoration.line({ class: "cm-md-quote" }).range(line.from));
        } else if (name === "StrongEmphasis") {
          decos.push(
            Decoration.mark({ class: "cm-md-strong" }).range(node.from, node.to),
          );
        } else if (name === "Emphasis") {
          decos.push(
            Decoration.mark({ class: "cm-md-em" }).range(node.from, node.to),
          );
        } else if (name === "InlineCode") {
          decos.push(
            Decoration.mark({ class: "cm-md-code" }).range(node.from, node.to),
          );
        }

        if (name === "ListMark") {
          const text = state.doc.sliceString(node.from, node.to);
          if (!isActive && /^[-*+]$/.test(text)) {
            decos.push(bullet.range(node.from, node.to));
          }
        } else if (!isActive && node.to > node.from) {
          if (PREFIX_MARK_NODES.has(name)) {
            // 行頭の `#` や `>` は直後の空白も含めて隠す
            let end = node.to;
            if (state.doc.sliceString(end, end + 1) === " ") end += 1;
            decos.push(hide.range(node.from, end));
          } else if (INLINE_MARK_NODES.has(name)) {
            decos.push(hide.range(node.from, node.to));
          }
        }
      },
    });
  }

  // sort=true で from 順に並べ替えてもらう（手動ソート不要・例外回避）
  return Decoration.set(decos, true);
}

export const liveMarkdown = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);

/** エディタ本体と整形スタイルのテーマ。白背景・ダークテキストで既存UIに合わせる。 */
export const liveMarkdownTheme = EditorView.theme({
  "&": {
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
    fontSize: "1rem",
  },
  "&.cm-focused": {
    outline: "2px solid #2563eb",
    outlineOffset: "1px",
    backgroundColor: "#ffffff",
  },
  ".cm-scroller": {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Sans", "Noto Sans JP", sans-serif',
    lineHeight: "1.7",
    padding: "0.5rem 0.25rem",
  },
  ".cm-content": {
    caretColor: "#0f172a",
    padding: "0.5rem 0.75rem",
  },
  ".cm-line": {
    padding: "0 2px",
  },
  // 見出し
  ".cm-md-h1": { fontSize: "1.7em", fontWeight: "700", lineHeight: "1.3" },
  ".cm-md-h2": { fontSize: "1.45em", fontWeight: "700", lineHeight: "1.3" },
  ".cm-md-h3": { fontSize: "1.25em", fontWeight: "700" },
  ".cm-md-h4": { fontSize: "1.1em", fontWeight: "700" },
  ".cm-md-h5": { fontSize: "1em", fontWeight: "700" },
  ".cm-md-h6": { fontSize: "1em", fontWeight: "700", color: "#64748b" },
  // インライン装飾
  ".cm-md-strong": { fontWeight: "700" },
  ".cm-md-em": { fontStyle: "italic" },
  ".cm-md-code": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    backgroundColor: "#e2e8f0",
    borderRadius: "4px",
    padding: "0.1em 0.3em",
    fontSize: "0.9em",
  },
  // 引用
  ".cm-md-quote": {
    borderLeft: "3px solid #cbd5e1",
    paddingLeft: "0.75rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  // 箇条書きの中黒
  ".cm-md-bullet": {
    color: "#2563eb",
    fontWeight: "700",
    paddingRight: "0.25rem",
  },
  ".cm-cursor": { borderLeftColor: "#0f172a" },
  "&.cm-editor .cm-selectionBackground, & .cm-selectionBackground": {
    backgroundColor: "#bfdbfe",
  },
});
