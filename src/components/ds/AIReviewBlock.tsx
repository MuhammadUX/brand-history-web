"use client";

import React, { type ReactNode } from "react";
import { cn } from "./cn";
import { Button, ButtonGroup } from "./Button";
import { Badge, type BadgeKind } from "./Badge";

export type AIConfidence = "H" | "M" | "L";
export type AIReviewStatus = "pending" | "accepted" | "rejected";

export interface AIReviewBlockProps {
  /** Provenance label, e.g. "WIKIPEDIA". */
  source: string;
  confidence: AIConfidence;
  title: string;
  body?: ReactNode;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  status?: AIReviewStatus;
  className?: string;
}

/**
 * AIReviewBlock — operator AI draft-review surface. Source chip + confidence
 * Badge on the top row, a Space-Grotesk title, mono body, a hairline rule, then
 * REJECT / EDIT / ACCEPT actions. On accept, stamps `[ ✓ ACCEPTED ]` and hides
 * the action group; on reject, strikes the title (`.mo-strike`), dims to
 * metadata, and shows `[ REJECTED ]`. Sharp 0px, hairline-bordered surface.
 */
export function AIReviewBlock({
  source,
  confidence,
  title,
  body,
  onAccept,
  onReject,
  onEdit,
  status = "pending",
  className,
}: AIReviewBlockProps) {
  const accepted = status === "accepted";
  const rejected = status === "rejected";
  const confidenceKind = `confidence-${confidence}` as BadgeKind;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-none border border-hairline bg-surface p-2",
        className,
      )}
    >
      {/* Top row: source chip + confidence + resolution tag */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-mono inline-flex items-center rounded-none border border-hairline px-1 py-0.5 text-ink">
          [ AI DRAFT · SRC: {source} ]
        </span>
        <Badge kind={confidenceKind} />

        {accepted && (
          <span
            role="status"
            className="mo-stamp label-mono ms-auto inline-flex items-center rounded-none bg-ink px-1 py-0.5 text-paper"
          >
            [ ✓ ACCEPTED ]
          </span>
        )}
        {rejected && (
          <span
            role="status"
            className="label-mono ms-auto inline-flex items-center rounded-none border border-hairline px-1 py-0.5 text-metadata"
          >
            [ REJECTED ]
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-display text-base font-medium leading-tight",
          rejected ? "text-metadata" : "text-ink",
        )}
      >
        {rejected ? <span className="mo-strike">{title}</span> : title}
      </h3>

      {/* Body */}
      {body != null && (
        <div
          className={cn(
            "font-mono text-[12px] leading-relaxed",
            rejected ? "text-metadata" : "text-ink-700",
          )}
        >
          {body}
        </div>
      )}

      {/* Actions — hidden once resolved. */}
      {status === "pending" && (
        <>
          <div className="border-t border-hairline" />
          <ButtonGroup align="end">
            <Button variant="danger" size="sm" onClick={onReject}>
              REJECT
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              EDIT
            </Button>
            <Button variant="primary" size="sm" onClick={onAccept}>
              ACCEPT
            </Button>
          </ButtonGroup>
        </>
      )}
    </div>
  );
}
