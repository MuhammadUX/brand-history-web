/**
 * Brand History — Concept A Design System (code library).
 * Monochrome "terminal/excavation" archive. Sharp 0px, 1px hairlines, mono
 * UPPERCASE labels, Space Grotesk display, ordered-Bayer dither plates, stepped
 * instrument-like motion. Import everything from "@/components/ds".
 */

// helpers
export { cn, variants } from "./cn";
export type { ClassValue } from "./cn";

// actions
export { Button, ButtonGroup } from "./Button";
export type {
  ButtonProps,
  ButtonType,
  ButtonSize,
  ButtonGroupProps,
} from "./Button";

// forms
export { Input, Field } from "./Field";
export type { InputProps, FieldProps, FieldState } from "./Field";
export { Checkbox } from "./Checkbox";
export type { CheckboxProps } from "./Checkbox";
export { Radio } from "./Radio";
export type { RadioProps } from "./Radio";
export { Toggle } from "./Toggle";
export type { ToggleProps } from "./Toggle";

// status / labels
export { Badge, Tag } from "./Badge";
export type { BadgeKind, BadgeProps } from "./Badge";

// brand marks
export { DitherPlate } from "./DitherPlate";
export type { DitherPlateProps, DitherSize } from "./DitherPlate";
export { BrandCard } from "./BrandCard";
export type { BrandCardProps } from "./BrandCard";

// data
export { Table, THead, TRow, TCell, ActionCell } from "./Table";
export type {
  TableProps,
  THeadProps,
  TRowProps,
  TCellProps,
  ActionCellProps,
} from "./Table";

// state blocks
export type { StateBlockState, StateBlockProps } from "./StateBlock";

// overlays / feedback
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";
export { Toast, useToast } from "./Toast";
export type { ToastProps, UseToastReturn } from "./Toast";
export { StateBlock } from "./StateBlock";

// chrome / layout
export { Header, TopBar } from "./Header";
export { OperatorSidebar } from "./OperatorSidebar";
export { Footer } from "./Footer";
export { PageFrame, Shell, SectionHeader, MetaStrip, CodeChip } from "./Shell";
export type {
  PageFrameProps,
  SectionHeaderProps,
  MetaStripProps,
  CodeChipProps,
} from "./Shell";
export { RouteTransition } from "./RouteTransition";

// AI flows
export { AIReviewBlock } from "./AIReviewBlock";
export type {
  AIReviewBlockProps,
  AIConfidence,
  AIReviewStatus,
} from "./AIReviewBlock";

// motion (hooks + utilities live in @/lib/motion)
export { TypeOn } from "./TypeOn";
export type { TypeOnProps } from "./TypeOn";
