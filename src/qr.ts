/**
 * QRコードの容量計算ユーティリティ。
 *
 * QRコードはバージョン40・誤り訂正レベルごとに格納できるバイト数が決まっている。
 * Markdown本文（UTF-8）のバイト数がこの上限を超えるとQRライブラリが例外を投げて
 * 画面がクラッシュするため、事前にチェックして安全に「生成不可」を表示する。
 */
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/** バージョン40・各誤り訂正レベルで格納できる最大バイト数（バイナリ/Byteモード）。 */
export const QR_BYTE_CAPACITY: Record<ErrorCorrectionLevel, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

/** 既定の誤り訂正レベル（容量と頑丈さのバランス重視）。 */
export const QR_LEVEL: ErrorCorrectionLevel = "M";

/** Quality（誤り訂正レベル）の選択肢。容量が多い順 = 頑丈さが低い順。 */
export const QR_LEVELS: {
  value: ErrorCorrectionLevel;
  label: string;
  recovery: string;
}[] = [
  { value: "L", label: "Max capacity", recovery: "~7%" },
  { value: "M", label: "Balanced", recovery: "~15%" },
  { value: "Q", label: "Sturdy", recovery: "~25%" },
  { value: "H", label: "Toughest", recovery: "~30%" },
];

/** UTF-8 でのバイト長を返す（日本語は1文字3バイト程度になる）。 */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** 指定の誤り訂正レベルでQRコードに格納できるかどうか。 */
export function fitsInQr(text: string, level: ErrorCorrectionLevel): boolean {
  return byteLength(text) <= QR_BYTE_CAPACITY[level];
}

/** 上限への近さを表す段階。Twitter風のゲージ色分けに使う。 */
export type UsageLevel = "normal" | "warn" | "danger" | "over";

/** 各段階の下限（使用率）。0.75=黄, 0.90=赤, 1.0超=超過。 */
const WARN_RATIO = 0.75;
const DANGER_RATIO = 0.9;

export interface UsageInfo {
  /** 現在のUTF-8バイト数。 */
  bytes: number;
  /** 上限バイト数。 */
  max: number;
  /** 使用率（0以上、超過時は1を超える）。 */
  ratio: number;
  /** 残りバイト数（超過時は負）。 */
  remaining: number;
  /** 段階。 */
  level: UsageLevel;
}

/** 本文のQR容量使用状況を計算する。 */
export function usageInfo(text: string, level: ErrorCorrectionLevel): UsageInfo {
  const bytes = byteLength(text);
  const max = QR_BYTE_CAPACITY[level];
  const ratio = bytes / max;
  const remaining = max - bytes;

  let usageLevel: UsageLevel;
  if (bytes > max) usageLevel = "over";
  else if (ratio >= DANGER_RATIO) usageLevel = "danger";
  else if (ratio >= WARN_RATIO) usageLevel = "warn";
  else usageLevel = "normal";

  return { bytes, max, ratio, remaining, level: usageLevel };
}
