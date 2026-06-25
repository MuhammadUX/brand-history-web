/**
 * cn — tiny dependency-free className joiner (clsx-lite).
 * Accepts strings, falsy values, arrays, and {class: boolean} maps.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) out.push(inner);
    } else if (typeof input === "object") {
      for (const key in input) {
        if (input[key]) out.push(key);
      }
    }
  }
  return out.join(" ");
}

/**
 * variants — minimal cva-style variant helper. Maps a config of variant
 * groups + defaults to a className. Keeps components dependency-free.
 */
type VariantConfig<V extends Record<string, Record<string, string>>> = {
  base?: ClassValue;
  variants: V;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
};

export function variants<V extends Record<string, Record<string, string>>>(
  config: VariantConfig<V>,
) {
  return (props?: { [K in keyof V]?: keyof V[K] } & { className?: ClassValue }) => {
    const classes: ClassValue[] = [config.base];
    for (const group in config.variants) {
      const chosen =
        (props?.[group] as string | undefined) ??
        (config.defaultVariants?.[group] as string | undefined);
      if (chosen != null && config.variants[group][chosen]) {
        classes.push(config.variants[group][chosen]);
      }
    }
    if (props?.className) classes.push(props.className);
    return cn(...classes);
  };
}
