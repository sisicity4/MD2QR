import type { UsageInfo } from "../qr";

interface UsageRingProps {
  usage: UsageInfo;
}

const SIZE = 30;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Twitter風の円形（ドーナツ）使用率ゲージ。
 * 上限に近づくと色が 通常→黄→赤 と変化し、残りわずか（90%以上）になると
 * リング中央に残量を表示する。色だけに頼らず数値・aria-labelも併用する。
 */
export function UsageRing({ usage }: UsageRingProps) {
  const { ratio, level, remaining, bytes, max } = usage;
  const progress = Math.min(ratio, 1);
  const dashoffset = CIRCUMFERENCE * (1 - progress);
  const showRemaining = level === "danger" || level === "over";

  const label = `${bytes} of ${max} bytes used, ${remaining} remaining`;

  return (
    <span
      className={`usage-ring usage-${level}`}
      role="img"
      aria-label={label}
      title={label}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* 背景リング */}
        <circle
          className="usage-ring-track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
        />
        {/* 進捗リング（12時方向から時計回り） */}
        <circle
          className="usage-ring-progress"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      {showRemaining && (
        <span className="usage-ring-remaining">{remaining}</span>
      )}
    </span>
  );
}
