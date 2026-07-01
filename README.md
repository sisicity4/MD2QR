# MarkQR

> **Markdown in. QR out.**

Markdownを、**読める文章**と**読み取れるQRコード**に同時変換するローカルエディタ。

短いメモ・イベント案内・プロフィール・URL付き文章などを、リアルタイムでプレビューしながらQRコード化できます。サーバー不要・完全ローカルで動作します。

## 機能（MVP）

1. 左ペインでMarkdownを入力
2. 右ペインで `react-markdown` によるライブプレビュー
3. 入力内容をQRコードとしてリアルタイム表示
4. QRコードをPNGで保存
5. 文字数が多い場合の警告 / 容量超過時はQR生成を抑止してクラッシュを防止

## 技術構成

- React 19 + TypeScript + Vite
- Markdownプレビュー: `react-markdown`（raw HTMLは無効＝安全）
- QRコード生成: `qrcode.react`（`QRCodeCanvas`）
- 状態管理: `useState`（管理する状態は `markdown` 1つ、文字数等は派生値）

## 開発

```bash
npm install      # 依存関係のインストール
npm run dev      # 開発サーバー起動（http://localhost:5173）
npm run build    # 型チェック + 本番ビルド
npm run preview  # ビルド結果のプレビュー
```

## 構成

| ファイル | 役割 |
| --- | --- |
| `src/App.tsx` | 全体レイアウトと状態管理 |
| `src/components/MarkdownEditor.tsx` | Markdown入力欄 |
| `src/components/MarkdownPreview.tsx` | プレビュー表示 |
| `src/components/QrPanel.tsx` | QR表示・警告・PNG保存 |
| `src/qr.ts` | QR容量計算ユーティリティ |

## 設計メモ

QRコードにはMarkdown本文をそのまま格納するため長文には向きません。本文のUTF-8バイト数が
QRコード（バージョン40・誤り訂正レベルM＝2,331バイト）の上限を超える場合は、生成を抑止して
警告を表示します。長文対応が必要になれば、本文をURL化して共有する方式（Supabase等）への
拡張を検討します。
