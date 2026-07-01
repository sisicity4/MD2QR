/**
 * アプリのアクセント色テーマ。
 *
 * 「トーンは一定・色相だけ変える」方針。各プリセットは Tailwind 系の
 * 同じ明度ステップ（600 / 700 / 400）で組んであり、どれを選んでも
 * コントラストや彩度感（トーン）は揃う。CSS 変数を差し替えるだけで
 * ボタン・リング・リンク・見出しアクセントなどが一括で変わる。
 */
export interface Accent {
  id: string;
  name: string;
  base: string; // 600: ボタン・リング・リンク
  hover: string; // 700: ホバー
  bright: string; // 400: 暗い背景上のアクセント（ヘッダー "QR" など）
}

export const ACCENTS: Accent[] = [
  { id: "blue", name: "Blue", base: "#2563eb", hover: "#1d4ed8", bright: "#60a5fa" },
  { id: "violet", name: "Violet", base: "#7c3aed", hover: "#6d28d9", bright: "#a78bfa" },
  { id: "emerald", name: "Emerald", base: "#059669", hover: "#047857", bright: "#34d399" },
  { id: "rose", name: "Rose", base: "#e11d48", hover: "#be123c", bright: "#fb7185" },
  { id: "amber", name: "Amber", base: "#d97706", hover: "#b45309", bright: "#fbbf24" },
  { id: "cyan", name: "Cyan", base: "#0891b2", hover: "#0e7490", bright: "#22d3ee" },
];

export const DEFAULT_ACCENT_ID = "blue";

const KEY = "markqr:accent";

export function getAccent(id: string): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}

export function loadAccentId(): string {
  try {
    return localStorage.getItem(KEY) ?? DEFAULT_ACCENT_ID;
  } catch {
    return DEFAULT_ACCENT_ID;
  }
}

export function saveAccentId(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // localStorage 不可（プライベートモード等）は黙って無視
  }
}

/** 選択したアクセントを CSS 変数として :root に反映する。 */
export function applyAccent(accent: Accent): void {
  const root = document.documentElement.style;
  root.setProperty("--accent", accent.base);
  root.setProperty("--accent-hover", accent.hover);
  root.setProperty("--accent-bright", accent.bright);
}
