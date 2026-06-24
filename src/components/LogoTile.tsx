interface LogoTileProps {
  initials: string;
  color: string;
  name: string;
  size?: "sm" | "lg";
}

function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
}

export default function LogoTile({
  initials,
  color,
  name,
  size = "sm",
}: LogoTileProps) {
  const textColor = isLightColor(color) ? "#16181D" : "#FFFFFF";
  const dimensions =
    size === "lg"
      ? "h-28 w-28 rounded-card text-4xl"
      : "h-14 w-14 rounded-btn text-lg";

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold tracking-tight ${dimensions}`}
      style={{ backgroundColor: color, color: textColor }}
      role="img"
      aria-label={`${name} logo placeholder`}
    >
      <span aria-hidden="true">{initials}</span>
    </div>
  );
}
