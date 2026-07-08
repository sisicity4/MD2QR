import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { QrPanel } from "./components/QrPanel";
import { AccentPicker } from "./components/AccentPicker";
import { QR_LEVEL, usageInfo, type ErrorCorrectionLevel } from "./qr";
import { applyAccent, getAccent, loadAccentId, saveAccentId } from "./theme";
import { loadDoc, saveDoc } from "./storage";
import "./App.css";

export default function App() {
  const [markdown, setMarkdown] = useState(loadDoc);
  const [level, setLevel] = useState<ErrorCorrectionLevel>(QR_LEVEL);
  const [accentId, setAccentId] = useState(loadAccentId);

  // 文字数・QR容量の使用状況は markdown と選択レベルから導出する派生値
  const charCount = useMemo(() => [...markdown].length, [markdown]);
  const usage = useMemo(() => usageInfo(markdown, level), [markdown, level]);

  // アクセント色を CSS 変数へ反映（描画前に適用してちらつきを防ぐ）＋永続化
  useLayoutEffect(() => {
    applyAccent(getAccent(accentId));
  }, [accentId]);
  useEffect(() => {
    saveAccentId(accentId);
  }, [accentId]);

  // 本文の自動保存（完全ローカル）
  useEffect(() => {
    saveDoc(markdown);
  }, [markdown]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Mark<span className="accent">QR</span>
        </h1>
        <p className="tagline">
          <span className="nowrap">Markdown in.</span>{" "}
          <span className="nowrap">QR out.</span>
        </p>
        <p className="demo-hint">
          A ready-to-scan demo is loaded. Edit the text to make it yours.
        </p>
        <AccentPicker current={accentId} onSelect={setAccentId} />
      </header>

      <main className="app-main">
        <MarkdownEditor
          value={markdown}
          onChange={setMarkdown}
          charCount={charCount}
          usage={usage}
        />
        <QrPanel
          text={markdown}
          usage={usage}
          level={level}
          onLevelChange={setLevel}
        />
      </main>

      <footer className="app-footer">
        <span>
          <span className="nowrap">100% local.</span>{" "}
          <span className="nowrap">Nothing leaves this tab.</span>
        </span>
      </footer>
    </div>
  );
}
