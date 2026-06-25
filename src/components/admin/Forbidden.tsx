import type { Locale } from "@/lib/types";
import { getDictionary } from "@/i18n";
import { StateBlock, Button } from "@/components/ui";

/**
 * Forbidden — permission-failure surface for operator routes. Kept as the
 * single source of truth for 403s; re-skinned onto the Library StateBlock
 * (honest "error" state) with a calm return-home action. Bilingual via dict.
 */
export default function Forbidden({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.admin;
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <p className="label mb-3 text-center text-link">403</p>
        <StateBlock
          state="error"
          title={t.forbiddenTitle}
          message={t.forbiddenBody}
          action={
            <Button href={`/${locale}`} variant="primary" size="md">
              {t.goHome}
            </Button>
          }
        />
      </div>
    </div>
  );
}
