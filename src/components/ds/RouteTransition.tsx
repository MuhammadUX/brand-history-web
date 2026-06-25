import React from "react";

/**
 * RouteTransition · silent-luxury cut.
 *
 * The per-navigation full-viewport scanline wipe has been removed — navigation
 * is now an instant cut (the spec's North Star: "zero motion beyond
 * instantaneous state change"). This is a transparent pass-through kept only so
 * the layout import stays stable; it mounts no overlay and runs no effect.
 */

export interface RouteTransitionProps {
  children: React.ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  return <>{children}</>;
}
