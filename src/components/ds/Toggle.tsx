import { cn } from "./cn";

export interface ToggleProps {
  /** Controlled on/off state. */
  checked: boolean;
  /** Fires with the next state when the switch is toggled. */
  onChange: (next: boolean) => void;
  /** Optional mono label rendered beside the switch. */
  label?: string;
  /** Disables interaction. */
  disabled?: boolean;
  /** Element id; also links the visible label when provided. */
  id?: string;
}

/**
 * Toggle — 1-bit sharp switch (44×24). Implemented as a role="switch" button.
 * The knob is a hard square that SNAPS between start and end positions (no
 * slide — flex justify flips the knob instantly and is RTL-safe).
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  id,
}: ToggleProps) {
  const switchEl = (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label ? undefined : "Toggle"}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-none border border-ink p-[2px]",
        "transition-none",
        // checked = ink track; knob pushed to the (logical) end
        checked ? "justify-end bg-ink" : "justify-start bg-paper",
        disabled
          ? "cursor-not-allowed border-hairline bg-surface"
          : "cursor-pointer",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block h-[16px] w-[16px] rounded-none",
          // knob inverts against its track for the 1-bit read
          checked ? "bg-paper" : "bg-ink",
          disabled && "bg-metadata",
        )}
      />
    </button>
  );

  if (!label) return switchEl;

  return (
    <span className="inline-flex items-center gap-2">
      {switchEl}
      <label
        htmlFor={id}
        className={cn(
          "font-mono text-[13px] leading-none",
          disabled ? "text-metadata" : "text-ink",
          !disabled && "cursor-pointer",
        )}
      >
        {label}
      </label>
    </span>
  );
}
