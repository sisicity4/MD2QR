import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// GitHub Pages はプロジェクトリポジトリなので /MD2QR/ サブパス配信になる。
// 本番ビルド時だけ base を付け、ローカル dev / プレビューは "/" のまま維持する。
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/MD2QR/" : "/",
}));
