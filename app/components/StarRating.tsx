import { useState } from "react";

interface StarRatingProps {
  value: number | undefined;
  pendingValue?: number;
  onChange: (value: number) => void;
  size?: "sm" | "md";
  disabled?: boolean;
  label?: string;
}

export function StarRating({ value, pendingValue, onChange, size = "sm", disabled, label }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? pendingValue ?? value ?? 0;

  // Stars themselves are small, but each button keeps a >=40px tap area via padding.
  const buttonSize = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const iconSize = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div
      className="flex items-center -mx-1"
      role="radiogroup"
      aria-label={label ?? "Star rating"}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= displayValue;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            disabled={disabled}
            onMouseEnter={() => !disabled && setHoverValue(n)}
            onMouseLeave={() => setHoverValue(null)}
            onFocus={() => !disabled && setHoverValue(n)}
            onBlur={() => setHoverValue(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onChange(n);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`${buttonSize} flex items-center justify-center rounded-md
              transition-transform active:scale-90
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-amber-50"}
              ${iconSize}
              select-none`}
            style={{ touchAction: "manipulation" }}
          >
            <span
              className={`transition-colors leading-none ${filled ? "text-amber-400 drop-shadow-sm" : "text-gray-300"}`}
              aria-hidden="true"
            >
              {filled ? "★" : "☆"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
