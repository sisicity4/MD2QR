/**
 * 本文の一時保存。リロードや戻る/進むでは残るが、タブを閉じると消える
 * （sessionStorage）。誤操作対策になりつつ、ブラウザに下書きの痕跡を残さない。
 * 完全ローカル・サーバー送信なし。
 *
 * ※ 色テーマなどの「設定」は覚えていてほしいので localStorage 側（src/theme.ts）に置く。
 */
const DOC_KEY = "markqr:doc";

export function loadDoc(): string {
  try {
    return sessionStorage.getItem(DOC_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveDoc(text: string): void {
  try {
    sessionStorage.setItem(DOC_KEY, text);
  } catch {
    // 保存不可時は黙って無視（機能は継続）
  }
}
