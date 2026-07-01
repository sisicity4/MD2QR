import { ACCENTS } from "../theme";

interface AccentPickerProps {
  current: string;
  onSelect: (id: string) => void;
}

/** トーン一定のアクセント色プリセットを選ぶスウォッチ列。 */
export function AccentPicker({ current, onSelect }: AccentPickerProps) {
  return (
    <div className="accent-picker" role="radiogroup" aria-label="Accent color">
      {ACCENTS.map((accent) => (
        <button
          key={accent.id}
          type="button"
          role="radio"
          aria-checked={accent.id === current}
          aria-label={accent.name}
          title={accent.name}
          className={`accent-swatch${accent.id === current ? " selected" : ""}`}
          style={{ backgroundColor: accent.base }}
          onClick={() => onSelect(accent.id)}
        />
      ))}
    </div>
  );
}
