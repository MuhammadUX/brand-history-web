"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

/**
 * Submit button for the AI-builder start form. Uses useFormStatus so it
 * disables and shows a "Starting…" state while the startRun server action runs,
 * preventing a double-submit (which would create duplicate runs).
 */
export default function StartRunButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
