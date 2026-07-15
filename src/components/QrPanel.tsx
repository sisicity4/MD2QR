import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  fitsInQr,
  QR_LEVELS,
  type ErrorCorrectionLevel,
  type UsageInfo,
} from "../qr";

interface QrPanelProps {
  text: string;
  usage: UsageInfo;
  level: ErrorCorrectionLevel;
  onLevelChange: (level: ErrorCorrectionLevel) => void;
}

export function QrPanel({ text, usage, level, onLevelChange }: QrPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  const isEmpty = text.trim().length === 0;
  const fits = fitsInQr(text, level);

  const handleSavePng = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "markqr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPng = async () => {
    const canvas = containerRef.current?.querySelector("canvas");

    try {
      if (!canvas || !navigator.clipboard?.write || !window.ClipboardItem) {
        throw new Error("PNG clipboard copy is unavailable");
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Could not create PNG"));
        }, "image/png");
      });

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }

    window.setTimeout(() => setCopyStatus("idle"), 1400);
  };

  return (
    <section className="pane qr-pane">
      <div className="pane-header">
        <h2>QR Code</h2>
        <div className="pane-actions">
          <label className="quality-field">
            <span className="quality-label">Quality</span>
            <select
              className="quality-select"
              value={level}
              onChange={(event) =>
                onLevelChange(event.target.value as ErrorCorrectionLevel)
              }
              aria-label="QR quality (error correction level)"
            >
              {QR_LEVELS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value} · {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="ghost-button"
            onClick={handleCopyPng}
            disabled={isEmpty || !fits}
          >
            {copyStatus === "copied"
              ? "Copied!"
              : copyStatus === "failed"
                ? "Copy failed"
                : "Copy"}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleSavePng}
            disabled={isEmpty || !fits}
          >
            Save PNG
          </button>
        </div>
      </div>

      <div className="qr-body">
        <div className="qr-canvas-wrap" ref={containerRef}>
          {isEmpty ? (
            <p className="placeholder">Nothing to scan — yet.</p>
          ) : fits ? (
            <QRCodeCanvas
              value={text}
              size={240}
              level={level}
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          ) : (
            <p className="qr-error">
              Won't fit.
              <br />
              Cut{" "}
              <span className="nowrap">
                {Math.abs(usage.remaining).toLocaleString()} bytes
              </span>
              .
            </p>
          )}
        </div>

        <div className="qr-status">
          {!isEmpty && usage.level === "danger" && (
            <p className="warning">
              <span className="nowrap">
                {usage.remaining.toLocaleString()} bytes left.
              </span>{" "}
              Cram in more and scanners start choking.
            </p>
          )}
          {!isEmpty && usage.level === "warn" && (
            <p className="notice">
              Closing in on the limit ·{" "}
              <span className="nowrap">
                {usage.remaining.toLocaleString()} bytes left.
              </span>
            </p>
          )}
          {!isEmpty && (
            <p className="qr-meta">
              <span className="nowrap">
                {usage.bytes.toLocaleString()} / {usage.max.toLocaleString()} bytes
              </span>{" "}
              · <span className="nowrap">quality {level}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
