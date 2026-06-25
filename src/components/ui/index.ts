/**
 * The Library — UI primitive barrel.
 *
 * Import everything from "@/components/ui". Presentation only: these components
 * never import from @/components/ds or @/lib/motion, and read tokens from
 * tailwind.config.ts + globals.css.
 */
export { cn } from "./cn";
export type { ClassValue } from "./cn";

export { Button, default as ButtonDefault } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Chip, FilterChip } from "./Chip";
export type { ChipProps, FilterChipProps } from "./Chip";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeKind } from "./Badge";

export { Card } from "./Card";
export type { CardProps } from "./Card";

export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

export {
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
} from "./Field";
export type {
  FieldProps,
  InputProps,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  RadioProps,
} from "./Field";

export { Toggle } from "./Toggle";
export type { ToggleProps } from "./Toggle";

export { BrandMark, logoSrc } from "./BrandMark";
export type { BrandMarkProps, BrandMarkSize } from "./BrandMark";

export { BrandCard } from "./BrandCard";
export type { BrandCardProps } from "./BrandCard";

export { BrandGrid, BrandRail } from "./BrandGrid";
export type { BrandGridProps, BrandRailProps } from "./BrandGrid";

export { Hero } from "./Hero";
export type { HeroProps } from "./Hero";

export { AssetTile, FormatPill } from "./AssetTile";
export type { AssetTileProps, FormatPillProps } from "./AssetTile";

export { ColorChip } from "./ColorChip";
export type { ColorChipProps } from "./ColorChip";

export { Timeline, TimelineEvent } from "./Timeline";
export type { TimelineProps, TimelineEventProps } from "./Timeline";

export { FacetRail, FacetGroup } from "./FacetRail";
export type { FacetRailProps, FacetGroupProps } from "./FacetRail";

export { StateBlock, Skeleton } from "./StateBlock";
export type { StateBlockProps, SkeletonProps } from "./StateBlock";

export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { Toast, useToast } from "./Toast";
export type { ToastProps, UseToastReturn } from "./Toast";

export { Tabs } from "./Tabs";
export type { TabsProps } from "./Tabs";

export { Table, THead, TRow, TCell, ActionCell } from "./Table";
export type { TCellProps, ActionCellProps } from "./Table";

export { Sidebar, SidebarLink } from "./Sidebar";
export type { SidebarProps, SidebarLinkProps } from "./Sidebar";

export { AdSlot } from "./AdSlot";
export type { AdSlotProps } from "./AdSlot";

export { AIReviewBlock, ConfidencePill } from "./AIReviewBlock";
export type { AIReviewBlockProps, ConfidencePillProps } from "./AIReviewBlock";
