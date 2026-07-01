import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

/**
 * ツールバー／ショートカット用の編集コマンド群。
 * すべて EditorView を受け取り、選択範囲を Markdown 記法で包む・行頭に接頭辞を付ける。
 */

/** 選択を before/after で包む（未選択ならプレースホルダーを選択状態にする）。 */
function wrapSelection(view: EditorView, before: string, after = before): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const selected = state.sliceDoc(range.from, range.to);
    const insert = before + selected + after;
    const start = range.from + before.length;
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(start, start + selected.length),
    };
  });
  view.dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
  view.focus();
  return true;
}

/** 選択がかかっている各行の行頭に prefix を付ける（見出し・リスト・引用など）。 */
function prefixLines(view: EditorView, prefix: string): boolean {
  const { state } = view;
  const lineNumbers = new Set<number>();
  for (const range of state.selection.ranges) {
    const from = state.doc.lineAt(range.from).number;
    const to = state.doc.lineAt(range.to).number;
    for (let n = from; n <= to; n++) lineNumbers.add(n);
  }
  const changes = [...lineNumbers].map((n) => ({
    from: state.doc.line(n).from,
    insert: prefix,
  }));
  view.dispatch(state.update({ changes, userEvent: "input" }));
  view.focus();
  return true;
}

export const toggleBold = (view: EditorView) => wrapSelection(view, "**");
export const toggleItalic = (view: EditorView) => wrapSelection(view, "*");
export const toggleStrike = (view: EditorView) => wrapSelection(view, "~~");
export const toggleInlineCode = (view: EditorView) => wrapSelection(view, "`");
export const addHeading = (view: EditorView) => prefixLines(view, "# ");
export const addBullet = (view: EditorView) => prefixLines(view, "- ");
export const addQuote = (view: EditorView) => prefixLines(view, "> ");
export const addTask = (view: EditorView) => prefixLines(view, "- [ ] ");

/** 選択文字列をリンクにする（[text](url) にして url を選択状態にする）。 */
export function insertLink(view: EditorView): boolean {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to) || "text";
    const insert = `[${text}](url)`;
    const urlFrom = range.from + text.length + 3; // "[text](" の直後
    return {
      changes: { from: range.from, to: range.to, insert },
      range: EditorSelection.range(urlFrom, urlFrom + 3),
    };
  });
  view.dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
  view.focus();
  return true;
}
