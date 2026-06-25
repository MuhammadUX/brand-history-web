import type { Locale } from "@/lib/types";
import type { Operator } from "@/lib/admin";

type Section = "dashboard" | "brands" | "ai-builder" | "requests" | "audit";

/**
 * AdminShell — content pass-through.
 *
 * The operator chrome (Library Sidebar rail + identity card + main frame)
 * now lives in `app/[locale]/admin/layout.tsx`, which wraps every admin route.
 * This component therefore only renders the page body. Its props are retained
 * so the existing admin pages compile unchanged; `locale`/`operator`/`active`
 * are now handled by the layout (active state is derived from the pathname).
 */
export default function AdminShell({
  children,
}: {
  locale: Locale;
  operator: Operator;
  active: Section;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
